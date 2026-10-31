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
import { calculateStageScore } from '@/src/lib/stageConfig';
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
  const handleStage1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setTerminalLogs((prev) => [
      ...prev,
      `> SUBMIT STAGE 01 AUTH: [DIR: ${s1Dir.trim()}] [KEY: ******]`,
      '> VALIDATING SHA-256 SECTOR PARITY AGAINST ARCHIVAL REGISTRY...',
    ]);

    setTimeout(() => {
      const cleanDir = s1Dir.trim().toLowerCase().replace(/[\s_-]+/g, '');
      const cleanKey = s1Key.trim().toLowerCase().replace(/[\s_-]+/g, '');

      // Accepted directory formats: zkcase, zcase, zk
      const isDirValid = cleanDir === 'zkcase' || cleanDir === 'zk' || cleanDir === 'zcase';
      // Accepted password formats: case17, 17
      const isKeyValid = cleanKey === 'case17' || cleanKey === '17';

      if (isDirValid && isKeyValid) {
        tacticalAudio.playSuccess();
        const nowIso = new Date().toISOString();
        const scoreBreakdown = calculateStageScore(1, nowIso);

        setTerminalLogs((prev) => [
          ...prev,
          '[AUTH CONFIRMED] // CHECKSUM 0x9AF4 PASSED',
          '> DIRECTORY RESOLVED & VERIFIED [ARCHIVAL B]',
          '> MASTER KEY ACCEPTED',
          '-------------------------------------------------------',
          '[CLEARANCE GRANTED] STAGE 01 CLEARED // STAGE 02 UNLOCKED',
          `> AWARDED: +${scoreBreakdown.totalScore} MERIT POINTS`,
          '> NEW EVIDENCE UNLOCKED IN EVIDENCE ROOM: Photographic Negatives (#74-17, #69-0715, #1026-69, #1127-69)',
        ]);

        if (onUpdateProgress) {
          onUpdateProgress((prev) => {
            const nextActive = Math.max(prev.activeStage, 2);
            const nextCompleted = Math.max(prev.stagesCompleted, 1);
            const nextUnlocked = Array.from(
              new Set([
                ...prev.unlockedEvidenceIds,
                'EV-0201',
                'EV-0202',
                'EV-0203',
                'EV-0204',
              ])
            );
            const nextScores = {
              ...prev.stageScores,
              1: scoreBreakdown.totalScore,
            };
            const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

            return {
              ...prev,
              activeStage: nextActive,
              stagesCompleted: nextCompleted,
              unlockedEvidenceIds: nextUnlocked,
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
          'ERROR: Credentials do not match the archival registry.',
          'Cross-reference the catalogued correspondence in the Evidence Room to recover the required sequence.',
        ]);
      }
      setIsProcessing(false);
    }, 600);
  };

  // Stage 2 Submission
  const handleStage2Submit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      const clean = trimmed.toLowerCase().replace(/[\s\(\)°nw,]/g, '');

      // Check if user accidentally entered the house number rather than coordinates
      const isAccidentalHouse = clean === '3893' || clean === 'house3893';

      if (isAccidentalHouse) {
        tacticalAudio.playError();
        setTerminalLogs((prev) => [
          ...prev,
          '[TELEMETRY INPUT MISMATCH] // COORDINATES REQUIRED FIRST',
          'Notice: House 3893 is the derived residential address, but this terminal validates the photographic decimal coordinates decoded from the telemetry string.',
          'Required coordinate format: 37.78874, -122.45709',
        ]);
        setIsProcessing(false);
        return;
      }

      // Valid coordinates: Latitude 37.78874, Longitude -122.45709
      const hasLat = clean.includes('37.78874');
      const hasLong = clean.includes('122.45709') || clean.includes('-122.45709');
      const isCoordMatch = hasLat && hasLong;
      const isPartialCoord = clean === '37.78874-122.45709' || clean === '37.78874122.45709' || (hasLat && clean.length <= 15);

      if (isCoordMatch || isPartialCoord) {
        tacticalAudio.playSuccess();
        const nowIso = new Date().toISOString();
        const scoreBreakdown = calculateStageScore(2, nowIso);

        setTerminalLogs((prev) => [
          ...prev,
          '[DECRYPTION VERIFIED] // COORDINATE PARITY CONFIRMED',
          '> LATITUDE RESOLVED:  37.78874° N',
          '> LONGITUDE RESOLVED: -122.45709° W',
          '-------------------------------------------------------',
          '> CADASTRAL SURVEY MATCH: RESIDENTIAL PARCEL #3893',
          '> DISCLOSED ADDRESS: 3893 WASHINGTON STREET (PRESIDIO HEIGHTS)',
          '> DISCLOSED SECURITY PASSCODE FOR MAP GATE 3: 3893',
          '-------------------------------------------------------',
          '[CLEARANCE GRANTED] STAGE 02 CLEARED // STAGE 03 AVAILABLE',
          `> AWARDED: +${scoreBreakdown.totalScore} MERIT POINTS`,
          '> USE PASSCODE 3893 TO UNLOCK THE REGIONAL SIGNAL MAP',
        ]);

        if (onUpdateProgress) {
          onUpdateProgress((prev) => {
            const nextActive = Math.max(prev.activeStage, 3);
            const nextCompleted = Math.max(prev.stagesCompleted, 2);
            const nextUnlocked = Array.from(
              new Set([...prev.unlockedEvidenceIds, 'CAS-017', 'EV-0301'])
            );
            const nextScores = {
              ...prev.stageScores,
              2: scoreBreakdown.totalScore,
            };
            const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

            return {
              ...prev,
              activeStage: nextActive,
              stagesCompleted: nextCompleted,
              stage2DeductionSolved: true,
              unlockedEvidenceIds: nextUnlocked,
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
          'ERROR: Decimal latitude/longitude mismatch.',
          'Inspect the four photographic negatives in the Evidence Room and decode the telemetry notation.',
        ]);
      }
      setIsProcessing(false);
    }, 600);
  };

  // Stage 3 Map Gate Submission
  const handleStage3Submit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      const clean = trimmed.replace(/\D/g, '');
      if (clean === '3893') {
        tacticalAudio.playSuccess();
        const nowIso = new Date().toISOString();
        const scoreBreakdown = calculateStageScore(3, nowIso);

        setTerminalLogs((prev) => [
          ...prev,
          '[AUTHENTICATION CONFIRMED] // CADASTRAL REGISTER VERIFIED',
          '> LOCATION: 3893 WASHINGTON STREET, PRESIDIO HEIGHTS',
          '> SIGNAL MAP LOCK REMOVED // CARTOGRAPHIC SURVEY SITES DECLASSIFIED',
          `> AWARDED: +${scoreBreakdown.totalScore} MERIT POINTS`,
          '[CLEARANCE GRANTED] STAGE 03 CLEARED // STAGE 04 TRIANGULATION ACTIVE',
        ]);

        if (onUpdateProgress) {
          onUpdateProgress((prev) => {
            const nextActive = Math.max(prev.activeStage, 4);
            const nextCompleted = Math.max(prev.stagesCompleted, 3);
            const nextUnlocked = Array.from(
              new Set([...prev.unlockedEvidenceIds, 'EV-0401'])
            );
            const nextScores = {
              ...prev.stageScores,
              3: scoreBreakdown.totalScore,
            };
            const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

            return {
              ...prev,
              activeStage: nextActive,
              stagesCompleted: nextCompleted,
              mapGateUnlocked: true,
              unlockedEvidenceIds: nextUnlocked,
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
          '[AUTH REJECTED] // INCORRECT CADASTRAL HOUSE NUMBER',
          'Notice: Enter the 4-digit residential address derived from the Stage 2 coordinate telemetry.',
        ]);
      }
      setIsProcessing(false);
    }, 600);
  };

  // Stage 5 Suspect DB Submission
  const handleStage5Submit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      const clean = trimmed.toUpperCase().replace(/[\s_-]+/g, '');
      const isValid = clean === 'Z408REOPENED' || clean === 'Z408' || clean === 'SEVENMARKS';

      if (isValid) {
        tacticalAudio.playSuccess();
        const nowIso = new Date().toISOString();
        const scoreBreakdown = calculateStageScore(5, nowIso);

        setTerminalLogs((prev) => [
          ...prev,
          '[CLEARANCE CONFIRMED] // SUSPECT REPOSITORY DECLASSIFIED',
          '> DOSSIERS UNLOCKED: S-02 (Arthur Leigh Allen), S-03 (Richard Gaikowski)',
          `> AWARDED: +${scoreBreakdown.totalScore} MERIT POINTS`,
          '[CLEARANCE GRANTED] STAGE 05 CLEARED // ADVANCING TO STAGE 06',
        ]);

        if (onUpdateProgress) {
          onUpdateProgress((prev) => {
            const nextActive = Math.max(prev.activeStage, 6);
            const nextCompleted = Math.max(prev.stagesCompleted, 5);
            const nextUnlocked = Array.from(
              new Set([...prev.unlockedEvidenceIds, 'EV-0502', 'EV-0503', 'EV-0601', 'EV-0602'])
            );
            const nextScores = {
              ...prev.stageScores,
              5: scoreBreakdown.totalScore,
            };
            const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

            return {
              ...prev,
              activeStage: nextActive,
              stagesCompleted: nextCompleted,
              suspectDbUnlocked: true,
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
            };
          });
        }
      } else {
        tacticalAudio.playError();
        setTerminalLogs((prev) => [
          ...prev,
          '[AUTH REJECTED] // INVALID SUSPECT DATABASE MASTER KEY',
          'ERROR: Key does not match the Bureau index.',
        ]);
      }
      setIsProcessing(false);
    }, 600);
  };

  const isStage1Cleared = progress.stagesCompleted >= 1 || progress.activeStage >= 2;
  const isStage2Cleared = progress.stage2DeductionSolved || progress.stagesCompleted >= 2;
  const isStage3Cleared = progress.mapGateUnlocked || progress.stagesCompleted >= 3;
  const isStage5Cleared = progress.suspectDbUnlocked || progress.stagesCompleted >= 5;

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
          onClick={() => {
            tacticalAudio.playButtonClick();
            setActiveModule('stage2');
          }}
          className={`p-2.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
            activeModule === 'stage2'
              ? 'border-emerald-400 bg-[#0e2113] text-[#a5f3bc]'
              : 'border-[#18361f] bg-[#080d09] text-[#4af66f]/70 hover:border-emerald-700'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>MOD 02: TELEMETRY</span>
            {isStage2Cleared && <CheckCircle2 size={12} className="text-emerald-400" />}
          </div>
          <span className="text-[11px] truncate mt-1">Decoded Coordinates</span>
        </button>

        <button
          type="button"
          onClick={() => {
            tacticalAudio.playButtonClick();
            setActiveModule('stage3');
          }}
          className={`p-2.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
            activeModule === 'stage3'
              ? 'border-emerald-400 bg-[#0e2113] text-[#a5f3bc]'
              : 'border-[#18361f] bg-[#080d09] text-[#4af66f]/70 hover:border-emerald-700'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>MOD 03: MAP GATE</span>
            {isStage3Cleared && <CheckCircle2 size={12} className="text-emerald-400" />}
          </div>
          <span className="text-[11px] truncate mt-1">Cadastral Passcode</span>
        </button>

        <button
          type="button"
          onClick={() => {
            tacticalAudio.playButtonClick();
            setActiveModule('stage5');
          }}
          className={`p-2.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
            activeModule === 'stage5'
              ? 'border-emerald-400 bg-[#0e2113] text-[#a5f3bc]'
              : 'border-[#18361f] bg-[#080d09] text-[#4af66f]/70 hover:border-emerald-700'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span>MOD 05: SUSPECTS</span>
            {isStage5Cleared && <CheckCircle2 size={12} className="text-emerald-400" />}
          </div>
          <span className="text-[11px] truncate mt-1">Master Access Key</span>
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
                placeholder="e.g. 37.78874, -122.45709"
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
