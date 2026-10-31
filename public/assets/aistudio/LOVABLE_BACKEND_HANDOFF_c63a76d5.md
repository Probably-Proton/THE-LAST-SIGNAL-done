# THE LAST SIGNAL --- Lovable Backend Integration Handoff

## Goal

Build the actual player-facing website and protected `/admin` panel for
the seven-stage, 14-calendar-day school mystery game. Use the supplied
`case17_migration.sql` as the intended backend contract **only after it
has been reviewed and successfully applied to a separate test Supabase
project**.

This document describes the expected integration based on the supplied
SQL and review report. The schema has not been tested live. Confirm
actual function signatures and return shapes from the deployed database
before implementing final calls.

## Source-of-truth files

1.  `The_Last_Signal_Organized.pdf` --- story, puzzles, clues and
    developer notes.
2.  `case17_migration.sql` --- intended database schema and server
    functions.
3.  `1_review_report.md` --- architecture summary, known limits,
    unresolved story decisions.
4.  `case17_selfcheck.py` --- static checker only; it does not execute
    SQL.
5.  `case17_rollback.sql` --- untested destructive rollback; never run
    casually.

Do not import or connect to the old Dyatlov project. Do not invent story
answers, scoring values, messages, correct location, timer triggers, or
stage completion rules. Keep unresolved content inactive until an
organiser confirms it.

## Technical boundaries

-   Lovable owns UI, routing, accessibility, responsive layout,
    audio/video playback, visual effects and interaction states.
-   Supabase owns authentication, identity, database state, access
    rules, answer checking, progression, timers, scoring, membership,
    scheduled visibility and privileged actions.
-   Never implement answer validation, scoring, stage unlocking,
    location correctness or staff permissions solely in frontend
    JavaScript.
-   Never expose the Supabase service-role key, database password,
    accepted answers, answer hashes, private location configuration or
    hidden story content in the browser.
-   Use only the publishable/anon key in the frontend, plus environment
    variables supported by Lovable. Do not put secrets in prompts or
    source files.
-   Treat all client input and returned data as untrusted. Show safe,
    accessible error states.
-   Use the deployed database's actual function signatures. Do not
    assume the functions return a particular JSON shape without checking
    the SQL and testing it.

## Expected backend concepts

### Authentication and identity

-   Supabase Auth with `profiles` for usernames.
-   A `participants` row represents either a solo player or a team;
    `participant_members` associates individual accounts with that
    shared participant.
-   Never send a participant ID to player-facing functions as an
    authority claim. The backend derives the active participant from the
    authenticated account.
-   Disabled accounts must be blocked from protected gameplay and admin
    actions.
-   Do not expose staff role assignment in signup or profile-edit UI.

### Player-facing operations present in the migration

Inspect the exact definitions/return shapes in SQL before wiring each: -
`get_my_state` - `get_public_config` - `get_my_team` - `create_team` -
`join_team` - `leave_team` - `rotate_invite_code` - `get_leaderboard` -
`submit_challenge` - `record_event` - `choose_location` -
`get_my_messages` - `mark_message_read` - `get_my_documents` -
`mark_document_read` - `get_my_notes` - `save_note` - `delete_note` -
`get_my_evidence_links` - `save_evidence_link` - `delete_evidence_link`

The migration may include additional functions; inspect it rather than
inventing missing ones. If a desired read operation has no suitable safe
function or RLS path, flag it for backend review instead of bypassing
security.

### Staff/admin operations present in the migration

Inspect exact signatures and ensure only authorised staff can invoke
them: - `staff_overview` - `update_settings` - `staff_publish_content` -
`staff_set_stage` - `staff_set_challenge` - `staff_add_answer` -
`staff_clear_answers` - `staff_list_challenges` -
`staff_complete_stage` - `staff_adjust_score` -
`staff_reset_participant` - `staff_trigger_ending` -
`staff_reset_ending` - `owner_reset_all_endings` - `owner_reset_all` -
`staff_set_disabled` - `staff_move_member` - `owner_set_staff` -
`owner_set_location_config`

Do not expose all of these to every staff role. The backend is the
authority; the UI should also hide actions users cannot perform, but UI
hiding is not security.

## Player routes and pages

Build a clean, usable structure with responsive mobile navigation and
desktop sidebar:

-   `/` --- landing / sign-in entry, clearly identifying this as a
    fictional school mystery game.
-   `/dashboard` --- current stage, server-derived time remaining,
    recent messages, progress, and next available action.
-   `/investigation` --- archive index and case chronology.
-   `/evidence` --- evidence collection, tags, status,
    source/date/ID/classification, related evidence.
-   `/evidence/:id` --- dedicated viewer for an accessible document or
    media item. A URL alone must not grant access.
-   `/map` --- four in-game locations from the story, clearly labelled
    as investigation clues. Online-only; never encourage physical
    visits.
-   `/messages` --- timestamped one-way messages from Director,
    antagonist and system.
-   `/progress` --- stage status, solved requirements and completion
    state.
-   `/leaderboard` --- separate individual and team tabs, subject to
    server visibility settings.
-   `/team` --- create/join/leave team, display shared progress, manage
    invite code if permitted.
-   `/account` --- username and sign-out.
-   `/admin` --- protected admin panel inside the same website.

Do not invent extra player routes if the backend does not support them.
Preserve accessible exit/help/account controls during any ending or
freeze effect.

## Visual direction

-   Dark forensic archive, near-black/charcoal surfaces, off-white paper
    text, restrained dark red, muted grey/beige.
-   Clean modern navigation and typography; typewriter styling only for
    evidence text.
-   Subtle paper grain, worn document edges, ink smudges, fingerprints,
    redaction bars and evidence stamps.
-   Cinematic but highly legible; avoid generic dashboard templates,
    neon cyberpunk and cluttered escape-room UI.
-   Use a dedicated document viewer, image zoom, waveform-style audio
    player, playback speed, optional transcript, video viewer, tags,
    notes and related-evidence links.
-   Audio/video must not autoplay sound. Include mute, volume control,
    captions/transcripts where available and a reduced-scare option.
-   No strobing, graphic violence, fake emergency alerts, or actual
    crash/freeze that destroys progress. Any freeze is a controlled
    visual state; refresh must recover state.

## Core interaction requirements

1.  Fetch real server state after login and on page focus/refresh.
2.  Treat server response as authoritative for stage status, remaining
    time, locks, progress, score and outcomes.
3.  When a scheduled release time passes, refresh/re-fetch or subscribe
    to a safe update so the UI changes without requiring sign-out. A
    database timestamp alone does not update an already-open page.
4.  Show loading, empty, locked, unavailable, expired-session and error
    states.
5.  Do not reveal whether a hidden challenge exists through distinct
    frontend error messages.
6.  For submissions, show pending state and prevent accidental
    double-clicks; server still handles concurrency.
7.  For location choice, show one irreversible confirmation, then
    disable further choices; do not show correctness until the server
    says the reveal time has passed.
8.  For notes/read markers, keep personal data personal even when team
    progress is shared.
9.  Leaderboard scores and ordering must come from the backend; never
    calculate authoritative scores in frontend code.

## Admin panel

Implement a clear, low-clutter `/admin` panel inside the main app: -
Overview of game status, registration, pause state, stage windows and
progress. - Content editor for announcements, messages and documents. -
Schedule/release controls. - Stage/challenge management and answer
management with masked values (never display existing answer hashes or
plaintext answers to normal players). - Participant/team overview and
audited membership overrides. - Score adjustments with mandatory
reason. - Disable/enable account controls. - Ending controls and resets
with explicit confirmation. - Settings and staff management restricted
to the correct role.

If scheduling requires a timestamp, store and display it with an
explicit timezone. Confirm server-side visibility rules. Do not rely on
frontend timers to publish content.

## Implementation sequence

### Phase A --- visual shell

Create routes, navigation, reusable cards, evidence viewer layout and
responsive styling using clearly labelled sample data. Keep sample data
in one isolated mock-data module. Do not imply the app is connected to
Supabase yet.

### Phase B --- authentication and real state

Connect the correct fresh Supabase project. Implement sign-in/sign-up
according to approved registration settings, session handling, profile
setup and `get_my_state`. Remove mock auth.

### Phase C --- read paths and protected evidence

Wire public config, available documents/messages/map content, read
markers, private storage links, notes and evidence links. Verify
inaccessible content is not returned by the backend.

### Phase D --- gameplay mutations

Wire answer submissions, events, location choice, team operations,
progress and leaderboards. Use actual function contracts and verify both
solo and team accounts.

### Phase E --- admin

Add role-aware controls using the backend staff functions. Test direct
RPC calls as a normal player to ensure the server rejects them.

### Phase F --- release QA

Test mobile/desktop, timers, lock states, refresh behaviour, rate
limits, duplicate submissions, scheduled releases, audio controls,
ending/exit, and accessibility. Do not launch until critical security
tests pass.

## Acceptance criteria

-   No fake buttons; every visible control works or is explicitly marked
    as not yet available.
-   No production secrets in frontend code.
-   No client-side authority over answers, scores, stage locks, location
    correctness or staff roles.
-   Solo and team progress behaves according to the shared participant
    model.
-   Locked content is protected by the backend, not just visually
    hidden.
-   All timed content follows server time and refreshes in an open
    client.
-   Admin mutations require server-side authorisation and are audited
    where designed.
-   Unresolved story content stays inactive and is not fabricated.
