/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * INVESTIGATION COMMAND HUB (DASHBOARD)
 * 
 * Provides an authoritative central headquarters for Case TLS-0017:
 * - Current investigation stage, schedule window, and deadline
 * - Tactical Directive highlighting the investigator's next available action
 * - Primary "Continue Investigation" CTA opening the exact next target
 * - Complete 7-stage interactive chronology (completed, available, and sealed)
 * - Live score metrics, stage clearance rate, and task completion tally
 * - Photographic feed of recently unlocked and declassified evidence
 * - Priority communications and Directorate dispatch intercepts
 */

import React, { useMemo } from 'react';
import {
  Activity,
  Archive,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock3,
  Compass,
  FileText,
  FolderOpen,
  Info,
  LifeBuoy,
  Lock,
  Map as MapIcon,
  MessageSquare,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Unlock,
  Users,
} from 'lucide-react';

import {
  CASE_ID,
  evidence,
  messages,
  stages,
  type EvidenceItem,
  type Stage,
} from '@/src/lib/mockData';

import type { PrototypeUser, UserProgress } from '@/src/lib/prototypeAuth';
import {
  STAGE_SCHEDULE,
  calculateStageScore,
  formatCountdown,
  formatToIST,
  getRemainingTime,
  getStageDisplayInfo,
  isGameLaunched,
} from '@/src/lib/stageConfig';

import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { navigate } from '@/src/lib/navigation';
import { ISTClockWidget } from '@/src/components/ISTClockWidget';

export interface StageDirective {
  stageNumber: number;
  stageTitle: string;
  stageSubtitle: string;
  objectiveTitle: string;
  objectiveDescription: string;
  nextStepText: string;
  targetEvidenceId?: string;
  targetRoute: string;
  buttonLabel: string;
  badgeText: string;
}

/**
 * Computes the authoritative tactical directive and next available action
 * based on the investigator's current state.
 */
export function getInvestigatorDirective(progress: UserProgress): StageDirective {
  // Case completed (all 7 stages cleared)
  if (progress.stagesCompleted >= 7) {
    return {
      stageNumber: 7,
      stageTitle: "Ellen Vale's Journal and the Final Review",
      stageSubtitle: 'Research journal, 16mm reel & station incident',
      objectiveTitle: 'Case TLS-0017 Concluded',
      objectiveDescription:
        'All seven transmission signals have been intercepted, authenticated, and catalogued. The historical records alteration across 1971 and the present day has been unraveled.',
      nextStepText:
        'Review your declassified case audit, view merit scores across all stages, and print your official Case Investigator Certificate.',
      targetEvidenceId: 'EV-0702',
      targetRoute: '/debrief',
      buttonLabel: 'REVIEW CASE DEBRIEF & CERTIFICATE',
      badgeText: 'CASE SOLVED & CLEARED',
    };
  }

  // Stage 7 / System Freeze Active
  if (
    progress.systemFreezeTriggered ||
    progress.stage7Step === 'article_read' ||
    progress.stage7Step === 'ending_video_played'
  ) {
    return {
      stageNumber: 7,
      stageTitle: "Ellen Vale's Journal and the Final Review",
      stageSubtitle: 'Research journal, 16mm reel & station incident',
      objectiveTitle: 'Directorate Lockdown Protocol // Stage 07',
      objectiveDescription:
        'Transmissions have been severed by the Office of the Director following the 16mm reel evaluation. Emergency debrief clearance is required to review Chronicle Final Edition EV-0702.',
      nextStepText:
        'Access Debrief Clearance to examine the final newspaper edition, acknowledge station incident findings, and complete case debriefing.',
      targetEvidenceId: 'EV-0702',
      targetRoute: '/debrief',
      buttonLabel: 'PROCEED TO STAGE 07 DEBRIEF',
      badgeText: 'DIRECTORATE OVERRIDE ACTIVE',
    };
  }

  // Stage 7 Active (Ellen Vale Journal)
  if (progress.activeStage === 7 || progress.stagesCompleted >= 6) {
    return {
      stageNumber: 7,
      stageTitle: "Ellen Vale's Journal and the Final Review",
      stageSubtitle: 'Research journal, 16mm reel & station incident',
      objectiveTitle: "Examine Research Journal & Final Ending Transmission",
      objectiveDescription:
        "Historical researcher Ellen Vale's hardbound journal details cipher analysis from October 1971 and an attached 16mm film reel anticipating investigator responses.",
      nextStepText:
        'Inspect available case records in the Evidence Room, examine the handwritten entries, and evaluate the reel transmission to conclude the case.',
      targetEvidenceId: 'EV-0701',
      targetRoute: '/evidence',
      buttonLabel: 'INSPECT EVIDENCE FILES (EVIDENCE ROOM)',
      badgeText: 'STAGE 07 ACTIVE',
    };
  }

  // Stage 6 Active (The Record That Remembered Tomorrow)
  if (progress.activeStage === 6 || progress.stagesCompleted >= 5) {
    return {
      stageNumber: 6,
      stageTitle: 'The Record That Remembered Tomorrow',
      stageSubtitle: 'Incident Report 06-B & Archival Revision Paradox',
      objectiveTitle: 'Investigate Incident Report 06-B & Archival Revision Paradox',
      objectiveDescription:
        'Following Daniel Mercer\'s death, an unidentified source was found dead in a locked room. Compare conflicting archival records, examine the revision timestamp paradox, and deduce the archive access key.',
      nextStepText:
        'Inspect available case records in the Evidence Room, compare conflicting archival reports, and deduce the archive access key.',
      targetEvidenceId: 'EV-0601',
      targetRoute: '/evidence',
      buttonLabel: 'INSPECT EVIDENCE FILES (EVIDENCE ROOM)',
      badgeText: 'STAGE 06 ACTIVE',
    };
  }

  // Stage 5
  if (progress.activeStage === 5 || progress.stagesCompleted >= 4) {
    if (!progress.suspectDbUnlocked) {
      return {
        stageNumber: 5,
        stageTitle: 'The Mercer Inquest',
        stageSubtitle: 'Chronicle report & confidential dossiers',
        objectiveTitle: 'Authenticate Suspect Database Gate',
        objectiveDescription:
          'The San Francisco Chronicle special dispatch reports on Daniel Mercer and an anonymous message referencing the reopened 408 cipher.',
        nextStepText:
          'Submit the clearance key into the Suspect Database console or Clearance Terminal to declassify dossiers for Arthur Leigh Allen and Richard Gaikowski.',
        targetEvidenceId: 'EV-0501',
        targetRoute: '/suspects',
        buttonLabel: 'UNLOCK SUSPECT DATABASE (GATE 5)',
        badgeText: 'STAGE 05 GATE ACTIVE',
      };
    }
    return {
      stageNumber: 5,
      stageTitle: 'The Mercer Inquest',
      stageSubtitle: 'Confidential suspect dossiers',
      objectiveTitle: 'Examine Person of Interest Dossiers',
      objectiveDescription:
        'Suspect database unlocked. Review DOJ dossier S-02 (Arthur Leigh Allen) and intelligence dossier S-03 (Richard Gaikowski).',
      nextStepText:
        'Compare suspect timelines, fingerprint registries, and proximity to Presidio dispatch corridors.',
      targetEvidenceId: 'EV-0502',
      targetRoute: '/suspects',
      buttonLabel: 'INSPECT SUSPECT DOSSIERS',
      badgeText: 'STAGE 05 IN PROGRESS',
    };
  }

  // Stage 4
  if (
    progress.activeStage === 4 ||
    (progress.mapGateUnlocked && progress.targetChoiceEvaluationStatus !== 'revealed')
  ) {
    if (!progress.targetChoiceLocked) {
      return {
        stageNumber: 4,
        stageTitle: 'The 47-Second Tape',
        stageSubtitle: 'Dispatch recording & signal candidate',
        objectiveTitle: 'Submit Regional Triangulation Target',
        objectiveDescription:
          'Evaluate recovered audio evidence in the Evidence Room and cross-reference the unexplained pulse anomalies with regional telemetry vectors.',
        nextStepText:
          'Select and lock in your single irreversible location choice on the Cartographic Signal Map.',
        targetEvidenceId: 'EV-0401',
        targetRoute: '/map',
        buttonLabel: 'OPEN SIGNAL MAP & SUBMIT TARGET',
        badgeText: 'STAGE 04 IRREVERSIBLE CHOICE',
      };
    }
    return {
      stageNumber: 4,
      stageTitle: 'The 47-Second Tape',
      stageSubtitle: 'Target submission pending evaluation',
      objectiveTitle: 'Triangulation Submission Logged',
      objectiveDescription: `Your location candidate (Site 0${progress.targetLocationChoice}) has been submitted to the dispatch computer. Evaluation is pending official deadline clearance.`,
      nextStepText:
        'Inspect audio cassette in the Evidence Room or view your locked vector coordinates on the Cartographic Signal Map.',
      targetEvidenceId: 'EV-0401',
      targetRoute: '/map',
      buttonLabel: 'VIEW SIGNAL MAP TELEMETRY',
      badgeText: 'STAGE 04 PENDING EVALUATION',
    };
  }

  // Stage 3
  if (progress.activeStage === 3 || progress.stage2DeductionSolved) {
    if (!progress.mapGateUnlocked) {
      return {
        stageNumber: 3,
        stageTitle: 'The Presidio Witness',
        stageSubtitle: 'Case testimony & regional survey',
        objectiveTitle: 'Unlock Map Security Gate 3',
        objectiveDescription:
          'Decoded Stage 2 coordinates corroborated sensory recollections from Presidio Heights witness testimony.',
        nextStepText:
          'Review available witness testimony in the Evidence Room, then authenticate Map Gate 3 using the derived residential address to examine regional survey charts.',
        targetEvidenceId: 'CAS-017',
        targetRoute: '/map',
        buttonLabel: 'UNLOCK SIGNAL MAP GATE 3',
        badgeText: 'STAGE 03 GATE ACTIVE',
      };
    }
    return {
      stageNumber: 3,
      stageTitle: 'The Presidio Witness',
      stageSubtitle: 'Regional survey & transmission mast',
      objectiveTitle: 'Survey Cartographic Triangulation Sites',
      objectiveDescription:
        'Regional survey charts and candidate telemetry sites are available on the Cartographic Signal Map.',
      nextStepText:
        'Review unlocked evidence in the Evidence Room and inspect candidate telemetry sites on the Cartographic Signal Map.',
      targetEvidenceId: 'EV-0301',
      targetRoute: '/map',
      buttonLabel: 'SURVEY CARTOGRAPHIC MAP',
      badgeText: 'STAGE 03 ACTIVE',
    };
  }

  // Stage 2
  if (progress.activeStage === 2 || progress.stagesCompleted >= 1) {
    return {
      stageNumber: 2,
      stageTitle: 'The Lower Vault',
      stageSubtitle: 'County records bay & negative telemetry',
      objectiveTitle: 'Survey Photographic Negatives & Telemetry in Lower Vault',
      objectiveDescription:
        'Vault Sector 01 has been declassified. Four photographic negatives recovered across Bay Area counties (Solano, Napa, and San Francisco) require examination in the Evidence Room.',
      nextStepText:
        'Inspect the recovered photographic negatives in the Evidence Room, cross-reference their telemetry notations, and deduce the location coordinates.',
      targetEvidenceId: 'EV-0201',
      targetRoute: '/evidence',
      buttonLabel: 'CONTINUE INVESTIGATION (EVIDENCE ROOM)',
      badgeText: 'STAGE 02 ACTIVE',
    };
  }

  // Default Stage 1
  return {
    stageNumber: 1,
    stageTitle: 'The Archive',
    stageSubtitle: "The archivist's letter & docket registry",
    objectiveTitle: 'First Directive: Review Declassified Evidence & Case Files',
    objectiveDescription:
      'Historical records from 1974 have reopened. First Directive orientation requires examining the declassified police overview dossiers and analyzing catalogued correspondence in the Evidence Room.',
    nextStepText:
      'Access the Evidence Room to investigate all unlocked files and catalogued correspondence, then submit credentials at the Clearance Terminal.',
    targetEvidenceId: 'EV-0103',
    targetRoute: '/evidence',
    buttonLabel: 'CONTINUE INVESTIGATION (EVIDENCE ROOM)',
    badgeText: 'FIRST DIRECTIVE ACTIVE',
  };
}

export function InvestigationDashboard({
  user,
  progress,
  onUpdateProgress,
}: {
  user: PrototypeUser;
  progress: UserProgress;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
}) {
  const directive = useMemo(() => getInvestigatorDirective(progress), [progress]);

  // Compute unlocked evidence items sorted by most recently accessible
  const unlockedItems = useMemo(() => {
    const list = evidence.filter((item) => {
      if (progress.hasStageOverride) return true;
      if (!isGameLaunched()) return false;
      return (
        progress.unlockedEvidenceIds.includes(item.id) ||
        (item.stage !== undefined && item.stage <= progress.activeStage)
      );
    });
    // Sort so items belonging to the current active stage appear first, then descending stage
    return [...list].sort((a, b) => {
      if (b.stage !== a.stage) return b.stage - a.stage;
      return b.id.localeCompare(a.id);
    });
  }, [progress.unlockedEvidenceIds, progress.activeStage, progress.hasStageOverride]);

  const percentCompleted = Math.round((progress.stagesCompleted / 7) * 100);
  const isFreshState = progress.status === 'NOT STARTED' && progress.tasksCompleted === 0;
  const activeStageConfig =
    STAGE_SCHEDULE.find((s) => s.number === directive.stageNumber) ?? STAGE_SCHEDULE[0];

  return (
    <div className="space-y-8">
      {/* Top Investigator Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-crimson mb-1.5">
            <span className="size-2 rounded-full bg-crimson animate-ping" />
            <span>INVESTIGATION COMMAND HUB // CASE {CASE_ID}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground tracking-tight">
            Case Headquarters
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 font-mono text-xs text-muted-foreground">
            <span>
              Operative: <strong className="text-foreground">{user.callSign}</strong>
            </span>
            <span className="text-border">|</span>
            <span>Class: {user.studentClass}</span>
            <span className="text-border">|</span>
            <span>Clearance: Stage 0{progress.activeStage} Authorized</span>
            <span className="text-border">|</span>
            <span className="text-crimson font-medium">Status: {progress.status}</span>
          </div>
        </div>

        {/* Primary Dynamic Continue Investigation CTA */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              navigate(directive.targetRoute);
            }}
            className="button button-primary py-3.5 px-6 text-xs font-mono font-bold tracking-[0.2em] shadow-[0_0_20px_rgba(158,27,27,0.35)] flex items-center gap-3 group"
          >
            <span className="size-2 rounded-full bg-white animate-pulse" />
            <span>CONTINUE INVESTIGATION</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Quick Navigation Hub Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
        <button
          onClick={() => {
            tacticalAudio.playDocOpen();
            navigate('/first-directive');
          }}
          className="p-3 bg-[#111a14] border border-[#284230] hover:border-[#8deb9e] transition-colors flex items-center gap-3 text-left group"
        >
          <FolderOpen size={16} className="text-[#8deb9e] shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase">First Directive</span>
            <span className="text-[#8deb9e] font-medium">Classified Case Files</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/evidence')}
          className="p-3 bg-[#131413] border border-border hover:border-crimson/50 transition-colors flex items-center gap-3 text-left group"
        >
          <FolderOpen size={16} className="text-crimson shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase">Archive Vault</span>
            <span className="text-foreground font-medium">Evidence Room</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/terminal')}
          className="p-3 bg-[#101912] border border-[#1b3d22] hover:border-emerald-500 transition-colors flex items-center gap-3 text-left group"
        >
          <Terminal size={16} className="text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase">Decryption</span>
            <span className="text-emerald-300 font-medium">Clearance Terminal</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/map')}
          className="p-3 bg-[#131413] border border-border hover:border-crimson/50 transition-colors flex items-center gap-3 text-left group"
        >
          <Compass size={16} className="text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase">Cartographic</span>
            <span className="text-foreground font-medium">Signal Map</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/suspects')}
          className="p-3 bg-[#131413] border border-border hover:border-crimson/50 transition-colors flex items-center gap-3 text-left group"
        >
          <Shield size={16} className="text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase">Classified Files</span>
            <span className="text-foreground font-medium">Suspect Database</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/messages')}
          className="p-3 bg-[#131413] border border-border hover:border-crimson/50 transition-colors flex items-center gap-3 text-left group"
        >
          <Radio size={16} className="text-red-400 shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase">Dispatches</span>
            <span className="text-foreground font-medium">Signal Monitor</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/support')}
          className="p-3 bg-[#131413] border border-border hover:border-crimson/50 transition-colors flex items-center gap-3 text-left group"
        >
          <LifeBuoy size={16} className="text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase">Assistance</span>
            <span className="text-foreground font-medium">Support Desk</span>
          </div>
        </button>
      </div>

      {/* TACTICAL DIRECTIVE HERO CARD (Next Available Action & Current Stage) */}
      <div className="panel border-2 border-crimson/80 bg-[#140e0e] shadow-[0_0_30px_rgba(158,27,27,0.18)] p-6 md:p-8 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d1919] pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-crimson animate-ping" />
            <span className="stamp text-crimson border-crimson text-[11px] font-bold tracking-widest">
              TACTICAL DIRECTIVE // ACTIVE PRIORITY
            </span>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-crimson font-medium bg-red-950/60 px-3 py-1 border border-crimson/40">
            {directive.badgeText}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Action & Directive Body (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Structured Stage Number & Objective Headline (Normal Layout Flow — Never Overlaps) */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Prominent Stage Index Plaque */}
              <div
                className="shrink-0 flex sm:flex-col items-center justify-center gap-2 sm:gap-0.5 border-2 border-crimson/60 bg-[#1e0e0e] px-3.5 py-2 sm:px-4 sm:py-3 shadow-[0_0_15px_rgba(158,27,27,0.25)] self-start"
                aria-label={`Active Investigation Stage 0${directive.stageNumber}`}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-crimson font-bold block">
                  STAGE
                </span>
                <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold text-[#ebe6dc] leading-none tracking-tight block my-0.5">
                  0{directive.stageNumber}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8d8880] block">
                  OF 07
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  <span className="text-crimson font-semibold">Active Sector</span>
                  <span className="text-border">·</span>
                  <span className="text-[#a8a39a]">{directive.stageSubtitle}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light text-foreground leading-tight tracking-tight break-words">
                  {directive.objectiveTitle}
                </h2>
              </div>
            </div>

            <p className="font-serif text-base text-[#dcd6c9] leading-relaxed max-w-2xl">
              {directive.objectiveDescription}
            </p>

            {/* Highlighted Next Available Action Callout Box */}
            <div className="p-4 bg-[#1b1010] border-l-4 border-crimson border-y border-r border-[#3d1919] space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-crimson font-bold">
                <Terminal size={14} />
                <span>NEXT AVAILABLE ACTION:</span>
              </div>
              <p className="font-mono text-xs text-[#ece6d9] leading-relaxed m-0 font-medium">
                {directive.nextStepText}
              </p>
            </div>

            {/* Direct Continuation Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  navigate(directive.targetRoute);
                }}
                className="button button-primary py-3 px-6 text-xs font-mono font-bold tracking-wider flex items-center gap-2"
              >
                <span>{directive.buttonLabel}</span>
                <ArrowRight size={15} />
              </button>

              <button
                onClick={() => {
                  tacticalAudio.playDocOpen();
                  navigate('/first-directive');
                }}
                className="button bg-[#19271c] hover:bg-[#223627] text-[#8deb9e] border border-[#3e6849] py-3 px-4 text-xs font-mono font-bold tracking-wider flex items-center gap-2 shadow"
              >
                <FolderOpen size={14} className="text-[#8deb9e]" />
                <span>First Directive (5 Case Files)</span>
              </button>

              {directive.targetEvidenceId && (
                <button
                  onClick={() => {
                    tacticalAudio.playDocOpen();
                    navigate(`/evidence/${directive.targetEvidenceId}`);
                  }}
                  className="button button-secondary text-xs font-mono py-3 px-4 flex items-center gap-2"
                >
                  <FileText size={14} />
                  <span>Inspect Docket ({directive.targetEvidenceId})</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Stage Window & Schedule Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-[#3d1919] pt-4 lg:pt-0 lg:pl-6 font-mono text-xs">
            <div className="space-y-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest block">
                TIMETABLE &amp; SCORING RULES
              </span>

              <div className="p-3 bg-[#0d0909] border border-[#3d1919] space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Investigation Window:</span>
                  <span className="text-foreground font-semibold">{activeStageConfig.openDateIST.slice(0, 11)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Scoring Deadline:</span>
                  <span className="text-crimson font-medium">{activeStageConfig.deadlineIST}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Base Merit Points:</span>
                  <span className="text-foreground font-semibold">{activeStageConfig.basePoints} pts</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Hourly Speed Bonus:</span>
                  <span className="text-emerald-400 font-semibold">Up to +{activeStageConfig.maxHourlyBonus} pts</span>
                </div>
              </div>

              {/* Live IST Stage Clock Widget */}
              <ISTClockWidget activeStageNumber={directive.stageNumber} variant="detailed" />
            </div>

            <div className="pt-2 text-[10px] text-muted-foreground leading-relaxed">
              Solve requirements within the 48-hour window to maximize speed bonuses. Late answers are accepted for case completion.
            </div>
          </div>
        </div>
      </div>

      {/* METRICS & CASE PROGRESS MATRIX */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Stages Cleared */}
        <div className="panel flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-muted-foreground font-mono text-xs">
            <span>STAGES CLEARED</span>
            <Activity size={15} />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-light text-foreground">
                0{progress.stagesCompleted} <span className="text-muted-foreground text-lg">/ 07</span>
              </span>
              <span className="status-pill available text-[10px]">{percentCompleted}% DONE</span>
            </div>

            {/* 7-Segment Progress Track */}
            <div className="grid grid-cols-7 gap-1 mt-3">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isCleared = num <= progress.stagesCompleted;
                const isActive = num === progress.activeStage && !isCleared;
                return (
                  <div
                    key={num}
                    title={`Stage 0${num}: ${isCleared ? 'Cleared' : isActive ? 'Active' : 'Locked'}`}
                    className={`h-2 transition-all ${
                      isCleared
                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                        : isActive
                        ? 'bg-crimson animate-pulse'
                        : 'bg-[#222120]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {progress.stagesCompleted === 7
              ? 'Case solved in full'
              : `${7 - progress.stagesCompleted} stages remaining`}
          </span>
        </div>

        {/* Metric 2: Investigation Score */}
        <div className="panel flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-muted-foreground font-mono text-xs">
            <span>TOTAL SCORE</span>
            <Award size={15} className="text-crimson" />
          </div>
          <div>
            <div className="font-mono text-3xl font-bold text-crimson">
              {progress.score} <span className="text-muted-foreground text-base font-normal">pts</span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              {progress.score > 0
                ? `${progress.solvedChallengeKeys.length} verified stage solution(s)`
                : 'Solve Stage 01 to register first merit points'}
            </p>
          </div>
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-button text-[11px] justify-between border-t border-line-soft pt-2"
          >
            <span>View Leaderboard Standings</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Metric 3: Evidence Unlocked */}
        <div className="panel flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-muted-foreground font-mono text-xs">
            <span>DECLASSIFIED EVIDENCE</span>
            <Archive size={15} />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-light text-foreground">
                {unlockedItems.length} <span className="text-muted-foreground text-lg">/ {evidence.length}</span>
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {Math.round((unlockedItems.length / evidence.length) * 100)}%
              </span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              Documents, negatives, audio tapes &amp; dossiers
            </p>
          </div>
          <button
            onClick={() => navigate('/evidence')}
            className="text-button text-[11px] justify-between border-t border-line-soft pt-2"
          >
            <span>Open Evidence Room</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Metric 4: Assigned Unit */}
        <div className="panel flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-muted-foreground font-mono text-xs">
            <span>ASSIGNED UNIT</span>
            <Users size={15} />
          </div>
          <div>
            <div className="font-serif text-xl font-light text-foreground truncate">
              {progress.teamName ?? 'Solo Operative'}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              Student: {user.fullName} ({user.admissionNumberMasked})
            </p>
          </div>
          <button
            onClick={() => navigate('/team')}
            className="text-button text-[11px] justify-between border-t border-line-soft pt-2"
          >
            <span>{progress.teamName ? 'Manage Team Unit' : 'Form or Join Team'}</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* COMPLETED & AVAILABLE STAGES ROADMAP */}
      <div className="panel space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="eyebrow block">SEVEN SIGNALS CHRONOLOGY</span>
            <h3 className="font-serif text-2xl font-light text-foreground">
              Investigation Roadmap
            </h3>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            Stage clearance unlocks subsequent archive tiers in sequence
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stages.map((st) => {
            const displayInfo = getStageDisplayInfo(st.number, progress);
            const isCompleted = displayInfo.isCompleted;
            const isActive = displayInfo.isActive;
            const isLocked = !displayInfo.isReleased;

            return (
              <div
                key={st.number}
                onClick={() => {
                  if (isActive) {
                    tacticalAudio.playButtonClick();
                    navigate(directive.targetRoute);
                  } else if (isCompleted) {
                    tacticalAudio.playButtonClick();
                    // Open Evidence Room or relevant zone for this stage
                    if (st.number === 1 || st.number === 2 || st.number === 6) {
                      navigate('/evidence');
                    } else if (st.number === 3 || st.number === 4) {
                      navigate('/map');
                    } else if (st.number === 5) {
                      navigate('/suspects');
                    } else if (st.number === 7) {
                      navigate(progress.systemFreezeTriggered || progress.stagesCompleted >= 7 ? '/debrief' : '/evidence');
                    }
                  } else if (progress.hasStageOverride) {
                    tacticalAudio.playButtonClick();
                    if (st.number === 1 || st.number === 2 || st.number === 6 || st.number === 7) {
                      navigate('/evidence');
                    } else if (st.number === 3 || st.number === 4) {
                      navigate('/map');
                    } else if (st.number === 5) {
                      navigate('/suspects');
                    }
                  } else {
                    tacticalAudio.playError();
                  }
                }}
                className={`p-4 border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'border-crimson bg-[#180e0e] shadow-[0_0_15px_rgba(158,27,27,0.25)] cursor-pointer'
                    : isCompleted
                    ? 'border-emerald-900/60 bg-[#0e1610] cursor-pointer hover:border-emerald-700'
                    : progress.hasStageOverride
                    ? 'border-amber-900/50 bg-[#16130d] cursor-pointer hover:border-amber-700/80 shadow-[0_0_10px_rgba(217,119,6,0.1)]'
                    : 'border-border/40 bg-[#0f0f0e] opacity-60 cursor-not-allowed select-none'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase mb-2">
                    <span className={isLocked ? 'text-muted-foreground/70' : 'text-muted-foreground'}>
                      STAGE 0{st.number}
                    </span>
                    {isCompleted ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> CLEARED
                      </span>
                    ) : isActive ? (
                      <span className="text-crimson font-bold flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-crimson animate-ping" />
                        ACTIVE
                      </span>
                    ) : progress.hasStageOverride ? (
                      <span className="text-amber-400/90 font-mono text-[10px] font-bold flex items-center gap-1">
                        <Unlock size={11} /> OVERRIDE UNLOCKED
                      </span>
                    ) : (
                      <span className="text-muted-foreground/80 flex items-center gap-1">
                        <Lock size={11} /> SIGNAL LOCKED
                      </span>
                    )}
                  </div>

                  <h4
                    className={`font-serif text-lg font-light leading-tight ${
                      isLocked ? 'text-[#8d8880] italic' : 'text-foreground'
                    }`}
                  >
                    {displayInfo.title}
                  </h4>
                  <p
                    className={`font-mono text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                      isLocked ? 'text-[#635f58]' : 'text-muted-foreground'
                    }`}
                  >
                    {displayInfo.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-line-soft flex items-center justify-between font-mono text-[10px]">
                  <span className="text-muted-foreground/80">{st.date}</span>
                  {isActive && (
                    <span className="text-crimson font-bold flex items-center gap-1">
                      Proceed →
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      Review Record →
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-muted-foreground/50 flex items-center gap-1">
                      <Lock size={10} /> Sealed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENTLY UNLOCKED EVIDENCE FEED */}
      <div className="panel space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-crimson">
              <FolderOpen size={14} />
              <span>DECLASSIFIED EVIDENCE REPOSITORY</span>
            </div>
            <h3 className="font-serif text-2xl font-light text-foreground mt-1">
              Accessible Case Files ({unlockedItems.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground hidden md:inline">
              Showing {Math.min(unlockedItems.length, 6)} of {unlockedItems.length} unlocked items
            </span>
            <button
              onClick={() => navigate('/evidence')}
              className="button button-secondary text-xs font-mono py-2 px-3 flex items-center gap-1.5"
            >
              <FolderOpen size={13} />
              <span>Browse Full Evidence Room →</span>
            </button>
          </div>
        </div>

        {/* 4:3 Photographic Card Grid for Recently Unlocked Evidence */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unlockedItems.slice(0, 6).map((item) => (
            <div
              key={item.id}
              onClick={() => {
                tacticalAudio.playDocOpen();
                navigate(`/evidence/${item.id}`);
              }}
              className="evidence-card group cursor-pointer hover:border-crimson/60 transition-all bg-[#121211]"
            >
              <div className="evidence-media aspect-[4/3] relative overflow-hidden bg-black/40">
                <img
                  src={item.image ?? '/images/hero-scene.png'}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="film-grain absolute inset-0 pointer-events-none" />

                <div className="evidence-overlay-chips">
                  <span className="evidence-chip">{item.id}</span>
                  <span className="evidence-chip restricted">{item.classification}</span>
                </div>

                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#dcd6c9] border border-border">
                  Stage 0{item.stage}
                </div>
              </div>

              <div className="evidence-body p-4 space-y-2">
                <div className="evidence-topline flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span>{item.kind}</span>
                  <span>{item.date}</span>
                </div>
                <h4 className="evidence-title font-serif text-lg font-light text-foreground group-hover:text-crimson transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="evidence-desc font-serif text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>

                <div className="evidence-footer pt-3 border-t border-line-soft flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span className="truncate max-w-[150px]">{item.source}</span>
                  <span className="text-crimson font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect Record →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT DISPATCHES & PROTOTYPE STORAGE NOTICE */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Communications Monitor */}
        <div className="panel space-y-4">
          <div className="panel-heading">
            <span className="flex items-center gap-2">
              <Radio size={14} className="text-crimson" />
              <span>OFFICIAL COMMUNICATIONS MONITOR</span>
            </span>
            <button
              onClick={() => navigate('/messages')}
              className="text-button text-xs"
            >
              All Dispatches →
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Priority lockdown banner if triggered */}
            {progress.systemFreezeTriggered && (
              <div className="p-3 bg-red-950/80 border border-crimson text-red-200 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-red-400">
                  <span>PRIORITY DISPATCH // DIRECTORATE OMEGA OVERRIDE</span>
                  <span className="animate-pulse">SEVERED FREQUENCY</span>
                </div>
                <p className="font-serif italic text-sm m-0">
                  "The case is closed. You have done enough. Proceed to Debrief Clearance."
                </p>
              </div>
            )}

            {messages.slice(0, 3).map((msg, idx) => (
              <div
                key={msg.sender + idx}
                className="p-3 bg-[#111110] border border-border space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground">
                  <span
                    className={
                      msg.tone === 'antagonist'
                        ? 'text-crimson font-bold'
                        : msg.tone === 'director'
                        ? 'text-emerald-400 font-bold'
                        : 'text-foreground'
                    }
                  >
                    {msg.sender}
                  </span>
                  <span>{msg.time}</span>
                </div>
                <p className="font-serif text-sm text-[#d6d0c4] leading-relaxed m-0">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Prototype Architecture & Transparent Persistence Notice */}
        <div className="panel space-y-4 flex flex-col justify-between">
          <div>
            <div className="panel-heading">
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span>INVESTIGATION ARCHITECTURE &amp; AUDIT</span>
              </span>
              <span className="font-mono text-[9px] border border-border px-1.5 py-0.5 text-muted-foreground">
                LOCAL PERSISTENCE
              </span>
            </div>

            <p className="font-serif text-sm leading-relaxed text-[#c7c1b5] mt-2">
              Investigator progress, stage clearance milestones, decrypted coordinates, and audit logs
              are preserved locally in your browser storage. Solution checks run deterministically on the client,
              with official competition grading verified against the case registry.
            </p>

            <div className="mt-4 p-3.5 bg-[#141413] border border-border font-mono text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>LOCAL PROFILE KEY:</span>
                <span className="text-foreground">tls_progress_user_{user.callSign.toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>SECURITY AUDIT:</span>
                <span className="text-emerald-400">Zero Solution Leaks in Client Code</span>
              </div>
              <div className="flex justify-between">
                <span>EVENT DEADLINE:</span>
                <span className="text-foreground">15 Nov 2026 / 23:59 IST</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-line-soft flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span>Online-only mystery investigation</span>
            <button
              onClick={() => navigate('/account')}
              className="text-crimson hover:underline"
            >
              Account &amp; Safety Controls →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
