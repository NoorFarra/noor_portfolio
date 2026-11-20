revoke all on public.projects from anon, authenticated;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

drop policy if exists "Anyone can read published portfolio projects" on public.projects;
drop policy if exists "Portfolio administrators can read every project" on public.projects;
create policy "Visitors can read published projects" on public.projects
for select to anon using (is_published = true);
create policy "Members can read published projects or their admin workspace" on public.projects
for select to authenticated using (
  is_published = true or exists(
    select 1 from public.portfolio_admins where user_id = (select auth.uid())
  )
);

drop policy if exists "Visitors can read project images" on storage.objects;
create policy "Portfolio administrators can list images" on storage.objects
for select to authenticated using (
  bucket_id = 'project-images' and exists(
    select 1 from public.portfolio_admins where user_id = (select auth.uid())
  )
);

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
