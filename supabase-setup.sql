-- Cole todo este arquivo no Supabase:
-- SQL Editor > New query > Run

create extension if not exists pgcrypto;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 1200),
  memory_date date not null,
  image_url text,
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.memories enable row level security;

drop policy if exists "Todos do casal podem ler memorias" on public.memories;
create policy "Todos do casal podem ler memorias"
on public.memories for select
to authenticated
using (true);

drop policy if exists "Cada aparelho cria suas memorias" on public.memories;
create policy "Cada aparelho cria suas memorias"
on public.memories for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Cada aparelho exclui suas memorias" on public.memories;
create policy "Cada aparelho exclui suas memorias"
on public.memories for delete
to authenticated
using (owner_id = auth.uid());

-- Depois de executar:
-- Authentication > Providers > Email deve ficar ativo.
-- Authentication > Users > Add user: crie uma conta para cada um de voces.
