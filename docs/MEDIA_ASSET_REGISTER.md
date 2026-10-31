# THE LAST SIGNAL — Media Asset Register & Technical Specification

> **Document Status:** Complete & Verified Against Existing Codebase and Source Materials  
> **Target Audience:** Production Engineers, Audio Designers, Video Editors, Game Organisers  
> **Compliance Standard:** Web Audio API W3C Recommendation / WCAG 2.1 AA / Safeguarding for Ages 11–18 (Classes 6–12)

---

## 1. Executive Summary

This register catalogs every audio, video, photographic, and textured asset utilized across the 7 stages and 14 calendar days of **THE LAST SIGNAL**. Currently, the frontend operates primarily with procedurally synthesized Web Audio API sounds (`tacticalAudio.ts`), CSS-based scanline/glitch shaders (`ControlledSystemGlitch.tsx`), simulated video playback scrubbers (`VideoAttachmentViewer.tsx`), and a subset of static PNG document renders located in `/public/images/`.

This document identifies existing assets, defines the precise specifications for final production assets (voice acting, ambient recordings, archival video reels), and outlines the accessibility and safeguarding rules governing playback.

---

## 2. Complete Asset Inventory

### 2.1 Audio Assets

| Asset ID | Stage | Current Filename / Path | Format | Description & Audio Narrative | Trigger Event | Current Implementation Status | Final Production Specification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-AMB-01** | Global | Procedural in `tacticalAudio.ts` | Web Audio (Brown noise + BPF) | Low subterranean wind drone (45 Hz fundamental, resonant sweep). | Ambient toggle on dashboard/investigation. | **Implemented & Verified** (Procedural synthesis) | 48kHz, 24-bit stereo OGG/MP3 loop, -24 LUFS, seamless 120s loop. |
| **AUD-AMB-02** | Global | Procedural in `tacticalAudio.ts` | Web Audio (White noise + HPF) | Subdued archive rain on skylight / iron roof. | Optional weather toggle in tactical audio bar. | **Implemented & Verified** (Procedural synthesis) | 48kHz stereo OGG/MP3, natural British/Northern rain ambience, 90s loop. |
| **AUD-AMB-03** | Global | Procedural in `tacticalAudio.ts` | Web Audio (Pink noise + notch filter) | Analog magnetic tape hiss and electrical 50Hz mains hum. | Plays when any dossier or tape view is opened. | **Implemented & Verified** (Procedural synthesis) | Authentic 1970s Nagra reel-to-reel tape head hiss loop (-30 LUFS). |
| **AUD-UI-01** | Global | Procedural in `tacticalAudio.ts` | Web Audio (Micro-impulse) | Dry mechanical relay click on button click / tab change. | Navigation clicks, drawer toggles, mode switches. | **Implemented & Verified** (Procedural synthesis) | 16-bit 44.1kHz mono WAV, 12ms transient, no reverb tail. |
| **AUD-UI-02** | Global | Procedural in `tacticalAudio.ts` | Web Audio (Dual sine sweep) | Forensic evidence dossier open / document page rustle. | Opening evidence modal or document sheet. | **Implemented & Verified** (Procedural synthesis) | Foley recording of vintage manila case folder opening on wooden desk. |
| **AUD-UI-03** | Global | Procedural in `tacticalAudio.ts` | Web Audio (Filtered pulse) | Teletype terminal mechanical key strike and carriage return. | Typing in input submission boxes and password fields. | **Implemented & Verified** (Procedural synthesis) | Authentic mechanical teletype / IBM Selectric II keystroke sample bank. |
| **AUD-UI-04** | Global | Procedural in `tacticalAudio.ts` | Web Audio (Dual harmonic chime) | Solved puzzle / verification accepted chime. | Stage advancement or correct password input. | **Implemented & Verified** (Procedural synthesis) | Clean, muted analog electronic chime (two-tone: 440 Hz -> 880 Hz). |
| **AUD-UI-05** | Global | Procedural in `tacticalAudio.ts` | Web Audio (Square wave buzz) | Dull access denied / incorrect code buzz. | Failed password entry or invalid coordinate submission. | **Implemented & Verified** (Procedural synthesis) | Muted 120 Hz relay refusal buzz (150ms duration, non-jarring). |
| **AUD-EV-0102** | Stage 1 | Procedural / Static | Web Audio (Sine carrier + AM modulation) | AM radio frequency drift with submerged carrier signal. | Inspecting `EV-0102` (Radio Broadcast Log). | **Partially Implemented** (Procedural carrier tone) | 128kbps MP3: 1968 shortwave radio recording with fading heterodyne whistle. |
| **AUD-EV-0401** | Stage 4 / 5 | Missing (Simulated ticker) | Expected: Stereo MP3/WAV | 47-second magnetic tape: 30s distorted telephone monologue + 17s pulse/reversed audio. | Pressing 'Play Cassette' on `EV-0401` evidence modal. | **Missing Asset** (Frontend uses simulated progress ticker only) | Master 47.0s 44.1kHz MP3: Voice acting through telephone bandpass (300Hz-3kHz) + reversed voice layer containing coordinates. |
| **AUD-GLITCH-01** | Stage 6 | Procedural in `ControlledSystemGlitch.tsx` | Web Audio (Oscillator FM burst) | Harsh electrical interference, CRT flyback transformer whine, and audio freeze. | Video reaches 01:24 or Director dispatch step 3. | **Implemented & Verified** (Procedural Web Audio burst) | High-definition analog broadcast interruption screech, capped at -12 dBFS. |

---

### 2.2 Video Assets

| Asset ID | Stage | Current Filename / Path | Format | Description & Visual Narrative | Trigger Event | Current Implementation Status | Final Production Specification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VID-EV-0601** | Stage 6 / 7 | `/assets/FINAL_REVIEW.mp4` (Source: `WhatsApp_Video_2026-10-29_at_00.25.05_829df3d2.mp4`) | MP4 (H.264 854x480 / AAC Stereo 44.1kHz) | 59.72-second archival surveillance reel: Access trace, signal monitor line, Expected Investigator Responses text, three red message squares, hooded figure ("Do you even know what you are after?"), severe tracking tear, blood drips ("This is where it ends..."), and "TURN BACK". Includes full atmospheric horror/telemetry audio soundtrack. | Opening Stage 6 Video Attachment Viewer or Stage 7 Ending Reel. | **Integrated & Verified** (`VideoAttachmentViewer.tsx` and `DebriefView.tsx` render genuine HTML5 video with user-gesture Fullscreen API, near-fullscreen fallback, and ambient audio priority ducking) | Production master integrated directly into `/public/assets/FINAL_REVIEW.mp4`. |
| **VID-UI-FREEZE** | Stage 6 / 7 | CSS / SVG Canvas in `ControlledSystemGlitch.tsx` | WebGL / CSS Animation | System lockup: RGB separation, horizontal hold failure, phosphor persistence trail, frozen interface. | Completion of Stage 6 video playback or initiate review button. | **Implemented & Verified** (5-step forensic malfunction sequence with synchronized Web Audio sound effects and sensory toggle) | Hybrid CSS/Canvas render with hardware acceleration; reduced motion fallback for accessibility. |

---

### 2.3 Photographic & Document Image Assets

| Asset ID | Stage | Existing Path in Repo | File Format | Dimensions | Visual Subject Matter | Current Code Status | Final Polish Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **IMG-HERO-01** | Landing | `/public/images/hero-scene.png` | PNG | 1920x1080 | Dramatic dark detective archive desk with folders, lamp, radio equipment. | **Present & Verified** | High-contrast forensic desktop scene, calibrated for dark mode. |
| **IMG-TEX-01** | Global | `/public/images/paper-texture.png` | PNG (Greyscale) | 1024x1024 | Subtle fiber paper grain with coffee ring and vintage creases. | **Present & Verified** | Seamless repeating 512x512 tileable PNG with 15% opacity overlay. |
| **IMG-EV-0101** | Stage 1 | `/public/images/ev-newspaper.png` | PNG | 800x1100 | St. Jude's Chronicle clipping (Oct 24, 1968) "STUDENT MISSING". | **Present & Verified** | Ensure newspaper clipping text is legible at 100% zoom without blur. |
| **IMG-EV-0102** | Stage 1 | `/public/images/ev-radio.png` | PNG | 800x600 | Ham radio receiver logbook with handwritten call signs and frequencies. | **Present & Verified** | Logbook grid lines with authentic faded blue fountain pen ink. |
| **IMG-EV-0103** | Stage 1 | `/public/images/ev-letter.png` (reused) | PNG | 800x1000 | Cryptic scrap paper with Caesar shift cipher string and vertical margins. | **Shared / Reused** | Create dedicated scrap paper asset with torn edge. |
| **IMG-EV-0201** | Stage 2 | `/public/images/ev-letter.png` | PNG | 800x1000 | Headmaster Arthur Pendelton's official reprimand letter on school crest stationery. | **Present & Verified** | Official embossed seal and faint typewriter ribbon imprint. |
| **IMG-EV-0202** | Stage 2 | Missing | Expected: PNG | 800x1200 | Library loan ledger card with borrower signatures and catalog numbers. | **Missing Asset** | 1960s index card scan with library date stamps. |
| **IMG-EV-0301** | Stage 3 | `/public/images/ev-archive-room.png` | PNG | 1000x750 | Floor blueprint of Archive Sub-Basement with sector grid coordinates. | **Present & Verified** | Blue diazo print with drafting compass marks and stamped classified red seal. |
| **IMG-EV-0302** | Stage 3 | Missing | Expected: PNG | 800x1000 | Disciplinary hearing transcript excerpt from October 28, 1968. | **Missing Asset** | Mimeograph purple/blue ink on aged off-white paper. |
| **IMG-EV-0401** | Stage 4 | `/public/images/ev-cassette.png` | PNG | 800x600 | Realistic C-60 cassette tape labeled "OCT 29 20:42 ARCHIVE". | **Present & Verified** | Maxell/Scotch 1968 styling with handwritten felt-pen label. |
| **IMG-EV-0501** | Stage 5 | `/public/images/ev-tower.png` | PNG | 1000x800 | Topographical quadrangle map with signal transmission tower coordinates. | **Present & Verified** | US Geological Survey / Ordnance Survey styling with triangulation lines. |
| **IMG-EV-0601** | Stage 6 | Missing | Expected: PNG | 800x1100 | Ellen Vale's personal field diary page with water damage and hurried handwriting. | **Missing Asset** | Lined notebook paper with ink smear and torn bottom corner. |
| **IMG-EV-0701** | Stage 7 | Missing | Expected: PNG | 800x1200 | Final retrospective Chronicle article: "FIFTY YEARS OF SILENCE". | **Missing Asset** | Commemorative retrospective broadsheet layout. |

---

## 3. Playback Architecture & Audio Constraints

### 3.1 Web Audio Autoplay Policy & User Interaction Lock
Browsers (Chrome, Firefox, Safari, Edge) strictly forbid audio playback prior to user interaction.
- `tacticalAudio.ts` initializes in a dormant state (`AudioContext` suspended or null).
- Audio is **MUTED by default** across all channels on initial load (`sfxMuted = true`, `ambientMuted = true`).
- The user must explicitly toggle sound via the tactile header control or click an interactive element before audio triggers.
- An unmuted preference is persisted across sessions in `localStorage` under keys `tls_sfx_muted_v1`, `tls_sfx_volume_v1`, `tls_ambient_muted_v1`, `tls_ambient_volume_v1`.
- When the browser tab loses focus (`visibilitychange` -> `document.hidden`), `tacticalAudio` automatically suspends the audio context to conserve CPU and prevent background audio leaks.

### 3.2 Volume Normalization & Sound Pressure Limits
To safeguard school students wearing headphones or earbuds:
1. **Master Bus Ceiling:** Master gain output is hard-limited to a maximum of `-6 dBFS`.
2. **Ambient Bed Level:** Ambient soundscapes default to `-18 dBFS` relative to UI clicks.
3. **No Piercing Screeches:** Peak resonance filters ($Q > 8$) on glitch audio are clamped to prevent dangerous acoustic spikes.
4. **Independent Gain Stages:**
   - SFX Channel (keystrokes, relays, chimes): Scaled $0.0 - 1.0$ (Default $0.25$)
   - Ambient Channel (sub-bass hum, tape hiss): Scaled $0.0 - 1.0$ (Default $0.18$)
   - Rain Channel (procedural storm): Scaled $0.0 - 1.0$ (Default $0.15$)

### 3.3 Sensory Safeguarding & Accessibility (WCAG 2.1 AA)
Because **THE LAST SIGNAL** is played by students in Classes 6–12 (ages 11–18):
1. **Reduced Motion & Reduced Sensory Option:**
   - In `ControlledSystemGlitch.tsx`, a prominent "REDUCE SENSORY EFFECTS" toggle is built in.
   - When enabled, high-frequency flashing (> 3 flashes per second), screen shaking, and loud interference bursts are bypassed.
   - `prefers-reduced-motion` media queries automatically disable CRT jitter and viewport tremors.
2. **Full Closed Captions & Transcripts:**
   - Any audio asset containing voice (`EV-0401`) or Morse code (`AUD-EV-0102`) must feature an expandable, synchronous text transcript directly in the evidence modal.
   - The transcript must include acoustic descriptions (e.g., `[Heavy tape hiss]`, `[Distorted telephone voice: "The archive is not what they told you..."]`, `[High-pitched periodic beep]`).
   - Deaf and hard-of-hearing students must have complete parity of clues; no clue may be exclusive to audio perception without a visual equivalent.
3. **Emergency "Skip to Next Step" Button:**
   - The Stage 6 Controlled Glitch modal incorporates a clear, accessible "Skip Interruption" / "Emergency System Bypass" button, ensuring students who feel unsettled or experience visual discomfort can immediately progress to the debrief screen without being trapped.

---

## 4. Video Player Architecture (`VideoAttachmentViewer.tsx`)

### 4.1 Playback Features
1. **Custom Tactical Scrubber:** Forensic timeline with millisecond timecode (`00:00.00` to `01:24.00`), frame-advance buttons (`+1s`, `-1s`), play/pause toggle, and fullscreen viewer.
2. **Analog CRT Filter Layer:** CSS overlay applying 12% chromatic aberration, 2px scanline pitch, and intermittent tracking distortion.
3. **Missing Asset Graceful Fallback:** If `FINAL_REVIEW.mp4` is absent from `/public/assets/`, the player does not render a broken 404 player icon. Instead, it transitions seamlessly into an authenticated "Organizer Test Carrier" screen rendering timecoded surveillance wireframe graphics and text summaries.

### 4.2 Mobile Responsiveness
- Video container enforces a rigid 16:9 / 4:3 responsive aspect ratio via CSS `aspect-video` and `max-h-[70vh]`.
- Controls automatically scale for touch targets (minimum 44x44px hitboxes for mobile fingers).
- Touch scrubbing is debounced to avoid erratic frame seeking on low-bandwidth school Wi-Fi connections.
