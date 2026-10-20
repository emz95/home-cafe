-- Home Cafe schema

-- ---------- Tables ----------

create table public.ingredients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  display_name text,
  type        text not null default 'other'
              check (type in ('espresso','milk','syrup','foam','tea','topping','other')),
  in_stock    boolean not null default true,
  homemade    boolean not null default false,
  addon       boolean not null default false,
  note        text,
  created_at  timestamptz not null default now()
);

create table public.drinks (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null default 'Coffee',
  description  text,
  hidden       boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- Which ingredients go in which drink.
create table public.drink_ingredients (
  drink_id       uuid not null references public.drinks(id) on delete cascade,
  ingredient_id  uuid not null references public.ingredients(id) on delete cascade,
  primary key (drink_id, ingredient_id)
);

-- Emails allowed to edit the menu. 
create table public.admins (
  email text primary key
);

-- ---------- Helper ----------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- ---------- Row Level Security ----------

alter table public.ingredients       enable row level security;
alter table public.drinks            enable row level security;
alter table public.drink_ingredients enable row level security;
alter table public.admins            enable row level security;  -- no policies: not readable via the API

create policy "public read"  on public.ingredients       for select using (true);
create policy "admin write"  on public.ingredients       for all    using (public.is_admin()) with check (public.is_admin());

create policy "public read"  on public.drinks            for select using (true);
create policy "admin write"  on public.drinks            for all    using (public.is_admin()) with check (public.is_admin());

create policy "public read"  on public.drink_ingredients for select using (true);
create policy "admin write"  on public.drink_ingredients for all    using (public.is_admin()) with check (public.is_admin());

insert into public.admins (email) values ('emma91zhang@gmail.com');
