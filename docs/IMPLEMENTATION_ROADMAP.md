# THE LAST SIGNAL — Master Implementation Roadmap (Phases 1–6)

> **Document Status:** Complete Implementation Blueprint  
> **Target Release:** 14-Day School-Wide Mystery Event (Classes 6–12)  
> **Authoring Entity:** AI Studio Technical Architecture Team  
> **Source-of-Truth Artifacts:** `GAME_BIBLE.md`, `DIALOGUE_SCRIPT.md`, `PLAYER_JOURNEY.md`, `case17_migration_6c9c9d20.sql`, `LOVABLE_BACKEND_HANDOFF_c63a76d5.md`

---

## Roadmap Overview & Phase Sequence

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│        PHASE 1          │     │        PHASE 2          │     │        PHASE 3          │
│ Audit & Master Bible    │ ──> │ Critical Bug & Leak     │ ──> │ Story & Progression     │
│ [STATUS: COMPLETED]     │     │ Fixes [READY TO EXECUTE]│     │ Approval [ORGANISER]    │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
                                                                             │
                                                                             ▼
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│        PHASE 6          │     │        PHASE 5          │     │        PHASE 4          │
│ Quality Assurance &     │ <── │ Visual & Media Asset    │ <── │ Supabase Backend        │
│ 11-Point Verification   │     │ Integration             │     │ Integration Contract    │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

---

## Phase 1 — Comprehensive Codebase Audit & Master Bible (COMPLETED)

### Objectives
Establish a pristine, unambiguous source of truth for the mystery, puzzle mechanics, character scripts, player experience, and technical debts without breaking existing functionality.

### Key Deliverables Produced
1. **`/docs/GAME_BIBLE.md`:** Authoritative canon establishing the fictional 1968 St. Jude's Academy mystery, Ellen Vale's disappearance, Director Arthur Pendelton's cover-up, 12-item evidence inventory, 7-stage puzzle mechanics, and the 10-bug forensic audit.
2. **`/docs/DIALOGUE_SCRIPT.md`:** 36-entry calendar dialogue database with triggers, primary lines, alternate lines, safeguarding adaptations, and the canonical Stage 4 audio monologue.
3. **`/docs/PLAYER_JOURNEY.md`:** Step-by-step 10-stage UX map detailing layout states, keyboard/touch inputs, validation cycles, error recovery, and youth safeguarding provisions.
4. **`/docs/MEDIA_ASSET_REGISTER.md`:** Comprehensive catalog of Web Audio procedural soundscapes, UI foley, cassette audio, video assets, document images, and sensory accessibility controls.
5. **`/docs/OPEN_QUESTIONS.md`:** Concise, executive decision document isolating the unresolved design choices requiring game organiser sign-off.

---

## Phase 2 — Critical Bug Fixes & Interface Hardening (PLANNED)

### 2.1 Bug 1 & 2: Eradicate Puzzle Hints and Answer Leaks in Modals
- **Issue:** `TeletypeTerminalModal.tsx` currently leaks solving instructions in its error prompt (*"Remember: Read the vertical margin boundaries sequentially"*). `AttachmentSheet.tsx` displays the entire Caesar alphabet mapping (`A=1 · B=2...`), making the puzzle trivial.
- **Remediation Plan:**
  - Replace hint text in `TeletypeTerminalModal` with cold, immersive forensic error messages: `"ERROR: HASH MISMATCH. INPUT DISAVOWED. VERIFY CIPHER SCRAP AND RETRY."`
  - Remove plaintext cipher translation legends from document sheets. Require students to deduct shift offsets organically using the clue in the radio broadcast log.

### 2.2 Bug 3 & 4: Evidence Routing & Document Association
- **Issue:** Several evidence cards in later stages link directly to `EV-0101` due to fallback defaults in `AttachmentSheet.tsx`. `EV-0103` is inconsistently titled "Cipher Scrap" and "Encrypted Fragment".
- **Remediation Plan:**
  - Standardize evidence ID handling across `mockData.ts` and `AttachmentSheet.tsx`. Ensure each ID (`EV-0101` through `EV-0701`) strictly renders its corresponding document component, metadata, and image.
  - Implement an authentic "404 FILE NOT FOUND / CLASSIFIED FILE EXPUNGED" state for unassigned IDs.

### 2.3 Bug 7: Mask Locked Stage Names
- **Issue:** Unlocked dashboard displays explicit future stage titles (e.g., *"Stage 4: The Archive Cassette"*, *"Stage 6: The Contradictory Archive"*), spoiling the mystery before students reach those stages.
- **Remediation Plan:**
  - Modify `src/lib/mockData.ts` and `src/App.tsx` stage list renderers.
  - When `stage.status === 'locked'`, replace `stage.title` and `stage.description` with:
    - Title: `"CLASSIFIED DOSSIER — STAGE 0" + stage.id`
    - Subtitle: `"[SEALED UNDER SCHOOL SECURITY PROTOCOL 17]"`
    - Action Label: `"ACCESS RESTRICTED"`

### 2.4 Bug 9: Restrict Organiser / Dev Test Toolbar
- **Issue:** `<DevTestToolbar>` is mounted unconditionally in `src/App.tsx`, providing buttons to instantly advance stages, wipe progress, and reveal answers. Additionally, the sidebar renders a public link to `/admin`.
- **Remediation Plan:**
  - Gate `<DevTestToolbar>` behind an environment variable (`VITE_ENABLE_ORGANIZER_DEV_TOOLS === 'true'`) or a secret URL query parameter (`?dev=case17admin`).
  - Restrict the `/admin` route in the sidebar to authenticated staff roles (`role === 'admin' | 'staff'`). For student accounts, the link is completely omitted from the DOM.

### 2.5 Bug 10: Enforce Genuine Completion Checks for Stages 6 & 7
- **Issue:** Stages 6 and 7 currently complete immediately upon clicking a "Review Video" or "Complete Final Debrief" button, with no puzzle validation or forensic deduction.
- **Remediation Plan:**
  - For Stage 6, require user confirmation of the timestamp discrepancy (`20:42` vs `21:10`) or keyword entry before triggering the system lockup sequence.
  - For Stage 7, require the player to synthesize the 6 prior stage tokens into the final canonical transmission phrase before granting the completion certificate.

---

## Phase 3 — Story Canon & Puzzle Progression Approval (ORGANISER REVIEW)

Before touching gameplay code, the game organisers must review `/docs/OPEN_QUESTIONS.md` and provide binding answers to:

1. **Stage 6 & Stage 7 Canonical Structure:**
   - *Option A (Original PDF):* Stage 6 = Ellen Vale Journal + VHS Video Reel (`FINAL_REVIEW.mp4`) + Screen Freeze. Stage 7 = Final Chronicle Article + Debrief Certificate.
   - *Option B (14-Day Dialogue Script):* Stage 6 = "The Contradictory Archive" (Timestamp cross-reference -> `ECHO`). Stage 7 = "The Last Signal" (Master token synthesis -> `"THE LAST SIGNAL CAME FROM INSIDE THE ARCHIVE"`).
   - *Recommended Hybrid:* Integrate both. Stage 6 requires analyzing the video timestamps to discover `ECHO`, which triggers the screen freeze. Stage 7 requires synthesizing all 6 tokens to unlock the final archive truth and debrief certificate.

2. **Stage 4 vs Stage 5 Audio Puzzle Placement:**
   - Determine whether the 47-second cassette tape operates in Stage 4 (yielding map coordinates to Presidio Heights) or Stage 5 (the "Missing 17 Seconds" Morse code challenge).

3. **Safeguarding Confirmation for Ages 11–18:**
   - Formal sign-off on replacing the threatening Morse code string `'You are next to die.'` with the school-safe alternative `'THE ARCHIVE IS NOT SAFE'` or `'THE SIGNAL CANNOT BE ERASED'`.

---

## Phase 4 — Supabase Backend Integration Contract

This phase defines the contract for transitioning from the prototype `localStorage` state in `src/lib/prototypeAuth.ts` to the production PostgreSQL backend specified in `case17_migration_6c9c9d20.sql`.

### 4.1 Architectural Boundary
```
┌────────────────────────────────────────────────────────┐
│             FRONTEND APPLICATION (REACT)               │
│ - UI State, Dossier Sheets, Visualizers, Audio Foley   │
│ - Communicates ONLY via Supabase Client (Anon Key)     │
│ - Stores zero secret hashes, answers, or master keys   │
└───────────────────────────┬────────────────────────────┘
                            │
               RPC Calls & JWT Auth Headers
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            SUPABASE POSTGRESQL DATABASE                │
│ - Authenticated User Profiles & RLS Policies           │
│ - Server-Side Challenge Answer Hashing & Scoring       │
│ - Stored Procedures (RPCs):                            │
│   • get_my_state()                                     │
│   • submit_challenge(p_stage_id, p_answer)             │
│   • choose_location(p_stage_id, p_lat, p_lng)          │
│   • get_my_messages()                                  │
└────────────────────────────────────────────────────────┘
```

### 4.2 Database Schema Alignment

| Table Name | Primary Purpose | Row-Level Security (RLS) Policy |
| :--- | :--- | :--- |
| `profiles` | Stores student username, display name, school grade/class, avatar, and total score. | Users can view all profiles for leaderboard; can only update their own display name. |
| `teams` | Optional student syndicate/group assignment. | Read-only for authenticated users. |
| `stages` | Master stage configuration, scheduled unlock dates (14-day calendar), and base point values. | Public read-only; answers and hashes are **NEVER** in this table (stored in private backend config). |
| `user_stage_progress` | Tracks student stage status (`locked`, `unlocked`, `completed`), attempts count, and timestamps. | Users can only select/update rows matching their own `auth.uid()`. |
| `user_submissions` | Audit log of all submitted guesses, submission time, and correctness. | Users can only view their own submission history. |
| `evidence` | Document metadata, classified asset tags, and unlock prerequisites. | Filtered by RLS: students only see evidence tied to stages they have unlocked. |
| `messages` | Scheduled broadcasts, incoming Director dispatches, and syndicate notices. | Students receive messages where `unlocked_at <= NOW()` and stage conditions are met. |

### 4.3 Stored Procedures (RPC) Specifications

#### 1. `get_my_state()`
- **Calling Signature:** `supabase.rpc('get_my_state')`
- **Output JSON Shape:**
  ```json
  {
    "user_id": "uuid",
    "username": "investigator_07",
    "display_name": "Ellen V.",
    "current_stage": 2,
    "completed_stages": [1],
    "total_score": 100,
    "current_streak": 2,
    "server_time_ist": "2026-10-28T18:00:00+05:30",
    "active_stage_unlock_time": "2026-10-28T09:00:00+05:30"
  }
  ```
- **Security Rule:** Calculates progress strictly on the server based on validated submissions.

#### 2. `submit_challenge(p_stage_id, p_answer)`
- **Calling Signature:** `supabase.rpc('submit_challenge', { p_stage_id: 1, p_answer: 'PENDELTON' })`
- **Input Parameters:**
  - `p_stage_id` (integer): Target stage (1 to 7).
  - `p_answer` (text): Normalized string submitted by student.
- **Server Execution:**
  - Trims and normalizes input (lowercasing, punctuation stripping).
  - Matches against salted SHA-256 hash stored in private server schema.
  - Decrements score penalty if attempt count exceeds threshold.
  - Updates `user_stage_progress` and unlocks next stage if correct.
- **Output JSON Shape:**
  ```json
  {
    "success": true,
    "message": "Identity verified. Classified file EV-0201 unlocked.",
    "unlocked_stage_id": 2,
    "score_awarded": 100,
    "penalty_applied": 0,
    "attempts_count": 1
  }
  ```

#### 3. `choose_location(p_stage_id, p_lat, p_lng)`
- **Calling Signature:** `supabase.rpc('choose_location', { p_stage_id: 4, p_lat: 37.78857, p_lng: -122.45605 })`
- **Server Execution:**
  - Computes Haversine distance from canonical transmission tower coordinates.
  - Tolerates a 150-meter radius around the target waypoint.
  - Returns proximity feedback (`"COLD"`, `"WARM"`, `"TARGET ACQUIRED"`).

#### 4. `get_my_messages()`
- **Calling Signature:** `supabase.rpc('get_my_messages')`
- **Server Execution:**
  - Returns chronological timeline of Director Arthur Pendelton's warnings, newspaper bulletins, and syndicate hints based on player's current stage and calendar day.

---

## Phase 5 — Visual Polish, Audio Mastering & Media Integration

### 5.1 Media Placement
1. **Audio Mastering:**
   - Record and master voice acting for `EV-0401` (47.0-second cassette) using vintage telephone bandpass filtering (300 Hz – 3.4 kHz).
   - Place mastered audio in `/public/assets/audio/ev-0401-cassette.mp3`.
   - Place ambient rain and wind loops in `/public/assets/audio/ambience/`.
2. **Surveillance Reel (`FINAL_REVIEW.mp4`):**
   - Produce 84-second vintage archival tape loop for Stage 6.
   - Encode with H.264 video at 1080p 24fps with authentic monochrome scanlines and timestamp overlay.
   - Place in `/public/assets/video/final-review.mp4`.
3. **High-Fidelity Document Assets:**
   - Generate graphic assets for missing evidence cards (`EV-0202` Library Ledger, `EV-0302` Hearing Transcript, `EV-0601` Diary Page, `EV-0701` Retrospective Article).
   - Ensure all typography matches 1968 St. Jude's era design guidelines.

---

## Phase 6 — Master Testing & Verification Checklist

The following 11-point testing matrix governs final release readiness. Every check must be evaluated and signed off before live school deployment.

| # | Test Verification Area | Test Description & Criteria | Verification Method | Current Status | Failure Mitigation Plan |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Code Compilation & Type Integrity** | Vite build completes without TypeScript or JSX compiler errors. Zero broken imports. | Automated (`npm run build` / `compile_applet`) | **PASSED** (0 errors) | Fix syntax or type inconsistencies immediately. |
| **2** | **Session & Auth Persistence** | Player identity, progress, and stage unlocks persist across page refresh and browser restart. | Manual Browser Storage Audit | **PASSED** (via prototype localStorage) | Fall back to local caching if network drops. |
| **3** | **7-Stage Progression Flow** | Completing Stage $N$ cleanly unlocks Stage $N+1$. Locked stages cannot be opened via URL modification. | End-to-end user walkthrough | **PARTIALLY IMPLEMENTED** (Stages 1-5 verified; 6-7 auto-complete) | Implement Phase 2 bug fixes to secure stage gates. |
| **4** | **Evidence Navigation & Routing** | Clicking any evidence card in Dossier opens the exact document ID. No hardcoded `EV-0101` fallbacks. | Click-through testing of all 12 evidence cards | **NEEDS FIX** (Bug 3 remediation in Phase 2) | Replace hardcoded modal handlers in `AttachmentSheet.tsx`. |
| **5** | **Puzzle Input & Answer Obfuscation** | Answers cannot be found in page source, JavaScript bundles, or error modal text. | Bundle inspection & dev tools audit | **NEEDS FIX** (Remove leaks in `TeletypeTerminalModal`) | Sanitize modal strings and move validation to Supabase RPC. |
| **6** | **Audio Autoplay & Sensory Safety** | No audio plays until user interacts. Volume controls work. Reduced sensory toggle suppresses intense glitch audio. | Headphone audio check + UI toggle test | **PASSED** (Default muted in `tacticalAudio.ts`) | Verify mute defaults remain intact. |
| **7** | **Video Scrubber & System Glitch** | Video timeline advances accurately. Glitch trigger transitions into freeze state without trapping the user. | VideoAttachmentViewer scrub test | **PASSED** (Simulated ticker & glitch verified) | Ensure bypass button is permanently accessible. |
| **8** | **Score Calculation & Penalty Logic** | Hints apply correct point deductions (-20 pts). Leaderboard sorts by score and completion timestamp. | Mathematical audit in `stageConfig.ts` | **PASSED** | Verify against database scoring trigger in Phase 4. |
| **9** | **Responsive Mobile Layout** | All evidence sheets, teletype keyboards, and maps render without overflow on 375px mobile screens. | Chrome DevTools device simulation (iOS/Android) | **PASSED** (Tailwind responsive flex/grid) | Adjust typography scaling on mobile portrait viewports. |
| **10** | **Organiser Toolbar Isolation** | `<DevTestToolbar>` and `/admin` links are invisible and inaccessible to standard student logins. | Non-admin user session inspection | **NEEDS FIX** (Bug 9 remediation in Phase 2) | Enforce environment variable / role gating. |
| **11** | **Youth Safeguarding Compliance** | No graphic violence, severe horror themes, or real-world distress triggers. Content suitable for age 11+. | Multi-educator review against safeguarding policy | **PENDING ORGANISER SIGN-OFF** (Question 3) | Adopt recommended safe phrasing in `DIALOGUE_SCRIPT.md`. |
