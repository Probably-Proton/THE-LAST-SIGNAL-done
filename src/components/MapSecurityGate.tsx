/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * STAGE 3 — MAP SECURITY GATE (GATE_MAP)
 * 
 * Requires validation of the target house number (House 3893)
 * before revealing the 1974 Northern California Cartographic Survey Map.
 */

import React, { useState } from 'react';
import { Lock, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { calculateStageScore } from '@/src/lib/stageConfig';
import type { UserProgress } from '@/src/lib/prototypeAuth';

interface MapSecurityGateProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onUnlocked?: () => void;
}

export function MapSecurityGate({
  progress,
  onUpdateProgress,
  onUnlocked,
}: MapSecurityGateProps) {
  const [houseInput, setHouseInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'REGIONAL SURVEY CARTOGRAPHY // SECURITY PERIMETER GATE_MAP',
    'SURVEY CHART: 1974-NORCAL-TRIANGULATION',
    'ACCESS CLASSIFICATION: RESTRICTED ARCHIVAL SURVEY',
    'AUTHENTICATION REQUIREMENT: RESIDENTIAL HOUSE NUMBER CONFIRMED BY WITNESS CAS-017',
    'Enter the 4-digit residential address established by witness transcript CAS-017.',
  ]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    const trimmed = houseInput.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    setTerminalOutput((prev) => [
      ...prev,
      `> SUBMIT HOUSE NUMBER: "${trimmed}"`,
      '> CROSS-REFERENCING CAS-017 WITNESS TESTIMONY & CADASTRE...',
    ]);

    setTimeout(() => {
      // Normalize: remove whitespace, non-digits
      const cleanDigits = trimmed.replace(/\D/g, '');
      const isMatch = cleanDigits === '3893';

      if (isMatch) {
        tacticalAudio.playSuccess();
        const nowIso = new Date().toISOString();
        const scoreBreakdown = calculateStageScore(3, nowIso);

        setTerminalOutput((prev) => [
          ...prev,
          '[SECURITY GATE CLEARED] // HOUSE 3893 CONFIRMED',
          '> LOCATION REGISTERED: 3893 WASHINGTON STREET (PRESIDIO HEIGHTS)',
          '> WITNESS CORROBORATION: MRS. ELEANOR GABLE STATEMENT VALIDATED',
          '> GEOMETRIC CARTOGRAPHY VECTOR ESTABLISHED',
          '-------------------------------------------------------',
          `[STAGE 03 CLEARED] MERIT AWARDED: +${scoreBreakdown.totalScore} PTS`,
          scoreBreakdown.scoringEligible
            ? `(100 Base + ${scoreBreakdown.hourlyBonus} Hourly Speed Bonus)`
            : '(Late solve: 0 competitive points awarded)',
          '> 4 REGIONAL SURVEY SITES UNLOCKED ON CARTOGRAPHIC CHART',
          '> STAGE 04 RECORDING UNLOCKED: EV-0401 (Recovered Audio Cassette)',
          '> KILLER 24-HOUR CHALLENGE WINDOW ACTIVATED',
        ]);

        setTimeout(() => {
          onUpdateProgress((prev) => {
            const nextCompleted = Math.max(prev.stagesCompleted, 3);
            const nextActive = Math.max(prev.activeStage, 4);
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
              mapGateUnlocked: true,
              stagesCompleted: nextCompleted,
              activeStage: nextActive,
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
              status: 'IN PROGRESS',
            };
          });
          onUnlocked?.();
        }, 1200);
      } else {
        tacticalAudio.playError();
        setTerminalOutput((prev) => [
          ...prev,
          '[GATE ACCESS DENIED] // 401 INVALID HOUSE NUMBER',
          'ERROR: Address does not match witness transcript CAS-017.',
          'Review the verbatim testimony of Mrs. Eleanor Gable on Washington Street (CAS-017).',
          'Enter the 4-digit street number to authenticate access to the survey grid.',
        ]);
      }
      setIsProcessing(false);
    }, 700);
  };

  return (
    <div className="max-w-3xl mx-auto my-8 space-y-6">
      {/* Map Gate Terminal Frame */}
      <div className="bg-[#080d0a] border-2 border-[#1c3a24] text-[#4af66f] font-mono p-6 sm:p-8 shadow-[0_0_40px_rgba(25,75,35,0.4)]">
        <div className="flex items-center justify-between border-b border-[#1c3a24] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-crimson animate-pulse" />
            <div>
              <span className="text-[10px] uppercase text-[#7dfba0]/70 tracking-widest block font-bold">
                DEPARTMENT OF INVESTIGATION // FORENSIC GEOGRAPHY
              </span>
              <h2 className="text-lg text-[#a2ffb8] font-bold tracking-wider mt-0.5">
                CARTOGRAPHIC GATE_MAP // HOUSE VERIFICATION REQUIRED
              </h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-red-950/80 border border-crimson text-crimson font-bold">
            RESTRICTED
          </span>
        </div>

        {/* Terminal Screen Monitor */}
        <div className="bg-[#030604] border border-[#16331e] p-5 h-64 overflow-y-auto space-y-1.5 text-xs leading-relaxed shadow-inner font-mono">
          {terminalOutput.map((line, idx) => (
            <div
              key={idx}
              className={`${
                line.includes('[SECURITY GATE CLEARED]') || line.includes('[STAGE 03 CLEARED]')
                  ? 'text-[#a2ffb8] font-bold'
                  : line.includes('[GATE ACCESS DENIED]') || line.includes('ERROR')
                  ? 'text-[#ff6b6b]'
                  : 'text-[#4af66f]/90'
              }`}
            >
              {line}
            </div>
          ))}
          {isProcessing && (
            <div className="text-emerald-400 animate-pulse">&gt; VERIFYING CADASTRAL ADDRESS DATA...</div>
          )}
        </div>

        {/* Gate Unlock Form */}
        <form onSubmit={handleUnlock} className="mt-6 pt-4 border-t border-[#1c3a24] space-y-4">
          <div className="p-3 bg-[#0d1a10] border border-[#1b3d22] text-xs text-[#8ee5a5] flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="m-0 font-bold">Investigator Directive:</p>
              <p className="m-0 text-[11px] text-[#78c98e]">
                The survey chart contains four active forensic investigation sites.
                To unlock the map quadrant, enter the four-digit house address established by witness transcript
                CAS-017 (Mrs. Eleanor Gable) matching the coordinates recovered in Stage 02.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#7dfba0] mb-1.5 font-bold">
              ENTER RESIDENTIAL HOUSE NUMBER (FROM CAS-017 TESTIMONY):
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={houseInput}
                onChange={(e) => setHouseInput(e.target.value)}
                onKeyDown={() => tacticalAudio.playKeypress()}
                placeholder="Enter 4-digit house number..."
                maxLength={10}
                className="flex-1 bg-[#020503] border-2 border-[#1e4827] text-[#a2ffb8] p-3 text-sm focus:outline-none focus:border-emerald-400 font-mono tracking-widest"
                disabled={isProcessing}
                autoFocus
              />
              <button
                type="submit"
                disabled={isProcessing || !houseInput.trim()}
                className="button bg-[#1b3b22] hover:bg-[#255230] text-[#e3f7e6] border border-[#3e784c] px-6 text-xs font-mono font-bold tracking-wider disabled:opacity-50"
              >
                {isProcessing ? 'Verifying...' : 'Authenticate Gate'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
