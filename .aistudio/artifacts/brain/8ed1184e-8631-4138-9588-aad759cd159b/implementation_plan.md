# Comprehensive Solution Walkthrough & Progression Guide: THE LAST SIGNAL

A complete, stage-by-stage master walkthrough of all seven stages for **THE LAST SIGNAL** (Case TLS-0017). This document details every puzzle, clue relationship, cryptographic technique, exact solution key, and the narrative progression that moves players from Stage 1 to the final climax.

***

## User Review & Confirmed Scope

> [!IMPORTANT]
> **Delivery Mode:** Full written walkthrough detailing the exact answers, evidence deductions, and narrative progression mechanics for testing and operational verification.
> **Preservation Rule:** Existing frontend styling, atmospheric sound design, tactical UI, and local prototype state remain unchanged during this planning phase.

***

## 1. Overview & Core Investigation Concept

* **Case Identity:** Case File TLS-0017 — A 14-day, 7-stage chronological investigation combining historic Zodiac case archives with a modern copycat threat.
* **Participant Experience:** Investigators inspect archival evidence, decode ciphers, cross-reference coordinates, submit gate passphrases, and select target locations under strict countdown windows.
* **Authoritative Progression:** Each stage requires specific prerequisites (solving a cipher, unlocking a password gate, or submitting a map location) before unlocking subsequent evidence files and dispatch logs.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               SEVEN-STAGE PROGRESSION FLOW                             │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [Stage 1: The Archive]
   │ Clue: Exorcist Letter Sticky Note (Acrostic / Telestich)
   ▼ Submit: "Z-K case" & "case-17"
 [Stage 2: The Locked Files]
   │ Clue: Letter Substitution in Photo Metadata (CG.GHHGD, -LB.DEG I)
   ▼ Decodes to: (37.78874, -122.45709) -> House 3893
 [Stage 3: Witness Testimony & Map]
   │ Password Gate: Enter "3893" to unlock Map
   ▼ Trigger: Killer's 24h Audio Transmission Challenge
 [Stage 4: Reversed Audio & Call]
   │ Clue: Reverse 17s audio tape pulse -> 37.78857° N, 122.45605° W
   ▼ Target Selection: Location 04 (Presidio Heights / Washington & Cherry)
 [Stage 5: Newspaper & Suspect DB]
   │ Clue: Mercer Murder, Seven Marks & Z408 Reopened Notice
   ▼ Password Gate: Enter "Z408_REOPENED"
 [Stage 6: Ellen Vale's Journal]
   │ Clue: FINAL_REVIEW.mp4 & "Expected Investigator Responses"
   ▼ Twist: Antagonist anticipated every move; website freeze triggered
 [Stage 7: The Final Article]
   │ Climax: SF Chronicle Recruit Death Report & Distorted Intercept Video
   ▼ Epilogue / Case Closure
```

***

## 2. Stage-by-Stage Master Walkthrough & Solution Keys

---

### STAGE 1: The Archive Files & The Exorcist's Letter
* **Story Setup:** Investigators enter the archive repository and discover initial evidence regarding historical cases, alongside a damaged credential reference sheet (`ARC-002`) where multiple passwords have been occluded with heavy dark ink.
* **Evidence Items:**
  * `EV-0101`: Rear Alley Crime Scene Overview.
  * `EV-0102`: Dropped Portable Radio Receiver.
  * `EV-0103`: The Exorcist's Letter with an affixed 6-line handwritten memorandum.
  * `ARC-002`: Partial Credential Worksheet with ink smudges.
* **The Puzzle (Exorcist Note Telestich):**
  The attached note displays 6 irregular lines:
  ```text
  Zyper t1ue nbshg oi5rsussc
  -kythe uwlwlhfa tryera
  cojowhfogh pfjpwj ;gjgs
  apfjwpjw glegl giwigppe
  sjojgooheig 34hohg-1
  ejgpgp jgkakhgle johfa7
  ```
* **Step-by-Step Deduction:**
  1. Inspect the vertical left margins (Acrostic): `Z`, `-k`, `c`, `a`, `s`, `e` $\rightarrow$ **`Z-K case`**.
  2. Inspect the vertical right margins (Telestich): `c`, `a`, `s`, `e`, `-1`, `7` $\rightarrow$ **`case-17`**.
  3. The interior ciphertext is an intentional cryptographic distraction (verified non-Caesar); only the perimeter bounds hold the clearance code.
* **Solution Keys:**
  * **Archive Directory / Username:** `Z-K case` (or `zkcase`, `zk`)
  * **Passphrase / Access Key:** `case-17` (or `17`)
* **Advancement Outcome:**
  * Solved via the Teletype Terminal modal (`/dev/tty01-archive-vault-b`).
  * Awards **+100 merit points**.
  * Unlocks `EV-0201` (Records Room — Lower Level) and opens Stage 2.

---

### STAGE 2: The Locked Files & The Coordinate Cipher
* **Story Setup:** Clearance unlocks four restricted documents and crime scene photographs. One historical photograph includes anomalous coordinates where numbers have been substituted with alphabetical characters.
* **Evidence Items:**
  * `EV-0201`: County Archives Sub-Basement (Filing Bay 17).
  * Historical victim photos with metadata stamps (Date, Time, Location).
* **The Puzzle (Alphabetical Coordinate Substitution):**
  * Encoded Coordinate string: `(CG.GHHGD, -LB.DEG I)`
  * Substitution scheme ($A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9, L=12$):
    * `C` $\rightarrow$ 3
    * `G` $\rightarrow$ 7
    * `.` $\rightarrow$ .
    * `G` $\rightarrow$ 7
    * `H` $\rightarrow$ 8
    * `H` $\rightarrow$ 8
    * `G` $\rightarrow$ 7
    * `D` $\rightarrow$ 4
    * `-LB` $\rightarrow$ -122
    * `.` $\rightarrow$ .
    * `D` $\rightarrow$ 4
    * `E` $\rightarrow$ 5
    * `G` $\rightarrow$ 7
    * ` ` $\rightarrow$ 0
    * `I` $\rightarrow$ 9
* **Step-by-Step Deduction:**
  1. Resolve decoded geographical coordinates: `37.78874, -122.45709`.
  2. Plotting these coordinates in the cartographic database identifies an exact urban parcel in Presidio Heights: **House Number 3893**.
* **Solution Key:**
  * **Decoded Landmark / Address:** `House 3893` (Numeric key: **`3893`**).
* **Advancement Outcome:**
  * The number `3893` fulfills the hint on `ARC-002` ("The password is a house number").
  * Unlocks witness testimony `CAS-017` and prepares clearance for the cartographic map.

---

### STAGE 3: The Witness Testimony & The Map
* **Story Setup:** Investigators inspect `CAS-017`, a confidential interview transcript of an unidentified resident at House 3893 regarding the night Paul Stine was attacked.
* **Evidence Items:**
  * `CAS-017`: Police Interview Transcript (Subject recounts late evening sounds, an idling car, and a light in a window across the street before the street went silent).
  * `EV-0301`: Coastal Transmission Mast (Presidio Ridge).
* **The Puzzle (Unlocking the Signal Map):**
  * Accessing `/map` prompts for the regional survey gate password.
  * Credential reminder from Stage 1: "Map: The password is a house number."
* **Step-by-Step Deduction:**
  1. Retrieve the house address identified in Stage 2 witness testimony (`House 3893`).
  2. Enter **`3893`** into the Map Security Gate (`gate_map`).
* **Solution Key:**
  * **Map Clearance Key:** **`3893`**
* **Advancement Outcome:**
  * Unlocks full access to the four interactive investigation locations:
    1. *Site 01:* Lake Herman Road, Benicia
    2. *Site 02:* Blue Rock Springs Park, Vallejo
    3. *Site 03:* Lake Berryessa, Napa County
    4. *Site 04:* Washington & Cherry Streets, Presidio Heights, SF
  * Triggers the killer's urgent intercept challenge: *"Four locations. One has been chosen. Three are irrelevant. You have 24 hours to tell me which one."*

---

### STAGE 4: The Reversed Audio & The Suspicious Call
* **Story Setup:** An incoming audio cassette transmission (`EV-0401`) is received on dispatch. A 47-second recording features a menacing monologue for the first 30 seconds, followed by 17 seconds of rhythmic high-frequency pulse anomalies.
* **Evidence Items:**
  * `EV-0401`: Recovered Audio Cassette & Waveform Reel.
  * Dispatch Logger transcript.
* **The Puzzle (Audio Reversal & Spectrogram Analysis):**
  * The spoken monologue warns detectives that their instincts will fail them.
  * Playing the final 17 seconds in reverse (or inspecting the reversed spectrogram) clarifies a distorted voice transmitting numerical coordinates.
* **Step-by-Step Deduction:**
  1. Scrub to the terminal 17-second section and engage reverse playback.
  2. Decode the spoken coordinate broadcast: `37.78857° N, 122.45605° W`.
  3. Compare with the four map survey points:
     * Site 01 (Benicia): `38°05'N, 122°08'W`
     * Site 02 (Vallejo): `38°07'N, 122°11'W`
     * Site 03 (Napa): `38°35'N, 122°14'W`
     * Site 04 (Presidio Heights): `37°47'N, 122°27'W` (`37.788° N, 122.456° W` at Washington & Cherry).
* **Solution Key:**
  * **Target Location Choice:** **Site 04 (Washington & Cherry Streets, Presidio Heights)**.
* **Advancement Outcome:**
  * Locking in Site 04 awards maximum bonus merit points.
  * After the timer elapses, the killer acknowledges the selection with an ominous dispatch confirming they were watching the site.

---

### STAGE 5: The Newspaper Reports & Suspect Database
* **Story Setup:** San Francisco Chronicle dispatches (`EV-0501`) report that 34-year-old archivist Daniel Mercer was found murdered in a disused office near the Presidio. Colleagues note Mercer discovered historical records were being subtly altered.
* **Evidence Items:**
  * `EV-0501`: SF Chronicle Special Dispatch (October 23 & 24 editions).
  * Clue details: An anonymous note stating *"You were looking at the wrong person"* marked with seven short horizontal dashes.
  * Credential worksheet reminder: `Cipher Terminal: SEVENMARKS`; `Suspect Database: Use the same password as the previous website`.
* **The Puzzle (Archival Database Access):**
  * The report notes the famous Z408 cipher investigation has been reopened in connection with Mercer's death.
  * Synthesizing the historical cipher designation (`Z408`) with the police status (`REOPENED`) produces the database master access token.
* **Solution Key:**
  * **Suspect Database Password:** **`Z408_REOPENED`**
* **Advancement Outcome:**
  * Unlocks the confidential suspect repository (`/suspect-database` or `gate_suspect_db`).
  * Reveals three restricted dossiers, including the case files of researcher Ellen Vale.

---

### STAGE 6: Ellen Vale's Journal & The Final Review
* **Story Setup:** Investigators open dossier `EV-0601` containing researcher Ellen Vale's personal research journal from October 1971, along with a video attachment labeled `FINAL_REVIEW.mp4`.
* **Evidence Items:**
  * `EV-0601`: Research Journal of Ellen Vale.
  * Attachment: `FINAL_REVIEW.mp4`.
* **The Revelation & The Climax:**
  * Playing the video displays a forensic playback of the players' own investigation: the password sheet, the Exorcist letter, the coordinates, the witness testimony, and the audio choices.
  * The video reveals a classified document titled **EXPECTED INVESTIGATOR RESPONSES**. Every move, theory, and wrong turn made by the investigators had been anticipated and pre-cataloged decades in advance.
  * The video closes on the message:
    > *"You have tried very hard to find the killer... But did you ever think about what would happen if he tried to find you?"*
  * The Director immediately issues emergency transmissions:
    > *"The case is closed. You have done enough. Delete your local copies of the files and wait for further instructions."*
* **Advancement Outcome:**
  * The user interface enters a controlled "system freeze" / lockout state.
  * The main navigation locks, leaving only the final morning newspaper edition accessible.

---

### STAGE 7: The Final Article & Case Closure
* **Story Setup:** The final headline appears on the screen: SF Chronicle Late City Edition (`EV-0701`).
* **Headline:** *"POLICE RECRUIT FOUND DEAD INSIDE STATION — Internal investigation launched as questions emerge over Zodiac case files."*
* **Narrative Resolution:**
  * The recruit assigned to examine the historical archives was found dead inside department headquarters.
  * Reaching the end of the article triggers the final broadcast: a distorted signal intercept displaying archival crime photographs followed by the iconic crosshair symbol before static cuts the transmission.
  * Investigators receive their final operational dossier evaluation, total merit score, and debrief certificate confirming the fictional nature of the case.

***

## 3. Operational Testing Summary Table

| Stage | Name | Key Clue / Source | Input / Puzzle Mechanism | Accepted Solution / Action | Unlock Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | The Archive | `EV-0103` (Sticky Note) | Double Acrostic (margins) | Dir: `Z-K case` / Key: `case-17` | Unlocks `EV-0201` + Stage 2 |
| **02** | The Locked Files | Photo metadata stamps | Alpha coordinate cipher | Decodes `37.78874, -122.45709` $\rightarrow$ `3893` | House address for Stage 3 |
| **03** | Witness & Map | `CAS-017` & `ARC-002` | House number password gate | Gate password: `3893` | Unlocks 4 Map Locations |
| **04** | Reversed Audio | `EV-0401` (17s pulse) | Reverse audio spectrogram | Choose **Location 04** (Presidio Heights) | +Bonus Score & Killer message |
| **05** | Suspect Database | `EV-0501` (Chronicle) | Mercer murder & Z408 reopen | Database key: `Z408_REOPENED` | Unlocks Suspect Dossiers |
| **06** | Ellen Vale's Journal | `EV-0601` & Video | Review of expected answers | Watch `FINAL_REVIEW.mp4` | Triggers Director lockdown |
| **07** | The Final Article | `EV-0701` (Chronicle) | Read station incident report | Reach terminal dispatch | Final score & Case Closure |
