/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * STAGE 5 — SUSPECT DATABASE & GATE_SUSPECT_DB
 * 
 * Authenticates access to classified suspect dossiers using the passphrase
 * referenced in the San Francisco Chronicle special dispatch (Z408_REOPENED).
 * Unlocks three restricted investigative dossiers.
 */

import React, { useState } from 'react';
import {
  FileText,
  Fingerprint,
  FolderOpen,
  Lock,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { calculateStageScore } from '@/src/lib/stageConfig';
import type { UserProgress } from '@/src/lib/prototypeAuth';

interface SuspectDossier {
  id: string;
  code: string;
  name: string;
  role: string;
  age: number;
  location: string;
  fingerprintId: string;
  classification: 'High Priority' | 'Under Surveillance' | 'Archival Subject';
  summary: string;
  investigationDetails: string[];
  connections: string[];
  associatedEvidenceId: string;
}

const SUSPECT_DOSSIERS: SuspectDossier[] = [
  {
    id: 'S-01',
    code: 'EV-0601',
    name: 'Ellen Vale',
    role: 'Archival Researcher & Cipher Analyst',
    age: 29,
    location: 'Presidio Heights Historical Archive, San Francisco',
    fingerprintId: 'W-09-74-B',
    classification: 'Archival Subject',
    summary:
      'Archival researcher employed in the Historical Records Unit. Recovered journal notebook contains detailed cipher breakdowns, anomalous margin notations, and direct foreknowledge of the teletype incident.',
    investigationDetails: [
      'Documented access to restricted Case 17 filing cabinets in County Vault B.',
      'Authored the handwritten research journal recovered under evidence tag EV-0601.',
      'Maintained personal correspondence referencing the reopening of the 408-symbol cipher.',
      'Last logged entry terminates abruptly prior to station incident.',
    ],
    connections: [
      'Authored item EV-0601 (Research Journal)',
      'Associated with the final teletype transmissions',
      'Compiled chronological dossiers on northern California survey locations',
    ],
    associatedEvidenceId: 'EV-0601',
  },
  {
    id: 'S-02',
    code: 'EV-0502',
    name: 'Arthur Leigh Allen',
    role: 'Former Elementary School Custodian / Navy Veteran',
    age: 36,
    location: 'Fresno St, Vallejo / Solano County',
    fingerprintId: '14-M-3-VAL',
    classification: 'High Priority',
    summary:
      'Long-term person of interest in northern California investigations. Interrogated regarding movements near Lake Herman Road and Blue Rock Springs Park turnouts.',
    investigationDetails: [
      'Possessed a Zodiac-brand Sea Wolf wristwatch presented to him by family in 1967.',
      'Employment at Vallejo school terminated prior to 1974 investigation series.',
      'Vehicle matched general description of primer-colored sedan spotted near Carquinez Strait.',
      'Denies knowledge of encrypted memoranda; handwriting samples inconclusive.',
    ],
    connections: [
      'Associated with Site 01 (Lake Herman Road)',
      'Associated with Site 02 (Blue Rock Springs)',
      'Forensic interview transcript on file in County Archive',
    ],
    associatedEvidenceId: 'EV-0502',
  },
  {
    id: 'S-03',
    code: 'EV-0503',
    name: 'Richard Gaikowski',
    role: 'Press Staff Writer & Production Editor',
    age: 33,
    location: 'Albany / Haight-Ashbury, San Francisco',
    fingerprintId: '8-U-12-SF',
    classification: 'Under Surveillance',
    summary:
      'Journalist and production editor for regional independent publications. Operates offices within direct line-of-sight of Presidio dispatch corridors.',
    investigationDetails: [
      'Voice cadence exhibits strong phonetic similarity to recordings catalogued on dispatch tapes.',
      'Extensive familiarity with newspaper typesetting, composing room equipment, and postal hubs.',
      'Present in San Francisco during October 1974 dispatch transmissions.',
      'Maintained private files cataloguing telegraphy and regional microwave relay towers.',
    ],
    connections: [
      'Associated with Site 04 (Washington & Cherry / Presidio)',
      'Associated with EV-0501 (San Francisco Chronicle Special Dispatch)',
      'Audio telemetry vector matches radio frequency anomalies',
    ],
    associatedEvidenceId: 'EV-0503',
  },
];

interface SuspectDatabaseViewProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onNavigateEvidence?: (id: string) => void;
}

export function SuspectDatabaseView({
  progress,
  onUpdateProgress,
  onNavigateEvidence,
}: SuspectDatabaseViewProps) {
  const isUnlocked = progress.suspectDbUnlocked || progress.stagesCompleted >= 5;
  const [passphraseInput, setPassphraseInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string>('S-01');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'RESTRICTED DOSSIER VAULT // GATE_SUSPECT_DB V2.4',
    'SECURITY LEVEL: CLASS-4 CLASSIFIED PERSONNEL INVENTORY',
    'AUTHORIZATION REQUIRED: CASE 17 REOPENED INQUIRY PASSPHRASE',
    'Clue: Consult the San Francisco Chronicle special dispatch (EV-0501) regarding historic cipher revisions.',
    'Enter authorization passphrase to access suspect records.',
  ]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const trimmed = passphraseInput.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    setTerminalOutput((prev) => [
      ...prev,
      `> SUBMIT PASSPHRASE: "${trimmed}"`,
      '> VALIDATING SECURITY PROTOCOLS ACROSS POLICE ARCHIVES...',
    ]);

    setTimeout(() => {
      // Normalize: uppercase, remove spaces, underscores, hyphens
      const clean = trimmed.toUpperCase().replace(/[\s_-]+/g, '');
      const isMatch = clean === 'Z408REOPENED' || clean === 'Z408';

      if (isMatch) {
        tacticalAudio.playSuccess();
        const nowIso = new Date().toISOString();
        const scoreBreakdown = calculateStageScore(5, nowIso);

        setTerminalOutput((prev) => [
          ...prev,
          '[AUTHORIZATION CONFIRMED] // Z408_REOPENED PASSPHRASE ACCEPTED',
          '> PERSONNEL VAULT DECRYPTED',
          '> 3 CLASSIFIED SUSPECT DOSSIERS REVEALED',
          '-------------------------------------------------------',
          `[STAGE 05 CLEARED] MERIT AWARDED: +${scoreBreakdown.totalScore} PTS`,
          scoreBreakdown.scoringEligible
            ? `(100 Base + ${scoreBreakdown.hourlyBonus} Hourly Speed Bonus)`
            : '(Late solve: 0 competitive points awarded)',
          '> DOSSIER S-01: ELLEN VALE (EV-0601)',
          '> DOSSIER S-02: ARTHUR LEIGH ALLEN (EV-0502)',
          '> DOSSIER S-03: RICHARD GAIKOWSKI (EV-0503)',
          '> ADVANCE TO STAGE 06: ELLEN VALE\'S JOURNAL & VIDEO REVIEW',
        ]);

        setTimeout(() => {
          onUpdateProgress((prev) => {
            const nextCompleted = Math.max(prev.stagesCompleted, 5);
            const nextActive = Math.max(prev.activeStage, 6);
            const nextUnlocked = Array.from(
              new Set([
                ...prev.unlockedEvidenceIds,
                'EV-0502',
                'EV-0503',
                'EV-0601',
              ])
            );
            const nextScores = {
              ...prev.stageScores,
              5: scoreBreakdown.totalScore,
            };
            const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

            return {
              ...prev,
              suspectDbUnlocked: true,
              stagesCompleted: nextCompleted,
              activeStage: nextActive,
              unlockedEvidenceIds: nextUnlocked,
              stageScores: nextScores,
              stageSolveTimestamps: {
                ...prev.stageSolveTimestamps,
                5: nowIso,
              },
              stageScoringEligible: {
                ...prev.stageScoringEligible,
                5: scoreBreakdown.scoringEligible,
              },
              score: totalScore,
              tasksCompleted: prev.tasksCompleted + 1,
              status: 'IN PROGRESS',
            };
          });
        }, 1200);
      } else {
        tacticalAudio.playError();
        setTerminalOutput((prev) => [
          ...prev,
          '[AUTHORIZATION DENIED] // 403 INVALID ACCESS KEY',
          'ERROR: Passphrase rejected by the central records authority.',
          'Review the headline report in the San Francisco Chronicle special dispatch.',
          'Identify the key referencing the reopened historical cipher.',
        ]);
      }
      setIsProcessing(false);
    }, 700);
  };

  const selectedDossier =
    SUSPECT_DOSSIERS.find((s) => s.id === selectedSuspectId) ?? SUSPECT_DOSSIERS[0];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="eyebrow">Department of Investigation // Classified Records</div>
          <h1>Suspect &amp; Person of Interest Database</h1>
          <p>
            Secure archival intelligence repository for Case 17. Requires official authorization
            to inspect restricted investigative dossiers.
          </p>
        </div>
        <div className="header-action">
          <span
            className={`status-pill ${isUnlocked ? 'available' : 'restricted'}`}
          >
            {isUnlocked ? 'VAULT UNLOCKED' : 'GATE_SUSPECT_DB LOCKED'}
          </span>
        </div>
      </div>

      {!isUnlocked ? (
        <div className="max-w-3xl mx-auto my-8 space-y-6">
          <div className="bg-[#070c08] border-2 border-[#1c3a24] text-[#4af66f] font-mono p-6 sm:p-8 shadow-[0_0_35px_rgba(20,75,30,0.4)]">
            <div className="flex items-center justify-between border-b border-[#1c3a24] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-crimson animate-pulse" />
                <div>
                  <span className="text-[10px] uppercase text-[#7dfba0]/70 tracking-widest block font-bold">
                    ARCHIVAL INTELLIGENCE DIVISION
                  </span>
                  <h2 className="text-lg text-[#a2ffb8] font-bold tracking-wider mt-0.5">
                    RESTRICTED DOSSIER TERMINAL // GATE_SUSPECT_DB
                  </h2>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-red-950/80 border border-crimson text-crimson font-bold">
                STAGE 05 GATE
              </span>
            </div>

            <div className="bg-[#030604] border border-[#16331e] p-5 h-64 overflow-y-auto space-y-1.5 text-xs leading-relaxed shadow-inner">
              {terminalOutput.map((line, idx) => (
                <div
                  key={idx}
                  className={`${
                    line.includes('[AUTHORIZATION CONFIRMED]') ||
                    line.includes('[STAGE 05 CLEARED]')
                      ? 'text-[#a2ffb8] font-bold'
                      : line.includes('[AUTHORIZATION DENIED]') || line.includes('ERROR')
                      ? 'text-[#ff6b6b]'
                      : 'text-[#4af66f]/90'
                  }`}
                >
                  {line}
                </div>
              ))}
              {isProcessing && (
                <div className="text-emerald-400 animate-pulse">
                  &gt; VERIFYING SECURITY AUTHORIZATION HASH...
                </div>
              )}
            </div>

            <form onSubmit={handleUnlock} className="mt-6 pt-4 border-t border-[#1c3a24] space-y-4">
              <div className="p-3 bg-[#0d1a10] border border-[#1b3d22] text-xs text-[#8ee5a5] flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="m-0 font-bold">Investigator Prompt:</p>
                  <p className="m-0 text-[11px] text-[#78c98e]">
                    Inspect the San Francisco Chronicle special dispatch (EV-0501). The report
                    references seven short marks and an inquiry key regarding the reopened cipher.
                    Enter this passphrase to unlock the dossier repository.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7dfba0] mb-1.5 font-bold">
                  AUTHORIZATION PASSPHRASE:
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    onKeyDown={() => tacticalAudio.playKeypress()}
                    placeholder="Enter case authorization passphrase..."
                    className="flex-1 bg-[#020503] border-2 border-[#1e4827] text-[#a2ffb8] p-3 text-sm focus:outline-none focus:border-emerald-400 font-mono tracking-wider"
                    disabled={isProcessing}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !passphraseInput.trim()}
                    className="button bg-[#1b3b22] hover:bg-[#255230] text-[#e3f7e6] border border-[#3e784c] px-6 text-xs font-mono font-bold tracking-wider disabled:opacity-50"
                  >
                    {isProcessing ? 'Authenticating...' : 'Unlock Repository'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Unlocked 3-Dossier Browser */
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Suspect Selector List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider font-semibold block">
              RESTRICTED DOSSIER INVENTORY (3 PROFILES):
            </span>
            {SUSPECT_DOSSIERS.map((s) => {
              const isSelected = selectedSuspectId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    tacticalAudio.playSelect();
                    setSelectedSuspectId(s.id);
                  }}
                  className={`p-4 border transition-all cursor-pointer font-mono ${
                    isSelected
                      ? 'border-crimson bg-[#181212] shadow-md'
                      : 'border-border bg-[#101211] hover:border-[#38423b]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-foreground">{s.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 border ${
                        s.classification === 'High Priority'
                          ? 'border-crimson text-crimson bg-red-950/40'
                          : s.classification === 'Archival Subject'
                          ? 'border-amber-800 text-amber-400 bg-amber-950/40'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {s.classification}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground m-0 truncate">{s.role}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/70 border-t border-line-soft pt-1.5">
                    <span>Code: {s.code}</span>
                    <span>FP: {s.fingerprintId}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suspect Detailed Profile Docket (8 cols) */}
          <div className="lg:col-span-8">
            <div className="paper-sheet p-8 md:p-12 relative text-ink font-mono text-xs space-y-6">
              {/* Header */}
              <div className="border-b-2 border-ink pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-ink/70 block">
                    SPECIAL INQUIRY DOSSIER // {selectedDossier.id}
                  </span>
                  <h2 className="font-serif text-3xl font-semibold text-ink mt-0.5">
                    {selectedDossier.name}
                  </h2>
                  <p className="text-xs text-ink/80 mt-1">{selectedDossier.role}</p>
                </div>
                <div className="text-right">
                  <span className="stamp text-crimson border-crimson text-xs block mb-1">
                    CONFIDENTIAL
                  </span>
                  <span className="text-[10px] text-ink/60">ID: {selectedDossier.code}</span>
                </div>
              </div>

              {/* Vital Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-black/5 border border-ink/30 text-[11px]">
                <div>
                  <span className="text-[9px] text-ink/60 uppercase block">Subject Age</span>
                  <strong>{selectedDossier.age} Years</strong>
                </div>
                <div>
                  <span className="text-[9px] text-ink/60 uppercase block">Fingerprint Code</span>
                  <strong>{selectedDossier.fingerprintId}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[9px] text-ink/60 uppercase block">Last Known Location</span>
                  <strong>{selectedDossier.location}</strong>
                </div>
              </div>

              {/* Case Overview */}
              <div>
                <span className="text-[10px] uppercase font-bold text-ink/70 block mb-1">
                  OFFICIAL INVESTIGATIVE NARRATIVE:
                </span>
                <p className="text-xs leading-relaxed text-ink/90 font-serif m-0">
                  {selectedDossier.summary}
                </p>
              </div>

              {/* Specific Points of Inquiry */}
              <div>
                <span className="text-[10px] uppercase font-bold text-ink/70 block mb-2">
                  FORENSIC INQUIRY POINTS &amp; WITNESS NOTES:
                </span>
                <ul className="space-y-1.5 list-disc pl-4 text-ink/85">
                  {selectedDossier.investigationDetails.map((detail, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Linked Evidence Files */}
              <div className="pt-4 border-t border-ink/30 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase text-ink/60 block">Associated Evidence File:</span>
                  <strong className="text-xs text-ink">{selectedDossier.associatedEvidenceId}</strong>
                </div>
                {onNavigateEvidence && (
                  <button
                    onClick={() => {
                      tacticalAudio.playNavClick();
                      onNavigateEvidence(selectedDossier.associatedEvidenceId);
                    }}
                    className="button bg-ink text-white hover:bg-black text-xs font-mono py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <FolderOpen size={13} />
                    Inspect Evidence File →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
