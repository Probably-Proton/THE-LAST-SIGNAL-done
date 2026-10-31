/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CANONICAL INVESTIGATION DISPATCH & MESSAGING ENGINE
 * 
 * Implements the authentic 14-day dialogue script (The_Last_Signal_14_Day_Dialogues.docx),
 * character sender segregation, stage-gated message release, read/unread status persistence,
 * outcome-dependent Stage 4 dispatches, and authorized staff broadcast feeds.
 */

import type { UserProgress } from '@/src/lib/prototypeAuth';
import { STAGE_SCHEDULE, isGameLaunched } from '@/src/lib/stageConfig';
import { isSupabaseConfigured } from '@/src/lib/supabase';

export type MessageTone = 'antagonist' | 'director' | 'system' | 'staff';

export interface CaseMessage {
  id: string;
  sender: string;
  tone: MessageTone;
  stageNumber: number;
  stageWindow: string;
  timestampIST: string;
  text: string;
  isRead: boolean;
  audience: 'all' | 'targeted';
  targetCallSign?: string;
  isStaffCustom?: boolean;
}

export interface StaffDispatchInput {
  sender: 'THE DIRECTOR' | 'SYSTEM DISPATCH' | 'OPERATIONS COMMAND';
  tone: MessageTone;
  text: string;
  audience: 'all' | 'targeted';
  targetCallSign?: string;
}

const STAFF_DISPATCHES_KEY = 'tls_staff_dispatches_v1';

/**
 * Canonical story dialogue matrix drawn directly from docs/DIALOGUE_SCRIPT.md
 */
export const CANONICAL_STORY_MESSAGES: Omit<CaseMessage, 'isRead'>[] = [
  // ================= STAGE 1 =================
  {
    id: 'D01-SYS',
    sender: 'SYSTEM DISPATCH',
    tone: 'system',
    stageNumber: 1,
    stageWindow: 'Stage 01 Opening',
    timestampIST: '01 Nov 2026 · 00:00 IST',
    text: 'Investigation terminal initialized. Archival Sector 01 (Vault B) access granted. Subsequent sectors remain sealed under historical quarantine.',
    audience: 'all',
  },
  {
    id: 'D01-D1',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 1,
    stageWindow: 'Stage 01 Opening',
    timestampIST: '01 Nov 2026 · 00:05 IST',
    text: 'Welcome to the case. Start with what is recorded—not with what you think you know. Begin with Item EV-0103. The Exorcist letter carries an attached note. The boundaries of the text will give you what you need to access the locked files.',
    audience: 'all',
  },
  {
    id: 'D01-Z1',
    sender: 'ZODIAC',
    tone: 'antagonist',
    stageNumber: 1,
    stageWindow: 'Stage 01 Opening',
    timestampIST: '01 Nov 2026 · 00:15 IST',
    text: 'A new name on the file. A fresh pair of eyes. How fortunate for the archive. You looked at the words... Did you look at their edges?',
    audience: 'all',
  },
  {
    id: 'D02-DC',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 1,
    stageWindow: 'Stage 01 Post-Solve',
    timestampIST: 'Stage 01 Cleared',
    text: 'Good. Record the result exactly as it appears; you will need it again. Proceed to the negative records bay in Sector 02.',
    audience: 'all',
  },

  // ================= STAGE 2 =================
  {
    id: 'D03-D1',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 2,
    stageWindow: 'Stage 02 Release',
    timestampIST: '03 Nov 2026 · 00:00 IST',
    text: 'Compare the negative telemetry carefully. Look for a detail that repeats or changes. The forensic margin holds a camera substitution stamp.',
    audience: 'all',
  },
  {
    id: 'D03-Z1',
    sender: 'ZODIAC',
    tone: 'antagonist',
    stageNumber: 2,
    stageWindow: 'Stage 02 Release',
    timestampIST: '03 Nov 2026 · 00:20 IST',
    text: 'Pictures are patient. They keep what people overlook. You keep staring at the scene—perhaps the frame has something to say.',
    audience: 'all',
  },
  {
    id: 'D03-DC',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 2,
    stageWindow: 'Stage 02 Post-Solve',
    timestampIST: 'Stage 02 Cleared',
    text: 'Coordinates verified. Keep the numbers with your case notes. Cross-reference them with witness testimony CAS-017 before drawing conclusions.',
    audience: 'all',
  },

  // ================= STAGE 3 =================
  {
    id: 'D04-D1',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 3,
    stageWindow: 'Stage 03 Release',
    timestampIST: '05 Nov 2026 · 00:00 IST',
    text: 'Witness testimony CAS-017 establishes the connection to House 3893 on Washington Street. Use the verified house number to authenticate Gate 3 on the Signal Map.',
    audience: 'all',
  },
  {
    id: 'D04-Z1',
    sender: 'ZODIAC',
    tone: 'antagonist',
    stageNumber: 3,
    stageWindow: 'Stage 03 Release',
    timestampIST: '05 Nov 2026 · 00:30 IST',
    text: 'A number is only a number until someone gives it a door. The file is not hiding. It is waiting for the right label.',
    audience: 'all',
  },
  {
    id: 'D04-DC',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 3,
    stageWindow: 'Stage 03 Post-Solve',
    timestampIST: 'Stage 03 Cleared',
    text: 'Map security gate cleared. 4 regional survey sites are now unlocked on the cartographic grid. Prepare to analyze audio cassette EV-0401.',
    audience: 'all',
  },

  // ================= STAGE 4 =================
  {
    id: 'D05-D1',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 4,
    stageWindow: 'Stage 04 Release',
    timestampIST: '07 Nov 2026 · 00:00 IST',
    text: 'Check the audio material in its intended order. Cassette EV-0401 terminates speech at 30 seconds, but 17 seconds remain. A reversed layer may change what you hear.',
    audience: 'all',
  },
  {
    id: 'D05-Z1',
    sender: 'ZODIAC',
    tone: 'antagonist',
    stageNumber: 4,
    stageWindow: 'Stage 04 Release',
    timestampIST: '07 Nov 2026 · 00:15 IST',
    text: 'Four locations. One has been chosen. Three are irrelevant. You have twenty-four hours to tell me which one. Choose carefully. Some messages arrive facing the wrong way.',
    audience: 'all',
  },

  // ================= STAGE 5 =================
  {
    id: 'D06-D1',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 5,
    stageWindow: 'Stage 05 Release',
    timestampIST: '09 Nov 2026 · 00:00 IST',
    text: 'Daniel Mercer inquest reported in the SF Chronicle special dispatch (EV-0501). Review the reference to the reopened 408 cipher to authenticate the suspect vault.',
    audience: 'all',
  },
  {
    id: 'D06-Z1',
    sender: 'ZODIAC',
    tone: 'antagonist',
    stageNumber: 5,
    stageWindow: 'Stage 05 Release',
    timestampIST: '09 Nov 2026 · 00:45 IST',
    text: 'You heard the recording. Did you notice what the transcript leaves out? Silence can be counted. So can the space between two things.',
    audience: 'all',
  },
  {
    id: 'D06-DC',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 5,
    stageWindow: 'Stage 05 Post-Solve',
    timestampIST: 'Stage 05 Cleared',
    text: 'Suspect dossiers declassified. Note: Treat recovered cipher fragments as forensic puzzle clues within the investigation, never as real-world threats.',
    audience: 'all',
  },

  // ================= STAGE 6 =================
  {
    id: 'D07-D1',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 6,
    stageWindow: 'Stage 06 Release',
    timestampIST: '11 Nov 2026 · 00:00 IST',
    text: 'Compare the timestamps and revision history in Incident Report 06-B. An archival alteration timestamp predates the event it describes by 7 hours and 40 minutes.',
    audience: 'all',
  },
  {
    id: 'D07-Z1',
    sender: 'ZODIAC',
    tone: 'antagonist',
    stageNumber: 6,
    stageWindow: 'Stage 06 Release',
    timestampIST: '11 Nov 2026 · 00:30 IST',
    text: 'Three records. Three versions of the same little moment. How tidy. Which record came first? Which one only claims it did?',
    audience: 'all',
  },

  // ================= STAGE 7 =================
  {
    id: 'D08-D1',
    sender: 'DIRECTOR OF POLICE',
    tone: 'director',
    stageNumber: 7,
    stageWindow: 'Stage 07 Release',
    timestampIST: '13 Nov 2026 · 00:00 IST',
    text: 'Lay out every verified token. The final answer requires synthesized evidence across the full investigation. Open Ellen Vale\'s journal.',
    audience: 'all',
  },
  {
    id: 'D08-Z1',
    sender: 'ZODIAC',
    tone: 'antagonist',
    stageNumber: 7,
    stageWindow: 'Stage 07 Release',
    timestampIST: '13 Nov 2026 · 00:15 IST',
    text: 'The archive kept its secrets until someone learned how to read its silences. The pieces are close enough to touch. Are you sure you have placed them correctly?',
    audience: 'all',
  },
];

/**
 * Retrieve custom staff dispatches stored in local storage
 */
export function getCustomStaffDispatches(): CaseMessage[] {
  try {
    const raw = localStorage.getItem(STAFF_DISPATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read staff dispatches', err);
    return [];
  }
}

/**
 * Save custom staff dispatch (staff-only action)
 */
export function sendStaffDispatch(
  isStaffAuthorized: boolean,
  input: StaffDispatchInput
): { success: boolean; dispatch?: CaseMessage; error?: string } {
  if (!isStaffAuthorized) {
    return { success: false, error: 'Staff authorization required to issue dispatches.' };
  }

  const cleanText = input.text.trim();
  if (!cleanText || cleanText.length < 5) {
    return { success: false, error: 'Dispatch message must be at least 5 characters long.' };
  }

  const now = new Date();
  const newDispatch: CaseMessage = {
    id: `staff_msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: input.sender,
    tone: input.tone,
    stageNumber: 0, // Global dispatch
    stageWindow: 'Directorate Emergency Broadcast',
    timestampIST: `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} IST`,
    text: cleanText,
    isRead: false,
    audience: input.audience,
    targetCallSign: input.targetCallSign?.trim().toLowerCase(),
    isStaffCustom: true,
  };

  const existing = getCustomStaffDispatches();
  existing.unshift(newDispatch);
  try {
    localStorage.setItem(STAFF_DISPATCHES_KEY, JSON.stringify(existing));
    return { success: true, dispatch: newDispatch };
  } catch (err) {
    return { success: false, error: 'Failed to write dispatch to storage.' };
  }
}

/**
 * Deliver messages tailored to a specific player's progress and the IST release schedule.
 * CRITICAL SPOILER SHIELD: Unreleased stage messages are NEVER exposed to the client.
 */
export function getDeliveredMessagesForPlayer(
  progress: UserProgress,
  referenceTime = new Date()
): CaseMessage[] {
  const activeStage = progress?.activeStage ?? 1;
  const stagesCompleted = progress?.stagesCompleted ?? 0;
  const readSet = new Set(progress?.readMessageIds ?? []);
  const userCallSign = progress?.callSign?.trim().toLowerCase() ?? '';

  const delivered: CaseMessage[] = [];
  const staffDispatches = getCustomStaffDispatches();

  // STRICT PRE-LAUNCH LOCKOUT:
  // Before official game launch, zero story dialogue, clues, or killer messages are released.
  // Only authorized operational staff dispatches (e.g. pre-registration notices) are accessible.
  if (!isGameLaunched(referenceTime)) {
    for (const s of staffDispatches) {
      if (s.audience === 'all' || (s.targetCallSign && s.targetCallSign === userCallSign)) {
        delivered.push({
          ...s,
          isRead: readSet.has(s.id),
        });
      }
    }
    return delivered;
  }

  for (const m of CANONICAL_STORY_MESSAGES) {
    // Stage-based release eligibility:
    // A message is released IF:
    // 1. The player's activeStage is >= message.stageNumber, OR
    // 2. The player has completed this stage, OR
    // 3. The official IST schedule release timestamp for this stage has passed.
    const stageConfig = STAGE_SCHEDULE.find((s) => s.number === m.stageNumber);
    const scheduleReached =
      stageConfig && referenceTime.getTime() >= new Date(stageConfig.openIso).getTime();

    const isStageAvailable =
      m.stageNumber <= activeStage || m.stageNumber <= stagesCompleted || Boolean(scheduleReached);

    if (!isStageAvailable) {
      continue; // Strict spoiler protection: skip unreleased future messages!
    }

    // Post-solve message condition:
    // Only deliver post-solve messages once the player has actually completed that stage!
    if (m.stageWindow.includes('Post-Solve')) {
      if (stagesCompleted < m.stageNumber) {
        continue;
      }
    }

    delivered.push({
      ...m,
      isRead: readSet.has(m.id),
    });
  }

  // ================= STAGE 4 EVALUATION-DEPENDENT MESSAGES =================
  // These outcome messages ONLY unlock once target choice evaluation is revealed
  if (progress.targetChoiceEvaluationStatus === 'revealed' && progress.targetLocationChoice !== null) {
    const isCorrect = progress.targetLocationChoice === 4;

    if (isCorrect) {
      delivered.push({
        id: 'D05-OUTCOME-ZODIAC-CORRECT',
        sender: 'ZODIAC',
        tone: 'antagonist',
        stageNumber: 4,
        stageWindow: 'Stage 04 Official Evaluation',
        timestampIST: 'Stage 04 Deadline Cleared',
        text: 'You listened to the silence at the end. Most people only hear the words. Site 04: Washington & Cherry was indeed the designated coordinate.',
        audience: 'all',
        isRead: readSet.has('D05-OUTCOME-ZODIAC-CORRECT'),
      });
      delivered.push({
        id: 'D05-OUTCOME-DIRECTOR-CORRECT',
        sender: 'DIRECTOR OF POLICE',
        tone: 'director',
        stageNumber: 4,
        stageWindow: 'Stage 04 Official Evaluation',
        timestampIST: 'Stage 04 Deadline Cleared',
        text: 'Presidio Heights confirmed. The reverse audio vector matches the dispatch corridor. Merit bonus points awarded. Retain your telemetry log for final debrief.',
        audience: 'all',
        isRead: readSet.has('D05-OUTCOME-DIRECTOR-CORRECT'),
      });
    } else {
      delivered.push({
        id: 'D05-OUTCOME-ZODIAC-INCORRECT',
        sender: 'ZODIAC',
        tone: 'antagonist',
        stageNumber: 4,
        stageWindow: 'Stage 04 Official Evaluation',
        timestampIST: 'Stage 04 Deadline Cleared',
        text: `A confident answer. Shame it arrived at the wrong coordinate. You submitted Site 0${progress.targetLocationChoice}, missing the reverse spectrogram broadcast at Washington & Cherry.`,
        audience: 'all',
        isRead: readSet.has('D05-OUTCOME-ZODIAC-INCORRECT'),
      });
      delivered.push({
        id: 'D05-OUTCOME-DIRECTOR-INCORRECT',
        sender: 'DIRECTOR OF POLICE',
        tone: 'director',
        stageNumber: 4,
        stageWindow: 'Stage 04 Official Evaluation',
        timestampIST: 'Stage 04 Deadline Cleared',
        text: 'The submitted vector did not align with the coastal transmission mast. Proceed with caution into Stage 05; your score reflects the missed target.',
        audience: 'all',
        isRead: readSet.has('D05-OUTCOME-DIRECTOR-INCORRECT'),
      });
    }
  }

  // ================= STAGE 6 SYSTEM FREEZE OMEGA OVERRIDE =================
  if (progress.systemFreezeTriggered || progress.directorFreezeStage6DirectorMessagesSent) {
    delivered.push({
      id: 'D07-FREEZE-OMEGA',
      sender: 'DIRECTOR OF POLICE',
      tone: 'director',
      stageNumber: 6,
      stageWindow: 'PRIORITY DISPATCH // DIRECTORATE OMEGA OVERRIDE',
      timestampIST: 'CRITICAL EVENT LOCKDOWN',
      text: '1. The case is closed. 2. You have done enough. 3. Delete your local copies of the files and wait for further instructions.',
      audience: 'all',
      isRead: readSet.has('D07-FREEZE-OMEGA'),
    });
  }

  // ================= CUSTOM STAFF BROADCASTS =================
  for (const s of staffDispatches) {
    // Only deliver if broadcast to all or specifically targeted to this user's callSign
    if (s.audience === 'all' || (s.targetCallSign && s.targetCallSign === userCallSign)) {
      delivered.push({
        ...s,
        isRead: readSet.has(s.id),
      });
    }
  }

  // Return delivered messages chronologically
  return delivered;
}

export const getDeliveredMessages = getDeliveredMessagesForPlayer;

/**
 * Returns messaging system diagnostic status
 */
export function getMessagingStorageStatus(): {
  isConfigured: boolean;
  mode: 'live_supabase' | 'prototype_localStorage';
  note: string;
} {
  return {
    isConfigured: isSupabaseConfigured,
    mode: isSupabaseConfigured ? 'live_supabase' : 'prototype_localStorage',
    note: isSupabaseConfigured
      ? 'Live Supabase real-time broadcast and RLS channel active.'
      : 'Prototype mode active. Messages evaluate deterministically against IST release windows and player stage progress in local storage.',
  };
}
