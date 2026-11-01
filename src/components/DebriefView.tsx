/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * STAGE 7 — FINAL CHRONICLE ARTICLE, ENDING VIDEO & OFFICIAL CASE CLOSURE
 * 
 * Implements:
 * 1. Multi-step completion logic:
 *    locked -> available -> article_read -> ending_video_played -> completed
 * 2. San Francisco Chronicle late edition:
 *    "POLICE RECRUIT FOUND DEAD INSIDE STATION / Internal investigation launched..."
 * 3. Stage 7 Ending Video Sequence with distorted killer image/signal,
 *    missing-asset fallback, and Organizer Evaluation Path.
 * 4. Case Closure Standing & Certificate with IST timestamps and score audit.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Film,
  HelpCircle,
  Maximize2,
  Minimize2,
  Newspaper,
  Pause,
  Play,
  Printer,
  Radio,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tv,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import {
  STAGE_SCHEDULE,
  calculateStageScore,
  formatToIST,
  type StageScoreBreakdown,
} from '@/src/lib/stageConfig';
import type { PrototypeUser, UserProgress } from '@/src/lib/prototypeAuth';
import { ControlledSystemGlitch } from './ControlledSystemGlitch';

interface DebriefViewProps {
  user: PrototypeUser;
  progress: UserProgress;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
  onNavigateHome?: () => void;
}

export function DebriefView({
  user,
  progress,
  onUpdateProgress,
  onNavigateHome,
}: DebriefViewProps) {
  // Current multi-step stage 7 state
  const currentStep = progress.stage7Step || (progress.stagesCompleted >= 7 ? 'completed' : 'available');
  const [activeTab, setActiveTab] = useState<'chronicle' | 'ending_video' | 'certificate'>(
    currentStep === 'completed' ? 'certificate' : currentStep === 'article_read' ? 'ending_video' : 'chronicle'
  );

  const videoContainerRef = React.useRef<HTMLDivElement | null>(null);
  const videoElemRef = React.useRef<HTMLVideoElement | null>(null);

  // Ending video playback state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [realDuration, setRealDuration] = useState(60);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNearFullscreen, setIsNearFullscreen] = useState(false);
  const [isTrueFullscreenOverlay, setIsTrueFullscreenOverlay] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const isExpanded = isFullscreen || isNearFullscreen;

  // Listen for native fullscreen change
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        setIsTrueFullscreenOverlay(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTogglePlay = async () => {
    tacticalAudio.playButtonClick();
    if (!videoElemRef.current) return;
    if (isVideoPlaying) {
      videoElemRef.current.pause();
      setIsVideoPlaying(false);
      tacticalAudio.setLocationProfile('ending');
    } else {
      tacticalAudio.setLocationProfile('ending');
      try {
        await videoElemRef.current.play();
        setIsVideoPlaying(true);
      } catch (e) {
        console.warn('Playback error:', e);
      }
    }
  };

  const handleRewind = () => {
    tacticalAudio.playButtonClick();
    if (videoElemRef.current) {
      videoElemRef.current.currentTime = 0;
      setVideoTime(0);
    }
  };

  const handleToggleMute = () => {
    tacticalAudio.playButtonClick();
    if (videoElemRef.current) {
      const nextMute = !isVideoMuted;
      videoElemRef.current.muted = nextMute;
      setIsVideoMuted(nextMute);
    }
  };

  const handlePlayEndingFullscreen = async () => {
    tacticalAudio.playButtonClick();
    tacticalAudio.setLocationProfile('ending');
    const videoElem = videoElemRef.current;
    if (videoElem) {
      try {
        await videoElem.play();
        setIsVideoPlaying(true);
      } catch (e) {
        console.warn('Playback error:', e);
      }
      try {
        if (videoElem.requestFullscreen) {
          await videoElem.requestFullscreen();
          setIsFullscreen(true);
        } else if ((videoElem as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (videoElem as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if ((videoElem as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
          (videoElem as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
          setIsFullscreen(true);
        } else {
          setIsTrueFullscreenOverlay(true);
        }
      } catch {
        setIsTrueFullscreenOverlay(true);
      }
    } else {
      setIsTrueFullscreenOverlay(true);
    }
  };

  const handleExitFullscreen = () => {
    tacticalAudio.playButtonClick();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    setIsNearFullscreen(false);
    setIsTrueFullscreenOverlay(false);
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    tacticalAudio.setLocationProfile('ending');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    setIsNearFullscreen(false);
    setIsTrueFullscreenOverlay(false);
    // Trigger the glitch sequence
    setIsGlitching(true);
  };

  const handleTriggerFinalize = () => {
    tacticalAudio.playButtonClick();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    setIsNearFullscreen(false);
    setIsTrueFullscreenOverlay(false);
    setIsGlitching(true);
  };

  // Step 1: Confirm reading Chronicle article
  const handleConfirmArticleRead = () => {
    tacticalAudio.playButtonClick();
    if (onUpdateProgress) {
      onUpdateProgress((prev) => ({
        ...prev,
        stage7Step: 'article_read',
      }));
    }
    setActiveTab('ending_video');
  };

  // Step 2 & 3: Finalize Case after Ending Video & Glitch
  const handleFinalizeCase = () => {
    tacticalAudio.playSuccess();
    const nowIso = new Date().toISOString();
    const scoreBreakdown = calculateStageScore(7, nowIso);

    if (onUpdateProgress) {
      onUpdateProgress((prev) => {
        const nextCompleted = 7;
        const nextScores = {
          ...prev.stageScores,
          7: scoreBreakdown.totalScore,
        };
        const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

        return {
          ...prev,
          stage7Step: 'completed',
          stagesCompleted: nextCompleted,
          status: 'COMPLETED',
          stageScores: nextScores,
          stageSolveTimestamps: {
            ...prev.stageSolveTimestamps,
            7: nowIso,
          },
          stageScoringEligible: {
            ...prev.stageScoringEligible,
            7: scoreBreakdown.scoringEligible,
          },
          score: totalScore,
          tasksCompleted: prev.tasksCompleted + 1,
          endingCorruptedAftermath: true,
          aftermathDismissed: false,
        };
      });
    }
    setActiveTab('certificate');
  };

  // Compile detailed score breakdown across all 7 stages
  const scoreBreakdowns: StageScoreBreakdown[] = STAGE_SCHEDULE.map((stage) => {
    const timestamp = progress.stageSolveTimestamps[stage.number];
    if (timestamp) {
      return calculateStageScore(stage.number, timestamp, {
        isCorrectTarget: progress.targetLocationChoice === 4,
      });
    }
    if (stage.number <= progress.stagesCompleted) {
      return {
        stageNumber: stage.number,
        basePoints: 100,
        elapsedHours: 0,
        hourlyBonus: 0,
        targetBonus: stage.number === 4 && progress.targetLocationChoice === 4 ? 20 : 0,
        totalScore: 100 + (stage.number === 4 && progress.targetLocationChoice === 4 ? 20 : 0),
        scoringEligible: true,
        solveTimestampIST: 'Simulated Record (IST)',
        deadlineIST: stage.deadlineIST,
      };
    }
    return {
      stageNumber: stage.number,
      basePoints: 0,
      elapsedHours: 0,
      hourlyBonus: 0,
      targetBonus: 0,
      totalScore: 0,
      scoringEligible: false,
      solveTimestampIST: 'Pending Solve',
      deadlineIST: stage.deadlineIST,
    };
  });

  const totalCalculatedScore = scoreBreakdowns.reduce((acc, curr) => acc + curr.totalScore, 0);
  const totalBasePoints = scoreBreakdowns.reduce((acc, curr) => acc + curr.basePoints, 0);
  const totalHourlyBonus = scoreBreakdowns.reduce((acc, curr) => acc + curr.hourlyBonus, 0);
  const totalTargetBonus = scoreBreakdowns.reduce((acc, curr) => acc + curr.targetBonus, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Tabs */}
      <div className="page-header">
        <div>
          <div className="eyebrow">Case TLS-0017 // Stage 07 Debrief &amp; Closure</div>
          <h1>The Final Signal &amp; Closure</h1>
          <p>
            Official investigative conclusion for Case 17. Review the late Chronicle edition, inspect the ending transmission reel, and claim your verified scoring standing.
          </p>
        </div>
        <div className="header-action flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setActiveTab('chronicle');
            }}
            className={`button text-xs font-mono py-1.5 px-3 flex items-center gap-1.5 ${
              activeTab === 'chronicle' ? 'button-primary' : 'button-secondary'
            }`}
          >
            <Newspaper size={13} />
            <span>01. Chronicle Article</span>
          </button>
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setActiveTab('ending_video');
            }}
            className={`button text-xs font-mono py-1.5 px-3 flex items-center gap-1.5 ${
              activeTab === 'ending_video' ? 'button-primary' : 'button-secondary'
            }`}
          >
            <Film size={13} />
            <span>02. Ending Video Reel</span>
          </button>
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setActiveTab('certificate');
            }}
            disabled={currentStep !== 'completed'}
            className={`button text-xs font-mono py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40 ${
              activeTab === 'certificate' ? 'button-primary' : 'button-secondary'
            }`}
          >
            <Award size={13} />
            <span>03. Debrief Certificate</span>
          </button>
        </div>
      </div>

      {/* Step Tracker Indicator */}
      <div className="p-3 bg-[#111311] border border-border font-mono text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground uppercase text-[10px]">STAGE 07 PROGRESSION:</span>
          <span className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
            currentStep === 'completed'
              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
              : currentStep === 'article_read'
              ? 'bg-amber-950/60 border-amber-600 text-amber-300'
              : 'bg-zinc-900 border-zinc-700 text-foreground'
          }`}>
            {currentStep === 'completed'
              ? '✓ FULLY SOLVED &amp; CERTIFIED'
              : currentStep === 'article_read'
              ? 'ARTICLE READ — ENDING REEL PENDING'
              : 'ARTICLE REVIEW PENDING'}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {currentStep === 'completed'
            ? 'Official case records closed and archived.'
            : 'Read article and complete ending reel to finalize standing.'}
        </div>
      </div>

      {/* TAB 1: Chronicle Broadsheet Article */}
      {activeTab === 'chronicle' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="paper-sheet p-8 sm:p-14 text-ink font-serif relative shadow-2xl">
            {/* Masthead */}
            <div className="border-b-4 border-ink pb-4 text-center">
              <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-ink/70 border-b border-ink/40 pb-1 mb-2 uppercase">
                <span>VOL. CXVI NO. 305</span>
                <span>SAN FRANCISCO, CALIFORNIA</span>
                <span>LATE CITY EDITION · 15 CENTS</span>
              </div>
              <h2 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-ink uppercase py-1">
                San Francisco Chronicle
              </h2>
              <div className="flex justify-between text-[11px] font-mono text-ink/80 pt-1 border-t border-ink/30">
                <span>THE LARGEST DAILY CIRCULATION IN NORTHERN CALIFORNIA</span>
                <span>SPECIAL CASE 17 INQUIRY REPORT</span>
              </div>
            </div>

            {/* Giant Banner Headline */}
            <div className="my-6 border-b-2 border-ink pb-6 text-center space-y-2">
              <h3 className="font-serif text-3xl sm:text-5xl font-extrabold uppercase text-ink tracking-tight leading-none">
                POLICE RECRUIT FOUND DEAD INSIDE STATION
              </h3>
              <p className="font-serif text-base sm:text-lg italic text-ink/85 max-w-2xl mx-auto pt-1">
                Internal investigation launched as questions emerge over altered Zodiac case files and anomalous radio signals.
              </p>
            </div>

            {/* Two-Column Broadsheet Narrative */}
            <div className="grid md:grid-cols-2 gap-8 text-xs sm:text-sm leading-relaxed text-ink/90 font-serif">
              <div className="space-y-4">
                <p>
                  <span className="font-mono font-bold text-ink">SAN FRANCISCO — </span>
                  Early yesterday morning, station personnel conducting shift rotation in the lower archival
                  vault discovered the body of a 22-year-old police recruit assigned to Case 17 records duty.
                  Department officials confirmed that no signs of forced entry were found at the scene.
                </p>
                <p>
                  Recovered near the scene was a portable radio receiver tuned to an uncatalogued coastal
                  frequency, along with several historical case correspondence files originating from the
                  autumn of 1974. Investigators noted that a teletype terminal in an adjacent records room
                  had been left operational, printing repetitive transmissions until power was severed.
                </p>
                <div className="p-3 bg-black/5 border-l-2 border-crimson font-mono text-xs">
                  <strong>PRESS DISPATCH NOTE:</strong> Archival inquiries into the 408-symbol cipher and
                  the Presidio Heights survey map are now subject to strict internal lockdown by order of
                  the Director.
                </div>
              </div>

              <div className="space-y-4">
                <p>
                  "The recruit was conducting an authorized review of catalogued evidence," stated a departmental
                  spokesperson during a brief press assembly. "Preliminary findings suggest the individual
                  encountered anomalous structural notes affixed to historical records."
                </p>
                <p>
                  Independent radio operators across the Bay Area reported sporadic pulse transmissions on
                  non-standard frequencies in the hours preceding the discovery. When asked regarding the
                  contents of recovered audio tapes and the research journal of Ellen Vale, authorities declined
                  comment, citing classified status.
                </p>
                <p>
                  With the conclusion of this inquiry, all student investigators participating in the digital
                  archival examination are instructed to inspect the final ending transmission reel and submit their final deduction dossiers for official certification.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-10 pt-6 border-t-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-ink/75">
                <FileCheck size={16} className="text-crimson" />
                <span>ITEM EV-0701 VERIFIED // CHRONOLOGY LOGGED</span>
              </div>
              <button
                onClick={handleConfirmArticleRead}
                className="button bg-crimson hover:bg-red-800 text-white border border-red-700 py-2.5 px-6 font-mono text-xs font-bold tracking-wider shadow-lg flex items-center gap-2"
              >
                <span>Confirm Article Review &amp; Proceed to Ending Reel →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Ending Video Sequence */}
      {activeTab === 'ending_video' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div
            ref={videoContainerRef}
            className={`bg-[#080a09] border-2 border-[#1f2823] p-4 sm:p-6 shadow-2xl font-mono text-xs text-[#dcd6c9] transition-all duration-300 ${
              isExpanded
                ? 'fixed inset-0 z-50 p-6 flex flex-col justify-between bg-black/98 border-none overflow-hidden'
                : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2823] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Film size={16} className="text-crimson" />
                <span className="font-bold tracking-wider text-foreground">
                  STAGE 07 // ENDING TRANSMISSION REEL (THE LAST SIGNAL)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase px-2 py-0.5 border border-red-900 bg-red-950/40 text-red-400">
                  Master Transmission Reel
                </span>

                {isExpanded && (
                  <button
                    type="button"
                    onClick={handleExitFullscreen}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-[11px] font-bold"
                  >
                    <Minimize2 size={13} />
                    <span>Exit Fullscreen</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Canvas Container */}
            <div
              className={`relative aspect-video w-full bg-[#030504] border border-[#16201b] overflow-hidden flex flex-col justify-between shadow-inner ${
                isExpanded ? 'max-h-[82vh] my-auto mx-auto max-w-6xl' : ''
              }`}
            >
              {/* Real HTML5 Video Element */}
              <video
                ref={videoElemRef}
                playsInline
                preload="metadata"
                onTimeUpdate={(e) => setVideoTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  if (!isNaN(e.currentTarget.duration) && e.currentTarget.duration > 0) {
                    setRealDuration(Math.round(e.currentTarget.duration));
                  }
                }}
                onPlay={() => {
                  setIsVideoPlaying(true);
                  setIsBuffering(false);
                  tacticalAudio.setLocationProfile('ending');
                }}
                onPlaying={() => setIsBuffering(false)}
                onWaiting={() => setIsBuffering(true)}
                onPause={() => {
                  setIsVideoPlaying(false);
                  tacticalAudio.setLocationProfile('ending');
                }}
                onEnded={handleVideoEnded}
                onError={() => {
                  setVideoLoadError(true);
                  setIsBuffering(false);
                }}
                className="w-full h-full object-contain bg-black"
              >
                <source src="/assets/FINAL_REVIEW.mp4" type="video/mp4" />
                <source src="/assets/aistudio/WhatsApp_Video_2026-10-29_at_00.25.05_829df3d2.mp4" type="video/mp4" />
                Your browser does not support HTML5 video playback.
              </video>

              {/* CRT Scanline Overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                  backgroundSize: '100% 3px, 6px 100%',
                }}
              />

              {/* Top HUD */}
              <div className="absolute top-3 inset-x-4 z-10 flex justify-between items-center text-[11px] text-[#738a7c] pointer-events-none drop-shadow">
                <div className="flex items-center gap-2 bg-black/60 px-2 py-0.5 border border-[#192b20]">
                  <span className={`size-2 rounded-full ${isVideoPlaying ? 'bg-red-500 animate-ping' : 'bg-muted'}`} />
                  <span>{isVideoPlaying ? 'TRANSMITTING REEL' : 'PAUSED'}</span>
                  <span>·</span>
                  <span>FINAL SEQUENCE // REEL 07</span>
                </div>
                <div className="bg-black/60 px-2 py-0.5 border border-[#192b20]">
                  <span>ORIGINAL SOUNDTRACK</span>
                </div>
              </div>

              {/* Fallback Notice if Video Load Fails */}
              {videoLoadError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/92 text-center space-y-3 font-mono">
                  <Film className="size-10 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-red-200">
                    MASTER REEL 07 TRANSMISSION STREAM INTERRUPTED
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Unable to stream FINAL_REVIEW.mp4. You can retry loading the archival reel or proceed directly to finalize your standing.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoLoadError(false);
                        if (videoElemRef.current) {
                          videoElemRef.current.load();
                        }
                      }}
                      className="button button-secondary py-1.5 px-3 text-xs"
                    >
                      Retry Reel Stream
                    </button>
                    <button
                      type="button"
                      onClick={handleTriggerFinalize}
                      className="button bg-emerald-800 hover:bg-emerald-700 text-white py-1.5 px-3 text-xs font-bold"
                    >
                      Finalize Case Directly →
                    </button>
                  </div>
                </div>
              )}

              {/* Buffering Indicator */}
              {isBuffering && !videoLoadError && (
                <div className="absolute inset-0 z-15 flex items-center justify-center bg-black/50 pointer-events-none">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-black/80 px-3 py-1.5 border border-[#1e4827]">
                    <div className="size-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span>BUFFERING ARCHIVAL OPTICAL REEL...</span>
                  </div>
                </div>
              )}

              {/* Prominent Center Play Overlay for mobile and desktop click-to-play */}
              {!isVideoPlaying && !videoLoadError && (
                <div
                  onClick={handleTogglePlay}
                  className="absolute inset-0 z-15 flex items-center justify-center bg-black/35 hover:bg-black/20 cursor-pointer transition-colors group"
                  role="button"
                  tabIndex={0}
                  aria-label="Play transmission reel"
                >
                  <div className="size-16 rounded-full bg-crimson/90 group-hover:bg-crimson group-hover:scale-110 flex items-center justify-center text-white shadow-[0_0_25px_rgba(230,50,50,0.6)] transition-all">
                    <Play size={28} className="translate-x-0.5" fill="currentColor" />
                  </div>
                </div>
              )}

              {/* Bottom Info Strip */}
              <div className="absolute bottom-2 inset-x-4 z-10 flex items-center justify-between text-[11px] text-[#738a7c] bg-black/65 px-3 py-1 border border-[#131d17]">
                <span>TC: 00:{formatTime(videoTime)}</span>
                <div className="flex items-center gap-1 h-3">
                  {[6, 12, 18, 8, 14, 20, 10, 16, 22, 12, 8, 14, 18, 6].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 bg-[#344d3e] transition-all ${
                        isVideoPlaying ? 'bg-crimson animate-pulse' : ''
                      }`}
                      style={{
                        height: isVideoPlaying
                          ? `${(h * ((Math.floor(videoTime) % 3) + 1)) % 16 + 4}px`
                          : `${h / 2}px`,
                      }}
                    />
                  ))}
                </div>
                <span>DURATION: {formatTime(realDuration)}</span>
              </div>
            </div>

            {/* Controls & Finalize Button */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a2620]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="button button-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isVideoPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isVideoPlaying ? 'Pause Transmission' : 'Play Transmission'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRewind}
                  className="button button-secondary py-1.5 px-2.5 text-xs text-muted-foreground cursor-pointer"
                  title="Rewind"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="button button-secondary py-1.5 px-2.5 text-xs text-muted-foreground cursor-pointer"
                  title={isVideoMuted ? 'Unmute' : 'Mute'}
                >
                  {isVideoMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <span className="font-mono text-xs text-muted-foreground ml-2">
                  {formatTime(videoTime)} / {formatTime(realDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayEndingFullscreen}
                  className="button bg-stone-900 hover:bg-stone-800 text-red-200 border border-red-900/80 py-2 px-3 text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Maximize2 size={13} className="text-crimson" />
                  <span>Cinematic Fullscreen</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerFinalize}
                  className="button bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 py-2 px-5 font-mono text-xs font-bold tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Award size={14} />
                  <span>Finalize Case &amp; Generate Certificate →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Certificate of Case Closure */}
      {activeTab === 'certificate' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="paper-sheet p-8 sm:p-14 text-ink font-mono relative shadow-2xl space-y-8 border-4 border-double border-ink">
            {/* Header Stamp */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-ink pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={24} className="text-crimson" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink/80">
                    DEPARTMENT OF ARCHIVAL INVESTIGATION
                  </span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mt-1">
                  Certificate of Case Closure
                </h2>
                <p className="text-xs text-ink/70 mt-1 font-mono">
                  OFFICIAL FORENSIC RECORD · CASE DESIGNATION: {STAGE_SCHEDULE.length}-SECTOR INQUIRY
                </p>
              </div>

              <div className="text-right">
                <span className="stamp text-emerald-800 border-emerald-800 text-xs inline-block mb-1">
                  CASE SOLVED &amp; CLOSED
                </span>
                <p className="text-[10px] text-ink/60">SEAL REF: TLS-0017-FINAL</p>
              </div>
            </div>

            {/* Investigator Credentials Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-black/5 border border-ink/30 text-xs">
              <div>
                <span className="text-[9px] uppercase text-ink/60 block">Operative Call-Sign</span>
                <strong className="text-sm font-bold text-ink">{user.callSign}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-ink/60 block">Assigned Class</span>
                <strong className="text-sm font-bold text-ink">{user.studentClass}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-ink/60 block">Admission Number</span>
                <strong className="text-xs font-mono text-ink/90">{user.admissionNumberMasked}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase text-ink/60 block">Total Merit Points</span>
                <strong className="text-lg font-bold text-crimson">{totalCalculatedScore} PTS</strong>
              </div>
            </div>

            {/* Stage-by-Stage Scoring Breakdown Table */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  OFFICIAL STAGE AUDIT DOCKET (INDIAN STANDARD TIME)
                </span>
                <span className="text-[10px] text-ink/60">7 OF 7 EVALUATED</span>
              </div>

              <div className="border border-ink/40 divide-y divide-ink/30 text-xs bg-white/40">
                <div className="p-2.5 grid grid-cols-12 gap-2 bg-black/5 font-bold text-[10px] text-ink/70 uppercase">
                  <span className="col-span-1">STAGE</span>
                  <span className="col-span-4">DESIGNATION &amp; SCOPE</span>
                  <span className="col-span-3">SOLVE RECORD (IST)</span>
                  <span className="col-span-2 text-center">BREAKDOWN</span>
                  <span className="col-span-2 text-right">TOTAL</span>
                </div>

                {scoreBreakdowns.map((sb) => {
                  const stageMeta = STAGE_SCHEDULE[sb.stageNumber - 1];
                  return (
                    <div key={sb.stageNumber} className="p-2.5 grid grid-cols-12 gap-2 items-center text-[11px]">
                      <span className="col-span-1 font-bold text-ink">0{sb.stageNumber}</span>
                      <div className="col-span-4 font-sans">
                        <strong className="text-ink font-serif block text-xs">{stageMeta.title}</strong>
                        <span className="text-[10px] text-ink/70 font-mono">{stageMeta.subtitle}</span>
                      </div>
                      <div className="col-span-3 font-mono text-[10px] text-ink/80">
                        {sb.solveTimestampIST}
                        <span className="block text-[9px] text-ink/50">Deadline: {stageMeta.deadlineIST}</span>
                      </div>
                      <div className="col-span-2 text-center font-mono text-[10px] text-ink/70">
                        {sb.basePoints}B {sb.hourlyBonus > 0 ? `+${sb.hourlyBonus}S` : ''} {sb.targetBonus > 0 ? `+${sb.targetBonus}T` : ''}
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-sm text-ink">
                        +{sb.totalScore}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Scoring Summary Banner */}
            <div className="p-4 bg-black/5 border border-ink/30 flex flex-wrap justify-between items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase text-ink/60 block">SCORING COMPOSITION:</span>
                <span className="font-bold text-ink">
                  {totalBasePoints} Base + {totalHourlyBonus} Speed + {totalTargetBonus} Target Bonus = {totalCalculatedScore} Total Points
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="stamp text-xs text-crimson border-crimson">SEALED CASE ARCHIVE</span>
              </div>
            </div>

            {/* Footer with return home */}
            <div className="pt-4 border-t border-ink/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <span className="text-ink/60 text-[10px]">
                THE LAST SIGNAL · CASE TLS-0017 COMPLETED · ALL SECTORS RESOLVED
              </span>
              <button
                onClick={onNavigateHome}
                className="button button-secondary text-xs"
              >
                ← Return to Case Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Controlled System Glitch Sequence */}
      <ControlledSystemGlitch
        isActive={isGlitching}
        reducedScareMode={progress.reducedScareMode}
        onComplete={() => {
          setIsGlitching(false);
          handleFinalizeCase();
        }}
        onDismiss={() => {
          setIsGlitching(false);
          handleFinalizeCase();
        }}
      />

      {/* True Edge-to-Edge Fullscreen Fallback Overlay */}
      {isTrueFullscreenOverlay && (
        <div className="fixed inset-0 z-[999998] bg-black flex items-center justify-center m-0 p-0 overflow-hidden">
          <video
            autoPlay
            playsInline
            controls
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain bg-black"
          >
            <source src="/assets/FINAL_REVIEW.mp4" type="video/mp4" />
            <source src="/assets/aistudio/WhatsApp_Video_2026-10-29_at_00.25.05_829df3d2.mp4" type="video/mp4" />
          </video>
          <button
            type="button"
            onClick={handleExitFullscreen}
            className="absolute top-4 right-4 z-[999999] bg-black/75 hover:bg-black text-white/90 hover:text-white px-3 py-1.5 border border-white/25 text-xs font-mono flex items-center gap-1.5 cursor-pointer backdrop-blur-sm shadow-xl"
          >
            <Minimize2 size={14} />
            <span>EXIT FULLSCREEN</span>
          </button>
        </div>
      )}
    </div>
  );
}
