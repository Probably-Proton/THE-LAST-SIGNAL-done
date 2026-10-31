-- =====================================================================================================================
-- THE LAST SIGNAL: Supabase migration for a NEW, EMPTY project. Never run it against the legacy Dyatlov project.
-- STATUS: NOT EXECUTED anywhere. It has had a static self-check only (case17_selfcheck.py). It is not production-ready
-- until you have run the manual test plan on a real, separate Supabase project.
-- No story answers, passwords, correct locations or scoring values are in this file. Unresolved items are inactive placeholders.
-- UNVERIFIED on a live project (see the review report): writes to auth.users inside SECURITY DEFINER functions
--   (staff_set_disabled, delete_my_account), the trigger on auth.users, the supabase_auth_admin grant, the storage policy
--   expressions, and the insert into storage.buckets.
-- BOOTSTRAP: sign up your own account first, then run (as postgres, in the SQL editor):
--   insert into public.staff(user_id, role) values ('<your-auth-user-uuid>', 'owner');
-- =====================================================================================================================

create extension if not exists pgcrypto with schema extensions;

-- ============================== PEOPLE AND PARTICIPANTS ==============================
create table public.profiles(
  id uuid primary key references auth.users on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,24}$' and lower(username) not in ('admin','administrator','director','zodiac','cipher','organiser','organizer','system','moderator','owner','staff')),
  disabled boolean not null default false,
  created_at timestamptz not null default now());
create unique index profiles_username_ci on public.profiles (lower(username));

create table public.staff(                      -- no client write access at all; changed only by owner_set_staff() or the SQL editor
  user_id uuid primary key references public.profiles on delete cascade,
  role text not null check (role in ('owner','organiser')),
  granted_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now());

create table public.participants(               -- the GAME identity: one solo participant per account, or one team
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
  check (kind = 'solo' or lower(name) not in ('admin','administrator','director','zodiac','cipher','organiser','organizer','system','moderator','owner','staff')));
create unique index participants_team_name_ci on public.participants (lower(name)) where kind = 'team';

create table public.participant_members(
  participant_id uuid not null references public.participants on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (participant_id, user_id),                        -- one row per pair: no silent re-joining
  check (left_at is null or left_at >= joined_at));
create unique index one_active_membership on public.participant_members (user_id) where left_at is null;   -- one active participant per account

create table public.membership_events(
  id bigserial primary key,
  user_id uuid references public.profiles on delete set null,
  participant_id uuid references public.participants on delete set null,
  action text not null check (action in ('create_team','join','leave','failed_join','staff_move','retire_solo','restore_solo','disband')),
  actor_id uuid references public.profiles on delete set null,
  reason text,
  created_at timestamptz not null default now());
create index membership_events_lookup on public.membership_events (user_id, action, created_at);

-- ============================== CONFIGURATION ==============================
create table public.game_settings(
  id boolean primary key default true check (id),
  game_start timestamptz,                         -- shared start (UTC). NULL = not scheduled: nothing is released
  membership_lock_at timestamptz,                 -- NULL = membership locks at game_start
  registration_open boolean not null default false,
  paused boolean not null default false,
  team_size_max int not null default 5 check (team_size_max between 2 and 50),
  leaderboard_individual_visible boolean not null default false,
  leaderboard_team_visible boolean not null default false,
  ending_enabled boolean not null default false,
  rate_limit_account_per_min int not null default 8 check (rate_limit_account_per_min between 1 and 60),
  rate_limit_participant_per_min int not null default 20 check (rate_limit_participant_per_min between 1 and 300),
  allowed_email_domain text,
  updated_at timestamptz not null default now());
insert into public.game_settings default values;

create table public.stages(
  id int primary key check (id between 1 and 20),
  public_title text not null,                     -- shown to players only once the stage has opened
  window_hours int not null default 48 check (window_hours > 0),
  offset_hours_override int check (offset_hours_override >= 0),   -- NULL = opens after all lower-numbered stages' windows
  points int check (points >= 0),                 -- NULL = not yet decided (treated as 0 when scoring)
  enabled boolean not null default true);

create table public.challenges(                   -- puzzles AND password gates
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key ~ '^[a-z0-9_]{3,40}$'),
  label text not null,
  kind text not null check (kind in ('puzzle','gate')),
  stage_id int references public.stages,          -- NULL = unresolved placement: cannot be submitted
  requires_challenge_id uuid references public.challenges,
  requires_username boolean not null default false,
  attempt_limit int check (attempt_limit > 0),
  norm_mode text not null default 'text' check (norm_mode in ('text','coords')),
  active boolean not null default false,          -- inactive placeholders cannot be attempted
  salt text not null default encode(extensions.gen_random_bytes(8), 'hex'),
  sort_order int not null default 0);
create table public.challenge_answers(            -- NO client access: salted hashes of accepted answers
  challenge_id uuid not null references public.challenges on delete cascade,
  answer_hash text not null,
  primary key (challenge_id, answer_hash));

create table public.event_definitions(            -- the only events a player may record
  key text primary key check (key ~ '^[a-z0-9_]{3,40}$'),
  label text not null,
  stage_id int references public.stages,
  requires_document_ref text,                     -- player must currently be able to see this document (documents.ref)
  triggers_ending boolean not null default false,
  active boolean not null default false);

create table public.stage_requirements(           -- what completes a stage; a stage with none can never auto-complete
  id uuid primary key default gen_random_uuid(),
  stage_id int not null references public.stages on delete cascade,
  challenge_id uuid references public.challenges on delete cascade,
  event_key text references public.event_definitions on delete cascade,
  check (num_nonnulls(challenge_id, event_key) = 1),
  unique (stage_id, challenge_id), unique (stage_id, event_key));

create table public.timers(                       -- named moments in time, shared or relative to a participant's own actions
  key text primary key check (key ~ '^[a-z0-9_]{3,60}$'),
  anchor_type text not null check (anchor_type in ('absolute','game_start','stage_open','stage_close','participant_event','challenge_solved','location_choice')),
  absolute_at timestamptz,
  stage_id int references public.stages,
  event_key text references public.event_definitions,
  challenge_id uuid references public.challenges,
  offset_hours numeric not null default 0 check (offset_hours between -10000 and 10000),
  configured boolean not null default false,      -- unconfigured timers evaluate to NULL (never reached)
  notes text,
  check (not configured or (anchor_type = 'absolute' and absolute_at is not null) or anchor_type in ('game_start','location_choice')
      or (anchor_type in ('stage_open','stage_close') and stage_id is not null)
      or (anchor_type = 'participant_event' and event_key is not null)
      or (anchor_type = 'challenge_solved' and challenge_id is not null)));

create table public.release_rules(                -- ALL conditions that are set must hold (schedule AND prerequisite AND result)
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key ~ '^[a-z0-9_]{3,60}$'),
  timer_key text references public.timers,
  requires_challenge_id uuid references public.challenges,
  requires_event_key text references public.event_definitions,
  result_condition text check (result_condition in ('correct','incorrect')),   -- location outcome, only after its reveal time
  notes text);

create table public.map_locations(
  id int primary key, name text not null, sort_order int not null default 0,
  release_rule_id uuid not null references public.release_rules);
create table public.location_config(              -- NO client access: holds the correct answer
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  correct_location_id int references public.map_locations,
  no_choice_treatment text check (no_choice_treatment in ('incorrect','none')),
  bonus_points int check (bonus_points >= 0),
  required_challenge_id uuid references public.challenges);
insert into public.location_config default values;

-- ============================== CONTENT ==============================
create table public.documents(
  id uuid primary key default gen_random_uuid(),
  ref text unique not null, title text not null,
  doc_type text not null check (doc_type in ('letter','report','photograph','testimony','article','audio','video','map','transcript','other')),
  description text, body text, transcript text,
  stage_id int references public.stages,          -- display grouping only; access is decided by the release rule
  release_rule_id uuid not null references public.release_rules,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  visible_during_ending boolean not null default false,
  file_path text,                                 -- object name in the private 'evidence' bucket
  sort_order int not null default 0,
  created_at timestamptz not null default now());
create table public.messages(                     -- one-way, organiser-authored
  id uuid primary key default gen_random_uuid(),
  sender text not null check (sender in ('director','zodiac','system')),   -- 'system' = real website notices, never story
  title text, body text not null,
  attachment_document_id uuid references public.documents on delete set null,
  release_rule_id uuid not null references public.release_rules,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  visible_during_ending boolean not null default false,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now());
create table public.message_reads(user_id uuid references public.profiles on delete cascade, message_id uuid references public.messages on delete cascade, read_at timestamptz not null default now(), primary key (user_id, message_id));
create table public.doc_reads(user_id uuid references public.profiles on delete cascade, document_id uuid references public.documents on delete cascade, first_read_at timestamptz not null default now(), last_read_at timestamptz not null default now(), primary key (user_id, document_id));
create table public.site_content(key text primary key, title text not null, body text not null default '', is_public boolean not null default false, updated_at timestamptz not null default now());

-- ============================== SHARED GAME STATE (belongs to a participant; written only by server functions) ==============================
create table public.attempts(id bigserial primary key, participant_id uuid not null references public.participants on delete cascade, user_id uuid references public.profiles on delete set null,
  challenge_id uuid not null references public.challenges, correct boolean not null, submitted text, voided boolean not null default false, created_at timestamptz not null default now());
create index attempts_participant on public.attempts (participant_id, challenge_id);
create index attempts_user_time on public.attempts (user_id, created_at);
create table public.solves(participant_id uuid not null references public.participants on delete cascade, challenge_id uuid not null references public.challenges,
  solved_by uuid references public.profiles on delete set null, solved_at timestamptz not null default now(), primary key (participant_id, challenge_id));
create table public.stage_completions(participant_id uuid not null references public.participants on delete cascade, stage_id int not null references public.stages,
  completed_at timestamptz not null default now(), late boolean not null, points_earned int not null default 0 check (points_earned >= 0),
  completed_by uuid references public.profiles on delete set null, manual boolean not null default false,
  primary key (participant_id, stage_id), check (not late or points_earned = 0));
create table public.game_events(participant_id uuid not null references public.participants on delete cascade, event_key text not null references public.event_definitions,
  recorded_by uuid references public.profiles on delete set null, recorded_at timestamptz not null default now(), primary key (participant_id, event_key));
create table public.location_choices(participant_id uuid primary key references public.participants on delete cascade, location_id int not null references public.map_locations,
  chosen_by uuid references public.profiles on delete set null, created_at timestamptz not null default now());      -- primary key = one choice per participant
create table public.score_adjustments(id bigserial primary key, participant_id uuid not null references public.participants on delete cascade,
  delta int not null check (delta between -1000 and 1000), reason text not null check (char_length(trim(reason)) > 0), staff_id uuid references public.profiles on delete set null, created_at timestamptz not null default now());
create table public.ending_state(participant_id uuid primary key references public.participants on delete cascade, active boolean not null default true,
  triggered_at timestamptz not null default now(), triggered_by uuid references public.profiles on delete set null, via_event text,
  reset_at timestamptz, reset_by uuid references public.profiles on delete set null, reset_reason text);
create table public.audit_log(id bigserial primary key, actor_id uuid references public.profiles on delete set null, action text not null, detail jsonb, created_at timestamptz not null default now());

-- ============================== HELPER FUNCTIONS (SECURITY DEFINER, pinned search_path) ==============================
create function public.norm(t text, m text) returns text language sql immutable set search_path = '' as
$$ select case when m = 'coords' then lower(regexp_replace(t, '\s', '', 'g')) else lower(regexp_replace(t, '[^A-Za-z0-9]', '', 'g')) end $$;
create function public.is_active() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select exists(select 1 from public.profiles where id = auth.uid() and not disabled) $$;
create function public.staff_role() returns text language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select s.role from public.staff s join public.profiles p on p.id = s.user_id where s.user_id = auth.uid() and not p.disabled $$;
create function public.is_staff() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select coalesce(public.staff_role() is not null, false) $$;
create function public.is_owner() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select coalesce(public.staff_role() = 'owner', false) $$;
create function public.assert_staff() returns void language plpgsql stable security definer set search_path = public, extensions, pg_temp as
$$ begin if not public.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if; end $$;
create function public.assert_owner() returns void language plpgsql stable security definer set search_path = public, extensions, pg_temp as
$$ begin if not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if; end $$;
create function public.my_participant() returns uuid language sql stable security definer set search_path = public, extensions, pg_temp as   -- NULL when signed out or disabled
$$ select m.participant_id from public.participant_members m join public.profiles p on p.id = m.user_id where m.user_id = auth.uid() and m.left_at is null and not p.disabled $$;
create function public.game_started() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select coalesce(now() >= gs.game_start, false) from public.game_settings gs $$;
create function public.membership_open() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select coalesce(now() < coalesce(gs.membership_lock_at, gs.game_start), true) from public.game_settings gs $$;
create function public.stage_open_at(sid int) returns timestamptz language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select gs.game_start + (coalesce(st.offset_hours_override, (select coalesce(sum(x.window_hours), 0) from public.stages x where x.id < st.id))::double precision * interval '1 hour')
   from public.stages st cross join public.game_settings gs where st.id = sid $$;
create function public.stage_close_at(sid int) returns timestamptz language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select public.stage_open_at(sid) + (st.window_hours::double precision * interval '1 hour') from public.stages st where st.id = sid $$;
create function public.timer_at(tkey text, pid uuid) returns timestamptz language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select case t.anchor_type
     when 'absolute' then t.absolute_at
     when 'game_start' then gs.game_start + (t.offset_hours::double precision * interval '1 hour')
     when 'stage_open' then public.stage_open_at(t.stage_id) + (t.offset_hours::double precision * interval '1 hour')
     when 'stage_close' then public.stage_close_at(t.stage_id) + (t.offset_hours::double precision * interval '1 hour')
     when 'participant_event' then (select e.recorded_at from public.game_events e where e.participant_id = pid and e.event_key = t.event_key) + (t.offset_hours::double precision * interval '1 hour')
     when 'challenge_solved' then (select s.solved_at from public.solves s where s.participant_id = pid and s.challenge_id = t.challenge_id) + (t.offset_hours::double precision * interval '1 hour')
     when 'location_choice' then (select c.created_at from public.location_choices c where c.participant_id = pid) + (t.offset_hours::double precision * interval '1 hour')
   end
   from public.timers t cross join public.game_settings gs where t.key = tkey and t.configured $$;
create function public.location_config_complete() returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select c.correct_location_id is not null and c.no_choice_treatment is not null and c.bonus_points is not null
      and exists(select 1 from public.timers where key = 'location_choice_deadline' and configured)
      and exists(select 1 from public.timers where key = 'location_reveal' and configured)
   from public.location_config c $$;
create function public.location_outcome(pid uuid) returns text language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$   -- NULL until the reveal time: never leaks early
declare cfg public.location_config; chosen int; reveal timestamptz; dl timestamptz;
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
end $$;
create function public.rule_ok(rid uuid, pid uuid) returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select coalesce((select (r.timer_key is null or coalesce(public.timer_at(r.timer_key, pid) <= now(), false))
      and (r.requires_challenge_id is null or exists(select 1 from public.solves s where s.participant_id = pid and s.challenge_id = r.requires_challenge_id))
      and (r.requires_event_key is null or exists(select 1 from public.game_events e where e.participant_id = pid and e.event_key = r.requires_event_key))
      and (r.result_condition is null or public.location_outcome(pid) = r.result_condition)
    from public.release_rules r where r.id = rid), false) and pid is not null $$;
create function public.ending_active(pid uuid) returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select coalesce((select gs.ending_enabled from public.game_settings gs) and exists(select 1 from public.ending_state e where e.participant_id = pid and e.active), false) $$;
create function public.can_see_content(rid uuid, during_ending boolean) returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select coalesce(public.is_active() and public.game_started() and public.rule_ok(rid, public.my_participant())
      and (during_ending or not public.ending_active(public.my_participant())), false) $$;
create function public.score_of(pid uuid) returns int language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select greatest(0, coalesce((select sum(c.points_earned) from public.stage_completions c where c.participant_id = pid), 0)
     + case when public.location_outcome(pid) = 'correct' then coalesce((select bonus_points from public.location_config), 0) else 0 end
     + coalesce((select sum(a.delta) from public.score_adjustments a where a.participant_id = pid), 0))::int $$;
create function public.participant_has_progress(pid uuid) returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select exists(select 1 from public.solves where participant_id = pid) or exists(select 1 from public.stage_completions where participant_id = pid)
       or exists(select 1 from public.game_events where participant_id = pid) or exists(select 1 from public.location_choices where participant_id = pid) $$;

-- private shared notes and evidence links (defaults call my_participant(), so created after the helpers)
create table public.notes(id uuid primary key default gen_random_uuid(), participant_id uuid not null default public.my_participant() references public.participants on delete cascade,
  author_id uuid default auth.uid() references public.profiles on delete set null, doc_ref text, body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.evidence_links(id uuid primary key default gen_random_uuid(), participant_id uuid not null default public.my_participant() references public.participants on delete cascade,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  doc_a uuid not null references public.documents on delete cascade, doc_b uuid not null references public.documents on delete cascade,
  note text check (char_length(note) <= 500), created_at timestamptz not null default now(), check (doc_a <> doc_b));

-- ============================== TRIGGERS ==============================
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare gs public.game_settings; pid uuid;
begin
  select * into gs from public.game_settings;
  if not gs.registration_open then raise exception 'Registration is closed'; end if;
  if gs.allowed_email_domain is not null and (new.email is null or lower(split_part(new.email, '@', 2)) <> lower(gs.allowed_email_domain)) then raise exception 'Email domain not allowed'; end if;
  insert into public.profiles(id, username) values (new.id, new.raw_user_meta_data->>'username');
  insert into public.participants(kind, solo_user_id, created_by) values ('solo', new.id, new.id) returning id into pid;
  insert into public.participant_members(participant_id, user_id) values (pid, new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.guard_staff() returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'owner' and (select count(*) from public.staff where role = 'owner') <= 1 then raise exception 'cannot remove the last owner'; end if;
    return old;
  end if;
  if old.role = 'owner' and new.role <> 'owner' and (select count(*) from public.staff where role = 'owner') <= 1 then raise exception 'cannot demote the last owner'; end if;
  return new;
end $$;
create trigger guard_staff before update or delete on public.staff for each row execute function public.guard_staff();

create function public.guard_member_solo() returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if exists(select 1 from public.participants p where p.id = new.participant_id and p.kind = 'solo' and p.solo_user_id <> new.user_id) then raise exception 'a solo participant can only contain its own account'; end if;
  return new;
end $$;
create trigger guard_member_solo before insert or update on public.participant_members for each row execute function public.guard_member_solo();

create function public.touch_updated() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;
create trigger touch_settings before update on public.game_settings for each row execute function public.touch_updated();
create trigger touch_content before update on public.site_content for each row execute function public.touch_updated();
create trigger touch_notes before update on public.notes for each row execute function public.touch_updated();

create function public.audit_change() returns trigger language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if auth.uid() is null then return null; end if;
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), tg_table_name || '.' || lower(tg_op),
    jsonb_build_object('row', (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) - 'body' - 'transcript'));
  return null;
end $$;
create trigger audit_documents after insert or update or delete on public.documents for each row execute function public.audit_change();
create trigger audit_messages after insert or update or delete on public.messages for each row execute function public.audit_change();
create trigger audit_site_content after insert or update or delete on public.site_content for each row execute function public.audit_change();
create trigger audit_stages after insert or update or delete on public.stages for each row execute function public.audit_change();
create trigger audit_challenges after insert or update or delete on public.challenges for each row execute function public.audit_change();
create trigger audit_timers after insert or update or delete on public.timers for each row execute function public.audit_change();
create trigger audit_release_rules after insert or update or delete on public.release_rules for each row execute function public.audit_change();
create trigger audit_stage_requirements after insert or update or delete on public.stage_requirements for each row execute function public.audit_change();
create trigger audit_event_definitions after insert or update or delete on public.event_definitions for each row execute function public.audit_change();
create trigger audit_map_locations after insert or update or delete on public.map_locations for each row execute function public.audit_change();
create trigger audit_settings after update on public.game_settings for each row execute function public.audit_change();
create trigger audit_staff after insert or update or delete on public.staff for each row execute function public.audit_change();

-- ============================== PUBLIC (signed-out) FUNCTIONS ==============================
create function public.get_public_config() returns jsonb language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select jsonb_build_object('registration_open', gs.registration_open, 'game_start', gs.game_start, 'membership_open', public.membership_open(),
     'team_size_max', gs.team_size_max, 'leaderboard_individual_visible', gs.leaderboard_individual_visible,
     'leaderboard_team_visible', gs.leaderboard_team_visible, 'allowed_email_domain', gs.allowed_email_domain) from public.game_settings gs $$;
create function public.get_public_stage_overview() returns table(id int, state text, title text, opens_at timestamptz, closes_at timestamptz)
language sql stable security definer set search_path = public, extensions, pg_temp as   -- titles appear only after a stage has opened
$$ select q.id, case when q.o is null or now() < q.o then 'upcoming' when now() < q.c then 'open' else 'closed' end,
     case when q.o is not null and now() >= q.o then q.public_title end, q.o, q.c
   from (select st.id, st.public_title, public.stage_open_at(st.id) o, public.stage_close_at(st.id) c from public.stages st where st.enabled) q order by q.id $$;
create function public.username_available(p_username text) returns boolean language sql stable security definer set search_path = public, extensions, pg_temp as
$$ select p_username ~ '^[A-Za-z0-9_]{3,24}$' and lower(p_username) not in ('admin','administrator','director','zodiac','cipher','organiser','organizer','system','moderator','owner','staff')
   and not exists(select 1 from public.profiles where lower(username) = lower(p_username)) $$;

-- ============================== PLAYER STATE ==============================
create function public.get_my_state() returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare pid uuid := public.my_participant(); gs public.game_settings;
begin
  if pid is null then return null; end if;                            -- signed out or disabled
  select * into gs from public.game_settings;
  return jsonb_build_object(
    'kind', (select p.kind from public.participants p where p.id = pid),
    'game_started', public.game_started(), 'game_start', gs.game_start, 'paused', gs.paused,
    'ending', public.ending_active(pid), 'score', public.score_of(pid),
    'stages', (select coalesce(jsonb_agg(jsonb_build_object('id', q.id,
          'state', case when q.o is null or now() < q.o then 'upcoming' when now() < q.c then 'open' else 'closed' end,
          'title', case when q.o is not null and now() >= q.o then q.public_title end,
          'opens_at', q.o, 'closes_at', q.c, 'completed', sc.stage_id is not null, 'late', sc.late, 'points', sc.points_earned) order by q.id), '[]'::jsonb)
        from (select st.id, st.public_title, public.stage_open_at(st.id) o, public.stage_close_at(st.id) c from public.stages st where st.enabled) q
        left join public.stage_completions sc on sc.participant_id = pid and sc.stage_id = q.id),
    'challenges', (select coalesce(jsonb_agg(jsonb_build_object('key', c.key, 'label', c.label, 'kind', c.kind, 'stage_id', c.stage_id, 'requires_username', c.requires_username,
          'solved', exists(select 1 from public.solves s where s.participant_id = pid and s.challenge_id = c.id),
          'attempts_left', case when c.attempt_limit is null then null else greatest(0, c.attempt_limit - (select count(*) from public.attempts a where a.participant_id = pid and a.challenge_id = c.id and not a.voided)) end)
          order by c.sort_order, c.key), '[]'::jsonb)
        from public.challenges c   -- only challenges that submit_challenge would actually accept: nothing hidden is hinted at
        where c.active and c.stage_id is not null and public.game_started() and now() >= public.stage_open_at(c.stage_id)
          and exists(select 1 from public.stages x where x.id = c.stage_id and x.enabled)
          and exists(select 1 from public.challenge_answers ca where ca.challenge_id = c.id)
          and (c.requires_challenge_id is null or exists(select 1 from public.solves s2 where s2.participant_id = pid and s2.challenge_id = c.requires_challenge_id))),
    'solved', (select coalesce(jsonb_agg(c.key), '[]'::jsonb) from public.solves s join public.challenges c on c.id = s.challenge_id where s.participant_id = pid),
    'next_release_at', (select min(x.t) from (select public.stage_open_at(st.id) t from public.stages st union all select public.stage_close_at(st.id) from public.stages st
          union all select public.timer_at(tm.key, pid) from public.timers tm) x where x.t > now()));
end $$;

-- ============================== STAGE COMPLETION (internal) ==============================
create function public.try_complete_stage(pid uuid, sid int, p_by uuid) returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare st public.stages; late boolean;
begin
  select * into st from public.stages where id = sid and enabled;
  if not found then return false; end if;
  if not exists(select 1 from public.stage_requirements where stage_id = sid) then return false; end if;      -- never "complete" a stage with no requirements
  if exists(select 1 from public.stage_requirements r where r.stage_id = sid and not (
       (r.challenge_id is not null and exists(select 1 from public.solves s where s.participant_id = pid and s.challenge_id = r.challenge_id))
    or (r.event_key is not null and exists(select 1 from public.game_events e where e.participant_id = pid and e.event_key = r.event_key)))) then return false; end if;
  late := coalesce(now() > public.stage_close_at(sid), false);
  insert into public.stage_completions(participant_id, stage_id, late, points_earned, completed_by) values (pid, sid, late, case when late then 0 else coalesce(st.points, 0) end, p_by) on conflict do nothing;
  return true;
end $$;

-- ============================== SUBMISSIONS ==============================
create function public.submit_challenge(p_key text, p_answer text, p_username text default null) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u uuid := auth.uid(); pid uuid; gs public.game_settings; c public.challenges; used int; ok boolean; secret text; unorm text; anorm text;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  pid := public.my_participant();
  select * into gs from public.game_settings;
  select * into c from public.challenges where key = p_key and active;
  if pid is null or not found or c.stage_id is null or not public.game_started() or now() < public.stage_open_at(c.stage_id)
     or not exists(select 1 from public.stages where id = c.stage_id and enabled)
     or not exists(select 1 from public.challenge_answers where challenge_id = c.id)
     or (c.requires_challenge_id is not null and not exists(select 1 from public.solves where participant_id = pid and challenge_id = c.requires_challenge_id))
  then return jsonb_build_object('status', 'unavailable'); end if;     -- one answer for every "not reachable" reason, so nothing can be probed
  if gs.paused then return jsonb_build_object('status', 'paused'); end if;
  perform pg_advisory_xact_lock(hashtextextended(pid::text, 0));       -- teammates submitting at once are processed one after another
  if exists(select 1 from public.solves where participant_id = pid and challenge_id = c.id) then return jsonb_build_object('status', 'already_solved'); end if;
  if p_answer is null or char_length(p_answer) not between 1 and 200 or (c.requires_username and (p_username is null or char_length(p_username) not between 1 and 100)) then return jsonb_build_object('status', 'invalid'); end if;
  if c.requires_username then
    unorm := public.norm(p_username, 'text'); anorm := public.norm(p_answer, 'text'); secret := unorm || '|' || anorm;
    if unorm = '' or anorm = '' then return jsonb_build_object('status', 'invalid'); end if;
  else
    anorm := public.norm(p_answer, c.norm_mode); secret := anorm;
    if anorm = '' then return jsonb_build_object('status', 'invalid'); end if;
  end if;
  if (select count(*) from public.attempts where user_id = u and created_at > now() - interval '1 minute') >= gs.rate_limit_account_per_min
     or (select count(*) from public.attempts where participant_id = pid and created_at > now() - interval '1 minute') >= gs.rate_limit_participant_per_min then return jsonb_build_object('status', 'rate_limited'); end if;
  select count(*) into used from public.attempts where participant_id = pid and challenge_id = c.id and not voided;
  if c.attempt_limit is not null and used >= c.attempt_limit then return jsonb_build_object('status', 'attempts_exhausted'); end if;
  ok := exists(select 1 from public.challenge_answers where challenge_id = c.id and answer_hash = encode(extensions.digest(c.salt || secret, 'sha256'), 'hex'));
  insert into public.attempts(participant_id, user_id, challenge_id, correct, submitted) values (pid, u, c.id, ok, left(coalesce(p_username || ' / ', '') || p_answer, 200));
  if ok then
    insert into public.solves(participant_id, challenge_id, solved_by) values (pid, c.id, u) on conflict do nothing;
    perform public.try_complete_stage(pid, r.stage_id, u) from public.stage_requirements r where r.challenge_id = c.id;
    return jsonb_build_object('status', 'correct', 'stages', (select coalesce(jsonb_agg(jsonb_build_object('stage_id', sc.stage_id, 'late', sc.late, 'points', sc.points_earned)), '[]'::jsonb)
        from public.stage_completions sc where sc.participant_id = pid and sc.stage_id in (select r2.stage_id from public.stage_requirements r2 where r2.challenge_id = c.id)));
  end if;
  return jsonb_build_object('status', 'incorrect', 'attempts_left', case when c.attempt_limit is null then null else c.attempt_limit - used - 1 end);
end $$;

create function public.record_event(p_key text) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u uuid := auth.uid(); pid uuid; gs public.game_settings; e public.event_definitions;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  pid := public.my_participant();
  select * into gs from public.game_settings;
  select * into e from public.event_definitions where key = p_key and active;
  if pid is null or not found or not public.game_started() or (e.stage_id is not null and now() < public.stage_open_at(e.stage_id))
     or (e.requires_document_ref is not null and not exists(select 1 from public.documents d where d.ref = e.requires_document_ref and d.status = 'published' and public.can_see_content(d.release_rule_id, d.visible_during_ending)))
  then return jsonb_build_object('status', 'unavailable'); end if;
  if gs.paused then return jsonb_build_object('status', 'paused'); end if;
  perform pg_advisory_xact_lock(hashtextextended(pid::text, 0));
  insert into public.game_events(participant_id, event_key, recorded_by) values (pid, p_key, u) on conflict do nothing;
  if e.triggers_ending and gs.ending_enabled then
    insert into public.ending_state(participant_id, triggered_by, via_event) values (pid, u, p_key) on conflict do nothing;   -- never re-fires after an organiser reset
  end if;
  perform public.try_complete_stage(pid, r.stage_id, u) from public.stage_requirements r where r.event_key = p_key;
  return jsonb_build_object('status', 'ok', 'ending', public.ending_active(pid));
end $$;

-- ============================== LOCATION CHOICE ==============================
create function public.choose_location(p_location_id int) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u uuid := auth.uid(); pid uuid; cfg public.location_config; dl timestamptz;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  pid := public.my_participant();
  select * into cfg from public.location_config;
  if pid is null or not public.game_started() or not cfg.enabled or not public.location_config_complete()
     or (cfg.required_challenge_id is not null and not exists(select 1 from public.solves where participant_id = pid and challenge_id = cfg.required_challenge_id))
  then return jsonb_build_object('status', 'unavailable'); end if;
  if (select paused from public.game_settings) then return jsonb_build_object('status', 'paused'); end if;
  dl := public.timer_at('location_choice_deadline', pid);
  if dl is null then return jsonb_build_object('status', 'unavailable'); end if;
  if now() >= dl then return jsonb_build_object('status', 'closed'); end if;
  if not exists(select 1 from public.map_locations where id = p_location_id) then return jsonb_build_object('status', 'invalid'); end if;
  perform pg_advisory_xact_lock(hashtextextended(pid::text, 0));
  begin
    insert into public.location_choices(participant_id, location_id, chosen_by) values (pid, p_location_id, u);
  exception when unique_violation then return jsonb_build_object('status', 'already_chosen');
  end;
  return jsonb_build_object('status', 'ok');                          -- correctness is never returned here
end $$;
create function public.get_location_state() returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare pid uuid := public.my_participant(); cfg public.location_config; ready boolean; dl timestamptz; chosen int; outcome text;
begin
  if pid is null then return null; end if;
  select * into cfg from public.location_config;
  ready := public.game_started() and cfg.enabled and public.location_config_complete()
           and (cfg.required_challenge_id is null or exists(select 1 from public.solves where participant_id = pid and challenge_id = cfg.required_challenge_id));
  dl := case when ready then public.timer_at('location_choice_deadline', pid) end;
  select location_id into chosen from public.location_choices where participant_id = pid;
  outcome := public.location_outcome(pid);
  return jsonb_build_object('ready', coalesce(ready, false), 'deadline_at', dl, 'my_choice', chosen,
    'can_choose', coalesce(ready, false) and dl is not null and now() < dl and chosen is null and not (select paused from public.game_settings),
    'reveal_at', case when ready then public.timer_at('location_reveal', pid) end,
    'outcome', outcome, 'bonus', case when outcome = 'correct' then cfg.bonus_points end);
end $$;

-- ============================== READ MARKERS (run as the caller, so row-level security still applies) ==============================
create function public.mark_document_read(p_ref text) returns void language sql security invoker as
$$ insert into public.doc_reads(user_id, document_id) select auth.uid(), d.id from public.documents d where d.ref = p_ref
   on conflict (user_id, document_id) do update set last_read_at = now() $$;
create function public.mark_message_read(p_id uuid) returns void language sql security invoker as
$$ insert into public.message_reads(user_id, message_id) select auth.uid(), m.id from public.messages m where m.id = p_id on conflict do nothing $$;

-- ============================== TEAMS ==============================
create function public.create_team(p_name text) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u uuid := auth.uid(); cur public.participants; tid uuid; code text; n int := 0;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not public.is_active() then return jsonb_build_object('status', 'unavailable'); end if;
  perform 1 from public.profiles where id = u for update;                    -- one membership change at a time per account
  if not public.membership_open() then return jsonb_build_object('status', 'locked'); end if;
  p_name := trim(p_name);
  if p_name is null or char_length(p_name) not between 3 and 40 or lower(p_name) in ('admin','administrator','director','zodiac','cipher','organiser','organizer','system','moderator','owner','staff') then return jsonb_build_object('status', 'invalid_name'); end if;
  select p.* into cur from public.participant_members m join public.participants p on p.id = m.participant_id where m.user_id = u and m.left_at is null;
  if not found or cur.kind <> 'solo' then return jsonb_build_object('status', 'already_in_team'); end if;
  if public.participant_has_progress(cur.id) then return jsonb_build_object('status', 'progress_exists'); end if;
  loop
    code := upper(encode(extensions.gen_random_bytes(5), 'hex'));
    begin
      insert into public.participants(kind, name, invite_code, created_by) values ('team', p_name, code, u) returning id into tid;
      exit;
    exception when unique_violation then
      if exists(select 1 from public.participants where kind = 'team' and lower(name) = lower(p_name)) then return jsonb_build_object('status', 'name_taken'); end if;
      n := n + 1;
      if n >= 5 then raise exception 'could not allocate an invite code'; end if;
    end;
  end loop;
  update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
  update public.participants set retired = true where id = cur.id;
  insert into public.participant_members(participant_id, user_id) values (tid, u);
  insert into public.membership_events(user_id, participant_id, action, actor_id) values (u, tid, 'create_team', u), (u, cur.id, 'retire_solo', u);
  return jsonb_build_object('status', 'ok', 'invite_code', code);
end $$;

create function public.join_team(p_code text) returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u uuid := auth.uid(); cur public.participants; t public.participants;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not public.is_active() then return jsonb_build_object('status', 'unavailable'); end if;
  perform 1 from public.profiles where id = u for update;
  if not public.membership_open() then return jsonb_build_object('status', 'locked'); end if;
  if (select count(*) from public.membership_events where user_id = u and action = 'failed_join' and created_at > now() - interval '10 minutes') >= 10 then return jsonb_build_object('status', 'too_many_attempts'); end if;
  select p.* into cur from public.participant_members m join public.participants p on p.id = m.participant_id where m.user_id = u and m.left_at is null;
  if not found or cur.kind <> 'solo' then return jsonb_build_object('status', 'already_in_team'); end if;
  if public.participant_has_progress(cur.id) then return jsonb_build_object('status', 'progress_exists'); end if;
  select * into t from public.participants where kind = 'team' and not retired and invite_code = upper(trim(p_code)) for update;   -- row lock: two joins cannot both take the last seat
  if not found then
    insert into public.membership_events(user_id, action) values (u, 'failed_join');   -- logged, then answered (not raised) so the log survives
    return jsonb_build_object('status', 'invalid_code');
  end if;
  if exists(select 1 from public.participant_members where participant_id = t.id and user_id = u) then return jsonb_build_object('status', 'rejoin_blocked'); end if;
  if (select count(*) from public.participant_members where participant_id = t.id and left_at is null) >= (select team_size_max from public.game_settings) then return jsonb_build_object('status', 'team_full'); end if;
  update public.participant_members set left_at = now() where participant_id = cur.id and user_id = u;
  update public.participants set retired = true where id = cur.id;
  insert into public.participant_members(participant_id, user_id) values (t.id, u);
  insert into public.membership_events(user_id, participant_id, action, actor_id) values (u, t.id, 'join', u), (u, cur.id, 'retire_solo', u);
  return jsonb_build_object('status', 'ok', 'team', t.name);
end $$;

create function public.leave_team() returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u uuid := auth.uid(); cur public.participants; solo_id uuid;
begin
  if u is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not public.is_active() then return jsonb_build_object('status', 'unavailable'); end if;
  perform 1 from public.profiles where id = u for update;
  if not public.membership_open() then return jsonb_build_object('status', 'locked'); end if;
  select p.* into cur from public.participant_members m join public.participants p on p.id = m.participant_id where m.user_id = u and m.left_at is null;
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
  insert into public.membership_events(user_id, participant_id, action, actor_id) values (u, cur.id, 'leave', u), (u, solo_id, 'restore_solo', u);
  return jsonb_build_object('status', 'ok');
end $$;

create function public.rotate_invite_code() returns text language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare code text := upper(encode(extensions.gen_random_bytes(5), 'hex'));
begin
  update public.participants set invite_code = code where id = public.my_participant() and kind = 'team' and created_by = auth.uid() and not retired;
  if not found then raise exception 'only the team creator can do this'; end if;
  return code;
end $$;

create function public.get_my_team() returns jsonb language sql stable security definer set search_path = public, extensions, pg_temp as   -- usernames only; NULL for solo players
$$ select jsonb_build_object('name', t.name, 'invite_code', t.invite_code, 'is_creator', t.created_by = auth.uid(),
     'max_size', (select team_size_max from public.game_settings), 'membership_open', public.membership_open(),
     'members', (select coalesce(jsonb_agg(p.username order by m.joined_at), '[]'::jsonb) from public.participant_members m join public.profiles p on p.id = m.user_id where m.participant_id = t.id and m.left_at is null))
   from public.participants t where t.id = public.my_participant() and t.kind = 'team' $$;

-- ============================== LEADERBOARD ==============================
create function public.get_leaderboard(p_kind text) returns table(pos bigint, name text, score int, stages_completed int, last_progress timestamptz)
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  with s as (
    select coalesce(p.name, pr.username) nm, public.score_of(p.id) sc,
           (select count(*)::int from public.stage_completions c where c.participant_id = p.id) n,
           greatest((select max(v.solved_at) from public.solves v where v.participant_id = p.id), (select max(c2.completed_at) from public.stage_completions c2 where c2.participant_id = p.id)) lp
    from public.participants p left join public.profiles pr on pr.id = p.solo_user_id
    where p.kind = p_kind and not p.retired and not p.exclude_from_leaderboard
      and (p.kind = 'team' or (not coalesce(pr.disabled, false) and not exists(select 1 from public.staff st where st.user_id = p.solo_user_id)))
      and (public.is_staff() or (public.is_active() and (select case p_kind when 'solo' then gs.leaderboard_individual_visible when 'team' then gs.leaderboard_team_visible else false end from public.game_settings gs))))
  select rank() over (order by s.sc desc, s.lp asc), s.nm, s.sc, s.n, s.lp from s where s.lp is not null order by 1, 2 $$;

-- ============================== ACCOUNT CONTROL ==============================
create function public.delete_my_account(p_confirm text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare u uuid := auth.uid(); r record;
begin
  if u is null or p_confirm <> 'DELETE' then raise exception 'confirmation required'; end if;
  if public.is_staff() then raise exception 'organisers and owners must be removed from staff first'; end if;
  perform 1 from public.profiles where id = u for update;
  for r in select p.id from public.participant_members m join public.participants p on p.id = m.participant_id where m.user_id = u and m.left_at is null and p.kind = 'team' loop
    update public.participant_members set left_at = now() where participant_id = r.id and user_id = u;
    if not exists(select 1 from public.participant_members where participant_id = r.id and left_at is null) then update public.participants set retired = true where id = r.id; end if;
  end loop;
  delete from auth.users where id = u;     -- UNVERIFIED: cascades to the profile, the solo participant and its progress; team progress stays with the team
end $$;

-- ============================== ORGANISER (staff) AND OWNER FUNCTIONS: each checks its role first and writes the audit log ==============================
create function public.update_settings(p_patch jsonb) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare owner_keys text[] := array['game_start','membership_lock_at','team_size_max','ending_enabled','rate_limit_account_per_min','rate_limit_participant_per_min','allowed_email_domain'];
        staff_keys text[] := array['paused','registration_open','leaderboard_individual_visible','leaderboard_team_visible'];
begin
  perform public.assert_staff();
  if exists(select 1 from jsonb_object_keys(p_patch) k where k <> all (owner_keys || staff_keys)) then raise exception 'unknown setting'; end if;
  if exists(select 1 from jsonb_object_keys(p_patch) k where k = any (owner_keys)) and not public.is_owner() then raise exception 'forbidden' using errcode = '42501'; end if;
  if jsonb_exists(p_patch, 'game_start') and public.game_started() then raise exception 'the game has already started; the shared clock cannot be moved'; end if;
  update public.game_settings set
    game_start = case when jsonb_exists(p_patch, 'game_start') then nullif(p_patch->>'game_start', '')::timestamptz else game_start end,
    membership_lock_at = case when jsonb_exists(p_patch, 'membership_lock_at') then nullif(p_patch->>'membership_lock_at', '')::timestamptz else membership_lock_at end,
    allowed_email_domain = case when jsonb_exists(p_patch, 'allowed_email_domain') then nullif(p_patch->>'allowed_email_domain', '') else allowed_email_domain end,
    team_size_max = coalesce((p_patch->>'team_size_max')::int, team_size_max),
    ending_enabled = coalesce((p_patch->>'ending_enabled')::boolean, ending_enabled),
    rate_limit_account_per_min = coalesce((p_patch->>'rate_limit_account_per_min')::int, rate_limit_account_per_min),
    rate_limit_participant_per_min = coalesce((p_patch->>'rate_limit_participant_per_min')::int, rate_limit_participant_per_min),
    paused = coalesce((p_patch->>'paused')::boolean, paused),
    registration_open = coalesce((p_patch->>'registration_open')::boolean, registration_open),
    leaderboard_individual_visible = coalesce((p_patch->>'leaderboard_individual_visible')::boolean, leaderboard_individual_visible),
    leaderboard_team_visible = coalesce((p_patch->>'leaderboard_team_visible')::boolean, leaderboard_team_visible)
  where id;
end $$;

create function public.owner_set_staff(p_user uuid, p_role text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_owner();
  if p_role is null then delete from public.staff where user_id = p_user;       -- the guard trigger refuses to remove the last owner
  elsif p_role in ('owner','organiser') then
    insert into public.staff(user_id, role, granted_by) values (p_user, p_role, auth.uid()) on conflict (user_id) do update set role = excluded.role, granted_by = auth.uid();
  else raise exception 'role must be owner, organiser or null'; end if;
end $$;

create function public.owner_set_location_config(p_enabled boolean, p_correct int, p_no_choice text, p_bonus int, p_required uuid) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_owner();
  if p_correct is not null and not exists(select 1 from public.map_locations where id = p_correct) then raise exception 'unknown location'; end if;
  update public.location_config set enabled = coalesce(p_enabled, false), correct_location_id = p_correct, no_choice_treatment = p_no_choice, bonus_points = p_bonus, required_challenge_id = p_required where id;
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'location_config', jsonb_build_object('enabled', p_enabled, 'correct_set', p_correct is not null, 'no_choice', p_no_choice, 'bonus', p_bonus));   -- the correct option is never logged
end $$;

create function public.staff_get_location_config() returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  return (select jsonb_build_object('enabled', c.enabled, 'correct_location_id', c.correct_location_id, 'no_choice_treatment', c.no_choice_treatment, 'bonus_points', c.bonus_points,
    'required_challenge_id', c.required_challenge_id, 'complete', public.location_config_complete()) from public.location_config c);
end $$;

create function public.staff_add_answer(p_key text, p_answer text, p_username text default null) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare c public.challenges; secret text;
begin
  perform public.assert_staff();
  select * into c from public.challenges where key = p_key;
  if not found then raise exception 'unknown challenge'; end if;
  if c.requires_username then
    if public.norm(p_username, 'text') = '' or public.norm(p_answer, 'text') = '' then raise exception 'username and password are both required'; end if;
    secret := public.norm(p_username, 'text') || '|' || public.norm(p_answer, 'text');
  else
    if public.norm(p_answer, c.norm_mode) = '' then raise exception 'answer is empty after normalisation'; end if;
    secret := public.norm(p_answer, c.norm_mode);
  end if;
  insert into public.challenge_answers(challenge_id, answer_hash) values (c.id, encode(extensions.digest(c.salt || secret, 'sha256'), 'hex')) on conflict do nothing;
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'add_answer', jsonb_build_object('challenge', p_key));      -- the answer itself is never logged
end $$;
create function public.staff_clear_answers(p_key text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  delete from public.challenge_answers where challenge_id = (select id from public.challenges where key = p_key);
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'clear_answers', jsonb_build_object('challenge', p_key));
end $$;
create function public.staff_list_challenges() returns table(key text, label text, kind text, stage_id int, active boolean, requires_username boolean, attempt_limit int, norm_mode text, answer_count int)
language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  return query select c.key, c.label, c.kind, c.stage_id, c.active, c.requires_username, c.attempt_limit, c.norm_mode, (select count(*)::int from public.challenge_answers a where a.challenge_id = c.id)
    from public.challenges c order by c.sort_order, c.key;
end $$;

create function public.staff_complete_stage(p_participant uuid, p_stage int, p_reason text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare st public.stages; late boolean;
begin
  perform public.assert_staff();
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into st from public.stages where id = p_stage;
  if not found or not exists(select 1 from public.participants where id = p_participant) then raise exception 'unknown stage or participant'; end if;
  late := coalesce(now() > public.stage_close_at(p_stage), false);
  insert into public.stage_completions(participant_id, stage_id, late, points_earned, completed_by, manual) values (p_participant, p_stage, late, case when late then 0 else coalesce(st.points, 0) end, auth.uid(), true) on conflict do nothing;
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'complete_stage', jsonb_build_object('participant', p_participant, 'stage', p_stage, 'late', late, 'reason', p_reason));
end $$;
create function public.staff_adjust_score(p_participant uuid, p_delta int, p_reason text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  insert into public.score_adjustments(participant_id, delta, reason, staff_id) values (p_participant, p_delta, p_reason, auth.uid());
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'adjust_score', jsonb_build_object('participant', p_participant, 'delta', p_delta, 'reason', p_reason));
end $$;
create function public.staff_reset_participant(p_participant uuid, p_confirm text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  if p_confirm <> 'RESET' then raise exception 'confirmation required'; end if;
  delete from public.solves where participant_id = p_participant;  delete from public.stage_completions where participant_id = p_participant;
  delete from public.game_events where participant_id = p_participant;  delete from public.location_choices where participant_id = p_participant;
  delete from public.ending_state where participant_id = p_participant;
  update public.attempts set voided = true where participant_id = p_participant;     -- kept for review, but no longer counted against attempt limits
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'reset_participant', jsonb_build_object('participant', p_participant));
end $$;
create function public.staff_trigger_ending(p_participant uuid, p_reason text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  insert into public.ending_state(participant_id, triggered_by, via_event) values (p_participant, auth.uid(), 'staff') on conflict (participant_id) do update set active = true, reset_at = null, reset_by = null, reset_reason = null, triggered_at = now(), triggered_by = auth.uid(), via_event = 'staff';
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'trigger_ending', jsonb_build_object('participant', p_participant, 'reason', p_reason));
end $$;
create function public.staff_reset_ending(p_participant uuid, p_reason text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  update public.ending_state set active = false, reset_at = now(), reset_by = auth.uid(), reset_reason = p_reason where participant_id = p_participant;
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'reset_ending', jsonb_build_object('participant', p_participant, 'reason', p_reason));
end $$;
create function public.owner_reset_all_endings(p_confirm text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_owner();
  if p_confirm <> 'RESET ENDINGS' then raise exception 'confirmation required'; end if;
  update public.ending_state set active = false, reset_at = now(), reset_by = auth.uid(), reset_reason = 'global reset' where active;
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'reset_all_endings', '{}'::jsonb);
end $$;
create function public.owner_reset_all(p_confirm text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_owner();
  if p_confirm <> 'RESET ALL' then raise exception 'confirmation required'; end if;
  delete from public.solves where true;  delete from public.stage_completions where true;  delete from public.game_events where true;
  delete from public.location_choices where true;  delete from public.ending_state where true;
  update public.attempts set voided = true where not voided;
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'reset_all', '{}'::jsonb);
end $$;

create function public.staff_set_disabled(p_user uuid, p_disabled boolean, p_reason text) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare tr text;
begin
  perform public.assert_staff();
  if p_user = auth.uid() then raise exception 'you cannot disable your own account'; end if;
  select role into tr from public.staff where user_id = p_user;
  if tr = 'owner' then raise exception 'owners cannot be disabled'; end if;
  if tr = 'organiser' and not public.is_owner() then raise exception 'only an owner can disable an organiser'; end if;
  update public.profiles set disabled = p_disabled where id = p_user;          -- immediate: every rule and function checks this flag
  update auth.users set banned_until = case when p_disabled then 'infinity'::timestamptz else null end where id = p_user;   -- UNVERIFIED: also blocks new sign-ins and token refresh
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'set_disabled', jsonb_build_object('user', p_user, 'disabled', p_disabled, 'reason', p_reason));
end $$;

create function public.staff_move_member(p_user uuid, p_target uuid, p_reason text, p_allow_over_capacity boolean default false) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare cur public.participants; tgt public.participants; solo public.participants;
begin
  perform public.assert_staff();
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  perform 1 from public.profiles where id = p_user for update;
  if not found then raise exception 'unknown user'; end if;
  select * into solo from public.participants where solo_user_id = p_user;
  select p.* into cur from public.participant_members m join public.participants p on p.id = m.participant_id where m.user_id = p_user and m.left_at is null;
  if p_target is null then tgt := solo;
  else
    select * into tgt from public.participants where id = p_target and kind = 'team' and not retired for update;
    if not found then raise exception 'unknown or retired team'; end if;
  end if;
  if cur.id is not null and cur.id = tgt.id then return; end if;
  if tgt.kind = 'team' and not p_allow_over_capacity and (select count(*) from public.participant_members where participant_id = tgt.id and left_at is null) >= (select team_size_max from public.game_settings) then
    raise exception 'team is full (use the over-capacity flag to override)';
  end if;
  if cur.id is not null then
    update public.participant_members set left_at = now() where participant_id = cur.id and user_id = p_user;
    if cur.kind = 'solo' then update public.participants set retired = true where id = cur.id;    -- solo progress is kept on file but never merged or ranked
    elsif not exists(select 1 from public.participant_members where participant_id = cur.id and left_at is null) then update public.participants set retired = true where id = cur.id; end if;
  end if;
  update public.participant_members set left_at = null, joined_at = now() where participant_id = tgt.id and user_id = p_user;
  if not found then insert into public.participant_members(participant_id, user_id) values (tgt.id, p_user); end if;
  if tgt.kind = 'solo' then update public.participants set retired = false where id = tgt.id; end if;
  insert into public.membership_events(user_id, participant_id, action, actor_id, reason) values (p_user, tgt.id, 'staff_move', auth.uid(), p_reason);
  insert into public.audit_log(actor_id, action, detail) values (auth.uid(), 'move_member', jsonb_build_object('user', p_user, 'from', cur.id, 'to', tgt.id, 'over_capacity', p_allow_over_capacity, 'reason', p_reason));
end $$;

create function public.staff_overview() returns jsonb language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  perform public.assert_staff();
  return jsonb_build_object(
    'solo_players', (select count(*) from public.participants where kind = 'solo' and not retired), 'teams', (select count(*) from public.participants where kind = 'team' and not retired),
    'disabled_accounts', (select count(*) from public.profiles where disabled), 'late_completions', (select count(*) from public.stage_completions where late),
    'endings_active', (select count(*) from public.ending_state where active),
    'completions_by_stage', (select coalesce(jsonb_object_agg(q.stage_id::text, q.n), '{}'::jsonb) from (select stage_id, count(*) n from public.stage_completions group by stage_id) q),
    'recent_attempts', (select coalesce(jsonb_agg(r), '[]'::jsonb) from (select a.created_at, a.correct, c.key as challenge, pr.username, coalesce(p.name, 'solo') as participant
        from public.attempts a join public.challenges c on c.id = a.challenge_id left join public.profiles pr on pr.id = a.user_id left join public.participants p on p.id = a.participant_id order by a.created_at desc limit 20) r));
end $$;

-- ============================== ROW-LEVEL SECURITY: deny by default ==============================
alter table public.profiles enable row level security;            alter table public.staff enable row level security;
alter table public.participants enable row level security;        alter table public.participant_members enable row level security;
alter table public.membership_events enable row level security;   alter table public.game_settings enable row level security;
alter table public.stages enable row level security;              alter table public.challenges enable row level security;
alter table public.challenge_answers enable row level security;   -- no policies: unreachable by any client
alter table public.event_definitions enable row level security;   alter table public.stage_requirements enable row level security;
alter table public.timers enable row level security;              alter table public.release_rules enable row level security;
alter table public.map_locations enable row level security;       alter table public.location_config enable row level security;   -- location_config: no policies, unreachable
alter table public.documents enable row level security;           alter table public.messages enable row level security;
alter table public.message_reads enable row level security;       alter table public.doc_reads enable row level security;
alter table public.site_content enable row level security;        alter table public.attempts enable row level security;
alter table public.solves enable row level security;              alter table public.stage_completions enable row level security;
alter table public.game_events enable row level security;         alter table public.location_choices enable row level security;
alter table public.score_adjustments enable row level security;   alter table public.ending_state enable row level security;
alter table public.audit_log enable row level security;           alter table public.notes enable row level security;
alter table public.evidence_links enable row level security;

-- players read their own profile; staff read everything operational. Players get NO direct access to participants, memberships, solves or attempts (they use the functions).
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() and public.is_active()) with check (id = auth.uid());   -- column grant allows username only
create policy staff_select on public.staff for select to authenticated using (public.is_staff());
create policy participants_select on public.participants for select to authenticated using (public.is_staff());
create policy members_select on public.participant_members for select to authenticated using (public.is_staff());
create policy membership_events_select on public.membership_events for select to authenticated using (public.is_staff());
create policy settings_select on public.game_settings for select to authenticated using (public.is_staff());
create policy attempts_select on public.attempts for select to authenticated using (public.is_staff());
create policy solves_select on public.solves for select to authenticated using (public.is_staff());
create policy completions_select on public.stage_completions for select to authenticated using (public.is_staff());
create policy events_select on public.game_events for select to authenticated using (public.is_staff());
create policy choices_select on public.location_choices for select to authenticated using (public.is_staff());
create policy adjustments_select on public.score_adjustments for select to authenticated using (public.is_staff());
create policy ending_select on public.ending_state for select to authenticated using (public.is_staff());
create policy audit_select on public.audit_log for select to authenticated using (public.is_staff());
-- structure tables: staff read, OWNER only writes
create policy stages_select on public.stages for select to authenticated using (public.is_staff());
create policy stages_owner on public.stages for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy challenges_select on public.challenges for select to authenticated using (public.is_staff());
create policy challenges_owner on public.challenges for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy events_def_select on public.event_definitions for select to authenticated using (public.is_staff());
create policy events_def_owner on public.event_definitions for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy requirements_select on public.stage_requirements for select to authenticated using (public.is_staff());
create policy requirements_owner on public.stage_requirements for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy timers_select on public.timers for select to authenticated using (public.is_staff());
create policy timers_owner on public.timers for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy rules_select on public.release_rules for select to authenticated using (public.is_staff());
create policy rules_owner on public.release_rules for all to authenticated using (public.is_owner()) with check (public.is_owner());
-- content: players see only what the release rule allows; staff write
create policy map_select on public.map_locations for select to authenticated using (public.is_staff() or public.can_see_content(release_rule_id, false));
create policy map_owner on public.map_locations for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy documents_select on public.documents for select to authenticated using (public.is_staff() or (status = 'published' and public.can_see_content(release_rule_id, visible_during_ending)));
create policy documents_staff on public.documents for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy messages_select on public.messages for select to authenticated using (public.is_staff() or (status = 'published' and public.can_see_content(release_rule_id, visible_during_ending)));
create policy messages_staff on public.messages for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy content_select_anon on public.site_content for select to anon using (is_public);   -- no function calls: anon has no EXECUTE rights
create policy content_select_auth on public.site_content for select to authenticated using (is_public or public.is_active() or public.is_staff());
create policy content_staff on public.site_content for all to authenticated using (public.is_staff()) with check (public.is_staff());
-- personal read markers
create policy message_reads_own on public.message_reads for all to authenticated using (user_id = auth.uid() and public.is_active()) with check (user_id = auth.uid() and public.is_active() and exists(select 1 from public.messages m where m.id = message_id));
create policy doc_reads_own on public.doc_reads for all to authenticated using (user_id = auth.uid() and public.is_active()) with check (user_id = auth.uid() and public.is_active() and exists(select 1 from public.documents d where d.id = document_id));
-- notes and links are SHARED inside one participant (a team sees its own, nobody sees another team's); only the author edits a note
create policy notes_select on public.notes for select to authenticated using (participant_id = public.my_participant() and public.is_active());
create policy notes_insert on public.notes for insert to authenticated with check (participant_id = public.my_participant() and author_id = auth.uid() and public.is_active());
create policy notes_update on public.notes for update to authenticated using (participant_id = public.my_participant() and author_id = auth.uid() and public.is_active()) with check (participant_id = public.my_participant() and author_id = auth.uid());
create policy notes_delete on public.notes for delete to authenticated using (participant_id = public.my_participant() and author_id = auth.uid() and public.is_active());
create policy links_select on public.evidence_links for select to authenticated using (participant_id = public.my_participant() and public.is_active());
create policy links_insert on public.evidence_links for insert to authenticated with check (participant_id = public.my_participant() and created_by = auth.uid() and public.is_active()
  and exists(select 1 from public.documents d where d.id = doc_a) and exists(select 1 from public.documents d where d.id = doc_b));   -- documents RLS: both must be visible to the caller
create policy links_delete on public.evidence_links for delete to authenticated using (participant_id = public.my_participant() and created_by = auth.uid() and public.is_active());

-- ============================== STORAGE ==============================
-- evidence: PRIVATE. Readable only for files attached to a document the caller can currently see. Also set file size and MIME limits in the dashboard.
insert into storage.buckets(id, name, public) values ('evidence', 'evidence', false) on conflict (id) do nothing;
-- public-assets: PUBLIC decorative files only (logos, textures). Never put evidence or anything secret here.
insert into storage.buckets(id, name, public) values ('public-assets', 'public-assets', true) on conflict (id) do nothing;
create policy evidence_read on storage.objects for select to authenticated using (bucket_id = 'evidence'
  and (public.is_staff() or exists(select 1 from public.documents d where d.file_path = storage.objects.name)));   -- the documents policy already hides locked ones
create policy evidence_staff on storage.objects for all to authenticated using (bucket_id = 'evidence' and public.is_staff()) with check (bucket_id = 'evidence' and public.is_staff());
create policy public_assets_staff on storage.objects for all to authenticated using (bucket_id = 'public-assets' and public.is_staff()) with check (bucket_id = 'public-assets' and public.is_staff());

-- ============================== PRIVILEGES: nothing by default, then exactly what is needed ==============================
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;   -- later functions are NOT callable by PUBLIC unless granted
grant usage on schema public to anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant select on public.profiles, public.staff, public.participants, public.participant_members, public.membership_events, public.game_settings, public.attempts, public.solves,
  public.stage_completions, public.game_events, public.location_choices, public.score_adjustments, public.ending_state, public.audit_log, public.stages, public.challenges,
  public.event_definitions, public.stage_requirements, public.timers, public.release_rules, public.map_locations, public.documents, public.messages to authenticated;
grant insert, update, delete on public.stages, public.challenges, public.event_definitions, public.stage_requirements, public.timers, public.release_rules, public.map_locations,
  public.documents, public.messages, public.site_content to authenticated;      -- row-level policies limit these to owners or staff
grant update (username) on public.profiles to authenticated;                    -- disabled is NOT client-editable
grant select, insert, update on public.message_reads, public.doc_reads to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, delete on public.evidence_links to authenticated;
grant execute on function public.get_public_config(), public.get_public_stage_overview(), public.username_available(text) to anon, authenticated;
grant execute on function public.is_active(), public.is_staff(), public.is_owner(), public.my_participant(), public.can_see_content(uuid, boolean),
  public.get_my_state(), public.submit_challenge(text, text, text), public.record_event(text), public.choose_location(int), public.get_location_state(),
  public.mark_document_read(text), public.mark_message_read(uuid), public.create_team(text), public.join_team(text), public.leave_team(), public.rotate_invite_code(),
  public.get_my_team(), public.get_leaderboard(text), public.delete_my_account(text), public.update_settings(jsonb), public.owner_set_staff(uuid, text),
  public.owner_set_location_config(boolean, int, text, int, uuid), public.owner_reset_all(text), public.owner_reset_all_endings(text),
  public.staff_get_location_config(), public.staff_add_answer(text, text, text), public.staff_clear_answers(text), public.staff_list_challenges(),
  public.staff_complete_stage(uuid, int, text), public.staff_adjust_score(uuid, int, text), public.staff_reset_participant(uuid, text),
  public.staff_trigger_ending(uuid, text), public.staff_reset_ending(uuid, text), public.staff_set_disabled(uuid, boolean, text),
  public.staff_move_member(uuid, uuid, text, boolean), public.staff_overview() to authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;       -- UNVERIFIED but harmless: lets the auth service fire the signup trigger

-- ============================== SAFE INITIAL CONFIGURATION: structure only; everything unresolved is inactive ==============================
insert into public.stages(id, public_title) values
  (1, 'The Archived Files and the Exorcist’s Letter'), (2, 'The Locked Documents and the Coordinates'), (3, 'The Map and the Killer’s Challenge'),
  (4, 'The Reversed Audio and the Suspicious Call'), (5, 'The Newspaper Reports and Suspect Database'), (6, 'Ellen Vale’s Journal and the Final Review'), (7, 'The Final Article');
-- Password-sheet gates. ALL INACTIVE and WITHOUT ANSWERS. stage_id is set only where the PDF ties the gate to a stage; NULL = unresolved placement.
insert into public.challenges(key, label, kind, stage_id, requires_username, sort_order) values
  ('gate_archive', 'Archive', 'gate', 1, false, 10), ('gate_zk_login', 'Locked files login (username and password)', 'gate', 1, true, 20),
  ('gate_map', 'Map', 'gate', 3, false, 30), ('gate_audio', 'Audio Evidence', 'gate', null, false, 40), ('gate_witness', 'Witness Files', 'gate', null, false, 50),
  ('gate_suspect_db', 'Suspect Database', 'gate', 5, false, 60), ('gate_cipher_terminal', 'Cipher Terminal', 'gate', null, false, 70),
  ('gate_restricted_dossier', 'Restricted Dossier', 'gate', null, false, 80);
insert into public.timers(key, anchor_type, configured) values ('game_start', 'game_start', true);
insert into public.timers(key, anchor_type, stage_id, configured) select 'stage_' || id || '_open', 'stage_open', id, true from public.stages;
insert into public.timers(key, anchor_type, notes) values
  ('location_choice_deadline', 'absolute', 'UNRESOLVED: deadline and trigger event not yet confirmed by the organiser'),
  ('location_reveal', 'absolute', 'UNRESOLVED: reveal delay and trigger event not yet confirmed by the organiser');
insert into public.release_rules(key, timer_key) values ('open_from_start', 'game_start');
insert into public.release_rules(key, timer_key) select 'stage_' || id || '_open', 'stage_' || id || '_open' from public.stages;
insert into public.release_rules(key, timer_key, requires_challenge_id) values ('map_unlocked', 'stage_3_open', (select id from public.challenges where key = 'gate_map'));
insert into public.map_locations(id, name, sort_order, release_rule_id) values
  (1, 'Lake Herman Road, Benicia, California', 1, (select id from public.release_rules where key = 'map_unlocked')),
  (2, 'Blue Rock Springs Park, Vallejo, California', 2, (select id from public.release_rules where key = 'map_unlocked')),
  (3, 'Lake Berryessa, Napa County, California', 3, (select id from public.release_rules where key = 'map_unlocked')),
  (4, 'Washington and Cherry Streets, Presidio Heights, San Francisco, California', 4, (select id from public.release_rules where key = 'map_unlocked'));
insert into public.site_content(key, title, body, is_public) values
  ('disclaimer', 'This is a work of fiction', 'THE LAST SIGNAL is interactive fiction and an educational mystery game. It is not a real investigation and nothing in it is an official law-enforcement communication. All messages, documents, testimony, audio and video are fictional reconstructions created for gameplay. The game is played entirely online: never visit any real location. You can leave or pause at any time.', true),
  ('safety_exit', 'Help, exit and safety', '[ORGANISER: not yet supplied. Add who to contact and how to leave or pause the game.]', true),
  ('support', 'Technical support', '[ORGANISER: not yet supplied]', true), ('privacy', 'Privacy information', '[ORGANISER: not yet supplied]', true),
  ('landing_intro', 'Landing introduction', '[ORGANISER: not yet supplied]', true), ('rules_instructions', 'Game instructions', '[ORGANISER: not yet supplied]', false),
  ('rules_submission', 'Submission rules', '[ORGANISER: not yet supplied]', false), ('rules_scoring', 'Scoring rules', '[ORGANISER: not yet supplied]', false),
  ('rules_teams', 'Team rules', '[ORGANISER: not yet supplied]', false), ('ending_debrief', 'After the story ends', '[ORGANISER: not yet supplied. Recommended: a calm debrief explaining the story was fiction.]', false);
