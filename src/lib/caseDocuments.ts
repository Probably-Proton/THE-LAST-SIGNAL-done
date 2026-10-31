/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLASSIFIED CASE OVERVIEW DOSSIERS — THE FIRST DIRECTIVE
 * 
 * Five historic Zodiac case overview records provided for investigator
 * familiarization during the First Directive orientation.
 * 
 * CRITICAL PRESERVATION NOTICE:
 * All texts, incident summaries, ballistic descriptions, typos, corrupted words,
 * and anomalous headers are preserved VERBATIM from the original archival scans.
 * Documents 2 and 4 are maintained as distinct records.
 */

export interface CaseDocumentItem {
  id: string;
  documentNumber: number;
  caseNumber: string;
  title: string;
  shortTitle: string;
  victimName: string;
  dateOfIncident: string;
  location: string;
  reportedBy: string;
  imagePath: string;
  isDraftOrCorrupted?: boolean;
  agencyHeader: {
    dept: string;
    subDept?: string;
    addressLines?: string[];
  };
  stamps: string[];
  summary: string;
  victimProfiles: string[];
  ballisticsAndPhysicalEvidence: string[];
  caseStatus: string;
  investigatorSignature: {
    signatureText: string;
    leadTitle: string;
    signedDate?: string;
    isHandwritten?: boolean;
  };
  footerNotice: string;
}

export const CLASSIFIED_CASE_DOCUMENTS: CaseDocumentItem[] = [
  {
    id: 'sfpd-1969-1011',
    documentNumber: 1,
    caseNumber: 'SFPD-1969-1011',
    title: 'CASE OVERVIEW - PAUL LEE STINE',
    shortTitle: 'Doc 01: Paul Lee Stine',
    victimName: 'Paul Lee Stine',
    dateOfIncident: '11 OCT 1969',
    location: 'WASHINGTON & CHERRY STS, PRESIDIO HEIGHTS, SF',
    reportedBy: 'INSPECTOR T. TOSCHI',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM__2__20ef5232.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: 'SAN FRANCISCO POLICE DEPARTMENT • HOMICIDE DETAIL',
      subDept: 'BUREAU OF INSPECTORS / RECORDS & EVIDENCE CONTROL',
    },
    stamps: ['CONFIDENTIAL', 'CONFIDENTIAL', 'CASE FILE - ACTIVE'],
    summary:
      "On the night of October 11, 1969, at approximately 9:55 PM, San Francisco taxi driver Paul Lee Stine was shot and killed. Stine had picked up a passenger in downtown San Francisco and driven to the Presidio Heights neighborhood. Upon reaching the intersection of Washington Street and Cherry Street, the suspect, described as a heavy-set white male wearing glasses, shot Stine in the right temple at close range. After the shooting, the suspect took Stine's wallet and cab keys, and deliberately tore away a large swatch of Stine's bloody shirt tail tail before walking away toward the Presidio. Teenagers across the street witnessed the murder from their window and immediately alerted the SFPD.",
    victimProfiles: [
      'PAUL LEE STINE (Age 29). Status: DECEASED (Shot once in the right temple at close range).',
    ],
    ballisticsAndPhysicalEvidence: [
      'Multiple pieces of key evidence are under analysis.',
      '1. BALLISTICS: The fatal shot was from a 9mm handgun.',
      "2. PHYSICAL EVIDENCE: Large sections of the victim's bloodied shirt tail were confirmed as missing.",
      "3. EVIDENCE MAILED: Within three days, the killer (the Zodiac) mailed letters to the San Francisco Chronicle containing a piece of the victim's bloody shirt as proof.",
      '4. COMPOSITE: Based on eyewitness accounts, a detailed composite sketch of the suspect was created.',
    ],
    caseStatus:
      'STATUS: UNSOLVED. The incident is classified as a homicide. Immediate context indicates a potential robbery, but letter communication subsequently claimed by "The Zodiac" has connected this killing to the multi-jurisdiction serial killer investigation. This is considered the final confirmed Zodiac Homicide. Investigation is ongoing by the SFPD Homicide Detail.',
    investigatorSignature: {
      signatureText: 'T. Toschi',
      leadTitle: 'INSPECTOR T. TOSCHI, LEAD INVESTIGATOR',
      isHandwritten: true,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'sol-1968-1220-draft',
    documentNumber: 2,
    caseNumber: 'SOL-1968-1220',
    title: 'CASE OVERVIEW - DAVID FARADAY & BETTY LOU JENSEN',
    shortTitle: 'Doc 02: Faraday & Jensen (Draft / Glitched)',
    victimName: 'David Faraday & Betty Lou Jensen',
    dateOfIncident: 'December 20, 1968',
    location: "Waker Lover's Lane, Benicia",
    reportedBy: 'SGT. R. HALSTEAD',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM__1__dc8203ea.jpeg',
    isDraftOrCorrupted: true,
    agencyHeader: {
      dept: 'CALIFORNIA DEPARTMENT OF JUSTICE',
      subDept: 'Solano Department',
      addressLines: [
        '32320 Calenns Ease Evidence NI 98020',
        "Waker Lover's Lane",
        'Benicia, 19673',
      ],
    },
    stamps: ['TOP SECRET', 'CONFIDENTIAL', 'DATE 05, 28 // RECORDS & EVIDENCE CONTROL'],
    summary:
      "On the night of December 20, 1968, at approximately 11:15 PM, hih Larm Arthur Betty Jensen were present at a Faraday and Betty Lou Jensen were present 's vehiced, Benicia. As they were parked in fcrraalant, ordering them to exit. The assailant rounds from a .22-caliber fatally wounding both individuals. The attacker fled the scene , leaving lititial evidence.",
    victimProfiles: [
      'VICTIM PROFILES - Victim 1 is David Arthur Faraday (Age 17), who was deceased at the scene from a single gunshot to the head. Victim 2 is Betty Lou Jensen (Age 16), who was also deceased at the scene from multiple gunshot wounds to the back.',
    ],
    ballisticsAndPhysicalEvidence: [
      "Multiple items were recovered from the scene, including Winchester Western Super-X brand .22 caliber ammuition, which atem are believeed. Tire tracks from a shot-out used. The front passenger window of Faraday's vehicle vehicle were also noted in the vicinity of the turnout.",
    ],
    caseStatus:
      "This double homicide remains an active unsolved case Sheriff's Department and Benicia Politice. Evidence links likis incident to the serial killer known as 'The Zodiac as Killer'. No viable suspects have been inspects bentif orr aprehrehended araproended as curr-ently exhausted. DO NOT DUPLICATE.",
    investigatorSignature: {
      signatureText: 'SGT. R. HALSTEAD',
      leadTitle: 'SGT. R. HALSTEAD',
      signedDate: 'DATE 05, 28 // RECORDS & EVIDENCE CONTROL',
      isHandwritten: false,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'nap-1969-0927',
    documentNumber: 3,
    caseNumber: 'NAP-11969-0927', // Preserved verbatim from title header
    title: 'CASE OVERVIEW - CECELIA SHEPARD',
    shortTitle: 'Doc 03: Cecelia Shepard',
    victimName: 'Cecelia Shepard & Bryan Calvin Hartnell',
    dateOfIncident: '27 SEP 1969',
    location: 'LAKE BERRYESSA (TWIN OAK RIDGE), NAPA COUNTY, CA',
    reportedBy: 'DEPUTY R. LANDS',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM_82bcbfb0.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: "NAPA COUNTY SHERIFF'S OFFICE • HOMICIDE DIVISION",
      subDept: 'BUREAU OF INVESTGATION / RECORDS & EVIDENCE CONTROL',
    },
    stamps: ['CONFIDENTIAL', 'CONFIDENTIAL', 'CASE FILE - ACTIVE'],
    summary:
      "On the evening of September 27, 1969, at approximately 6:15 PM, college students Bryan Calvin Hartnell and Cecelia Ann Shepard were present at Lake Berryessa's Twin Oak Ridge. They were approached by a male wearing a dark, executioner-style hood with a white crosshair symbol. The attacker bound them with plastic clothesline before repeatedly stabbing both victims with a large knife. The perpetrator then inscribed details on the door of Hartnell's parked vehicle before fleeing.",
    victimProfiles: [
      'CECILIIANN SHEPARD (Age 22). Deceased - succumbed to injuries on September 29, 1969. Multiple stab wounds.',
      'BRYAN CALVIN HARTNELL (Age 20). Survived - multiple stab wounds to back and abdomen. Recovering.',
    ],
    ballisticsAndPhysicalEvidence: [
      'Multiple pieces of key evidence are under analysis.',
      '1. BALLISTICS: N/A, non-firearm assault.',
      '2. PHYSICAL EVIDENCE: Large 10-to-12 inch clip-point knife identified as weapon.',
      "3. VEHICLE GRAFFITI: Victim's car door was inscribed with dates and crosshair symbol.",
      "4. BOOT FOOTPRINTS: Clear prints matching 'Wing Walker' boot size 10.5 found in shoreline mud.",
    ],
    caseStatus:
      'STATUS: UNSOLVED. The incident is classified as a double homicide/violent assault. Follow-up investigations and potential links to other area crimes are ongoing. Victim interviews and witness accounts provide key information. Extensive evidence processing is complete.',
    investigatorSignature: {
      signatureText: '_R. Lands_',
      leadTitle: 'DEPUTY R. LANDS, LEAD INVESTIGATOR',
      isHandwritten: true,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'sol-1968-1220-std',
    documentNumber: 4,
    caseNumber: 'SOL-1968-1220',
    title: 'CASE OVERVIEW - DAVID ARTHUR FARADAY',
    shortTitle: 'Doc 04: David Arthur Faraday (Standard)',
    victimName: 'David Arthur Faraday & Betty Lou Jensen',
    dateOfIncident: 'December 20, 1968',
    location: "Lake Herman Road Lover's Lane turnout, Benicia",
    reportedBy: 'SGT. R. HALSTEAD, LEAD INVESTIGATOR',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.45_PM_569a111e.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: 'CALIFORNIA DEPARTMENT OF JUSTICE',
      subDept: 'Solano Department',
      addressLines: [
        '32320 Calenns Ease Evidence NI 98020',
        "Waker Lover's Lane",
        'Benicia, 19673',
      ],
    },
    stamps: ['TOP SECRET', 'CONFIDENTIAL', 'CASE FILE - ACTIVE', 'DATE 05, 28 // RECORDS & EVIDENCE CONTROL'],
    summary:
      "On the evening of December 20, 1968, at approximately 11:15 PM, high school students David Arthur Faraday and Betty Lou Jensen were picnicking at a well-known Lover's Lane turnout along Lake Herman Road. Their vehicle, a 1960 Rambler station wagon, was parked with both occupants inside.\nAn unidentified assailant approached the vehicle, forced the occupants to exit, and fired multiple rounds from a .22-caliber firearm. Betty Lou Jensen was shot repeatedly in the back while attempting to flee and died at the scene. David Faraday was fatally shot in the right temple and succumbed to his injuries at the scene. The attacker then fled.",
    victimProfiles: [
      'DAVID ARTHUR FARADAY Atnhant (Age 17). Status: DECEASED (Shot once in the head at point-blank range). Junior student at Vallejo High School.',
    ],
    ballisticsAndPhysicalEvidence: [
      'Multiple .22 caliber shell casings, identified as Winchester Western Super-X brand, were recovered at the scene and are believed to match the weapon used. A significant number of casings (10 total) suggest a semiautomatic firearm. The vehicle\'s passenger window was shot out. Tire tracks from a different vehicle were noted near the turnout.',
    ],
    caseStatus:
      'STATUS: UNREVISED / UNSOLVED. The double homicide remains an active and open case under the jurisdiction of the Solano County Sheriff\'s Department and Benicia Police, attributed to the subject known as subjectnown as "The Zodiac Killer". All potential leads are current-ly exhausted. Further cross-referencing with other case data and potential cipher communications is ongoing.',
    investigatorSignature: {
      signatureText: 'SGT. R. HALSTEAD',
      leadTitle: 'SGT. R. HALSTEAD, LEAD INVESTIGATOR',
      signedDate: 'DATE 05, 28 // RECORDS & EVIDENCE CONTROL',
      isHandwritten: false,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'sol-1969-0704',
    documentNumber: 5,
    caseNumber: 'SOL-1969-0704',
    title: 'CASE OVERVIEW - MICHAEL V. MAGEAU',
    shortTitle: 'Doc 05: Michael V. Mageau',
    victimName: 'Michael V. Mageau & Darlene E. Ferrin',
    dateOfIncident: '04 JUL 1969',
    location: 'BLUE ROCK SPRINGS PARK, VALLEJO, CA',
    reportedBy: 'DEPUTY R. LANDS',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.44_PM_0541a9e0.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: 'SAN FRANCISCO POLICE DEPARTMENT • HOMICIDE DETAIL',
      subDept: 'BUREAU OF INSPECTORS / RECORDS & EVIDENCE CONTROL',
    },
    stamps: ['CONFIDENTIAL', 'CONFIDENTIAL', 'CASE FILE - ACTIVE'],
    summary:
      'On the night of July 4, 1969, at approximately 11:30 PM, on Blue Rock Springs Park, college students Michael V. Mageau and Darlene E. Ferrin were present in a remote turnout area. A suspect vehicle puled up ored them out. The suspect then fired multiple rounds from a 9mm semiautomatic handgun, fatally woundng Darlene Ferrin and severely injuring Michael Mageau. Extensive evidence collection is complete, maintaining realism.',
    victimProfiles: [
      'MICHAEL V. MAGEAU (Age 19). Status: SURVIVED (Severe gunshot wounds the new to the neck and face). Mageau was a resident of Vallejo, CA, and dean and vinecls that mageau vooms used atrincipees of the attacker and vehicle. Comprehensive medical recods are on file. He is a primary witness.',
    ],
    ballisticsAndPhysicalEvidence: [
      'Multiple pieces of key evidence are under analysis.',
      '1. BALLISTICS: The fatal shots are from a 9mm semiautomatic handgun. Multiple shell casings were recovered from the scene. Everinmendingt.',
      "2. PHYSICAL EVIDENCE: Michael Mageau's clothes were processed. Tire tracks from the suspect vehicle are documented.",
      '3. COMPOSITE: Based on Mageau\'s description, initial composite sketch parameters are being refined. Extensive scene preservation complete.',
    ],
    caseStatus:
      "STATUS: ACTIVE / UNSOLVED. The incident is classified as a double homicide. Initial investigation focused on potential local loctal suspects, but letter communication received by news outlets has subsequently linked this killing to the multi-jurisdiction serial killer investigation known as 'The Zodiac Killer. Extensive evidence processing is complete, and cross-referencing with other potential 'Cipher' communications is ongoing. Leads are currently exhausted. DO NOT DUPLICATE.",
    investigatorSignature: {
      signatureText: 'Lands',
      leadTitle: 'DEPUTY R. LANDS, LEAD INVESTIGATOR',
      isHandwritten: true,
    },
    footerNotice: 'DO NOT DUPLICATE',
  },
  {
    id: 'sfpd-password-sheet-1969',
    documentNumber: 6,
    caseNumber: '69-1127',
    title: 'INTERNAL ACCESS LOG // DOCUMENT RECOVERY - PASSWORD SHEET',
    shortTitle: 'Doc 06: Password Sheet',
    victimName: 'Zodiac Killer - Case Files Access',
    dateOfIncident: '11/11/1969',
    location: 'Forensic Imaging Laboratory, San Francisco, CA',
    reportedBy: 'PHOTOGRAPHER: J. R. CALDWELL',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-30_at_14.58.37_8ef418ca.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: "CITY AND COUNTY OF SAN FRANCISCO • SHERIFF'S DEPARTMENT",
      subDept: 'INVESTIGATION DIVISION • 850 BRYANT STREET, SAN FRANCISCO, CA 94103',
      addressLines: ['CASE NO.: 69-1127', 'FILE NO.: 69-0549', 'DATE FILED: 11/11/1969'],
    },
    stamps: ['CONFIDENTIAL // EVIDENCE ONLY'],
    summary:
      'Archived department credential worksheet for Zodiac Killer case files access. Acquired 11/12/1969 by Forensic Imaging Laboratory. Lists internal section passwords and attached investigator reminders.',
    victimProfiles: [
      'SUBJECT: Zodiac Killer - Case Files Access',
      'ORIGIN: Forensic Imaging Laboratory // PHOTOGRAPHER: J. R. Caldwell (Date Acquired: 11/12/1969)',
    ],
    ballisticsAndPhysicalEvidence: [
      'ACCESS LOG & SECTION PASSWORDS:',
      '• Map: [Redacted]',
      '• Archive: 17046849',
      '• Audio Evidence: 1908',
      '• Witness Files: [Redacted]',
      '• Suspect Database: [Redacted]',
      '• Cipher Terminal: SEVENMARKS',
      '• Restricted Dossier: [Redacted]',
      'ATTACHED FIELD NOTES & REMINDERS:',
      '• Map: The password is a house number.',
      '• Suspect Database: Use the same password as the previous website.',
      '• Operating Directive: Keep this sheet with archived files. Report discrepancies immediately.',
    ],
    caseStatus:
      'STATUS: CONFIDENTIAL / INTERNAL RECORD. Department recovery access sheet catalogued in forensic repository. Do not share passwords with unauthorized personnel.',
    investigatorSignature: {
      signatureText: 'J. R. Caldwell',
      leadTitle: 'J. R. CALDWELL, FORENSIC IMAGING LABORATORY',
      signedDate: '11/12/1969',
      isHandwritten: true,
    },
    footerNotice: 'DO NOT REMOVE FROM FILE',
  },
];

export const ARCHIVAL_FACSIMILE_DOCUMENTS: CaseDocumentItem[] = [
  {
    id: 'arch-plate-01',
    documentNumber: 1,
    caseNumber: 'ARCH-SFPD-1011',
    title: 'ARCHIVAL NEGATIVE // PLATE 01: PRESIDIO HEIGHTS TAXI SCENE & TORN SHIRT',
    shortTitle: 'Plate 01: Presidio Heights Specimen Negative',
    victimName: 'Presidio Heights 16mm Crime Scene Facsimile (Paul Stine)',
    dateOfIncident: '11 OCT 1969 / ARCHIVED 12 OCT 1969',
    location: 'WASHINGTON & CHERRY STS, PRESIDIO HEIGHTS, SF',
    reportedBy: 'FORENSIC IMAGING LABORATORY // NEGATIVE # 1127-69',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM__2__20ef5232.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: 'CITY AND COUNTY OF SAN FRANCISCO • FORENSIC PHOTOGRAPHIC DIVISION',
      subDept: 'CRIME SCENE FACSIMILE ARCHIVE // 850 BRYANT STREET',
      addressLines: ['PLATE NO.: ARCH-01', 'NEGATIVE ID: 1127-69', 'EXPOSURE: OPTICAL 16MM'],
    },
    stamps: ['AUTHENTIC ARCHIVAL FACSIMILE', 'EVIDENCE DIVISION', 'DO NOT DUPLICATE'],
    summary:
      'Archival 16mm optical negative print recovered from SFPD Homicide files. Documents taxi cab interior, close-range entry impact marks, and the catalogued missing swatch from victim Paul Lee Stine\'s bloodied shirt tail subsequently received by the San Francisco Chronicle.',
    victimProfiles: [
      'SPECIMEN RECORD: Paul Lee Stine (Deceased). 16mm optical camera negative registered under master chain-of-custody archive.',
    ],
    ballisticsAndPhysicalEvidence: [
      '1. 16mm forensic negative plate showing vehicle cab angle at Washington and Cherry Streets.',
      '2. Physical swatch margins recorded against Department evidence grid.',
      '3. Comparison negative cross-indexed with suspect sketch composite.',
    ],
    caseStatus:
      'STATUS: ARCHIVAL HOLD. Negative plate deposited in County Archives Sub-Basement Bay 17. Digitally scanned and declassified for Case TLS-0017 review.',
    investigatorSignature: {
      signatureText: 'J. R. Caldwell',
      leadTitle: 'J. R. CALDWELL, FORENSIC IMAGING LABORATORY',
      signedDate: '10/12/1969',
      isHandwritten: true,
    },
    footerNotice: 'AUTHENTIC ARCHIVAL PLATE — CONFIDENTIAL FORENSIC PROPERTY',
  },
  {
    id: 'arch-plate-02',
    documentNumber: 2,
    caseNumber: 'ARCH-SOL-1220-DRAFT',
    title: 'ARCHIVAL TELETYPE // PLATE 02: SOLANO UNREVISED DRAFT TRANSMISSION (CORRUPTED)',
    shortTitle: 'Plate 02: Solano Unrevised Teletype Draft',
    victimName: 'Lake Herman Road Turnout Collision Record (Faraday & Jensen)',
    dateOfIncident: '20 DEC 1968 / TELETYPE LOG 21:10',
    location: "Lake Herman Road Lover's Lane Turnout, Benicia",
    reportedBy: 'SOLANO SHERIFF TELETYPE UNIT // DRAFT DISPATCH',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM__1__dc8203ea.jpeg',
    isDraftOrCorrupted: true,
    agencyHeader: {
      dept: 'STATE OF CALIFORNIA DEPARTMENT OF JUSTICE',
      subDept: 'SOLANO TELETYPE ARCHIVES // RAW TELETYPE REEL',
      addressLines: ['REEL: TE-68-12', 'CIRCUIT: SFO-BENICIA-DIRECT', 'FLAG: CORRUPTED TRANSMISSION'],
    },
    stamps: ['CONFIDENTIAL', 'TELETYPE GLITCH RECORD', 'RECORDS & EVIDENCE CONTROL'],
    summary:
      'Original physical teletype dispatch ribbon showing character jitter and syntax collisions from the initial 1968 teletype line. Words and sentence fragments exhibit garbled optical tracking preserved verbatim for comparison with the finalized standard dossier.',
    victimProfiles: [
      'PRIMARY EVIDENCE RECORD: Lake Herman Road double homicide initial wire transmission with uncorrected mechanical collisions.',
    ],
    ballisticsAndPhysicalEvidence: [
      '1. Typewriter ribbon striking anomalies preserved on yellowed teleprinter paper.',
      '2. Missing word gaps coinciding with signal pulse drops on the Solano circuit.',
      '3. Comparison markings noting divergence from the formal Department summary (Plate 04).',
    ],
    caseStatus:
      'STATUS: UNREVISED HISTORIC WIRE. Catalogued as corrupted early field draft. Preserved to verify teletype alteration claims.',
    investigatorSignature: {
      signatureText: 'Sgt. R. Halstead',
      leadTitle: 'SGT. R. HALSTEAD, SOLANO COMMUNICATIONS',
      signedDate: '12/21/1968',
      isHandwritten: false,
    },
    footerNotice: 'UNREVISED TELETYPE SPECIMEN — DO NOT REVISE OR DESTROY',
  },
  {
    id: 'arch-plate-03',
    documentNumber: 3,
    caseNumber: 'ARCH-NAP-0927',
    title: 'ARCHIVAL NEGATIVE // PLATE 03: LAKE BERRYESSA SHORELINE & VEHICLE DOOR GRAFFITI',
    shortTitle: 'Plate 03: Lake Berryessa Shoreline Facsimile',
    victimName: 'Twin Oak Ridge Crime Scene Negative (Shepard & Hartnell)',
    dateOfIncident: '27 SEP 1969 / ARCHIVED 28 SEP 1969',
    location: 'TWIN OAK RIDGE, LAKE BERRYESSA, NAPA COUNTY, CA',
    reportedBy: 'NAPA COUNTY SHERIFF INVESTIGATION UNIT',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.46_PM_82bcbfb0.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: "NAPA COUNTY SHERIFF'S OFFICE • INVESTIGATION DIVISION",
      subDept: 'PHYSICAL EVIDENCE & FORENSIC PHOTOGRAPHIC UNIT',
      addressLines: ['CASE: NAP-1969-0927', 'NEGATIVE FILE: 1026-69', 'LOCATION: LAKE BERRYESSA'],
    },
    stamps: ['ARCHIVAL NEGATIVE SPECIMEN', 'CASE FILE - ACTIVE', 'DO NOT DUPLICATE'],
    summary:
      'Archival photographic negative from Lake Berryessa. Details the lakeside path, mud footprints matching Wing Walker boot size 10.5, and photographic documentation of the black felt-tip pen inscriptions left on the driver door of Bryan Hartnell\'s Karmann Ghia.',
    victimProfiles: [
      'FIELD SPECIMEN: Cecelia Shepard and Bryan Calvin Hartnell crime scene photographic plate.',
    ],
    ballisticsAndPhysicalEvidence: [
      '1. Photographic record of car door inscription: "Vallejo 12-20-68 / 7-4-69 / Sept 27-69 - 6:30 - by knife" and crosshair glyph.',
      '2. Negative telemetry documenting shoreline soil impression depth.',
      '3. Clothesline ligature photographs catalogued in evidence repository.',
    ],
    caseStatus:
      'STATUS: ARCHIVAL HOLD. Deposited in Napa County Evidence Repository. Reproduced under official investigation protocol.',
    investigatorSignature: {
      signatureText: '_R. Lands_',
      leadTitle: 'DEPUTY R. LANDS, LEAD INVESTIGATOR',
      signedDate: '09/28/1969',
      isHandwritten: true,
    },
    footerNotice: 'OFFICIAL EVIDENCE NEGATIVE // STRICT CHAIN OF CUSTODY',
  },
  {
    id: 'arch-plate-04',
    documentNumber: 4,
    caseNumber: 'ARCH-SOL-1220-STD',
    title: 'ARCHIVAL RECORD // PLATE 04: SOLANO SHERIFF MASTER CASE DOSSIER (STANDARD)',
    shortTitle: 'Plate 04: Solano Clean Master Dossier',
    victimName: 'David Arthur Faraday & Betty Lou Jensen Official Master Record',
    dateOfIncident: '20 DEC 1968 / CATALOGUED 28 MAY 1969',
    location: "Lake Herman Road Lover's Lane Turnout, Benicia",
    reportedBy: 'SGT. R. HALSTEAD, LEAD INVESTIGATOR',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.45_PM_569a111e.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: 'CALIFORNIA DEPARTMENT OF JUSTICE • SOLANO DIVISION',
      subDept: 'RECORDS & EVIDENCE CONTROL MASTER ARCHIVE',
      addressLines: ['CASE NO.: SOL-1968-1220', 'CLASSIFICATION: HOMICIDE MASTER', 'STATUS: UNREVISED'],
    },
    stamps: ['TOP SECRET', 'CONFIDENTIAL', 'CASE FILE - ACTIVE', 'RECORDS & EVIDENCE CONTROL'],
    summary:
      'Standard finalized official overview docket concerning the December 20, 1968 Lake Herman Road murders. Conforms to formal departmental recording standards with verified ballistics telemetry (10 total Winchester Western Super-X casings).',
    victimProfiles: [
      'OFFICIAL RECORD: David Arthur Faraday (Age 17) & Betty Lou Jensen (Age 16). Full master documentation.',
    ],
    ballisticsAndPhysicalEvidence: [
      '1. Official ballistics certification for .22 caliber semiautomatic firearm discharge.',
      '2. Rambler station wagon passenger window trajectory analysis.',
      '3. Turnout roadway tire impression measurements.',
    ],
    caseStatus:
      'STATUS: ACTIVE UNSOLVED MASTER. Held under permanent historical archival custody.',
    investigatorSignature: {
      signatureText: 'SGT. R. HALSTEAD',
      leadTitle: 'SGT. R. HALSTEAD, LEAD INVESTIGATOR',
      signedDate: '05/28/1969',
      isHandwritten: false,
    },
    footerNotice: 'CANONICAL MASTER ARCHIVE — PRESERVED FOR JURISDICTIONAL REVIEW',
  },
  {
    id: 'arch-plate-05',
    documentNumber: 5,
    caseNumber: 'ARCH-SOL-0704',
    title: 'ARCHIVAL NEGATIVE // PLATE 05: BLUE ROCK SPRINGS TURNOUT & VEHICLE NEGATIVE',
    shortTitle: 'Plate 05: Blue Rock Springs Negative',
    victimName: 'Blue Rock Springs Park Crime Scene Negative (Mageau & Ferrin)',
    dateOfIncident: '04 JUL 1969 / ARCHIVED 06 JUL 1969',
    location: 'BLUE ROCK SPRINGS PARK, VALLEJO, CA',
    reportedBy: 'FORENSIC IMAGING LABORATORY // NEGATIVE # 69-0715',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-29_at_7.00.44_PM_0541a9e0.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: "SOLANO COUNTY SHERIFF'S DEPARTMENT • INVESTIGATION DIVISION",
      subDept: 'BUREAU OF INSPECTORS / FORENSIC PHOTOGRAPHIC LAB',
      addressLines: ['CASE NO.: 69-0715', 'FILE NO.: 69-0932', 'SCENE: BLUE ROCK SPRINGS PARK'],
    },
    stamps: ['CONFIDENTIAL', 'CASE FILE - ACTIVE', 'DO NOT DUPLICATE'],
    summary:
      'Archival photographic negative documenting the remote parking area turnout at Blue Rock Springs Park. Records vehicle positioning, ballistic shell distribution on asphalt, and trajectory angles from the 9mm semiautomatic weapon discharge.',
    victimProfiles: [
      'FIELD EVIDENCE NEGATIVE: Michael V. Mageau (Survived) & Darlene E. Ferrin (Deceased).',
    ],
    ballisticsAndPhysicalEvidence: [
      '1. 9mm shell casing distribution plate.',
      '2. Vehicle exterior impact angle documentation.',
      '3. Parking lot access trajectory negative.',
    ],
    caseStatus:
      'STATUS: ARCHIVAL HOLD. Negative preserved under Solano County forensic chain-of-custody.',
    investigatorSignature: {
      signatureText: 'Lands',
      leadTitle: 'DEPUTY R. LANDS, LEAD INVESTIGATOR',
      signedDate: '07/06/1969',
      isHandwritten: true,
    },
    footerNotice: 'FORENSIC PHOTOGRAPHIC SPECIMEN — RESTRICTED ACCESS',
  },
  {
    id: 'arch-plate-06',
    documentNumber: 6,
    caseNumber: 'ARCH-SFPD-69-1127',
    title: 'ARCHIVAL ARTIFACT // PLATE 06: FORENSIC LAB ACCESS LOG & PASSWORD SHEET',
    shortTitle: 'Plate 06: Lab Access Worksheet Artifact',
    victimName: 'Zodiac Investigation Division Access Sheet Physical Artifact',
    dateOfIncident: '11/11/1969 / ARCHIVED 12/11/1969',
    location: 'Forensic Imaging Laboratory, 850 Bryant St, SF',
    reportedBy: 'PHOTOGRAPHER: J. R. CALDWELL',
    imagePath: '/assets/aistudio/WhatsApp_Image_2026-10-30_at_14.58.37_8ef418ca.jpeg',
    isDraftOrCorrupted: false,
    agencyHeader: {
      dept: "CITY AND COUNTY OF SAN FRANCISCO • SHERIFF'S DEPARTMENT",
      subDept: 'INVESTIGATION DIVISION • FORENSIC IMAGING LABORATORY',
      addressLines: ['CASE NO.: 69-1127', 'FILE NO.: 69-0549', 'CLASSIFICATION: CREDENTIALS LOG'],
    },
    stamps: ['CONFIDENTIAL // EVIDENCE ONLY', 'DO NOT REMOVE FROM FILE'],
    summary:
      'High-resolution archival scan of the original department credential worksheet. Documents internal passwords for Map, Archive, Audio, Terminal, and restricted dossier access alongside handwritten investigator field reminders.',
    victimProfiles: [
      'PHYSICAL RECOVERY SPECIMEN: Department credential sheet recovered from Forensic Imaging Laboratory filing cabinets.',
    ],
    ballisticsAndPhysicalEvidence: [
      '1. Typewritten section codes with original red ink masking.',
      '2. Handwritten field note: "Map: The password is a house number."',
      '3. Handwritten field note: "Suspect Database: Use the same password as the previous website."',
    ],
    caseStatus:
      'STATUS: CONFIDENTIAL RECOVERY LOG. Catalogued in digital investigation archive for investigator clearance orientation.',
    investigatorSignature: {
      signatureText: 'J. R. Caldwell',
      leadTitle: 'J. R. CALDWELL, FORENSIC IMAGING LABORATORY',
      signedDate: '11/12/1969',
      isHandwritten: true,
    },
    footerNotice: 'INTERNAL EVIDENCE RECOVERY SHEET — DO NOT DISTRIBUTE',
  },
];

/**
 * Helper to retrieve documents for a specific collection.
 */
export function getCaseDocuments(collection: 'directive' | 'archival'): CaseDocumentItem[] {
  return collection === 'archival' ? ARCHIVAL_FACSIMILE_DOCUMENTS : CLASSIFIED_CASE_DOCUMENTS;
}

/**
 * Retrieve document by ID across all collections.
 */
export function getCaseDocumentById(id: string): CaseDocumentItem | undefined {
  return (
    CLASSIFIED_CASE_DOCUMENTS.find((d) => d.id === id) ||
    ARCHIVAL_FACSIMILE_DOCUMENTS.find((d) => d.id === id)
  );
}


