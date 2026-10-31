/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PROTOTYPE-ONLY LOCAL AUTHENTICATION & GAME STATE STORAGE
 * 
 * NOTICE: This is a frontend prototype authentication and state persistence
 * layer using browser localStorage and Web Crypto API SHA-256 hashing.
 * 
 * IT IS NOT A SECURE PRODUCTION BACKEND.
 * In production, all authentication, password verification, authorization,
 * attempt counting, and scoring are owned authoritatively by Supabase Auth,
 * PostgreSQL functions, and Row-Level Security policies.
 */

export interface PrototypeUser {
  id: string;
  fullName: string;
  email?: string;
  school?: string;
  studentClass: string; // 'Class 6' | 'Class 7' | ... | 'Class 12' | 'Staff / Faculty'
  admissionNumberMasked: string; // e.g. "ADM-••••5678" or "STAFF-••••0001"
  admissionHash: string; // SHA-256 hash to prevent duplicate registration
  callSign: string; // unique handle
  passwordHash: string; // SHA-256 hash (passwords are never saved in plaintext)
  registeredAt: string;
  role?: 'owner' | 'organiser' | 'investigator';
  isStaff?: boolean;
  hasStageOverride?: boolean;
  excludeFromLeaderboard?: boolean; // Flag to exclude insider/testing accounts from public leaderboard
}

export interface AuditLogEntry {
  id: string;
  action: string;
  timestamp: string;
  detail: string;
  targetCallSign?: string;
  previousValue?: string;
  newValue?: string;
}

export interface UserProgress {
  callSign: string;
  stagesCompleted: number; // 0 to 7
  activeStage: number; // 1 to 7
  tasksCompleted: number;
  unlockedEvidenceIds: string[];
  solvedChallengeKeys: string[];
  score: number;
  status: 'NOT STARTED' | 'IN PROGRESS' | 'COMPLETED';
  teamName: string | null;
  teamCode: string | null;
  hasStageOverride?: boolean; // Testing clearance: bypass global launch countdown and release gates without fake score/solve marks
  excludeFromLeaderboard?: boolean; // Exclude from public rankings and competitive counts
  // Stage 4 Location Target Choice & One-Time Correction Rule
  targetLocationChoice: number | null; // Location id (1 to 4)
  targetChoiceLocked: boolean;
  targetLocationCorrectionUsed: boolean; // Exactly 1 player-initiated correction allowed before deadline
  targetChoiceTimestamp?: string;
  targetChoiceEvaluationStatus: 'unsubmitted' | 'pending' | 'revealed';
  targetChoiceRevealTimestamp?: string;
  // Stage-specific gates
  stage2DeductionSolved: boolean; // Coordinate cipher decoded to House 3893
  mapGateUnlocked: boolean; // Stage 3 gate_map unlocked
  suspectDbUnlocked: boolean; // Stage 5 gate_suspect_db unlocked with Z408_REOPENED
  systemFreezeTriggered: boolean; // Stage 6 FINAL_REVIEW.mp4 triggered controlled story freeze
  // Story Briefing & Intermissions
  directorIntroSeen: boolean; // First-time cinematic briefing seen
  seenIntermissions: string[]; // List of triggered intermission keys (e.g. 's1_to_s2')
  stage7Step: 'locked' | 'available' | 'article_read' | 'ending_video_played' | 'completed';
  directorFreezeStage6DirectorMessagesSent: boolean;
  // Scoring & Timestamps (IST compliant)
  stageSolveTimestamps: Record<number, string>; // Stage number -> ISO solve timestamp
  stageScoringEligible: Record<number, boolean>; // Stage number -> boolean (true if before deadline)
  stageScores: Record<number, number>; // Stage number -> awarded points (0 if late)
  organizerAuditLog: AuditLogEntry[];
  // Settings
  reducedScareMode: boolean;
  muteAudioDefault: boolean;
  // Dispatches & Messages
  readMessageIds: string[];
  // Post-Ending Aftermath State
  endingCorruptedAftermath?: boolean; // Set to true after Stage 7 ending glitch sequence
  aftermathDismissed?: boolean; // Reversible diagnostic toggle to inspect normal interface
}

const USERS_STORAGE_KEY = 'tls_prototype_users_v1';
const SESSION_STORAGE_KEY = 'tls_prototype_active_session_v1';
const PROGRESS_PREFIX = 'tls_progress_user_';

/**
 * Hash a string using client-side SHA-256 (Web Crypto API)
 */
export async function hashString(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mask an admission number for UI display (e.g., "123456" -> "ADM-••••3456")
 */
export function maskAdmissionNumber(adm: string): string {
  const clean = adm.trim();
  if (clean.length <= 4) return `ADM-••••${clean}`;
  const visible = clean.slice(-4);
  return `ADM-••••${visible}`;
}

/**
 * Retrieve all registered local prototype accounts
 */
export function getAllUsers(): PrototypeUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read prototype users from localStorage', err);
    return [];
  }
}

/**
 * Save user list to localStorage
 */
function saveUsers(users: PrototypeUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save prototype users to localStorage', err);
  }
}

/**
 * Helper to validate required PrototypeUser fields for a session object.
 */
function isValidPrototypeUser(obj: unknown): obj is PrototypeUser {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' && candidate.id.trim().length > 0 &&
    typeof candidate.callSign === 'string' && candidate.callSign.trim().length > 0 &&
    typeof candidate.fullName === 'string' && candidate.fullName.trim().length > 0 &&
    typeof candidate.studentClass === 'string' && candidate.studentClass.trim().length > 0 &&
    typeof candidate.admissionNumberMasked === 'string' && candidate.admissionNumberMasked.trim().length > 0 &&
    typeof candidate.registeredAt === 'string' && candidate.registeredAt.trim().length > 0
  );
}

/**
 * Get active session user
 */
export function getActiveUser(): PrototypeUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);

    // 1. Detect and return valid full PrototypeUser session (Supabase or full cached session)
    if (isValidPrototypeUser(session)) {
      return {
        id: session.id,
        fullName: session.fullName,
        email: typeof session.email === 'string' ? session.email : undefined,
        school: typeof session.school === 'string' ? session.school : undefined,
        studentClass: session.studentClass,
        admissionNumberMasked: session.admissionNumberMasked,
        admissionHash: typeof session.admissionHash === 'string' ? session.admissionHash : '',
        callSign: session.callSign,
        passwordHash: typeof session.passwordHash === 'string' ? session.passwordHash : '',
        registeredAt: session.registeredAt,
        role: session.role,
        isStaff: Boolean(session.isStaff),
        hasStageOverride: Boolean(session.hasStageOverride),
        excludeFromLeaderboard: Boolean(session.excludeFromLeaderboard),
      };
    }

    // 2. Fallback lookup through getAllUsers() for legacy prototype sessions
    if (session && typeof session.callSign === 'string') {
      const users = getAllUsers();
      return users.find((u) => u.callSign.toLowerCase() === session.callSign.trim().toLowerCase()) ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Set active session user
 */
export function setActiveSession(user: PrototypeUser): void {
  try {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...user, timestamp: new Date().toISOString() })
    );
  } catch (err) {
    console.error('Failed to set active session', err);
  }
}

/**
 * Clear active session (Logout)
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear active session', err);
  }
}

/**
 * Check if a call-sign is already registered
 */
export function isCallSignTaken(callSign: string): boolean {
  const clean = callSign.trim().toLowerCase();
  const users = getAllUsers();
  return users.some((u) => u.callSign.toLowerCase() === clean);
}

/**
 * Initial empty progress for a newly registered investigator
 */
export function createInitialProgress(callSign: string): UserProgress {
  return {
    callSign,
    stagesCompleted: 0,
    activeStage: 1,
    tasksCompleted: 0,
    unlockedEvidenceIds: ['EV-0101', 'EV-0102', 'EV-0103', 'ARC-002'], // Stage 1 initial public items
    solvedChallengeKeys: [],
    score: 0,
    status: 'NOT STARTED',
    teamName: null,
    teamCode: null,
    hasStageOverride: false,
    excludeFromLeaderboard: false,
    targetLocationChoice: null,
    targetChoiceLocked: false,
    targetLocationCorrectionUsed: false,
    targetChoiceEvaluationStatus: 'unsubmitted',
    targetChoiceRevealTimestamp: undefined,
    stage2DeductionSolved: false,
    mapGateUnlocked: false,
    suspectDbUnlocked: false,
    systemFreezeTriggered: false,
    directorIntroSeen: false,
    seenIntermissions: [],
    stage7Step: 'locked',
    directorFreezeStage6DirectorMessagesSent: false,
    stageSolveTimestamps: {},
    stageScoringEligible: {},
    stageScores: {},
    organizerAuditLog: [],
    reducedScareMode: false,
    muteAudioDefault: true,
    readMessageIds: [],
    endingCorruptedAftermath: false,
    aftermathDismissed: false,
  };
}

/**
 * Get progress for a specific user, safely backfilling any newly introduced fields
 */
export function getUserProgress(callSign: string): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + callSign.toLowerCase());
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaults = createInitialProgress(callSign);
      // Merge defaults for missing fields from older prototype versions
      return {
        ...defaults,
        ...parsed,
        hasStageOverride: parsed.hasStageOverride ?? false,
        excludeFromLeaderboard: parsed.excludeFromLeaderboard ?? false,
        targetChoiceEvaluationStatus: parsed.targetChoiceEvaluationStatus ?? (parsed.targetChoiceLocked ? (parsed.stagesCompleted >= 4 ? 'revealed' : 'pending') : 'unsubmitted'),
        directorIntroSeen: parsed.directorIntroSeen ?? false,
        seenIntermissions: parsed.seenIntermissions ?? [],
        stage7Step: parsed.stage7Step ?? (parsed.stagesCompleted >= 7 ? 'completed' : parsed.activeStage >= 7 ? 'available' : 'locked'),
        directorFreezeStage6DirectorMessagesSent: parsed.directorFreezeStage6DirectorMessagesSent ?? false,
        stageSolveTimestamps: parsed.stageSolveTimestamps || {},
        stageScoringEligible: parsed.stageScoringEligible || {},
        stageScores: parsed.stageScores || {},
        organizerAuditLog: parsed.organizerAuditLog || [],
        readMessageIds: Array.isArray(parsed.readMessageIds) ? parsed.readMessageIds : [],
        endingCorruptedAftermath: parsed.endingCorruptedAftermath ?? (parsed.stagesCompleted >= 7 && parsed.stage7Step === 'completed'),
        aftermathDismissed: parsed.aftermathDismissed ?? false,
      };
    }
  } catch (err) {
    console.error('Failed to read progress', err);
  }
  const fresh = createInitialProgress(callSign);
  saveUserProgress(fresh);
  return fresh;
}

/**
 * Save progress for a specific user
 */
export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(
      PROGRESS_PREFIX + progress.callSign.toLowerCase(),
      JSON.stringify(progress)
    );
  } catch (err) {
    console.error('Failed to save progress', err);
  }
}

import { isRegistrationOpen, REGISTRATION_OPEN_IST } from './stageConfig';

/**
 * Register a new prototype account
 */
export async function registerPrototypeUser(params: {
  fullName: string;
  email?: string;
  school?: string;
  studentClass: string;
  admissionNumber: string;
  callSign: string;
  passwordPlain: string;
}): Promise<{ success: boolean; error?: string; user?: PrototypeUser }> {
  // Enforce registration window opening timestamp (IST)
  if (!isRegistrationOpen()) {
    return {
      success: false,
      error: `Registration is not open yet. Student intake begins on ${REGISTRATION_OPEN_IST}.`,
    };
  }

  const { fullName, email, school, studentClass, admissionNumber, callSign, passwordPlain } = params;

  if (!fullName.trim() || !studentClass.trim() || !admissionNumber.trim() || !callSign.trim() || !passwordPlain) {
    return { success: false, error: 'All fields are strictly required.' };
  }

  const cleanEmail = email?.trim().toLowerCase();
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid student email address.' };
  }

  const cleanCallSign = callSign.trim();
  if (cleanCallSign.length < 3 || cleanCallSign.length > 24) {
    return { success: false, error: 'Call-sign must be between 3 and 24 characters.' };
  }

  if (!/^[A-Za-z0-9_]+$/.test(cleanCallSign)) {
    return { success: false, error: 'Call-sign can only contain letters, numbers, and underscores.' };
  }

  const reserved = ['admin', 'director', 'zodiac', 'system', 'moderator', 'staff', 'owner'];
  if (reserved.includes(cleanCallSign.toLowerCase())) {
    return { success: false, error: 'This call-sign is reserved by the investigation authority.' };
  }

  const users = getAllUsers();

  if (isCallSignTaken(cleanCallSign)) {
    return { success: false, error: `Call-sign "${cleanCallSign}" is already registered. Please choose another.` };
  }

  if (cleanEmail && users.some((u) => u.email?.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'This email address is already registered. Please log in or use another email.' };
  }

  if (passwordPlain.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters for testing.' };
  }

  const [passwordHash, admissionHash] = await Promise.all([
    hashString(passwordPlain),
    hashString(admissionNumber),
  ]);

  // Check for duplicate admission number
  if (users.some((u) => u.admissionHash === admissionHash)) {
    return { success: false, error: 'An account has already been registered with this admission number.' };
  }

  const newUser: PrototypeUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fullName: fullName.trim(),
    email: cleanEmail,
    school: school?.trim() || 'Central High',
    studentClass,
    admissionNumberMasked: maskAdmissionNumber(admissionNumber),
    admissionHash,
    callSign: cleanCallSign,
    passwordHash,
    registeredAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Initialize their isolated progress
  saveUserProgress(createInitialProgress(newUser.callSign));

  // Log them in immediately
  setActiveSession(newUser);

  return { success: true, user: newUser };
}

/**
 * Check if a user holds staff or owner privileges
 */
export function isUserStaff(user: PrototypeUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'owner' || user.role === 'organiser' || Boolean(user.isStaff);
}

/**
 * Check if any staff accounts currently exist in the prototype store
 */
export function hasAnyStaffAccounts(): boolean {
  const users = getAllUsers();
  return users.some((u) => u.role === 'owner' || u.role === 'organiser' || Boolean(u.isStaff));
}

/**
 * Staff account registration is permanently disabled.
 * Access to the Staff Console is governed exclusively by the Master Staff Password.
 */
export async function registerStaffOrganizer(): Promise<{ success: boolean; error: string }> {
  return {
    success: false,
    error: 'Staff account registration is disabled. Access is authorized exclusively via the Master Operations Password.',
  };
}

/**
 * Authenticate prototype user
 */
export async function loginPrototypeUser(
  callSignOrEmail: string,
  passwordPlain: string
): Promise<{ success: boolean; error?: string; user?: PrototypeUser }> {
  const clean = callSignOrEmail.trim().toLowerCase();
  if (!clean || !passwordPlain) {
    return { success: false, error: 'Please enter both your call-sign/email and password.' };
  }

  const users = getAllUsers();
  const user = users.find(
    (u) => u.callSign.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)
  );
  if (!user) {
    return { success: false, error: 'No investigator record found with this call-sign or email.' };
  }

  const hash = await hashString(passwordPlain);
  if (hash !== user.passwordHash) {
    return { success: false, error: 'Invalid password. Check your case credentials.' };
  }

  const userWithStaff: PrototypeUser = {
    ...user,
    isStaff: isUserStaff(user),
  };

  setActiveSession(userWithStaff);
  return { success: true, user: userWithStaff };
}

