/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PRE-REGISTRATION WAITING SCREEN
 * 
 * Displayed before the configured registration opening timestamp
 * (30 October 2026, 00:00:00 IST / UTC+05:30).
 * 
 * Features:
 * - Authoritative drift-free countdown to registration opening.
 * - Rechecks launch state upon window focus and visibility change.
 * - Seamless automatic transition into active registration without page refresh.
 * - Atmospheric classified dossier aesthetic matching THE LAST SIGNAL identity.
 */

import React, { useEffect, useState } from 'react';
import {
  Clock3,
  FileText,
  Lock,
  Radio,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  ArrowRight,
  UserCheck,
  Calendar,
} from 'lucide-react';
import {
  REGISTRATION_OPEN_ISO,
  REGISTRATION_OPEN_IST,
  formatToIST,
  getCountdownBreakdown,
  isRegistrationOpen,
  type CountdownBreakdown,
} from '@/src/lib/stageConfig';
import { tacticalAudio, type TacticalAudioState } from '@/src/lib/tacticalAudio';
import { CASE_ID } from '@/src/lib/mockData';

interface PreRegistrationViewProps {
  onRegistrationOpen: () => void;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

export function PreRegistrationView({
  onRegistrationOpen,
  onNavigateHome,
  onNavigateLogin,
}: PreRegistrationViewProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [audioState, setAudioState] = useState<TacticalAudioState>(() => tacticalAudio.getState());
  const [isActivating, setIsActivating] = useState(false);

  // Subscribe to audio state
  useEffect(() => {
    return tacticalAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  // Set archive atmosphere
  useEffect(() => {
    tacticalAudio.setLocationProfile('archive');
  }, []);

  // Authoritative countdown loop with drift protection & visibility listeners
  useEffect(() => {
    const checkState = () => {
      const currentDate = new Date();
      setNow(currentDate);

      if (isRegistrationOpen(currentDate)) {
        setIsActivating(true);
        tacticalAudio.playSuccess();
        const timeout = setTimeout(() => {
          onRegistrationOpen();
        }, 800);
        return () => clearTimeout(timeout);
      }
    };

    // Fast 250ms tick to capture exact second transition without visual delay
    const interval = setInterval(checkState, 250);

    const handleFocusOrVisible = () => {
      checkState();
    };

    document.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
    };
  }, [onRegistrationOpen]);

  const countdown: CountdownBreakdown = getCountdownBreakdown(REGISTRATION_OPEN_ISO, now);
  const currentTimeIST = formatToIST(now);

  return (
    <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc] flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambience */}
      <div aria-hidden className="film-grain absolute inset-0 pointer-events-none" />
      <div aria-hidden className="rain absolute inset-0 opacity-40 pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#2a2927] bg-[#0c0c0b]/90 backdrop-blur px-6 py-4 flex justify-between items-center">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            tacticalAudio.playNavClick();
            onNavigateHome();
          }}
        >
          <span className="block size-2 rounded-full bg-crimson animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#ebe6dc] group-hover:text-white transition-colors">
            THE LAST SIGNAL
          </span>
          <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground">
            / CASE {CASE_ID}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Tactical Audio Control */}
          <div className="hidden sm:flex items-center border border-border bg-[#141514] p-0.5 font-mono text-[10px]">
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
              <span>SFX</span>
            </button>
            <span className="text-border px-1">|</span>
            <button
              onClick={() => tacticalAudio.toggleAmbientMute()}
              className={`flex items-center gap-1 px-2 py-1 transition-colors ${
                !audioState.ambientMuted
                  ? 'bg-crimson/20 text-crimson font-bold border border-crimson/50'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Atmospheric Static"
            >
              <Radio size={12} className={!audioState.ambientMuted ? 'text-crimson animate-pulse' : ''} />
              <span>AMB</span>
            </button>
          </div>

          <button
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              tacticalAudio.playNavClick();
              onNavigateLogin();
            }}
          >
            Log In →
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="auth-container my-auto py-12 px-4 z-10">
        <div className="auth-card max-w-xl mx-auto border border-[#2a2927] bg-[#141514]/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Activating Flash Overlay */}
          {isActivating && (
            <div className="absolute inset-0 bg-crimson/15 z-20 flex flex-col items-center justify-center backdrop-blur-[2px] transition-all">
              <Sparkles className="size-10 text-crimson animate-spin mb-3" />
              <p className="font-mono text-sm uppercase tracking-widest text-foreground font-bold">
                [INTAKE WINDOW OPENED]
              </p>
              <p className="font-serif text-xs text-muted-foreground mt-1">
                Transferring to investigator registration dossier...
              </p>
            </div>
          )}

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1d1b19] border border-[#38332c] text-amber-400 font-mono text-[11px] uppercase tracking-widest mb-6">
            <Lock size={12} className="text-amber-400" />
            <span>REGISTRATION SEALED // STANDBY</span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-3xl sm:text-4xl text-[#ebe6dc] font-light leading-tight tracking-tight mb-3">
            Investigator Registration
            <br />
            <span className="italic font-serif text-[#dc6060]">Opening Soon</span>
          </h1>

          <p className="font-serif text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto mb-8">
            Access to the Case {CASE_ID} sealed records repository will be distributed to students on{' '}
            <strong className="text-foreground font-semibold">30 October 2026</strong>. The registration
            portal unlocks automatically at the scheduled intake hour.
          </p>

          {/* Authoritative Live Countdown Box */}
          <div className="bg-[#0c0c0b] border border-[#2a2927] p-5 sm:p-6 mb-8 text-left shadow-inner">
            <div className="flex items-center justify-between border-b border-[#21201e] pb-3 mb-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8d8880] flex items-center gap-2">
                <Clock3 size={13} className="text-crimson animate-pulse" />
                Intake Activation Countdown
              </span>
              <span className="font-mono text-[10px] text-amber-500 uppercase tracking-wider">
                Asia/Kolkata
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div className="bg-[#141514] border border-[#262523] p-3 rounded-none">
                <span className="font-mono text-2xl sm:text-4xl font-bold text-[#ebe6dc] block tracking-tight">
                  {String(countdown.days).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#8d8880] mt-1 block">
                  Days
                </span>
              </div>

              <div className="bg-[#141514] border border-[#262523] p-3 rounded-none">
                <span className="font-mono text-2xl sm:text-4xl font-bold text-[#ebe6dc] block tracking-tight">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#8d8880] mt-1 block">
                  Hours
                </span>
              </div>

              <div className="bg-[#141514] border border-[#262523] p-3 rounded-none">
                <span className="font-mono text-2xl sm:text-4xl font-bold text-[#ebe6dc] block tracking-tight">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#8d8880] mt-1 block">
                  Mins
                </span>
              </div>

              <div className="bg-[#141514] border border-[#262523] p-3 rounded-none">
                <span className="font-mono text-2xl sm:text-4xl font-bold text-crimson block tracking-tight">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-crimson/80 mt-1 block">
                  Secs
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#21201e] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
              <span>Configured Opening: <strong className="text-[#ebe6dc]">{REGISTRATION_OPEN_IST}</strong></span>
              <span>Live IST: <strong className="text-foreground">{currentTimeIST}</strong></span>
            </div>
          </div>

          {/* Student Preparation Brief */}
          <div className="text-left bg-[#10100f] border border-[#232220] p-4 text-xs font-mono space-y-2 mb-8">
            <div className="flex items-center gap-2 text-foreground font-semibold text-[11px] uppercase tracking-wider pb-1 border-b border-[#232220]">
              <FileText size={13} className="text-crimson" />
              <span>Investigator Intake Protocol</span>
            </div>
            <ul className="text-muted-foreground space-y-1.5 pt-1 text-[11px] list-disc list-inside">
              <li>
                <strong className="text-[#ebe6dc]">Student Email:</strong> Required for account verification, dispatch bulletins, and password recovery.
              </li>
              <li>
                <strong className="text-[#ebe6dc]">School Admission Number:</strong> Have your student ID number ready (masked upon entry).
              </li>
              <li>
                <strong className="text-[#ebe6dc]">Call-Sign Handle:</strong> You will select a unique moniker (e.g. <span className="text-[#ebe6dc]">ALEX_MERCER</span>) for leaderboard attribution.
              </li>
              <li>
                <strong className="text-[#ebe6dc]">Automatic Activation:</strong> This terminal will transition directly to the registration dossier the instant the intake window unlocks.
              </li>
            </ul>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                tacticalAudio.playNavClick();
                onNavigateHome();
              }}
              className="button button-secondary text-xs uppercase tracking-widest py-3 px-6 w-full sm:w-auto"
            >
              ← Case Overview
            </button>
            <button
              onClick={() => {
                tacticalAudio.playNavClick();
                onNavigateLogin();
              }}
              className="button button-primary text-xs uppercase tracking-widest py-3 px-6 w-full sm:w-auto"
            >
              Investigator Sign In
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center font-mono text-[11px] text-muted-foreground bg-[#0c0c0b]/80 z-10">
        THE LAST SIGNAL — CASE {CASE_ID} — OFFICIAL REGISTRATION WINDOW OPENS {REGISTRATION_OPEN_IST}
      </footer>
    </div>
  );
}
