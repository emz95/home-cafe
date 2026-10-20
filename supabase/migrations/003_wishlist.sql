-- Wishlist: things to buy or try. Only admins can see or change it.

create table public.wishlist (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        text not null check (kind in ('ingredient','material','drink')),
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.wishlist enable row level security;

create policy "admin only" on public.wishlist for all using (public.is_admin()) with check (public.is_admin());
