-- SQL completo para corrigir um projeto Supabase ja existente.
-- Pode executar mais de uma vez.

begin;

create extension if not exists pgcrypto;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid(),
  title text,
  body text,
  memory_date date,
  image_url text,
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_songs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid(),
  title text not null,
  artist text,
  note text,
  url text not null,
  platform text not null,
  created_at timestamptz not null default now()
);

alter table public.memories
  add column if not exists owner_id uuid,
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists memory_date date,
  add column if not exists image_url text,
  add column if not exists image_path text,
  add column if not exists created_at timestamptz not null default now();

alter table public.memories
  alter column owner_id set default auth.uid(),
  alter column created_at set default now();

alter table public.couple_songs
  add column if not exists owner_id uuid,
  add column if not exists title text,
  add column if not exists artist text,
  add column if not exists note text,
  add column if not exists url text,
  add column if not exists platform text,
  add column if not exists created_at timestamptz not null default now();

alter table public.couple_songs
  alter column owner_id set default auth.uid(),
  alter column created_at set default now();

grant usage on schema public to anon, authenticated;
grant select on table public.memories to anon, authenticated;
grant insert, update, delete on table public.memories to authenticated;
grant select on table public.couple_songs to anon, authenticated;
grant insert, update, delete on table public.couple_songs to authenticated;

alter table public.memories enable row level security;
alter table public.couple_songs enable row level security;

drop policy if exists "Todos do casal podem ler memorias" on public.memories;
drop policy if exists "Todos podem ler memorias publicadas" on public.memories;
drop policy if exists "Cada aparelho cria suas memorias" on public.memories;
drop policy if exists "Usuarios logados criam memorias" on public.memories;
drop policy if exists "Cada aparelho exclui suas memorias" on public.memories;
drop policy if exists "Dono exclui sua memoria" on public.memories;
drop policy if exists "Dono atualiza sua memoria" on public.memories;

drop policy if exists "Todos podem ler musicas do casal" on public.couple_songs;
drop policy if exists "Usuarios logados criam musicas" on public.couple_songs;
drop policy if exists "Dono atualiza sua musica" on public.couple_songs;
drop policy if exists "Dono exclui sua musica" on public.couple_songs;

create policy "Todos podem ler memorias publicadas"
on public.memories
for select
to public
using (true);

create policy "Usuarios logados criam memorias"
on public.memories
for insert
to authenticated
with check (auth.uid() is not null and owner_id = auth.uid());

create policy "Dono atualiza sua memoria"
on public.memories
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Dono exclui sua memoria"
on public.memories
for delete
to authenticated
using (owner_id = auth.uid());

create policy "Todos podem ler musicas do casal"
on public.couple_songs
for select
to public
using (true);

create policy "Usuarios logados criam musicas"
on public.couple_songs
for insert
to authenticated
with check (auth.uid() is not null and owner_id = auth.uid());

create policy "Dono atualiza sua musica"
on public.couple_songs
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Dono exclui sua musica"
on public.couple_songs
for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists memories_date_created_idx
on public.memories (memory_date desc, created_at desc);

create index if not exists couple_songs_created_idx
on public.couple_songs (created_at desc);

commit;

select id, title, memory_date, created_at
from public.memories
order by memory_date desc, created_at desc;

select id, title, artist, platform, created_at
from public.couple_songs
order by created_at desc;
