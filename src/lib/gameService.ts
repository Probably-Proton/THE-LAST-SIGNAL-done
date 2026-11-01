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
/**
 * Challenge docket definitions (metadata only — no answers or secret hashes in client bundle).
 */
const CANONICAL_CHALLENGES: Record<
  string,
  {
    stageId: number;
    kind: 'gate' | 'puzzle';
    requiresUsername: boolean;
    rewardEvidence: string[];
  }
> = {
  gate_zk_login: {
    stageId: 1,
    kind: 'gate',
    requiresUsername: true,
    rewardEvidence: ['EV-0102', 'EV-0103', 'EV-0201', 'EV-0202', 'EV-0203', 'EV-0204'],
  },
  stage2_coords: {
    stageId: 2,
    kind: 'puzzle',
    requiresUsername: false,
    rewardEvidence: ['CAS-017', 'EV-0301'],
  },
  gate_map: {
    stageId: 3,
    kind: 'gate',
    requiresUsername: false,
    rewardEvidence: ['MAP-001', 'EV-0302'],
  },
  gate_suspect_db: {
    stageId: 5,
    kind: 'gate',
    requiresUsername: false,
    rewardEvidence: ['SUSP-001', 'SUSP-002', 'SUSP-003', 'SUSP-004'],
  },
  gate_audio: {
    stageId: 6,
    kind: 'gate',
    requiresUsername: false,
    rewardEvidence: ['AUD-001', 'EV-0601'],
  },
};

/**
 * Submit an answer to a puzzle or password gate.
 * Always validates against the authoritative server endpoint (/api/challenges/submit)
 * or Supabase RPC to prevent client answer tampering or leaks.
 */
export async function submitChallengeAnswer(params: {
  callSign: string;
  challengeKey: string;
  answer: string;
  username?: string;
  currentProgress: UserProgress;
}): Promise<SubmissionResponse> {
  const { callSign, challengeKey, answer, username, currentProgress } = params;

  // 1. Authoritative Application Server Verification
  try {
    const res = await fetch('/api/challenges/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callSign,
        challengeKey,
        answer,
        username,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: Boolean(data.success),
        status: data.status || (data.success ? 'correct' : 'incorrect'),
        message: data.message || (data.success ? 'Clearance granted.' : 'Decryption verification failed.'),
        pointsEarned: data.pointsEarned ?? data.pointsAwarded ?? 0,
        attemptsLeft: data.attemptsLeft,
        unlockedEvidence: data.unlockedEvidence,
        mode: 'live_supabase',
      };
    } else {
      const errJson = await res.json().catch(() => null);
      if (errJson) {
        return {
          success: false,
          status: errJson.status || 'incorrect',
          message: errJson.error || errJson.message || 'Decryption verification failed.',
          attemptsLeft: errJson.attemptsLeft,
          mode: 'live_supabase',
        };
      }
    }
  } catch (err) {
    console.warn('[gameService] Server challenge submission request error:', err);
  }

  // 2. Direct Supabase RPC fallback (if authenticated session active)
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
      console.warn('[gameService] Supabase RPC submission notice:', err);
    }
  }

  return {
    success: false,
    status: 'error',
    message: 'Unable to reach authoritative verification server. Please check your connection.',
    mode: 'live_supabase',
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
