/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * STORY INTERMISSION MODAL — NARRATIVE STAGE TRANSITIONS
 * 
 * Cinematic breaks between investigation stages delivering:
 * - Director dispatches
 * - Intercepted transmissions
 * - Breaking news bulletins
 * - Archival access logs
 * 
 * Persists in seenIntermissions so refresh never replays completed events.
 */

import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  FileText,
  Lock,
  Newspaper,
  Radio,
  Shield,
  ShieldAlert,
  Terminal,
  X,
} from 'lucide-react';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import type { UserProgress } from '@/src/lib/prototypeAuth';

export type IntermissionKey =
  | 's1_to_s2'
  | 's2_to_s3'
  | 's3_to_s4'
  | 's4_to_s5'
  | 's5_to_s6'
  | 's6_to_s7';

interface IntermissionConfig {
  key: IntermissionKey;
  tag: string;
  sender: string;
  title: string;
  date: string;
  classification: string;
  narrativeText: string[];
  quote?: string;
  nextUnlockedItem: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: 'director' | 'antagonist' | 'press' | 'system';
}

export const INTERMISSION_DEFINITIONS: Record<IntermissionKey, IntermissionConfig> = {
  s1_to_s2: {
    key: 's1_to_s2',
    tag: 'CLEARANCE LEVEL 02 GRANTED',
    sender: 'OFFICE OF THE DIRECTOR',
    title: 'Archive Vault B Cleared // Lower Records Bay Unlocked',
    date: '21 OCT 2026 — 00:14 IST',
    classification: 'CONFIDENTIAL // INTERNAL',
    icon: Terminal,
    tone: 'director',
    quote: '"You recovered the credentials from the vertical margins. Good. But don\'t get comfortable."',
    narrativeText: [
      'The teletype verification across Vault B has been confirmed. The encrypted docket for Sector 01 has released its seals.',
      'Access is now granted to Item EV-0201: Records Room — Lower Level. Photographic negatives recovered from filing bay 17 bear optical telemetry margins.',
      'Examine the negative telemetry stamp carefully. An alphabet-to-number substitution cipher conceals the coordinates of a residence in Presidio Heights.',
    ],
    nextUnlockedItem: 'EV-0201 (Records Room — Lower Level)',
  },
  s2_to_s3: {
    key: 's2_to_s3',
    tag: 'TELEMETRY RESOLVED',
    sender: 'FORENSIC CARTOGRAPHY DESK',
    title: 'House 3893 Identified // Regional Survey Map Active',
    date: '23 OCT 2026 — 08:30 IST',
    classification: 'RESTRICTED DISPATCH',
    icon: Compass,
    tone: 'system',
    quote: '"(37.78874, -122.45709) resolves directly to House 3893. Witness records are ready."',
    narrativeText: [
      'Your coordinate deduction has authenticated the target residence: House 3893 along Washington Street in Presidio Heights.',
      'The Regional Signal Map has been cleared of security lockouts. All four survey quadrants across Northern California are now available for inspection.',
      'Review Item CAS-017: Witness Testimony from Case File 017 to hear what the resident of House 3893 observed in the autumn darkness.',
    ],
    nextUnlockedItem: 'Signal Map Quadrants & CAS-017 (Witness Testimony)',
  },
  s3_to_s4: {
    key: 's3_to_s4',
    tag: 'INCOMING SIGNAL INTERCEPT',
    sender: 'UNKNOWN TRANSMITTER',
    title: 'The 24-Hour Challenge // Four Locations. One Chosen.',
    date: '25 OCT 2026 — 23:42 IST',
    classification: 'IMMEDIATE THREAT // TAPE 47',
    icon: Radio,
    tone: 'antagonist',
    quote: '"Four locations. One has been chosen. Three are irrelevant. You have twenty-four hours to tell me which one... Tick-tock, detectives."',
    narrativeText: [
      'An off-band magnetic tape recording has arrived at dispatch: Item EV-0401 (Recovered Audio Cassette).',
      'The spoken message cuts off abruptly at second 30. The remaining 17 seconds contain high-frequency carrier pulses and reversed audio telemetry.',
      'You must identify the genuine chosen location on the Signal Map. You are permitted exactly ONE correction before the stage deadline. Choose with utmost precision.',
    ],
    nextUnlockedItem: 'EV-0401 (Audio Cassette & 17s Pulse Analysis)',
  },
  s4_to_s5: {
    key: 's4_to_s5',
    tag: 'PRESS DISPATCH // BREAKING',
    sender: 'SAN FRANCISCO CHRONICLE',
    title: 'Archivist Daniel Mercer Found Dead Near Presidio',
    date: '27 OCT 2026 — 06:00 IST',
    classification: 'PUBLIC RECORD // SPECIAL EDITION',
    icon: Newspaper,
    tone: 'press',
    quote: '"He said someone was changing the records. Not destroying them. Changing their meaning."',
    narrativeText: [
      'The San Francisco Chronicle has published a special front-page dispatch (Item EV-0501).',
      'Archivist Daniel Mercer, who was investigating altered files in the county repository, has been found dead inside a disused facility.',
      'An anonymous note left at the scene references reopening the historic Z408 cipher. Inputting Z408_REOPENED will unseal the confidential suspect dossiers.',
    ],
    nextUnlockedItem: 'EV-0501 (Chronicle Broadsheet) & Suspect Database Access',
  },
  s5_to_s6: {
    key: 's5_to_s6',
    tag: 'ANOMALOUS ARCHIVE RECOVERY',
    sender: 'OFFICE OF THE DIRECTOR',
    title: 'A Second Source Surfaces // Incident Report 06-B',
    date: '29 OCT 2026 — 02:13 IST',
    classification: 'CONFIDENTIAL // STAGE 06',
    icon: FileText,
    tone: 'director',
    quote: '"Daniel Mercer was not the only person who noticed the alterations. Someone contacted us claiming to have another copy... They never arrived."',
    narrativeText: [
      'An individual who had recently contacted investigators regarding altered records was found dead in a locked room. Several papers relating to Mercer\'s investigation were found on the desk.',
      'The police recovered a folder containing Incident Report 06-B, a torn note initialed E.V., and an unsent teletype memorandum.',
      'Examine the revision ledger in Item EV-0601. An alteration timestamp predates the event it describes by more than seven hours.',
    ],
    nextUnlockedItem: 'EV-0601 (Incident Report 06-B & The Torn Note)',
  },
  s6_to_s7: {
    key: 's6_to_s7',
    tag: 'STAGE 06 CLEARED // ARCHIVE UNLOCKED',
    sender: 'SPECIAL INQUIRIES VAULT',
    title: "Ellen Vale's Research Journal Unsealed",
    date: '31 OCT 2026 — 14:15 IST',
    classification: 'CONFIDENTIAL // STAGE 07',
    icon: BookOpen,
    tone: 'director',
    quote: '"One name remains: Ellen Vale. Open her journal. Examine the dates. The final review is waiting."',
    narrativeText: [
      'Authentication using password EV1971 has unlocked Item EV-0701: The Research Journal of Ellen Vale from October 1971.',
      'Her handwritten pages document historical cipher investigations and an attached archival video reel: FINAL_REVIEW.mp4.',
      'Review the journal and evaluate the video sequence to uncover the final outcome of the inquiry.',
    ],
    nextUnlockedItem: "EV-0701 (Ellen Vale's Journal & FINAL_REVIEW.mp4)",
  },
};

interface StoryIntermissionModalProps {
  intermissionKey: IntermissionKey | null;
  onClose: () => void;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
  onNavigateToNext?: (path: string) => void;
}

export function StoryIntermissionModal({
  intermissionKey,
  onClose,
  onUpdateProgress,
  onNavigateToNext,
}: StoryIntermissionModalProps) {
  if (!intermissionKey) return null;
  const config = INTERMISSION_DEFINITIONS[intermissionKey];
  if (!config) return null;

  const Icon = config.icon;

  const handleDismiss = () => {
    tacticalAudio.playButtonClick();
    if (onUpdateProgress) {
      onUpdateProgress((prev) => ({
        ...prev,
        seenIntermissions: Array.from(new Set([...(prev.seenIntermissions || []), intermissionKey])),
      }));
    }
    onClose();
  };

  const getBorderColor = () => {
    switch (config.tone) {
      case 'director':
        return 'border-[#2d4d35] shadow-[0_0_50px_rgba(30,80,45,0.4)]';
      case 'antagonist':
        return 'border-crimson shadow-[0_0_50px_rgba(180,20,20,0.5)]';
      case 'press':
        return 'border-[#5a4c38] shadow-[0_0_50px_rgba(80,65,40,0.4)]';
      default:
        return 'border-border shadow-2xl';
    }
  };

  const getHeaderBg = () => {
    switch (config.tone) {
      case 'director':
        return 'bg-[#0f1712] text-[#8deb9e]';
      case 'antagonist':
        return 'bg-[#1a0808] text-red-300';
      case 'press':
        return 'bg-[#191612] text-amber-200';
      default:
        return 'bg-[#141514] text-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className={`bg-[#0a0c0a] border-2 ${getBorderColor()} max-w-2xl w-full text-[#ebe6dc] my-auto flex flex-col font-mono text-xs shadow-2xl`}>
        {/* Top Header */}
        <div className={`p-4 border-b border-border flex items-center justify-between ${getHeaderBg()}`}>
          <div className="flex items-center gap-2.5">
            <Icon size={18} className={config.tone === 'antagonist' ? 'text-crimson' : 'text-emerald-400'} />
            <div>
              <div className="text-[10px] tracking-widest uppercase font-bold opacity-80">
                {config.tag}
              </div>
              <div className="font-serif text-sm font-semibold tracking-wide text-foreground">
                {config.sender}
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Dismiss intermission"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Narrative */}
        <div className="p-6 space-y-5 bg-[#060807]">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-border/40 pb-2">
            <span>{config.date}</span>
            <span className="font-bold text-crimson">{config.classification}</span>
          </div>

          <h3 className="font-serif text-2xl font-normal text-foreground leading-snug">
            {config.title}
          </h3>

          {config.quote && (
            <blockquote className="border-l-3 border-crimson pl-4 py-1 italic font-serif text-sm text-[#ded7c8] bg-[#120808]/50 p-3">
              {config.quote}
            </blockquote>
          )}

          <div className="space-y-3 text-xs leading-relaxed text-[#c4beb3]">
            {config.narrativeText.map((p, idx) => (
              <p key={idx} className="m-0">
                {p}
              </p>
            ))}
          </div>

          {/* Next unlocked item banner */}
          <div className="p-3 bg-[#111613] border border-[#233528] flex items-center justify-between text-[11px]">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#6ca579] block">
                UNLOCKED ASSET READY FOR INSPECTION:
              </span>
              <strong className="text-[#8deb9e] font-bold">{config.nextUnlockedItem}</strong>
            </div>
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0e110f] border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={handleDismiss}
            className="button bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-mono font-bold tracking-wider py-2 px-5 flex items-center gap-2"
          >
            <span>Proceed with Investigation</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
