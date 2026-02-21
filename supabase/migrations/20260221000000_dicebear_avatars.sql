-- Add DiceBear avatar columns to profiles
alter table public.profiles
  add column if not exists avatar_seed      text,
  add column if not exists avatar_bg_color  text not null default 'b6e3f4',
  add column if not exists avatar_hair      text not null default 'short01';

-- Drop the old accessory check constraint so DiceBear values (sunglasses etc.) are allowed
alter table public.profiles
  drop constraint if exists profiles_avatar_accessory_check;
