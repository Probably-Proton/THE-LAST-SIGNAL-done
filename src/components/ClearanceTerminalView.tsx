/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CENTRAL INVESTIGATION CLEARANCE & DECRYPTION TERMINAL
 * 
 * A dedicated, separate interface where investigators submit solved credentials,
 * coordinates, and security keys.
 * 
 * Completely decoupled from individual evidence files so players must investigate
 * documents on their own merit without spoiled answer inputs.
 */

import React, { useState } from 'react';
import {
  Compass,
  FolderOpen,
  Key,
  Lock,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Unlock,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { calculateStageScore, isStageAccessible } from '@/src/lib/stageConfig';
import { submitChallengeAnswer } from '@/src/lib/gameService';
import type { UserProgress } from '@/src/lib/prototypeAuth';
import { navigate } from '@/src/lib/navigation';

export interface ClearanceTerminalViewProps {
  progress: UserProgress;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
  onClose?: () => void;
  initialModule?: 'stage1' | 'stage2' | 'stage3' | 'stage5';
  isModal?: boolean;
}

export function ClearanceTerminalView({
  progress,
  onUpdateProgress,
  onClose,
  initialModule = 'stage1',
  isModal = false,
}: ClearanceTerminalViewProps) {
  // Determine default module based on active stage
  const defaultMod =
    progress.stagesCompleted === 0
      ? 'stage1'
      : !progress.stage2DeductionSolved && progress.stagesCompleted < 2
      ? 'stage2'
      : !progress.mapGateUnlocked && progress.stagesCompleted < 3
      ? 'stage3'
      : !progress.suspectDbUnlocked && progress.stagesCompleted < 5
      ? 'stage5'
      : initialModule;

  const [activeModule, setActiveModule] = useState<'stage1' | 'stage2' | 'stage3' | 'stage5'>(defaultMod);

  // Stage 1 Inputs
  const [s1Dir, setS1Dir] = useState('');
  const [s1Key, setS1Key] = useState('');

  // Stage 2 Inputs
  const [s2Coord, setS2Coord] = useState('');

  // Stage 3 Inputs
  const [s3House, setS3House] = useState('');

  // Stage 5 Inputs
  const [s5Key, setS5Key] = useState('');

  // Common UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'TELETYPE DOCKET DISPATCH V4.8 — CENTRAL CLEARANCE INTERFACE',
    'LOCAL PORT: /dev/tty01-central-clearance',
    'STATUS: READY FOR OPERATIVE CREDENTIAL ENTRY',
    'Select a clearance directive module below and submit deduced parameters.',
  ]);

  // Stage 1 Submission
  // Stage 1 Submission
  const handleStage1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setTerminalLogs((prev) => [
      ...prev,
      `> SUBMIT STAGE 01 AUTH: [DIR: ${s1Dir.trim()}] [KEY: ******]`,
      '> VALIDATING SHA-256 SECTOR PARITY AGAINST ARCHIVAL REGISTRY...',
    ]);

    const result = await submitChallengeAnswer({
      callSign: progress.callSign,
      challengeKey: 'gate_zk_login',
      username: s1Dir.trim(),
      answer: s1Key.trim(),
      currentProgress: progress,
    });

    if (result.success && (result.status === 'correct' || result.status === 'already_solved')) {
      tacticalAudio.playSuccess();
      const nowIso = new Date().toISOString();
      const scoreBreakdown = calculateStageScore(1, nowIso);
      const awardedPoints = result.pointsEarned ?? scoreBreakdown.totalScore;

      // Check if Stage 2 is accessible right now (e.g. testing override)
      const nextCompleted = Math.max(progress.stagesCompleted, 1);
      const isNextAccessible = isStageAccessible(2, nextCompleted, new Date(), Boolean(progress.hasStageOverride));

      setTerminalLogs((prev) => [
        ...prev,
        '[AUTH CONFIRMED] // CHECKSUM PASSED',
        '> DIRECTORY RESOLVED & VERIFIED [ARCHIVAL B]',
        '> MASTER KEY ACCEPTED',
        '-------------------------------------------------------',
        isNextAccessible
          ? '[CLEARANCE GRANTED] STAGE 01 CLEARED // STAGE 02 UNLOCKED'
          : '[CLEARANCE GRANTED] STAGE 01 CLEARED // STAGE 02 TIMELOCKED',
        `> AWARDED: +${awardedPoints} MERIT POINTS`,
        isNextAccessible
          ? '> NEW EVIDENCE UNLOCKED: Photographic Negatives (#74-17, #69-0715, #1026-69, #1127-69)'
          : '> Case Sector 02 docket files unlock on scheduled release timetable (or the following calendar day at 00:00 IST).',
      ]);

      if (onUpdateProgress) {
        onUpdateProgress((prev) => {
          const nextScores = {
            ...prev.stageScores,
            1: awardedPoints,
          };
          const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);
          const nextActive = isNextAccessible ? Math.max(prev.activeStage, 2) : 1;
          const nextUnlocked = isNextAccessible
            ? Array.from(new Set([...prev.unlockedEvidenceIds, 'EV-0201', 'EV-0202', 'EV-0203', 'EV-0204']))
            : prev.unlockedEvidenceIds;

          return {
            ...prev,
            activeStage: nextActive,
            stagesCompleted: nextCompleted,
            unlockedEvidenceIds: nextUnlocked,
            solvedChallengeKeys: Array.from(new Set([...prev.solvedChallengeKeys, 'gate_zk_login'])),
            stageScores: nextScores,
            stageSolveTimestamps: {
              ...prev.stageSolveTimestamps,
              1: nowIso,
            },
            stageScoringEligible: {
              ...prev.stageScoringEligible,
              1: scoreBreakdown.scoringEligible,
            },
            score: totalScore,
            tasksCompleted: prev.tasksCompleted + 1,
            status: 'IN PROGRESS',
          };
        });
      }
    } else {
      tacticalAudio.playError();
      setTerminalLogs((prev) => [
        ...prev,
        '[ACCESS DENIED] // 403 REJECTED: CHECKSUM MISMATCH',
        result.message || 'ERROR: Credentials do not match the archival registry.',
        'Cross-reference the catalogued correspondence in the Evidence Room to recover the required sequence.',
      ]);
    }
    setIsProcessing(false);
  };

  // Stage 2 Submission
  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const trimmed = s2Coord.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    setTerminalLogs((prev) => [
      ...prev,
      `> SUBMIT STAGE 02 DECRYPTION: "${trimmed}"`,
      '> EXECUTING ALPHABET-TO-NUMBER CONVERSION MATRIX...',
    ]);

    const result = await submitChallengeAnswer({
      callSign: progress.callSign,
      challengeKey: 'stage2_coords',
      answer: trimmed,
      currentProgress: progress,
    });

    if (result.success && (result.status === 'correct' || result.status === 'already_solved')) {
      tacticalAudio.playSuccess();
      const nowIso = new Date().toISOString();
      const scoreBreakdown = calculateStageScore(2, nowIso);
      const awardedPoints = result.pointsEarned ?? scoreBreakdown.totalScore;

      const nextCompleted = Math.max(progress.stagesCompleted, 2);
      const isNextAccessible = isStageAccessible(3, nextCompleted, new Date(), Boolean(progress.hasStageOverride));

      setTerminalLogs((prev) => [
        ...prev,
        '[DECRYPTION VERIFIED] // COORDINATE PARITY CONFIRMED',
        '> DECIMAL COORDINATES MATCH ARCHIVAL NEGATIVES',
        '-------------------------------------------------------',
        '> CADASTRAL SURVEY RESOLVED: RESIDENTIAL PARCEL IDENTIFIED',
        '> ACCESS GRANTED TO CASE DOSSIER CAS-017',
        '-------------------------------------------------------',
        isNextAccessible
          ? '[CLEARANCE GRANTED] STAGE 02 CLEARED // STAGE 03 UNLOCKED'
          : '[CLEARANCE GRANTED] STAGE 02 CLEARED // STAGE 03 TIMELOCKED',
        `> AWARDED: +${awardedPoints} MERIT POINTS`,
        isNextAccessible
          ? '> NEW EVIDENCE UNLOCKED: Witness Statement CAS-017 & Survey Map'
          : '> Case Sector 03 docket files unlock on scheduled release timetable.',
      ]);

      if (onUpdateProgress) {
        onUpdateProgress((prev) => {
          const nextCompleted = Math.max(prev.stagesCompleted, 2);
          const isNextAccessible = isStageAccessible(3, nextCompleted, new Date(), Boolean(prev.hasStageOverride));
          const nextActive = isNextAccessible ? Math.max(prev.activeStage, 3) : 2;
          const nextUnlocked = isNextAccessible
            ? Array.from(new Set([...prev.unlockedEvidenceIds, 'CAS-017', 'EV-0301']))
            : prev.unlockedEvidenceIds;

          const nextScores = {
            ...prev.stageScores,
            2: awardedPoints,
          };
          const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

          return {
            ...prev,
            activeStage: nextActive,
            stagesCompleted: nextCompleted,
            stage2DeductionSolved: true,
            unlockedEvidenceIds: nextUnlocked,
            solvedChallengeKeys: Array.from(new Set([...prev.solvedChallengeKeys, 'stage2_coords'])),
            stageScores: nextScores,
            stageSolveTimestamps: {
              ...prev.stageSolveTimestamps,
              2: nowIso,
            },
            stageScoringEligible: {
              ...prev.stageScoringEligible,
              2: scoreBreakdown.scoringEligible,
            },
            score: totalScore,
            tasksCompleted: prev.tasksCompleted + 1,
          };
        });
      }
    } else {
      tacticalAudio.playError();
      setTerminalLogs((prev) => [
        ...prev,
        '[DECRYPTION REJECTED] // 403 INVALID COORDINATE STREAM',
        result.message || 'ERROR: Decimal coordinate verification failed.',
        'Inspect the four photographic negatives in the Evidence Room and decode the letter-to-number telemetry sequence.',
      ]);
    }
    setIsProcessing(false);
  };

  // Stage 3 Map Gate Submission
  const handleStage3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const trimmed = s3House.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    setTerminalLogs((prev) => [
      ...prev,
      `> SUBMIT MAP GATE 3 PASSCODE: "${trimmed}"`,
      '> VERIFYING CADASTRAL PROPERTY IDENTIFIER...',
    ]);

    const result = await submitChallengeAnswer({
      callSign: progress.callSign,
      challengeKey: 'gate_map',
      answer: trimmed,
      currentProgress: progress,
    });

    if (result.success && (result.status === 'correct' || result.status === 'already_solved')) {
      tacticalAudio.playSuccess();
      const nowIso = new Date().toISOString();
      const scoreBreakdown = calculateStageScore(3, nowIso);
      const awardedPoints = result.pointsEarned ?? scoreBreakdown.totalScore;
      const nextCompleted = Math.max(progress.stagesCompleted, 3);
      const isNextAccessible = isStageAccessible(4, nextCompleted, new Date(), Boolean(progress.hasStageOverride));

      setTerminalLogs((prev) => [
        ...prev,
        '[AUTHENTICATION CONFIRMED] // CADASTRAL REGISTER VERIFIED',
        '> WITNESS LOCATION CROSS-REFERENCED',
        '> SIGNAL MAP LOCK REMOVED // CARTOGRAPHIC SURVEY SITES DECLASSIFIED',
        `> AWARDED: +${awardedPoints} MERIT POINTS`,
        isNextAccessible
          ? '[CLEARANCE GRANTED] STAGE 03 CLEARED // STAGE 04 TRIANGULATION ACTIVE'
          : '[CLEARANCE GRANTED] STAGE 03 CLEARED // STAGE 04 TIMELOCKED',
      ]);

      if (onUpdateProgress) {
        onUpdateProgress((prev) => {
          const nextCompleted = Math.max(prev.stagesCompleted, 3);
          const isNextAccessible = isStageAccessible(4, nextCompleted, new Date(), Boolean(prev.hasStageOverride));
          const nextActive = isNextAccessible ? Math.max(prev.activeStage, 4) : 3;
          const nextUnlocked = isNextAccessible
            ? Array.from(new Set([...prev.unlockedEvidenceIds, 'EV-0401']))
            : prev.unlockedEvidenceIds;

          const nextScores = {
            ...prev.stageScores,
            3: awardedPoints,
          };
          const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

          return {
            ...prev,
            activeStage: nextActive,
            stagesCompleted: nextCompleted,
            mapGateUnlocked: true,
            unlockedEvidenceIds: nextUnlocked,
            solvedChallengeKeys: Array.from(new Set([...prev.solvedChallengeKeys, 'gate_map'])),
            stageScores: nextScores,
            stageSolveTimestamps: {
              ...prev.stageSolveTimestamps,
              3: nowIso,
            },
            stageScoringEligible: {
              ...prev.stageScoringEligible,
              3: scoreBreakdown.scoringEligible,
            },
            score: totalScore,
            tasksCompleted: prev.tasksCompleted + 1,
          };
        });
      }
    } else {
      tacticalAudio.playError();
      setTerminalLogs((prev) => [
        ...prev,
        '[AUTH REJECTED] // INCORRECT CADASTRAL IDENTIFIER',
        result.message || 'ERROR: Address code mismatch. Cross-reference witness statement CAS-017.',
      ]);
    }
    setIsProcessing(false);
  };

  // Stage 5 Suspect DB Submission
  const handleStage5Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const trimmed = s5Key.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    setTerminalLogs((prev) => [
      ...prev,
      `> SUBMIT SUSPECT DB MASTER KEY: "${trimmed}"`,
      '> VALIDATING BUREAU CREDENTIAL HASH...',
    ]);

    const result = await submitChallengeAnswer({
      callSign: progress.callSign,
      challengeKey: 'gate_suspect_db',
      answer: trimmed,
      currentProgress: progress,
    });

    if (result.success && (result.status === 'correct' || result.status === 'already_solved')) {
      tacticalAudio.playSuccess();
      const nowIso = new Date().toISOString();
      const scoreBreakdown = calculateStageScore(5, nowIso);
      const awardedPoints = result.pointsEarned ?? scoreBreakdown.totalScore;

      setTerminalLogs((prev) => [
        ...prev,
        '[CLEARANCE CONFIRMED] // SUSPECT REPOSITORY DECLASSIFIED',
        '> DOSSIERS UNLOCKED: S-02 (Arthur Leigh Allen), S-03 (Richard Gaikowski)',
        `> AWARDED: +${awardedPoints} MERIT POINTS`,
        '[CLEARANCE GRANTED] STAGE 05 CLEARED // ADVANCING TO STAGE 06',
      ]);

      if (onUpdateProgress) {
        onUpdateProgress((prev) => {
          const nextCompleted = Math.max(prev.stagesCompleted, 5);
          const isNextAccessible = isStageAccessible(6, nextCompleted, new Date(), Boolean(prev.hasStageOverride));
          const nextActive = isNextAccessible ? Math.max(prev.activeStage, 6) : 5;
          const nextUnlocked = isNextAccessible
            ? Array.from(new Set([...prev.unlockedEvidenceIds, 'EV-0502', 'EV-0503', 'EV-0601', 'EV-0602']))
            : prev.unlockedEvidenceIds;

          const nextScores = {
            ...prev.stageScores,
            5: awardedPoints,
          };
          const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

          return {
            ...prev,
            activeStage: nextActive,
            stagesCompleted: nextCompleted,
            suspectDbUnlocked: true,
            unlockedEvidenceIds: nextUnlocked,
            solvedChallengeKeys: Array.from(new Set([...prev.solvedChallengeKeys, 'gate_suspect_db'])),
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
          };
        });
      }
    } else {
      tacticalAudio.playError();
      setTerminalLogs((prev) => [
        ...prev,
        '[AUTH REJECTED] // INVALID SUSPECT DATABASE MASTER KEY',
        result.message || 'ERROR: Authorization key invalid. Consult the SF Chronicle special dispatch in the Evidence Room.',
      ]);
    }
    setIsProcessing(false);
  };

  const isStage1Cleared = progress.stagesCompleted >= 1 || progress.activeStage >= 2;
  const isStage2Cleared = progress.stage2DeductionSolved || progress.stagesCompleted >= 2;
  const isStage3Cleared = progress.mapGateUnlocked || progress.stagesCompleted >= 3;
  const isStage5Cleared = progress.suspectDbUnlocked || progress.stagesCompleted >= 5;

  const isStage1Accessible = isStageAccessible(1, progress.stagesCompleted, new Date(), Boolean(progress.hasStageOverride));
  const isStage2Accessible = isStageAccessible(2, progress.stagesCompleted, new Date(), Boolean(progress.hasStageOverride));
  const isStage3Accessible = isStageAccessible(3, progress.stagesCompleted, new Date(), Boolean(progress.hasStageOverride));
  const isStage5Accessible = isStageAccessible(5, progress.stagesCompleted, new Date(), Boolean(progress.hasStageOverride));

  const content = (
    <div className="bg-[#050806] border-2 border-[#18361f] text-[#4af66f] font-mono text-xs max-w-4xl w-full p-4 sm:p-6 shadow-[0_0_40px_rgba(20,80,30,0.35)] flex flex-col space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#18361f] pb-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
          <h2 className="font-bold tracking-widest text-[#7dfba0] text-sm uppercase m-0">
            CENTRAL INVESTIGATION CLEARANCE TERMINAL // TLS-0017
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={() => {
              tacticalAudio.playButtonClick();
              onClose();
            }}
            className="text-[#4af66f]/60 hover:text-[#4af66f] p-1 cursor-pointer"
            aria-label="Close terminal"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Module Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => {
            tacticalAudio.playButtonClick();
            setActiveModule('stage1');
          }}
          className={`p-2.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
            activeModule === 'stage1'
              ? 'border-emerald-400 bg-[#0e2113] text-[#a5f3bc]'
              : 'border-[#18361f] bg-[#080d09] text-[#4af66f]/70 hover:border-emerald-700'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>MOD 01: ARCHIVE</span>
            {isStage1Cleared && <CheckCircle2 size={12} className="text-emerald-400" />}
          </div>
          <span className="text-[11px] truncate mt-1">Sector 01 Passphrase</span>
        </button>

        <button
          type="button"
          disabled={!isStage2Cleared && !isStage2Accessible}
          onClick={() => {
            if (!isStage2Cleared && !isStage2Accessible) return;
            tacticalAudio.playButtonClick();
            setActiveModule('stage2');
          }}
          className={`p-2.5 border text-left flex flex-col justify-between transition-all ${
            !isStage2Cleared && !isStage2Accessible
              ? 'border-[#132417] bg-[#050806] text-[#4af66f]/30 cursor-not-allowed opacity-60'
              : activeModule === 'stage2'
              ? 'border-emerald-400 bg-[#0e2113] text-[#a5f3bc] cursor-pointer'
              : 'border-[#18361f] bg-[#080d09] text-[#4af66f]/70 hover:border-emerald-700 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>MOD 02: TELEMETRY</span>
            {isStage2Cleared ? (
              <CheckCircle2 size={12} className="text-emerald-400" />
            ) : !isStage2Accessible ? (
              <span className="text-[9px] text-[#4af66f]/40 font-mono">LOCKED</span>
            ) : null}
          </div>
          <span className="text-[11px] truncate mt-1">
            {!isStage2Cleared && !isStage2Accessible ? 'Sealed (Nov 03)' : 'Decoded Coordinates'}
          </span>
        </button>

        <button
          type="button"
          disabled={!isStage3Cleared && !isStage3Accessible}
          onClick={() => {
            if (!isStage3Cleared && !isStage3Accessible) return;
            tacticalAudio.playButtonClick();
            setActiveModule('stage3');
          }}
          className={`p-2.5 border text-left flex flex-col justify-between transition-all ${
            !isStage3Cleared && !isStage3Accessible
              ? 'border-[#132417] bg-[#050806] text-[#4af66f]/30 cursor-not-allowed opacity-60'
              : activeModule === 'stage3'
              ? 'border-emerald-400 bg-[#0e2113] text-[#a5f3bc] cursor-pointer'
              : 'border-[#18361f] bg-[#080d09] text-[#4af66f]/70 hover:border-emerald-700 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>MOD 03: MAP GATE</span>
            {isStage3Cleared ? (
              <CheckCircle2 size={12} className="text-emerald-400" />
            ) : !isStage3Accessible ? (
              <span className="text-[9px] text-[#4af66f]/40 font-mono">LOCKED</span>
            ) : null}
          </div>
          <span className="text-[11px] truncate mt-1">
            {!isStage3Cleared && !isStage3Accessible ? 'Sealed (Nov 05)' : 'Cadastral Passcode'}
          </span>
        </button>

        <button
          type="button"
          disabled={!isStage5Cleared && !isStage5Accessible}
          onClick={() => {
            if (!isStage5Cleared && !isStage5Accessible) return;
            tacticalAudio.playButtonClick();
            setActiveModule('stage5');
          }}
          className={`p-2.5 border text-left flex flex-col justify-between transition-all ${
            !isStage5Cleared && !isStage5Accessible
              ? 'border-[#132417] bg-[#050806] text-[#4af66f]/30 cursor-not-allowed opacity-60'
              : activeModule === 'stage5'
              ? 'border-emerald-400 bg-[#0e2113] text-[#a5f3bc] cursor-pointer'
              : 'border-[#18361f] bg-[#080d09] text-[#4af66f]/70 hover:border-emerald-700 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>MOD 05: SUSPECTS</span>
            {isStage5Cleared ? (
              <CheckCircle2 size={12} className="text-emerald-400" />
            ) : !isStage5Accessible ? (
              <span className="text-[9px] text-[#4af66f]/40 font-mono">LOCKED</span>
            ) : null}
          </div>
          <span className="text-[11px] truncate mt-1">
            {!isStage5Cleared && !isStage5Accessible ? 'Sealed (Nov 09)' : 'Master Access Key'}
          </span>
        </button>
      </div>

      {/* Teletype Console Stream */}
      <div className="bg-[#030604] border border-[#142d1a] p-3 sm:p-4 h-48 sm:h-56 overflow-y-auto space-y-1 text-[11px] leading-relaxed shadow-inner font-mono">
        {terminalLogs.map((log, idx) => (
          <div
            key={idx}
            className={`${
              log.includes('[CLEARANCE GRANTED]') || log.includes('[AUTH CONFIRMED]') || log.includes('[DECRYPTION VERIFIED]')
                ? 'text-[#a2ffb8] font-bold'
                : log.includes('[ACCESS DENIED]') || log.includes('ERROR') || log.includes('[AUTH REJECTED]')
                ? 'text-[#ff6b6b]'
                : 'text-[#4af66f]/90'
            }`}
          >
            {log}
          </div>
        ))}
        {isProcessing && (
          <div className="text-emerald-400 animate-pulse">&gt; VERIFYING SECURITY CHECKSUM...</div>
        )}
      </div>

      {/* Active Module Input Form */}
      <div className="p-4 bg-[#070e09] border border-[#18361f]">
        {activeModule === 'stage1' && (
          <form onSubmit={handleStage1Submit} className="space-y-3">
            <div className="flex items-center justify-between text-[11px] border-b border-[#18361f] pb-2 text-[#7dfba0]">
              <span className="font-bold uppercase">MODULE 01: VAULT SECTOR 01 ARCHIVE CLEARANCE</span>
              <span className={isStage1Cleared ? 'text-emerald-400' : 'text-amber-400'}>
                {isStage1Cleared ? 'STATUS: CLEARED' : 'STATUS: PENDING'}
              </span>
            </div>
            <p className="text-[11px] text-[#7dfba0]/70 m-0">
              Submit the directory call-sign and passphrase recovered from historical correspondence.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#7dfba0] mb-1">
                  ARCHIVE DIRECTORY / CALL-SIGN:
                </label>
                <input
                  type="text"
                  value={s1Dir}
                  onChange={(e) => setS1Dir(e.target.value)}
                  onKeyDown={() => tacticalAudio.playKeypress()}
                  placeholder="Enter directory call-sign..."
                  className="w-full bg-[#030604] border border-[#1e4827] text-[#7dfba0] p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono"
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#7dfba0] mb-1">
                  PASSPHRASE / DECRYPTION KEY:
                </label>
                <input
                  type="text"
                  value={s1Key}
                  onChange={(e) => setS1Key(e.target.value)}
                  onKeyDown={() => tacticalAudio.playKeypress()}
                  placeholder="Enter decryption passphrase..."
                  className="w-full bg-[#030604] border border-[#1e4827] text-[#7dfba0] p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono"
                  disabled={isProcessing}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isProcessing || !s1Dir.trim() || !s1Key.trim()}
                className="button bg-[#1b3b22] hover:bg-[#23502d] text-[#e3f7e6] border border-[#3e784c] text-xs font-mono py-2 px-4 font-bold disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? 'Verifying...' : 'Authenticate Sector 01 Clearance'}
              </button>
            </div>
          </form>
        )}

        {activeModule === 'stage2' && (
          <form onSubmit={handleStage2Submit} className="space-y-3">
            <div className="flex items-center justify-between text-[11px] border-b border-[#18361f] pb-2 text-[#7dfba0]">
              <span className="font-bold uppercase">MODULE 02: OPTICAL TELEMETRY COORDINATE DECRYPTION</span>
              <span className={isStage2Cleared ? 'text-emerald-400' : 'text-amber-400'}>
                {isStage2Cleared ? 'STATUS: CLEARED' : 'STATUS: PENDING'}
              </span>
            </div>
            <p className="text-[11px] text-[#7dfba0]/70 m-0">
              Submit the decimal latitude and longitude coordinates decoded from photographic negative telemetry.
            </p>
            <div>
              <label className="block text-[10px] uppercase text-[#7dfba0] mb-1">
                DECODED DECIMAL COORDINATES (LATITUDE, LONGITUDE):
              </label>
              <input
                type="text"
                value={s2Coord}
                onChange={(e) => setS2Coord(e.target.value)}
                onKeyDown={() => tacticalAudio.playKeypress()}
                placeholder="e.g. 37.XXXXX, -122.XXXXX"
                className="w-full bg-[#030604] border border-[#1e4827] text-[#7dfba0] p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono"
                disabled={isProcessing}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isProcessing || !s2Coord.trim()}
                className="button bg-[#1b3b22] hover:bg-[#23502d] text-[#e3f7e6] border border-[#3e784c] text-xs font-mono py-2 px-4 font-bold disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? 'Verifying...' : 'Validate Coordinate Parity'}
              </button>
            </div>
          </form>
        )}

        {activeModule === 'stage3' && (
          <form onSubmit={handleStage3Submit} className="space-y-3">
            <div className="flex items-center justify-between text-[11px] border-b border-[#18361f] pb-2 text-[#7dfba0]">
              <span className="font-bold uppercase">MODULE 03: SIGNAL MAP SECURITY GATE PASSCODE</span>
              <span className={isStage3Cleared ? 'text-emerald-400' : 'text-amber-400'}>
                {isStage3Cleared ? 'STATUS: CLEARED' : 'STATUS: PENDING'}
              </span>
            </div>
            <p className="text-[11px] text-[#7dfba0]/70 m-0">
              Enter the 4-digit residential address derived from the Presidio coordinate deduction to unlock the Cartographic Map.
            </p>
            <div>
              <label className="block text-[10px] uppercase text-[#7dfba0] mb-1">
                RESIDENCE HOUSE PASSCODE:
              </label>
              <input
                type="text"
                value={s3House}
                onChange={(e) => setS3House(e.target.value)}
                onKeyDown={() => tacticalAudio.playKeypress()}
                placeholder="Enter 4-digit house number..."
                maxLength={8}
                className="w-full bg-[#030604] border border-[#1e4827] text-[#7dfba0] p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono"
                disabled={isProcessing}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isProcessing || !s3House.trim()}
                className="button bg-[#1b3b22] hover:bg-[#23502d] text-[#e3f7e6] border border-[#3e784c] text-xs font-mono py-2 px-4 font-bold disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? 'Verifying...' : 'Unlock Cartographic Signal Map'}
              </button>
            </div>
          </form>
        )}

        {activeModule === 'stage5' && (
          <form onSubmit={handleStage5Submit} className="space-y-3">
            <div className="flex items-center justify-between text-[11px] border-b border-[#18361f] pb-2 text-[#7dfba0]">
              <span className="font-bold uppercase">MODULE 05: SUSPECT DATABASE MASTER CLEARANCE</span>
              <span className={isStage5Cleared ? 'text-emerald-400' : 'text-amber-400'}>
                {isStage5Cleared ? 'STATUS: CLEARED' : 'STATUS: PENDING'}
              </span>
            </div>
            <p className="text-[11px] text-[#7dfba0]/70 m-0">
              Submit the master access key to declassify confidential suspect dossiers.
            </p>
            <div>
              <label className="block text-[10px] uppercase text-[#7dfba0] mb-1">
                MASTER CLEARANCE KEY:
              </label>
              <input
                type="text"
                value={s5Key}
                onChange={(e) => setS5Key(e.target.value)}
                onKeyDown={() => tacticalAudio.playKeypress()}
                placeholder="Enter clearance key..."
                className="w-full bg-[#030604] border border-[#1e4827] text-[#7dfba0] p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono uppercase"
                disabled={isProcessing}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isProcessing || !s5Key.trim()}
                className="button bg-[#1b3b22] hover:bg-[#23502d] text-[#e3f7e6] border border-[#3e784c] text-xs font-mono py-2 px-4 font-bold disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? 'Verifying...' : 'Authorize Suspect Database Access'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[10px] text-[#4af66f]/70 border-t border-[#18361f]">
        <span>ALL CREDENTIAL TRANSMISSIONS LOGGED UNDER CAD-017 AUDIT</span>
        <button
          type="button"
          onClick={() => {
            tacticalAudio.playButtonClick();
            navigate('/evidence');
          }}
          className="text-[#a5f3bc] hover:underline flex items-center gap-1 cursor-pointer font-bold"
        >
          <FolderOpen size={12} />
          <span>Return to Evidence Room</span>
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4">
      {content}
    </div>
  );
}
