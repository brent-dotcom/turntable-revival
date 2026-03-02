-- ============================================================
-- Schema catch-up: adds all columns, tables, policies, and
-- functions that were added ad-hoc since the initial schema.sql.
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS, etc.)
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists display_name    text,
  add column if not exists is_admin        boolean not null default false,
  add column if not exists dj_points       integer not null default 0,
  add column if not exists avatar_seed     text,
  add column if not exists avatar_bg_color text not null default 'b6e3f4',
  add column if not exists avatar_hair     text not null default 'short01';

-- Drop old check constraint so any avatar_accessory value is accepted
alter table public.profiles
  drop constraint if exists profiles_avatar_accessory_check;

-- ── rooms ─────────────────────────────────────────────────────────────────────
alter table public.rooms
  add column if not exists owner_id             uuid references public.profiles(id) on delete set null,
  add column if not exists active_dj_spot       integer,
  add column if not exists genre                text,
  add column if not exists current_track_source text,
  add column if not exists current_track_url    text,
  add column if not exists last_skipped_at      timestamptz;

-- Back-fill owner_id from created_by for existing rooms
update public.rooms
set owner_id = created_by
where owner_id is null and created_by is not null;

-- Replace the too-restrictive "only created_by can update" policy.
-- Non-creator DJs need to play songs, join as active DJ, etc.
drop policy if exists "Room creators can update their rooms" on public.rooms;
drop policy if exists "Authenticated users can update rooms"  on public.rooms;
create policy "Authenticated users can update rooms"
  on public.rooms for update using (auth.uid() is not null);

-- ── dj_queue ──────────────────────────────────────────────────────────────────
alter table public.dj_queue
  add column if not exists spot  integer,
  add column if not exists songs jsonb not null default '[]'::jsonb;

-- Back-fill spot from position for any existing rows
update public.dj_queue set spot = position where spot is null;

-- DJs must be able to update their own queue entry (saves their songs array)
drop policy if exists "DJs can update their queue entry" on public.dj_queue;
create policy "DJs can update their queue entry"
  on public.dj_queue for update using (auth.uid() = user_id);

-- ── votes ─────────────────────────────────────────────────────────────────────
alter table public.votes
  add column if not exists dj_id uuid references public.profiles(id) on delete set null;

-- ── song_history ──────────────────────────────────────────────────────────────
create table if not exists public.song_history (
  id                uuid        primary key default uuid_generate_v4(),
  room_id           uuid        not null references public.rooms(id) on delete cascade,
  played_by_user_id uuid        references public.profiles(id) on delete set null,
  track_url         text,
  track_title       text,
  track_source      text,
  played_at         timestamptz not null default now()
);

alter table public.song_history enable row level security;

drop policy if exists "Song history is viewable by everyone"         on public.song_history;
drop policy if exists "Authenticated users can insert song history"  on public.song_history;

create policy "Song history is viewable by everyone"
  on public.song_history for select using (true);

create policy "Authenticated users can insert song history"
  on public.song_history for insert with check (auth.uid() is not null);

create index if not exists song_history_room_idx
  on public.song_history(room_id, played_at desc);

-- Add song_history to realtime publication (ignore error if already there)
do $$
begin
  alter publication supabase_realtime add table public.song_history;
exception when others then null;
end $$;

-- ── advance_dj_queue: spot-based rotation ─────────────────────────────────────
-- New behaviour (replaces the old position-based delete-and-promote):
--   1. Remove the current DJ from the queue (their set is over).
--   2. Find the next DJ by lowest spot number among the remaining entries.
--   3. Promote them as current_dj_id / active_dj_spot WITHOUT deleting them,
--      so their songs array stays accessible for client-side auto-play.
create or replace function public.advance_dj_queue(p_room_id uuid)
returns void as $$
declare
  v_current_dj_id uuid;
  v_next          record;
begin
  -- Who is on stage right now?
  select current_dj_id
  into   v_current_dj_id
  from   public.rooms
  where  id = p_room_id;

  -- Remove current DJ from their spot (set is done, frees the slot)
  if v_current_dj_id is not null then
    delete from public.dj_queue
    where  room_id = p_room_id
    and    user_id = v_current_dj_id;
  end if;

  -- Next DJ = lowest remaining spot
  select user_id, spot
  into   v_next
  from   public.dj_queue
  where  room_id = p_room_id
  order  by spot asc
  limit  1;

  if v_next.user_id is not null then
    -- Promote next DJ — keep them in queue so songs[] is readable on the client
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
    -- No one waiting — clear the stage
    update public.rooms
    set    current_dj_id           = null,
           active_dj_spot          = null,
           current_video_id        = null,
           current_video_title     = null,
           current_video_thumbnail = null,
           current_track_source    = 'youtube',
           current_track_url       = null,
           video_started_at        = null
    where  id = p_room_id;
  end if;
end;
$$ language plpgsql security definer;
