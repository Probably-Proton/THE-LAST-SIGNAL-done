# THE LAST SIGNAL — MASTER GAME BIBLE & CANONICAL AUDIT
**Case Reference:** TLS-0017  
**Document Status:** Master Working Specification (Audit & Canon Reconciliation)  
**Last Updated:** October 2026  
**Audience:** Game Organisers, Lead Designers, and Development Engineers  

---

## 1. Game Overview & Fictional Premise

### 1.1 Core Identity
* **Official Title:** THE LAST SIGNAL
* **Case Identity:** Case File TLS-0017
* **Format:** 14-Calendar-Day Mystery Chase / 7 Discrete 48-Hour Investigation Waves
* **Setting:** A fictionalized historical archive investigation spanning October 1974 records and October 2026 anomalous discoveries in the San Francisco Bay Area / Presidio Heights district.
* **Intended Audience:** Middle and high school students (Classes 6–12, ages 11–18).

### 1.2 Fictional Premise
In October 2026, 34-year-old municipal archivist Daniel Mercer discovered systematic anomalies in the historical Case 17 records archive: documents were not being destroyed, but their text was being subtly altered. Hours after logging his findings, Mercer was found dead in an annex near the Presidio. An anonymous transmission was received: *"You were looking at the wrong person,"* marked with a seven-dash cipher glyph. 

A temporary investigation portal is opened for school student investigators. Using historical teletype records, forensic crime scene negatives, witness transcripts, intercepted radio cassettes, and newspaper archives, players must decode the signals before the archive is permanently sealed.

### 1.3 Strict Safety & Content Boundaries (School Audience)
1. **Online-Only Guarantee:** All clues, coordinates, buildings, and transmissions exist solely within the digital browser interface. Physical exploration or travel to real-world locations is strictly prohibited.
2. **Age-Appropriate Psychological Tone:** Atmospheric mystery and forensic investigation without graphic violence, jump scares, gore, or flashing strobes.
3. **No Coercive Deception:** Controlled atmospheric glitches (such as the Stage 6 "system freeze") must remain obviously theatrical, non-destructive, and recoverable via page refresh or debrief clearance. No fake device compromise, simulated file deletion, or emergency alert tampering.
4. **Fictionalization of Historic Personae:** Real-world historical names and sensitive addresses must be clearly framed as historical case study context, with modern mystery elements kept completely fictional.

### 1.4 Primary Characters
* **The Director (Director of Police / Lead Investigator):** The institutional authority. Sends formal dispatches, instructions, and procedural warnings. Demands orderly note-taking and adherence to verified evidence.
* **The Antagonist / "The Zodiac" / Copycat Signal:** The elusive opponent transmitting through uncatalogued radio frequencies, reversed cassette pulses, and planted notes. Taunts investigators while testing whether they can discern authentic evidence from planted distractions.
* **Daniel Mercer (Archivist, 1992–2026):** Deceased archivist whose discovery of document alterations initiates the 2026 crisis.
* **Ellen Vale (Archival Researcher, fl. 1971):** Author of the handwritten research journal `EV-0601`. Studied historical ciphers and anticipated future investigator misinterpretations.
* **The Presidio Heights Witness (House 3893 Resident):** Subject of interview transcript `CAS-017`. Recalls late-night sounds, an idling car, and a window light going out.
* **The Student Investigator (Player / Team):** Registered operative identified by call-sign (handle) and masked school admission number.

---

## 2. Seven-Stage Outline: Current Implementation vs. Proposed Script

There is an active divergence between the **Original Game Design Document (`The_Last_Signal_Organized.pdf` / current codebase)** and the **Proposed 14-Day Dialogue Script (`The_Last_Signal_14_Day_Dialogues.docx`)**. Both are catalogued below with their differences clearly identified.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CANONICAL PROGRESSION ROADMAP                             │
└────────────────────────────────────────────────────────────────────────────────────────┘

  STAGE 01: THE ARCHIVE & EXORCIST LETTER
  ├─ Evidence: EV-0101 (Scene), EV-0102 (Radio), EV-0103 (Letter & Memo), ARC-002 (Worksheet)
  ├─ Puzzle: Acrostic & Telestich on affixed note margins -> Username: zkcase / Key: case17
  └─ Gate: Teletype Terminal (/dev/tty01-archive-vault-b)

  STAGE 02: THE LOWER VAULT & COORDINATE CIPHER
  ├─ Evidence: EV-0201 (Records Room Negative)
  ├─ Puzzle: Alphabet-to-number substitution (CG.GHHGD, -LB.DEG I) -> (37.78874, -122.45709)
  └─ Deduction: Coordinate maps to House 3893 (Presidio Heights)

  STAGE 03: THE PRESIDIO WITNESS & SIGNAL MAP
  ├─ Evidence: CAS-017 (Witness Transcript), EV-0301 (Transmission Mast)
  ├─ Puzzle: House number security gate on Cartographic Signal Map
  └─ Gate: Enter "3893" -> Unlocks 4 regional telemetry locations

  STAGE 04: THE REVERSED AUDIO & 24-HOUR CHALLENGE
  ├─ Evidence: EV-0401 (47-Second Audio Cassette)
  ├─ Puzzle: Reverse final 17 seconds -> Spoken coordinates (37.78857° N, 122.45605° W)
  └─ Action: Submit irreversible candidate: Site 04 (Presidio Heights / Washington & Cherry)

  STAGE 05: THE MERCER INQUEST & SUSPECT DATABASE
  ├─ Evidence: EV-0501 (SF Chronicle Dispatch), EV-0502 (Allen), EV-0503 (Gaikowski)
  ├─ Puzzle: Synthesize Mercer report + 7 marks + reopened cipher -> "Z408_REOPENED"
  └─ Gate: Enter "Z408_REOPENED" -> Unlocks Suspect Database

  [CRITICAL DIVERGENCE ZONE: STAGES 6 & 7]
  Current Implementation (Original PDF):
    STAGE 06: Ellen Vale's Journal (EV-0601) + FINAL_REVIEW.mp4 -> Auto-Glitch / System Freeze
    STAGE 07: Chronicle Final Edition (EV-0701) -> End video -> Debrief Certificate
  Proposed Script (14-Day Dialogue):
    STAGE 06: The Contradictory Archive (Dispatch timestamp contradiction -> Token: ECHO)
    STAGE 07: The Last Signal (Synthesis of all 6 tokens: ZK + 3893 + MAP + REVERSE + 17 + ECHO
              -> Sentence: "THE LAST SIGNAL CAME FROM INSIDE THE ARCHIVE")
```

---

### Detailed Stage Breakdown

#### STAGE 1: The Archive
* **Current Title:** The Archive (The Archivist's Letter & Docket Registry)
* **Story Purpose:** Introduce the historical 1974 archive and establish the presence of planted margin notes.
* **Player-Facing Introduction:** "Your dossier has been initialized. All seven stages begin in sequence starting with the Archivist's Letter and damaged credential worksheet."
* **Evidence Unlocked:** `EV-0101`, `EV-0102`, `EV-0103`, `ARC-002`.
* **Puzzle Mechanics:** Six-line memorandum affixed to `EV-0103`. Left margin (acrostic) spells directory `zkcase` (`Z-K case`); right margin (telestich) spells password `case17` (`case-17`).
* **Required Prior Clues:** None (initial stage).
* **Organiser Solution Key:** Directory: `zkcase` (or `zk`, `zcase`) / Passphrase: `case17` (or `17`).
* **Validation:** Validated via the Teletype Terminal modal (`/dev/tty01-archive-vault-b`).
* **Post-Solve Outcome:** Awards 100 base points (+ speed bonus); unlocks `EV-0201` and opens Stage 2.
* **Implementation Status:** Fully implemented and verified.
* **Contradictions / Notes:** In `The_Last_Signal_Organized.pdf`, the memo is 6 lines of pseudo-gibberish (`Zyper t1ue...`). In the React codebase (`src/App.tsx`), it was rewritten into readable English sentences (`Zodiac correspondence...`). Both preserve the identical `zkcase` / `case17` solution.

#### STAGE 2: The Lower Vault
* **Current Title:** The Lower Vault (County records bay & negative telemetry)
* **Story Purpose:** Discover filing bay negatives containing encrypted forensic camera metadata.
* **Player-Facing Introduction:** "Sector 01 cleared. Access filing bay 17 to examine recovered negative telemetry and camera EXIF metadata."
* **Evidence Unlocked:** `EV-0201` (Records Room — Lower Level).
* **Puzzle Mechanics:** Alphabet-to-number coordinate cipher stamped on negative margin: `(CG.GHHGD, -LB.DEG I)`. $A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9, L=12$. Resolves to $37.78874^\circ\text{ N}, -122.45709^\circ\text{ W}$.
* **Inferred Information:** Plotting coordinates identifies residential parcel **House 3893** in Presidio Heights.
* **Organiser Solution Key:** `3893` or `House 3893` or `37.78874, -122.45709`.
* **Validation:** Validated via Coordinate Deduction Terminal (`CoordinateDeductionModal.tsx`).
* **Post-Solve Outcome:** Awards 100 points; unlocks `CAS-017` and `EV-0301`; enables Map Gate.
* **Implementation Status:** Fully implemented and verified.
* **Contradictions / Notes:** The negative attachment sheet previously leaked the entire substitution cipher in an analyst note (`A=1 · B=2...`).

#### STAGE 3: The Presidio Witness
* **Current Title:** The Presidio Witness (Case testimony & regional survey)
* **Story Purpose:** Connect the decoded house address to witness testimony and unlock the cartographic map.
* **Player-Facing Introduction:** "Cross-reference witness transcript CAS-017 and authenticate the Signal Map security gate."
* **Evidence Unlocked:** `CAS-017` (Witness Transcript), `EV-0301` (Coastal Transmission Mast).
* **Puzzle Mechanics:** Enter the house number from Stage 2 (`3893`) into the Map Security Gate (`MapSecurityGate.tsx`).
* **Inferred Information:** The witness resides at House 3893, directly across from the intersection of Washington and Cherry.
* **Organiser Solution Key:** `3893`.
* **Validation:** Validated on `/map` route via `MapSecurityGate`.
* **Post-Solve Outcome:** Unlocks interactive NorCal SVG map showing 4 candidate sites; triggers antagonist's 24-hour challenge.
* **Implementation Status:** Fully implemented and verified.

#### STAGE 4: The 47-Second Tape
* **Current Title:** The 47-Second Tape (Dispatch recording & signal candidate)
* **Story Purpose:** Force the player to make a single irreversible location choice among 4 regional sites based on audio telemetry.
* **Player-Facing Introduction:** "Analyze recovered cassette EV-0401 and lock in your permanent target location submission on the Signal Map."
* **Evidence Unlocked:** `EV-0401` (Recovered Audio Cassette).
* **Puzzle Mechanics:** 47-second recording has speech for 30 seconds; remaining 17 seconds contain reversed voice/spectrogram transmitting $37.78857^\circ\text{ N}, 122.45605^\circ\text{ W}$.
* **Inferred Information:** Coordinates match Site 04 (Presidio Heights: Washington & Cherry Streets).
* **Organiser Solution Key:** **Site 04**.
* **Validation:** Single-submission selection on `/map`. Exactly one correction permitted before deadline.
* **Post-Solve Outcome:** Evaluated at stage deadline. Correct choice awards +100 base + 20 target bonus points; unlocks `EV-0501`.
* **Implementation Status:** Implemented and verified in prototype state.
* **Contradictions / Notes:** The new dialogue script reallocates the 17-second gap to Morse code in Puzzle 5 rather than reversed audio in Puzzle 4 (see Section 6).

#### STAGE 5: The Mercer Inquest
* **Current Title:** The Mercer Inquest (Chronicle report & confidential dossiers)
* **Story Purpose:** Reveal the murder of archivist Daniel Mercer and unlock the suspect repository.
* **Player-Facing Introduction:** "Inspect Chronicle dispatch EV-0501 and authenticate access to restricted suspect dossiers."
* **Evidence Unlocked:** `EV-0501` (Chronicle Special Dispatch), `EV-0502` (Arthur Leigh Allen), `EV-0503` (Richard Gaikowski).
* **Puzzle Mechanics:** Synthesize Chronicle report mentioning reopened historical cipher and anonymous note: `Z408` + `REOPENED`.
* **Organiser Solution Key:** `Z408_REOPENED`.
* **Validation:** Validated via Suspect Database Security Gate (`SuspectDatabaseView.tsx`).
* **Post-Solve Outcome:** Unlocks dossiers S-01 (Ellen Vale), S-02 (Arthur Leigh Allen), S-03 (Richard Gaikowski).
* **Implementation Status:** Fully implemented and verified.

#### STAGE 6: The Vale Notebook (Current) vs. The Contradictory Archive (Proposed)
* **Current Title:** The Vale Notebook (Research journal & 16mm reel)
* **Current Implementation:** Player views journal `EV-0601` and clicks attachment `FINAL_REVIEW.mp4`. A simulated video ticker plays, revealing the antagonist anticipated all player responses. Clicking "Initiate Review" triggers a screen glitch effect (`ControlledSystemGlitch.tsx`), locks down navigation, and sets `systemFreezeTriggered = true`.
* **Proposed Dialogue Script Version:** Titled "The Contradictory Archive". Players analyze conflicting timestamps across three archive records: dispatch log archived 21:10; metadata created 20:42; access record edited 21:26. Decoding the edit trail reveals the keyword token **`ECHO`**.
* **Organiser Solution Key:** Current: No text input (click trigger). Proposed: `ECHO`.
* **Status:** [CONTRADICTION / UNRESOLVED]. Needs organiser sign-off on whether to add the timestamp contradiction puzzle or keep the video glitch trigger.

#### STAGE 7: The Final Dispatch (Current) vs. The Last Signal Synthesis (Proposed)
* **Current Title:** The Final Dispatch (Station incident & case closure)
* **Current Implementation:** Emergency debrief clearance opens `EV-0701` (SF Chronicle Late Edition: "POLICE RECRUIT FOUND DEAD INSIDE STATION"). Player confirms article read, views ending video, and finalizes case to receive completion certificate.
* **Proposed Dialogue Script Version:** Titled "The Last Signal". Players combine all tokens gathered across the 14 days: `ZK`, `3893`, `MAP`, `REVERSE`, `17`, `ECHO`. The player submits the final deduction: **`THE LAST SIGNAL CAME FROM INSIDE THE ARCHIVE`**.
* **Organiser Solution Key:** Current: Reading confirmation click. Proposed: Sentence `THE LAST SIGNAL CAME FROM INSIDE THE ARCHIVE`.
* **Status:** [CONTRADICTION / UNRESOLVED]. Needs organiser sign-off.

---

## 3. Evidence Inventory

| Evidence ID | Current Title | Stage | Type | Unlock Condition | Intended Purpose | Dependencies | Status | Issues & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `EV-0101` | Scene Overview — Rear Alley | 1 | Photo | Initial (default) | Establish crime scene at night with radio dropped | None | Verified | Hardcoded button target in earlier versions |
| `EV-0102` | Portable Radio Receiver | 1 | Physical | Initial (default) | Physical radio recovered from cobblestones | None | Verified | Radio model and frequency clues |
| `EV-0103` | The Exorcist's Letter & Affixed Note | 1 | Document | Initial (default) | Contains 6-line memo with acrostic/telestich | None | Verified | Appears under slightly different titles in UI ("Exorcist Letter & Memo") |
| `ARC-002` | Partial Credential Worksheet | 1 | Document | Initial (default) | Reference sheet with ink-masked passwords | None | Verified | Had field note pointing directly to EV-0103 |
| `EV-0201` | Records Room — Lower Level | 2 | Location | Solve Stage 1 terminal | Photographic negative with encoded EXIF coordinates | Stage 1 cleared | Verified | Analyst note previously leaked substitution cipher |
| `CAS-017` | Witness Testimony — Case File 017 | 3 | Interview | Solve Stage 2 coordinates | Resident recollection correlating to House 3893 | Stage 2 solved | Verified | Connects coordinate deduction to Presidio Heights |
| `EV-0301` | Coastal Transmission Mast | 3 | Location | Solve Stage 2 coordinates | Triangulation microwave mast in Presidio | Stage 2 solved | Verified | Referenced in cartographic survey |
| `EV-0401` | Recovered Audio Cassette | 4 | Audio | Unlock Stage 3 map gate | 47s dispatch tape with 17s pulse anomaly | Stage 3 map gate | Verified | 47s vs 30s vs 17s vs 7s discrepancy in draft |
| `EV-0501` | SF Chronicle — Special Dispatch | 5 | Newspaper | Stage 4 deadline / solve | Reports murder of archivist Daniel Mercer | Stage 4 cleared | Verified | Contains Z408 reopen lead and 7-mark glyph |
| `EV-0502` | Suspect Dossier S-02: Arthur Leigh Allen | 5 | Interview | Unlock Suspect DB (`Z408_REOPENED`) | Department dossier on Person of Interest S-02 | Gate 5 unlocked | Verified | Real historical name; must stay framed as historical file |
| `EV-0503` | Suspect Dossier S-03: Richard Gaikowski | 5 | Interview | Unlock Suspect DB (`Z408_REOPENED`) | Department dossier on Person of Interest S-03 | Gate 5 unlocked | Verified | Real historical name; must stay framed as historical file |
| `EV-0601` | Research Journal of Ellen Vale | 6 | Document | Stage 5 cleared | Journal notebook + `FINAL_REVIEW.mp4` | Stage 5 cleared | Verified | Triggers Controlled System Glitch |
| `EV-0701` | Chronicle Final Edition — Station Incident | 7 | Newspaper | Stage 6 freeze / debrief | Final reporting on recruit found inside station | Stage 6 cleared | Verified | End of game narrative climax |

---

## 4. Puzzle Inventory & Cryptographic Mechanics

### Puzzle 1: The Affixed Exorcist Memorandum
* **Player View:** Attached yellow sticky note on `EV-0103`.
* **Intended Reasoning:** Read initial character and final character of each line vertically (Acrostic & Telestich).
* **Organiser Answer:** Username: `zkcase` (or `Z-K case`) / Password: `case17` (or `17`).
* **Plausible Wrong Interpretations:** Trying Caesar shifts on the interior text; anagramming individual lines.
* **Validation:** Verified via Teletype Terminal with normalized string comparison (`.toLowerCase().replace(/[\s_-]+/g, '')`).
* **Existing Hint Assessment:** Hint Tier 2 previously gave away the exact reading method. Needs adjustment to preserve challenge.

### Puzzle 2: Camera Telemetry Coordinate Substitution
* **Player View:** Forensic metadata string: `(CG.GHHGD, -LB.DEG I)`.
* **Intended Reasoning:** $1:1$ numerical substitution ($A=1, B=2, \dots, I=9, L=12$). Decodes to $37.78874^\circ, -122.45709^\circ$. Cross-referencing points to House 3893.
* **Organiser Answer:** `3893` or `37.78874, -122.45709`.
* **Validation:** Verified in `CoordinateDeductionModal.tsx`.
* **Existing Hint Assessment:** `AttachmentSheet` previously included a printed conversion table (`A=1 · B=2...`) right under the photo. This should be removed from player view.

### Puzzle 3: Map Security Gate
* **Player View:** Password prompt on `/map` referencing: "The password is a house number."
* **Intended Reasoning:** Apply the deduced house address from Stage 2 (`3893`).
* **Organiser Answer:** `3893`.
* **Validation:** Verified in `MapSecurityGate.tsx`.

### Puzzle 4: The 47-Second Audio Cassette
* **Player View:** Audio player with 47-second waveform. Speech terminates at 00:30; remaining 17 seconds contain high-frequency rhythmic pulses.
* **Intended Reasoning:** Reverse playback reveals whispered coordinates: $37.78857^\circ\text{ N}, 122.45605^\circ\text{ W}$, aligning with Site 04 (Presidio Heights).
* **Organiser Answer:** **Site 04 (Presidio Heights / Washington & Cherry)**.
* **Validation:** Irreversible choice recorded in `targetLocationChoice`. Evaluated when stage deadline passes.

### Puzzle 5: Suspect Database Master Access
* **Player View:** Chronicle report `EV-0501` citing Mercer's notes on Z408 cipher and "REOPENED" case status.
* **Intended Reasoning:** Combine cipher code with case status: `Z408_REOPENED`.
* **Organiser Answer:** `Z408_REOPENED`.
* **Validation:** Verified in `SuspectDatabaseView.tsx`.

### Proposed Puzzle 6: The Contradictory Archive
* **Status:** Proposed in `The_Last_Signal_14_Day_Dialogues.docx` (not yet in code).
* **Player View:** Three archive records with conflicting timestamps (Created: 20:42, Archived: 21:10, Edited: 21:26).
* **Intended Reasoning:** Trace the modification trail to locate an inserted keyword token.
* **Organiser Answer:** `ECHO`.

### Proposed Puzzle 7: Final Token Synthesis
* **Status:** Proposed in `The_Last_Signal_14_Day_Dialogues.docx` (not yet in code).
* **Player View:** Final deduction terminal asking for the case synthesis sentence.
* **Intended Reasoning:** Combine tokens: `ZK` + `3893` + `MAP` + `REVERSE` + `17` + `ECHO`.
* **Organiser Answer:** `THE LAST SIGNAL CAME FROM INSIDE THE ARCHIVE`.

---

## 5. Investigation of Existing Bug Reports (Trace & Root Cause)

| Bug ID | Report Description | Audit Status | Root Cause & File Location |
| :--- | :--- | :--- | :--- |
| **Bug 1** | Login username/password messages expose puzzle hints or answers | **Confirmed** | In `TeletypeTerminalModal.tsx` (`src/App.tsx` line 2613), the rejected error output explicitly states: *"Remember: Read the vertical margin boundaries sequentially."* |
| **Bug 2** | Stage 1 contains overly explicit field notes (Caesar and vertical text) | **Confirmed** | In `src/App.tsx` line 2256, field notes state: *"Notice the unusual alignment of line starts and ends... Look for vertical patterns rather than traditional horizontal shifts."* Hint Modal Tier 2 also explains the exact acrostic/telestich method. |
| **Bug 3** | Evidence buttons in multiple stages open `EV-0101` regardless of file | **Confirmed & Mitigated** | Multiple buttons in `LandingView` and `DashboardView` had hardcoded `navigate('/evidence/EV-0101')`. `EvidenceViewerView` also fell back to `evidence[0]` (`EV-0101`) whenever an unknown ID was passed. Fixed in dashboard/viewer refactor; other views need audit. |
| **Bug 4** | `EV-0103` appears under two different document names | **Confirmed** | In `mockData.ts` it is titled *"The Exorcist's Letter & Affixed Note"*; in `pageTitles` it is titled *"Exorcist Letter & Memo"*; in `CorrespondenceSheet` it is titled *"The Exorcist's Letter"*. Needs unification. |
| **Bug 5** | "Begin Investigation" and references to Case File 0101 unnecessarily repeated | **Confirmed** | In `LandingView` and old `DashboardView`, multiple redundant CTAs directed users to start with `EV-0101`. |
| **Bug 6** | Investigation messaging may not function correctly | **Confirmed** | `messages` in `mockData.ts` is a static 4-item array. The dynamic 14-day character dialogue, stuck dialogue, and post-solve dispatches from `The_Last_Signal_14_Day_Dialogues.docx` are completely unhooked from user progress. |
| **Bug 7** | Upcoming stages reveal their names before they are available | **Confirmed** | In `mockData.ts`, all 7 stages have static titles and subtitles. `LandingView`, `InvestigationView`, and `ProgressView` render all titles (e.g. "The 47-Second Tape", "The Final Dispatch") even when locked. |
| **Bug 8** | Documents explain puzzle-solving methods or disclose answers too directly | **Confirmed** | `AttachmentSheet` (`EV-0201`) prints the full alphabet substitution matrix ($A=1, B=2\dots$). `DevTestToolbar` displays the complete acrostic/telestich solution (`zkcase` / `case17`). |
| **Bug 9** | Player-facing interfaces expose organiser/test controls | **Confirmed** | `<DevTestToolbar>` is rendered in `src/App.tsx` on every authenticated page. The sidebar also displays a visible "Staff Console" (`/admin`) navigation link to all players. |
| **Bug 10** | Stage 6 & 7 completion conditions bypassable or inconsistent | **Confirmed** | In `VideoAttachmentViewer.tsx`, clicking "Initiate Review" triggers a glitch and auto-clears Stage 6 without checking any puzzle input. In `DebriefView.tsx`, clicking through the tabs auto-completes Stage 7 without any token verification. |

---

## 6. Critical Content Safety & Continuity Flag

### A. Real-World Coordinates in Game Dialogue & Audio
* **Issue:** The supplied dialogue script references real-world coordinates and street corners (e.g. Washington & Cherry, Presidio Heights).
* **Safety Mandate:** Because the game is played by school students, all in-game clues must explicitly state that coordinates refer to a **fictional game simulation**. In production, real GPS coordinates should be replaced with in-universe grid coordinates or accompanied by a persistent warning: *"Simulation Only — Never visit physical locations."*

### B. Threatening Audio Phrase in Proposed Dialogue Script
* **Issue:** The organiser notes in `The_Last_Signal_14_Day_Dialogues.docx` propose a Morse code phrase in Puzzle 5: `'You are next to die.'`
* **Safety Mandate:** For a school audience (Classes 6–12), direct personal threats can cause distress or violate school safeguarding policies.
* **Proposed Alternative for Organiser Approval:** Change the intercepted Morse phrase to an in-universe narrative phrase such as:
  * Option 1: `'THE ARCHIVE IS NOT SAFE'`
  * Option 2: `'YOU ARE LOOKING AT THE WRONG REEL'`
  * Option 3: `'THE SIGNAL CANNOT BE ERASED'`
