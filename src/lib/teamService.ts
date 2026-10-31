/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THE LAST SIGNAL — AUTHORITATIVE TEAM SERVICE
 * 
 * Production-grade team creation, invite-code validation, roster management,
 * and membership enforcement for THE LAST SIGNAL (CASE TLS-0017).
 * 
 * Architecture:
 * 1. Live Supabase: If the Supabase RPCs (create_team, join_team, leave_team, get_my_team, rotate_invite_code)
 *    are installed in the database, invokes them directly.
 * 2. Automatic Fail-Safe Server Bridge: If the SQL migration has not yet been executed in Supabase SQL editor
 *    (or PostgREST returns a schema cache / missing function error), execution gracefully falls through to
 *    the application server (/api/teams/*) so that team creation and joining work immediately without halting
 *    investigators or showing unhandled database errors.
 * 3. Multi-client Persistence: All team state is synchronized across browser tabs and investigators.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { PrototypeUser, UserProgress } from './prototypeAuth';

export interface TeamMemberInfo {
  callSign: string;
  fullName?: string;
  joinedAt?: string;
  isCreator?: boolean;
}

export interface TeamData {
  name: string;
  inviteCode: string;
  isCreator: boolean;
  maxSize: number;
  membershipOpen: boolean;
  members: TeamMemberInfo[];
}

export interface TeamOperationResult {
  success: boolean;
  message: string;
  team?: TeamData;
  error?: string;
  mode: 'live_supabase' | 'server_managed';
}

function isRpcMissingOrUnavailableError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error.details || error || '').toLowerCase();
  const code = String(error.code || '');
  return (
    code === 'PGRST202' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the function') ||
    msg.includes('function public.') ||
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('connection refused')
  );
}

/**
 * Fetch active team details for the given user.
 */
export async function fetchMyTeam(user: PrototypeUser): Promise<{
  inTeam: boolean;
  team: TeamData | null;
  error?: string;
  mode: 'live_supabase' | 'server_managed';
}> {
  // 1. Check live Supabase RPC first if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('get_my_team');
      if (!error && data && data.name) {
        const members: TeamMemberInfo[] = Array.isArray(data.members)
          ? data.members.map((m: any) =>
              typeof m === 'string'
                ? { callSign: m, isCreator: m.toLowerCase() === user.callSign.toLowerCase() }
                : {
                    callSign: m.call_sign || m.callSign,
                    fullName: m.full_name || m.fullName,
                    isCreator: Boolean(m.is_creator ?? m.isCreator),
                    joinedAt: m.joined_at || m.joinedAt,
                  }
            )
          : [{ callSign: user.callSign, isCreator: Boolean(data.is_creator) }];

        return {
          inTeam: true,
          team: {
            name: data.name,
            inviteCode: data.invite_code || '',
            isCreator: Boolean(data.is_creator),
            maxSize: data.max_size || 5,
            membershipOpen: data.membership_open !== false,
            members,
          },
          mode: 'live_supabase',
        };
      }
    } catch (err) {
      console.warn('[teamService] Supabase get_my_team fallback to server API:', err);
    }
  }

  // 2. Fetch from application server repository
  try {
    const res = await fetch(`/api/teams/mine?callSign=${encodeURIComponent(user.callSign)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.inTeam && json.team) {
        return {
          inTeam: true,
          team: json.team,
          mode: 'server_managed',
        };
      }
      return { inTeam: false, team: null, mode: 'server_managed' };
    }
  } catch (err) {
    console.warn('[teamService] Server team query error:', err);
  }

  return { inTeam: false, team: null, mode: 'server_managed' };
}

/**
 * Create a new team with unique invite code.
 */
export async function createTeamAction(
  teamName: string,
  user: PrototypeUser,
  currentProgress: UserProgress,
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void
): Promise<TeamOperationResult> {
  const cleanName = teamName.trim();
  if (cleanName.length < 3 || cleanName.length > 40) {
    return {
      success: false,
      message: 'Unit designation must be between 3 and 40 characters.',
      mode: isSupabaseConfigured ? 'live_supabase' : 'server_managed',
    };
  }

  // 1. Try Supabase RPC if available
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('create_team', {
        p_name: cleanName,
      });

      if (!error && data?.status === 'ok') {
        const code = data.invite_code;
        onUpdateProgress((prev) => ({
          ...prev,
          teamName: cleanName,
          teamCode: code,
        }));

        // Mirror to server
        fetch('/api/teams/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, callSign: user.callSign, fullName: user.fullName }),
        }).catch(() => {});

        return {
          success: true,
          message: `Unit "${cleanName}" established in departmental registry! Invite code: ${code}`,
          team: {
            name: cleanName,
            inviteCode: code,
            isCreator: true,
            maxSize: 5,
            membershipOpen: true,
            members: [{ callSign: user.callSign, fullName: user.fullName, isCreator: true }],
          },
          mode: 'live_supabase',
        };
      } else if (!error && data && data.status && data.status !== 'ok') {
        // Authoritative domain rejection from Supabase RPC
        const status = data.status;
        const msgMap: Record<string, string> = {
          name_taken: 'A unit with this designation already exists in the departmental registry.',
          already_in_team: 'You are already registered with an active tactical unit.',
          progress_exists: 'Units cannot be established after solo investigations have recorded progress.',
          locked: 'Team registration window has closed.',
          invalid_name: 'Designation contains reserved tactical or administrative terms.',
          unavailable: 'Team registry service is currently unavailable.',
        };
        const errMsg = msgMap[status] || data?.error || 'Database rejected team creation.';
        return {
          success: false,
          error: status,
          message: errMsg,
          mode: 'live_supabase',
        };
      } else if (error) {
        if (isRpcMissingOrUnavailableError(error)) {
          console.info('[teamService] Supabase create_team RPC not in schema cache. Seamlessly bridging via application server.');
        } else {
          console.warn('[teamService] Supabase create_team error, attempting server fallback:', error.message);
        }
      }
    } catch (err) {
      console.warn('[teamService] Supabase create_team exception, attempting server fallback:', err);
    }
  }

  // 2. Application server fallback
  try {
    const res = await fetch('/api/teams/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        callSign: user.callSign,
        fullName: user.fullName,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to create tactical unit.',
        mode: 'server_managed',
      };
    }

    const team = data.team;
    onUpdateProgress((prev) => ({
      ...prev,
      teamName: team.name,
      teamCode: team.inviteCode,
    }));

    return {
      success: true,
      message: data.message || `Tactical unit "${cleanName}" formed! Invite code: ${team.inviteCode}`,
      team,
      mode: 'server_managed',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Could not connect to team registry service.',
      error: err instanceof Error ? err.message : 'Network error',
      mode: 'server_managed',
    };
  }
}

/**
 * Join an existing team by invite code.
 */
export async function joinTeamAction(
  inviteCode: string,
  user: PrototypeUser,
  currentProgress: UserProgress,
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void
): Promise<TeamOperationResult> {
  const cleanCode = inviteCode.trim().toUpperCase();
  if (!cleanCode) {
    return {
      success: false,
      message: 'Please provide a valid team invite code.',
      mode: isSupabaseConfigured ? 'live_supabase' : 'server_managed',
    };
  }

  // 1. Try Supabase RPC if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('join_team', {
        p_code: cleanCode,
      });

      if (!error && data?.status === 'ok') {
        const teamName = data.name || data.team || 'Assigned Unit';
        const code = data.invite_code || cleanCode;
        onUpdateProgress((prev) => ({
          ...prev,
          teamName,
          teamCode: code,
        }));

        // Mirror to server
        fetch('/api/teams/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteCode: code, callSign: user.callSign, fullName: user.fullName }),
        }).catch(() => {});

        return {
          success: true,
          message: `Successfully enlisted into unit "${teamName}". Shared dossier linked.`,
          mode: 'live_supabase',
        };
      } else if (!error && data && data.status && data.status !== 'ok') {
        const status = data.status;
        const msgMap: Record<string, string> = {
          invalid_code: `Invalid invite code "${cleanCode}". No active unit matches this code.`,
          team_full: 'This unit has already reached its maximum capacity of 5 investigators.',
          already_in_team: 'Your account is already assigned to an active unit.',
          progress_exists: 'Accounts with previous solo progression cannot join an existing team.',
          rejoin_blocked: 'You have previously departed this unit and cannot rejoin without staff approval.',
          too_many_attempts: 'Security threshold exceeded. Please wait 10 minutes before trying another code.',
          locked: 'Team registration window is closed.',
          unavailable: 'Team registry service is currently unavailable.',
        };
        const errMsg = msgMap[status] || data?.error || 'Database rejected join request.';
        return {
          success: false,
          error: status,
          message: errMsg,
          mode: 'live_supabase',
        };
      } else if (error) {
        if (isRpcMissingOrUnavailableError(error)) {
          console.info('[teamService] Supabase join_team RPC not in schema cache. Seamlessly bridging via application server.');
        } else {
          console.warn('[teamService] Supabase join_team error, attempting server fallback:', error.message);
        }
      }
    } catch (err) {
      console.warn('[teamService] Supabase join_team exception, attempting server fallback:', err);
    }
  }

  // 2. Application server fallback
  try {
    const res = await fetch('/api/teams/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteCode: cleanCode,
        callSign: user.callSign,
        fullName: user.fullName,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to join unit.',
        mode: 'server_managed',
      };
    }

    const team = data.team;
    onUpdateProgress((prev) => ({
      ...prev,
      teamName: team.name,
      teamCode: team.inviteCode,
    }));

    return {
      success: true,
      message: data.message || `Joined unit "${team.name}". Shared dossier linked.`,
      team,
      mode: 'server_managed',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Could not contact team registry service.',
      error: err instanceof Error ? err.message : 'Network error',
      mode: 'server_managed',
    };
  }
}

/**
 * Leave or disband current team.
 */
export async function leaveTeamAction(
  user: PrototypeUser,
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void
): Promise<TeamOperationResult> {
  // 1. Try Supabase RPC if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('leave_team');
      if (!error && data?.status === 'ok') {
        onUpdateProgress((prev) => ({
          ...prev,
          teamName: null,
          teamCode: null,
        }));

        fetch('/api/teams/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callSign: user.callSign }),
        }).catch(() => {});

        return {
          success: true,
          message: 'Departed unit. Reverted to Solo Operative.',
          mode: 'live_supabase',
        };
      } else if (!error && data && data.status && data.status !== 'ok') {
        return {
          success: false,
          error: data.status,
          message: data.error || 'Database rejected team departure.',
          mode: 'live_supabase',
        };
      } else if (error) {
        if (isRpcMissingOrUnavailableError(error)) {
          console.info('[teamService] Supabase leave_team RPC not in schema cache. Seamlessly bridging via application server.');
        } else {
          console.warn('[teamService] Supabase leave_team error, attempting server fallback:', error.message);
        }
      }
    } catch (err) {
      console.warn('[teamService] Supabase leave_team error, attempting server fallback:', err);
    }
  }

  // 2. Application server fallback
  try {
    const res = await fetch('/api/teams/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callSign: user.callSign }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || 'Failed to depart unit.',
        mode: 'server_managed',
      };
    }

    onUpdateProgress((prev) => ({
      ...prev,
      teamName: null,
      teamCode: null,
    }));

    return {
      success: true,
      message: data.message || 'Departed unit. Reverted to solo operative.',
      mode: 'server_managed',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Could not contact server to process departure.',
      error: err instanceof Error ? err.message : 'Network error',
      mode: 'server_managed',
    };
  }
}

/**
 * Rotate invite code for team creator.
 */
export async function rotateInviteCodeAction(
  user: PrototypeUser
): Promise<{ success: boolean; inviteCode?: string; message: string }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('rotate_invite_code');
      if (!error && data) {
        return {
          success: true,
          inviteCode: data,
          message: `Invite code updated to ${data}`,
        };
      }
      if (error) {
        if (isRpcMissingOrUnavailableError(error)) {
          console.info('[teamService] Supabase rotate_invite_code RPC not in schema cache. Seamlessly bridging via application server.');
        } else {
          console.warn('[teamService] Supabase rotate_invite_code fallback:', error.message);
        }
      }
    } catch (err) {
      console.warn('[teamService] Supabase rotate_invite_code fallback:', err);
    }
  }

  try {
    const res = await fetch('/api/teams/rotate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callSign: user.callSign }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        inviteCode: data.inviteCode,
        message: data.message,
      };
    }
    return {
      success: false,
      message: data.error || 'Failed to rotate invite code.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'Could not contact server to rotate invite code.',
    };
  }
}
