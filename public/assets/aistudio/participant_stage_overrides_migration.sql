-- =====================================================================================================================
-- THE LAST SIGNAL: PARTICIPANT STAGE OVERRIDE MIGRATION
-- Project: CASE TLS-0017 (THE LAST SIGNAL)
-- Version: 3.1.0 (Reusable Individual Stage-Access Override Engine)
-- 
-- Key Features:
-- 1. Uses public.participant_stage_overrides as the single source of truth.
-- 2. Scoped to the authenticated user's actual participant membership via public.my_participant().
-- 3. Supports multiple independent testing participants simultaneously.
-- 4. Authorised staff functions to grant or revoke overrides dynamically by participant UUID or call-sign.
-- 5. Zero hardcoded usernames/emails in schema or application code.
-- 6. Unlocks stages for investigation exploration and puzzle submissions before Nov 1 global start.
-- 7. Does NOT automatically mark stages completed or grant unearned scores.
-- 8. Fails closed under strict PostgreSQL Row-Level Security.
-- =====================================================================================================================

-- 1. Create participant_stage_overrides table if not exists
create table if not exists public.participant_stage_overrides (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  enabled boolean not null default true,
  granted_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable Row-Level Security
alter table public.participant_stage_overrides enable row level security;

-- Drop previous policies if re-running
drop policy if exists participant_stage_overrides_select on public.participant_stage_overrides;
drop policy if exists participant_stage_overrides_staff on public.participant_stage_overrides;

-- Policy: Authenticated users can only read their own participant's override state (or staff can view all)
create policy participant_stage_overrides_select on public.participant_stage_overrides
  for select to authenticated
  using (participant_id = public.my_participant() or public.is_staff());

-- Policy: Only verified staff can insert/update/delete overrides
create policy participant_stage_overrides_staff on public.participant_stage_overrides
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- 3. Security-Definer RPC: Check if calling operative's participant has an active override
create or replace function public.has_stage_override() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select coalesce((
    select o.enabled
    from public.participant_stage_overrides o
    where o.participant_id = public.my_participant()
    limit 1
  ), false);
$$;

-- 4. Staff RPC: Grant or revoke stage override by participant UUID
create or replace function public.staff_set_stage_override(
  p_participant uuid,
  p_enabled boolean,
  p_reason text default null
) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  
  insert into public.participant_stage_overrides (participant_id, enabled, granted_by, reason, updated_at)
  values (p_participant, p_enabled, auth.uid(), p_reason, now())
  on conflict (participant_id) do update set
    enabled = excluded.enabled,
    granted_by = excluded.granted_by,
    reason = excluded.reason,
    updated_at = now();

  insert into public.audit_log(actor_id, action, detail)
  values (
    auth.uid(),
    case when p_enabled then 'grant_stage_override' else 'revoke_stage_override' end,
    jsonb_build_object('participant', p_participant, 'reason', p_reason, 'enabled', p_enabled)
  );
end;
$$;

-- 5. Staff RPC: Grant or revoke stage override by operative Call-Sign / Username
create or replace function public.staff_set_stage_override_by_callsign(
  p_callsign text,
  p_enabled boolean,
  p_reason text default null
) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  target_user uuid;
  target_pid uuid;
begin
  perform public.assert_staff();

  select id into target_user from public.profiles where lower(username) = lower(trim(p_callsign));
  if target_user is null then
    raise exception 'Operative profile not found for callsign: %', p_callsign using errcode = '22000';
  end if;

  select participant_id into target_pid
  from public.participant_members
  where user_id = target_user and left_at is null
  limit 1;

  if target_pid is null then
    raise exception 'Active participant not found for operative: %', p_callsign using errcode = '22000';
  end if;

  perform public.staff_set_stage_override(target_pid, p_enabled, p_reason);
end;
$$;

-- 6. Update submit_challenge() to allow submissions for participants with verified overrides
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
  has_override boolean := false;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  pid := public.my_participant();
  select * into gs from public.game_settings;
  select * into c from public.challenges where key = p_key and active;
  
  select coalesce((select enabled from public.participant_stage_overrides where participant_id = pid), false) into has_override;

  if pid is null or not found or c.stage_id is null
     or (not has_override and (not public.game_started() or now() < public.stage_open_at(c.stage_id)))
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

-- 7. Update get_my_state() to include has_stage_override
create or replace function public.get_my_state() returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare
  pid uuid := public.my_participant();
  gs public.game_settings;
  has_override boolean := false;
begin
  if pid is null then return null; end if;
  select * into gs from public.game_settings;
  
  select coalesce((select enabled from public.participant_stage_overrides where participant_id = pid), false) into has_override;

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
          'title', case when has_override or (public.game_started() and now() >= public.stage_open_at(st.id)) then st.public_title else 'SIGNAL LOCKED' end,
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

-- 8. Execution Grants
grant select on public.participant_stage_overrides to authenticated;
grant execute on function public.has_stage_override() to authenticated;
grant execute on function public.staff_set_stage_override(uuid, boolean, text) to authenticated;
grant execute on function public.staff_set_stage_override_by_callsign(text, boolean, text) to authenticated;
