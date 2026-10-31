# THE LAST SIGNAL — Open Questions & Decision Sheet for Organisers

> **Document Type:** Executive Decision Sheet  
> **Target Audience:** Lead Game Organisers & School Leadership  
> **Status:** Pending Decisions Prior to Code Changes  
> **Instructions for Organisers:** Please review each item below and select or confirm your preferred option. Each choice directly guides game implementation and content safety.

---

### Question 1: Stage 6 & Stage 7 Narrative & Puzzle Allocation

* **The Conflict:**
  * **Source A (Organized PDF & Existing Code):** Stage 6 is "The Final Review" (`EV-0601` Diary Page + `FINAL_REVIEW.mp4` surveillance video -> triggers controlled system freeze). Stage 7 is "The Chronicle Article" (`EV-0701` + instant Debrief / Certificate generation). Neither stage currently requires an active puzzle input.
  * **Source B (14-Day Dialogue Script):** Stage 6 is "The Contradictory Archive" (investigators cross-examine timestamps 20:42 vs 21:10 vs 21:26 to submit token `ECHO`). Stage 7 is "The Last Signal" (investigators synthesize all 6 tokens: `ZK`, `3893`, `MAP`, `REVERSE`, `17`, `ECHO` to decipher the final phrase: `"THE LAST SIGNAL CAME FROM INSIDE THE ARCHIVE"`).
* **Options:**
  * **Option 1 (Recommended Hybrid):** Combine both sources into an immersive climax. Stage 6 features the video reel and diary, requiring investigators to notice the timestamp mismatch and input keyword `ECHO`, which triggers the dramatic system lockup. Stage 7 reboots the terminal and presents the master synthesis puzzle where students input `"THE LAST SIGNAL CAME FROM INSIDE THE ARCHIVE"` to officially solve the case and earn the final debrief certificate.
  * **Option 2 (Original PDF):** Retain Stage 6 as a pure narrative/video experience (no puzzle answer required) and Stage 7 as a reflective debrief reading.
  * **Option 3 (Dialogue Script):** Implement strict text/code puzzles for both stages as defined in the 14-day script, omitting the video playback scrubber.
* **Organiser Decision:** `[ PENDING ORGANISER INPUT ]`

---

### Question 2: Stage 4 vs Stage 5 Audio Puzzle Placement & Mechanics

* **The Conflict:**
  * **Source A (Organized PDF):** Stage 4 features the 47-second cassette tape (`EV-0401`). The first 30 seconds contain a spoken telephone message; the last 17 seconds contain reversed audio that, when reversed, speaks coordinates $37.78857^\circ\text{ N}, 122.45605^\circ\text{ W}$. Stage 5 is the Signal Tower triangulation map.
  * **Source B (14-Day Dialogue Script):** Stage 4 is titled "The Twenty-Four-Hour Map", while Stage 5 is "The Missing Seventeen Seconds", which frames the 17-second pulse as a Morse code cipher rather than reversed voice coordinates.
* **Options:**
  * **Option 1 (Recommended):** Keep the cassette tape in Stage 4 yielding coordinate audio (which directly unlocks the Stage 5 map investigation), and use the 17-second carrier frequency in Stage 5 for the Morse transmission.
  * **Option 2:** Swap the order to match the 14-day dialogue script naming convention (Map in Stage 4, Audio in Stage 5).
* **Organiser Decision:** `[ PENDING ORGANISER INPUT ]`

---

### Question 3: Youth Safeguarding & Content Safety (Classes 6–12)

* **The Issue:**
  * The 14-day dialogue script for Puzzle 5 ("The Missing Seventeen Seconds") specifies the Morse code translation as:  
    `"You are next to die."`
  * St. Jude's mystery is played by students in Classes 6–12 (ages 11–18). Direct personal death threats violate standard school safety policies and can trigger acute distress or complaints from parents and school administrators.
* **Options:**
  * **Option 1 (Recommended Safe Alternative):** Replace the phrase with a tense, atmospheric forensic warning that maintains the mystery without personal threats:  
    `"THE ARCHIVE IS NOT SAFE"` or `"THE SIGNAL CANNOT BE ERASED"` or `"SOMEONE IS LISTENING"`.
  * **Option 2:** Keep the original text as written in the draft script.
* **Organiser Decision:** `[ PENDING ORGANISER INPUT ]`

---

### Question 4: Fictional Premise vs Real-World Coordinates Disclaimer

* **The Issue:**
  * The coordinates in Stage 4 ($37.78857^\circ\text{ N}, 122.45605^\circ\text{ W}$) correspond to a real-world intersection in San Francisco (Presidio Heights / Washington & Cherry Street).
  * In a school game setting, students must not be encouraged to physically travel to unmonitored off-campus locations or confuse the fictional St. Jude's Academy with real private property.
* **Options:**
  * **Option 1 (Recommended):** Display a clear, atmospheric in-universe advisory banner on all map and coordinate interfaces:  
    `"NOTICE: St. Jude's Academy archives and transmission coordinates are simulated historical records. Field reconnaissance is conducted exclusively within this digital terminal. Do not attempt off-campus travel."`
  * **Option 2:** Retain coordinates with no advisory.
* **Organiser Decision:** `[ PENDING ORGANISER INPUT ]`

---

### Question 5: Masking Future Stage Titles & Descriptions in UI

* **The Issue:**
  * Currently, the dashboard lists the full titles of all 7 stages (e.g., *"Stage 4: The Archive Cassette"*, *"Stage 6: The Contradictory Archive"*), inadvertently spoiling key narrative surprises before students unlock them.
* **Options:**
  * **Option 1 (Recommended):** Mask all locked future stages with classified placeholders:  
    `"CLASSIFIED DOSSIER — STAGE 0[N]"` and `"[SEALED UNDER SCHOOL SECURITY PROTOCOL 17]"`. Unveiling the title only upon stage unlock.
  * **Option 2:** Keep all stage titles visible from Day 1 as an event schedule overview.
* **Organiser Decision:** `[ PENDING ORGANISER INPUT ]`

---

### Question 6: Developer & Organiser Toolbar Access Control

* **The Issue:**
  * `<DevTestToolbar>` is currently mounted globally across all pages, allowing anyone to bypass stages, reset progress, or reveal puzzle answers. Furthermore, the sidebar contains a direct navigation link to `/admin`.
* **Options:**
  * **Option 1 (Recommended):** Gate the `<DevTestToolbar>` behind a secret URL parameter (e.g., `?dev=case17admin`) or an environment variable (`VITE_ENABLE_ORGANIZER_DEV_TOOLS === 'true'`), and restrict the `/admin` navigation link strictly to users with verified staff/admin roles.
  * **Option 2:** Leave the toolbar enabled during the current staging/testing cycle.
* **Organiser Decision:** `[ PENDING ORGANISER INPUT ]`

---

### Question 7: Supabase Migration Schedule

* **The Issue:**
  * The current prototype uses `localStorage` (`prototypeAuth.ts` and `mockData.ts`) for stage state, answers, and scoring.
  * A full backend migration script (`case17_migration_6c9c9d20.sql`) and integration guide (`LOVABLE_BACKEND_HANDOFF_c63a76d5.md`) are prepared for Supabase PostgreSQL.
* **Options:**
  * **Option 1 (Recommended Two-Step):** Keep the frontend fully operational on the hardened prototype engine for immediate testing and UI validation, while preparing the Supabase client adapter in a feature branch ready to connect once backend credentials are provided.
  * **Option 2:** Connect directly to a live Supabase instance immediately (requires provisioning and testing live RLS policies and RPC functions).
* **Organiser Decision:** `[ PENDING ORGANISER INPUT ]`
