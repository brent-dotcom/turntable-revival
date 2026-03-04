-- ── Round-robin DJ rotation ───────────────────────────────────────────────────
-- Adds last_played_at to dj_queue so rotation order (NULLS FIRST → oldest
-- play time first) gives true round-robin when multiple DJs are in the room.

alter table public.dj_queue
  add column if not exists last_played_at timestamptz;

-- ── rotate_dj_queue ──────────────────────────────────────────────────────────
-- Called by the skip API route when 2+ DJs are present.
-- Unlike advance_dj_queue (which deletes the current DJ), this function:
--   1. Updates the current DJ's songs to p_remaining_songs and stamps last_played_at.
--   2. Finds the next DJ ordered by last_played_at ASC NULLS FIRST, then spot ASC.
--   3. Promotes that DJ (clears video state so their client auto-plays).
-- If no other DJ is found (edge case: they all left between the count check and
-- the RPC call), the current DJ stays on stage with video cleared so their own
-- auto-play picks up their remaining songs.

create or replace function public.rotate_dj_queue(
  p_room_id         uuid,
  p_remaining_songs jsonb   -- songs left for the current DJ (current track removed)
)
returns void as $$
declare
  v_current_dj_id uuid;
  v_next          record;
begin
  select current_dj_id
  into   v_current_dj_id
  from   public.rooms
  where  id = p_room_id;

  if v_current_dj_id is null then return; end if;

  -- Preserve remaining songs and mark when this DJ last played
  update public.dj_queue
  set    songs          = p_remaining_songs,
         last_played_at = now()
  where  room_id = p_room_id
  and    user_id = v_current_dj_id;

  -- Next DJ: exclude current, oldest last_played_at wins (NULLs = never played → first)
  select user_id, spot
  into   v_next
  from   public.dj_queue
  where  room_id = p_room_id
  and    user_id != v_current_dj_id
  order  by last_played_at asc nulls first, spot asc
  limit  1;

  if v_next.user_id is not null then
    -- Promote next DJ, clear video so their client auto-plays
    update public.rooms
    set    current_dj_id           = v_next.user_id,
           active_dj_spot          = v_next.spot,
           current_video_id        = null,
           current_video_title     = null,
           current_video_thumbnail = null,
           current_track_source    = 'youtube',
           current_track_url       = null,
           video_started_at        = null
    where  id = p_room_id;
  else
    -- No other DJ found (they left between count check and RPC) — keep current DJ
    -- on stage with video cleared so their auto-play resumes their remaining songs.
    update public.rooms
    set    current_video_id        = null,
           current_video_title     = null,
           current_video_thumbnail = null,
           current_track_source    = 'youtube',
           current_track_url       = null,
           video_started_at        = null
    where  id = p_room_id;
  end if;
end;
$$ language plpgsql security definer;
