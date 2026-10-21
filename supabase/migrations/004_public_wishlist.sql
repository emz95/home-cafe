-- Public wishlist: anyone can read it, only admins can change it.

drop policy "admin only" on public.wishlist;

create policy "public read" on public.wishlist for select using (true);
create policy "admin write" on public.wishlist for all using (public.is_admin()) with check (public.is_admin());
