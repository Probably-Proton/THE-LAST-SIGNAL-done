/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THE LAST SIGNAL — CINEMATIC SYSTEM FAILURE & CORRUPTION SEQUENCE
 * 
 * Stage 7 Ending Glitch & Post-Ending Transition:
 * 1. Interface freezes briefly with frozen scanlines.
 * 2. Rapid screen flicker with horizontal analog distortion.
 * 3. Layered digital corruption audio bursts and carrier collapse.
 * 4. Staccato tactical red error flashes:
 *    - CONNECTION UNSTABLE
 *    - TRANSMISSION CORRUPTED
 *    - SYSTEM INTEGRITY: FAILED
 *    - SIGNAL LOST
 *    - INVESTIGATION TERMINATED
 * 5. Dynamic fractured cracked-glass screen overlay.
 * 6. CRT phosphor implosion into absolute dead silence.
 * 7. Transitions into persistent Post-Ending Aftermath.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ShieldAlert, AlertTriangle, RefreshCw, XCircle, Radio, Terminal } from 'lucide-react';
import { tacticalAudio } from '../lib/tacticalAudio';

export interface ControlledSystemGlitchProps {
  isActive: boolean;
  reducedScareMode?: boolean;
  onComplete: () => void;
  onDismiss?: () => void;
}

type CorruptionStep =
  | 'idle'
  | 'initial_freeze'       // Step 1: Brief screen freeze (0.8s)
  | 'flicker_tearing'       // Step 2: Screen flickering & horizontal tearing
  | 'flashing_errors'       // Step 3: Rapid flashing of the 5 canonical red error alerts
  | 'cracked_glass'         // Step 4: Fractured glass overlay developing across viewport
  | 'phosphor_collapse'     // Step 5: Screen CRT collapse into white line & dot
  | 'final_system_failure'  // Step 6: Final system failure message
  | 'resolved';

const FLASH_ERRORS = [
  'CONNECTION UNSTABLE',
  'TRANSMISSION CORRUPTED',
  'SYSTEM INTEGRITY: FAILED',
  'SIGNAL LOST',
  'INVESTIGATION TERMINATED',
];

export const ControlledSystemGlitch: React.FC<ControlledSystemGlitchProps> = ({
  isActive,
  reducedScareMode = false,
  onComplete,
  onDismiss,
}) => {
  const [step, setStep] = useState<CorruptionStep>('idle');
  const [errorIndex, setErrorIndex] = useState(0);
  const [flickerIntensity, setFlickerIntensity] = useState(1);
  const [crackSpread, setCrackSpread] = useState(0); // 0 to 1
  const [jitter, setJitter] = useState({
    x: 0,
    y: 0,
    skew: 0,
    rgbSplit: 0,
    barTop: 20,
    barHeight: 30,
  });

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const hasFinishedRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    tacticalAudio.stopAllGlitchSounds();
  }, []);

  const handleBypass = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    clearAllTimers();
    tacticalAudio.playFinalInterruptedTransmission();
    setStep('resolved');
    setTimeout(() => {
      setStep('idle');
      onComplete();
    }, 250);
  }, [clearAllTimers, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Sequence runner
  useEffect(() => {
    if (!isActive) {
      setStep('idle');
      clearAllTimers();
      hasFinishedRef.current = false;
      return;
    }

    hasFinishedRef.current = false;
    clearAllTimers();

    // Prefer-reduced-motion check
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedScareMode || prefersReducedMotion) {
      setStep('final_system_failure');
      tacticalAudio.playGlitchHum();
      const t = setTimeout(() => {
        handleBypass();
      }, 3000);
      timersRef.current.push(t);
      return;
    }

    // Step 1: Initial Freeze (0.8s of eerie static tension)
    setStep('initial_freeze');
    tacticalAudio.playGlitchHum();

    // Step 2: Flicker & Horizontal Distortion Tearing
    const t1 = setTimeout(() => {
      if (hasFinishedRef.current) return;
      setStep('flicker_tearing');
      tacticalAudio.playLayeredDigitalCorruption(0.65, 0.7);

      setJitter({
        x: 8,
        y: -4,
        skew: 2.5,
        rgbSplit: 6,
        barTop: 35,
        barHeight: 50,
      });

      // Step 3: Staccato Red Error Messages Flash Sequence
      const t2 = setTimeout(() => {
        if (hasFinishedRef.current) return;
        setStep('flashing_errors');

        let currentErr = 0;
        const flashNextError = () => {
          if (hasFinishedRef.current) return;
          if (currentErr < FLASH_ERRORS.length) {
            setErrorIndex(currentErr);
            // Play coordinated layered corruption burst for each error
            tacticalAudio.playLayeredDigitalCorruption(0.42, 0.85);

            setJitter({
              x: (Math.random() - 0.5) * 22,
              y: (Math.random() - 0.5) * 12,
              skew: (Math.random() - 0.5) * 6,
              rgbSplit: 8 + Math.random() * 8,
              barTop: Math.floor(Math.random() * 70) + 15,
              barHeight: Math.floor(Math.random() * 80) + 30,
            });

            currentErr += 1;
            const nextDelay = 420; // 420ms per error burst
            const tNextErr = setTimeout(flashNextError, nextDelay);
            timersRef.current.push(tNextErr);
          } else {
            // Step 4: Cracked Glass Fracture Spreads
            if (hasFinishedRef.current) return;
            setStep('cracked_glass');
            setCrackSpread(1);
            tacticalAudio.playLayeredDigitalCorruption(0.7, 1.0);

            // Step 5: CRT Phosphor Collapse & Power Cutoff
            const t4 = setTimeout(() => {
              if (hasFinishedRef.current) return;
              setStep('phosphor_collapse');
              tacticalAudio.playFinalInterruptedTransmission();

              // Step 6: Final System Failure Display
              const t5 = setTimeout(() => {
                if (hasFinishedRef.current) return;
                setStep('final_system_failure');

                // Wait 2.8s for player to absorb the severed transmission, then complete into aftermath
                const t6 = setTimeout(() => {
                  if (hasFinishedRef.current) return;
                  hasFinishedRef.current = true;
                  clearAllTimers();
                  setStep('resolved');
                  setTimeout(() => {
                    setStep('idle');
                    onComplete();
                  }, 200);
                }, 2800);
                timersRef.current.push(t6);
              }, 480);
              timersRef.current.push(t5);
            }, 750);
            timersRef.current.push(t4);
          }
        };

        flashNextError();
      }, 700);
      timersRef.current.push(t2);
    }, 800);
    timersRef.current.push(t1);

    return () => {
      clearAllTimers();
    };
  }, [isActive, reducedScareMode, clearAllTimers, handleBypass, onComplete]);

  // ESC key bypass
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBypass();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleBypass]);

  if (!isActive && step === 'idle') return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black overflow-hidden select-none transition-opacity duration-200 ${
        step === 'resolved' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 1. Global CRT Scanline Shimmer */}
      <div className="absolute inset-0 glitch-scanlines pointer-events-none opacity-60" />

      {/* 2. Horizontal Screen Tearing & Slicing Bars */}
      {(step === 'flicker_tearing' || step === 'flashing_errors' || step === 'cracked_glass') && (
        <>
          <div
            className="absolute inset-x-0 bg-red-600/35 pointer-events-none mix-blend-screen transition-all"
            style={{
              top: `${jitter.barTop}%`,
              height: `${jitter.barHeight}px`,
              filter: 'blur(2px)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none bg-red-950/40 mix-blend-color-dodge animate-pulse"
          />
        </>
      )}

      {/* 3. Cracked Glass Vector Overlay */}
      {(step === 'cracked_glass' || step === 'phosphor_collapse' || crackSpread > 0) && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-30 transition-opacity duration-300 opacity-90 mix-blend-screen"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          {/* Main fracture spider center */}
          <circle cx="500" cy="460" r="14" fill="#ffffff" opacity="0.8" />
          <path
            d="M500,460 L120,80 M500,460 L850,110 M500,460 L920,820 M500,460 L60,890 M500,460 L480,20 M500,460 L520,980 M500,460 L240,420 M500,460 L780,510"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Secondary branching crack shards */}
          <path
            d="M310,270 L280,180 L190,140 M675,285 L740,210 L810,240 M710,640 L800,680 L890,620 M270,675 L210,720 L110,690 M490,240 L430,170 M510,720 L570,810 L630,860"
            stroke="#e0e0e0"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M420,380 L380,450 L340,390 M580,390 L620,440 L660,380 M440,540 L480,600 L540,560"
            stroke="#b0b0b0"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      )}

      {/* 4. Flashing Red Error Messages Step */}
      {step === 'flashing_errors' && (
        <div
          style={{
            transform: `translate(${jitter.x}px, ${jitter.y}px) skewX(${jitter.skew}deg)`,
            textShadow: `${jitter.rgbSplit}px 0 0 rgba(255,0,0,0.8), -${jitter.rgbSplit}px 0 0 rgba(0,255,255,0.8)`,
          }}
          className="relative z-20 px-8 py-6 bg-red-950/80 border-2 border-red-500 shadow-[0_0_80px_rgba(230,0,0,0.8)] text-center max-w-lg w-full mx-4"
        >
          <div className="flex items-center justify-center gap-2 mb-3 text-red-400 font-mono text-xs uppercase tracking-widest">
            <ShieldAlert size={18} className="animate-ping" />
            <span>CRITICAL HARDWARE MALFUNCTION</span>
          </div>
          <h2 className="font-mono text-2xl sm:text-3xl font-black text-white tracking-widest uppercase">
            [{FLASH_ERRORS[errorIndex]}]
          </h2>
          <div className="mt-3 font-mono text-[10px] text-red-300/80 tracking-wider">
            SECTOR 17 // AUDIO CARRIER SEVERED // PARITY REJECTED
          </div>
        </div>
      )}

      {/* 5. CRT Phosphor Collapse Animation */}
      {step === 'phosphor_collapse' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 bg-black">
          <div className="w-full h-[2px] bg-white animate-pulse shadow-[0_0_20px_#ffffff]" />
        </div>
      )}

      {/* 6. Step 6: Final System Failure Terminal Card */}
      {step === 'final_system_failure' && (
        <div className="relative z-30 max-w-xl w-full mx-4 p-8 bg-[#090807] border border-red-800 shadow-[0_0_90px_rgba(180,20,20,0.6)] text-center">
          <div className="flex items-center justify-between border-b border-red-900/50 pb-3 mb-6 font-mono text-xs text-red-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              <span>TERMINAL STATUS: SIGNAL LOST</span>
            </div>
            <span>OFFICIAL RECORD</span>
          </div>

          <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4" />

          <h1 className="font-serif text-3xl sm:text-4xl text-[#f3eee5] font-light tracking-wide mb-3">
            Transmission Terminated
          </h1>

          <p className="font-mono text-xs sm:text-sm text-red-300 tracking-wider mb-6 leading-relaxed">
            SYSTEM INTEGRITY COLLAPSED. ALL AUDIO CARRIERS ARE SILENT.
            <br />
            THE ARCHIVAL INVESTIGATION IS OFFICIALLY CONCLUDED.
          </p>

          <div className="p-3 bg-[#0d0a09] border border-stone-800 font-mono text-[11px] text-stone-400 mb-6 text-left space-y-1">
            <div className="flex justify-between">
              <span>DISPATCH REPOSITORY:</span>
              <span className="text-red-400 font-bold">EMBARGO PERMANENT</span>
            </div>
            <div className="flex justify-between">
              <span>INVESTIGATION STANDINGS:</span>
              <span className="text-[#8bb393]">LOCKED ON RECORD</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleBypass}
              className="button button-primary px-6 py-2.5 font-mono text-xs tracking-widest"
            >
              PROCEED TO AFTERMATH DOSSIER →
            </button>
          </div>
        </div>
      )}

      {/* Step 1 & 2 Center Freeze Notice */}
      {(step === 'initial_freeze' || step === 'flicker_tearing') && (
        <div className="relative z-20 text-center font-mono text-xs text-stone-400 uppercase tracking-widest animate-pulse">
          <Radio size={24} className="mx-auto mb-2 text-red-400" />
          <span>RECEIVER BUFFER EXHAUSTED...</span>
        </div>
      )}

      {/* Bottom Emergency Skip / Escape */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center z-50">
        <button
          onClick={handleBypass}
          className="text-[10px] font-mono text-stone-600 hover:text-stone-300 tracking-widest uppercase transition-colors px-3 py-1 bg-black/60 border border-stone-800"
        >
          [ESC] Bypass Malfunction
        </button>
      </div>
    </div>
  );
};
