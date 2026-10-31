/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DISTINCT ARCHIVAL DOCUMENT SHEETS FOR EVERY EVIDENCE FILE
 * 
 * Provides authentic, differentiated archival document presentations:
 * - Official police scene reports & chain-of-custody logs
 * - Bureau technical telecommunication teardowns
 * - Verbatim stenographer interrogation transcripts
 * - Engineering microwave relay surveys
 * - Multi-column broadsheet newspapers
 * - Confidential DOJ suspect dossiers
 * - Handwritten forensic researcher journals
 * 
 * Zero repetitive boilerplate. Distinct IDs, dates, issuing departments, and clues.
 */

import React from 'react';
import {
  AlertTriangle,
  Archive,
  Compass,
  FileCheck,
  FileText,
  HelpCircle,
  MapPin,
  Newspaper,
  Radio,
  Shield,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import type { EvidenceItem } from '@/src/lib/mockData';
import { CASE_ID } from '@/src/lib/mockData';

// ---------------------------------------------------------------------------
// 1. EV-0101: SFPD SCENE INVESTIGATION REPORT (DOC-SFPD-74-091)
// ---------------------------------------------------------------------------
export function SceneOverviewDoc({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-12 relative text-ink font-mono text-xs leading-relaxed">
      {/* Header Stamp */}
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
            SAN FRANCISCO POLICE DEPARTMENT — CENTRAL PATROL DIVISION
          </p>
          <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
            Initial Crime Scene Investigation Log
          </h2>
          <p className="text-[10px] text-ink/60 mt-0.5">
            DOC REF: DOC-SFPD-74-091 // SUB-DISTRICT: PRESIDIO BORDER
          </p>
        </div>
        <div className="text-right">
          <span className="stamp text-crimson border-crimson text-xs">EVIDENCE SECURED</span>
          <p className="text-[10px] text-ink/70 mt-1 uppercase font-bold">CASE: {CASE_ID}</p>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5 py-3 border-y border-ink/30 text-[11px] bg-black/5">
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">DATE OF DISCOVERY</span>
          <strong>19 OCT 1974 · 23:14 HRS</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">OFFICERS LOGGING</span>
          <strong>PTL. J. CALDWELL / K. ARMSTRONG</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">SECTOR PRECINCT</span>
          <strong>PRESIDIO REACH · COBBLESTONE REAR ALLEY</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">CHAIN OF CUSTODY</span>
          <strong className="text-emerald-800">VAULT LOCKER 01-A</strong>
        </div>
      </div>

      {/* Narrative */}
      <div className="space-y-4 text-xs font-mono">
        <p className="font-bold text-ink uppercase tracking-wider text-[11px]">
          OFFICER FIELD OBSERVATIONS &amp; PHYSICAL MEASUREMENTS:
        </p>
        <p>
          1. While conducting scheduled motorized perimeter sweeps along the Presidio residential interface, units responded to reported electrical hum and static interference affecting municipal receivers.
        </p>
        <p>
          2. Upon turning into the rear cobblestone service alley between Washington and Jackson, officers observed a portable radio receiver (catalogued as <strong>EV-0102</strong>) lying face-down on rain-slicked stones. Battery indicator lamp was intermittently flickering red.
        </p>
        <p>
          3. Fresh parallel tire impressions (gauge 57 inches) were measured in the soft loam shoulder, consistent with a rapid departure toward the Presidio park boulevard without headlights.
        </p>
        <p>
          4. Yellow barrier cordon was established at a radius of 45 yards. No shell casings or biological stains were detected in the immediate alleyway, indicating the equipment was dropped or deposited intentionally rather than discarded during a physical struggle.
        </p>
      </div>

      {/* Handwritten Investigator Annotation */}
      <div className="mt-6 pt-3 border-t border-ink/30 relative">
        <p className="font-['Caveat'] text-2xl text-[#1e3a8a] rotate-[-1deg]">
          The radio dial was jammed on a frequency not used by local emergency services. Why here?
        </p>
      </div>

      {/* Document Footer */}
      <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/60 uppercase">
        <span>SFPD FORM 104-B (REV. 1973)</span>
        <span>EXAMINER SIGNATURE: <em>J. Caldwell #419</em></span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. EV-0102: TECHNICAL COMMUNICATIONS LAB TEARDOWN (DOC-BCI-74-102)
// ---------------------------------------------------------------------------
export function RadioReceiverDoc({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-12 relative text-ink font-mono text-xs leading-relaxed">
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
            CALIFORNIA BUREAU OF CRIMINAL IDENTIFICATION — ELECTRONICS DIVISION
          </p>
          <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
            Technical Laboratory Teardown &amp; Frequency Analysis
          </h2>
          <p className="text-[10px] text-ink/60 mt-0.5">
            LAB DOSSIER: DOC-BCI-74-102 // SPECIMEN EV-0102
          </p>
        </div>
        <span className="stamp text-crimson border-crimson text-xs">TECHNICAL EXAM</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5 py-3 border-y border-ink/30 text-[11px] bg-black/5">
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">EXAMINER</span>
          <strong>DR. HORACE VANCE, BCI</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">HARDWARE MODEL</span>
          <strong>ZENITH TRANS-OCEANIC MODIFIED</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">INTERNAL SERIAL</span>
          <strong>BC-8921-A (PARTIAL CHASSIS)</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">TUNING MECHANISM</span>
          <strong className="text-crimson">SOLDER-FIXED / OFF-BAND</strong>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        <p className="font-bold text-ink uppercase tracking-wider text-[11px]">
          INTERNAL MODIFICATION FINDINGS:
        </p>
        <p>
          1. <strong>Chassis Inspection:</strong> External bakelite casing exhibits impact scuffing along the lower right quadrant. The original telescoping antenna was unscrewed and replaced with a soldered copper pigtail lead, engineered to receive directional signals.
        </p>
        <p>
          2. <strong>Frequency Crystal:</strong> The standard civilian IF oscillator crystal was desoldered. In its place, a custom quartz oscillator stamped <em>162.55 MHz</em> was installed. This channel sits squarely within federal meteorological and naval relay bands.
        </p>
        <p>
          3. <strong>Mechanical Locking:</strong> The primary rotary tuning dial was locked with lead solder from behind the front bezel plate, preventing channel adjustment.
        </p>
        <div className="p-3 bg-black/5 border-l-2 border-crimson text-[11px] space-y-1">
          <strong className="text-crimson block uppercase">ANALYST COMMENT:</strong>
          The receiver was tuned specifically to capture transmissions beamed from an elevated line-of-sight location across the Bay, pointing toward the Presidio corridor.
        </div>
      </div>

      <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/60 uppercase">
        <span>STATE BCI FORENSIC LABS // SACRAMENTO</span>
        <span>PAGE 01 OF 01 // REPORT CERTIFIED</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 3. STAGE 2: FORENSIC EVIDENCE PHOTOGRAPH NEGATIVES (EV-0201 to EV-0204)
// ---------------------------------------------------------------------------
export interface PlateData {
  id: string;
  plateLabel: string;
  evidenceNo: string;
  image: string;
  dept: string;
  address: string;
  caseNo: string;
  fileNo: string;
  dateFiled: string;
  subject: string;
  docRef: string;
  locationHeader: string;
  dateAcquired: string;
  photographer: string;
  photoDetails: string;
  county: string;
  locationName: string;
  coordinates: string;
  remarks: string;
  signatureDate: string;
}

export const STAGE2_PLATES: PlateData[] = [
  {
    id: 'EV-0201',
    plateLabel: 'Plate 1: Lake Herman Rd',
    evidenceNo: '# 74-17',
    image: '/assets/aistudio/WhatsApp_Image_2026-10-30_at_14.44.03_3e3a9c61.jpeg',
    dept: "SOLANO COUNTY SHERIFF'S DEPARTMENT // INVESTIGATION DIVISION",
    address: '501 UNION AVENUE, FAIRFIELD, CA 94533',
    caseNo: '68-1207',
    fileNo: '68-1187',
    dateFiled: '12/27/1968',
    subject: 'Photographic Negative - Telemetry & Metadata Stamp',
    docRef: 'DOC-NEG-74-17 // LOCATION: COUNTY ARCHIVES SUB-BASEMENT BAY 17',
    locationHeader: 'COUNTY ARCHIVES SUB-BASEMENT BAY 17',
    dateAcquired: '12/20/1968',
    photographer: 'J. R. Caldwell',
    photoDetails:
      'Image extracted from photographic negative. Appears to show a rural road or access path with vehicle in the background. Location and exact time of capture are unknown. Subject possibly related to ongoing investigation. No identifiable individuals visible.',
    county: 'Solano County',
    locationName: 'Lake Herman Road, Benicia, CA',
    coordinates: '38.094892° N, 122.143956° W',
    remarks: 'Possible connection to subject? Review with case files from 12/20/68 - 10/11/69.',
    signatureDate: '12/27/1968',
  },
  {
    id: 'EV-0202',
    plateLabel: 'Plate 2: Blue Rock Springs',
    evidenceNo: '# 69-0715',
    image: '/assets/aistudio/WhatsApp_Image_2026-10-30_at_14.44.33_edb54738.jpeg',
    dept: "SOLANO COUNTY SHERIFF'S DEPARTMENT // INVESTIGATION DIVISION",
    address: '501 UNION AVENUE, FAIRFIELD, CA 94533',
    caseNo: '69-0715',
    fileNo: '69-0932',
    dateFiled: '07/06/1969',
    subject: 'Photographic Negative - Crime Scene & Surroundings',
    docRef: 'DOC-NEG-69-0715 // LOCATION: BLUE ROCK SPRINGS PARK VALLEJO, CA',
    locationHeader: 'BLUE ROCK SPRINGS PARK VALLEJO, CA',
    dateAcquired: '07/06/1969',
    photographer: 'J. R. Caldwell',
    photoDetails:
      'Image extracted from photographic negative. Appears to show the entrance area of Blue Rock Springs Park, with a vehicle in the background. Location and exact time of capture are unknown. Subject possibly related to ongoing investigation. No identifiable individuals visible.',
    county: 'Solano County',
    locationName: 'Blue Rock Springs Park, Vallejo, CA',
    coordinates: '38.125989° N, 122.191094° W',
    remarks: 'Possible connection to subject? Review with case files from 07/04-07/05/1969.',
    signatureDate: '07/06/1969',
  },
  {
    id: 'EV-0203',
    plateLabel: 'Plate 3: Lake Berryessa',
    evidenceNo: '# 1026-69',
    image: '/assets/aistudio/WhatsApp_Image_2026-10-30_at_14.44.15_2080eb42.jpeg',
    dept: "NAPA COUNTY SHERIFF'S DEPARTMENT // INVESTIGATION DIVISION",
    address: '935 DEAN STREET, NAPA, CA 94558',
    caseNo: '69-1026',
    fileNo: '69-0457',
    dateFiled: '10/01/1969',
    subject: 'Photographic Negative - Crime Scene & Surroundings',
    docRef: 'DOC-NEG-69-1026 // LOCATION: LAKE BERRYESSA, NAPA COUNTY, CA',
    locationHeader: 'LAKE BERRYESSA, NAPA COUNTY, CA',
    dateAcquired: '09/28/1969',
    photographer: 'J. R. Caldwell',
    photoDetails:
      'Image extracted from photographic negative. Appears to show the lakeside area at Lake Berryessa, with shoreline and surrounding hills in the background. Location and exact time of capture are unknown. Subject possibly related to ongoing investigation. No identifiable individuals visible.',
    county: 'Napa County',
    locationName: 'Lake Berryessa, Napa County',
    coordinates: '38.563414° N, 122.231786° W',
    remarks: 'Possible connection to subject? Review with case files from 09/27-09/28/1969.',
    signatureDate: '10/01/1969',
  },
  {
    id: 'EV-0204',
    plateLabel: 'Plate 4: Presidio Heights',
    evidenceNo: '# 1127-69',
    image: '/assets/aistudio/WhatsApp_Image_2026-10-30_at_14.44.24_6a138436.jpeg',
    dept: "CITY AND COUNTY OF SAN FRANCISCO SHERIFF'S DEPARTMENT // INVESTIGATION DIVISION",
    address: '850 BRYANT STREET, SAN FRANCISCO, CA 94103',
    caseNo: '69-1127',
    fileNo: '69-0549',
    dateFiled: '11/11/1969',
    subject: 'Photographic Negative - Crime Scene & Surroundings',
    docRef: 'DOC-NEG-69-1127 // LOCATION: PRESIDIO HEIGHTS, SAN FRANCISCO, CA',
    locationHeader: 'PRESIDIO HEIGHTS, SAN FRANCISCO, CA',
    dateAcquired: '11/12/1969',
    photographer: 'J. R. Caldwell',
    photoDetails:
      'Image extracted from photographic negative. Shows the area of Presidio Heights, with Washington and Cherry Streets in the background. Vehicle believed to be the taxi driven by Paul Stine is visible in the foreground. Location and exact time of capture are unknown. Subject possibly related to ongoing investigation. No identifiable individuals visible.',
    county: 'San Francisco County',
    locationName: 'Presidio Heights, San Francisco, CA',
    coordinates: '(CG.GHHGD, -LB.DEG I)',
    remarks: 'Possible connection to subject? Review with case files from 10/11/1969.',
    signatureDate: '11/12/1969',
  },
];

export function ForensicNegativeDoc({
  item,
  activePlateIndex,
  onPlateChange,
}: {
  item: EvidenceItem;
  activePlateIndex?: number;
  onPlateChange?: (idx: number) => void;
}) {
  const [internalPlateIdx, setInternalPlateIdx] = React.useState(0);
  const currentPlateIdx = activePlateIndex !== undefined ? activePlateIndex : internalPlateIdx;
  const currentPlate = STAGE2_PLATES[currentPlateIdx] || STAGE2_PLATES[0];

  const [showOriginalScan, setShowOriginalScan] = React.useState(false);
  const [scanZoom, setScanZoom] = React.useState(1);

  const handleSelectPlate = (idx: number) => {
    setInternalPlateIdx(idx);
    if (onPlateChange) {
      onPlateChange(idx);
    }
  };

  return (
    <div className="paper-sheet p-6 sm:p-10 md:p-12 relative text-ink font-mono text-xs leading-relaxed space-y-6">
      {/* Dossier Header */}
      <div className="border-b-2 border-ink pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-crimson">
              CLASSIFIED DOSSIER // STAGE 02 FORENSICS
            </span>
            <span className="text-[9px] bg-ink/10 px-2 py-0.5 font-bold uppercase">
              4 Plates Contained
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-1">
            Archival Photographic Negative Dossier
          </h2>
          <p className="text-[10px] text-ink/70 mt-0.5">
            DOCKET: DOC-NEG-DOSSIER-17 // ALL FOUR CRIME SCENE PERIMETERS
          </p>
        </div>
        <div className="text-right">
          <span className="stamp text-crimson border-crimson text-xs">EVIDENCE 4-IN-1</span>
          <p className="text-[10px] text-ink/60 mt-1 uppercase font-bold">CASE {CASE_ID}</p>
        </div>
      </div>

      {/* Multi-Photo Selector Tabs */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider font-bold text-ink/70 flex items-center justify-between">
          <span>SELECT PHOTOGRAPHIC PLATE TO INSPECT (1 OF 4):</span>
          <span className="text-crimson font-mono font-semibold">{currentPlate.evidenceNo}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STAGE2_PLATES.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPlate(idx)}
              className={`p-2 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                currentPlateIdx === idx
                  ? 'border-crimson bg-[#ede3d1] font-bold shadow-sm'
                  : 'border-ink/20 bg-white/40 hover:bg-white/70 text-ink/80'
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-ink">PLATE 0{idx + 1}</span>
                <span className="font-mono text-[9px] text-crimson">{p.evidenceNo}</span>
              </div>
              <span className="text-[11px] truncate mt-1 text-ink/90 font-serif">
                {p.locationName.split(',')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase text-ink">
            INSPECTING: {currentPlate.plateLabel}
          </span>
          <span className="text-[10px] text-ink/60">({currentPlate.county})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowOriginalScan(false);
              setScanZoom(1);
            }}
            className={`px-3 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
              !showOriginalScan
                ? 'bg-ink text-paper border-ink'
                : 'bg-white/50 text-ink/70 border-ink/30 hover:text-ink'
            }`}
          >
            Transcription Docket
          </button>
          <button
            type="button"
            onClick={() => setShowOriginalScan(true)}
            className={`px-3 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
              showOriginalScan
                ? 'bg-ink text-paper border-ink'
                : 'bg-white/50 text-ink/70 border-ink/30 hover:text-ink'
            }`}
          >
            Original Photographic Scan
          </button>
        </div>
      </div>

      {showOriginalScan ? (
        /* Original High-Resolution Facsimile Scan View */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-black/5 p-2 border border-ink/30 text-[11px]">
            <span className="font-bold">FACSIMILE PLATE: {currentPlate.evidenceNo} — {currentPlate.locationName}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScanZoom((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
                className="px-2 py-0.5 bg-white border border-ink/30 text-ink font-bold hover:bg-ink/10 cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <span className="w-12 text-center font-mono">{Math.round(scanZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setScanZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
                className="px-2 py-0.5 bg-white border border-ink/30 text-ink font-bold hover:bg-ink/10 cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setScanZoom(1)}
                className="px-2 py-0.5 bg-white border border-ink/30 text-ink font-bold hover:bg-ink/10 text-[10px] cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="border-2 border-ink/40 p-2 bg-[#121210] overflow-auto max-h-[70vh] flex items-center justify-center shadow-inner">
            <img
              src={currentPlate.image}
              alt={currentPlate.plateLabel}
              style={{ transform: `scale(${scanZoom})`, transformOrigin: 'top center' }}
              className="transition-transform duration-150 max-w-full h-auto object-contain shadow-2xl"
            />
          </div>
          <p className="text-[10px] text-ink/60 text-center m-0 italic">
            Plate 0{currentPlateIdx + 1} of 4: Optical archival negative preserved under chain-of-custody protocols. Stamped marginal telemetry intact.
          </p>
        </div>
      ) : (
        /* Declassified Formal Document Transcription */
        <div className="space-y-5">
          {/* Header */}
          <div className="border-b-2 border-ink pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/80">{currentPlate.dept}</p>
              <p className="text-[9px] text-ink/60">{currentPlate.address}</p>
              <h2 className="font-serif text-2xl font-bold text-ink mt-2">
                EVIDENCE PHOTOGRAPH // {currentPlate.evidenceNo}
              </h2>
            </div>
            <div className="text-[10px] font-mono sm:text-right border sm:border-0 border-ink/20 p-2 sm:p-0 bg-white/30 sm:bg-transparent">
              <div>CASE NO.: <span className="font-bold">{currentPlate.caseNo}</span></div>
              <div>FILE NO.: <span className="font-bold">{currentPlate.fileNo}</span></div>
              <div>DATE FILED: <span className="font-bold">{currentPlate.dateFiled}</span></div>
            </div>
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-black/5 border border-ink/20 text-[11px]">
            <div><span className="text-ink/60 uppercase">SUBJECT:</span> <strong>{currentPlate.subject}</strong></div>
            <div><span className="text-ink/60 uppercase">ORIGIN:</span> <strong>Forensic Imaging Laboratory</strong></div>
            <div className="sm:col-span-2"><span className="text-ink/60 uppercase">REFERENCE:</span> {currentPlate.docRef}</div>
            <div><span className="text-ink/60 uppercase">DATE ACQUIRED:</span> <strong>{currentPlate.dateAcquired}</strong></div>
            <div><span className="text-ink/60 uppercase">PHOTOGRAPHER:</span> <strong>{currentPlate.photographer}</strong></div>
          </div>

          {/* Photo Frame */}
          <div className="border border-ink/40 p-2 bg-black/90 shadow-inner flex flex-col items-center">
            <div className="aspect-[4/3] w-full max-w-lg overflow-hidden bg-black relative flex items-center justify-center">
              <img
                src={currentPlate.image}
                alt={currentPlate.plateLabel}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-full max-w-lg text-[10px] text-[#9ca3af] flex justify-between pt-1.5 font-mono">
              <span>NEGATIVE TELEMETRY EXIF: {currentPlate.evidenceNo}</span>
              <span>FORENSIC SCAN: 4000 DPI</span>
            </div>
          </div>

          {/* Photo Details & Coordinates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-ink/20 py-4">
            <div className="space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px] block border-b border-ink/20 pb-1">
                PHOTO DETAILS:
              </span>
              <p className="text-[11px] text-ink/80 leading-relaxed m-0">{currentPlate.photoDetails}</p>
            </div>
            <div className="space-y-1.5 bg-black/5 p-3 border border-ink/20">
              <span className="font-bold uppercase tracking-wider text-[11px] block border-b border-ink/20 pb-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-crimson" />
                <span>LOCATION &amp; COORDINATES:</span>
              </span>
              <div className="text-[11px] space-y-1 pt-1">
                <div><span className="text-ink/60 uppercase">County:</span> <strong>{currentPlate.county}</strong></div>
                <div><span className="text-ink/60 uppercase">Location:</span> <strong>{currentPlate.locationName}</strong></div>
                <div className="pt-1">
                  <span className="text-ink/60 uppercase block text-[9px]">Coordinates / Marginal Telemetry:</span>
                  <code className="text-xs font-bold text-ink bg-white/70 px-1.5 py-0.5 border border-ink/20 inline-block font-mono select-all">
                    {currentPlate.coordinates}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Evidence Stamp */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-1 text-[11px] text-ink/80 flex-1">
              <span className="font-bold uppercase tracking-wider text-[10px] block text-ink">NOTES:</span>
              <ul className="list-disc list-inside space-y-0.5 m-0 pl-1 text-[10px]">
                <li>Negative shows signs of age and degradation.</li>
                <li>Further enhancement may be required for analysis.</li>
                <li>Cross-reference with telemetry data and metadata logs.</li>
                <li>Plate {currentPlateIdx + 1} of 4 in Docket {CASE_ID}.</li>
              </ul>
            </div>
            <div className="border-2 border-dashed border-ink/70 p-3 text-center shrink-0 self-center sm:self-start bg-white/40">
              <div className="text-[9px] uppercase tracking-widest text-ink/70">EVIDENCE</div>
              <div className="font-mono font-bold text-base text-crimson">{currentPlate.evidenceNo}</div>
              <div className="text-[8px] uppercase tracking-widest text-ink/60 border-t border-ink/30 pt-0.5 mt-0.5">
                DO NOT REMOVE FROM FILE
              </div>
            </div>
          </div>

          {/* Additional Remarks */}
          <div className="p-2.5 bg-amber-50/60 border-l-2 border-amber-800 text-[11px] text-ink/90">
            <span className="font-bold uppercase text-[9px] tracking-wider block text-amber-900">
              ADDITIONAL REMARKS:
            </span>
            <p className="italic m-0 mt-0.5">{currentPlate.remarks}</p>
          </div>

          {/* Signatures */}
          <div className="pt-3 border-t border-ink/30 flex flex-wrap items-end justify-between gap-2 text-[10px] text-ink/70">
            <div>
              <span className="block text-[8px] uppercase">AUTHORIZED SIGNATURE:</span>
              <span className="font-serif italic text-sm text-ink font-bold">J. R. Caldwell</span>
              <span className="block text-[9px]">J. R. Caldwell // Forensic Imaging Laboratory</span>
            </div>
            <div>
              <span className="text-[9px] uppercase text-ink/60">DATE: </span>
              <strong>{currentPlate.signatureDate}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Backwards compatibility alias
export const RecordsRoomNegativeDoc = ForensicNegativeDoc;


// ---------------------------------------------------------------------------
// 4. CAS-017: SFPD VERBATIM INTERROGATION TRANSCRIPT (DOC-WIT-74-88)
// ---------------------------------------------------------------------------
export function WitnessTranscriptDoc({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-12 relative text-ink font-mono text-xs leading-relaxed">
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
            SAN FRANCISCO POLICE DEPARTMENT — HOMICIDE BUREAU ROOM 412
          </p>
          <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
            Verbatim Stenographic Witness Transcript
          </h2>
          <p className="text-[10px] text-ink/60 mt-0.5">
            FILE REF: CAS-017 // DOC-WIT-74-88 // CASE: {CASE_ID}
          </p>
        </div>
        <span className="stamp text-ink border-ink text-xs">RECORD OF INQUIRY</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5 py-3 border-y border-ink/30 text-[11px] bg-black/5">
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">WITNESS NAME</span>
          <strong>MRS. ELEANOR GABLE</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">RESIDENCE LOCATION</span>
          <strong className="text-crimson">3893 WASHINGTON STREET</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">INVESTIGATING INSPECTORS</span>
          <strong>INSP. D. TOSCHI / W. ARMSTRONG</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">DATE &amp; TIME</span>
          <strong>21 OCT 1974 · 14:20 HRS</strong>
        </div>
      </div>

      <div className="space-y-3 text-xs leading-relaxed font-mono">
        <p>
          <strong>INSPECTOR TOSCHI:</strong> Mrs. Gable, state your full name and confirm your residential address for the official case record.
        </p>
        <p>
          <strong>MRS. GABLE:</strong> Eleanor Gable. I live at thirty-eight ninety-three Washington Street, right across from the corner near Cherry.
        </p>
        <p>
          <strong>INSPECTOR ARMSTRONG:</strong> Take us back to the evening of Saturday the nineteenth. What drew your attention toward the street?
        </p>
        <p>
          <strong>MRS. GABLE:</strong> It was around eleven o'clock. The children were asleep. I was sitting in the front parlor reading when I heard a vehicle idle outside. Not a normal sound. It was running low, almost sputtering, like an older sedan with an exhaust leak.
        </p>
        <p>
          <strong>INSPECTOR TOSCHI:</strong> Did you look through the front window?
        </p>
        <p>
          <strong>MRS. GABLE:</strong> Yes. I pulled back the drape. The streetlamp on the corner was flickering. I saw the silhouette of a dark car parked on the south side of Washington. A man stepped out from the driver's side. He didn't rush. He walked across to the curb, stopped under the telephone pole, and looked directly up toward the telephone wires for several seconds.
        </p>
        <p>
          <strong>INSPECTOR ARMSTRONG:</strong> Can you describe his clothing or physical stature?
        </p>
        <p>
          <strong>MRS. GABLE:</strong> Heavy-set, broad across the shoulders. Dark windbreaker jacket, maybe navy or dark brown. Glasses with heavy rims. He dropped something onto the cobblestone path by the alleyway. When he got back into the car, he didn't turn on his headlights until he turned right onto the Presidio access road.
        </p>
      </div>

      <div className="mt-6 p-3 bg-black/5 border-l-2 border-crimson text-[11px] space-y-1">
        <strong className="text-crimson block uppercase font-bold">CASE RELEVANCE NOTE:</strong>
        The witness resides at House 3893, directly matching the decrypted Stage 02 negative telemetry coordinates (37.78874, -122.45709). This confirms Washington &amp; Cherry as the geographical anchor point for subsequent signal triangulation.
      </div>

      <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/60 uppercase">
        <span>SFPD TRANSCRIPT SYSTEM 4</span>
        <span>COURT STENOGRAPHER: P. LANDAU #18</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. EV-0301: TELECOMMUNICATIONS MICROWAVE MAST SURVEY (DOC-SURV-74-33)
// ---------------------------------------------------------------------------
export function TransmissionMastDoc({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-12 relative text-ink font-mono text-xs leading-relaxed">
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
            CALIFORNIA DIVISION OF FORESTRY &amp; SIGNAL CORPS
          </p>
          <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
            Microwave Relay Tower Physical Inspection &amp; Triangulation
          </h2>
          <p className="text-[10px] text-ink/60 mt-0.5">
            SURVEY DOCKET: DOC-SURV-74-33 // STATION: PRESIDIO RIDGE MAST 04
          </p>
        </div>
        <span className="stamp text-ink border-ink text-xs">SITE SURVEY</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5 py-3 border-y border-ink/30 text-[11px] bg-black/5">
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">SURVEYOR</span>
          <strong>R. HALLOWELL, FIELD TECH</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">ELEVATION</span>
          <strong>440 FT ABOVE MEAN SEA LEVEL</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">AZIMUTH BEARING</span>
          <strong>198° TOWARD PRESIDIO HEIGHTS</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">ANOMALY STATUS</span>
          <strong className="text-crimson">UNAUTHORIZED REPEATER TAP</strong>
        </div>
      </div>

      <div className="space-y-4">
        <p className="font-bold text-ink uppercase tracking-wider text-[11px]">
          RIGGING OBSERVATIONS:
        </p>
        <p>
          1. Physical climb inspection of coastal relay mast 04 revealed an unauthorized auxiliary coaxial line tapped directly into the secondary microwave transponder feed horn.
        </p>
        <p>
          2. The tapping apparatus was housed inside a weatherproof surplus ammo can clamped to the mast ladder at the 60-foot platform level. Inside was a transistorized pulse generator tuned to pulse in synchrony with off-band broadcasts.
        </p>
        <p>
          3. Geometric line-of-sight calculation confirms an unobstructed optical path between this ridgeline mast and the intersection of Washington and Cherry Streets. Signals broadcast from this node would be captured by any receiver with a copper pigtail antenna in that direct corridor.
        </p>
      </div>

      <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/60 uppercase">
        <span>DIVISION OF FORESTRY TELECOMMUNICATIONS</span>
        <span>PAGE 01 OF 01 // ARCHIVED OCT 23 1974</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. EV-0502: CONFIDENTIAL SUSPECT DOSSIER: ARTHUR LEIGH ALLEN (DOC-DOS-0502)
// ---------------------------------------------------------------------------
export function SuspectDossierAllenDoc({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-12 relative text-ink font-mono text-xs leading-relaxed">
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
            CALIFORNIA DEPARTMENT OF JUSTICE — SPECIAL INVESTIGATIONS UNIT
          </p>
          <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
            Confidential Person of Interest Dossier // S-02
          </h2>
          <p className="text-[10px] text-ink/60 mt-0.5">
            FILE CODE: DOC-DOS-0502 // SUBJECT: ARTHUR LEIGH ALLEN
          </p>
        </div>
        <span className="stamp text-crimson border-crimson text-xs">RESTRICTED DOSSIER</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5 py-3 border-y border-ink/30 text-[11px] bg-black/5">
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">DATE OF BIRTH</span>
          <strong>18 DEC 1933 · HONOLULU, HI</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">EMPLOYMENT</span>
          <strong>FORMER ELEMENTARY CUSTODIAN</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">RESIDENCE</span>
          <strong>32 FRESNO ST, VALLEJO, CA</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">STATUS</span>
          <strong className="text-amber-800">PRIMARY SUSPECT (HISTORIC)</strong>
        </div>
      </div>

      <div className="space-y-4">
        <p className="font-bold text-ink uppercase tracking-wider text-[11px]">
          INVESTIGATIVE SUMMARY &amp; FORENSIC CORRELATIONS:
        </p>
        <p>
          1. <strong>Physical Characteristics:</strong> Height 6'0", Weight ~240 lbs, heavy build, balding hair, heavy horn-rimmed eyeglasses. Closely aligns with physical descriptions provided by surviving witnesses and neighborhood accounts.
        </p>
        <p>
          2. <strong>Timepiece Inspection:</strong> Subject wore a "Zodiac Sea Wolf" diver's wristwatch gifted to him by his mother in 1967. The watch dial features the exact cross-circle motif used as the killer's monogram signature in historical correspondence.
        </p>
        <p>
          3. <strong>Geographic Proximity:</strong> Subject's residence on Fresno Street in Vallejo is situated less than ten minutes driving time from both the Lake Herman Road turnout and the Blue Rock Springs park entrance.
        </p>
        <p>
          4. <strong>Forensic Discrepancies:</strong> Formal handwriting analysis conducted by state examiner Sherwood Morrill concluded Allen's handwriting samples did not match the stylized lettering of the canonical letters. Fingerprint comparisons from the Presidio taxicab cab door were inconclusive.
        </p>
      </div>

      <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/60 uppercase">
        <span>DOJ SPECIAL INQUIRIES // SACRAMENTO</span>
        <span>CLEARANCE: LEVEL 4 ONLY</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. EV-0503: CONFIDENTIAL SUSPECT DOSSIER: RICHARD GAIKOWSKI (DOC-DOS-0503)
// ---------------------------------------------------------------------------
export function SuspectDossierGaikowskiDoc({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-12 relative text-ink font-mono text-xs leading-relaxed">
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
            BUREAU OF INTELLIGENCE &amp; COUNTER-ANALYSIS
          </p>
          <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
            Confidential Person of Interest Dossier // S-03
          </h2>
          <p className="text-[10px] text-ink/60 mt-0.5">
            FILE CODE: DOC-DOS-0503 // SUBJECT: RICHARD GAIKOWSKI
          </p>
        </div>
        <span className="stamp text-crimson border-crimson text-xs">RESTRICTED DOSSIER</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5 py-3 border-y border-ink/30 text-[11px] bg-black/5">
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">DATE OF BIRTH</span>
          <strong>14 MAR 1936 · WATERTOWN, SD</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">OCCUPATION</span>
          <strong>JOURNALIST / MANAGING EDITOR</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">AFFILIATION</span>
          <strong>GOOD TIMES UNDERGROUND PRESS</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase text-ink/60 block">LOCATION BASE</span>
          <strong>SAN FRANCISCO / BERKELEY CORRIDOR</strong>
        </div>
      </div>

      <div className="space-y-4">
        <p className="font-bold text-ink uppercase tracking-wider text-[11px]">
          CORRELATION ANALYSIS &amp; AUDIO COMPARISON:
        </p>
        <p>
          1. <strong>Editorial Background:</strong> As editor of the counter-culture newspaper <em>Good Times</em>, subject maintained extensive access to commercial typesetting machinery, offset lithographic plates, and darkroom chemical developers matching materials identified in anonymous postal mailings.
        </p>
        <p>
          2. <strong>Audio Voice Matching:</strong> Voice recordings recovered from dispatch tapes were submitted for acoustic spectrographic comparison against broadcast interviews of Gaikowski. Police dispatcher Nancy Slover noted strong pitch and cadence similarities to the caller who spoke after the Blue Rock Springs incident.
        </p>
        <p>
          3. <strong>Proximity to Presidio:</strong> Subject maintained printing offices on Haight Street within three miles of the Presidio Heights intersection. Historical publications under his editorship frequently featured cryptograms, anagrams, and satirical commentaries on police inquiries.
        </p>
      </div>

      <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/60 uppercase">
        <span>BUREAU OF SPECIAL INQUIRIES</span>
        <span>PAGE 01 OF 01 // ARCHIVAL HOLD</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. EV-0601 / EV-0602: THE RECORD THAT REMEMBERED TOMORROW (STAGE 6)
// ---------------------------------------------------------------------------
export function RecordRememberedTomorrowDoc({
  item,
  progress,
  onUpdateProgress,
  onAdvanceToStage7,
}: {
  item: EvidenceItem;
  progress?: import('@/src/lib/prototypeAuth').UserProgress;
  onUpdateProgress?: (updater: (prev: import('@/src/lib/prototypeAuth').UserProgress) => import('@/src/lib/prototypeAuth').UserProgress) => void;
  onAdvanceToStage7?: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState<'incident' | 'torn_note' | 'revision_log' | 'archive_access'>(
    item.id === 'EV-0602' ? 'revision_log' : 'incident'
  );
  const [passwordInput, setPasswordInput] = React.useState('');
  const [isEvaluating, setIsEvaluating] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const isStage6Cleared = (progress?.stagesCompleted ?? 0) >= 6 || progress?.solvedChallengeKeys?.includes('stage6_record_tomorrow');

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passwordInput.trim().toUpperCase();
    if (!clean) return;

    setIsEvaluating(true);
    setAuthError(null);

    setTimeout(() => {
      setIsEvaluating(false);
      if (clean === 'EV1971') {
        if (onUpdateProgress) {
          onUpdateProgress((prev) => {
            const alreadyCleared = (prev.stagesCompleted ?? 0) >= 6;
            const solveTime = new Date().toISOString();
            return {
              ...prev,
              stagesCompleted: Math.max(prev.stagesCompleted, 6),
              activeStage: Math.max(prev.activeStage, 7),
              unlockedEvidenceIds: Array.from(new Set([...prev.unlockedEvidenceIds, 'EV-0601', 'EV-0602', 'EV-0701', 'EV-0702'])),
              solvedChallengeKeys: Array.from(new Set([...prev.solvedChallengeKeys, 'stage6_record_tomorrow'])),
              score: alreadyCleared ? prev.score : prev.score + 100,
              stageSolveTimestamps: {
                ...prev.stageSolveTimestamps,
                6: solveTime,
              },
            };
          });
        }
      } else {
        setAuthError('INVALID ARCHIVE PASSWORD. Inspect the initials on the torn note and the date referenced in the incident report.');
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Director Opening Message Dispatch Banner */}
      <div className="bg-[#15120e] border border-[#3e3427] p-5 shadow-lg font-mono text-xs text-[#dcd6c9] space-y-3">
        <div className="flex items-center justify-between border-b border-[#312a20] pb-2 text-[11px]">
          <span className="text-amber-400 font-bold tracking-widest flex items-center gap-2">
            <Radio size={14} className="text-amber-400 animate-pulse" />
            DIRECTOR DISPATCH // 02:13 AM
          </span>
          <span className="text-muted-foreground uppercase text-[10px]">CASE {CASE_ID} // STAGE 06</span>
        </div>
        <div className="font-serif text-sm leading-relaxed text-[#eae4d8] space-y-2 italic">
          <p>"Daniel Mercer was not the only person who noticed the alterations."</p>
          <p>"Someone contacted us last night claiming to have another copy of the records Daniel was investigating. We were supposed to meet them today. They never arrived."</p>
          <p>"The police have recovered a folder from their room. I have uploaded its contents. One thing bothers me. The final page is dated tomorrow."</p>
          <p className="font-sans not-italic text-xs text-amber-300 font-medium">
            Please examine the documents carefully. Do not assume that everything in this folder was written when its timestamp says it was.
          </p>
        </div>
      </div>

      {/* Document Tab Selector */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3 font-mono text-xs">
        <button
          onClick={() => setActiveTab('incident')}
          className={`px-3 py-1.5 border transition-all ${
            activeTab === 'incident'
              ? 'bg-[#2b1f14] border-amber-600/70 text-amber-300 font-bold'
              : 'bg-[#141413] border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Doc A: Incident Report 06-B
        </button>
        <button
          onClick={() => setActiveTab('torn_note')}
          className={`px-3 py-1.5 border transition-all ${
            activeTab === 'torn_note'
              ? 'bg-[#2b1f14] border-amber-600/70 text-amber-300 font-bold'
              : 'bg-[#141413] border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Doc B: The Torn Note
        </button>
        <button
          onClick={() => setActiveTab('revision_log')}
          className={`px-3 py-1.5 border transition-all ${
            activeTab === 'revision_log'
              ? 'bg-[#2b1f14] border-amber-600/70 text-amber-300 font-bold'
              : 'bg-[#141413] border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Doc C: Archival Revision Log
        </button>
        <button
          onClick={() => setActiveTab('archive_access')}
          className={`px-3 py-1.5 border transition-all ${
            activeTab === 'archive_access'
              ? 'bg-[#223526] border-emerald-600/70 text-emerald-300 font-bold'
              : 'bg-[#141413] border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          ARCHIVE_ACCESS.txt
        </button>
      </div>

      {/* Tab 1: Incident Report 06-B */}
      {activeTab === 'incident' && (
        <div className="paper-sheet p-8 md:p-12 relative text-ink font-serif text-sm leading-relaxed space-y-6">
          <div className="flex items-start justify-between border-b-2 border-ink pb-4 font-mono">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
                FICTIONAL CASE DOCUMENT • STAGE 6 // REF: INC-06-B
              </p>
              <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
                Incident Report 06-B — Presidio Vicinity Locked Room
              </h2>
              <p className="text-[10px] text-ink/60 mt-0.5">
                DATE RECOVERED: 29 OCTOBER 2026 // SFPD SPECIAL INQUIRIES
              </p>
            </div>
            <span className="stamp text-crimson border-crimson text-xs font-mono">CONFIDENTIAL FILE</span>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-xs border-b border-ink/30 pb-4">
            <div>
              <span className="text-[9px] uppercase text-ink/60 block">SUBJECT:</span>
              <strong>Unidentified source connected to Daniel Mercer investigation</strong>
            </div>
            <div>
              <span className="text-[9px] uppercase text-ink/60 block">STATUS:</span>
              <strong className="text-crimson">Deceased; circumstances under investigation</strong>
            </div>
          </div>

          <div className="space-y-3 font-serif text-sm">
            <p>
              An individual who had recently contacted investigators regarding altered archival records was found dead in a locked room. No clear sign of forced entry was reported. Several papers relating to the Daniel Mercer investigation were found spread across the desk.
            </p>
            <p>
              Investigators recovered a torn note, a photograph, and a handwritten page. The individual's identity and the circumstances surrounding the death remain unconfirmed.
            </p>
            <div className="p-4 bg-[#ede4d6] border-l-4 border-amber-700 font-mono text-xs leading-relaxed">
              <strong className="text-amber-950 uppercase block mb-1">ADDITIONAL FORENSIC OBSERVATION:</strong>
              The recovered papers include a direct reference to a classified repository document dated <strong>October 1971</strong>. No official explanation for this chronological reference has been established in active SFPD indices.
            </div>
          </div>

          <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between font-mono text-[10px] text-ink/60 uppercase">
            <span>SFPD HOMICIDE DETAIL // CASE 17 INTAKE</span>
            <span>EVIDENCE REF: EV-0601</span>
          </div>
        </div>
      )}

      {/* Tab 2: The Torn Note */}
      {activeTab === 'torn_note' && (
        <div className="paper-sheet p-8 md:p-12 relative text-ink font-serif text-sm leading-relaxed space-y-6">
          <div className="flex items-start justify-between border-b-2 border-ink pb-4 font-mono">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
                PHYSICAL EVIDENCE // DESK RECOVERY
              </p>
              <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
                The Torn Note
              </h2>
              <p className="text-[10px] text-ink/60 mt-0.5">
                RECOVERED FROM LOCKED ROOM DESK // CASE 17
              </p>
            </div>
            <span className="stamp text-amber-800 border-amber-800 text-xs font-mono">RECOVERED FRAGMENT</span>
          </div>

          <div className="my-8 p-8 bg-[#fdfaf3] border border-[#d6ccb8] shadow-inner font-['Caveat'] text-2xl text-[#2a2622] leading-relaxed relative">
            <p className="mb-4">
              "Mercer was right. The records were changed, but not all the copies were changed."
            </p>
            <p className="mb-4">
              "I found the older version."
            </p>
            <p className="mb-4">
              "The answer is not in the names. It is in the dates."
            </p>
            <p className="mb-6">
              "Read what remains. Then look where the record ends."
            </p>
            <p className="text-right text-3xl font-bold text-crimson tracking-wider">
              — E.V.
            </p>
          </div>

          <p className="font-mono text-xs text-ink/75 leading-relaxed">
            Forensic note: The handwriting on this note matches historical research files deposited in Archival Vault B during the early 1970s.
          </p>

          <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between font-mono text-[10px] text-ink/60 uppercase">
            <span>CHAIN OF CUSTODY: EVIDENCE BAG #06-B</span>
            <span>INITIALS CONFIRMED: E.V.</span>
          </div>
        </div>
      )}

      {/* Tab 3: Archival Revision Log & Unsent Message */}
      {activeTab === 'revision_log' && (
        <div className="paper-sheet p-8 md:p-12 relative text-ink font-serif text-sm leading-relaxed space-y-6">
          <div className="flex items-start justify-between border-b-2 border-ink pb-4 font-mono">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
                AUDIT LOG COMPARISON // REGIONAL REPOSITORY
              </p>
              <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
                The Record That Remembered Tomorrow
              </h2>
              <p className="text-[10px] text-ink/60 mt-0.5">
                COMPARATIVE DOCKET ANALYSIS // HISTORICAL CHRONOLOGY AUDIT
              </p>
            </div>
            <span className="stamp text-crimson border-crimson text-xs font-mono">TIMELINE PARADOX</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#efe7da] border border-[#d3c7b2] space-y-2">
              <span className="text-[10px] uppercase text-ink/70 font-bold block">
                UNSENT TELETYPE MEMORANDUM FRAGMENT (DESK DRAFT):
              </span>
              <p className="font-serif text-sm text-ink/90 italic">
                "TO: REGIONAL REPOSITORY DESK<br />
                SUBJECT: DANIEL MERCER / CORRUPTED LOGS<br />
                I inspected the microfilm revision card for the Presidio dispatch. Look at the timestamp in the modification ledger. The alteration entry was logged at 14:15 hours—more than seven hours before Paul Stine's cab reached Washington and Cherry at 21:55 hours. Someone wrote the revision before the event took place."
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-ink/40 text-[11px] font-mono">
                <thead>
                  <tr className="bg-ink/10 text-ink uppercase">
                    <th className="border border-ink/30 p-2 text-left">Record ID</th>
                    <th className="border border-ink/30 p-2 text-left">Logged Timestamp</th>
                    <th className="border border-ink/30 p-2 text-left">Recorded Incident</th>
                    <th className="border border-ink/30 p-2 text-left">Chronological Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/20">
                  <tr>
                    <td className="p-2 font-bold">ORIG-SFPD-69</td>
                    <td className="p-2">11 OCT 1969 — 21:55</td>
                    <td className="p-2">Presidio Heights Dispatch</td>
                    <td className="p-2 text-ink/80">Real Incident Timestamp</td>
                  </tr>
                  <tr className="bg-crimson/10">
                    <td className="p-2 font-bold text-crimson">MOD-LOG-71</td>
                    <td className="p-2 font-bold text-crimson">11 OCT 1969 — 14:15</td>
                    <td className="p-2 text-crimson">Archival Modification Entry</td>
                    <td className="p-2 font-bold text-crimson">ALTERATION PREDATES EVENT BY 7H 40M</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between font-mono text-[10px] text-ink/60 uppercase">
            <span>REPOSITORY AUDIT DIVISION</span>
            <span>EVIDENCE REF: EV-0602</span>
          </div>
        </div>
      )}

      {/* Tab 4: ARCHIVE_ACCESS.txt & Interactive Gate */}
      {activeTab === 'archive_access' && (
        <div className="bg-[#0e110e] border border-[#273a2b] p-6 text-[#d8ecd9] font-mono text-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#213525] pb-3">
            <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Terminal size={15} />
              ARCHIVE_ACCESS.txt — RECOVERED FILE
            </span>
            <span className="text-[10px] text-muted-foreground">PLAIN TEXT DOCKET</span>
          </div>

          {/* Clue Text Verbatim from PDF page 10 */}
          <div className="p-4 bg-[#142016] border border-[#234329] text-[#bdebc4] space-y-1 font-mono text-xs leading-relaxed">
            <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold mb-2">
              ARCHIVE FORMULA NOTE:
            </p>
            <p>"The initials were left behind.</p>
            <p>The year was never erased.</p>
            <p>Put them together exactly as they appear in the record.</p>
            <p>No spaces."</p>
          </div>

          {/* Archive Unlock Form */}
          <div className="p-5 bg-[#080b09] border border-[#1b3220] space-y-4">
            <div>
              <h4 className="font-bold text-sm text-[#e3f7e6] uppercase tracking-wider mb-1">
                ARCHIVE FILE LOCKED
              </h4>
              <p className="text-[11px] text-[#8ebb95] leading-relaxed">
                Enter the archive password to access the next document.
                <br />
                <span className="text-muted-foreground italic">
                  Hint: The initials were left behind. The year was never erased.
                </span>
              </p>
            </div>

            {isStage6Cleared ? (
              <div className="p-4 bg-[#0d2112] border border-[#285731] space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                  <FileCheck size={16} />
                  <span>STAGE 06 CLEARED // ARCHIVE PASSWORD VERIFIED</span>
                </div>

                {/* Final message from Unknown Sender verbatim from PDF page 10 */}
                <div className="p-4 bg-[#050906] border border-[#1d4024] font-serif text-sm text-[#e2f1e4] leading-relaxed space-y-3 italic">
                  <p className="font-mono text-[10px] text-crimson uppercase tracking-widest not-italic font-bold">
                    UNKNOWN SENDER // INTERCEPTED DISPATCH
                  </p>
                  <p>"You found the copy."</p>
                  <p>"Daniel found it too. The person before him found it."</p>
                  <p>"Do you know what all three of you have in common?"</p>
                  <p>"You believed you were investigating the records. You never asked who was keeping a record of you."</p>
                  <p className="text-[#a4d8ae]">
                    "One last thing: The file you opened first was not the file I wanted you to find. But now I know which one you chose."
                  </p>
                </div>

                {/* Stage 7 Unlock Message verbatim from PDF page 10 */}
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-200 font-mono text-xs space-y-1">
                  <div className="font-bold text-emerald-300">STAGE 6 COMPLETE</div>
                  <p className="text-[11px]">
                    One name remains: <strong>Ellen Vale</strong>. Open her journal. Examine the dates. The final review is waiting.
                  </p>
                </div>

                {onAdvanceToStage7 && (
                  <button
                    onClick={onAdvanceToStage7}
                    className="button bg-[#1b3b22] hover:bg-[#23502d] text-[#e3f7e6] border border-[#3e784c] px-4 py-2.5 text-xs font-mono font-bold w-full flex items-center justify-center gap-2"
                  >
                    <span>OPEN ELLEN VALE'S JOURNAL (EV-0701) →</span>
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleVerifyPassword} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter archive password..."
                    className="flex-1 bg-[#020503] border border-[#214328] p-2.5 text-xs text-[#9ef5ae] font-mono tracking-widest focus:outline-none focus:border-emerald-400"
                    disabled={isEvaluating}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isEvaluating || !passwordInput.trim()}
                    className="button bg-[#1b3b22] hover:bg-[#23502d] text-[#e3f7e6] border border-[#3e784c] px-5 py-2.5 text-xs font-mono font-bold tracking-wider disabled:opacity-50"
                  >
                    {isEvaluating ? 'Decrypting...' : 'Verify Password'}
                  </button>
                </div>

                {authError && (
                  <div className="p-2.5 bg-red-950/80 border border-crimson text-red-200 text-[11px] font-mono">
                    {authError}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. EV-0701: RESEARCH JOURNAL OF ELLEN VALE — OCTOBER 1971 (STAGE 7)
// ---------------------------------------------------------------------------
export function EllenValeJournalDoc({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-12 relative text-ink font-serif text-sm leading-relaxed space-y-6">
      <div className="flex items-start justify-between border-b-2 border-ink pb-4 font-mono">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-ink/70 font-bold">
            THE LAST SIGNAL // CLASSIFIED ARCHIVAL JOURNAL
          </p>
          <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">
            Research Journal of Ellen Vale — October 1971
          </h2>
          <p className="text-[10px] text-ink/60 mt-0.5">
            SOURCE: PRIVATE PAPERS DEPOSITED IN ARCHIVAL VAULT B // PASSWORD: EV1971
          </p>
        </div>
        <span className="stamp text-crimson border-crimson text-xs font-mono">CONFIDENTIAL RESEARCH</span>
      </div>

      {/* Verbatim Journal Text from PDF Page 11 */}
      <div className="space-y-4 font-serif text-base text-ink/90 leading-relaxed italic">
        <p>
          "I’ve spent years studying the Zodiac Killer’s letters, ciphers, and reported crimes across Northern California."
        </p>
        <p>
          "The Z408 cipher was solved in 1969, yet it revealed no identity. The Z340 cipher remained unsolved, and every new letter brought more questions than answers."
        </p>
        <p>
          "I’ve separated verified evidence from public speculation, but the same question persists: who was the person behind the name?"
        </p>
        <p>
          "The newspapers call this an investigation. I call it an unfinished puzzle."
        </p>
        <p>
          "Perhaps the answer lies in a detail everyone overlooked."
        </p>
        <p>
          "Until then, the files remain open."
        </p>
      </div>

      <div className="p-4 bg-[#ede5d8] border border-[#cfc4b2] font-mono text-xs text-ink/80 space-y-1">
        <div><strong>Researcher:</strong> Ellen Vale</div>
        <div><strong>Date of Record:</strong> October 1971</div>
        <div><strong>Attachment found:</strong> FINAL_REVIEW.mp4</div>
      </div>

      <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between font-mono text-[10px] text-ink/60 uppercase">
        <span>ARCHIVAL VAULT B // DEPOSIT BOX 17</span>
        <span>EVIDENCE REF: EV-0701</span>
      </div>
    </div>
  );
}

/**
 * EV-0702 — Chronicle Final Edition: Police Recruit Found Dead Inside Station
 * & Department Incident Investigation Report
 */
export function StationIncidentReportDoc({
  item,
  page = 0,
}: {
  item: EvidenceItem;
  page?: number;
}) {
  if (page === 1) {
    return (
      <div className="paper-sheet p-8 md:p-14 relative text-ink space-y-6">
        <div className="border-b-2 border-ink pb-4 flex flex-wrap justify-between items-start gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink/70 block">
              DEPARTMENTAL INTERNAL AFFAIRS // INCIDENT REPORT
            </span>
            <h2 className="font-serif text-3xl font-bold text-ink mt-0.5">
              Incident Report: Archive Vault Sealing Order
            </h2>
            <p className="font-mono text-xs text-ink/70 mt-1">
              CASE REF: TLS-0017 / STATION DISPATCH // CLASSIFICATION: CONFIDENTIAL
            </p>
          </div>
          <span className="stamp text-crimson border-crimson text-xs">OFFICIAL INQUIRY</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#e4dcbf]/50 border border-ink/30 p-3 font-mono text-[11px]">
          <div>
            <span className="block text-ink/60 uppercase">Date of Discovery</span>
            <span className="font-semibold text-ink">24 Oct 2026, 04:15 IST</span>
          </div>
          <div>
            <span className="block text-ink/60 uppercase">Location</span>
            <span className="font-semibold text-ink">Lower Archival Vault B</span>
          </div>
          <div>
            <span className="block text-ink/60 uppercase">Subject</span>
            <span className="font-semibold text-ink">Police Recruit (Records Duty)</span>
          </div>
          <div>
            <span className="block text-ink/60 uppercase">Status</span>
            <span className="font-semibold text-crimson">SEALED BY ORDER</span>
          </div>
        </div>

        <div className="space-y-4 font-mono text-xs leading-relaxed text-ink/90">
          <p>
            <strong>1. INITIAL FINDINGS:</strong> During scheduled duty handover in the lower basement records wing, station personnel discovered the unresponsive body of a 22-year-old police recruit. The recruit had been reviewing Case 17 historical correspondence dockets and comparing early telegraphic logs against the 1974 series.
          </p>
          <p>
            <strong>2. PHYSICAL RECOVERIES:</strong> A portable radio receiver was found on the floor tuned to an uncatalogued coastal frequency (408.000 MHz). Adjacent teletype equipment had printed repetitive sequence bursts until circuit cutoff. No signs of struggle or forced entry were evident.
          </p>
          <p>
            <strong>3. EXECUTIVE DIRECTIVE:</strong> By order of the Director of Archival Inquiries, all Case 17 dockets and research journals are sealed immediately. Participating student investigators must conclude active operations and report to emergency debriefing for case evaluation.
          </p>
        </div>

        <div className="pt-6 border-t-2 border-ink flex justify-between items-end font-mono text-xs">
          <div>
            <div className="text-[10px] text-ink/60 uppercase">Reporting Inspector</div>
            <div className="font-serif text-base italic font-bold">Office of the Director</div>
            <div className="text-[10px] text-ink/75">Forensic Chain-of-Custody Command</div>
          </div>
          <span className="stamp text-crimson border-crimson text-[10px]">CASE 17 TERMINATED</span>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-sheet p-8 md:p-14 relative text-ink space-y-6">
      {/* Broadsheet Masthead */}
      <div className="border-b-4 border-double border-ink pb-3 text-center">
        <h2 className="font-serif text-4xl sm:text-5xl font-black uppercase tracking-tight text-ink">
          The San Francisco Chronicle
        </h2>
        <div className="flex justify-between border-t border-b border-ink py-1 my-2 font-mono text-[10px] uppercase tracking-widest text-ink/80">
          <span>SATURDAY, OCTOBER 24, 2026</span>
          <span>SPECIAL INVESTIGATION DISPATCH</span>
          <span>FINAL LATE EDITION</span>
        </div>
      </div>

      {/* Main Climax Headline */}
      <div className="my-6 border-b-2 border-ink pb-4 text-center space-y-2">
        <h3 className="font-serif text-3xl sm:text-4xl font-black uppercase text-ink tracking-tight leading-tight">
          POLICE RECRUIT FOUND DEAD INSIDE STATION
        </h3>
        <p className="font-serif text-base italic text-ink/80 max-w-2xl mx-auto">
          Internal inquiry launched as anomalous radio signals and altered historic records surface in Case 17.
        </p>
      </div>

      {/* Two Column News Story */}
      <div className="grid md:grid-cols-2 gap-8 text-xs font-serif leading-relaxed text-justify">
        <div className="space-y-4">
          <p className="first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2">
            SAN FRANCISCO — Early yesterday morning, station personnel conducting shift rotation in the lower
            archival vault discovered the body of a 22-year-old police recruit assigned to Case 17 records duty.
            Department officials confirmed that no signs of forced entry were found at the scene.
          </p>
          <p>
            Recovered near the scene was a portable radio receiver tuned to an uncatalogued coastal frequency,
            along with several historical case correspondence files originating from the autumn of 1974. Investigators
            noted that a teletype terminal in an adjacent records room had been left operational, printing repetitive
            transmissions until power was severed.
          </p>
          <div className="p-3 bg-black/5 border-l-2 border-crimson font-mono text-[11px] my-3">
            <strong>PRESS DISPATCH NOTE:</strong> Archival inquiries into the 408-symbol cipher and the Presidio Heights
            survey map are now subject to strict internal lockdown by order of the Director.
          </div>
        </div>

        <div className="space-y-4">
          <p>
            "The recruit was conducting an authorized review of catalogued evidence," stated a departmental spokesperson
            during a brief press assembly. "Preliminary findings suggest the individual encountered anomalous structural
            notes affixed to historical records."
          </p>
          <p>
            Independent radio operators across the Bay Area reported sporadic pulse transmissions on non-standard
            frequencies in the hours preceding the discovery. When asked regarding the contents of recovered audio tapes
            and the research journal of Ellen Vale, authorities declined comment, citing classified status.
          </p>
          <p>
            With the conclusion of this inquiry, all student investigators participating in the digital archival
            examination are instructed to inspect the final ending transmission reel and submit their final deduction
            dossiers for official certification.
          </p>
          <div className="p-3 bg-red-950/10 border border-crimson/40 font-mono text-[11px] text-crimson">
            <strong>DIRECTOR'S BULLETIN:</strong> All operative credentials have been scheduled for debriefing evaluation.
            Proceed to the Debrief Terminal to record final findings.
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-ink/40 flex justify-between font-mono text-[10px] text-ink/70 uppercase">
        <span>PRESS REGISTRY: SF CHRONICLE NO. 74-1024</span>
        <span>EVIDENCE FILE: EV-0702</span>
      </div>
    </div>
  );
}


