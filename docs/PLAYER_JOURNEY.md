# THE LAST SIGNAL — PLAYER JOURNEY & USER EXPERIENCE SPECIFICATION
**Document Type:** UX Flow, Interface States & Interaction Architecture  
**Target Audience:** School Student Investigators (Classes 6–12)  
**Aesthetic Core:** Dark Forensic Archive, tactile documents, historical teletype terminals  
**Last Updated:** October 2026  

---

## 1. Journey Principles for Young Investigators

1. **Clear Orientation at a Glance:** A younger student must never wonder *"What do I do now?"* The interface must always indicate:
   * Current active stage.
   * Cleared vs locked stages.
   * Immediate next action.
   * Direct button leading to the active puzzle.
2. **Atmospheric, Not Gamified:** Avoid arcade tropes (XP bars, generic leveling icons, spinning wheels). All interactions should feel like genuine forensic casework: case dockets, metric scales, teletype feeds, and microfiche sheets.
3. **Spoiler-Shielded Gating:** Locked stages and sealed evidence must never expose answers, ciphers, or even upcoming stage titles prematurely.
4. **Resilient Persistence:** Local browser refreshes must seamlessly restore progress, open sheets, and timer state without losing answers or corrupting the session.

---

## 2. Ten-Step Player Lifecycle

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      PLAYER LIFECYCLE STATE MACHINE                    │
 └────────────────────────────────────────────────────────────────────────┘
  Step 01: Landing & Registration (/register -> /login)
     │
     ▼
  Step 02: Investigation Command Hub (/dashboard)
     │
     ▼
  Step 03: Stage Status & Schedule Inspection (Roadmap & IST Clock)
     │
     ▼
  Step 04: Evidence Room Navigation (/evidence)
     │
     ▼
  Step 05: Document & Forensic Media Inspection (/evidence/:id)
     │
     ▼
  Step 06: Terminal Challenge Submission (Teletype / Map Gate / Suspect DB)
     │
     ▼
  Step 07: Cryptographic Validation & Feedback (Success Chime / Checksum Error)
     │
     ▼
  Step 08: Stage Clearance & Evidence Declassification (Unlocks next tier)
     │
     ▼
  Step 09: Priority Dispatch & Character Dialogue (/messages)
     │
     ▼
  Step 10: Climax, Controlled Freeze & Case Closure (/debrief)
```

---

### Step 1: Landing, Registration & Sign-In

* **Expected Screen:** Landing Page (`/`) $\rightarrow$ Registration Form (`/register`) $\rightarrow$ Login Form (`/login`).
* **Available Actions:**
  * Read case overview and fictional event classification banner.
  * Register new operative: Full Name, Class (6–12), School Admission Number, unique Call-Sign, Password.
  * Returning players: Authenticate using Call-Sign and Password.
* **Required Information:** Valid call-sign (3–24 alphanumeric chars), admission number, password.
* **Success Behaviour:**
  * Password and admission number hashed via Web Crypto SHA-256.
  * Masked admission number stored (`ADM-••••5678`).
  * Initial progress initialized with Stage 1 unlocked.
  * Immediate redirect to `/dashboard`.
* **Failure Behaviour:** Inline red error banner indicating taken call-sign, duplicate admission hash, or mismatched credentials.
* **Relevant Components:** `LandingView`, `RegisterView`, `LoginView` in `src/App.tsx`; `prototypeAuth.ts`.
* **Known Bugs & Security Gaps:**
  * Prototype uses browser `localStorage`. Not secure against technical students inspecting local storage keys.
  * In production, this must be transferred to Supabase Auth with Row-Level Security.

---

### Step 2: Investigation Command Hub (Dashboard)

* **Expected Screen:** Dashboard (`/dashboard`).
* **Available Actions:**
  * View active stage directive, objective narrative, and next available action.
  * Click prominent **"CONTINUE INVESTIGATION"** button to jump directly to the target docket or puzzle.
  * Review 7-stage roadmap and progress summary.
  * Access recently declassified evidence cards.
  * Open quick navigation to Evidence Room, Signal Map, Suspect Database, or Messages.
* **Required Information:** Current player `UserProgress` state.
* **Success Behaviour:** Displays tailored stage objective, time remaining in the 48-hour IST window, score tally, and recent dispatches without revealing future spoilers.
* **Failure Behaviour:** If unauthenticated, displays "Investigator Access Required" screen with redirect to `/login`.
* **Relevant Components:** `src/components/InvestigationDashboard.tsx`, `ISTClockWidget.tsx`.
* **Known Bugs & Fixes:**
  * *Previous Bug:* Old dashboard had static placeholder text and hardcoded links to `EV-0101`. Fixed by `InvestigationDashboard.tsx`.

---

### Step 3: Stage Schedule & Timetable Verification

* **Expected Screen:** Investigation Chronology (`/investigation` or `/progress`).
* **Available Actions:**
  * Review 14-day schedule divided into seven 48-hour stage windows.
  * Verify scoring deadlines in Indian Standard Time (IST).
  * Inspect cleared requirements and active directives.
* **Required Information:** Stage schedule configuration (`STAGE_SCHEDULE` in `stageConfig.ts`).
* **Success Behaviour:** Clear distinction between completed stages (emerald), active stage (crimson), and future stages (muted/sealed).
* **Failure Behaviour:** N/A (read-only view).
* **Relevant Components:** `InvestigationView`, `ProgressView` in `src/App.tsx`.
* **Known Bugs:**
  * *Confirmed Bug 7:* In `InvestigationView` and `ProgressView`, upcoming locked stages display their future titles (e.g., "The 47-Second Tape", "The Final Dispatch") before they are unlocked. Future stages should be titled *"Stage 0X: Sealed Docket"* until opened.

---

### Step 4: Evidence Room Navigation

* **Expected Screen:** Evidence Room (`/evidence`).
* **Available Actions:**
  * Filter catalogued records by category: Photograph, Physical, Document, Interview, Audio, Newspaper.
  * Search evidence by title, reference code, or description.
  * Click any declassified card to open `/evidence/:id`.
  * Click sealed cards (plays error feedback; does not expose contents).
* **Required Information:** Complete case catalog (`evidence` in `mockData.ts`) filtered by player clearance.
* **Success Behaviour:** Shows unlocked cards with full titles and summaries. Locked cards display a lock overlay (`LOCKED / STAGE 0X`) with redacted text.
* **Failure Behaviour:** Empty search displays *"No matching dockets recovered."*
* **Relevant Components:** `EvidenceRoomView` in `src/App.tsx`.
* **Known Bugs:**
  * *Addressed:* Previously, locked evidence cards exposed the full summary text. Hardened so locked cards display standardized sealed notices.

---

### Step 5: Document & Forensic Media Inspection

* **Expected Screen:** Evidence Inspector (`/evidence/:id`).
* **Available Actions:**
  * Page through multi-sheet document packages (Sheet 1, Sheet 2, etc.).
  * Zoom in/out ($60\%$ to $200\%$) and toggle Fullscreen (ESC to exit).
  * Inspect authentic paper textures, stamps, redactions, and chain-of-custody metadata.
  * Open stage-specific terminal gateways (e.g. Teletype Terminal on `EV-0103`, Coordinate Terminal on `EV-0201`).
  * Request Clue Docket hints (Tier 1 / Tier 2).
* **Required Information:** Valid, unlocked evidence ID.
* **Success Behaviour:** Renders dedicated document sheet (e.g. `SceneOverviewDoc`, `RadioReceiverDoc`, `CorrespondenceSheet`, `RecordsRoomNegativeDoc`, `WitnessTranscriptDoc`).
* **Failure Behaviour:**
  * *Unknown ID:* Renders authentic 404 **"Classified Record Not Found"** screen with reference code and return buttons.
  * *Locked ID:* Renders **"Classified Evidence Restricted"** screen showing required stage clearance without leaking sheets or photos.
* **Relevant Components:** `EvidenceViewerView`, `DocumentSystemSheets.tsx`.
* **Known Bugs:**
  * *Addressed:* Unknown IDs previously fell back to `EV-0101`, and locked IDs rendered all underlying document sheets. Both now properly gated.

---

### Step 6: Terminal Challenge Submission

* **Expected Screen:** Dedicated Terminal Modals:
  * Stage 1: Teletype Port 17-B Modal (`TeletypeTerminalModal`).
  * Stage 2: Camera Telemetry Coordinate Terminal (`CoordinateDeductionModal`).
  * Stage 3: Cartographic Map Security Gate (`MapSecurityGate`).
  * Stage 4: Single Target Selection on Cartographic Map (`/map`).
  * Stage 5: Suspect Database Security Gate (`SuspectDatabaseView`).
* **Available Actions:** Enter recovered call-signs, coordinates, passwords, or select map sites.
* **Required Information:** Player-deduced answers.
* **Success Behaviour:** Triggers mechanical verification sequence, plays `tacticalAudio.playSuccess()`, awards score points, and logs solve timestamp.
* **Failure Behaviour:** Plays subtle error click `tacticalAudio.playError()`, increments attempt counter, and shows failure response without exposing the plaintext key.
* **Relevant Components:** `CoordinateDeductionModal.tsx`, `MapSecurityGate.tsx`, `SuspectDatabaseView.tsx`, `SignalMapView`.

---

### Step 7: Cryptographic Validation & Feedback

* **System Logic:**
  * Inputs are normalized (lowercased, spaces/hyphens stripped).
  * Evaluated against accepted variations (e.g., `zkcase`, `zk`, `zcase`; `case17`, `17`).
  * Timing checks determine whether the solve qualifies for the competitive speed bonus (before 48-hour IST deadline).
* **Known Bugs:**
  * *Confirmed Bug 1:* Teletype Terminal previously printed the hint *"Remember: Read the vertical margin boundaries sequentially"* in its rejected error output.
  * *Confirmed Bug 8:* Developer toolbar exposed exact answers in plain view.

---

### Step 8: Stage Clearance & Evidence Declassification

* **System Logic:**
  * `stagesCompleted` increments.
  * `activeStage` advances.
  * Newly unlocked evidence IDs added to `unlockedEvidenceIds`.
  * Total score recalculated from base points + hourly speed bonus.
  * `status` updates from `'NOT STARTED'` to `'IN PROGRESS'` (or `'COMPLETED'`).
  * Next stage intermission story modal triggered (if configured in `seenIntermissions`).
* **Success Behaviour:** Player returns to dashboard to find new evidence available and updated tactical directive.

---

### Step 9: Investigation Communications & Dispatches

* **Expected Screen:** Messages & Frequency Monitor (`/messages`).
* **Available Actions:**
  * Review chronological log of incoming one-way transmissions from The Director, System Dispatch, and Unknown Signal.
  * Replay Director opening case briefing protocol.
* **Required Information:** Dispatches triggered by stage milestones or calendar days.
* **Current State & Limitations:**
  * Currently renders only 4 static messages.
  * The full 14-day script (`The_Last_Signal_14_Day_Dialogues.docx`) needs to be connected to stage milestones and player event triggers.

---

### Step 10: Climax, Controlled Freeze & Case Closure

* **Expected Screen:** Stage 6 Journal (`/evidence/EV-0601`) $\rightarrow$ Controlled System Freeze $\rightarrow$ Debrief Clearance (`/debrief`) $\rightarrow$ Certificate.
* **Interaction Sequence:**
  1. Player views Ellen Vale's Journal and initiates `FINAL_REVIEW.mp4`.
  2. Video reveals antagonist predicted player moves.
  3. Controlled glitch effect (`ControlledSystemGlitch.tsx`) triggers visual screen freeze and severance sound.
  4. Red lockdown banner appears across top navigation.
  5. Player enters Debrief Clearance to inspect final SF Chronicle edition (`EV-0701`).
  6. Player completes case review to view official Investigator Performance Standing, score breakdown, and print certificate.
* **Known Bugs:**
  * *Confirmed Bug 10:* Stage 6 and 7 currently have no challenge verification; they can be bypassed simply by clicking "Initiate Review" and "Confirm Article Read". Needs organiser decision on whether to implement proposed Puzzles 6 and 7.
