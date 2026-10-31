/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANONICAL CASE INVENTORY & MOCK DATA
 * 
 * Strict separation: Clues and evidence necessary for solving are provided,
 * while solution keys and plaintext credentials are never leaked.
 */

import { isGameLaunched } from './stageConfig';

export const CASE_ID = 'TLS-0017';

export type EvidenceKind =
  | 'Scene photograph'
  | 'Physical evidence'
  | 'Location'
  | 'Document'
  | 'Audio'
  | 'Interview'
  | 'Newspaper'
  | 'Forensic negative';

export type EvidenceStatus = 'available' | 'locked' | 'restricted' | 'sealed' | 'reviewed';

export type EvidenceItem = {
  id: string;
  title: string;
  category: string;
  kind: EvidenceKind;
  source: string;
  date: string;
  classification: 'Confidential' | 'Restricted' | 'Internal' | 'Open file' | 'Inconclusive' | 'Public record';
  status: EvidenceStatus;
  stage: number;
  summary: string;
  description: string;
  image?: string;
  hasDocument?: boolean;
};

export type Stage = {
  number: number;
  title: string;
  subtitle: string;
  state: 'completed' | 'available' | 'locked' | 'late';
  date: string;
  progress: number;
};

export const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: 'layout' },
  { label: 'Investigation', path: '/investigation', icon: 'folder' },
  { label: 'Evidence room', path: '/evidence', icon: 'file' },
  { label: 'Clearance terminal', path: '/terminal', icon: 'terminal' },
  { label: 'Signal map', path: '/map', icon: 'map' },
  { label: 'Suspect files', path: '/suspects', icon: 'shield' },
  { label: 'Messages', path: '/messages', icon: 'message' },
  { label: 'Support', path: '/support', icon: 'help' },
  { label: 'Progress', path: '/progress', icon: 'activity' },
  { label: 'Leaderboard', path: '/leaderboard', icon: 'bar' },
  { label: 'Team', path: '/team', icon: 'users' },
] as const;

export const stages: Stage[] = [
  {
    number: 1,
    title: 'The Archive',
    subtitle: "The archivist's letter & docket registry",
    state: 'available',
    date: 'Nov 01–03',
    progress: 0,
  },
  {
    number: 2,
    title: 'The Lower Vault',
    subtitle: 'County records bay & negative telemetry',
    state: 'locked',
    date: 'Nov 03–05',
    progress: 0,
  },
  {
    number: 3,
    title: 'The Presidio Witness',
    subtitle: 'Case testimony & regional survey',
    state: 'locked',
    date: 'Nov 05–07',
    progress: 0,
  },
  {
    number: 4,
    title: 'The 47-Second Tape',
    subtitle: 'Dispatch recording & signal candidate',
    state: 'locked',
    date: 'Nov 07–09',
    progress: 0,
  },
  {
    number: 5,
    title: 'The Mercer Inquest',
    subtitle: 'Chronicle report & confidential dossiers',
    state: 'locked',
    date: 'Nov 09–11',
    progress: 0,
  },
  {
    number: 6,
    title: 'The Record That Remembered Tomorrow',
    subtitle: 'Incident Report 06-B & Archival Revision Paradox',
    state: 'locked',
    date: 'Nov 11–13',
    progress: 0,
  },
  {
    number: 7,
    title: "Ellen Vale's Journal and the Final Review",
    subtitle: 'Research journal, 16mm reel & station incident',
    state: 'locked',
    date: 'Nov 13–15',
    progress: 0,
  },
];

export const evidence: EvidenceItem[] = [
  {
    id: 'EV-0101',
    title: 'Scene Overview — Rear Alley',
    category: 'Photograph',
    kind: 'Scene photograph',
    source: 'Presidio District Police Log',
    date: '19 Oct 2026',
    classification: 'Confidential',
    status: 'available',
    stage: 1,
    summary: 'Wide establishing frame of the scene at night. A handheld radio lying on wet cobblestones behind police barrier tape.',
    description: 'Establishing photograph of the primary discovery zone. Wet pavement reflects distant streetlamps. Police cordon tape marks the perimeter where communication equipment was dropped.',
    image: '/images/hero-scene.png',
    hasDocument: true,
  },
  {
    id: 'EV-0102',
    title: 'Portable Radio Receiver',
    category: 'Physical',
    kind: 'Physical evidence',
    source: 'Forensics Intake Division',
    date: '19 Oct 2026',
    classification: 'Confidential',
    status: 'available',
    stage: 1,
    summary: 'Battery-powered radio receiver recovered from cobblestones. Dial fixed to an uncatalogued regional frequency.',
    description: 'Item photographed with forensic metric scale. Casing shows impact scoring consistent with a drop. The channel selector is locked mechanically to an off-band frequency.',
    image: '/images/ev-radio.png',
    hasDocument: true,
  },
  {
    id: 'EV-0103',
    title: "The Exorcist's Letter & Affixed Note",
    category: 'Document',
    kind: 'Document',
    source: 'Archival Vault B',
    date: '19 Oct 2026',
    classification: 'Restricted',
    status: 'available',
    stage: 1,
    summary: 'Historic case correspondence with an attached six-line cipher memorandum. Margins reveal structured acrostic patterns.',
    description: 'Archived correspondence bearing historic notations. Affixed to the lower margin is a six-line memorandum written in an irregular scrambled format. Careful inspection of line boundaries is required.',
    image: '/images/ev-letter.png',
    hasDocument: true,
  },
  {
    id: 'ARC-002',
    title: 'Partial Credential Worksheet',
    category: 'Document',
    kind: 'Document',
    source: 'Records Annex Desk',
    date: '19 Oct 2026',
    classification: 'Open file',
    status: 'available',
    stage: 1,
    summary: 'A reference sheet of system credentials recovered with heavy ink obscuring multiple access keys.',
    description: 'Worksheet itemizing system access codes. Several entries have been deliberately occluded with dark ink. Marginal notes reference house numbers and historic passwords.',
    image: '/images/paper-texture.png',
    hasDocument: true,
  },
  {
    id: 'EV-0201',
    title: 'Photographic Negative Dossier — Archival Evidence Plates (1–4)',
    category: 'Photograph',
    kind: 'Forensic negative',
    source: 'California Department of Justice / Multi-County Forensic Labs',
    date: '1968–1969',
    classification: 'Confidential',
    status: 'locked',
    stage: 2,
    summary: 'Consolidated archival photographic negative dossier containing all four canonical crime scene sector negatives (Lake Herman Rd, Blue Rock Springs, Lake Berryessa, Presidio Heights) with stamped telemetry data.',
    description: 'Official case dossier housing four archival photographic negative plates recovered from county sheriff repositories. Each plate preserves geographic coordinates and incident telemetry encoded in the marginal camera data strips.',
    image: '/assets/aistudio/WhatsApp_Image_2026-10-30_at_14.44.03_3e3a9c61.jpeg',
    hasDocument: true,
  },
  {
    id: 'CAS-017',
    title: 'Witness Testimony — Case File 017',
    category: 'Interview',
    kind: 'Interview',
    source: 'San Francisco Police Transcript',
    date: '21 Oct 2026',
    classification: 'Inconclusive',
    status: 'locked',
    stage: 3,
    summary: 'Interview recollection of an unidentified resident describing sounds, an idling car, and a window light across the street in Presidio Heights.',
    description: 'Transcript of interview regarding an incident in Presidio Heights. Subject details sensory recollections from late evening. The recorded house number correlates with the decrypted Stage 2 telemetry coordinates.',
    image: '/images/paper-texture.png',
    hasDocument: true,
  },
  {
    id: 'EV-0301',
    title: 'Coastal Transmission Mast',
    category: 'Photograph',
    kind: 'Location',
    source: 'Presidio Ridge Facility',
    date: '23 Oct 2026',
    classification: 'Internal',
    status: 'locked',
    stage: 3,
    summary: 'Microwave relay station atop coastal ridgeline. Triangulation point connected to ongoing map investigation.',
    description: 'Telephoto view of the coastal relay tower. Antenna arrays appear modified with non-standard cabling.',
    image: '/images/ev-tower.png',
    hasDocument: false,
  },
  {
    id: 'EV-0401',
    title: 'Recovered Audio Cassette',
    category: 'Audio',
    kind: 'Audio',
    source: 'Dispatch Call Logger',
    date: '25 Oct 2026',
    classification: 'Restricted',
    status: 'locked',
    stage: 4,
    summary: '47-second recording containing spoken monologue and an unexplained audio duration with encoded pulse anomalies.',
    description: 'Audio magnetic tape recovered from telephone recording bank. Spoken monologue terminates at 30 seconds; remainder contains rhythmic high-frequency pulses.',
    image: '/images/ev-cassette.png',
    hasDocument: true,
  },
  {
    id: 'EV-0501',
    title: 'San Francisco Chronicle — Special Dispatch',
    category: 'Newspaper',
    kind: 'Newspaper',
    source: 'Public Press Archive',
    date: '27 Oct 2026',
    classification: 'Public record',
    status: 'locked',
    stage: 5,
    summary: 'Front page report regarding archivist Daniel Mercer and anomalous modifications discovered in historic files. Mentions reopening of Z408 cipher.',
    description: 'Broadsheet print edition. In-depth report on recent events near the Presidio and an anonymous message referencing Z408_REOPENED.',
    image: '/images/ev-newspaper.png',
    hasDocument: true,
  },
  {
    id: 'EV-0502',
    title: 'Suspect Dossier S-02: Arthur Leigh Allen',
    category: 'Document',
    kind: 'Interview',
    source: 'Restricted Dossier Vault',
    date: '28 Oct 2026',
    classification: 'Restricted',
    status: 'restricted',
    stage: 5,
    summary: 'Special inquiry dossier on Person of Interest S-02. Former Vallejo elementary custodian interviewed regarding lake turnouts.',
    description: 'Classified suspect file. Fingerprint classification 14-M-3. Subject questioned regarding presence near Benicia and Lake Herman. Possession of a Zodiac brand dive watch noted.',
    image: '/images/paper-texture.png',
    hasDocument: true,
  },
  {
    id: 'EV-0503',
    title: 'Suspect Dossier S-03: Richard Gaikowski',
    category: 'Document',
    kind: 'Interview',
    source: 'Restricted Dossier Vault',
    date: '28 Oct 2026',
    classification: 'Restricted',
    status: 'restricted',
    stage: 5,
    summary: 'Special inquiry dossier on Person of Interest S-03. Press writer affiliated with regional underground publications.',
    description: 'Classified suspect file. Intercepted correspondence and audio log analysis. Subject maintained offices within line-of-sight of Presidio dispatch corridors.',
    image: '/images/paper-texture.png',
    hasDocument: true,
  },
  {
    id: 'EV-0601',
    title: 'Incident Report 06-B & The Torn Note',
    category: 'Document',
    kind: 'Document',
    source: 'SFPD Special Inquiries / Case 17',
    date: '29 Oct 2026',
    classification: 'Confidential',
    status: 'sealed',
    stage: 6,
    summary: 'Police incident report regarding an unidentified source found dead in a locked room. Papers recovered include a torn note initialed E.V. and ARCHIVE_ACCESS.txt.',
    description: 'Deceased contact possessed duplicate archival documents from the Daniel Mercer inquiry. Desk evidence contains torn fragment initialed E.V., an anomalous reference to October 1971, and an archive access formula.',
    image: '/images/paper-texture.png',
    hasDocument: true,
  },
  {
    id: 'EV-0602',
    title: 'Archival Revision Log & Unsent Message',
    category: 'Document',
    kind: 'Document',
    source: 'Regional Records Repository',
    date: '29 Oct 2026',
    classification: 'Restricted',
    status: 'sealed',
    stage: 6,
    summary: 'Comparative docket entries and unsent teletype fragment identifying an archival alteration timestamp predating the event it describes.',
    description: 'Internal records room audit revealing chronological inconsistencies in historical logs. A revision timestamp entry predates the actual dispatch incident by several hours.',
    image: '/images/paper-texture.png',
    hasDocument: true,
  },
  {
    id: 'EV-0701',
    title: 'Research Journal of Ellen Vale',
    category: 'Document',
    kind: 'Document',
    source: 'Restricted Dossier Vault',
    date: 'October 1971',
    classification: 'Confidential',
    status: 'sealed',
    stage: 7,
    summary: 'Journal notebook from October 1971 detailing cipher analysis and anomalous investigation predictions. Contains attachment FINAL_REVIEW.mp4.',
    description: 'Hardbound research log unlocked with archive credential EV1971. Pages contain analytical studies of historic letters and an unexpected review sequence anticipating investigator responses.',
    image: '/images/paper-texture.png',
    hasDocument: true,
  },
  {
    id: 'EV-0702',
    title: 'Chronicle Final Edition — Station Incident',
    category: 'Newspaper',
    kind: 'Newspaper',
    source: 'San Francisco Chronicle Late Edition',
    date: '24 Oct 2026',
    classification: 'Public record',
    status: 'sealed',
    stage: 7,
    summary: 'Late night edition reporting the discovery of a police recruit inside station premises.',
    description: 'Final investigative article reporting on the internal inquiry following historic file examinations.',
    image: '/images/ev-newspaper.png',
    hasDocument: true,
  },
];

export const messages = [
  {
    sender: 'SYSTEM DISPATCH',
    tone: 'system',
    time: '00:00:00',
    text: 'Investigation terminal initialized. Stage 01 archive access is currently open. Stage 02 remains sealed.',
  },
  {
    sender: 'THE DIRECTOR',
    tone: 'director',
    time: 'LOG ENTRY 01',
    text: 'Begin with Item EV-0103. The Exorcist letter carries an attached note. The boundaries of the text will give you what you need to access the locked files.',
  },
  {
    sender: 'ARCHIVAL ADVISORY',
    tone: 'system',
    time: 'TRANSMISSION 02',
    text: 'Notice: Never attempt to navigate to real-world coordinates. All locations, documents, and transcripts are fictional mystery puzzles for gameplay.',
  },
  {
    sender: 'UNKNOWN SIGNAL',
    tone: 'antagonist',
    time: 'INTERCEPT',
    text: 'You think this is just history on old paper. Keep looking. Let us see how long it takes you to reach the map.',
  },
];

export function getEvidence(id: string): EvidenceItem | undefined {
  if (!id) return undefined;
  return evidence.find((item) => item.id.toLowerCase() === id.trim().toLowerCase());
}

