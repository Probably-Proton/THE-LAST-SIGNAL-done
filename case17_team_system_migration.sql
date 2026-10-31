-- =====================================================================================================================
-- THE LAST SIGNAL (CASE TLS-0017) — COMPLETE TEAM MANAGEMENT SYSTEM MIGRATION
-- File: case17_team_system_migration.sql
-- Description: Authoritative team creation, validation, membership enforcement, and join RPCs for Supabase PostgreSQL.
--
-- IMPORTANT DEPLOYMENT INSTRUCTIONS:
-- 1. DO NOT reset, truncate, or drop existing tables or user progress.
-- 2. Open your Supabase Dashboard -> SQL Editor -> New Query.
-- 3. Paste and run this script. It is idempotent (safe to run multiple times).
-- 4. Preserves all existing stage overrides, leaderboard exclusions, submissions, and profiles.
-- =====================================================================================================================

-- 0. Ensure crypto extension is available for secure invite codes
create extension if not exists pgcrypto with schema extensions;

-- =====================================================================================================================
-- 1. TABLES & CONSTRAINTS VERIFICATION (Idempotent)
-- =====================================================================================================================

-- Ensure membership_events table exists for audit logging and join attempt rate limiting
create table if not exists public.membership_events (
  id bigserial primary key,
  user_id uuid references public.profiles on delete set null,
  participant_id uuid references public.participants on delete set null,
  action text not null,
  actor_id uuid references public.profiles on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

-- Ensure indexes for fast lookups and rate limiting
create index if not exists idx_membership_events_rate_limit on public.membership_events (user_id, action, created_at desc);
create index if not exists idx_participants_invite_code on public.participants (upper(invite_code)) where kind = 'team';
create unique index if not exists one_active_membership on public.participant_members (user_id) where left_at is null;

-- =====================================================================================================================
-- 2. HELPER FUNCTIONS
-- =====================================================================================================================

-- Checks if a participant has already made non-reversible game progress
create or replace function public.participant_has_progress(p_participant_id uuid)
returns boolean language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  has_prog boolean := false;
begin
  if p_participant_id is null then return false; end if;

  -- 1. Check solves if table exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'solves') then
    execute 'select exists(select 1 from public.solves where participant_id = $1)' into has_prog using p_participant_id;
    if has_prog then return true; end if;
  end if;

  -- 2. Check stage_completions if table exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'stage_completions') then
    execute 'select exists(select 1 from public.stage_completions where participant_id = $1)' into has_prog using p_participant_id;
    if has_prog then return true; end if;
  end if;

  -- 3. Check location_choices if table exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'location_choices') then
    execute 'select exists(select 1 from public.location_choices where participant_id = $1)' into has_prog using p_participant_id;
    if has_prog then return true; end if;
  end if;

  -- 4. Check submissions if table exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'submissions') then
    execute 'select exists(select 1 from public.submissions where participant_id = $1 and coalesce(score_awarded, 0) > 0)' into has_prog using p_participant_id;
    if has_prog then return true; end if;
  end if;

  return false;
end;
$$;

-- Checks if team formation / membership changes are currently allowed
create or replace function public.membership_open()
returns boolean language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  is_open boolean := true;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'game_settings') then
    execute 'select coalesce(now() < coalesce(membership_lock_at, game_start), true) from public.game_settings limit 1' into is_open;
    return coalesce(is_open, true);
  end if;
  return true;
end;
$$;

-- =====================================================================================================================
-- 3. RPC: CREATE TEAM (create_team)
-- Creates an authoritative team participant record, assigns unpredictable invite code,
-- retires previous solo participant, and enlists creator as active member.
-- =====================================================================================================================
create or replace function public.create_team(p_name text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  clean_name text;
  cur public.participants;
  tid uuid;
  code text;
  n int := 0;
begin
  -- 1. Authentication check
  if u is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- 2. Lock profile row to prevent concurrent race conditions
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    perform 1 from public.profiles where id = u for update;
  end if;

  -- 3. Deadline check
  if not public.membership_open() then
    return jsonb_build_object('status', 'locked', 'error', 'Team registration window has closed.');
  end if;

  -- 4. Name validation
  clean_name := trim(p_name);
  if clean_name is null or char_length(clean_name) not between 3 and 40 or lower(clean_name) in (
    'admin','administrator','director','zodiac','cipher','organiser','organizer','system','moderator','owner','staff'
  ) then
    return jsonb_build_object('status', 'invalid_name', 'error', 'Designation must be between 3 and 40 characters and cannot use reserved terms.');
  end if;

  -- 5. Existing membership check
  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null;

  if not found then
    -- User had no active participant, ensure solo record is created first or proceed
    null;
  elsif cur.kind <> 'solo' then
    return jsonb_build_object('status', 'already_in_team', 'error', 'You are already registered with an active unit.');
  elsif public.participant_has_progress(cur.id) then
    return jsonb_build_object('status', 'progress_exists', 'error', 'Units cannot be created after solo investigations have recorded score or puzzle progress.');
  end if;

  -- 6. Check unique team name (case-insensitive)
  if exists (select 1 from public.participants where kind = 'team' and lower(trim(name)) = lower(clean_name) and not retired) then
    return jsonb_build_object('status', 'name_taken', 'error', 'A unit with this designation already exists.');
  end if;

  -- 7. Allocate unique, unpredictable invite code (TLS-XXXXXX format)
  loop
    code := 'TLS-' || upper(encode(extensions.gen_random_bytes(3), 'hex'));
    begin
      insert into public.participants(kind, name, invite_code, created_by)
      values ('team', clean_name, code, u)
      returning id into tid;
      exit;
    exception when unique_violation then
      n := n + 1;
      if n >= 10 then
        raise exception 'Could not generate a unique invite code after repeated attempts.';
      end if;
    end;
  end loop;

  -- 8. Retire previous solo membership
  if cur.id is not null then
    update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
    update public.participants set retired = true where id = cur.id;
  end if;

  -- 9. Insert new team membership
  insert into public.participant_members(participant_id, user_id, joined_at)
  values (tid, u, now());

  -- 10. Log audit event
  insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
  values (u, tid, 'create_team', u, 'Formed unit ' || clean_name);

  if cur.id is not null then
    insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
    values (u, cur.id, 'retire_solo', u, 'Switched from solo to team ' || clean_name);
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'team_id', tid,
    'name', clean_name,
    'invite_code', code
  );
end;
$$;

-- =====================================================================================================================
-- 4. RPC: JOIN TEAM (join_team)
-- Validates invite code against Supabase, enforces team size cap and progress rules,
-- retires solo participant, and persists membership.
-- =====================================================================================================================
create or replace function public.join_team(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  clean_code text;
  cur public.participants;
  t public.participants;
  v_max_size int := 5;
  cur_member_count int;
  failed_attempts int;
begin
  -- 1. Authentication check
  if u is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- 2. Lock profile row
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    perform 1 from public.profiles where id = u for update;
  end if;

  -- 3. Deadline check
  if not public.membership_open() then
    return jsonb_build_object('status', 'locked', 'error', 'Team changes are locked after the launch deadline.');
  end if;

  -- 4. Rate-limit brute-force join code guessing (max 10 failed joins in 10 minutes)
  select count(*) into failed_attempts
  from public.membership_events
  where user_id = u and action = 'failed_join' and created_at > now() - interval '10 minutes';

  if failed_attempts >= 10 then
    return jsonb_build_object('status', 'too_many_attempts', 'error', 'Too many invalid join attempts. Please wait 10 minutes before retrying.');
  end if;

  -- 5. Existing membership check
  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null;

  if found and cur.kind <> 'solo' then
    return jsonb_build_object('status', 'already_in_team', 'error', 'You are already in an active team. Leave your current unit before joining another.');
  end if;

  if found and public.participant_has_progress(cur.id) then
    return jsonb_build_object('status', 'progress_exists', 'error', 'You cannot join a team after starting solo investigations with recorded progress.');
  end if;

  -- 6. Lookup team by invite code (handles raw code or TLS- prefixed code case-insensitively)
  clean_code := upper(trim(p_code));
  if clean_code is null or clean_code = '' then
    return jsonb_build_object('status', 'invalid_code', 'error', 'Please enter a valid team invite code.');
  end if;

  select * into t
  from public.participants
  where kind = 'team'
    and not retired
    and (
      upper(invite_code) = clean_code
      or upper(invite_code) = 'TLS-' || clean_code
      or ('TLS-' || upper(invite_code)) = clean_code
    )
  for update;

  if not found then
    insert into public.membership_events(user_id, action, actor_id, reason)
    values (u, 'failed_join', u, 'Invalid code: ' || left(clean_code, 15));
    return jsonb_build_object('status', 'invalid_code', 'error', 'No active unit found with this invite code. Verify the code with your team lead.');
  end if;

  -- 7. Team capacity check (reads team_size_max from game_settings or defaults to 5)
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'game_settings' and column_name = 'team_size_max') then
    execute 'select coalesce((select team_size_max from public.game_settings limit 1), 5)' into v_max_size;
  end if;

  select count(*) into cur_member_count
  from public.participant_members
  where participant_id = t.id and left_at is null;

  if cur_member_count >= v_max_size then
    return jsonb_build_object('status', 'team_full', 'error', 'This unit has reached maximum operative capacity (' || v_max_size || ' investigators).');
  end if;

  -- 8. Retire previous solo participant
  if cur.id is not null then
    update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
    update public.participants set retired = true where id = cur.id;
  end if;

  -- 9. Insert or reactivate team membership
  insert into public.participant_members(participant_id, user_id, joined_at, left_at)
  values (t.id, u, now(), null)
  on conflict (participant_id, user_id)
  do update set left_at = null, joined_at = now();

  -- 10. Audit event
  insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
  values (u, t.id, 'join', u, 'Joined unit ' || t.name);

  return jsonb_build_object(
    'status', 'ok',
    'team_id', t.id,
    'name', t.name,
    'invite_code', t.invite_code
  );
end;
$$;

-- =====================================================================================================================
-- 5. RPC: LEAVE TEAM (leave_team)
-- Removes user from team, re-activates or re-creates solo participant,
-- and disbands the team if 0 members remain.
-- =====================================================================================================================
create or replace function public.leave_team()
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  cur public.participants;
  solo_id uuid;
  active_members_left int;
begin
  -- 1. Authentication check
  if u is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- 2. Lock profile row
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    perform 1 from public.profiles where id = u for update;
  end if;

  -- 3. Deadline check
  if not public.membership_open() then
    return jsonb_build_object('status', 'locked', 'error', 'Team rosters are locked after game start. Contact staff for roster changes.');
  end if;

  -- 4. Active team check
  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null;

  if not found or cur.kind <> 'team' then
    return jsonb_build_object('status', 'not_in_team', 'error', 'You are not currently in an active unit.');
  end if;

  -- 5. Progress check: prevent leaving if team already solved puzzles
  if public.participant_has_progress(cur.id) then
    return jsonb_build_object('status', 'team_has_progress', 'error', 'Cannot depart a unit after team investigations have recorded progress.');
  end if;

  -- 6. Mark team membership left
  update public.participant_members
  set left_at = now()
  where participant_id = cur.id and user_id = u;

  -- 7. Restore or create solo participant
  select id into solo_id from public.participants where solo_user_id = u;
  if solo_id is not null then
    update public.participants set retired = false where id = solo_id;
    insert into public.participant_members(participant_id, user_id, joined_at, left_at)
    values (solo_id, u, now(), null)
    on conflict (participant_id, user_id)
    do update set left_at = null, joined_at = now();
  else
    insert into public.participants(kind, solo_user_id, created_by, retired)
    values ('solo', u, u, false)
    returning id into solo_id;

    insert into public.participant_members(participant_id, user_id, joined_at)
    values (solo_id, u, now());
  end if;

  -- 8. If team now has no active members, mark it retired (disbanded)
  select count(*) into active_members_left
  from public.participant_members
  where participant_id = cur.id and left_at is null;

  if active_members_left = 0 then
    update public.participants set retired = true where id = cur.id;
    insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
    values (u, cur.id, 'disband', u, 'All members departed unit');
  end if;

  -- 9. Audit event
  insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
  values (u, cur.id, 'leave', u, 'Departed unit ' || cur.name);

  return jsonb_build_object('status', 'ok', 'message', 'Reverted to solo operative.');
end;
$$;

-- =====================================================================================================================
-- 6. RPC: GET MY TEAM (get_my_team)
-- Fetches full active team dossier, members roster, creator status, and capacity.
-- =====================================================================================================================
create or replace function public.get_my_team()
returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  pid uuid;
  t public.participants;
  v_max int := 5;
  v_open boolean := true;
  members_list jsonb := '[]'::jsonb;
begin
  if u is null then return null; end if;

  -- Find active participant id
  select m.participant_id into pid
  from public.participant_members m
  where m.user_id = u and m.left_at is null
  limit 1;

  if pid is null then return null; end if;

  select * into t from public.participants where id = pid and kind = 'team' and not retired;
  if not found then return null; end if;

  v_open := public.membership_open();

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'game_settings' and column_name = 'team_size_max') then
    execute 'select coalesce((select team_size_max from public.game_settings limit 1), 5)' into v_max;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'call_sign', coalesce(p.username, 'OPERATIVE-' || substring(m.user_id::text, 1, 6)),
        'full_name', coalesce(p.full_name, p.username, 'Investigator'),
        'is_creator', m.user_id = t.created_by,
        'joined_at', m.joined_at
      ) order by m.joined_at
    ),
    '[]'::jsonb
  ) into members_list
  from public.participant_members m
  left join public.profiles p on p.id = m.user_id
  where m.participant_id = t.id and m.left_at is null;

  return jsonb_build_object(
    'name', t.name,
    'invite_code', t.invite_code,
    'is_creator', t.created_by = u,
    'max_size', v_max,
    'membership_open', v_open,
    'members', members_list
  );
end;
$$;

-- =====================================================================================================================
-- 7. RPC: ROTATE INVITE CODE (rotate_invite_code)
-- Allows the designated team creator to cycle the invite code if compromised.
-- =====================================================================================================================
create or replace function public.rotate_invite_code()
returns text language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  pid uuid;
  t public.participants;
  new_code text;
  n int := 0;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;

  select m.participant_id into pid
  from public.participant_members m
  where m.user_id = u and m.left_at is null
  limit 1;

  select * into t from public.participants where id = pid and kind = 'team' and created_by = u and not retired;
  if not found then
    raise exception 'Only the team creator can rotate the invite code.';
  end if;

  loop
    new_code := 'TLS-' || upper(encode(extensions.gen_random_bytes(3), 'hex'));
    begin
      update public.participants set invite_code = new_code where id = t.id;
      exit;
    exception when unique_violation then
      n := n + 1;
      if n >= 10 then raise exception 'Could not generate unique invite code.'; end if;
    end;
  end loop;

  insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
  values (u, t.id, 'rotate_code', u, 'Invite code rotated to ' || new_code);

  return new_code;
end;
$$;

-- =====================================================================================================================
-- 8. PERMISSIONS & GRANTS
-- =====================================================================================================================
grant execute on function public.create_team(text) to authenticated, service_role;
grant execute on function public.join_team(text) to authenticated, service_role;
grant execute on function public.leave_team() to authenticated, service_role;
grant execute on function public.get_my_team() to authenticated, service_role;
grant execute on function public.rotate_invite_code() to authenticated, service_role;
grant execute on function public.participant_has_progress(uuid) to authenticated, service_role;
grant execute on function public.membership_open() to anon, authenticated, service_role;

-- =====================================================================================================================
-- 8b. RPC: GET LEADERBOARD (get_leaderboard)
-- Authoritative intelligence leaderboard function for Supabase PostgreSQL.
-- Strictly filters out excluded testing/staff accounts and handles team vs solo participants.
-- =====================================================================================================================
create or replace function public.get_leaderboard(p_kind text default 'all')
returns table(
  pos bigint,
  name text,
  kind text,
  score int,
  stages_completed int,
  current_stage int,
  completion_pct int,
  last_progress timestamptz
)
language sql stable security definer
set search_path = public, extensions, pg_temp as $$
  with s as (
    select
      coalesce(p.name, pr.username) as nm,
      p.kind as kd,
      public.score_of(p.id) as sc,
      coalesce((select count(*)::int from public.stage_completions c where c.participant_id = p.id), 0) as n,
      greatest(
        (select max(v.solved_at) from public.solves v where v.participant_id = p.id),
        (select max(c2.completed_at) from public.stage_completions c2 where c2.participant_id = p.id)
      ) as lp
    from public.participants p
    left join public.profiles pr on pr.id = p.solo_user_id
    where not p.retired
      and not p.exclude_from_leaderboard
      and not coalesce(pr.exclude_from_leaderboard, false)
      and (p_kind = 'all' or p.kind = p_kind)
      and (
        p.kind = 'team' or (
          not coalesce(pr.disabled, false)
          and not exists (select 1 from public.staff st where st.user_id = p.solo_user_id)
        )
      )
  )
  select
    rank() over (order by s.sc desc, s.n desc, s.lp asc nulls last, s.nm asc) as pos,
    s.nm as name,
    s.kd as kind,
    s.sc as score,
    s.n as stages_completed,
    least(7, s.n + 1) as current_stage,
    round((s.n::numeric / 7.0) * 100)::int as completion_pct,
    s.lp as last_progress
  from s
  order by 1, 2;
$$;

grant execute on function public.get_leaderboard(text) to anon, authenticated, service_role;

-- =====================================================================================================================
-- 9. VERIFICATION QUERIES (Run these in SQL Editor to verify installation)
-- =====================================================================================================================
-- 1. Check all team functions exist:
-- select routine_name, routine_type from information_schema.routines
-- where routine_schema = 'public' and routine_name in ('create_team', 'join_team', 'leave_team', 'get_my_team', 'rotate_invite_code');
--
-- 2. Verify table indexes:
-- select indexname, tablename from pg_indexes
-- where schemaname = 'public' and indexname in ('one_active_membership', 'idx_participants_invite_code', 'idx_membership_events_rate_limit');
--
-- 3. Check existing teams count:
-- select count(*) as total_teams from public.participants where kind = 'team';
-- =====================================================================================================================
