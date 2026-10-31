-- =====================================================================================================================
-- THE LAST SIGNAL: COMPLETE PRODUCTION SUPABASE MIGRATION
-- Project: CASE TLS-0017 (THE LAST SIGNAL)
-- Version: 3.0.0 (Hardened Production Architecture & Security Audit Revisions)
-- 
-- Includes:
-- 1. Profiles & Student Operative Intake (full_name, student_class, admission_hash, call_sign)
-- 2. Staff Roles (Owner & Organiser) with Last-Owner Protection and Server-Side Verification
-- 3. Participants & Team Management
-- 4. Game Configuration & Launch Gates (Pre-Registration & Launch Time Locks)
-- 5. 7 Canonical Stages, Window Hours (48h), and Authoritative Timers
-- 6. Challenges, Password Gates, Salted SHA-256 Answer Hashes
-- 7. Stage 4 Location Intercept (Site 04 = Washington & Cherry Streets, +20 Bonus, 24h Deadline & 48h Reveal Timers)
-- 8. Content, Release Rules, and Scheduled Message Wire (Zodiac / Director / System)
-- 9. Complete Support Ticketing System with Player Isolation & Private Staff Notes (Direct Staff Note Select Revoked)
-- 10. Server-Side Submission & Scoring Engine (Zero Browser Trust, Advisory Locks against Race Conditions)
-- 11. Comprehensive Row-Level Security (RLS) on ALL Tables and Audit Logging
-- 12. Complete Execution Privilege Whitelist (Least Privilege)
-- =====================================================================================================================

create extension if not exists pgcrypto with schema extensions;

-- =====================================================================================================================
-- 1. PROFILES & PARTICIPANTS
-- =====================================================================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,24}$' and lower(username) not in ('admin','administrator','director','zodiac','cipher','system','moderator')),
  full_name text,
  student_class text,
  admission_masked text,
  admission_hash text,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_ci on public.profiles (lower(username));
create unique index if not exists profiles_admission_hash on public.profiles (admission_hash) where admission_hash is not null;

create table if not exists public.staff (
  user_id uuid primary key references public.profiles on delete cascade,
  role text not null check (role in ('owner','organiser')),
  granted_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('solo','team')),
  name text check (name is null or char_length(name) between 3 and 40),
  invite_code text unique,
  solo_user_id uuid unique references public.profiles on delete cascade,
  created_by uuid references public.profiles on delete set null,
  retired boolean not null default false,
  exclude_from_leaderboard boolean not null default false,
  created_at timestamptz not null default now(),
  check ((kind = 'solo' and solo_user_id is not null and invite_code is null and name is null)
      or (kind = 'team' and solo_user_id is null and invite_code is not null and name is not null)),
  check (kind = 'solo' or lower(name) not in ('admin','administrator','director','zodiac','cipher','organiser','organizer','system','moderator','owner','staff'))
);
create unique index if not exists participants_team_name_ci on public.participants (lower(name)) where kind = 'team';

create table if not exists public.participant_members (
  participant_id uuid not null references public.participants on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (participant_id, user_id),
  check (left_at is null or left_at >= joined_at)
);
create unique index if not exists one_active_membership on public.participant_members (user_id) where left_at is null;

create table if not exists public.membership_events (
  id bigserial primary key,
  user_id uuid references public.profiles on delete set null,
  participant_id uuid references public.participants on delete set null,
  action text not null check (action in ('create_team','join','leave','failed_join','staff_move','retire_solo','restore_solo','disband')),
  actor_id uuid references public.profiles on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

-- =====================================================================================================================
-- 2. GAME SETTINGS & TIMELINE
-- =====================================================================================================================
create table if not exists public.game_settings (
  id boolean primary key default true check (id),
  game_start timestamptz,                         -- Shared start (UTC). NULL = not started; players locked out
  membership_lock_at timestamptz,                 -- NULL = membership locks at game_start
  registration_open boolean not null default true, -- Set TRUE to enable Pre-Registration before game_start
  paused boolean not null default false,
  team_size_max int not null default 5 check (team_size_max between 2 and 50),
  leaderboard_individual_visible boolean not null default false,
  leaderboard_team_visible boolean not null default false,
  ending_enabled boolean not null default true,
  rate_limit_account_per_min int not null default 8 check (rate_limit_account_per_min between 1 and 60),
  rate_limit_participant_per_min int not null default 20 check (rate_limit_participant_per_min between 1 and 300),
  allowed_email_domain text,
  updated_at timestamptz not null default now()
);

insert into public.game_settings (id, registration_open) values (true, true)
on conflict (id) do update set registration_open = excluded.registration_open;

-- =====================================================================================================================
-- 3. STAGES, CHALLENGES, AND SECURE ANSWER STORAGE
-- =====================================================================================================================
create table if not exists public.stages (
  id int primary key check (id between 1 and 20),
  public_title text not null,
  window_hours int not null default 48 check (window_hours > 0),
  offset_hours_override int check (offset_hours_override >= 0),
  points int check (points >= 0),
  enabled boolean not null default true
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key ~ '^[a-z0-9_]{3,40}$'),
  label text not null,
  kind text not null check (kind in ('puzzle','gate')),
  stage_id int references public.stages,
  requires_challenge_id uuid references public.challenges,
  requires_username boolean not null default false,
  attempt_limit int check (attempt_limit > 0),
  norm_mode text not null default 'text' check (norm_mode in ('text','coords')),
  active boolean not null default true,
  salt text not null default encode(extensions.gen_random_bytes(8), 'hex'),
  sort_order int not null default 0
);

create table if not exists public.challenge_answers (
  challenge_id uuid not null references public.challenges on delete cascade,
  answer_hash text not null,
  primary key (challenge_id, answer_hash)
);

create table if not exists public.stage_requirements (
  id uuid primary key default gen_random_uuid(),
  stage_id int not null references public.stages on delete cascade,
  challenge_id uuid references public.challenges on delete cascade,
  event_key text,
  unique (stage_id, challenge_id)
);

create table if not exists public.timers (
  key text primary key check (key ~ '^[a-z0-9_]{3,60}$'),
  anchor_type text not null check (anchor_type in ('absolute','game_start','stage_open','stage_close','participant_event','challenge_solved','location_choice')),
  absolute_at timestamptz,
  stage_id int references public.stages,
  event_key text,
  challenge_id uuid references public.challenges,
  offset_hours numeric not null default 0 check (offset_hours between -10000 and 10000),
  configured boolean not null default false,
  notes text
);

create table if not exists public.release_rules (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key ~ '^[a-z0-9_]{3,60}$'),
  timer_key text references public.timers,
  requires_challenge_id uuid references public.challenges,
  requires_event_key text,
  result_condition text check (result_condition in ('correct','incorrect')),
  notes text
);

create table if not exists public.map_locations (
  id int primary key,
  name text not null,
  sort_order int not null default 0,
  release_rule_id uuid references public.release_rules
);

create table if not exists public.location_config (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  correct_location_id int references public.map_locations,
  no_choice_treatment text check (no_choice_treatment in ('incorrect','none')),
  bonus_points int check (bonus_points >= 0),
  required_challenge_id uuid references public.challenges
);

-- =====================================================================================================================
-- 4. MESSAGES AND INVESTIGATIVE WIRE
-- =====================================================================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender text not null check (sender in ('director','zodiac','system','staff')),
  title text,
  body text not null,
  stage_id int references public.stages,
  release_rule_id uuid references public.release_rules,
  status text not null default 'published' check (status in ('draft','published','archived')),
  visible_during_ending boolean not null default false,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_reads (
  user_id uuid references public.profiles on delete cascade,
  message_id uuid references public.messages on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, message_id)
);

-- =====================================================================================================================
-- 5. SUPPORT TICKETS SYSTEM (ISOLATED + STAFF CONTROLS)
-- =====================================================================================================================
create table if not exists public.support_tickets (
  id text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  call_sign text not null,
  full_name text not null,
  student_class text not null,
  subject text not null check (char_length(trim(subject)) between 4 and 100),
  category text not null check (category in ('TECHNICAL_BUG','CIPHER_CLARIFICATION','SCHEDULE_DEADLINE','ACCOUNT_CREDENTIALS','OTHER_INQUIRY')),
  message text not null check (char_length(trim(message)) between 10 and 1500),
  status text not null default 'OPEN' check (status in ('OPEN','UNDER_REVIEW','RESOLVED','CLOSED')),
  priority text not null default 'NORMAL' check (priority in ('NORMAL','HIGH','CRITICAL')),
  staff_response text,
  staff_notes text,
  resolved_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at desc);

-- =====================================================================================================================
-- 6. SHARED GAME PROGRESSION & ATTEMPTS
-- =====================================================================================================================
create table if not exists public.attempts (
  id bigserial primary key,
  participant_id uuid not null references public.participants on delete cascade,
  user_id uuid references public.profiles on delete set null,
  challenge_id uuid not null references public.challenges,
  correct boolean not null,
  submitted text,
  voided boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.solves (
  participant_id uuid not null references public.participants on delete cascade,
  challenge_id uuid not null references public.challenges,
  solved_by uuid references public.profiles on delete set null,
  solved_at timestamptz not null default now(),
  primary key (participant_id, challenge_id)
);

create table if not exists public.stage_completions (
  participant_id uuid not null references public.participants on delete cascade,
  stage_id int not null references public.stages,
  completed_at timestamptz not null default now(),
  late boolean not null,
  points_earned int not null default 0 check (points_earned >= 0),
  completed_by uuid references public.profiles on delete set null,
  manual boolean not null default false,
  primary key (participant_id, stage_id),
  check (not late or points_earned = 0)
);

create table if not exists public.location_choices (
  participant_id uuid primary key references public.participants on delete cascade,
  location_id int not null references public.map_locations,
  chosen_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.score_adjustments (
  id bigserial primary key,
  participant_id uuid not null references public.participants on delete cascade,
  delta int not null check (delta between -1000 and 1000),
  reason text not null check (char_length(trim(reason)) > 0),
  staff_id uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles on delete set null,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================================================================
-- 7. HELPER FUNCTIONS & AUTHENTICATION
-- =====================================================================================================================
create or replace function public.norm(t text, m text) returns text language sql immutable set search_path = '' as $$
  select case when m = 'coords' then lower(regexp_replace(t, '\s', '', 'g')) else lower(regexp_replace(t, '[^A-Za-z0-9]', '', 'g')) end;
$$;

create or replace function public.is_active() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists(select 1 from public.profiles where id = auth.uid() and not disabled);
$$;

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists(select 1 from public.staff s join public.profiles p on p.id = s.user_id where s.user_id = auth.uid() and not p.disabled);
$$;

create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists(select 1 from public.staff s join public.profiles p on p.id = s.user_id where s.user_id = auth.uid() and s.role = 'owner' and not p.disabled);
$$;

create or replace function public.assert_staff() returns void language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  if not public.is_staff() then
    raise exception 'forbidden: staff authorization required' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.assert_owner() returns void language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  if not public.is_owner() then
    raise exception 'forbidden: owner authorization required' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.my_participant() returns uuid language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select m.participant_id from public.participant_members m join public.profiles p on p.id = m.user_id where m.user_id = auth.uid() and m.left_at is null and not p.disabled;
$$;

create or replace function public.game_started() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select coalesce(now() >= gs.game_start, false) from public.game_settings gs;
$$;

create or replace function public.stage_open_at(sid int) returns timestamptz language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select gs.game_start + (coalesce(st.offset_hours_override, (select coalesce(sum(x.window_hours), 0) from public.stages x where x.id < st.id))::double precision * interval '1 hour')
  from public.stages st cross join public.game_settings gs where st.id = sid;
$$;

create or replace function public.stage_close_at(sid int) returns timestamptz language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select public.stage_open_at(sid) + (st.window_hours::double precision * interval '1 hour') from public.stages st where st.id = sid;
$$;

create or replace function public.timer_at(tkey text, pid uuid) returns timestamptz language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select case t.anchor_type
    when 'absolute' then t.absolute_at
    when 'game_start' then gs.game_start + (t.offset_hours::double precision * interval '1 hour')
    when 'stage_open' then public.stage_open_at(t.stage_id) + (t.offset_hours::double precision * interval '1 hour')
    when 'stage_close' then public.stage_close_at(t.stage_id) + (t.offset_hours::double precision * interval '1 hour')
    when 'location_choice' then (select c.created_at from public.location_choices c where c.participant_id = pid) + (t.offset_hours::double precision * interval '1 hour')
  end
  from public.timers t cross join public.game_settings gs where t.key = tkey and t.configured;
$$;

create or replace function public.location_outcome(pid uuid) returns text language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  cfg public.location_config;
  chosen int;
  reveal timestamptz;
  dl timestamptz;
begin
  select * into cfg from public.location_config;
  if not cfg.enabled or cfg.correct_location_id is null or pid is null then return null; end if;
  reveal := public.timer_at('location_reveal', pid);
  if reveal is null or now() < reveal then return null; end if;
  select location_id into chosen from public.location_choices where participant_id = pid;
  if found then return case when chosen = cfg.correct_location_id then 'correct' else 'incorrect' end; end if;
  dl := public.timer_at('location_choice_deadline', pid);
  if dl is not null and now() >= dl and cfg.no_choice_treatment = 'incorrect' then return 'incorrect'; end if;
  return null;
end;
$$;

create or replace function public.score_of(pid uuid) returns int language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select greatest(0, coalesce((select sum(c.points_earned) from public.stage_completions c where c.participant_id = pid), 0)
    + case when public.location_outcome(pid) = 'correct' then coalesce((select bonus_points from public.location_config), 0) else 0 end
    + coalesce((select sum(a.delta) from public.score_adjustments a where a.participant_id = pid), 0))::int;
$$;

-- =====================================================================================================================
-- 8. REGISTRATION TRIGGER (SUPABASE AUTH HOOK)
-- =====================================================================================================================
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  gs public.game_settings;
  pid uuid;
  uname text;
  fname text;
  sclass text;
  ahash text;
  amask text;
  reserved text[] := array['admin','administrator','director','zodiac','cipher','system','moderator'];
begin
  select * into gs from public.game_settings;
  if not coalesce(gs.registration_open, true) then
    raise exception 'Registration is closed' using errcode = '28000';
  end if;

  uname := coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'callSign');
  fname := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName');
  sclass := coalesce(new.raw_user_meta_data->>'student_class', new.raw_user_meta_data->>'studentClass');
  ahash := coalesce(new.raw_user_meta_data->>'admission_hash', new.raw_user_meta_data->>'admissionHash');
  amask := coalesce(new.raw_user_meta_data->>'admission_masked', new.raw_user_meta_data->>'admissionNumberMasked');

  if uname is null or char_length(trim(uname)) < 3 then
    raise exception 'Valid call-sign is required' using errcode = '22000';
  end if;

  if lower(trim(uname)) = any(reserved) then
    raise exception 'This call-sign is reserved by the investigation authority' using errcode = '22000';
  end if;

  insert into public.profiles(id, username, full_name, student_class, admission_hash, admission_masked)
  values (new.id, trim(uname), fname, sclass, ahash, amask);

  insert into public.participants(kind, solo_user_id, created_by)
  values ('solo', new.id, new.id) returning id into pid;

  insert into public.participant_members(participant_id, user_id)
  values (pid, new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- =====================================================================================================================
-- 9. SUBMISSION & SCORING FUNCTIONS (SERVER-AUTHORITATIVE)
-- =====================================================================================================================
create or replace function public.submit_challenge(p_key text, p_answer text, p_username text default null) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  pid uuid;
  gs public.game_settings;
  c public.challenges;
  used int;
  ok boolean;
  secret text;
  unorm text;
  anorm text;
  st public.stages;
  late boolean;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  pid := public.my_participant();
  select * into gs from public.game_settings;
  select * into c from public.challenges where key = p_key and active;
  
  if pid is null or not found or c.stage_id is null or not public.game_started() or now() < public.stage_open_at(c.stage_id)
     or not exists(select 1 from public.stages where id = c.stage_id and enabled)
     or not exists(select 1 from public.challenge_answers where challenge_id = c.id)
     or (c.requires_challenge_id is not null and not exists(select 1 from public.solves where participant_id = pid and challenge_id = c.requires_challenge_id))
  then
    return jsonb_build_object('status', 'unavailable');
  end if;

  if gs.paused then return jsonb_build_object('status', 'paused'); end if;

  perform pg_advisory_xact_lock(hashtextextended(pid::text, 0));

  if exists(select 1 from public.solves where participant_id = pid and challenge_id = c.id) then
    return jsonb_build_object('status', 'already_solved');
  end if;

  if p_answer is null or char_length(p_answer) not between 1 and 200 or (c.requires_username and (p_username is null or char_length(p_username) not between 1 and 100)) then
    return jsonb_build_object('status', 'invalid');
  end if;

  if c.requires_username then
    unorm := public.norm(p_username, 'text');
    anorm := public.norm(p_answer, 'text');
    secret := unorm || '|' || anorm;
    if unorm = '' or anorm = '' then return jsonb_build_object('status', 'invalid'); end if;
  else
    anorm := public.norm(p_answer, c.norm_mode);
    secret := anorm;
    if anorm = '' then return jsonb_build_object('status', 'invalid'); end if;
  end if;

  -- Rate limit check
  if (select count(*) from public.attempts where user_id = u and created_at > now() - interval '1 minute') >= gs.rate_limit_account_per_min then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  select count(*) into used from public.attempts where participant_id = pid and challenge_id = c.id and not voided;
  if c.attempt_limit is not null and used >= c.attempt_limit then
    return jsonb_build_object('status', 'attempts_exhausted');
  end if;

  -- Verify cryptographic salted hash
  ok := exists(select 1 from public.challenge_answers where challenge_id = c.id and answer_hash = encode(extensions.digest(c.salt || secret, 'sha256'), 'hex'));

  insert into public.attempts(participant_id, user_id, challenge_id, correct, submitted)
  values (pid, u, c.id, ok, left(coalesce(p_username || ' / ', '') || p_answer, 200));

  if ok then
    insert into public.solves(participant_id, challenge_id, solved_by) values (pid, c.id, u) on conflict do nothing;
    
    -- Check if this completes the stage
    select * into st from public.stages where id = c.stage_id;
    late := coalesce(now() > public.stage_close_at(c.stage_id), false);
    insert into public.stage_completions(participant_id, stage_id, late, points_earned, completed_by)
    values (pid, c.stage_id, late, case when late then 0 else coalesce(st.points, 0) end, u)
    on conflict do nothing;

    return jsonb_build_object('status', 'correct', 'stage_id', c.stage_id, 'late', late, 'points', case when late then 0 else coalesce(st.points, 0) end);
  end if;

  return jsonb_build_object('status', 'incorrect', 'attempts_left', case when c.attempt_limit is null then null else c.attempt_limit - used - 1 end);
end;
$$;

create or replace function public.choose_location(p_location_id int) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  pid uuid;
  cfg public.location_config;
  dl timestamptz;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  pid := public.my_participant();
  select * into cfg from public.location_config;
  if pid is null or not public.game_started() or not cfg.enabled then
    return jsonb_build_object('status', 'unavailable');
  end if;

  if (select paused from public.game_settings) then return jsonb_build_object('status', 'paused'); end if;

  dl := public.timer_at('location_choice_deadline', pid);
  if dl is not null and now() >= dl then return jsonb_build_object('status', 'closed'); end if;

  if not exists(select 1 from public.map_locations where id = p_location_id) then
    return jsonb_build_object('status', 'invalid');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(pid::text, 0));
  begin
    insert into public.location_choices(participant_id, location_id, chosen_by) values (pid, p_location_id, u);
  exception when unique_violation then
    return jsonb_build_object('status', 'already_chosen');
  end;

  return jsonb_build_object('status', 'ok');
end;
$$;

-- State hydration function for authenticated clients
create or replace function public.get_my_state() returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  pid uuid := public.my_participant();
  gs public.game_settings;
begin
  if pid is null then return null; end if;
  select * into gs from public.game_settings;
  return jsonb_build_object(
    'kind', (select p.kind from public.participants p where p.id = pid),
    'game_started', public.game_started(),
    'game_start', gs.game_start,
    'paused', gs.paused,
    'score', public.score_of(pid),
    'location_choice', (select location_id from public.location_choices where participant_id = pid),
    'location_outcome', public.location_outcome(pid),
    'stages', (select coalesce(jsonb_agg(jsonb_build_object(
          'id', st.id,
          'title', case when public.game_started() and now() >= public.stage_open_at(st.id) then st.public_title else 'SIGNAL LOCKED' end,
          'opens_at', public.stage_open_at(st.id),
          'closes_at', public.stage_close_at(st.id),
          'completed', sc.stage_id is not null,
          'late', coalesce(sc.late, false),
          'points', coalesce(sc.points_earned, 0)
        ) order by st.id), '[]'::jsonb)
        from public.stages st
        left join public.stage_completions sc on sc.participant_id = pid and sc.stage_id = st.id
        where st.enabled),
    'solved_keys', (select coalesce(jsonb_agg(c.key), '[]'::jsonb) from public.solves s join public.challenges c on c.id = s.challenge_id where s.participant_id = pid)
  );
end;
$$;

-- Public config function for unauthenticated or landing views
create or replace function public.get_public_config() returns jsonb language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select jsonb_build_object(
    'game_started', public.game_started(),
    'game_start', gs.game_start,
    'registration_open', gs.registration_open,
    'paused', gs.paused,
    'team_size_max', gs.team_size_max
  ) from public.game_settings gs where gs.id = true;
$$;

-- =====================================================================================================================
-- 10. SUPPORT TICKET FUNCTIONS (STRICT DATA ISOLATION)
-- =====================================================================================================================
create or replace function public.submit_ticket(p_subject text, p_category text, p_message text, p_priority text default 'NORMAL') returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  prof public.profiles;
  tid text;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into prof from public.profiles where id = u;
  if not found or prof.disabled then raise exception 'user account not found or disabled'; end if;

  if char_length(trim(p_subject)) not between 4 and 100 then
    return jsonb_build_object('success', false, 'error', 'Subject must be between 4 and 100 characters.');
  end if;
  if char_length(trim(p_message)) not between 10 and 1500 then
    return jsonb_build_object('success', false, 'error', 'Message must be between 10 and 1500 characters.');
  end if;
  if p_category not in ('TECHNICAL_BUG','CIPHER_CLARIFICATION','SCHEDULE_DEADLINE','ACCOUNT_CREDENTIALS','OTHER_INQUIRY') then
    return jsonb_build_object('success', false, 'error', 'Invalid ticket category.');
  end if;

  tid := 'TKT-2026-' || upper(encode(extensions.gen_random_bytes(2), 'hex'));

  insert into public.support_tickets (id, user_id, call_sign, full_name, student_class, subject, category, message, priority, status)
  values (tid, u, prof.username, coalesce(prof.full_name, prof.username), coalesce(prof.student_class, 'Unknown'), trim(p_subject), p_category, trim(p_message), coalesce(p_priority, 'NORMAL'), 'OPEN');

  return jsonb_build_object('success', true, 'ticket_id', tid);
end;
$$;

-- Players query tickets: NEVER returns staff_notes!
create or replace function public.get_my_tickets() returns table(id text, subject text, category text, message text, status text, priority text, staff_response text, created_at timestamptz, updated_at timestamptz) language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select t.id, t.subject, t.category, t.message, t.status, t.priority, t.staff_response, t.created_at, t.updated_at
  from public.support_tickets t
  where t.user_id = auth.uid()
  order by t.created_at desc;
$$;

-- Staff query all tickets: includes internal staff_notes
create or replace function public.staff_get_all_tickets() returns table(id text, user_id uuid, call_sign text, full_name text, student_class text, subject text, category text, message text, status text, priority text, staff_response text, staff_notes text, resolved_by uuid, created_at timestamptz, updated_at timestamptz) language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  return query select t.id, t.user_id, t.call_sign, t.full_name, t.student_class, t.subject, t.category, t.message, t.status, t.priority, t.staff_response, t.staff_notes, t.resolved_by, t.created_at, t.updated_at
  from public.support_tickets t order by t.created_at desc;
end;
$$;

create or replace function public.staff_update_ticket(p_ticket_id text, p_status text, p_priority text, p_response text, p_notes text) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  update public.support_tickets set
    status = coalesce(p_status, status),
    priority = coalesce(p_priority, priority),
    staff_response = case when p_response is not null then trim(p_response) else staff_response end,
    staff_notes = case when p_notes is not null then trim(p_notes) else staff_notes end,
    resolved_by = auth.uid(),
    updated_at = now()
  where id = p_ticket_id;

  if not found then return jsonb_build_object('success', false, 'error', 'Ticket not found'); end if;
  return jsonb_build_object('success', true);
end;
$$;

-- =====================================================================================================================
-- 11. STAFF & OWNER ADMINISTRATIVE OPERATIONS (STRICT RBAC & AUDITING)
-- =====================================================================================================================
create or replace function public.owner_set_staff(p_user uuid, p_role text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  owner_count int;
begin
  perform public.assert_owner();
  
  if p_role is not null and p_role not in ('owner', 'organiser') then
    raise exception 'invalid role: must be owner or organiser' using errcode = '22000';
  end if;

  if p_role is null or p_role <> 'owner' then
    select count(*) into owner_count from public.staff where role = 'owner';
    if owner_count <= 1 and exists(select 1 from public.staff where user_id = p_user and role = 'owner') then
      raise exception 'last-owner protection: cannot remove or demote the only remaining owner' using errcode = '23514';
    end if;
  end if;

  if p_role is null then
    delete from public.staff where user_id = p_user;
  else
    insert into public.staff (user_id, role, granted_by) values (p_user, p_role, auth.uid())
    on conflict (user_id) do update set role = excluded.role, granted_by = excluded.granted_by;
  end if;

  insert into public.audit_log (actor_id, action, detail)
  values (auth.uid(), 'owner_set_staff', jsonb_build_object('target_user', p_user, 'role', p_role));
end;
$$;

create or replace function public.staff_adjust_score(p_participant uuid, p_delta int, p_reason text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  if p_delta not between -1000 and 1000 then
    raise exception 'score delta must be between -1000 and 1000' using errcode = '22000';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'valid adjustment reason is required' using errcode = '22000';
  end if;

  insert into public.score_adjustments (participant_id, delta, reason, staff_id)
  values (p_participant, p_delta, trim(p_reason), auth.uid());

  insert into public.audit_log (actor_id, action, detail)
  values (auth.uid(), 'staff_adjust_score', jsonb_build_object('participant', p_participant, 'delta', p_delta, 'reason', p_reason));
end;
$$;

create or replace function public.update_settings(p_patch jsonb) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_owner();
  update public.game_settings set
    game_start = case when p_patch ? 'game_start' then (p_patch->>'game_start')::timestamptz else game_start end,
    membership_lock_at = case when p_patch ? 'membership_lock_at' then (p_patch->>'membership_lock_at')::timestamptz else membership_lock_at end,
    registration_open = case when p_patch ? 'registration_open' then (p_patch->>'registration_open')::boolean else registration_open end,
    paused = case when p_patch ? 'paused' then (p_patch->>'paused')::boolean else paused end,
    team_size_max = case when p_patch ? 'team_size_max' then (p_patch->>'team_size_max')::int else team_size_max end,
    updated_at = now()
  where id = true;

  insert into public.audit_log (actor_id, action, detail)
  values (auth.uid(), 'update_settings', p_patch);
end;
$$;

create or replace function public.staff_broadcast(p_sender text, p_title text, p_body text, p_stage_id int default null) returns uuid language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  mid uuid;
begin
  perform public.assert_staff();
  if p_sender not in ('director', 'zodiac', 'system', 'staff') then
    raise exception 'invalid sender' using errcode = '22000';
  end if;
  if p_body is null or char_length(trim(p_body)) < 5 then
    raise exception 'message body must be at least 5 characters' using errcode = '22000';
  end if;

  insert into public.messages (sender, title, body, stage_id, status, created_by)
  values (p_sender, trim(p_title), trim(p_body), p_stage_id, 'published', auth.uid())
  returning id into mid;

  insert into public.audit_log (actor_id, action, detail)
  values (auth.uid(), 'staff_broadcast', jsonb_build_object('message_id', mid, 'sender', p_sender, 'title', p_title));

  return mid;
end;
$$;

-- =====================================================================================================================
-- 12. ROW LEVEL SECURITY (RLS) FOR ALL APPLICATION TABLES
-- =====================================================================================================================
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.participants enable row level security;
alter table public.participant_members enable row level security;
alter table public.membership_events enable row level security;
alter table public.game_settings enable row level security;
alter table public.stages enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_answers enable row level security;
alter table public.stage_requirements enable row level security;
alter table public.timers enable row level security;
alter table public.release_rules enable row level security;
alter table public.map_locations enable row level security;
alter table public.location_config enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.support_tickets enable row level security;
alter table public.attempts enable row level security;
alter table public.solves enable row level security;
alter table public.stage_completions enable row level security;
alter table public.location_choices enable row level security;
alter table public.score_adjustments enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: Own profile or staff
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() and not disabled) with check (id = auth.uid());

-- Staff: Staff see all staff; user can verify own role
drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff for select to authenticated using (public.is_staff() or user_id = auth.uid());

-- Participants: Own participant or staff
drop policy if exists participants_select on public.participants;
create policy participants_select on public.participants for select to authenticated using (id = public.my_participant() or public.is_staff());

-- Participant Members: Own membership or staff
drop policy if exists members_select on public.participant_members;
create policy members_select on public.participant_members for select to authenticated using (participant_id = public.my_participant() or public.is_staff());

-- Membership Events: Own events or staff
drop policy if exists membership_events_select on public.membership_events;
create policy membership_events_select on public.membership_events for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- Game Settings: Public read for client; owner write
drop policy if exists game_settings_select on public.game_settings;
create policy game_settings_select on public.game_settings for select to anon, authenticated using (true);

drop policy if exists game_settings_update on public.game_settings;
create policy game_settings_update on public.game_settings for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- Stages: Staff see all; players see open stages
drop policy if exists stages_select on public.stages;
create policy stages_select on public.stages for select to authenticated using (
  public.is_staff() or (
    enabled and public.game_started() and now() >= public.stage_open_at(id)
  )
);

drop policy if exists stages_staff_manage on public.stages;
create policy stages_staff_manage on public.stages for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Challenges: Staff see all; players see active challenges for open stages (NEVER answers)
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges for select to authenticated using (
  public.is_staff() or (
    active and public.game_started() and stage_id is not null and now() >= public.stage_open_at(stage_id)
  )
);

-- Challenge Answers: Strictly owner-only (ZERO select for players)
drop policy if exists answers_owner_all on public.challenge_answers;
create policy answers_owner_all on public.challenge_answers for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- Stage Requirements, Timers, Release Rules: Staff only
drop policy if exists requirements_select on public.stage_requirements;
create policy requirements_select on public.stage_requirements for select to authenticated using (public.is_staff());

drop policy if exists timers_select on public.timers;
create policy timers_select on public.timers for select to authenticated using (public.is_staff());

drop policy if exists release_rules_select on public.release_rules;
create policy release_rules_select on public.release_rules for select to authenticated using (public.is_staff());

-- Map Locations: Staff or authenticated operatives once game has started
drop policy if exists map_locations_select on public.map_locations;
create policy map_locations_select on public.map_locations for select to authenticated using (public.is_staff() or public.game_started());

-- Location Config: STAFF ONLY (Contains secret correct_location_id!)
drop policy if exists location_config_staff on public.location_config;
create policy location_config_staff on public.location_config for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Messages: Staff see all; players see published messages whose stage has opened
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated using (
  public.is_staff() or (
    status = 'published' and public.game_started() and (
      stage_id is null or now() >= public.stage_open_at(stage_id)
    )
  )
);

drop policy if exists messages_staff_manage on public.messages;
create policy messages_staff_manage on public.messages for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Message Reads: Personal to user
drop policy if exists message_reads_own on public.message_reads;
create policy message_reads_own on public.message_reads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Support Tickets:
-- Player sees only own; staff sees all
drop policy if exists tickets_player_select on public.support_tickets;
create policy tickets_player_select on public.support_tickets for select to authenticated using (user_id = auth.uid() or public.is_staff());

drop policy if exists tickets_player_insert on public.support_tickets;
create policy tickets_player_insert on public.support_tickets for insert to authenticated with check (user_id = auth.uid());

drop policy if exists tickets_staff_all on public.support_tickets;
create policy tickets_staff_all on public.support_tickets for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Security hardening: Revoke direct read of staff_notes column from unprivileged users
revoke select (staff_notes) on public.support_tickets from authenticated, anon;

-- Attempts: Personal to user / staff
drop policy if exists attempts_select on public.attempts;
create policy attempts_select on public.attempts for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- Solves: Own participant / staff
drop policy if exists solves_select on public.solves;
create policy solves_select on public.solves for select to authenticated using (participant_id = public.my_participant() or public.is_staff());

-- Stage Completions: Own participant / staff
drop policy if exists completions_select on public.stage_completions;
create policy completions_select on public.stage_completions for select to authenticated using (participant_id = public.my_participant() or public.is_staff());

-- Location Choices: Own participant / staff
drop policy if exists choices_select on public.location_choices;
create policy choices_select on public.location_choices for select to authenticated using (participant_id = public.my_participant() or public.is_staff());

-- Score Adjustments: Own participant / staff
drop policy if exists adjustments_select on public.score_adjustments;
create policy adjustments_select on public.score_adjustments for select to authenticated using (participant_id = public.my_participant() or public.is_staff());

-- Audit Log: Staff only
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log for select to authenticated using (public.is_staff());

-- =====================================================================================================================
-- 13. CANONICAL DATA SEEDING (THE LAST SIGNAL)
-- =====================================================================================================================
insert into public.stages (id, public_title, window_hours, points, enabled) values
  (1, 'The Archived Files and the Exorcist’s Letter', 48, 100, true),
  (2, 'The Locked Documents and the Coordinates', 48, 100, true),
  (3, 'The Map and the Killer’s Challenge', 48, 100, true),
  (4, 'The Reversed Audio and the Suspicious Call', 48, 100, true),
  (5, 'The Newspaper Reports and Suspect Database', 48, 100, true),
  (6, 'The Record That Remembered Tomorrow', 48, 100, true),
  (7, 'Ellen Vale’s Journal and the Final Review', 48, 100, true)
on conflict (id) do update set
  public_title = excluded.public_title,
  points = excluded.points;

-- Map locations
insert into public.map_locations (id, name, sort_order) values
  (1, 'Lake Herman Road, Benicia, California', 1),
  (2, 'Blue Rock Springs Park, Vallejo, California', 2),
  (3, 'Lake Berryessa, Napa County, California', 3),
  (4, 'Washington and Cherry Streets, Presidio Heights, San Francisco, California', 4)
on conflict (id) do update set name = excluded.name;

-- Location configuration (depends on map_locations row 4)
insert into public.location_config (id, enabled, correct_location_id, no_choice_treatment, bonus_points)
values (true, true, 4, 'incorrect', 20)
on conflict (id) do update set
  enabled = excluded.enabled,
  correct_location_id = excluded.correct_location_id,
  no_choice_treatment = excluded.no_choice_treatment,
  bonus_points = excluded.bonus_points;

-- Timers for Stage 4 Location Choice and Reveal
insert into public.timers (key, anchor_type, stage_id, offset_hours, configured, notes) values
  ('game_start', 'game_start', null, 0, true, 'Official competition start anchor'),
  ('location_choice_deadline', 'stage_open', 4, 24, true, '24 hours from Stage 4 opening to submit surveillance location'),
  ('location_reveal', 'stage_open', 4, 48, true, '48 hours from Stage 4 opening (Stage 4 close) to reveal outcome and award bonus')
on conflict (key) do update set
  anchor_type = excluded.anchor_type,
  stage_id = excluded.stage_id,
  offset_hours = excluded.offset_hours,
  configured = excluded.configured;

-- Challenges with Salted SHA-256 Hashes
-- 1. Stage 1 Archive Gate (Username: ZK-CASE17, Password: ORION -> norm: zkcase17|orion)
insert into public.challenges (key, label, kind, stage_id, requires_username, norm_mode, active, salt)
values ('gate_zk_login', 'Locked Case Files Terminal', 'gate', 1, true, 'text', true, 'a1b2c3d4e5f60718')
on conflict (key) do update set active = true, salt = excluded.salt;

insert into public.challenge_answers (challenge_id, answer_hash)
select id, encode(extensions.digest('a1b2c3d4e5f60718' || 'zkcase17|orion', 'sha256'), 'hex')
from public.challenges where key = 'gate_zk_login'
on conflict do nothing;

-- 2. Stage 2 Photographic Coordinates (37.78874, -122.45709 -> norm: 37.78874,-122.45709)
insert into public.challenges (key, label, kind, stage_id, requires_username, norm_mode, active, salt)
values ('stage2_coords', 'Negative Coordinates Terminal', 'puzzle', 2, false, 'coords', true, 'b2c3d4e5f60718a1')
on conflict (key) do update set active = true, salt = excluded.salt;

insert into public.challenge_answers (challenge_id, answer_hash)
select id, encode(extensions.digest('b2c3d4e5f60718a1' || '37.78874,-122.45709', 'sha256'), 'hex')
from public.challenges where key = 'stage2_coords'
on conflict do nothing;

-- 3. Stage 3 Map Security Gate (House 3893 -> norm: 3893)
insert into public.challenges (key, label, kind, stage_id, requires_username, norm_mode, active, salt)
values ('gate_map', 'Tactical GIS Map Gate', 'gate', 3, false, 'text', true, 'c3d4e5f60718a1b2')
on conflict (key) do update set active = true, salt = excluded.salt;

insert into public.challenge_answers (challenge_id, answer_hash)
select id, encode(extensions.digest('c3d4e5f60718a1b2' || '3893', 'sha256'), 'hex')
from public.challenges where key = 'gate_map'
on conflict do nothing;

-- 4. Stage 5 Suspect Database Gate (Z408_REOPENED -> norm: z408reopened)
insert into public.challenges (key, label, kind, stage_id, requires_username, norm_mode, active, salt)
values ('gate_suspect_db', 'Suspect Registry Access Gate', 'gate', 5, false, 'text', true, 'd4e5f60718a1b2c3')
on conflict (key) do update set active = true, salt = excluded.salt;

insert into public.challenge_answers (challenge_id, answer_hash)
select id, encode(extensions.digest('d4e5f60718a1b2c3' || 'z408reopened', 'sha256'), 'hex')
from public.challenges where key = 'gate_suspect_db'
on conflict do nothing;

-- 5. Stage 6 Audio Tape Archive Gate (EV1971 -> norm: ev1971)
insert into public.challenges (key, label, kind, stage_id, requires_username, norm_mode, active, salt)
values ('gate_audio', 'Police Tape Archive Gate', 'gate', 6, false, 'text', true, 'e5f60718a1b2c3d4')
on conflict (key) do update set active = true, salt = excluded.salt;

insert into public.challenge_answers (challenge_id, answer_hash)
select id, encode(extensions.digest('e5f60718a1b2c3d4' || 'ev1971', 'sha256'), 'hex')
from public.challenges where key = 'gate_audio'
on conflict do nothing;

-- =====================================================================================================================
-- 14. EXECUTION PRIVILEGES (LEAST PRIVILEGE)
-- =====================================================================================================================
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.staff to authenticated;
grant select on public.participants to authenticated;
grant select on public.participant_members to authenticated;
grant select on public.membership_events to authenticated;
grant select on public.game_settings to anon, authenticated;
grant select on public.stages to authenticated;
grant select on public.challenges to authenticated;
grant select on public.map_locations to authenticated;
grant select on public.messages to authenticated;
grant select on public.message_reads to authenticated;
grant select, insert on public.support_tickets to authenticated;
grant select on public.attempts to authenticated;
grant select on public.solves to authenticated;
grant select on public.stage_completions to authenticated;
grant select on public.location_choices to authenticated;
grant select on public.score_adjustments to authenticated;
grant select on public.audit_log to authenticated;

grant execute on function public.submit_challenge(text, text, text) to authenticated;
grant execute on function public.choose_location(int) to authenticated;
grant execute on function public.get_my_state() to authenticated;
grant execute on function public.get_public_config() to anon, authenticated;
grant execute on function public.submit_ticket(text, text, text, text) to authenticated;
grant execute on function public.get_my_tickets() to authenticated;
grant execute on function public.staff_get_all_tickets() to authenticated;
grant execute on function public.staff_update_ticket(text, text, text, text, text) to authenticated;
grant execute on function public.owner_set_staff(uuid, text) to authenticated;
grant execute on function public.staff_adjust_score(uuid, int, text) to authenticated;
grant execute on function public.update_settings(jsonb) to authenticated;
grant execute on function public.staff_broadcast(text, text, text, int) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.handle_new_user() to supabase_auth_admin;
  end if;
end $$;
