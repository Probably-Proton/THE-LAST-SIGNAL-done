/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANONICAL STAGE CONFIGURATION & SCORING ENGINE (IST / Asia/Kolkata)
 * 
 * Defines official stage windows, scoring deadlines, base points,
 * hourly bonus calculations, and target selection rules for Case TLS-0017.
 */

export interface StageScheduleConfig {
  number: number;
  title: string;
  subtitle: string;
  // Official window in IST (Asia/Kolkata)
  openDateIST: string;
  deadlineIST: string;
  // ISO-8601 strings with +05:30 offset for deterministic UTC parsing
  openIso: string;
  deadlineIso: string;
  basePoints: number;
  maxHourlyBonus: number; // 24 points max (1 pt/hr)
  maxTotalScore: number; // 124 points
  targetBonus?: number; // e.g. Site 04 bonus
}

/**
 * =========================================================================
 * CANONICAL COMPETITION TIMELINE (Asia/Kolkata / IST / UTC+05:30)
 * =========================================================================
 * Centralized configuration location for registration opening and official
 * game launch across the entire application.
 */
export const REGISTRATION_OPEN_ISO = '2026-10-30T00:00:00+05:30';
export const REGISTRATION_OPEN_IST = '30 Oct 2026, 00:00:00 IST';

export const GAME_LAUNCH_ISO = '2026-11-01T00:00:00+05:30';
export const GAME_LAUNCH_IST = '01 Nov 2026, 00:00:00 IST';

/**
 * Master gate control for timeline blocking enforcement.
 * Set to FALSE: The investigation is officially LIVE and OPEN to all students.
 */
export const ENABLE_TIMELINE_GATES = false;

/**
 * Check whether investigator registration has officially opened in IST.
 * In this live release, student registration is actively open.
 */
export function isRegistrationOpen(referenceTime = new Date()): boolean {
  if (!ENABLE_TIMELINE_GATES) return true;
  return referenceTime.getTime() >= new Date(REGISTRATION_OPEN_ISO).getTime();
}

/**
 * Check whether the main game investigation has officially launched in IST.
 * Evaluates to true for the live investigation.
 */
export function isGameLaunched(referenceTime = new Date()): boolean {
  if (!ENABLE_TIMELINE_GATES) return true;
  return referenceTime.getTime() >= new Date(GAME_LAUNCH_ISO).getTime();
}

export const STAGE_POINTS = 100;
export const TARGET_INTERCEPT_BONUS = 20;

/**
 * Check whether a stage is open for access based on player progression and schedule.
 * When the investigation is live, an operative can access any stage up to stagesCompleted + 1.
 */
export function isStageAccessible(
  stageNumber: number,
  stagesCompleted: number,
  referenceTime = new Date(),
  hasStageOverride = false
): boolean {
  if (hasStageOverride) {
    return true;
  }
  if (!isGameLaunched(referenceTime)) {
    return false;
  }
  if (stageNumber <= stagesCompleted + 1) {
    if (!ENABLE_TIMELINE_GATES) return true;
    const stage = STAGE_SCHEDULE.find((s) => s.number === stageNumber);
    if (!stage) return false;
    return referenceTime.getTime() >= new Date(stage.openIso).getTime();
  }
  return false;
}

/**
 * Check whether submissions for a stage are eligible for competitive points.
 */
export function isStageScoringEligible(
  stageNumber: number,
  referenceTime = new Date()
): boolean {
  if (!ENABLE_TIMELINE_GATES) return true;
  const stage = STAGE_SCHEDULE.find((s) => s.number === stageNumber);
  if (!stage) return true;
  return referenceTime.getTime() <= new Date(stage.deadlineIso).getTime();
}

export interface StageDisplayInfo {
  number: number;
  title: string;
  subtitle: string;
  isReleased: boolean;
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
  statusLabel: 'CLEARED' | 'ACTIVE' | 'SIGNAL LOCKED';
  scheduleDateIST: string;
  deadlineIST: string;
  badgeText: string;
}

/**
 * Determine stage release state and return release-aware presentation metadata.
 * Released stages display their genuine title and case subtitle.
 * Unreleased stages display neutral "SIGNAL LOCKED" badges without exposing
 * upcoming story names, challenge content, or narrative summaries.
 */
export function getStageDisplayInfo(
  stageNumber: number,
  progress?: { activeStage?: number; stagesCompleted?: number; hasStageOverride?: boolean } | null,
  referenceTime = new Date()
): StageDisplayInfo {
  const stage = STAGE_SCHEDULE.find((s) => s.number === stageNumber);
  const activeStage = progress?.activeStage ?? 1;
  const stagesCompleted = progress?.stagesCompleted ?? 0;
  const hasOverride = Boolean(progress?.hasStageOverride);

  const isCompleted = stageNumber <= stagesCompleted;
  const isActive = stageNumber === activeStage && !isCompleted;
  const isLocked = !hasOverride && stageNumber > activeStage;

  // A stage is considered released if the investigator has unlocked it via progress,
  // if an individual override is verified, or if its official timetable release timestamp has arrived.
  const scheduleReleaseReached =
    stage !== undefined && referenceTime.getTime() >= new Date(stage.openIso).getTime();

  const isReleased = hasOverride || isCompleted || isActive || Boolean(scheduleReleaseReached);

  const realTitle = stage?.title ?? `Stage 0${stageNumber}`;
  const realSubtitle = stage?.subtitle ?? `Case Sector 0${stageNumber}`;

  return {
    number: stageNumber,
    // Conceal titles & subtitles for unreleased stages
    title: isReleased ? realTitle : 'SIGNAL LOCKED',
    subtitle: isReleased
      ? realSubtitle
      : 'Archival transmission encrypted · Content sealed until wave release',
    isReleased,
    isCompleted,
    isActive,
    isLocked,
    statusLabel: isCompleted
      ? 'CLEARED'
      : isActive
      ? 'ACTIVE'
      : 'SIGNAL LOCKED',
    scheduleDateIST: stage?.openDateIST ?? '',
    deadlineIST: stage?.deadlineIST ?? '',
    badgeText: isCompleted
      ? 'CLEARED'
      : isActive
      ? `STAGE 0${stageNumber} ACTIVE`
      : 'LOCKED',
  };
}

export interface CountdownBreakdown {
  msRemaining: number;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
  formatted: string;
}

/**
 * Compute drift-free countdown breakdown against an authoritative ISO timestamp.
 */
export function getCountdownBreakdown(
  targetIso: string,
  referenceTime = new Date()
): CountdownBreakdown {
  const target = new Date(targetIso).getTime();
  const current = referenceTime.getTime();
  const msRemaining = Math.max(0, target - current);
  const totalSeconds = Math.floor(msRemaining / 1000);
  const isComplete = msRemaining <= 0;

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (isComplete) {
    formatted = '00:00:00';
  } else if (days > 0) {
    formatted = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  } else {
    formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  return {
    msRemaining,
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    isComplete,
    formatted,
  };
}

/**
 * Official Case 17 Timetable (IST / UTC+05:30)
 * Note: Launch dates are scheduled for the official competition window.
 * Prototype investigators can solve ahead or test deadlines.
 */
export const STAGE_SCHEDULE: StageScheduleConfig[] = [
  {
    number: 1,
    title: 'The Archive',
    subtitle: "The archivist's letter & docket registry",
    openDateIST: '2026-11-01 00:00 IST',
    deadlineIST: '2026-11-03 23:59 IST',
    openIso: '2026-11-01T00:00:00+05:30',
    deadlineIso: '2026-11-03T23:59:59+05:30',
    basePoints: 100,
    maxHourlyBonus: 24,
    maxTotalScore: 124,
  },
  {
    number: 2,
    title: 'The Lower Vault',
    subtitle: 'County records bay & negative telemetry',
    openDateIST: '2026-11-03 00:00 IST',
    deadlineIST: '2026-11-05 23:59 IST',
    openIso: '2026-11-03T00:00:00+05:30',
    deadlineIso: '2026-11-05T23:59:59+05:30',
    basePoints: 100,
    maxHourlyBonus: 24,
    maxTotalScore: 124,
  },
  {
    number: 3,
    title: 'The Presidio Witness',
    subtitle: 'Case testimony & regional survey',
    openDateIST: '2026-11-05 00:00 IST',
    deadlineIST: '2026-11-07 23:59 IST',
    openIso: '2026-11-05T00:00:00+05:30',
    deadlineIso: '2026-11-07T23:59:59+05:30',
    basePoints: 100,
    maxHourlyBonus: 24,
    maxTotalScore: 124,
  },
  {
    number: 4,
    title: 'The 47-Second Tape',
    subtitle: 'Dispatch recording & signal candidate',
    openDateIST: '2026-11-07 00:00 IST',
    deadlineIST: '2026-11-09 23:59 IST',
    openIso: '2026-11-07T00:00:00+05:30',
    deadlineIso: '2026-11-09T23:59:59+05:30',
    basePoints: 100,
    maxHourlyBonus: 24,
    maxTotalScore: 124,
    targetBonus: 20, // +20 bonus points for correctly designating Site 04
  },
  {
    number: 5,
    title: 'The Mercer Inquest',
    subtitle: 'Chronicle report & confidential dossiers',
    openDateIST: '2026-11-09 00:00 IST',
    deadlineIST: '2026-11-11 23:59 IST',
    openIso: '2026-11-09T00:00:00+05:30',
    deadlineIso: '2026-11-11T23:59:59+05:30',
    basePoints: 100,
    maxHourlyBonus: 24,
    maxTotalScore: 124,
  },
  {
    number: 6,
    title: 'The Record That Remembered Tomorrow',
    subtitle: 'Incident Report 06-B & Archival Revision Paradox',
    openDateIST: '2026-11-11 00:00 IST',
    deadlineIST: '2026-11-13 23:59 IST',
    openIso: '2026-11-11T00:00:00+05:30',
    deadlineIso: '2026-11-13T23:59:59+05:30',
    basePoints: 100,
    maxHourlyBonus: 24,
    maxTotalScore: 124,
  },
  {
    number: 7,
    title: "Ellen Vale's Journal and the Final Review",
    subtitle: 'Research journal, 16mm reel & station incident',
    openDateIST: '2026-11-13 00:00 IST',
    deadlineIST: '2026-11-15 23:59 IST',
    openIso: '2026-11-13T00:00:00+05:30',
    deadlineIso: '2026-11-15T23:59:59+05:30',
    basePoints: 100,
    maxHourlyBonus: 24,
    maxTotalScore: 124,
  },
];

/**
 * Format a Date object or ISO string in Indian Standard Time (IST)
 */
export function formatToIST(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${formatter.format(d)} IST`;
}

/**
 * Get current time in Indian Standard Time (formatted string)
 */
export function getCurrentTimeIST(): string {
  return formatToIST(new Date());
}

/**
 * Get remaining time until a deadline in milliseconds
 */
export function getRemainingTime(deadlineIso: string, referenceTime = new Date()): number {
  const deadline = new Date(deadlineIso).getTime();
  const current = referenceTime.getTime();
  return Math.max(0, deadline - current);
}

/**
 * Format remaining milliseconds into human-readable countdown: "DDd HHh MMm SSs"
 */
export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'DEADLINE EXPIRED';

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * Check whether a given solve timestamp occurred before the stage deadline.
 */
export function isSolveBeforeDeadline(solveTimestampIso: string, stageNumber: number): boolean {
  const stage = STAGE_SCHEDULE.find((s) => s.number === stageNumber);
  if (!stage) return true;

  const solveTime = new Date(solveTimestampIso).getTime();
  const deadlineTime = new Date(stage.deadlineIso).getTime();
  return solveTime <= deadlineTime;
}

export interface StageScoreBreakdown {
  stageNumber: number;
  basePoints: number;
  elapsedHours: number;
  hourlyBonus: number;
  targetBonus: number;
  totalScore: number;
  scoringEligible: boolean;
  solveTimestampIST: string;
  deadlineIST: string;
}

/**
 * Calculate stage score according to official specification:
 * - Base points: 100 pts per solve
 * - Hourly bonus: +1 pt per elapsed hour from stage opening (or speed bonus), capped at 24 pts
 *   Formula: min(floor(elapsed_hours), 24)
 * - Maximum points per stage: 124 pts (plus optional target bonus)
 * - Solves submitted after deadline award 0 competitive points (story progression only, scoringEligible = false)
 */
export function calculateStageScore(
  stageNumber: number,
  solveTimestampIso: string,
  options?: { isCorrectTarget?: boolean }
): StageScoreBreakdown {
  const stage = STAGE_SCHEDULE.find((s) => s.number === stageNumber);
  if (!stage) {
    return {
      stageNumber,
      basePoints: 100,
      elapsedHours: 0,
      hourlyBonus: 0,
      targetBonus: 0,
      totalScore: 100,
      scoringEligible: true,
      solveTimestampIST: formatToIST(solveTimestampIso),
      deadlineIST: 'N/A',
    };
  }

  const solveTime = new Date(solveTimestampIso).getTime();
  const deadlineTime = new Date(stage.deadlineIso).getTime();
  const openTime = new Date(stage.openIso).getTime();

  const isEligible = solveTime <= deadlineTime;

  if (!isEligible) {
    // Solved after deadline: 0 competitive points, story progress only
    return {
      stageNumber,
      basePoints: 0,
      elapsedHours: 0,
      hourlyBonus: 0,
      targetBonus: 0,
      totalScore: 0,
      scoringEligible: false,
      solveTimestampIST: formatToIST(solveTimestampIso),
      deadlineIST: stage.deadlineIST,
    };
  }

  // Calculate elapsed hours between solve and opening (or remaining time speed bonus)
  // Elapsed time active on stage: min(floor(elapsed_hours), 24)
  const elapsedMs = Math.max(0, solveTime - openTime);
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
  const hourlyBonus = Math.min(stage.maxHourlyBonus, Math.max(0, elapsedHours));

  // Optional target bonus for Stage 4 (Site 04)
  let targetBonus = 0;
  if (stageNumber === 4 && options?.isCorrectTarget && stage.targetBonus) {
    targetBonus = stage.targetBonus;
  }

  const totalScore = stage.basePoints + hourlyBonus + targetBonus;

  return {
    stageNumber,
    basePoints: stage.basePoints,
    elapsedHours,
    hourlyBonus,
    targetBonus,
    totalScore,
    scoringEligible: true,
    solveTimestampIST: formatToIST(solveTimestampIso),
    deadlineIST: stage.deadlineIST,
  };
}
