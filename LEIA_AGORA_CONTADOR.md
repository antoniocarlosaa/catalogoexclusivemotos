# 🚨 ATENÇÃO: CONFIGURAÇÃO DO CONTADOR DE VISITAS

Para que o contador de visitas funcione de forma **FIEL e REAL**, você precisa rodar um pequeno script no seu banco de dados Supabase. Eu criei o arquivo, mas como não tenho permissão de administrador no seu banco, você precisa fazer isso manualmente.

## Passo a Passo:

1. Acesse o **Dashboard do Supabase** (no navegador).
2. Vá até a aba **SQL Editor** (ícone com `>_` na barra lateral).
3. Clique em **New Query**.
4. Copie **TODO** o conteúdo do arquivo `FIX_VISIT_COUNTER.sql` que está nesta pasta.
   - *Se preferir, o conteúdo está logo abaixo:*

```sql
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

-- Sync current count (opcional)
with current_count as (
  select count(*) as c from public.access_logs
)
update public.site_stats
set total_visits = (select c from current_count)
where id = 1 and total_visits = 0;
```

5. Cole no editor do Supabase e clique em **RUN**.

---

## O que isso faz?
- Cria uma tabela otimizada `site_stats` que guarda o número exato.
- Configura um "gatilho" (trigger): toda vez que alguém visitar o site e o log for salvo, o contador aumenta automaticamente +1.
- Garante permissões para que visitantes anônimos consigam somar no contador sem erro.

Pronto! Seu contador será fiel e real, aparecendo no rodapé (mobile) e na sidebar (desktop).
