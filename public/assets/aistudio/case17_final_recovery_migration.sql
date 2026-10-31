-- =====================================================================================================================
-- THE LAST SIGNAL — CASE FILE TLS-0017
-- MASTER CONSOLIDATED DATABASE RECOVERY MIGRATION
-- File: case17_final_recovery_migration.sql
-- Version: 4.0.0 (Production Release)
-- 
-- SUMMARY OF INCLUDED MODULES:
-- 1. EXTENSIONS & SCHEMAS (uuid-ossp, pgcrypto)
-- 2. CORE ENROLLMENT & PROFILES (profiles, participants, participant_members)
-- 3. STAFF, ROLES & PERMISSIONS (staff, security definer clearance helpers)
-- 4. COMPETITION CONFIGURATION & STAGES (game_settings, stages, challenges, answers)
-- 5. SOLVES, COMPLETIONS & DEDUCTIONS (solves, stage_completions, location_choices)
-- 6. AUDIT & SUPPORT DOCKETS (audit_log, score_adjustments, support_tickets)
-- 7. REUSABLE STAGE OVERRIDE SYSTEM (participant_stage_overrides & staff RPCs)
-- 8. INTELLIGENCE LEADERBOARD ENGINE (exclude_from_leaderboard, get_leaderboard RPC)
-- 9. AUTHORITATIVE AUTHENTICATION TRIGGER (handle_new_user on auth.users)
-- 10. ROW LEVEL SECURITY (RLS) POLICIES & GRANTS (anon, authenticated, service_role)
-- 11. READ-ONLY VERIFICATION QUERIES (Safe post-migration audit checks)
-- =====================================================================================================================

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. EXTENSIONS & CORE PREREQUISITES
-- ---------------------------------------------------------------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. GAME SETTINGS & TIMELINE ENFORCEMENT
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.game_settings (
  id boolean primary key default true check (id),
  game_start timestamptz not null default '2026-10-30 00:00:00+05:30',
  registration_open boolean not null default true,
  paused boolean not null default false,
  team_size_max int not null default 5 check (team_size_max between 2 and 50),
  leaderboard_individual_visible boolean not null default true,
  leaderboard_team_visible boolean not null default true,
  ending_enabled boolean not null default true,
  rate_limit_account_per_min int not null default 8 check (rate_limit_account_per_min between 1 and 60),
  rate_limit_participant_per_min int not null default 20 check (rate_limit_participant_per_min between 1 and 300),
  allowed_email_domain text,
  updated_at timestamptz not null default now()
);

insert into public.game_settings (id, registration_open)
values (true, true)
on conflict (id) do update set
  registration_open = excluded.registration_open,
  updated_at = now();

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. INVESTIGATOR PROFILES & AUTHENTICATION MIRROR
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  full_name text,
  email text,
  school text default 'School Division',
  student_class text,
  admission_hash text,
  admission_masked text,
  exclude_from_leaderboard boolean not null default false,
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure required columns exist on profiles if migrated from older schema versions
alter table public.profiles
  add column if not exists email text,
  add column if not exists school text default 'School Division',
  add column if not exists exclude_from_leaderboard boolean not null default false,
  add column if not exists disabled boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_profiles_username on public.profiles (lower(trim(username)));
create index if not exists idx_profiles_email on public.profiles (lower(trim(email)));

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. PARTICIPANTS (SOLO OPERATIVES & TEAMS)
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default extensions.uuid_generate_v4(),
  kind text not null check (kind in ('solo', 'team')),
  name text,
  invite_code text unique,
  created_by uuid references public.profiles(id),
  solo_user_id uuid references public.profiles(id),
  retired boolean not null default false,
  exclude_from_leaderboard boolean not null default false,
  max_size int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.participants
  add column if not exists exclude_from_leaderboard boolean not null default false,
  add column if not exists max_size int not null default 5,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_participants_kind on public.participants(kind) where not retired;
create index if not exists idx_participants_solo_user on public.participants(solo_user_id) where kind = 'solo';

-- ---------------------------------------------------------------------------------------------------------------------
-- 5. PARTICIPANT MEMBERSHIP (UNIT ROSTERS)
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.participant_members (
  participant_id uuid not null references public.participants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  is_creator boolean not null default false,
  primary key (participant_id, user_id)
);

alter table public.participant_members
  add column if not exists is_creator boolean not null default false;

create index if not exists idx_participant_members_user on public.participant_members(user_id) where left_at is null;

-- ---------------------------------------------------------------------------------------------------------------------
-- 6. STAFF & SECURITY ROLES
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.staff (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'organiser', 'moderator')),
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Security Definer Authorization Functions
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists(
    select 1 from public.staff s
    join public.profiles p on p.id = s.user_id
    where s.user_id = auth.uid() and not p.disabled
  );
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists(
    select 1 from public.staff s
    join public.profiles p on p.id = s.user_id
    where s.user_id = auth.uid() and s.role = 'owner' and not p.disabled
  );
$$;

create or replace function public.assert_staff() returns void
language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden: staff clearance required' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.my_participant() returns uuid
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select m.participant_id
  from public.participant_members m
  join public.profiles p on p.id = m.user_id
  where m.user_id = auth.uid() and m.left_at is null and not p.disabled
  limit 1;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 7. STAGES, CHALLENGES & ANSWER HASH VAULT
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.stages (
  id int primary key check (id between 1 and 20),
  public_title text not null,
  window_hours int not null default 48 check (window_hours > 0),
  offset_hours_override int check (offset_hours_override >= 0),
  points int not null default 100 check (points >= 0),
  enabled boolean not null default true
);

create table if not exists public.challenges (
  id uuid primary key default extensions.uuid_generate_v4(),
  key text unique not null check (key ~ '^[a-z0-9_]{3,40}$'),
  label text not null,
  kind text not null check (kind in ('puzzle', 'gate')),
  stage_id int references public.stages(id),
  requires_challenge_id uuid references public.challenges(id),
  requires_username boolean not null default false,
  attempt_limit int check (attempt_limit > 0),
  norm_mode text not null default 'text' check (norm_mode in ('text', 'coords')),
  active boolean not null default true,
  salt text not null default encode(extensions.gen_random_bytes(8), 'hex'),
  sort_order int not null default 0
);

create table if not exists public.challenge_answers (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  answer_hash text not null,
  primary key (challenge_id, answer_hash)
);

-- Seed canonical 7 stages if not already populated
insert into public.stages (id, public_title, window_hours, points, enabled)
values
  (1, 'The Broken Tower', 48, 100, true),
  (2, 'The Cassette in the Reeds', 48, 100, true),
  (3, 'The Presidio Witness', 48, 100, true),
  (4, 'The 47-Second Tape', 48, 100, true),
  (5, 'The Mercer Inquest', 48, 100, true),
  (6, 'The Record That Remembered Tomorrow', 48, 100, true),
  (7, 'Ellen Vale''s Journal and the Final Review', 48, 100, true)
on conflict (id) do update set
  public_title = excluded.public_title,
  points = excluded.points,
  enabled = excluded.enabled;

-- ---------------------------------------------------------------------------------------------------------------------
-- 8. SOLVES, STAGE COMPLETIONS & DEDUCTION CHOICES
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.solves (
  id uuid primary key default extensions.uuid_generate_v4(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  solved_at timestamptz not null default now(),
  unique (participant_id, challenge_id)
);

create table if not exists public.stage_completions (
  id uuid primary key default extensions.uuid_generate_v4(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  stage_id int not null references public.stages(id) on delete cascade,
  completed_at timestamptz not null default now(),
  points_earned int not null default 100 check (points_earned >= 0),
  scoring_eligible boolean not null default true,
  unique (participant_id, stage_id)
);

create table if not exists public.location_config (
  id boolean primary key default true check (id),
  correct_location_id int default 4,
  bonus_points int not null default 20,
  enabled boolean not null default true
);

insert into public.location_config (id, correct_location_id, bonus_points, enabled)
values (true, 4, 20, true)
on conflict (id) do update set
  correct_location_id = excluded.correct_location_id,
  bonus_points = excluded.bonus_points,
  enabled = excluded.enabled;

create table if not exists public.location_choices (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  location_id int not null check (location_id between 1 and 4),
  correction_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.score_adjustments (
  id uuid primary key default extensions.uuid_generate_v4(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  delta int not null,
  reason text not null,
  applied_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Score Computation Helper
create or replace function public.score_of(pid uuid) returns int
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select greatest(0,
    coalesce((select sum(c.points_earned) from public.stage_completions c where c.participant_id = pid), 0)
    + case when exists(
        select 1 from public.location_choices lc
        cross join public.location_config cfg
        where lc.participant_id = pid and lc.location_id = cfg.correct_location_id and cfg.enabled
      ) then coalesce((select bonus_points from public.location_config where id = true), 20) else 0 end
    + coalesce((select sum(a.delta) from public.score_adjustments a where a.participant_id = pid), 0)
  )::int;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 9. PARTICIPANT STAGE OVERRIDES (ADMIN / TESTING CLEARANCE)
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.participant_stage_overrides (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  enabled boolean not null default true,
  granted_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Check if calling user has an active stage override
create or replace function public.has_stage_override() returns boolean
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select coalesce((
    select o.enabled
    from public.participant_stage_overrides o
    where o.participant_id = public.my_participant()
    limit 1
  ), false);
$$;

-- Staff RPC: Set stage override by participant UUID
create or replace function public.staff_set_stage_override(
  p_participant uuid,
  p_enabled boolean,
  p_reason text default null
) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();

  insert into public.participant_stage_overrides (participant_id, enabled, granted_by, reason, updated_at)
  values (p_participant, p_enabled, auth.uid(), p_reason, now())
  on conflict (participant_id) do update set
    enabled = excluded.enabled,
    granted_by = excluded.granted_by,
    reason = excluded.reason,
    updated_at = now();
end;
$$;

-- Staff RPC: Set stage override by operative Call-Sign / Username
create or replace function public.staff_set_stage_override_by_callsign(
  p_callsign text,
  p_enabled boolean,
  p_reason text default null
) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  target_user uuid;
  target_pid uuid;
begin
  perform public.assert_staff();

  select id into target_user
  from public.profiles
  where lower(trim(username)) = lower(trim(p_callsign));

  if target_user is null then
    raise exception 'Operative profile not found for callsign: %', p_callsign using errcode = '22000';
  end if;

  select participant_id into target_pid
  from public.participant_members
  where user_id = target_user and left_at is null
  limit 1;

  if target_pid is null then
    raise exception 'No active participant membership found for operative: %', p_callsign using errcode = '22000';
  end if;

  perform public.staff_set_stage_override(target_pid, p_enabled, p_reason);
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 10. INTELLIGENCE LEADERBOARD ENGINE (STRICT ADMIN / TESTING EXCLUSION)
-- ---------------------------------------------------------------------------------------------------------------------
-- Authoritative leaderboard function.
-- Excludes:
-- 1. Any participant marked exclude_from_leaderboard = true.
-- 2. Any participant with participant_stage_overrides where enabled = true (ADMIN testing accounts).
-- 3. Any staff member (public.staff).
-- 4. Developer email account (rudrapratapj.0562@gmail.com and variations).
-- 5. Teams where any member has an override or is marked excluded.
create or replace function public.get_leaderboard(p_kind text default 'all')
returns table(
  pos bigint,
  name text,
  kind text,
  score int,
  stages_completed int,
  current_stage int,
  completion_percentage int,
  last_progress timestamptz
)
language sql stable security definer
set search_path = public, extensions, pg_temp as $$
  with base_candidates as (
    select
      p.id as participant_id,
      p.kind as participant_kind,
      coalesce(p.name, pr.username) as entity_name,
      public.score_of(p.id) as total_score,
      (select count(*)::int from public.stage_completions sc where sc.participant_id = p.id) as completed_count,
      greatest(
        (select max(v.solved_at) from public.solves v where v.participant_id = p.id),
        (select max(c2.completed_at) from public.stage_completions c2 where c2.participant_id = p.id),
        p.created_at
      ) as latest_activity
    from public.participants p
    left join public.profiles pr on pr.id = p.solo_user_id
    where not p.retired
      and not p.exclude_from_leaderboard
      and not coalesce(pr.exclude_from_leaderboard, false)
      -- Filter kind if not 'all'
      and (p_kind = 'all' or p.kind = p_kind)
      -- Exclude testing accounts with stage overrides
      and not exists (
        select 1 from public.participant_stage_overrides pso
        where pso.participant_id = p.id and pso.enabled = true
      )
      -- Exclude staff roles
      and (
        p.kind = 'team' or (
          not coalesce(pr.disabled, false)
          and not exists (select 1 from public.staff st where st.user_id = p.solo_user_id)
        )
      )
      -- Exclude developer account regardless of points or completions
      and not (
        lower(coalesce(pr.username, '')) in ('rudrapratapj.0562@gmail.com', 'rudrapratapf.0562@gmail.com') or
        lower(coalesce(pr.email, '')) in ('rudrapratapj.0562@gmail.com', 'rudrapratapf.0562@gmail.com') or
        lower(coalesce(p.name, '')) in ('rudrapratapj.0562@gmail.com', 'rudrapratapf.0562@gmail.com')
      )
      -- For teams, ensure NO active team member has an override, is staff, or is developer
      and not (
        p.kind = 'team' and exists (
          select 1 from public.participant_members pm
          join public.profiles mpr on mpr.id = pm.user_id
          left join public.participant_stage_overrides mpso on mpso.participant_id = pm.participant_id
          where pm.participant_id = p.id and pm.left_at is null and (
            mpr.exclude_from_leaderboard = true or
            coalesce(mpso.enabled, false) = true or
            exists (select 1 from public.staff mst where mst.user_id = mpr.id) or
            lower(coalesce(mpr.email, '')) in ('rudrapratapj.0562@gmail.com', 'rudrapratapf.0562@gmail.com') or
            lower(coalesce(mpr.username, '')) in ('rudrapratapj.0562@gmail.com', 'rudrapratapf.0562@gmail.com')
          )
        )
      )
  )
  select
    rank() over (order by bc.total_score desc, bc.completed_count desc, bc.latest_activity asc) as pos,
    bc.entity_name as name,
    bc.participant_kind as kind,
    bc.total_score as score,
    bc.completed_count as stages_completed,
    least(7, bc.completed_count + 1) as current_stage,
    round((bc.completed_count::numeric / 7.0) * 100)::int as completion_percentage,
    bc.latest_activity as last_progress
  from base_candidates bc
  where bc.latest_activity is not null
  order by pos, name;
$$;

-- Staff RPC: Exclude or include an operative in the leaderboard by callsign
create or replace function public.staff_set_leaderboard_exclusion_by_callsign(
  p_callsign text,
  p_excluded boolean,
  p_reason text default null
) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_user_id uuid;
  v_part_id uuid;
begin
  perform public.assert_staff();

  select id into v_user_id
  from public.profiles
  where lower(trim(username)) = lower(trim(p_callsign));

  if v_user_id is null then
    raise exception 'Operative profile not found for callsign: %', p_callsign using errcode = '22000';
  end if;

  update public.profiles
  set exclude_from_leaderboard = p_excluded, updated_at = now()
  where id = v_user_id;

  select participant_id into v_part_id
  from public.participant_members
  where user_id = v_user_id and left_at is null
  limit 1;

  if v_part_id is not null then
    update public.participants
    set exclude_from_leaderboard = p_excluded, updated_at = now()
    where id = v_part_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 11. REGISTRATION TRIGGER: AUTOMATIC PROFILE, SOLO PARTICIPANT & MEMBERSHIP
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  gs public.game_settings;
  pid uuid;
  uname text;
  fname text;
  sclass text;
  school_val text;
  ahash text;
  amask text;
  uemail text;
  is_dev boolean := false;
  reserved text[] := array['admin','administrator','director','zodiac','cipher','system','moderator','staff','owner'];
begin
  select * into gs from public.game_settings;
  if not coalesce(gs.registration_open, true) then
    raise exception 'Registration is closed' using errcode = '28000';
  end if;

  uname := coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'callSign');
  fname := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName');
  sclass := coalesce(new.raw_user_meta_data->>'student_class', new.raw_user_meta_data->>'studentClass');
  school_val := coalesce(new.raw_user_meta_data->>'school', new.raw_user_meta_data->>'school_name', 'School Division');
  ahash := coalesce(new.raw_user_meta_data->>'admission_hash', new.raw_user_meta_data->>'admissionHash');
  amask := coalesce(new.raw_user_meta_data->>'admission_masked', new.raw_user_meta_data->>'admissionNumberMasked');
  uemail := coalesce(new.email, new.raw_user_meta_data->>'email');

  if uname is null or char_length(trim(uname)) < 3 then
    uname := 'operative_' || substring(encode(extensions.gen_random_bytes(3), 'hex') from 1 for 6);
  end if;

  if lower(trim(uname)) = any(reserved) then
    raise exception 'This call-sign is reserved by the investigation authority' using errcode = '22000';
  end if;

  if lower(trim(coalesce(uemail, ''))) in ('rudrapratapj.0562@gmail.com', 'rudrapratapf.0562@gmail.com') or
     lower(trim(uname)) in ('rudrapratapj.0562@gmail.com', 'rudrapratapf.0562@gmail.com') then
    is_dev := true;
  end if;

  -- 1. Create or update profile record
  insert into public.profiles (
    id, username, full_name, email, school, student_class,
    admission_hash, admission_masked, exclude_from_leaderboard
  )
  values (
    new.id, trim(uname), fname, uemail, school_val, sclass,
    ahash, amask, is_dev
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    email = coalesce(excluded.email, profiles.email),
    school = coalesce(excluded.school, profiles.school),
    student_class = coalesce(excluded.student_class, profiles.student_class),
    updated_at = now();

  -- 2. Create solo participant record if not exists
  select id into pid from public.participants where solo_user_id = new.id and kind = 'solo' limit 1;
  if pid is null then
    insert into public.participants (kind, solo_user_id, created_by, exclude_from_leaderboard)
    values ('solo', new.id, new.id, is_dev)
    returning id into pid;
  end if;

  -- 3. Create participant_members membership record
  insert into public.participant_members (participant_id, user_id, is_creator)
  values (pid, new.id, true)
  on conflict (participant_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES & GRANTS
-- ---------------------------------------------------------------------------------------------------------------------
alter table public.game_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.participants enable row level security;
alter table public.participant_members enable row level security;
alter table public.staff enable row level security;
alter table public.stages enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_answers enable row level security;
alter table public.solves enable row level security;
alter table public.stage_completions enable row level security;
alter table public.location_config enable row level security;
alter table public.location_choices enable row level security;
alter table public.score_adjustments enable row level security;
alter table public.participant_stage_overrides enable row level security;

-- Drop prior policies cleanly to ensure idempotency
drop policy if exists game_settings_select on public.game_settings;
create policy game_settings_select on public.game_settings for select to public using (true);

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to public using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists participants_select on public.participants;
create policy participants_select on public.participants for select to public using (not retired or public.is_staff());

drop policy if exists participant_members_select on public.participant_members;
create policy participant_members_select on public.participant_members for select to public using (true);

drop policy if exists stages_select on public.stages;
create policy stages_select on public.stages for select to public using (enabled or public.is_staff());

drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges for select to public using (active or public.is_staff());

drop policy if exists solves_select on public.solves;
create policy solves_select on public.solves for select to authenticated
  using (participant_id = public.my_participant() or public.is_staff());

drop policy if exists stage_completions_select on public.stage_completions;
create policy stage_completions_select on public.stage_completions for select to public using (true);

drop policy if exists location_choices_select on public.location_choices;
create policy location_choices_select on public.location_choices for select to authenticated
  using (participant_id = public.my_participant() or public.is_staff());

drop policy if exists participant_stage_overrides_select on public.participant_stage_overrides;
create policy participant_stage_overrides_select on public.participant_stage_overrides for select to authenticated
  using (participant_id = public.my_participant() or public.is_staff());

drop policy if exists participant_stage_overrides_staff on public.participant_stage_overrides;
create policy participant_stage_overrides_staff on public.participant_stage_overrides for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- API Grants
grant usage on schema public to anon, authenticated, service_role;
grant select on public.game_settings, public.profiles, public.participants, public.participant_members,
  public.stages, public.challenges, public.stage_completions to anon, authenticated;
grant select on public.solves, public.location_choices, public.participant_stage_overrides to authenticated;
grant execute on function public.get_leaderboard(text) to anon, authenticated;
grant execute on function public.has_stage_override() to authenticated;
grant execute on function public.my_participant() to authenticated;
grant execute on function public.score_of(uuid) to anon, authenticated;

-- Full service role management
grant all on all tables in schema public to service_role;
grant all on all routines in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 13. READ-ONLY VERIFICATION QUERIES
-- Run these queries after executing the migration to verify system integrity.
-- ---------------------------------------------------------------------------------------------------------------------
-- 1. Check total registered investigator profiles:
-- SELECT count(*) AS total_registered_profiles FROM public.profiles;

-- 2. Check total solo participants vs team units:
-- SELECT kind, count(*) AS unit_count FROM public.participants WHERE NOT retired GROUP BY kind;

-- 3. Verify developer account is excluded:
-- SELECT username, email, exclude_from_leaderboard FROM public.profiles WHERE lower(email) LIKE '%rudrapratap%';

-- 4. Verify test accounts with stage overrides:
-- SELECT pso.participant_id, p.name, pso.enabled, pso.reason FROM public.participant_stage_overrides pso JOIN public.participants p ON p.id = pso.participant_id;

-- 5. Test leaderboard retrieval:
-- SELECT * FROM public.get_leaderboard('all') LIMIT 10;
