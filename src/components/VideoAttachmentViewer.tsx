/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * STAGE 6 — CINEMATIC VIDEO ATTACHMENT VIEWER & CONTROLLED SYSTEM FREEZE
 * 
 * Implements:
 * 1. Genuine MP4 video player for FINAL_REVIEW.mp4 (WhatsApp_Video_2026-10-29_at_00.25.05_829df3d2.mp4)
 *    preserving the original visual content and stereo audio track.
 * 2. Cinematic Fullscreen Experience via browser Fullscreen API with user gesture,
 *    and a polished, near-fullscreen fallback for mobile/restricted environments.
 * 3. Priority Audio Routing: duck/fade ambient audio when ending video plays,
 *    restoring it upon exit or completion.
 * 4. EXPECTED INVESTIGATOR RESPONSES dossier sequence.
 * 5. Canonical closing quote:
 *    "You have tried very hard to find the killer… But did you ever think about what would happen if he tried to find you?"
 * 6. Sequenced Director dispatches:
 *    - Message 1: "The case is closed."
 *    - Message 2: "You have done enough."
 *    - Message 3: "Delete your local copies of the files and wait for further instructions."
 * 7. Controlled forensic system freeze with scanlines, CRT decay, and seamless transition to Stage 7.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Film,
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldAlert,
  Terminal,
  Tv,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { calculateStageScore } from '@/src/lib/stageConfig';
import type { UserProgress } from '@/src/lib/prototypeAuth';
import { ControlledSystemGlitch } from './ControlledSystemGlitch';

interface VideoAttachmentViewerProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onAdvanceToStage7?: () => void;
}

export function VideoAttachmentViewer({
  progress,
  onUpdateProgress,
  onAdvanceToStage7,
}: VideoAttachmentViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNearFullscreen, setIsNearFullscreen] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [directorStep, setDirectorStep] = useState<number>(0);
  const [videoLoadError, setVideoLoadError] = useState(false);

  const hasScoredStage6Ref = useRef(progress.stagesCompleted >= 6);

  // Sync fullscreen state with document events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeElement =
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      const active = Boolean(activeElement && containerRef.current && containerRef.current.contains(activeElement));
      setIsFullscreen(active);
      if (!active && !isNearFullscreen && videoRef.current && !videoRef.current.paused) {
        // If user exited fullscreen but didn't pause, keep playing but restore profile
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isNearFullscreen]);

  // Clean up location audio upon component unmount
  useEffect(() => {
    return () => {
      // Restore final investigation profile when unmounting
      tacticalAudio.setLocationProfile('final_investigation');
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Play video with audio priority
  const handlePlay = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      tacticalAudio.setLocationProfile('ending');
      await videoRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.warn('Video play prevented or interrupted:', e);
    }
  }, []);

  // Pause video and restore ambience
  const handlePause = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    tacticalAudio.setLocationProfile('final_investigation');
  }, []);

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    tacticalAudio.playButtonClick();
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  // Obvious Play Ending in Fullscreen button handler (User Gesture Guaranteed)
  const handlePlayEndingFullscreen = async () => {
    tacticalAudio.playButtonClick();
    const videoElem = videoRef.current;
    if (!videoElem) return;

    // Start video playback
    await handlePlay();

    // Request native fullscreen directly on the video element for true edge-to-edge playback
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
        setIsNearFullscreen(true);
      }
    } catch {
      // Fullscreen denied or restricted in iframe: activate true edge-to-edge fallback
      setIsNearFullscreen(true);
    }
  };

  // Exit fullscreen handler
  const handleExitFullscreen = () => {
    tacticalAudio.playButtonClick();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
      (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
    }
    setIsFullscreen(false);
    setIsNearFullscreen(false);
  };

  // Toggle Mute on video element
  const handleToggleMute = () => {
    tacticalAudio.playButtonClick();
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  // Rewind video to beginning
  const handleRewind = () => {
    tacticalAudio.playButtonClick();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Execute Controlled Review Freeze sequence
  const handleInitiateReview = () => {
    if (isGlitching) return;
    tacticalAudio.playButtonClick();
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    // Exit native fullscreen if active so glitch modal displays properly
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsNearFullscreen(false);
    setIsGlitching(true);
  };

  // Triggered when glitch sequence completes
  const handleGlitchComplete = () => {
    setIsGlitching(false);
    setShowFreezeModal(true);
    setDirectorStep(1);

    if (hasScoredStage6Ref.current) return;
    hasScoredStage6Ref.current = true;

    const nowIso = new Date().toISOString();
    const scoreBreakdown = calculateStageScore(6, nowIso);

    onUpdateProgress((prev) => {
      const nextCompleted = Math.max(prev.stagesCompleted, 6);
      const nextActive = Math.max(prev.activeStage, 7);
      const nextUnlocked = Array.from(
        new Set([...prev.unlockedEvidenceIds, 'EV-0701'])
      );
      const nextScores = {
        ...prev.stageScores,
        6: scoreBreakdown.totalScore,
      };
      const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

      return {
        ...prev,
        systemFreezeTriggered: true,
        directorFreezeStage6DirectorMessagesSent: true,
        stagesCompleted: nextCompleted,
        activeStage: nextActive,
        unlockedEvidenceIds: nextUnlocked,
        stageScores: nextScores,
        stageSolveTimestamps: {
          ...prev.stageSolveTimestamps,
          6: nowIso,
        },
        stageScoringEligible: {
          ...prev.stageScoringEligible,
          6: scoreBreakdown.scoringEligible,
        },
        score: totalScore,
        tasksCompleted: prev.tasksCompleted + 1,
        status: 'IN PROGRESS',
      };
    });
  };

  // When video naturally ends
  const handleVideoEnded = () => {
    setIsPlaying(false);
    tacticalAudio.setLocationProfile('final_investigation');
    // Automatically present the review option or initiate glitch
    handleInitiateReview();
  };

  const isExpanded = isFullscreen || isNearFullscreen;

  return (
    <div className="space-y-6">
      {/* Controlled System Glitch Sequence */}
      <ControlledSystemGlitch
        isActive={isGlitching}
        reducedScareMode={progress.reducedScareMode}
        onComplete={handleGlitchComplete}
      />

      {/* True Edge-to-Edge Fullscreen Fallback Overlay */}
      {isNearFullscreen && (
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

      {/* Media Player Frame */}
      <div
        ref={containerRef}
        className="bg-[#080a09] border-2 border-[#1f2823] p-4 sm:p-6 shadow-2xl font-mono text-xs text-[#dcd6c9]"
      >
        {/* Header HUD */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2823] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Film size={16} className="text-crimson" />
            <span className="font-bold tracking-wider text-foreground">
              ATTACHMENT REEL // FINAL_REVIEW.MP4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase px-2 py-0.5 border border-amber-900 bg-amber-950/40 text-amber-400">
              Recovered 16mm Optical Reel
            </span>

            {isExpanded && (
              <button
                type="button"
                onClick={handleExitFullscreen}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-[11px] font-bold"
                title="Exit Fullscreen"
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
            ref={videoRef}
            playsInline
            preload="metadata"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              if (!isNaN(e.currentTarget.duration) && e.currentTarget.duration > 0) {
                setDuration(Math.round(e.currentTarget.duration));
              }
            }}
            onPlay={() => {
              setIsPlaying(true);
              tacticalAudio.setLocationProfile('ending');
            }}
            onPause={() => {
              setIsPlaying(false);
              tacticalAudio.setLocationProfile('final_investigation');
            }}
            onEnded={handleVideoEnded}
            onError={() => {
              setVideoLoadError(true);
            }}
            className="w-full h-full object-contain bg-black"
          >
            <source src="/assets/FINAL_REVIEW.mp4" type="video/mp4" />
            <source src="/assets/aistudio/WhatsApp_Video_2026-10-29_at_00.25.05_829df3d2.mp4" type="video/mp4" />
            Your browser does not support HTML5 video playback.
          </video>

          {/* CRT Scanline Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.04))',
              backgroundSize: '100% 3px, 6px 100%',
            }}
          />

          {/* Top Video HUD telemetry */}
          <div className="absolute top-3 inset-x-4 z-10 flex justify-between items-center text-[11px] text-[#738a7c] pointer-events-none drop-shadow">
            <div className="flex items-center gap-2 bg-black/60 px-2 py-0.5 border border-[#192b20]">
              <span className={`size-2 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-muted'}`} />
              <span>{isPlaying ? 'PLAYING ARCHIVAL STREAM' : 'PAUSED'}</span>
              <span>·</span>
              <span>REEL 17-B</span>
            </div>
            <div className="bg-black/60 px-2 py-0.5 border border-[#192b20]">
              <span>OPTICAL SOUNDTRACK (STEREO)</span>
            </div>
          </div>

          {/* Fallback Notice if Video Load Fails */}
          {videoLoadError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/90 text-center space-y-3">
              <AlertTriangle className="size-10 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-red-200">
                ARCHIVAL STREAM 0x17-B DISPATCH INTERRUPTED
              </p>
              <p className="text-xs text-muted-foreground max-w-md">
                Archival video asset (FINAL_REVIEW.mp4) was not bundled in the initial archive repository import. You may review the full forensic transcript and expected responses below, then initiate the review sequence.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setVideoLoadError(false);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="button button-secondary py-1.5 px-3 text-xs"
                >
                  Retry Stream
                </button>
                <button
                  type="button"
                  onClick={handleInitiateReview}
                  className="button bg-crimson hover:bg-red-800 text-white py-1.5 px-3 text-xs font-bold tracking-wider"
                >
                  Proceed to Review Sequence →
                </button>
              </div>
            </div>
          )}

          {/* Bottom Waveform & Timecode Strip */}
          <div className="absolute bottom-2 inset-x-4 z-10 flex items-center justify-between text-[11px] text-[#738a7c] bg-black/65 px-3 py-1 border border-[#131d17]">
            <span>TC: 00:{formatTime(currentTime)}</span>
            {/* Audio Waveform Bars */}
            <div className="flex items-center gap-1 h-3">
              {[6, 12, 18, 8, 14, 20, 10, 16, 22, 12, 8, 14, 18, 6].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 bg-[#344d3e] transition-all ${
                    isPlaying ? 'bg-crimson animate-pulse' : ''
                  }`}
                  style={{
                    height: isPlaying
                      ? `${(h * ((Math.floor(currentTime) % 3) + 1)) % 16 + 4}px`
                      : `${h / 2}px`,
                  }}
                />
              ))}
            </div>
            <span>TOTAL: {formatTime(duration)}</span>
          </div>
        </div>

        {/* Video Player Controls & Primary Cinematic Fullscreen Action */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="button button-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause Reel' : 'Play Reel'}</span>
            </button>

            <button
              type="button"
              onClick={handleRewind}
              className="button button-secondary py-1.5 px-2.5 text-xs text-muted-foreground cursor-pointer"
              title="Rewind to start"
            >
              <RotateCcw size={13} />
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              className="button button-secondary py-1.5 px-2.5 text-xs text-muted-foreground cursor-pointer"
              title={isMuted ? 'Unmute Audio Track' : 'Mute Audio Track'}
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>

            <span className="font-mono text-xs text-muted-foreground ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Prominent Cinematic Fullscreen Button with User Gesture */}
            <button
              type="button"
              onClick={handlePlayEndingFullscreen}
              className="button bg-stone-900 hover:bg-stone-800 text-red-200 border border-red-900/80 py-2 px-3.5 text-xs font-mono font-bold tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Maximize2 size={13} className="text-crimson" />
              <span>Play in Cinematic Fullscreen</span>
            </button>

            {/* Interactive Trigger for Stage 6 Review Glitch Sequence */}
            <button
              type="button"
              onClick={handleInitiateReview}
              disabled={isGlitching}
              className="button bg-crimson hover:bg-red-800 text-white border border-red-700 py-2 px-4 text-xs font-mono font-bold tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert size={14} />
              <span>Initiate Final Review Sequence →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dossier Sequence: EXPECTED INVESTIGATOR RESPONSES */}
      <div className="bg-[#0b0d0c] border border-[#213026] p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#213026] pb-3">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <Eye size={15} className="text-crimson" />
            <span className="uppercase tracking-widest text-[#98dfaa]">
              DOSSIER ATTACHMENT: EXPECTED INVESTIGATOR RESPONSES
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold">
            CONFIDENTIAL REEL INDEX
          </span>
        </div>

        <p className="text-[#a4b5aa] leading-relaxed">
          The 16mm reel recovered with Ellen Vale's notebook contains a structured inventory of anticipated investigator moves. The sender predicted the exact sequence of actions taken across the case:
        </p>

        <div className="border border-[#18261e] divide-y divide-[#18261e] bg-[#050706] text-[11px]">
          <div className="p-3 flex items-start gap-3">
            <span className="text-crimson font-bold">01.</span>
            <div>
              <strong className="text-foreground">Exorcist Margin Telestich:</strong>
              <p className="text-muted-foreground m-0 mt-0.5">
                "Anticipated that the operative would inspect the line boundaries of EV-0103 to unlock the vault."
              </p>
            </div>
          </div>
          <div className="p-3 flex items-start gap-3">
            <span className="text-crimson font-bold">02.</span>
            <div>
              <strong className="text-foreground">Optical Telemetry Substitution:</strong>
              <p className="text-muted-foreground m-0 mt-0.5">
                "Anticipated that the operative would convert (CG.GHHGD, -LB.DEG I) to locate House 3893."
              </p>
            </div>
          </div>
          <div className="p-3 flex items-start gap-3">
            <span className="text-crimson font-bold">03.</span>
            <div>
              <strong className="text-foreground">The 24-Hour Signal Choice:</strong>
              <p className="text-muted-foreground m-0 mt-0.5">
                "Anticipated that the operative would reverse the 17-second carrier pulse to select Washington &amp; Cherry."
              </p>
            </div>
          </div>
        </div>

        {/* Canonical Closing Quote */}
        <div className="p-4 bg-[#140606] border-2 border-crimson space-y-2 mt-4 shadow-lg">
          <div className="text-[10px] uppercase font-bold tracking-wider text-crimson">
            CANONICAL TRANSMISSION CLOSING QUOTE:
          </div>
          <blockquote className="font-serif text-base italic text-red-200 leading-relaxed m-0 border-l-2 border-crimson pl-3">
            "You have tried very hard to find the killer… But did you ever think about what would happen if he tried to find you?"
          </blockquote>
        </div>
      </div>

      {/* Story Freeze Modal: 3 Sequenced Director Dispatches */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0a0505] border-2 border-crimson text-[#f2cece] font-mono text-xs max-w-2xl w-full p-6 sm:p-8 shadow-[0_0_80px_rgba(200,20,20,0.7)] space-y-6 my-auto">
            <div className="flex items-center justify-between border-b border-crimson pb-3">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-crimson animate-ping" />
                <span className="text-crimson font-bold text-sm tracking-widest uppercase">
                  DIRECTORATE EMERGENCY LOCKDOWN // CLASSIFICATION OMEGA
                </span>
              </div>
            </div>

            <div className="bg-[#030101] border border-[#4a1515] p-5 space-y-4 text-xs leading-relaxed font-mono">
              <div className="text-crimson font-bold text-sm border-b border-[#3b1212] pb-2">
                DISPATCH FROM: OFFICE OF THE DIRECTOR
                <br />
                PRIORITY: MAXIMUM IMMEDIATE
                <br />
                SUBJECT: PERMANENT TERMINATION OF CASE 17 INQUIRIES
              </div>

              {/* 3 Sequenced Director Messages */}
              <div className="space-y-3 font-serif text-sm">
                <div className="p-3 bg-[#120505] border-l-4 border-crimson">
                  <span className="font-mono text-[10px] text-crimson block uppercase font-bold mb-1">
                    DIRECTOR DISPATCH 1/3
                  </span>
                  <p className="text-red-200 font-bold m-0 italic">"The case is closed."</p>
                </div>

                <div className="p-3 bg-[#120505] border-l-4 border-crimson">
                  <span className="font-mono text-[10px] text-crimson block uppercase font-bold mb-1">
                    DIRECTOR DISPATCH 2/3
                  </span>
                  <p className="text-red-200 font-bold m-0 italic">"You have done enough."</p>
                </div>

                <div className="p-3 bg-[#120505] border-l-4 border-crimson">
                  <span className="font-mono text-[10px] text-crimson block uppercase font-bold mb-1">
                    DIRECTOR DISPATCH 3/3
                  </span>
                  <p className="text-red-200 font-bold m-0 italic">
                    "Delete your local copies of the files and wait for further instructions."
                  </p>
                </div>
              </div>

              <p className="text-[#c4a4a4] font-mono text-[11px] m-0">
                A total transmission blackout has been applied to this terminal. However, breaking news accounts have bypassed the internal embargo.
              </p>

              <div className="p-3 bg-[#1c0808] border border-[#521313] text-[11px] text-red-300 font-bold flex items-center justify-between">
                <span>STAGE 06 REVIEW SOLVED // CLEARANCE GRANTED TO STAGE 07</span>
                <CheckCircle2 size={16} className="text-red-400" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  setShowFreezeModal(false);
                  onAdvanceToStage7?.();
                }}
                className="button bg-crimson hover:bg-red-800 text-white border border-red-500 py-2.5 px-5 font-mono text-xs font-bold tracking-wider cursor-pointer"
              >
                Acknowledge Directive → Proceed to Final Chronicle (Stage 07)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
