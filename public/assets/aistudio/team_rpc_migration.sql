-- =====================================================================================================================
-- THE LAST SIGNAL (CASE TLS-0017) — TEAM MANAGEMENT RPC MIGRATION
-- Reference: case17_migration_6c9c9d20.sql lines 510-600
-- For human review and deployment to the Supabase SQL Editor.
-- DO NOT EXECUTE DIRECTLY WITHOUT ORGANIZER APPROVAL.
-- =====================================================================================================================

-- 1. Helper function: participant_has_progress
create or replace function public.participant_has_progress(p_participant_id uuid)
returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select exists(
    select 1 from public.submissions where participant_id = p_participant_id and score_awarded > 0
    union all
    select 1 from public.location_choices where participant_id = p_participant_id
  );
$$;

-- 2. CREATE TEAM
create or replace function public.create_team(p_name text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  cur public.participants;
  tid uuid;
  code text;
  n int := 0;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not public.is_active() then return jsonb_build_object('status', 'unavailable'); end if;
  perform 1 from public.profiles where id = u for update;

  if not public.membership_open() then return jsonb_build_object('status', 'locked'); end if;
  p_name := trim(p_name);
  if p_name is null or char_length(p_name) not between 3 and 40 or lower(p_name) in ('admin','administrator','director','zodiac','cipher','organiser','organizer','system','moderator','owner','staff') then
    return jsonb_build_object('status', 'invalid_name');
  end if;

  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null;

  if not found or cur.kind <> 'solo' then return jsonb_build_object('status', 'already_in_team'); end if;
  if public.participant_has_progress(cur.id) then return jsonb_build_object('status', 'progress_exists'); end if;

  loop
    code := upper(encode(extensions.gen_random_bytes(5), 'hex'));
    begin
      insert into public.participants(kind, name, invite_code, created_by)
      values ('team', p_name, code, u)
      returning id into tid;
      exit;
    exception when unique_violation then
      if exists(select 1 from public.participants where kind = 'team' and lower(name) = lower(p_name)) then
        return jsonb_build_object('status', 'name_taken');
      end if;
      n := n + 1;
      if n >= 5 then raise exception 'could not allocate an invite code'; end if;
    end;
  end loop;

  update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
  update public.participants set retired = true where id = cur.id;
  insert into public.participant_members(participant_id, user_id) values (tid, u);
  insert into public.membership_events(user_id, participant_id, action, actor_id)
  values (u, tid, 'create_team', u), (u, cur.id, 'retire_solo', u);

  return jsonb_build_object('status', 'ok', 'invite_code', code);
end;
$$;

-- 3. JOIN TEAM
create or replace function public.join_team(p_code text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  cur public.participants;
  t public.participants;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not public.is_active() then return jsonb_build_object('status', 'unavailable'); end if;
  perform 1 from public.profiles where id = u for update;

  if not public.membership_open() then return jsonb_build_object('status', 'locked'); end if;
  if (select count(*) from public.membership_events where user_id = u and action = 'failed_join' and created_at > now() - interval '10 minutes') >= 10 then
    return jsonb_build_object('status', 'too_many_attempts');
  end if;

  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null;

  if not found or cur.kind <> 'solo' then return jsonb_build_object('status', 'already_in_team'); end if;
  if public.participant_has_progress(cur.id) then return jsonb_build_object('status', 'progress_exists'); end if;

  select * into t
  from public.participants
  where kind = 'team' and not retired and invite_code = upper(trim(p_code))
  for update;

  if not found then
    insert into public.membership_events(user_id, action) values (u, 'failed_join');
    return jsonb_build_object('status', 'invalid_code');
  end if;

  if exists(select 1 from public.participant_members where participant_id = t.id and user_id = u) then
    return jsonb_build_object('status', 'rejoin_blocked');
  end if;

  if (select count(*) from public.participant_members where participant_id = t.id and left_at is null) >= (select team_size_max from public.game_settings) then
    return jsonb_build_object('status', 'team_full');
  end if;

  update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
  update public.participants set retired = true where id = cur.id;
  insert into public.participant_members(participant_id, user_id) values (t.id, u);
  insert into public.membership_events(user_id, participant_id, action, actor_id)
  values (u, t.id, 'join', u), (u, cur.id, 'retire_solo', u);

  return jsonb_build_object('status', 'ok', 'team', t.name);
end;
$$;

-- 4. LEAVE TEAM
create or replace function public.leave_team()
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  u uuid := auth.uid();
  cur public.participants;
  solo_id uuid;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not public.is_active() then return jsonb_build_object('status', 'unavailable'); end if;
  perform 1 from public.profiles where id = u for update;

  if not public.membership_open() then return jsonb_build_object('status', 'locked'); end if;

  select p.* into cur
  from public.participant_members m
  join public.participants p on p.id = m.participant_id
  where m.user_id = u and m.left_at is null;

  if not found or cur.kind <> 'team' then return jsonb_build_object('status', 'not_in_team'); end if;
  if public.participant_has_progress(cur.id) then return jsonb_build_object('status', 'team_has_progress'); end if;

  select id into solo_id from public.participants where solo_user_id = u;
  update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
  update public.participants set retired = false where id = solo_id;
  update public.participant_members set left_at = null, joined_at = now() where participant_id = solo_id and user_id = u;

  if not exists(select 1 from public.participant_members where participant_id = cur.id and left_at is null) then
    update public.participants set retired = true where id = cur.id;
    insert into public.membership_events(user_id, participant_id, action, actor_id) values (u, cur.id, 'disband', u);
  end if;

  insert into public.membership_events(user_id, participant_id, action, actor_id)
  values (u, cur.id, 'leave', u), (u, solo_id, 'restore_solo', u);

  return jsonb_build_object('status', 'ok');
end;
$$;

-- 5. GET MY TEAM
create or replace function public.get_my_team()
returns jsonb language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select jsonb_build_object(
    'name', t.name,
    'invite_code', t.invite_code,
    'is_creator', t.created_by = auth.uid(),
    'max_size', (select team_size_max from public.game_settings),
    'membership_open', public.membership_open(),
    'members', (
      select coalesce(jsonb_agg(p.username order by m.joined_at), '[]'::jsonb)
      from public.participant_members m
      join public.profiles p on p.id = m.user_id
      where m.participant_id = t.id and m.left_at is null
    )
  )
  from public.participants t
  where t.id = public.my_participant() and t.kind = 'team';
$$;

-- 6. ROTATE INVITE CODE
create or replace function public.rotate_invite_code()
returns text language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  code text := upper(encode(extensions.gen_random_bytes(5), 'hex'));
begin
  update public.participants
  set invite_code = code
  where id = public.my_participant() and kind = 'team' and created_by = auth.uid() and not retired;
  if not found then raise exception 'only the team creator can do this'; end if;
  return code;
end;
$$;

-- Permissions
grant execute on function public.create_team(text) to authenticated;
grant execute on function public.join_team(text) to authenticated;
grant execute on function public.leave_team() to authenticated;
grant execute on function public.get_my_team() to authenticated;
grant execute on function public.rotate_invite_code() to authenticated;
