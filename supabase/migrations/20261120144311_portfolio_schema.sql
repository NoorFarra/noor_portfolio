-- Portfolio schema for the new, dedicated Supabase project.
create table public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;
grant select on public.portfolio_admins to authenticated;
create policy "Administrators can read their own membership"
on public.portfolio_admins for select to authenticated
using (user_id = (select auth.uid()));

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text not null,
  live_url text not null,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
revoke all on public.projects from anon, authenticated;
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
create index projects_created_by_idx on public.projects(created_by);
create index projects_public_order_idx
on public.projects (is_featured desc, display_order, created_at desc)
where is_published = true;

create policy "Anyone can read published portfolio projects"
on public.projects for select to anon, authenticated
using (is_published = true);

create policy "Portfolio administrators can read every project"
on public.projects for select to authenticated
using (exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())));
create policy "Portfolio administrators can create projects"
on public.projects for insert to authenticated
with check (exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())));
create policy "Portfolio administrators can update projects"
on public.projects for update to authenticated
using (exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())))
with check (exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())));
create policy "Portfolio administrators can delete projects"
on public.projects for delete to authenticated
using (exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())));

create function public.set_projects_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger set_projects_updated_at before update on public.projects
for each row execute function public.set_projects_updated_at();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('project-images','project-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']);
create policy "Visitors can read project images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'project-images');
create policy "Portfolio administrators can upload images"
on storage.objects for insert to authenticated
with check (bucket_id = 'project-images' and exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())));
create policy "Portfolio administrators can replace images"
on storage.objects for update to authenticated
using (bucket_id = 'project-images' and exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())))
with check (bucket_id = 'project-images' and exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())));
create policy "Portfolio administrators can delete images"
on storage.objects for delete to authenticated
using (bucket_id = 'project-images' and exists(select 1 from public.portfolio_admins where user_id = (select auth.uid())));
