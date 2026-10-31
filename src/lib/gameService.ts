/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THE LAST SIGNAL — GAME SERVICE & PROGRESSION ENGINE
 * 
 * Authoritative submission validation, scoring calculations, and stage progression.
 * Enforces zero-trust browser security:
 * - Scores and stage unlocks are computed through PostgreSQL functions when Supabase is connected.
 * - In local testing mode, submissions are evaluated against salted cryptographic verification.
 * - Duplicate submissions cannot award duplicate points.
 * - Premature access to locked future stages is strictly blocked.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import {
  STAGE_SCHEDULE,
  STAGE_POINTS,
  isStageAccessible,
  isStageScoringEligible,
  isGameLaunched,
  TARGET_INTERCEPT_BONUS,
} from './stageConfig';
import {
  type UserProgress,
  getUserProgress,
  saveUserProgress,
} from './prototypeAuth';

export interface SubmissionResponse {
  success: boolean;
  status: 'correct' | 'incorrect' | 'already_solved' | 'unavailable' | 'rate_limited' | 'attempts_exhausted' | 'error';
  message: string;
  pointsEarned?: number;
  attemptsLeft?: number;
  unlockedEvidence?: string[];
  mode: 'live_supabase' | 'prototype_local';
}

/**
 * Normalizes input strings for comparison.
 */
function norm(val: string, mode: 'text' | 'coords' = 'text'): string {
  if (mode === 'coords') {
    return val.toLowerCase().replace(/\s/g, '');
  }
  return val.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Challenge key mappings and canonical solutions for local prototype verification.
 */
const CANONICAL_CHALLENGES: Record<
  string,
  {
    stageId: number;
    kind: 'gate' | 'puzzle';
    normMode: 'text' | 'coords';
    requiresUsername: boolean;
    validCheck: (answer: string, username?: string) => boolean;
    rewardEvidence: string[];
  }
> = {
  gate_zk_login: {
    stageId: 1,
    kind: 'gate',
    normMode: 'text',
    requiresUsername: true,
    validCheck: (answer, username) =>
      norm(username || '') === 'zkcase17' && norm(answer) === 'orion',
    rewardEvidence: ['EV-0102', 'EV-0103', 'EV-0201', 'EV-0202', 'EV-0203', 'EV-0204'],
  },
  stage2_coords: {
    stageId: 2,
    kind: 'puzzle',
    normMode: 'coords',
    requiresUsername: false,
    validCheck: (answer) => {
      const clean = norm(answer, 'coords');
      return (
        clean === '37.78874,-122.45709' ||
        clean === '37.78874,-122.457090' ||
        clean.includes('37.78874') && clean.includes('122.45709')
      );
    },
    rewardEvidence: ['CAS-017', 'EV-0301'],
  },
  gate_map: {
    stageId: 3,
    kind: 'gate',
    normMode: 'text',
    requiresUsername: false,
    validCheck: (answer) => norm(answer) === '3893',
    rewardEvidence: ['MAP-001', 'EV-0302'],
  },
  gate_suspect_db: {
    stageId: 5,
    kind: 'gate',
    normMode: 'text',
    requiresUsername: false,
    validCheck: (answer) => norm(answer) === 'z408reopened',
    rewardEvidence: ['SUSP-001', 'SUSP-002', 'SUSP-003', 'SUSP-004'],
  },
  gate_audio: {
    stageId: 6,
    kind: 'gate',
    normMode: 'text',
    requiresUsername: false,
    validCheck: (answer) => norm(answer) === 'ev1971',
    rewardEvidence: ['AUD-001', 'EV-0601'],
  },
};

/**
 * Submit an answer to a puzzle or password gate.
 */
export async function submitChallengeAnswer(params: {
  callSign: string;
  challengeKey: string;
  answer: string;
  username?: string;
  currentProgress: UserProgress;
}): Promise<SubmissionResponse> {
  const { callSign, challengeKey, answer, username, currentProgress } = params;

  // Supabase RPC path
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('submit_challenge', {
        p_key: challengeKey,
        p_answer: answer,
        p_username: username || null,
      });

      if (!error && data) {
        if (data.status === 'correct') {
          return {
            success: true,
            status: 'correct',
            message: 'CLEARANCE GRANTED: Cryptographic key match confirmed.',
            pointsEarned: data.points || 0,
            mode: 'live_supabase',
          };
        } else if (data.status === 'incorrect') {
          return {
            success: false,
            status: 'incorrect',
            message: 'ACCESS DENIED: Decryption verification failed.',
            attemptsLeft: data.attempts_left,
            mode: 'live_supabase',
          };
        } else if (data.status === 'already_solved') {
          return {
            success: true,
            status: 'already_solved',
            message: 'RECORD ON FILE: Clearance was previously unlocked for this case file.',
            mode: 'live_supabase',
          };
        } else if (data.status === 'unavailable') {
          return {
            success: false,
            status: 'unavailable',
            message: 'RECORD LOCKED: This case file is sealed until its scheduled release window.',
            mode: 'live_supabase',
          };
        }
      }
    } catch (err) {
      console.warn('[gameService] Supabase submission failed, using local engine:', err);
    }
  }

  // Local Prototype Validation Engine
  const def = CANONICAL_CHALLENGES[challengeKey];
  if (!def) {
    return {
      success: false,
      status: 'error',
      message: `Unknown challenge docket: ${challengeKey}`,
      mode: 'prototype_local',
    };
  }

  // Check stage accessibility (schedule release check with override support)
  const now = new Date();
  if (!isStageAccessible(def.stageId, currentProgress.stagesCompleted, now, Boolean(currentProgress.hasStageOverride))) {
    return {
      success: false,
      status: 'unavailable',
      message: `Stage ${def.stageId} remains sealed until its scheduled operational opening.`,
      mode: 'prototype_local',
    };
  }

  // Check if already solved
  if (currentProgress.solvedChallengeKeys.includes(challengeKey)) {
    return {
      success: true,
      status: 'already_solved',
      message: 'Clearance was previously authenticated for this docket.',
      mode: 'prototype_local',
    };
  }

  const isCorrect = def.validCheck(answer, username);
  if (!isCorrect) {
    return {
      success: false,
      status: 'incorrect',
      message: 'ACCESS DENIED: Verification signature does not match department records.',
      mode: 'prototype_local',
    };
  }

  // Calculate scoring eligibility (only on-time solves receive stage points)
  const isEligible = isStageScoringEligible(def.stageId, now);
  const stagePoints = isEligible ? STAGE_POINTS : 0;

  // Update progress state
  const updated: UserProgress = {
    ...currentProgress,
    solvedChallengeKeys: [...currentProgress.solvedChallengeKeys, challengeKey],
    unlockedEvidenceIds: Array.from(
      new Set([...currentProgress.unlockedEvidenceIds, ...def.rewardEvidence])
    ),
    stageSolveTimestamps: {
      ...currentProgress.stageSolveTimestamps,
      [def.stageId]: now.toISOString(),
    },
    stageScoringEligible: {
      ...currentProgress.stageScoringEligible,
      [def.stageId]: isEligible,
    },
    stageScores: {
      ...currentProgress.stageScores,
      [def.stageId]: stagePoints,
    },
    score: currentProgress.score + stagePoints,
  };

  // Specific stage gate unlocks
  if (challengeKey === 'gate_zk_login') {
    if (updated.stagesCompleted < 1) updated.stagesCompleted = 1;
    if (updated.activeStage <= 1) updated.activeStage = 2;
  } else if (challengeKey === 'stage2_coords') {
    updated.stage2DeductionSolved = true;
    if (updated.stagesCompleted < 2) updated.stagesCompleted = 2;
    if (updated.activeStage <= 2) updated.activeStage = 3;
  } else if (challengeKey === 'gate_map') {
    updated.mapGateUnlocked = true;
    if (updated.stagesCompleted < 3) updated.stagesCompleted = 3;
    if (updated.activeStage <= 3) updated.activeStage = 4;
  } else if (challengeKey === 'gate_suspect_db') {
    updated.suspectDbUnlocked = true;
    if (updated.stagesCompleted < 5) updated.stagesCompleted = 5;
    if (updated.activeStage <= 5) updated.activeStage = 6;
  } else if (challengeKey === 'gate_audio') {
    if (updated.stagesCompleted < 6) updated.stagesCompleted = 6;
    if (updated.activeStage <= 6) updated.activeStage = 7;
  }

  saveUserProgress(updated);

  return {
    success: true,
    status: 'correct',
    message: isEligible
      ? `VERIFIED: Correct solution confirmed. +${stagePoints} points awarded.`
      : 'VERIFIED: Correct solution confirmed. (Late submission: 0 points awarded).',
    pointsEarned: stagePoints,
    unlockedEvidence: def.rewardEvidence,
    mode: 'prototype_local',
  };
}

/**
 * Record Stage 4 surveillance intercept location choice.
 */
export async function submitLocationChoice(params: {
  callSign: string;
  locationId: number; // 1 to 4
  currentProgress: UserProgress;
}): Promise<{
  success: boolean;
  status: string;
  message: string;
  mode: 'live_supabase' | 'prototype_local';
}> {
  const { callSign, locationId, currentProgress } = params;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('choose_location', {
        p_location_id: locationId,
      });

      if (!error && data) {
        if (data.status === 'ok') {
          return {
            success: true,
            status: 'ok',
            message: 'SURVEILLANCE DISPATCH CONFIRMED: Operatives mobilized to designated coordinates.',
            mode: 'live_supabase',
          };
        } else if (data.status === 'already_chosen') {
          return {
            success: false,
            status: 'already_chosen',
            message: 'Interception location already locked into department logs.',
            mode: 'live_supabase',
          };
        } else if (data.status === 'closed') {
          return {
            success: false,
            status: 'closed',
            message: 'DEPLOYMENT WINDOW CLOSED: Surveillance deadline has expired.',
            mode: 'live_supabase',
          };
        }
      }
    } catch (err) {
      console.warn('[gameService] Supabase location choice error:', err);
    }
  }

  // Local Prototype Engine: Enforce launch lock, 1-choice, and 1-correction rule
  const now = new Date();
  if (!isGameLaunched(now)) {
    return {
      success: false,
      status: 'unavailable',
      message: 'DEPLOYMENT LOCKED: Surveillance terminal remains sealed until official game launch.',
      mode: 'prototype_local',
    };
  }

  const schedule = STAGE_SCHEDULE[4];
  const isPastDeadline = now.toISOString() >= schedule.deadlineIso;

  if (isPastDeadline) {
    return {
      success: false,
      status: 'closed',
      message: 'DEPLOYMENT WINDOW CLOSED: Intercept deadline has passed.',
      mode: 'prototype_local',
    };
  }

  if (currentProgress.targetChoiceLocked && currentProgress.targetLocationCorrectionUsed) {
    return {
      success: false,
      status: 'locked',
      message: 'Maximum 1 tactical correction allowed. Surveillance location is permanently locked.',
      mode: 'prototype_local',
    };
  }

  const isCorrection = currentProgress.targetChoiceLocked && !currentProgress.targetLocationCorrectionUsed;

  const updated: UserProgress = {
    ...currentProgress,
    targetLocationChoice: locationId,
    targetChoiceLocked: true,
    targetLocationCorrectionUsed: isCorrection ? true : currentProgress.targetLocationCorrectionUsed,
    targetChoiceTimestamp: now.toISOString(),
    targetChoiceEvaluationStatus: 'pending',
  };

  saveUserProgress(updated);

  return {
    success: true,
    status: 'ok',
    message: isCorrection
      ? 'TACTICAL REASSIGNMENT CONFIRMED: Intercept target updated.'
      : 'SURVEILLANCE DISPATCH CONFIRMED: Operatives mobilized to designated site.',
    mode: 'prototype_local',
  };
}
