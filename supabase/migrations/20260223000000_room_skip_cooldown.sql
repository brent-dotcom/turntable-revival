alter table public.rooms
  add column if not exists last_skipped_at timestamptz;
