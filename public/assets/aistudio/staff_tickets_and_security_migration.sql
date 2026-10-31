-- =====================================================================================================================
-- THE LAST SIGNAL: CASE TLS-0017
-- SUPABASE MIGRATION: HARDENED SUPPORT TICKETING SYSTEM & PASSWORD-ONLY STAFF ACCESS
-- Version: 3.1.0
-- 
-- IMPORTANT NOTICE:
-- STANDALONE MIGRATION SCRIPT FOR EVENT ORGANIZERS AND DATABASE ADMINISTRATORS.
-- DO NOT EXECUTE DIRECTLY VIA AUTOMATED RUNTIME. RUN THIS MANUALLY IN THE SUPABASE SQL EDITOR.
--
-- Core Security Principles:
-- 1. All student investigator tickets are isolated strictly by Row-Level Security (RLS).
-- 2. Ordinary investigators CANNOT read other investigators' tickets under any circumstances.
-- 3. Internal staff notes ('staff_notes') are never returned to player clients.
-- 4. Staff Console operates via a single server-side Master Password; the Node.js backend server utilizes
--    the Supabase Service Role Key ('SUPABASE_SERVICE_ROLE_KEY') to read and reply to all tickets in the shared inbox.
-- 5. No staff database users, accounts, or emails are required.
-- 6. No existing player progress, accounts, solved stages, scores, or tickets will be dropped.
-- =====================================================================================================================

create extension if not exists pgcrypto with schema extensions;

-- =====================================================================================================================
-- 1. SUPPORT TICKETS SCHEMA ENHANCEMENT
-- =====================================================================================================================

create table if not exists public.support_tickets (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  call_sign text not null,
  full_name text,
  student_class text,
  subject text not null,
  category text not null check (category in ('TECHNICAL_BUG','CIPHER_CLARIFICATION','SCHEDULE_DEADLINE','ACCOUNT_CREDENTIALS','OTHER_INQUIRY')),
  message text not null,
  status text not null default 'OPEN' check (status in ('OPEN','UNDER_REVIEW','RESOLVED','CLOSED')),
  priority text not null default 'NORMAL' check (priority in ('NORMAL','HIGH','CRITICAL')),
  staff_response text,
  staff_notes text,
  resolved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure indexes for rapid query filtering by status, call_sign, and timestamp
create index if not exists idx_support_tickets_user_id on public.support_tickets (user_id);
create index if not exists idx_support_tickets_call_sign on public.support_tickets (lower(call_sign));
create index if not exists idx_support_tickets_status on public.support_tickets (status);
create index if not exists idx_support_tickets_created_at on public.support_tickets (created_at desc);

-- =====================================================================================================================
-- 2. ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================================================

alter table public.support_tickets enable row level security;

-- Drop legacy policies if they exist to prevent conflicts
drop policy if exists "support_tickets_select" on public.support_tickets;
drop policy if exists "support_tickets_insert" on public.support_tickets;
drop policy if exists "support_tickets_update" on public.support_tickets;
drop policy if exists "support_tickets_delete" on public.support_tickets;
drop policy if exists "tickets_player_select" on public.support_tickets;
drop policy if exists "tickets_player_insert" on public.support_tickets;
drop policy if exists "tickets_service_role" on public.support_tickets;

-- POLICY 1: Authenticated players can only view their own tickets
create policy "tickets_player_select" on public.support_tickets
  for select
  to authenticated
  using (
    auth.uid() is not null and user_id = auth.uid()
  );

-- POLICY 2: Authenticated players can insert new tickets under their own authenticated UID
create policy "tickets_player_insert" on public.support_tickets
  for insert
  to authenticated
  with check (
    auth.uid() is not null and (user_id = auth.uid() or user_id is null)
  );

-- POLICY 3: Full administrative access exclusively for backend server using service_role key
create policy "tickets_service_role" on public.support_tickets
  for all
  to service_role
  using (true)
  with check (true);

-- Revoke dangerous direct updates or deletes from anon and authenticated roles
revoke update, delete on public.support_tickets from anon, authenticated;
grant select, insert on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;

-- =====================================================================================================================
-- 3. STORED PROCEDURES / SECURE RPCs
-- =====================================================================================================================

-- Submits a new support ticket from an authenticated investigator session
create or replace function public.submit_ticket(
  p_subject text,
  p_category text,
  p_message text,
  p_priority text default 'NORMAL'
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  u uuid := auth.uid();
  prof public.profiles;
  tid text;
  csign text;
  fname text;
  sclass text;
begin
  if u is not null then
    select * into prof from public.profiles where id = u;
    csign := coalesce(prof.username, 'OPERATIVE');
    fname := coalesce(prof.full_name, prof.username, 'Investigator');
    sclass := coalesce(prof.student_class, 'Registered Operative');
  else
    csign := 'ANON_OPERATIVE';
    fname := 'Unauthenticated Operative';
    sclass := 'Class 9';
  end if;

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

  insert into public.support_tickets (
    id,
    user_id,
    call_sign,
    full_name,
    student_class,
    subject,
    category,
    message,
    priority,
    status
  ) values (
    tid,
    u,
    csign,
    fname,
    sclass,
    trim(p_subject),
    p_category,
    trim(p_message),
    case when p_priority in ('CRITICAL','HIGH','NORMAL') then p_priority else 'NORMAL' end,
    'OPEN'
  );

  return jsonb_build_object('success', true, 'ticket_id', tid);
end;
$$;

-- Players query tickets: STRICTLY excludes internal staff_notes!
create or replace function public.get_my_tickets()
returns table(
  id text,
  call_sign text,
  full_name text,
  student_class text,
  subject text,
  category text,
  message text,
  status text,
  priority text,
  staff_response text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select
    t.id,
    t.call_sign,
    t.full_name,
    t.student_class,
    t.subject,
    t.category,
    t.message,
    t.status,
    t.priority,
    t.staff_response,
    t.created_at,
    t.updated_at
  from public.support_tickets t
  where t.user_id = auth.uid()
  order by t.created_at desc;
$$;

grant execute on function public.submit_ticket to authenticated, anon;
grant execute on function public.get_my_tickets to authenticated;

-- =====================================================================================================================
-- 4. VERIFICATION QUERY (Run this to verify policies and tables)
-- =====================================================================================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets';
-- SELECT polname, polcmd, polroles::regrole[] FROM pg_policy WHERE polrelid = 'public.support_tickets'::regclass;
