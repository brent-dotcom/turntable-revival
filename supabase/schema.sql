-- ============================================================
-- Turntable Revival — Supabase Schema
-- ============================================================
-- Run this in the Supabase SQL Editor to set up the database.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique not null,
  display_name text,
  -- Avatar config
  avatar_type       text not null default 'human'
    check (avatar_type in ('human', 'robot', 'cat', 'alien')),
  avatar_color      text not null default '#7c3aed',
  avatar_accessory  text not null default 'headphones'
    check (avatar_accessory in ('none', 'headphones', 'hat', 'glasses')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated-at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROOMS
-- ============================================================
create table if not exists public.rooms (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  slug             text unique not null,
  description      text,
  created_by       uuid references public.profiles(id) on delete set null,
  -- Current playback state
  current_dj_id        uuid references public.profiles(id) on delete set null,
  current_video_id     text,
  current_video_title  text,
  current_video_thumbnail text,
  video_started_at     timestamptz,
  -- Settings
  lame_threshold   integer not null default 50, -- percent of listeners to skip
  is_active        boolean not null default true,
  listener_count   integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "Rooms are viewable by everyone"
  on public.rooms for select using (true);

create policy "Authenticated users can create rooms"
  on public.rooms for insert with check (auth.uid() is not null);

create policy "Room creators can update their rooms"
  on public.rooms for update using (auth.uid() = created_by);

create trigger rooms_updated_at
  before update on public.rooms
  for each row execute procedure public.set_updated_at();

-- Index for slug lookups
create index if not exists rooms_slug_idx on public.rooms(slug);
create index if not exists rooms_active_idx on public.rooms(is_active, created_at desc);

-- ============================================================
-- ROOM MEMBERS (Presence)
-- ============================================================
create table if not exists public.room_members (
  id           uuid primary key default uuid_generate_v4(),
  room_id      uuid not null references public.rooms(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(room_id, user_id)
);

alter table public.room_members enable row level security;

create policy "Room members are viewable by everyone"
  on public.room_members for select using (true);

create policy "Users can join rooms"
  on public.room_members for insert with check (auth.uid() = user_id);

create policy "Users can update their own membership"
  on public.room_members for update using (auth.uid() = user_id);

create policy "Users can leave rooms"
  on public.room_members for delete using (auth.uid() = user_id);

create index if not exists room_members_room_idx on public.room_members(room_id, last_seen_at desc);

-- ============================================================
-- DJ QUEUE
-- ============================================================
create table if not exists public.dj_queue (
  id        uuid primary key default uuid_generate_v4(),
  room_id   uuid not null references public.rooms(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  position  integer not null,
  created_at timestamptz not null default now(),
  unique(room_id, user_id),
  unique(room_id, position)
);

alter table public.dj_queue enable row level security;

create policy "Queue is viewable by everyone"
  on public.dj_queue for select using (true);

create policy "Users can join queue"
  on public.dj_queue for insert with check (auth.uid() = user_id);

create policy "Users can leave queue"
  on public.dj_queue for delete using (auth.uid() = user_id);

create index if not exists dj_queue_room_idx on public.dj_queue(room_id, position asc);

-- ============================================================
-- VOTES
-- ============================================================
create table if not exists public.votes (
  id         uuid primary key default uuid_generate_v4(),
  room_id    uuid not null references public.rooms(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  video_id   text not null,
  vote_type  text not null check (vote_type in ('awesome', 'lame')),
  created_at timestamptz not null default now(),
  -- One vote per user per video per room
  unique(room_id, user_id, video_id)
);

alter table public.votes enable row level security;

create policy "Votes are viewable by everyone"
  on public.votes for select using (true);

create policy "Authenticated users can vote"
  on public.votes for insert with check (auth.uid() = user_id);

create policy "Users can change their vote"
  on public.votes for update using (auth.uid() = user_id);

create policy "Users can delete their vote"
  on public.votes for delete using (auth.uid() = user_id);

create index if not exists votes_room_video_idx on public.votes(room_id, video_id);

-- ============================================================
-- REALTIME
-- Enable realtime for all tables
-- ============================================================
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.dj_queue;
alter publication supabase_realtime add table public.votes;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get next DJ in queue and promote them
create or replace function public.advance_dj_queue(p_room_id uuid)
returns void as $$
declare
  v_next_user_id uuid;
  v_next_position integer;
begin
  -- Get the next person in queue (lowest position)
  select user_id, position
  into v_next_user_id, v_next_position
  from public.dj_queue
  where room_id = p_room_id
  order by position asc
  limit 1;

  if v_next_user_id is not null then
    -- Remove them from queue
    delete from public.dj_queue
    where room_id = p_room_id and user_id = v_next_user_id;

    -- Set them as current DJ (video cleared — they'll pick a song)
    update public.rooms
    set current_dj_id = v_next_user_id,
        current_video_id = null,
        current_video_title = null,
        current_video_thumbnail = null,
        video_started_at = null
    where id = p_room_id;
  else
    -- No one in queue — clear current DJ
    update public.rooms
    set current_dj_id = null,
        current_video_id = null,
        current_video_title = null,
        current_video_thumbnail = null,
        video_started_at = null
    where id = p_room_id;
  end if;
end;
$$ language plpgsql security definer;

-- Reorder queue positions after someone leaves
create or replace function public.reorder_queue(p_room_id uuid)
returns void as $$
begin
  with numbered as (
    select id, row_number() over (order by position asc) as new_pos
    from public.dj_queue
    where room_id = p_room_id
  )
  update public.dj_queue q
  set position = n.new_pos
  from numbered n
  where q.id = n.id;
end;
$$ language plpgsql security definer;
