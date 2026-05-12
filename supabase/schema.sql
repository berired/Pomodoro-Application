create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  username text not null unique,
  password text not null,
  school text,
  canvas_token text,
  canvas_domain text,
  created_at timestamptz not null default now()
);

create table public.login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  login_at timestamptz not null default now()
);

create index login_activity_user_id_login_at_idx
  on public.login_activity (user_id, login_at desc);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  start_time time not null,
  end_time time not null,
  days text[] not null default '{}'::text[],
  room text not null,
  professor text,
  created_at timestamptz not null default now(),
  constraint classes_days_not_empty check (cardinality(days) > 0),
  constraint classes_days_valid check (
    days <@ array['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']::text[]
  ),
  constraint classes_time_order check (end_time > start_time)
);

create index classes_user_id_idx
  on public.classes (user_id);

create index classes_user_id_created_at_idx
  on public.classes (user_id, created_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  all_day boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint tasks_time_order check (
    start_time is null or end_time is null or end_time > start_time
  )
);

create index tasks_user_id_date_idx
  on public.tasks (user_id, date);

create index tasks_user_id_created_at_idx
  on public.tasks (user_id, created_at desc);

create table public.spotify_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null
);

create index spotify_tokens_user_id_idx
  on public.spotify_tokens (user_id);

alter table public.users enable row level security;
alter table public.login_activity enable row level security;
alter table public.classes enable row level security;
alter table public.tasks enable row level security;
alter table public.spotify_tokens enable row level security;

drop policy if exists "users_select_own_row" on public.users;
create policy "users_select_own_row"
  on public.users
  for select
  using (id = auth.uid());

drop policy if exists "users_insert_own_row" on public.users;
create policy "users_insert_own_row"
  on public.users
  for insert
  with check (id = auth.uid());

drop policy if exists "users_update_own_row" on public.users;
create policy "users_update_own_row"
  on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "users_delete_own_row" on public.users;
create policy "users_delete_own_row"
  on public.users
  for delete
  using (id = auth.uid());

drop policy if exists "login_activity_select_own_rows" on public.login_activity;
create policy "login_activity_select_own_rows"
  on public.login_activity
  for select
  using (user_id = auth.uid());

drop policy if exists "login_activity_insert_own_rows" on public.login_activity;
create policy "login_activity_insert_own_rows"
  on public.login_activity
  for insert
  with check (user_id = auth.uid());

drop policy if exists "classes_select_own_rows" on public.classes;
create policy "classes_select_own_rows"
  on public.classes
  for select
  using (user_id = auth.uid());

drop policy if exists "classes_insert_own_rows" on public.classes;
create policy "classes_insert_own_rows"
  on public.classes
  for insert
  with check (user_id = auth.uid());

drop policy if exists "classes_update_own_rows" on public.classes;
create policy "classes_update_own_rows"
  on public.classes
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "classes_delete_own_rows" on public.classes;
create policy "classes_delete_own_rows"
  on public.classes
  for delete
  using (user_id = auth.uid());

drop policy if exists "tasks_select_own_rows" on public.tasks;
create policy "tasks_select_own_rows"
  on public.tasks
  for select
  using (user_id = auth.uid());

drop policy if exists "tasks_insert_own_rows" on public.tasks;
create policy "tasks_insert_own_rows"
  on public.tasks
  for insert
  with check (user_id = auth.uid());

drop policy if exists "tasks_update_own_rows" on public.tasks;
create policy "tasks_update_own_rows"
  on public.tasks
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "tasks_delete_own_rows" on public.tasks;
create policy "tasks_delete_own_rows"
  on public.tasks
  for delete
  using (user_id = auth.uid());

drop policy if exists "spotify_tokens_select_own_row" on public.spotify_tokens;
create policy "spotify_tokens_select_own_row"
  on public.spotify_tokens
  for select
  using (user_id = auth.uid());

drop policy if exists "spotify_tokens_insert_own_row" on public.spotify_tokens;
create policy "spotify_tokens_insert_own_row"
  on public.spotify_tokens
  for insert
  with check (user_id = auth.uid());

drop policy if exists "spotify_tokens_update_own_row" on public.spotify_tokens;
create policy "spotify_tokens_update_own_row"
  on public.spotify_tokens
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "spotify_tokens_delete_own_row" on public.spotify_tokens;
create policy "spotify_tokens_delete_own_row"
  on public.spotify_tokens
  for delete
  using (user_id = auth.uid());
