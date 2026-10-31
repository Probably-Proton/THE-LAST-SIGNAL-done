/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DIRECTOR BRIEFING MODAL — FIRST-TIME CASE ORIENTATION
 * 
 * Cinematic teletype orientation establishing:
 * 1. Investigator role in Case TLS-0017
 * 2. Case archive timetable & IST deadlines
 * 3. Base + Speed bonus scoring mechanics
 * 4. Irreversible decisions (Stage 4 single correction limit)
 * 5. Fictional gameplay disclaimer (no real-world physical travel)
 * 6. "BEGIN INVESTIGATION" activation button
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  Compass,
  FileText,
  FolderOpen,
  Lock,
  Radio,
  RotateCcw,
  Shield,
  ShieldAlert,
  Terminal,
  Volume2,
  X,
} from 'lucide-react';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { CASE_ID } from '@/src/lib/mockData';
import type { PrototypeUser, UserProgress } from '@/src/lib/prototypeAuth';
import { ClassifiedCaseFilesViewer } from '@/src/components/ClassifiedCaseFilesViewer';

interface DirectorBriefingModalProps {
  isOpen: boolean;
  user: PrototypeUser;
  progress: UserProgress;
  onClose: () => void;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
  isReplay?: boolean;
}

export function DirectorBriefingModal({
  isOpen,
  user,
  progress,
  onClose,
  onUpdateProgress,
  isReplay = false,
}: DirectorBriefingModalProps) {
  const [activeTab, setActiveTab] = useState<'briefing' | 'protocol' | 'rules' | 'dossiers'>('briefing');

  if (!isOpen) return null;

  const handleAcknowledgeAndBegin = () => {
    tacticalAudio.playButtonClick();
    if (onUpdateProgress && !progress.directorIntroSeen) {
      onUpdateProgress((prev) => ({
        ...prev,
        directorIntroSeen: true,
      }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div
        className={`bg-[#0b0c0b] border-2 border-[#2b3a30] text-[#ebe6dc] w-full shadow-[0_0_50px_rgba(10,40,20,0.6)] my-auto flex flex-col font-mono text-xs max-h-[94vh] overflow-hidden transition-all duration-200 ${
          activeTab === 'dossiers' ? 'max-w-5xl' : 'max-w-3xl'
        }`}
      >
        {/* Header Bar */}
        <div className="bg-[#121613] border-b border-[#243328] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold tracking-widest text-[#8deb9e] text-xs uppercase">
              OFFICE OF THE DIRECTOR // FIRST DIRECTIVE BRIEFING // CASE {CASE_ID}
            </span>
          </div>
          {isReplay && (
            <button
              onClick={() => {
                tacticalAudio.playButtonClick();
                onClose();
              }}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Close briefing"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Tabs inside Briefing */}
        <div className="flex flex-wrap border-b border-[#243328] bg-[#0e110f] text-[11px]">
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setActiveTab('briefing');
            }}
            className={`px-4 py-2.5 font-bold transition-colors border-r border-[#243328] flex items-center gap-2 ${
              activeTab === 'briefing'
                ? 'bg-[#18221b] text-[#8deb9e] border-b-2 border-b-emerald-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Radio size={13} />
            <span>01. Operational Mandate</span>
          </button>
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setActiveTab('dossiers');
            }}
            className={`px-4 py-2.5 font-bold transition-colors border-r border-[#243328] flex items-center gap-2 ${
              activeTab === 'dossiers'
                ? 'bg-[#18221b] text-[#8deb9e] border-b-2 border-b-emerald-400'
                : 'text-emerald-400/90 hover:text-emerald-300'
            }`}
          >
            <FolderOpen size={13} className="text-emerald-400" />
            <span>02. First Directive (5 Case Files)</span>
          </button>
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setActiveTab('protocol');
            }}
            className={`px-4 py-2.5 font-bold transition-colors border-r border-[#243328] flex items-center gap-2 ${
              activeTab === 'protocol'
                ? 'bg-[#18221b] text-[#8deb9e] border-b-2 border-b-emerald-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock size={13} />
            <span>03. Deadlines &amp; Scoring</span>
          </button>
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setActiveTab('rules');
            }}
            className={`px-4 py-2.5 font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'bg-[#18221b] text-[#8deb9e] border-b-2 border-b-emerald-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldAlert size={13} className="text-crimson" />
            <span>04. Safety Rules</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 leading-relaxed bg-[#070908]">
          {activeTab === 'dossiers' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#121c15] border border-[#233527] text-xs text-[#a6d8b2] space-y-1">
                <div className="font-bold text-[#8deb9e] uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <FolderOpen size={14} />
                  <span>FIRST DIRECTIVE // DECLASSIFIED INCIDENT DOSSIERS (5 FILES)</span>
                </div>
                <p className="text-[11px] text-[#c9e0ce] m-0 font-serif">
                  Carefully examine these five historic incident records. Both facsimile photographs and verbatim transcripts are provided. Note anomalies and corruptions between draft and standard case files.
                </p>
              </div>
              <ClassifiedCaseFilesViewer
                onReturnToDirective={() => setActiveTab('briefing')}
                isModal={false}
              />
            </div>
          )}

          {activeTab === 'briefing' && (
            <div className="space-y-4">
              <div className="border border-[#1f2e23] bg-[#0c130f] p-4 text-[#a6d8b2] space-y-2">
                <div className="text-[10px] uppercase text-[#6ca579] tracking-wider font-bold">
                  TRANSMISSION FROM: DIRECTOR OF ARCHIVAL INQUIRIES
                </div>
                <div className="text-[11px] text-[#7ebf8d]">
                  TO OPERATIVE: <strong className="text-foreground">{user.callSign}</strong> ({user.studentClass} · {user.fullName})
                </div>
              </div>

              <blockquote className="border-l-3 border-emerald-500 pl-4 py-1 text-sm font-serif italic text-[#ded7c8] leading-relaxed">
                "Welcome to Case TLS-0017, Investigator.
                <br /><br />
                You are entering a sealed cold case repository concerning historical unsolved communications and forensic anomalies from October 1974. Your assignment is to re-examine the original physical evidence, analyze intercepted audio waveforms, decode coordinate telemetry, and evaluate suspect files."
              </blockquote>

              <p className="text-muted-foreground text-xs">
                The evidence room contains photographs, official police continuation sheets, cryptographic correspondence, broadsheet news accounts, and recorded field tapes. Every piece has been catalogued under chain-of-custody protocols.
              </p>

              {/* First Directive Callout */}
              <div className="border border-emerald-900/60 bg-[#0f1b13] p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <FolderOpen size={16} />
                  <span>THE FIRST DIRECTIVE: 5 DECLASSIFIED CASE DOSSIERS</span>
                </div>
                <p className="text-[11px] text-[#c9e0ce] leading-relaxed m-0 font-serif">
                  Before deciphering Archivist's memorandum note EV-0103, inspect the five declassified police overview records (SFPD-1969-1011, SOL-1968-1220 Draft, NAP-1969-0927, SOL-1968-1220 Standard, SOL-1969-0704).
                </p>
                <button
                  onClick={() => {
                    tacticalAudio.playDocOpen();
                    setActiveTab('dossiers');
                  }}
                  className="button bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500 text-xs font-mono font-bold tracking-wider py-2 px-4 flex items-center gap-2 shadow"
                >
                  <FileText size={14} />
                  <span>INSPECT 5 CLASSIFIED CASE FILES NOW →</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'protocol' && (
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-normal text-foreground">
                Strict Timetable &amp; Indian Standard Time (IST) Rules
              </h3>

              <p className="text-muted-foreground text-xs">
                To maintain competitive integrity across student investigators, all case deadlines are anchored strictly to Indian Standard Time (IST, UTC+05:30):
              </p>

              <div className="border border-[#1f2e23] divide-y divide-[#18241b] bg-[#0b100c] text-[11px]">
                <div className="p-2.5 flex justify-between items-center bg-[#131c15] text-[#8deb9e] font-bold">
                  <span>STAGE SEQUENCE</span>
                  <span>TIME WINDOW &amp; DEADLINE (IST)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-foreground">Stage 01: The Archive (Exorcist memo &amp; vault)</span>
                  <span className="text-muted-foreground">Nov 01 – Nov 03, 2026 (23:59:59 IST)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-foreground">Stage 02: Locked Files &amp; Coordinates</span>
                  <span className="text-muted-foreground">Nov 03 – Nov 05, 2026 (23:59:59 IST)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-foreground">Stage 03: The Witness &amp; Survey Map</span>
                  <span className="text-muted-foreground">Nov 05 – Nov 07, 2026 (23:59:59 IST)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-foreground">Stage 04: The 24-Hour Signal (Audio &amp; Map Choice)</span>
                  <span className="text-muted-foreground">Nov 07 – Nov 09, 2026 (23:59:59 IST)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-foreground">Stage 05: The Newspaper &amp; Suspect Database</span>
                  <span className="text-muted-foreground">Nov 09 – Nov 11, 2026 (23:59:59 IST)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-foreground">Stage 06: Ellen Vale's Journal &amp; Review</span>
                  <span className="text-muted-foreground">Nov 11 – Nov 13, 2026 (23:59:59 IST)</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-foreground">Stage 07: The Final Signal &amp; Debrief</span>
                  <span className="text-muted-foreground">Nov 13 – Nov 15, 2026 (23:59:59 IST)</span>
                </div>
              </div>

              <div className="p-3 bg-[#111612] border border-[#202b22] text-[11px] space-y-1.5">
                <div className="text-[#8deb9e] font-bold uppercase tracking-wider">SCORING FORMULA:</div>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li><strong>Base Points:</strong> 100 points per stage solved before its deadline.</li>
                  <li><strong>Hourly Speed Bonus:</strong> Solves within the initial hours earn tiered bonus speed points.</li>
                  <li><strong>Stage 4 Target Bonus:</strong> Identifying the genuine target location awards +20 merit points.</li>
                  <li><strong>Late Solves:</strong> Solves submitted after the stage deadline earn <strong>0 competitive points</strong>.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Mandatory Game Safety Disclaimer */}
              <div className="p-4 bg-red-950/40 border-2 border-crimson text-red-200 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert size={16} className="text-crimson" />
                  <span>CRITICAL SAFETY &amp; FICTIONAL GAMEPLAY NOTICE</span>
                </div>
                <p className="text-[11px] leading-relaxed text-red-300 m-0">
                  <strong>THE LAST SIGNAL</strong> is a purely fictional educational detective puzzle.
                  All street addresses, coordinates, witness names, police transcripts, audio tapes, and newspaper articles are fabricated gameplay materials.
                  <strong> Never attempt real-world physical travel, off-campus excursions, or field visits.</strong> All deductions and investigations take place strictly within this web terminal.
                </p>
              </div>

              <h4 className="font-serif text-sm text-foreground font-semibold pt-1">
                Irreversible Operational Decisions
              </h4>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="p-3 bg-[#0d120e] border border-[#1d2920]">
                  <strong className="text-foreground block mb-0.5">Stage 04 Single Correction Rule:</strong>
                  In Stage 04, you must select one of the four locations based on the audio tape. You are permitted <strong>exactly one correction</strong> prior to the stage deadline. Once submitted, your selection locks permanently.
                </div>
                <div className="p-3 bg-[#0d120e] border border-[#1d2920]">
                  <strong className="text-foreground block mb-0.5">Authentic Verification:</strong>
                  The system validates cipher submissions, directory passwords, and house numbers through cryptographic verification. Plaintext answers are never stored or exposed in client hints.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#101411] border-t border-[#243328] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            {isReplay ? 'Replay Mode — Archive Briefing TLS-0017' : 'First-Time Clearance Required'}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab !== 'rules' ? (
              <button
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  if (activeTab === 'briefing') setActiveTab('dossiers');
                  else if (activeTab === 'dossiers') setActiveTab('protocol');
                  else setActiveTab('rules');
                }}
                className="button button-secondary text-xs w-full sm:w-auto"
              >
                Next Directive →
              </button>
            ) : null}

            <button
              onClick={handleAcknowledgeAndBegin}
              className="button bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-mono font-bold tracking-wider px-5 py-2.5 w-full sm:w-auto shadow-md"
            >
              {isReplay ? 'Return to Investigation' : 'BEGIN INVESTIGATION →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
