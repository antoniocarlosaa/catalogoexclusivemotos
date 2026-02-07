-- Enable RLS logic
create table if not exists public.site_stats (
  id int primary key default 1,
  total_visits bigint default 0,
  last_updated timestamptz default now()
);

-- Ensure only one row exists
insert into public.site_stats (id, total_visits)
values (1, 0)
on conflict (id) do nothing;

-- Enable RLS
alter table public.site_stats enable row level security;

-- Policy for reading stats (public)
create policy "Allow public read access"
  on public.site_stats
  for select
  to anon, authenticated
  using (true);

-- Policy for updating stats (service role only or via trigger, but let's allow public read)
-- Triggers bypass RLS, so this is fine.

-- Function to increment stats
create or replace function increment_visit_count()
returns trigger as $$
begin
  update public.site_stats
  set total_visits = total_visits + 1,
      last_updated = now()
  where id = 1;
  return new;
end;
$$ language plpgsql security definer;

-- Ensure access_logs exists
create table if not exists public.access_logs (
  id uuid default gen_random_uuid() primary key,
  ip text,
  location text,
  device_info text,
  device_type text,
  created_at timestamptz default now()
);

-- RLS for access_logs
alter table public.access_logs enable row level security;

-- Allow public insert to access_logs (logging visits)
create policy "Allow public insertion"
  on public.access_logs
  for insert
  to anon, authenticated
  with check (true);

-- Trigger to update stats
drop trigger if exists on_visit_created on public.access_logs;
create trigger on_visit_created
  after insert on public.access_logs
  for each row
  execute function increment_visit_count();

-- Optional: Sync current count if starting fresh
-- This is tricky without knowing current count, but we assume it's roughly count(access_logs)
with current_count as (
  select count(*) as c from public.access_logs
)
update public.site_stats
set total_visits = (select c from current_count)
where id = 1 and total_visits = 0;
