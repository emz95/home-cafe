-- Add-ons: run once in Supabase → SQL Editor if you already ran schema.sql.

-- Ingredients can be offered as add-ons (shown in their own menu section).
alter table public.ingredients add column addon boolean not null default false;

-- New "foam" type so cold foams get their own add-on group.
alter table public.ingredients drop constraint ingredients_type_check;
alter table public.ingredients add constraint ingredients_type_check
  check (type in ('espresso','milk','syrup','foam','tea','topping','other'));

-- Add-ons replace per-drink optional ingredients.
alter table public.drink_ingredients drop column optional;
