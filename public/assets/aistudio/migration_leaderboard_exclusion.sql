-- =============================================================================
-- THE LAST SIGNAL (CASE FILE TLS-0017)
-- MIGRATION: REUSABLE LEADERBOARD EXCLUSION SYSTEM FOR ADMINS & INSIDERS
-- =============================================================================
-- NOTE: Do NOT execute directly on live database without administrative review.
-- This script adds the exclude_from_leaderboard flag, updates the get_leaderboard RPC,
-- and provisions an authorized staff management RPC with complete audit logging.

-- 1. Ensure exclude_from_leaderboard column exists on profiles and participants
alter table public.profiles
  add column if not exists exclude_from_leaderboard boolean not null default false;

alter table public.participants
  add column if not exists exclude_from_leaderboard boolean not null default false;

-- 2. Create partial indexes for fast leaderboard filtering
create index if not exists idx_participants_leaderboard_eligible
  on public.participants (kind, id)
  where not retired and not exclude_from_leaderboard;

create index if not exists idx_profiles_leaderboard_exclusion
  on public.profiles (id)
  where exclude_from_leaderboard;

-- 3. Update public.get_leaderboard(p_kind text) to filter excluded participants
-- Ensures excluded participants are eliminated at the database query level
-- and will not take up rank positions or appear in client payloads.
create or replace function public.get_leaderboard(p_kind text)
returns table(
  pos bigint,
  name text,
  score int,
  stages_completed int,
  last_progress timestamptz
)
language sql stable security definer
set search_path = public, extensions, pg_temp as $$
  with s as (
    select
      coalesce(p.name, pr.username) as nm,
      public.score_of(p.id) as sc,
      (select count(*)::int from public.stage_completions c where c.participant_id = p.id) as n,
      greatest(
        (select max(v.solved_at) from public.solves v where v.participant_id = p.id),
        (select max(c2.completed_at) from public.stage_completions c2 where c2.participant_id = p.id)
      ) as lp
    from public.participants p
    left join public.profiles pr on pr.id = p.solo_user_id
    where p.kind = p_kind
      and not p.retired
      and not p.exclude_from_leaderboard
      and not coalesce(pr.exclude_from_leaderboard, false)
      and (
        p.kind = 'team' or (
          not coalesce(pr.disabled, false)
          and not exists (select 1 from public.staff st where st.user_id = p.solo_user_id)
        )
      )
      and (
        public.is_staff() or (
          public.is_active() and (
            select case p_kind
              when 'solo' then gs.leaderboard_individual_visible
              when 'team' then gs.leaderboard_team_visible
              else false
            end
            from public.game_settings gs
          )
        )
      )
  )
  select
    rank() over (order by s.sc desc, s.lp asc) as pos,
    s.nm as name,
    s.sc as score,
    s.n as stages_completed,
    s.lp as last_progress
  from s
  where s.lp is not null
  order by 1, 2;
$$;

-- 4. Authorized staff management function to exclude or restore participants
create or replace function public.staff_set_leaderboard_exclusion_by_callsign(
  p_callsign text,
  p_excluded boolean,
  p_reason text default null
)
returns jsonb
language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  v_user_id uuid;
  v_part_id uuid;
  v_staff_id uuid := auth.uid();
begin
  -- Enforce staff clearance
  perform public.assert_staff();

  -- Resolve user profile by callsign
  select id into v_user_id
  from public.profiles
  where lower(username) = lower(trim(p_callsign));

  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'error', format('Investigator profile for callsign "%s" not found.', p_callsign)
    );
  end if;

  -- 1. Update profile exclusion flag
  update public.profiles
  set exclude_from_leaderboard = p_excluded
  where id = v_user_id;

  -- 2. Update participant exclusion flag (for their active participant entity)
  select participant_id into v_part_id
  from public.participant_members
  where user_id = v_user_id and left_at is null
  limit 1;

  if v_part_id is not null then
    update public.participants
    set exclude_from_leaderboard = p_excluded
    where id = v_part_id;
  end if;

  -- 3. Log administrative audit action
  insert into public.audit_log (
    user_id,
    action,
    target_type,
    target_id,
    payload
  ) values (
    v_staff_id,
    case when p_excluded then 'EXCLUDE_FROM_LEADERBOARD' else 'RESTORE_TO_LEADERBOARD' end,
    'participant',
    coalesce(v_part_id, v_user_id),
    jsonb_build_object(
      'callsign', p_callsign,
      'excluded', p_excluded,
      'reason', coalesce(p_reason, 'Administrative adjustment')
    )
  );

  return jsonb_build_object(
    'success', true,
    'callsign', p_callsign,
    'excluded', p_excluded,
    'participant_id', v_part_id
  );
end;
$$;

-- 5. Grant execute permission on the administrative function
grant execute on function public.staff_set_leaderboard_exclusion_by_callsign(text, boolean, text) to authenticated;
