alter table public.projects add column github_url text;
alter table public.projects add constraint projects_github_url_valid check (
  github_url is null or (
    char_length(github_url) <= 2048 and
    github_url ~ '^https://(www[.])?github[.]com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(/[^[:space:]]*)?([?#][^[:space:]]*)?$'
  )
);

update public.projects set github_url='https://github.com/NoorFarra/bakhtesar'
where live_url='https://www.bikhtisar.site/' and github_url is null;
update public.projects set github_url='https://github.com/NoorFarra/Wajehti'
where live_url='https://wajehtii.vercel.app/' and github_url is null;

create table public.portfolio_settings (
  id text primary key default 'profile' check (id='profile'),
  profile_image_url text check (
    profile_image_url is null or (
      char_length(profile_image_url) <= 2048 and
      profile_image_url ~ '^https://[^[:space:]]+$'
    )
  ),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_settings enable row level security;
revoke all on public.portfolio_settings from anon, authenticated;
grant select on public.portfolio_settings to anon, authenticated;
grant insert, update on public.portfolio_settings to authenticated;

create policy "Public can read the portfolio profile"
on public.portfolio_settings for select to anon, authenticated using (id='profile');
create policy "Portfolio administrators can create profile settings"
on public.portfolio_settings for insert to authenticated with check (
  exists(select 1 from public.portfolio_admins where user_id=(select auth.uid()))
);
create policy "Portfolio administrators can update profile settings"
on public.portfolio_settings for update to authenticated using (
  exists(select 1 from public.portfolio_admins where user_id=(select auth.uid()))
) with check (
  exists(select 1 from public.portfolio_admins where user_id=(select auth.uid()))
);
create trigger set_portfolio_settings_updated_at
before update on public.portfolio_settings
for each row execute function public.set_projects_updated_at();
insert into public.portfolio_settings(id) values('profile');
