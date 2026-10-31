/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ATMOSPHERIC GAME LAUNCH SCREEN (Midnight 1 November 2026 IST)
 * 
 * Displayed to registered student investigators prior to the official
 * game launch at 12:00 AM IST on 1 November 2026.
 * 
 * Features:
 * - High-aesthetic classified mystery presentation (not a generic spinner).
 * - Live drift-free countdown to midnight launch.
 * - Radio frequency carrier oscilloscope & subtle transmission interference.
 * - Restrained status indicators: INITIALIZING TRANSMISSION & AWAITING SIGNAL.
 * - Automatic transition into the live game dashboard at launch.
 * - Responsive on mobile and desktop.
 * - Rechecks launch state immediately when tab becomes active again.
 * - Operative dossier identification with logout option.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Clock3,
  Compass,
  FileText,
  Key,
  Lock,
  LogOut,
  Radio,
  ShieldAlert,
  Sparkles,
  Terminal,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';

import {
  GAME_LAUNCH_ISO,
  GAME_LAUNCH_IST,
  formatToIST,
  getCountdownBreakdown,
  isGameLaunched,
  type CountdownBreakdown,
} from '@/src/lib/stageConfig';

import { tacticalAudio, type TacticalAudioState } from '@/src/lib/tacticalAudio';
import { CASE_ID } from '@/src/lib/mockData';
import type { PrototypeUser } from '@/src/lib/prototypeAuth';

interface GameLaunchScreenProps {
  user: PrototypeUser;
  onLogout: () => void;
  onLaunch: () => void;
}

const TELEMETRY_MESSAGES = [
  'INITIALIZING TRANSMISSION ARCHIVE // SECTOR 17 FREQUENCY',
  'AWAITING SIGNAL FROM MOUNT DAVIDSON MAST... CARRIER INERT',
  'RADIO SILENCE ENFORCED BY THE OFFICE OF THE DIRECTOR',
  'ALL SEVEN EVIDENCE TIERS ENCRYPTED UNDER HIGH-SECURITY CIPHERS',
  'RECEPTOR FREQUENCY 408.000 MHz ACTIVE — STANDBY FOR DISPATCH',
  'AUTOMATIC TELEMETRY LOCK SCHEDULED FOR 01 NOV 2026 00:00:00 IST',
];

export function GameLaunchScreen({ user, onLogout, onLaunch }: GameLaunchScreenProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [audioState, setAudioState] = useState<TacticalAudioState>(() => tacticalAudio.getState());
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const hasTriggeredLaunchRef = useRef(false);

  // Subscribe to tactical audio state
  useEffect(() => {
    return tacticalAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  // Atmospheric audio profile
  useEffect(() => {
    tacticalAudio.setLocationProfile('audio_investigation');
  }, []);

  // Telemetry message cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryIndex((prev) => (prev + 1) % TELEMETRY_MESSAGES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  // Live countdown loop with drift prevention & tab visibility / focus listeners
  useEffect(() => {
    const checkLaunch = () => {
      const currentDate = new Date();
      setNow(currentDate);

      if (isGameLaunched(currentDate) && !hasTriggeredLaunchRef.current) {
        hasTriggeredLaunchRef.current = true;
        setIsUnlocking(true);
        tacticalAudio.playSuccess();
        setTimeout(() => {
          tacticalAudio.playGlitchPulse();
        }, 300);

        setTimeout(() => {
          onLaunch();
        }, 1100);
      }
    };

    // Fast 250ms tick catches midnight exactly without visual lag
    const interval = setInterval(checkLaunch, 250);

    const handleFocusOrVisible = () => {
      checkLaunch();
    };

    document.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
    };
  }, [onLaunch]);

  const countdown: CountdownBreakdown = getCountdownBreakdown(GAME_LAUNCH_ISO, now);
  const currentTimeIST = formatToIST(now);

  return (
    <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Visual Ambiance Overlays */}
      <img
        src="/images/hero-scene.png"
        alt="Dark archival mystery background"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center] opacity-15 saturate-[0.5]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0c0c0b]/90 via-[#0c0c0b]/80 to-[#0c0c0b]" />
      <div aria-hidden className="film-grain absolute inset-0 pointer-events-none" />
      <div aria-hidden className="rain absolute inset-0 opacity-40 pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#2a2927] bg-[#0c0c0b]/90 backdrop-blur px-5 sm:px-8 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="block size-2 rounded-full bg-crimson animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#ebe6dc]">
            THE LAST SIGNAL
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-[#8d8880]">
            / CASE {CASE_ID}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Tactical Audio Control Cluster */}
          <div className="flex items-center border border-border bg-[#141514] p-0.5 font-mono text-[10px]">
            <button
              onClick={() => tacticalAudio.toggleSfxMute()}
              className={`flex items-center gap-1 px-2 py-1 transition-colors ${
                !audioState.sfxMuted
                  ? 'bg-crimson/20 text-crimson font-bold border border-crimson/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Interface SFX"
            >
              {audioState.sfxMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-crimson" />}
              <span className="hidden sm:inline">SFX</span>
            </button>
            <span className="text-border px-1">|</span>
            <button
              onClick={() => tacticalAudio.toggleAmbientMute()}
              className={`flex items-center gap-1 px-2 py-1 transition-colors ${
                !audioState.ambientMuted
                  ? 'bg-crimson/20 text-crimson font-bold border border-crimson/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Carrier Ambience"
            >
              <Radio size={12} className={!audioState.ambientMuted ? 'text-crimson animate-pulse' : ''} />
              <span className="hidden sm:inline">AMB</span>
            </button>
          </div>

          {/* Operative Chip */}
          <button
            onClick={() => {
              tacticalAudio.playNavClick();
              setShowDossierModal(true);
            }}
            className="flex items-center gap-2 border border-border bg-[#151514] px-2.5 py-1 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-[#444] transition-all"
            title="View Enrolled Dossier"
          >
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] text-[#ebe6dc] tracking-wider">{user.callSign}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              tacticalAudio.playNavClick();
              onLogout();
            }}
            className="text-xs font-mono text-muted-foreground hover:text-crimson transition-colors flex items-center gap-1"
            title="Exit Session"
          >
            <LogOut size={13} />
            <span className="hidden md:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Terminal Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="max-w-3xl w-full bg-[#111110]/95 border border-[#2a2927] p-6 sm:p-10 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] relative">
          {/* Signal Unlocking Flash Sequence */}
          {isUnlocking && (
            <div className="absolute inset-0 bg-[#0c0c0b]/98 z-30 flex flex-col items-center justify-center p-6 text-center animate-pulse">
              <span className="size-4 rounded-full bg-emerald-400 mb-4 animate-ping" />
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-emerald-400 font-bold mb-2">
                [SIGNAL LOCK ACQUIRED]
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-white font-light mb-3">
                Transmission Commencing
              </h2>
              <p className="font-mono text-xs text-muted-foreground tracking-wider max-w-md">
                Carrier frequency locked to 408.000 MHz. Unsealing Stage 01 archival records for Operative {user.callSign}...
              </p>
            </div>
          )}

          {/* Header Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22211f] pb-4 mb-6 font-mono text-[11px] tracking-widest uppercase">
            <div className="flex items-center gap-2 text-crimson">
              <span className="size-2 rounded-full bg-crimson animate-ping" />
              <span className="font-bold">STATUS: AWAITING SIGNAL</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>FREQUENCY: 408.000 MHz</span>
              <span className="text-[#333]">|</span>
              <span className="text-amber-500/90 font-medium">RECEPTOR INERT</span>
            </div>
          </div>

          {/* Central Mystery Narrative Headline */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-block">
              <span className="stamp border-crimson/80 text-crimson text-xs -rotate-2">
                CONFIDENTIAL DOCKET // LAUNCH STANDBY
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-light text-[#ebe6dc] tracking-tight leading-tight pt-2">
              The Archive Reopens at Midnight
            </h1>

            <p className="font-serif text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Investigator <strong className="text-foreground font-semibold">{user.callSign}</strong>, your
              intake verification has been registered. The transmission mast at Mount Davidson remains inert
              until the scheduled launch at <strong className="text-foreground">{GAME_LAUNCH_IST}</strong>.
            </p>
          </div>

          {/* Authoritative Live Countdown Console */}
          <div className="bg-[#090908] border border-[#262523] p-5 sm:p-8 mb-8 relative shadow-inner">
            <div className="flex items-center justify-between border-b border-[#1c1b1a] pb-3 mb-6">
              <div className="flex items-center gap-2">
                <Clock3 size={14} className="text-crimson animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#8d8880]">
                  COUNTDOWN TO FIRST TRANSMISSION
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                OFFICIAL TIME: {currentTimeIST}
              </span>
            </div>

            {/* Big Monospace Digit Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="bg-[#121211] border border-[#2b2a27] p-3 sm:p-5">
                <span className="font-mono text-3xl sm:text-6xl font-light text-[#ebe6dc] block tracking-tighter">
                  {String(countdown.days).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8d8880] mt-2 block">
                  DAYS
                </span>
              </div>

              <div className="bg-[#121211] border border-[#2b2a27] p-3 sm:p-5">
                <span className="font-mono text-3xl sm:text-6xl font-light text-[#ebe6dc] block tracking-tighter">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8d8880] mt-2 block">
                  HOURS
                </span>
              </div>

              <div className="bg-[#121211] border border-[#2b2a27] p-3 sm:p-5">
                <span className="font-mono text-3xl sm:text-6xl font-light text-[#ebe6dc] block tracking-tighter">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8d8880] mt-2 block">
                  MINUTES
                </span>
              </div>

              <div className="bg-[#121211] border border-[#2b2a27] p-3 sm:p-5">
                <span className="font-mono text-3xl sm:text-6xl font-light text-crimson block tracking-tighter">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-crimson/80 mt-2 block">
                  SECONDS
                </span>
              </div>
            </div>

            {/* Restrained Frequency Visualizer */}
            <div className="mt-6 pt-4 border-t border-[#1c1b1a]">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8d8880] uppercase tracking-wider mb-2">
                <span>RECEIVER CARRIER WAVE OSCILLOSCOPE</span>
                <span className="text-emerald-500/80">CARRIER STABLE</span>
              </div>
              <div className="h-6 w-full bg-[#050505] border border-[#201f1e] flex items-center justify-center px-3 overflow-hidden">
                <svg
                  className="w-full h-4 text-crimson/60 animate-pulse"
                  viewBox="0 0 400 20"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 10 Q 50 1, 100 10 T 200 10 T 300 10 T 400 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Cycling Tactical Status Strip */}
          <div className="bg-[#0e0e0d] border border-[#232220] p-3.5 mb-6 flex items-center gap-3">
            <Radio size={15} className="text-crimson animate-pulse shrink-0" />
            <div className="font-mono text-xs text-[#a39f97] tracking-wider truncate">
              {TELEMETRY_MESSAGES[telemetryIndex]}
            </div>
          </div>

          {/* Operative Verification Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[#8d8880]">INTAKE CLEARANCE:</span>
              <strong className="text-foreground">{user.fullName} ({user.studentClass})</strong>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  tacticalAudio.playNavClick();
                  setShowDossierModal(true);
                }}
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Inspect Clearance Dossier
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  tacticalAudio.playNavClick();
                  onLogout();
                }}
                className="text-muted-foreground hover:text-crimson"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Dossier Modal (Allows inspecting enrolled credentials without touching game secrets) */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141514] border border-[#333] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282725] pb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-crimson" />
                <h3 className="font-serif text-lg text-foreground">Investigator Clearance Record</h3>
              </div>
              <button
                onClick={() => {
                  tacticalAudio.playNavClick();
                  setShowDossierModal(false);
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-mono"
              >
                [✕ CLOSE]
              </button>
            </div>

            <dl className="divide-y divide-[#222] font-mono text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-muted-foreground">Call-Sign:</dt>
                <dd className="text-foreground font-bold">{user.callSign}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-muted-foreground">Operative Name:</dt>
                <dd className="text-foreground">{user.fullName}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-muted-foreground">Class Level:</dt>
                <dd className="text-foreground">{user.studentClass}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-muted-foreground">Admission ID:</dt>
                <dd className="text-foreground">{user.admissionNumberMasked}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-muted-foreground">Intake Logged:</dt>
                <dd className="text-muted-foreground">{formatToIST(user.registeredAt)}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-muted-foreground">Launch Window:</dt>
                <dd className="text-emerald-400 font-bold">{GAME_LAUNCH_IST}</dd>
              </div>
            </dl>

            <p className="text-[11px] font-serif text-muted-foreground italic leading-relaxed pt-2">
              Case files, intercepted audio, and stage telemetry will automatically unlock at midnight.
              No further action is required until launch.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  tacticalAudio.playNavClick();
                  setShowDossierModal(false);
                }}
                className="button button-secondary text-xs px-4 py-2"
              >
                Return to Transmitter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#2a2927] py-3.5 px-6 text-center font-mono text-[11px] text-[#8d8880] bg-[#0c0c0b]/90 z-10 flex flex-wrap items-center justify-between gap-4">
        <span>CASE {CASE_ID} — THE LAST SIGNAL // STAGE 01 UNLOCKS AT MIDNIGHT</span>
        <span>AUTHORITATIVE TELEMETRY // ASIA/KOLKATA (UTC+05:30)</span>
      </footer>
    </div>
  );
}
