-- =====================================================================================================================
-- THE LAST SIGNAL (CASE TLS-0017) — AUTHORITATIVE PRODUCTION REPAIR MIGRATION
--
-- This script contains complete, executable CREATE OR REPLACE FUNCTION definitions to fix:
-- 1. PL/pgSQL FOUND variable bug in submit_challenge() by capturing FOUND immediately into v_challenge_found.
-- 2. Dual Stage Release Condition: PREVIOUS_STAGE_COMPLETED AND CURRENT_TIME >= RELEASE_TIMESTAMP.
-- 3. Team invite-code joining: normalization (with/without TLS-), membership_open() deadline fix,
--    safe closure of previous solo membership before inserting team membership, and check constraint safety.
-- 4. Authoritative leaderboard calculation reading stage_completions (points_earned, stage_id) and score_of().
-- 5. Safe statuses only: never leaking expected answers in any return value.
-- =====================================================================================================================

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. HELPER: membership_open()
-- Returns true unless an explicit membership_lock_at deadline has been configured in game_settings and passed.
-- Does NOT incorrectly lock at game_start when membership_lock_at is NULL.
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.membership_open()
returns boolean language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  is_open boolean := true;
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'game_settings') then
    execute 'select coalesce(membership_lock_at is null or now() < membership_lock_at, true) from public.game_settings limit 1' into is_open;
    return coalesce(is_open, true);
  end if;
  return true;
end;
$$;

grant execute on function public.membership_open() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. HELPER: calculate_participant_score(p_participant_id)
-- Authoritative score wrapper delegating to canonical score_of() function.
-- Resolves the missing column "score_awarded" defect.
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.calculate_participant_score(p_participant_id uuid)
returns int language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select coalesce(public.score_of(p_participant_id), 0);
$$;

grant execute on function public.calculate_participant_score(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. RPC: join_team(p_code text)
-- Fixes team invite-code joining:
-- - Normalizes input case-insensitively, handling raw code or TLS- prefix.
-- - Verifies active, non-retired team status.
-- - Enforces team size cap (team_size_max, default 5).
-- - Retires previous solo membership FIRST to satisfy unique index one_active_membership.
-- - Inserts or reactivates team membership using ON CONFLICT (participant_id, user_id).
-- - Records membership audit event with permitted check action 'join'.
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.join_team(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  raw_code text;
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
    return jsonb_build_object('status', 'locked', 'error', 'Team changes are locked after the deadline.');
  end if;

  -- 4. Rate-limit brute-force join code guessing (max 10 failed joins in 10 minutes)
  select count(*) into failed_attempts
  from public.membership_events
  where user_id = u and action = 'failed_join' and created_at > now() - interval '10 minutes';

  if failed_attempts >= 10 then
    return jsonb_build_object('status', 'too_many_attempts', 'error', 'Too many invalid join attempts. Please wait 10 minutes before retrying.');
  end if;

  -- 5. Existing active team check
  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null;

  if found and cur.kind <> 'solo' then
    return jsonb_build_object('status', 'already_in_team', 'error', 'You are already assigned to an active unit.');
  end if;

  if found and public.participant_has_progress(cur.id) then
    return jsonb_build_object('status', 'progress_exists', 'error', 'Accounts with previous solo progression cannot join an existing team.');
  end if;

  -- 6. Lookup team by invite code (handles raw code or TLS- prefix case-insensitively)
  raw_code := upper(trim(p_code));
  if raw_code is null or raw_code = '' then
    return jsonb_build_object('status', 'invalid_code', 'error', 'Please enter a valid team invite code.');
  end if;

  select * into t
  from public.participants
  where kind = 'team'
    and not retired
    and (
      upper(trim(invite_code)) = raw_code
      or upper(trim(invite_code)) = 'TLS-' || raw_code
      or 'TLS-' || upper(trim(invite_code)) = raw_code
      or regexp_replace(upper(trim(invite_code)), '^TLS-', '') = regexp_replace(raw_code, '^TLS-', '')
    )
  for update;

  if not found then
    insert into public.membership_events(user_id, action, actor_id, reason)
    values (u, 'failed_join', u, 'Invalid invite code: ' || left(raw_code, 20));
    return jsonb_build_object('status', 'invalid_code', 'error', 'Invalid team invite code. Please check the code with your team lead.');
  end if;

  -- 7. Team capacity check (reads team_size_max or defaults to 5)
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'game_settings' and column_name = 'team_size_max') then
    execute 'select coalesce((select team_size_max from public.game_settings limit 1), 5)' into v_max_size;
  end if;

  select count(*) into cur_member_count
  from public.participant_members
  where participant_id = t.id and left_at is null;

  if cur_member_count >= v_max_size then
    return jsonb_build_object('status', 'team_full', 'error', 'This unit has reached maximum operative capacity (' || v_max_size || ' investigators).');
  end if;

  -- 8. Retire previous solo membership FIRST to satisfy one_active_membership unique index
  if cur.id is not null then
    update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
    update public.participants set retired = true where id = cur.id;
  end if;

  -- 9. Insert or reactivate team membership
  insert into public.participant_members(participant_id, user_id, joined_at, left_at)
  values (t.id, u, now(), null)
  on conflict (participant_id, user_id)
  do update set left_at = null, joined_at = now();

  -- 10. Audit event (valid action is 'join')
  insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
  values (u, t.id, 'join', u, 'Enlisted in unit ' || t.name);

  return jsonb_build_object(
    'status', 'ok',
    'team_id', t.id,
    'name', t.name,
    'invite_code', t.invite_code
  );
end;
$$;

grant execute on function public.join_team(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. RPC: create_team(p_name text)
-- Creates a new team participant, generates a unique TLS-XXXXXX code, retires solo membership, and enlists creator.
-- ---------------------------------------------------------------------------------------------------------------------
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

  -- 2. Lock profile row
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    perform 1 from public.profiles where id = u for update;
  end if;

  -- 3. Deadline check
  if not public.membership_open() then
    return jsonb_build_object('status', 'locked', 'error', 'Team changes are locked after the deadline.');
  end if;

  -- 4. Validate name
  clean_name := trim(p_name);
  if clean_name is null or char_length(clean_name) not between 3 and 40 then
    return jsonb_build_object('status', 'invalid_name', 'error', 'Team name must be between 3 and 40 characters.');
  end if;

  if exists(select 1 from public.participants where kind = 'team' and not retired and lower(name) = lower(clean_name)) then
    return jsonb_build_object('status', 'name_taken', 'error', 'A tactical unit with this designation already exists.');
  end if;

  -- 5. Existing active team check
  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null;

  if found and cur.kind <> 'solo' then
    return jsonb_build_object('status', 'already_in_team', 'error', 'You are already assigned to an active unit.');
  end if;

  if found and public.participant_has_progress(cur.id) then
    return jsonb_build_object('status', 'progress_exists', 'error', 'Accounts with previous solo progress cannot form a new team.');
  end if;

  -- 6. Generate unique invite code with TLS- prefix
  loop
    code := 'TLS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists(select 1 from public.participants where upper(invite_code) = code);
    n := n + 1;
    if n > 20 then
      raise exception 'Unable to generate unique invite code';
    end if;
  end loop;

  -- 7. Retire previous solo membership FIRST to satisfy one_active_membership index
  if cur.id is not null then
    update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
    update public.participants set retired = true where id = cur.id;
  end if;

  -- 8. Create new team participant
  insert into public.participants(kind, name, invite_code, created_by)
  values ('team', clean_name, code, u)
  returning id into tid;

  -- 9. Enlist creator into team
  insert into public.participant_members(participant_id, user_id, joined_at, left_at)
  values (tid, u, now(), null)
  on conflict (participant_id, user_id)
  do update set left_at = null, joined_at = now();

  -- 10. Log membership audit events
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

grant execute on function public.create_team(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 5. RPC: leave_team()
-- Leaves current team, re-enlists user as solo operative, and disbands team if 0 members remain.
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.leave_team()
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  cur public.participants;
  solo_id uuid;
  active_members_left int;
begin
  if u is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    perform 1 from public.profiles where id = u for update;
  end if;

  if not public.membership_open() then
    return jsonb_build_object('status', 'locked', 'error', 'Team changes are locked after the deadline.');
  end if;

  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null and p.kind = 'team';

  if not found then
    return jsonb_build_object('status', 'not_in_team', 'error', 'You are not currently in an active tactical unit.');
  end if;

  if public.participant_has_progress(cur.id) then
    return jsonb_build_object('status', 'team_has_progress', 'error', 'Cannot depart a unit with recorded investigation progress.');
  end if;

  update public.participant_members
  set left_at = now()
  where participant_id = cur.id and user_id = u;

  insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
  values (u, cur.id, 'leave', u, 'Departed unit ' || cur.name);

  select count(*) into active_members_left
  from public.participant_members
  where participant_id = cur.id and left_at is null;

  if active_members_left = 0 then
    update public.participants set retired = true where id = cur.id;
    insert into public.membership_events(user_id, participant_id, action, actor_id, reason)
    values (u, cur.id, 'disband', u, 'All members departed unit');
  end if;

  insert into public.participants(kind, solo_user_id, created_by)
  values ('solo', u, u)
  returning id into solo_id;

  insert into public.participant_members(participant_id, user_id, joined_at)
  values (solo_id, u, now());

  return jsonb_build_object(
    'status', 'ok',
    'message', 'Reverted to Solo Operative status.'
  );
end;
$$;

grant execute on function public.leave_team() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 6. RPC: get_my_team()
-- Returns active team details and member list for the current user.
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.get_my_team()
returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  pid uuid;
  t public.participants;
  v_max int := 5;
  v_open boolean := true;
  members_list jsonb;
begin
  if u is null then return null; end if;

  select m.participant_id into pid
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null and p.kind = 'team' and not p.retired
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

grant execute on function public.get_my_team() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 7. SUBMISSION PIPELINE: submit_challenge()
-- Fixes:
-- - Captured v_challenge_found := FOUND immediately after challenge lookup.
-- - Enforces DUAL STAGE RELEASE condition: PREVIOUS_STAGE_COMPLETED AND CURRENT_TIME >= RELEASE_TIMESTAMP.
-- - Preserves verified ADMIN overrides via participant_stage_overrides.
-- - Returns ONLY safe statuses: 'correct', 'incorrect', 'unavailable', 'rate_limited', 'attempts_exhausted', 'already_solved'.
-- - NEVER leaks expected answers or answer hints in responses.
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.submit_challenge(
  p_key text,
  p_answer text,
  p_username text default null
) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  pid uuid;
  gs public.game_settings;
  c public.challenges;
  v_challenge_found boolean := false;
  has_override boolean := false;
  is_prereq_completed boolean := false;
  used int;
  ok boolean;
  secret text;
  unorm text;
  anorm text;
  st public.stages;
  late boolean;
  v_pts int := 0;
begin
  -- 1. Authentication check
  if u is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- 2. Lookup participant
  pid := public.my_participant();
  if pid is null then
    return jsonb_build_object('status', 'unavailable');
  end if;

  -- 3. Lookup challenge and IMMEDIATELY capture FOUND in dedicated variable
  select * into c from public.challenges where key = p_key and active;
  v_challenge_found := FOUND;

  if not v_challenge_found or c.stage_id is null then
    return jsonb_build_object('status', 'unavailable');
  end if;

  -- 4. Load game settings and check pause
  select * into gs from public.game_settings limit 1;
  if gs.paused then
    return jsonb_build_object('status', 'paused');
  end if;

  -- 5. Check stage override for participant
  select coalesce(
    (select enabled from public.participant_stage_overrides where participant_id = pid limit 1),
    false
  ) into has_override;

  -- 6. Check Stage Prerequisite: Participant must have completed stage (c.stage_id - 1)
  if c.stage_id = 1 then
    is_prereq_completed := true;
  else
    select exists (
      select 1 from public.stage_completions
      where participant_id = pid and stage_id = c.stage_id - 1
    ) into is_prereq_completed;
  end if;

  -- 7. Enforce dual release condition:
  -- Access granted only if has_override OR (PREVIOUS_STAGE_COMPLETED AND CURRENT_TIME >= RELEASE_TIMESTAMP)
  if not has_override then
    if not public.game_started() then
      return jsonb_build_object('status', 'unavailable');
    end if;

    -- Condition 1: Preceding stage completed
    if not is_prereq_completed then
      return jsonb_build_object('status', 'unavailable');
    end if;

    -- Condition 2: Release timestamp reached
    if now() < public.stage_open_at(c.stage_id) then
      return jsonb_build_object('status', 'unavailable');
    end if;
  end if;

  -- 8. Verify stage is enabled and challenge answers exist
  if not exists(select 1 from public.stages where id = c.stage_id and enabled)
     or not exists(select 1 from public.challenge_answers where challenge_id = c.id)
     or (c.requires_challenge_id is not null and not exists(select 1 from public.solves where participant_id = pid and challenge_id = c.requires_challenge_id))
  then
    return jsonb_build_object('status', 'unavailable');
  end if;

  -- 9. Transaction advisory lock to prevent race conditions
  perform pg_advisory_xact_lock(hashtextextended(pid::text, 0));

  -- 10. Duplicate solve prevention
  if exists(select 1 from public.solves where participant_id = pid and challenge_id = c.id) then
    return jsonb_build_object('status', 'already_solved');
  end if;

  -- 11. Validate input formatting
  if p_answer is null or char_length(p_answer) not between 1 and 200
     or (c.requires_username and (p_username is null or char_length(p_username) not between 1 and 100))
  then
    return jsonb_build_object('status', 'invalid');
  end if;

  -- 12. Normalize answer
  if c.requires_username then
    unorm := public.norm(p_username, 'text');
    anorm := public.norm(p_answer, 'text');
    secret := unorm || '|' || anorm;
    if unorm = '' or anorm = '' then
      return jsonb_build_object('status', 'invalid');
    end if;
  else
    anorm := public.norm(p_answer, c.norm_mode);
    secret := anorm;
    if anorm = '' then
      return jsonb_build_object('status', 'invalid');
    end if;
  end if;

  -- 13. Rate limit check (account level)
  if (select count(*) from public.attempts where user_id = u and created_at > now() - interval '1 minute') >= coalesce(gs.rate_limit_account_per_min, 8) then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  -- 14. Attempt limits
  select count(*) into used from public.attempts where participant_id = pid and challenge_id = c.id and not voided;
  if c.attempt_limit is not null and used >= c.attempt_limit then
    return jsonb_build_object('status', 'attempts_exhausted');
  end if;

  -- 15. Verify cryptographic salted hash
  ok := exists(
    select 1 from public.challenge_answers
    where challenge_id = c.id
      and answer_hash = encode(extensions.digest(c.salt || secret, 'sha256'), 'hex')
  );

  -- Record attempt
  insert into public.attempts(participant_id, user_id, challenge_id, correct, submitted)
  values (pid, u, c.id, ok, left(coalesce(p_username || ' / ', '') || p_answer, 200));

  if ok then
    -- Record solve
    insert into public.solves(participant_id, challenge_id, solved_by)
    values (pid, c.id, u)
    on conflict do nothing;

    -- Award stage completion
    select * into st from public.stages where id = c.stage_id;
    late := coalesce(now() > public.stage_close_at(c.stage_id), false);
    v_pts := case when late then 0 else coalesce(st.points, 100) end;

    insert into public.stage_completions(participant_id, stage_id, late, points_earned, completed_by)
    values (pid, c.stage_id, late, v_pts, u)
    on conflict do nothing;

    return jsonb_build_object(
      'status', 'correct',
      'stage_id', c.stage_id,
      'late', late,
      'points', v_pts
    );
  end if;

  return jsonb_build_object(
    'status', 'incorrect',
    'attempts_left', case when c.attempt_limit is null then null else c.attempt_limit - used - 1 end
  );
end;
$$;

grant execute on function public.submit_challenge(text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 8. RPC: get_my_state()
-- Includes has_stage_override and release-aware stage locking enforcing dual release conditions.
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.get_my_state() returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  pid uuid := public.my_participant();
  gs public.game_settings;
  has_override boolean := false;
begin
  if pid is null then return null; end if;
  select * into gs from public.game_settings;
  
  select coalesce((select enabled from public.participant_stage_overrides where participant_id = pid limit 1), false) into has_override;

  return jsonb_build_object(
    'participant_id', pid,
    'kind', (select p.kind from public.participants p where p.id = pid),
    'game_started', public.game_started(),
    'game_start', gs.game_start,
    'paused', gs.paused,
    'has_stage_override', has_override,
    'score', public.score_of(pid),
    'location_choice', (select location_id from public.location_choices where participant_id = pid),
    'location_outcome', public.location_outcome(pid),
    'stages', (select coalesce(jsonb_agg(jsonb_build_object(
          'id', st.id,
          'title', case when has_override or (public.game_started() and (st.id = 1 or exists(select 1 from public.stage_completions sc_prev where sc_prev.participant_id = pid and sc_prev.stage_id = st.id - 1)) and now() >= public.stage_open_at(st.id)) then st.public_title else 'SIGNAL LOCKED' end,
          'opens_at', public.stage_open_at(st.id),
          'closes_at', public.stage_close_at(st.id),
          'completed', sc.stage_id is not null,
          'late', coalesce(sc.late, false),
          'points', coalesce(sc.points_earned, 0)
        ) order by st.id), '[]'::jsonb)
        from public.stages st
        left join public.stage_completions sc on sc.participant_id = pid and sc.stage_id = st.id
        where st.enabled)
  );
end;
$$;

grant execute on function public.get_my_state() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- 9. RPC: get_leaderboard(p_kind text default 'all')
-- Returns authoritative live ranks:
-- - Uses public.score_of(p.id) (resolves missing column "score_awarded" defect).
-- - Accurately counts stages_completed from public.stage_completions.
-- - Excludes retired participants and testing/ADMIN accounts with active overrides or exclude_from_leaderboard.
-- ---------------------------------------------------------------------------------------------------------------------
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
      coalesce(p.name, pr.username, 'Anonymous Operative') as nm,
      p.kind as kd,
      public.score_of(p.id) as sc,
      coalesce(
        (select count(*)::int from public.stage_completions sc2 where sc2.participant_id = p.id),
        0
      ) as n,
      coalesce(
        (select max(sc3.completed_at) from public.stage_completions sc3 where sc3.participant_id = p.id),
        (select max(sv.solved_at) from public.solves sv where sv.participant_id = p.id),
        p.created_at
      ) as lp
    from public.participants p
    left join public.profiles pr on pr.id = p.solo_user_id
    where not p.retired
      and not coalesce(p.exclude_from_leaderboard, false)
      and not exists (
        select 1 from public.participant_stage_overrides o
        where o.participant_id = p.id and o.enabled = true
      )
      and (p_kind = 'all' or p.kind = p_kind)
      and (
        p.kind = 'team' or (
          not coalesce(pr.disabled, false)
          and not exists (select 1 from public.staff st where st.user_id = p.solo_user_id)
        )
      )
  )
  select
    row_number() over (order by s.sc desc, s.n desc, s.lp asc, s.nm asc) as pos,
    s.nm as name,
    s.kd as kind,
    s.sc as score,
    s.n as stages_completed,
    least(7, s.n + 1) as current_stage,
    round((s.n::numeric / 7.0) * 100)::int as completion_pct,
    s.lp as last_progress
  from s
  order by pos;
$$;

grant execute on function public.get_leaderboard(text) to authenticated, anon, service_role;
