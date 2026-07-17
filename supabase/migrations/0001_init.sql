-- WTF Check-in — schéma initial
-- Events + participants, accès anonyme complet (pas d'auth en V1), realtime sur participants.

create extension if not exists pgcrypto;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nouvel événement',
  logo_url text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'participant_status') then
    create type participant_status as enum ('Participant', 'VIP', 'Encadrant', 'Big Boss', 'Staff');
  end if;
end $$;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  status participant_status not null default 'Participant',
  tshirt_size text,
  is_guest boolean not null default false,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists participants_event_id_idx on participants (event_id);
create index if not exists participants_last_name_idx on participants (lower(last_name));

alter table events enable row level security;
alter table participants enable row level security;

-- MVP sans authentification : accès complet pour la clé anon.
-- À restreindre (policies par organisation/rôle) quand l'auth sera ajoutée.
drop policy if exists "anon full access events" on events;
create policy "anon full access events" on events
  for all to anon using (true) with check (true);

drop policy if exists "anon full access participants" on participants;
create policy "anon full access participants" on participants
  for all to anon using (true) with check (true);

-- Bucket de stockage pour les logos d'événement
insert into storage.buckets (id, name, public)
values ('event-logos', 'event-logos', true)
on conflict (id) do nothing;

drop policy if exists "anon full access event-logos" on storage.objects;
create policy "anon full access event-logos" on storage.objects
  for all to anon
  using (bucket_id = 'event-logos')
  with check (bucket_id = 'event-logos');

-- Realtime sur les participants (multi-animateurs synchronisés en pointage)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table participants;
  end if;
end $$;
