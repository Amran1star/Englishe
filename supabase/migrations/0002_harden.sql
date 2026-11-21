-- يُنفَّذ بعد 0001. (طُبّق بالفعل على مشروعك عبر الموصل)
alter function public.set_updated_at() set search_path = '';

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy "read public settings" on public.site_settings;
create policy "anon read public settings" on public.site_settings for select to anon
  using (is_public);
create policy "auth read settings" on public.site_settings for select to authenticated
  using (is_public or public.is_admin());
