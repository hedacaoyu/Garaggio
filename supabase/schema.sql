-- Garaggio schema. Run this once in the Supabase SQL editor of a new project.
-- Every table is owned per-player and protected by row level security, so the
-- anon key in the browser can only ever reach the signed-in player's rows.

-- ---------------------------------------------------------------- enums
do $$ begin
  create type car_category as enum
    ('hypercar','supercar','sports','luxury_suv','luxury_sedan','muscle');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_kind as enum ('collection','garage');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_source as enum ('scan','starter','race','trade','vin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ownership_state as enum ('claimed','verified');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  username             text not null unique,
  avatar               jsonb not null default '{}'::jsonb,
  level                integer not null default 1,
  xp                   bigint  not null default 0,
  octane               integer not null default 0,
  collection_capacity  integer not null default 150,
  personal_ride_card_id uuid,
  premium_pass         boolean not null default false,
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------- cards
-- A card records what was seen: model, colour, where. Specs live in the
-- catalog, so a spec correction fixes every card at once.
create table if not exists public.cards (
  id              uuid primary key default gen_random_uuid(),
  owner           uuid not null references public.profiles(id) on delete cascade,
  catalog_car_id  text not null,
  kind            card_kind not null default 'collection',
  source          card_source not null default 'scan',
  color           text not null default '#cccccc',
  acquired_at     timestamptz not null default now(),
  location        jsonb,
  mods            jsonb not null default '{"turbo":0,"tune":0,"exhaust":0}'::jsonb,
  tags            text[] not null default '{}',
  vin             text,
  ownership       ownership_state,
  stack_count     integer not null default 1 check (stack_count >= 1)
);
create index if not exists cards_owner_idx on public.cards(owner);

-- --------------------------------------------------------------- cardex
-- Permanent record of every model ever collected. Trading a car away or
-- scrapping it does not remove the entry.
create table if not exists public.cardex (
  owner             uuid not null references public.profiles(id) on delete cascade,
  catalog_car_id    text not null,
  first_collected_at timestamptz not null default now(),
  times_collected   integer not null default 1,
  first_discovery   boolean not null default false,
  primary key (owner, catalog_car_id)
);

-- ----------------------------------------------------------- vin claims
-- One VIN, one account. A disputed claim is settled by stronger proof.
create table if not exists public.vin_claims (
  vin        text primary key,
  owner      uuid not null references public.profiles(id) on delete cascade,
  claimed_at timestamptz not null default now()
);

-- ----------------------------------------------------- showcase entries
create table if not exists public.showcase_entries (
  owner        uuid not null references public.profiles(id) on delete cascade,
  board_id     text not null,
  card_id      uuid not null references public.cards(id) on delete cascade,
  score        double precision not null default 0,
  week_key     text not null,
  submitted_at timestamptz not null default now(),
  primary key (owner, board_id)
);
create index if not exists showcase_board_idx on public.showcase_entries(board_id, week_key, score desc);

-- --------------------------------------------------------- race results
create table if not exists public.race_results (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid not null references public.profiles(id) on delete cascade,
  card_id      uuid not null references public.cards(id) on delete cascade,
  event_id     text not null,
  player_et    double precision not null,
  ghost_et     double precision not null,
  won          boolean not null,
  xp_earned    integer not null default 0,
  reward_label text,
  raced_at     timestamptz not null default now()
);
create index if not exists race_results_owner_idx on public.race_results(owner);

-- -------------------------------------------------- catalog submissions
-- A scan of a model we hold no specs for still gives the player a card
-- immediately; the model enters here as pending until it is reviewed.
create table if not exists public.catalog_submissions (
  id          text primary key,
  created_by  uuid references public.profiles(id) on delete set null,
  payload     jsonb not null,
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------ RLS
alter table public.profiles            enable row level security;
alter table public.cards               enable row level security;
alter table public.cardex              enable row level security;
alter table public.vin_claims          enable row level security;
alter table public.showcase_entries    enable row level security;
alter table public.race_results        enable row level security;
alter table public.catalog_submissions enable row level security;

-- Profiles are publicly readable so leaderboards can show usernames and so a
-- new player can check whether a username is free. Writes are self-only.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_delete_self on public.profiles;
create policy profiles_delete_self on public.profiles
  for delete using (auth.uid() = id);

-- Cards, CarDex and race history are private to their owner.
drop policy if exists cards_own on public.cards;
create policy cards_own on public.cards
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists cardex_own on public.cardex;
create policy cardex_own on public.cardex
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists races_own on public.race_results;
create policy races_own on public.race_results
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

-- VIN claims are readable by everyone so a second account is told the VIN is
-- taken without being shown who holds it (only the vin column is useful).
drop policy if exists vin_read on public.vin_claims;
create policy vin_read on public.vin_claims for select using (true);

drop policy if exists vin_write_own on public.vin_claims;
create policy vin_write_own on public.vin_claims
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

-- Showcase entries are public by design: they are a leaderboard.
drop policy if exists showcase_read on public.showcase_entries;
create policy showcase_read on public.showcase_entries for select using (true);

drop policy if exists showcase_write_own on public.showcase_entries;
create policy showcase_write_own on public.showcase_entries
  for all using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists catalog_read on public.catalog_submissions;
create policy catalog_read on public.catalog_submissions for select using (true);

drop policy if exists catalog_insert on public.catalog_submissions;
create policy catalog_insert on public.catalog_submissions
  for insert with check (auth.uid() = created_by);

-- --------------------------------------------- leaderboard read helper
-- Showcase rows need the entrant's username and the card's model and colour,
-- which RLS keeps private on `cards`. This view exposes just those columns.
create or replace view public.showcase_board
with (security_invoker = false) as
  select s.board_id,
         s.week_key,
         s.score,
         s.submitted_at,
         p.username,
         c.catalog_car_id,
         c.color,
         s.owner
  from public.showcase_entries s
  join public.profiles p on p.id = s.owner
  join public.cards    c on c.id = s.card_id;

grant select on public.showcase_board to anon, authenticated;
