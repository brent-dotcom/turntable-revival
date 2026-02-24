-- Fix invalid avatar_accessory values: old values (headphones, glasses, sunglasses, hat)
-- were invalid for DiceBear v7 pixel-art API. Reset them to 'none'.
update public.profiles
  set avatar_accessory = 'none'
  where avatar_accessory not in ('none', 'variant01', 'variant02', 'variant03', 'variant04');
