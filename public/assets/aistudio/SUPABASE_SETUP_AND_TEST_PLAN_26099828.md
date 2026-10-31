# THE LAST SIGNAL --- Supabase Setup & Manual Test Plan

**Purpose:** Beginner-friendly implementation guide for the supplied
`case17_migration.sql`.\
**Status:** Planning document only. The migration and rollback have
**not** been tested against a live database. Do not treat a static
self-check as proof of correctness or security.

## 1. Files and responsibilities

-   `case17_migration.sql` --- creates the database objects, policies,
    triggers, functions, and initial settings.
-   `case17_selfcheck.py` --- static text/structure checks; it does not
    execute SQL.
-   `case17_rollback.sql` --- attempts to remove objects created by the
    migration; it is untested and may destroy data. Do not use it
    casually.
-   `1_review_report.md` --- documents the design and known unverified
    areas.
-   `The_Last_Signal_Organized.pdf` --- story and puzzle source of
    truth. Where story details are unresolved, leave them inactive
    rather than inventing answers.

## 2. Before creating a project

1.  Keep a backup copy of the ZIP and story PDF.
2.  Create a **new, separate Supabase project** for THE LAST SIGNAL.
    Never use the old Dyatlov project.
3.  Use a strong, unique database password and store it privately.
4.  Do not put a Supabase `service_role` key, database password, or
    other secret in Lovable prompts, frontend code, screenshots, GitHub,
    or public documents.
5.  Decide who may register, team-size limit, username rules, whether
    email confirmation is enabled, and who will be the owner. Use
    usernames only unless the school explicitly approves collecting more
    data.
6.  Get school/teacher approval for the story, ending, sound effects,
    and handling of student accounts. Make the experience clearly
    fictional and online-only; do not direct players to visit real-world
    locations.

## 3. Apply the migration safely

Do this only after reviewing the full SQL.

1.  In the Supabase dashboard, verify the project name before opening
    SQL Editor.

2.  Confirm the project is new and has no application data you need to
    preserve.

3.  Open the supplied migration in a text editor and inspect it from
    beginning to end. Check that it contains no secrets and no
    references to the old project.

4.  Run the static checker locally:

    ``` bash
    python case17_selfcheck.py case17_migration.sql
    ```

    Use the actual CLI arguments supported by the supplied script; if
    the command above does not match its usage text, follow the script's
    help/output. A passing result is only a static check.

5.  Review the `UNVERIFIED` comments in the SQL and the review report,
    especially the `auth.users` trigger, writes to `auth.users`, the
    `supabase_auth_admin` grant, Storage policies/bucket creation, and
    account disable/delete paths.

6.  Only after a human review, run the migration against the **fresh
    test project**, preferably in a maintenance window. Save the full
    SQL Editor output. If it errors, stop; don't blindly rerun the whole
    migration. Diagnose the first error and determine whether any
    earlier statements committed.

7.  Verify that all expected tables, functions, triggers, policies and
    the private evidence bucket exist. Do not upload real student data
    yet.

8.  Never execute the rollback script merely to "see if it works." First
    inspect exactly what it drops and what data it could destroy.

## 4. Dashboard configuration to verify manually

The exact options can vary by Supabase dashboard version. Review the
current dashboard and the SQL comments rather than assuming defaults.

-   **Authentication:** registration enabled/disabled as intended; email
    confirmation decision; password policy; redirect/site URLs; CAPTCHA
    or abuse protection if available.
-   **User metadata:** only permitted username data is accepted;
    role/staff status cannot be set by a client during sign-up.
-   **Storage:** evidence bucket is private; no public bucket or
    permanent public object URLs for protected evidence.
-   **API keys:** only the publishable/anon key may be used in browser
    configuration; never expose service-role or database credentials.
-   **Database:** RLS is enabled on all intended application tables;
    function execute grants are least-privilege; no answer hashes or
    secret location configuration are readable by players.
-   **Backups/logging:** understand the project's backup and log
    retention options; don't put student personal information in logs.
-   **Production domain:** configure the approved domain and
    authentication redirect URLs before the launch.
-   **Owner access:** establish the initial owner using the reviewed,
    documented procedure. Never promote a user by adding a
    frontend-controlled role field.

## 5. Critical manual test plan

Run these tests on the separate test project with dummy accounts. Record
**Pass / Fail / Not tested**, date, tester, and notes. Do not test only
with the owner account.

### A. Migration and basic setup

-   [ ] Migration completes without SQL errors on a fresh project.
-   [ ] A second run is either safely prevented or its failure is
    clearly understood; do not assume idempotency.
-   [ ] Expected tables, functions, triggers, policies and private
    storage bucket exist.
-   [ ] No answer hashes, private location config, staff-only tables, or
    service secrets are accessible to a normal player.
-   [ ] No accidental references to the legacy Dyatlov project exist.

### B. Authentication and account status

-   [ ] Registration succeeds only when registration is open.
-   [ ] Username validation rejects malformed or duplicate names.
-   [ ] A client cannot register itself as staff/owner.
-   [ ] A disabled account cannot read protected content, submit
    answers, choose a location, or use admin functions.
-   [ ] Sign-in, sign-out, session refresh, and password reset behave as
    intended.
-   [ ] Account deletion follows the intended confirmation and cleanup
    behavior; staff accounts are handled safely.

### C. Individual and team membership

-   [ ] New account receives one solo participant.
-   [ ] Creating a team creates one shared team participant and does not
    duplicate progress or score.
-   [ ] Joining a team requires a valid invite code; invalid attempts
    are rate-limited and audited.
-   [ ] Team-size limits are enforced even for simultaneous join
    requests.
-   [ ] Team members have separate logins but see the same shared
    progress, accepted solves, stage completion, location choice, ending
    state and team score.
-   [ ] Personal notes and read markers remain personal.
-   [ ] A late-authorised member inherits the team's existing progress
    without duplicated score.
-   [ ] Membership changes are blocked after the lock time unless an
    authorised staff override with a reason is used.
-   [ ] Retired solo participants are excluded from leaderboards and are
    not merged into team progress.

### D. Content access and answer handling

-   [ ] Locked documents/messages are not returned by database queries,
    not merely hidden by the UI.
-   [ ] Direct requests for a locked Storage object fail.
-   [ ] Signed evidence links expire as configured and stop working for
    new requests after access is revoked/account disabled.
-   [ ] Correct answer records a solve once; duplicate submissions do
    not duplicate points.
-   [ ] Wrong answers receive a safe response and trigger the configured
    attempt/rate limits.
-   [ ] Answers, hashes and private location configuration are never
    returned to browser clients or included in client logs.
-   [ ] A user cannot submit an arbitrary participant ID or act on
    another team.
-   [ ] Unreachable challenge IDs do not reveal whether hidden content
    exists.

### E. Stage windows, events and location choice

-   [ ] Set a test start time and confirm Stage 1 opening/closing times
    in the intended timezone.
-   [ ] Verify each stage opens at the intended offset: start + 2 ×
    (stage number − 1) days, if that is the approved schedule.
-   [ ] Verify the final stage has a workable completion window and the
    intended November 14 finale is not shifted by an off-by-one error.
-   [ ] Late stage completion is allowed but gives zero stage points.
-   [ ] Later-stage schedule opening does not bypass challenge/document
    prerequisites.
-   [ ] Pausing blocks submissions/choices while the agreed clock
    behavior is preserved.
-   [ ] Location choice can be made once only, only when configured and
    eligible.
-   [ ] Correctness is not returned before the reveal timer.
-   [ ] No-choice and wrong-choice outcomes reveal only at the
    configured time.
-   [ ] Test every 24-hour and 48-hour timer separately; do not assume
    they are interchangeable.
-   [ ] Stage requirements with no configured requirements do not
    auto-complete.

### F. Scores, leaderboard, admin and ending

-   [ ] Stage points are awarded once and late stages award zero.
-   [ ] Location bonus is counted only after reveal and only according
    to the approved rule.
-   [ ] Score adjustments require authorised staff, a reason, and an
    audit entry.
-   [ ] Individual and team leaderboards are separate and obey
    visibility settings.
-   [ ] Disabled, retired and staff participants are excluded as
    intended.
-   [ ] Organiser cannot grant owner privileges or change owner-only
    settings.
-   [ ] Last-owner protection works; an owner cannot be removed/demoted
    in a way that leaves no owner.
-   [ ] Admin actions are blocked server-side for ordinary players, even
    if they manually call functions.
-   [ ] Participant reset, ending reset, and global reset are tested
    only with disposable dummy data and explicit confirmation.
-   [ ] Ending state is persistent, but account controls, help/exit, and
    required safety/debrief content remain accessible.
-   [ ] Audit log captures privileged actions without exposing
    unnecessary personal information.

### G. Devices and release readiness

-   [ ] Test mobile Android and desktop browsers.
-   [ ] Test slow network, refresh, expired session, empty states, and
    server errors.
-   [ ] Scheduled content appears after its server-side release time
    without requiring users to sign out.
-   [ ] The UI refreshes/re-fetches content when a timer expires;
    database time checks alone do not refresh a page.
-   [ ] Audio is never forced at high volume; sound can be muted and
    reduced-scare mode is available.
-   [ ] No strobe/rapid flashing, graphic violence, fake emergency
    alerts, or instructions to visit real locations.
-   [ ] Teacher/school approval and the ending debrief are complete.

## 6. Release gate

Do not launch for students until all critical tests pass, especially
migration success, account status, RLS, Storage access, answer secrecy,
team isolation, timers, score integrity and admin role checks. If a
critical test fails, disable registration/gameplay and fix it before
launch.

The static checker is useful evidence that certain patterns are present;
it is not a substitute for these tests.
