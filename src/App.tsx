/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Compass,
  Copy,
  FileText,
  Filter,
  FolderOpen,
  Headphones,
  HelpCircle,
  Info,
  Key,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Medal,
  Menu,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Newspaper,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

import {
  CASE_ID,
  evidence,
  getEvidence,
  messages,
  navItems,
  stages,
  type EvidenceItem,
  type Stage,
} from '@/src/lib/mockData';

import {
  clearActiveSession,
  getActiveUser,
  getAllUsers,
  getUserProgress,
  loginPrototypeUser,
  registerPrototypeUser,
  saveUserProgress,
  setActiveSession,
  isUserStaff,
  type PrototypeUser,
  type UserProgress,
} from '@/src/lib/prototypeAuth';
import {
  registerUser,
  loginUser,
  logoutUser,
  restoreSession,
} from '@/src/lib/authService';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { submitLocationChoice } from '@/src/lib/gameService';

import { ambientAudio } from '@/src/lib/ambientAudio';
import { tacticalAudio, type TacticalAudioState } from '@/src/lib/tacticalAudio';
import { signalAudio, type SignalAudioState } from '@/src/lib/signalAudio';
import {
  STAGE_SCHEDULE,
  REGISTRATION_OPEN_ISO,
  REGISTRATION_OPEN_IST,
  GAME_LAUNCH_ISO,
  GAME_LAUNCH_IST,
  isRegistrationOpen,
  isGameLaunched,
  isStageAccessible,
  calculateStageScore,
  formatCountdown,
  formatToIST,
  getRemainingTime,
  getStageDisplayInfo,
} from '@/src/lib/stageConfig';

import { PreRegistrationView } from '@/src/components/PreRegistrationView';
import { GameLaunchScreen } from '@/src/components/GameLaunchScreen';
import { ISTClockWidget } from '@/src/components/ISTClockWidget';
import { CoordinateDeductionModal } from '@/src/components/CoordinateDeductionModal';
import { MapSecurityGate } from '@/src/components/MapSecurityGate';
import { SuspectDatabaseView } from '@/src/components/SuspectDatabaseView';
import { VideoAttachmentViewer } from '@/src/components/VideoAttachmentViewer';
import { DebriefView } from '@/src/components/DebriefView';
import { DirectorBriefingModal } from '@/src/components/DirectorBriefingModal';
import { StoryIntermissionModal, type IntermissionKey } from '@/src/components/StoryIntermissionModal';
import {
  SceneOverviewDoc,
  RadioReceiverDoc,
  RecordsRoomNegativeDoc,
  ForensicNegativeDoc,
  WitnessTranscriptDoc,
  TransmissionMastDoc,
  SuspectDossierAllenDoc,
  SuspectDossierGaikowskiDoc,
  EllenValeJournalDoc,
  RecordRememberedTomorrowDoc,
  StationIncidentReportDoc,
} from '@/src/components/DocumentSystemSheets';
import {
  InvestigationDashboard,
  getInvestigatorDirective,
} from '@/src/components/InvestigationDashboard';
import { StaffRoomView } from '@/src/components/StaffRoomView';
import { ClassifiedCaseFilesViewer } from '@/src/components/ClassifiedCaseFilesViewer';
import { SupportTicketsView } from '@/src/components/SupportTicketsView';
import { ClearanceTerminalView } from '@/src/components/ClearanceTerminalView';
import { CrackedScreenAftermathOverlay } from '@/src/components/CrackedScreenAftermathOverlay';
import {
  fetchMyTeam,
  createTeamAction,
  joinTeamAction,
  leaveTeamAction,
  rotateInviteCodeAction,
  type TeamData,
} from '@/src/lib/teamService';
import { getDeliveredMessagesForPlayer } from '@/src/lib/messagesStore';

type RouteView =
  | 'landing'
  | 'register'
  | 'login'
  | 'terminal'
  | 'dashboard'
  | 'investigation'
  | 'evidence'
  | 'viewer'
  | 'map'
  | 'suspects'
  | 'messages'
  | 'support'
  | 'progress'
  | 'leaderboard'
  | 'team'
  | 'account'
  | 'admin'
  | 'debrief'
  | 'first-directive'
  | 'case-files';

export interface AppRoute {
  view: RouteView;
  id?: string;
  doc?: string;
  collection?: 'directive' | 'archival';
  standalone?: boolean;
}

function getRoute(): AppRoute {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const searchParams = new URLSearchParams(window.location.search);
  const doc = searchParams.get('doc') || undefined;
  const colParam = searchParams.get('collection');
  const collection = (colParam === 'archival' || colParam === 'directive') ? colParam : undefined;
  const standalone = searchParams.get('standalone') === 'true';

  if (parts[0] === 'evidence' && parts[1]) {
    return { view: 'viewer', id: parts[1], doc, collection, standalone };
  }
  if (parts[0] === 'suspect-database') {
    return { view: 'suspects', doc, collection, standalone };
  }
  if (parts[0] === 'first-directive' || parts[0] === 'case-files' || parts[0] === 'dossiers') {
    return { view: 'first-directive', doc, collection, standalone };
  }
  if (parts[0] === 'support' || parts[0] === 'tickets' || parts[0] === 'help') {
    return { view: 'support', doc, collection, standalone };
  }
  if (parts[0] === 'terminal' || parts[0] === 'launch' || parts[0] === 'launch-terminal') {
    return { view: 'terminal', doc, collection, standalone };
  }
  const route = parts[0] as RouteView | undefined;
  const known: RouteView[] = [
    'register',
    'login',
    'terminal',
    'dashboard',
    'investigation',
    'evidence',
    'map',
    'suspects',
    'messages',
    'support',
    'progress',
    'leaderboard',
    'team',
    'account',
    'admin',
    'debrief',
    'first-directive',
    'case-files',
  ];
  return {
    view: known.includes(route as RouteView) ? (route as RouteView) : 'landing',
    doc,
    collection,
    standalone,
  };
}

function computeLocationProfile(r: AppRoute): import('@/src/lib/tacticalAudio').AudioLocationProfile {
  if (r.view === 'landing' || r.view === 'login' || r.view === 'register') return 'silent';
  if (r.view === 'terminal') return 'audio_investigation';
  if (r.view === 'dashboard' || r.view === 'progress' || r.view === 'leaderboard' || r.view === 'account' || r.view === 'team' || r.view === 'support') return 'dashboard';
  if (r.view === 'evidence' || r.view === 'suspects' || r.view === 'investigation') return 'archive';
  if (r.view === 'first-directive' || r.view === 'case-files') return 'document_viewer';
  if (r.view === 'map') return 'map';
  if (r.view === 'messages') return 'messages';
  if (r.view === 'viewer') {
    if (r.id === 'EV-0401') return 'audio_investigation';
    if (r.id === 'EV-0601' || r.id === 'EV-0602') return 'archive';
    if (r.id === 'EV-0701') return 'final_investigation';
    if (r.id === 'EV-0702') return 'ending';
    return 'document_viewer';
  }
  if (r.view === 'debrief') return 'ending';
  return 'dashboard';
}

function navigate(path: string): void {
  tacticalAudio.playNavClick();
  signalAudio.cleanup();
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<PrototypeUser | null>(getActiveUser);
  const [progress, setProgress] = useState<UserProgress | null>(() => {
    const user = getActiveUser();
    return user ? getUserProgress(user.callSign) : null;
  });
  const [audioState, setAudioState] = useState<TacticalAudioState>(() => tacticalAudio.getState());
  const [showDirectorReplay, setShowDirectorReplay] = useState(false);

  // Authoritative real-time clock state for timeline transitions
  const [realNow, setRealNow] = useState<Date>(() => new Date());

  // Continuous drift-free timeline synchronization + tab visibility & focus rechecking
  useEffect(() => {
    const updateTime = () => setRealNow(new Date());
    const interval = setInterval(updateTime, 1000);

    const handleFocus = () => {
      updateTime();
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const regOpen = isRegistrationOpen(realNow);
  const gameLaunched = isGameLaunched(realNow);

  // Compute active intermission key
  const activeIntermissionKey = useMemo<IntermissionKey | null>(() => {
    if (!currentUser || !progress) return null;
    const seen = progress.seenIntermissions || [];
    if (progress.stagesCompleted >= 1 && !seen.includes('s1_to_s2')) return 's1_to_s2';
    if (progress.stage2DeductionSolved && !seen.includes('s2_to_s3')) return 's2_to_s3';
    if (progress.mapGateUnlocked && !seen.includes('s3_to_s4')) return 's3_to_s4';
    if (progress.stagesCompleted >= 4 && !seen.includes('s4_to_s5')) return 's4_to_s5';
    if (progress.suspectDbUnlocked && !seen.includes('s5_to_s6')) return 's5_to_s6';
    if (progress.stagesCompleted >= 6 && !seen.includes('s6_to_s7')) return 's6_to_s7';
    return null;
  }, [currentUser, progress]);

  // Subscribe to tactical audio state (SFX and Ambience)
  useEffect(() => {
    return tacticalAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  // Synchronize location-based ambient audio profile with active route
  useEffect(() => {
    const profile = computeLocationProfile(route);
    tacticalAudio.setLocationProfile(profile);
  }, [route]);

  // Asynchronous session restoration (Supabase Auth / Local cache)
  useEffect(() => {
    restoreSession().then((active) => {
      if (active) {
        setCurrentUser(active);
        setProgress(getUserProgress(active.callSign));
      }
    });
  }, []);

  // Keep route and session synchronized
  useEffect(() => {
    const handlePopState = (): void => {
      signalAudio.cleanup();
      const nextRoute = getRoute();
      setRoute(nextRoute);
      const active = getActiveUser();
      setCurrentUser(active);
      if (active) {
        setProgress(getUserProgress(active.callSign));
      } else {
        setProgress(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update progress helper
  const handleUpdateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    if (!currentUser || !progress) return;
    const next = updater({ ...progress });
    saveUserProgress(next);
    setProgress(next);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setProgress(null);
    navigate('/');
  };

  // Route protection: Landing, Registration, Login, and Password-Guarded Staff Console
  const isPublicRoute =
    route.view === 'landing' ||
    route.view === 'register' ||
    route.view === 'login' ||
    route.view === 'admin';
  const requiresAuth = !isPublicRoute;

  // Unauthenticated visitors trying to access protected game routes
  if (requiresAuth && !currentUser) {
    return (
      <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc] flex flex-col justify-between">
        <header className="border-b border-border px-6 py-4 flex justify-between items-center bg-[#0c0c0b]/90">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <span className="block size-2 rounded-full bg-crimson" />
            <span className="font-mono text-xs uppercase tracking-[0.28em]">THE LAST SIGNAL</span>
          </div>
          <button className="button button-secondary text-xs" onClick={() => navigate('/login')}>
            Log In
          </button>
        </header>

        <div className="auth-container">
          <div className="auth-card text-center space-y-5">
            <ShieldAlert size={36} className="text-crimson mx-auto" />
            <h2 className="font-serif text-3xl font-light text-foreground">
              Investigator Access Required
            </h2>
            <p className="text-sm font-serif text-muted-foreground leading-relaxed">
              This case file route ({route.view.toUpperCase()}) requires an active student investigator session.
              Please register your call-sign or sign in to access the investigation archive.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button className="button button-primary" onClick={() => navigate('/register')}>
                {regOpen ? 'Register Call-Sign' : 'Pre-Registration Notice'}
              </button>
              <button className="button button-secondary" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>
            <button
              className="text-button text-xs text-muted-foreground hover:text-foreground mt-4"
              onClick={() => navigate('/')}
            >
              ← Return to Case Briefing Homepage
            </button>
          </div>
        </div>

        <footer className="border-t border-border py-4 text-center font-mono text-[11px] text-muted-foreground">
          THE LAST SIGNAL — CASE {CASE_ID} — ONLINE FICTIONAL SCHOOL INVESTIGATION
        </footer>
      </div>
    );
  }

  // Standalone password-only Staff Console access (when no investigator account is logged in)
  if (route.view === 'admin' && !currentUser) {
    return (
      <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc] flex flex-col justify-between">
        <header className="border-b border-border px-6 py-4 flex justify-between items-center bg-[#0c0c0b]/90">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <span className="block size-2 rounded-full bg-crimson" />
            <span className="font-mono text-xs uppercase tracking-[0.28em]">THE LAST SIGNAL // OPERATIONS</span>
          </div>
          <button className="button button-secondary text-xs" onClick={() => navigate('/')}>
            ← Return to Case Briefing
          </button>
        </header>

        <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6">
          <StaffRoomView
            user={undefined}
            progress={getUserProgress('organizer')}
            onUpdateProgress={() => {}}
            onLogout={() => navigate('/')}
          />
        </div>

        <footer className="border-t border-border py-4 text-center font-mono text-[11px] text-muted-foreground">
          THE LAST SIGNAL — CASE {CASE_ID} — CLASSIFIED OPERATIONS DESK
        </footer>
      </div>
    );
  }

  // Public standalone views
  if (route.view === 'landing') {
    return (
      <LandingView
        user={currentUser}
        isRegOpen={regOpen}
        isLaunched={gameLaunched}
        onLogout={handleLogout}
      />
    );
  }

  if (route.view === 'register') {
    if (!regOpen) {
      return (
        <PreRegistrationView
          onRegistrationOpen={() => {
            setRealNow(new Date());
          }}
          onNavigateHome={() => navigate('/')}
          onNavigateLogin={() => navigate('/login')}
        />
      );
    }

    return (
      <RegisterView
        onRegistered={(user) => {
          setActiveSession(user);
          setCurrentUser(user);
          setProgress(getUserProgress(user.callSign));
          navigate('/terminal');
        }}
      />
    );
  }

  if (route.view === 'login') {
    return (
      <LoginView
        onLoggedIn={(user) => {
          setActiveSession(user);
          setCurrentUser(user);
          setProgress(getUserProgress(user.callSign));
          navigate(isGameLaunched() || user.hasStageOverride ? '/dashboard' : '/terminal');
        }}
      />
    );
  }

  // Before official game launch (12:00 AM IST on 1 November 2026),
  // authenticated students see the atmospheric GameLaunchScreen with live countdown.
  // Game puzzles, evidence archives, and story intermissions remain sealed.
  // Verified individual stage overrides (Testing Clearance) or Staff console bypass this countdown gate.
  const hasActiveOverride = Boolean(currentUser?.hasStageOverride || progress?.hasStageOverride);
  if (currentUser && !gameLaunched && !hasActiveOverride) {
    if (route.view === 'admin') {
      // Allow authorized staff into password-guarded staff room console
    } else {
      return (
        <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc] flex flex-col">
          <GameLaunchScreen
            user={currentUser}
            onLogout={handleLogout}
            onLaunch={() => {
              setRealNow(new Date());
              navigate('/dashboard');
            }}
          />
        </div>
      );
    }
  }

  // Standalone Fullscreen Document Viewer (opened via "Open in Separate Page")
  if (route.standalone && (route.view === 'first-directive' || route.view === 'case-files')) {
    return (
      <div className="min-h-screen bg-[#090b09] text-[#ebe6dc]">
        <ClassifiedCaseFilesViewer
          initialDocId={route.doc}
          initialCollection={route.collection}
          isStandalonePage={true}
          onReturnToDirective={() => {
            navigate('/first-directive');
          }}
        />
      </div>
    );
  }

  // Authenticated Shell
  return (
    <div className="app-shell">
      <Sidebar
        current={route.view}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
        user={currentUser!}
        progress={progress ?? undefined}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="icon-button md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              <span>CASE {CASE_ID}</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{route.view === 'viewer' ? 'EVIDENCE INSPECTOR' : route.view.toUpperCase()}</strong>
            </div>
          </div>
          <div className="topbar-actions flex items-center gap-2">
            {/* Tactical Audio Control Cluster (SFX & Ambience) */}
            <div className="flex items-center border border-border bg-[#141514] p-0.5 font-mono text-[10px]">
              <button
                onClick={() => tacticalAudio.toggleSfxMute()}
                className={`flex items-center gap-1 px-2 py-1 transition-colors ${
                  !audioState.sfxMuted
                    ? 'bg-crimson/20 text-crimson font-bold border border-crimson/50 shadow-[0_0_8px_rgba(200,40,40,0.2)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={audioState.sfxMuted ? 'Enable Tactical Interface SFX (mechanical clicks)' : 'Mute Interface SFX'}
                aria-label={audioState.sfxMuted ? 'Enable Interface SFX' : 'Mute Interface SFX'}
              >
                {audioState.sfxMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-crimson" />}
                <span className="hidden sm:inline">SFX {audioState.sfxMuted ? 'OFF' : 'ON'}</span>
              </button>
              <span className="text-border px-1">|</span>
              <button
                onClick={() => tacticalAudio.toggleAmbientMute()}
                className={`flex items-center gap-1 px-2 py-1 transition-colors ${
                  !audioState.ambientMuted
                    ? 'bg-crimson/20 text-crimson font-bold border border-crimson/50 shadow-[0_0_8px_rgba(200,40,40,0.2)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={audioState.ambientMuted ? 'Enable Atmospheric Ambience (wind & static)' : 'Mute Ambience'}
                aria-label={audioState.ambientMuted ? 'Enable Ambience' : 'Mute Ambience'}
              >
                <Radio size={13} className={!audioState.ambientMuted ? 'text-crimson animate-pulse' : ''} />
                <span className="hidden sm:inline">AMB {audioState.ambientMuted ? 'OFF' : 'ON'}</span>
              </button>
              <span className="text-border px-1">|</span>
              <button
                onClick={() => tacticalAudio.toggleRainMute()}
                className={`flex items-center gap-1 px-2 py-1 transition-colors ${
                  !audioState.rainMuted
                    ? 'bg-crimson/20 text-crimson font-bold border border-crimson/50 shadow-[0_0_8px_rgba(200,40,40,0.2)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={audioState.rainMuted ? 'Enable Atmospheric Rain Ambience' : 'Mute Rain Ambience'}
                aria-label={audioState.rainMuted ? 'Enable Rain Ambience' : 'Mute Rain Ambience'}
              >
                <span className="hidden sm:inline">RAIN {audioState.rainMuted ? 'OFF' : 'ON'}</span>
                <span className="sm:hidden text-[10px]">RAIN</span>
              </button>
            </div>

            {/* Indian Standard Time & Stage Countdown Widget */}
            <ISTClockWidget activeStageNumber={progress?.activeStage ?? 1} variant="compact" />

            {hasActiveOverride && (
              <span className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 border border-amber-500/40 bg-amber-950/30 text-amber-300 font-mono text-[10px] tracking-wider uppercase font-semibold">
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                Override Active (Stages 1–7)
              </span>
            )}

            {progress?.endingCorruptedAftermath && !progress?.aftermathDismissed ? (
              <span className="live-status bg-red-950/80 border border-red-700 text-red-300 font-bold px-2 py-0.5 tracking-wider">
                <span className="live-dot bg-red-500 animate-ping" /> SIGNAL LOST // ARCHIVE SEVERED
              </span>
            ) : (
              <span className="live-status">
                <span className="live-dot" /> Operative: {currentUser?.callSign}
              </span>
            )}
            <button className="profile-chip" onClick={() => navigate('/account')}>
              <span className="avatar">
                {currentUser?.callSign.slice(0, 2).toUpperCase() ?? 'OP'}
              </span>
              <span className="font-mono text-xs hidden sm:inline">{currentUser?.callSign}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Director Lockdown Banner (Persistent story freeze state) */}
        {progress?.systemFreezeTriggered && (
          <div className="bg-red-950/90 border-b border-crimson px-5 py-2.5 text-xs font-mono text-red-200 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-crimson animate-ping" />
              <strong className="text-white uppercase tracking-wider">
                [DIRECTORATE LOCKDOWN ACTIVE]
              </strong>
              <span className="text-red-300 hidden md:inline">
                — Transmissions severed by Office of the Director. Inquiries terminated.
              </span>
            </div>
            <button
              onClick={() => navigate('/debrief')}
              className="button bg-crimson text-white hover:bg-red-700 py-1 px-3 text-[11px] font-bold tracking-wider"
            >
              Debrief Clearance: Proceed to Stage 07 / Chronicle →
            </button>
          </div>
        )}

        <div className="page-wrap">
          <PageDispatcher
            route={route}
            user={currentUser!}
            progress={progress ?? getUserProgress(currentUser!.callSign)}
            onUpdateProgress={handleUpdateProgress}
            onLogout={handleLogout}
            onTriggerDirectorReplay={() => setShowDirectorReplay(true)}
          />
        </div>
      </main>

      {/* Director Opening Briefing (Automatic on first time, or triggered via Replay) */}
      {currentUser && progress && (!progress.directorIntroSeen || showDirectorReplay) && (
        <DirectorBriefingModal
          isOpen={true}
          user={currentUser}
          progress={progress}
          isReplay={showDirectorReplay}
          onClose={() => setShowDirectorReplay(false)}
          onUpdateProgress={handleUpdateProgress}
        />
      )}

      {/* Story Stage Intermission Modal */}
      {activeIntermissionKey && (!progress || progress.directorIntroSeen) && !showDirectorReplay && (
        <StoryIntermissionModal
          intermissionKey={activeIntermissionKey}
          onClose={() => {}}
          onUpdateProgress={handleUpdateProgress}
        />
      )}

      {/* Persistent Corrupted Aftermath Overlay & Diagnostic Toggle (Part 6) */}
      <CrackedScreenAftermathOverlay
        isAftermathActive={Boolean(progress?.endingCorruptedAftermath)}
        isDismissed={Boolean(progress?.aftermathDismissed)}
        onToggleDismiss={() => {
          handleUpdateProgress((prev) => ({
            ...prev,
            aftermathDismissed: !prev.aftermathDismissed,
          }));
        }}
        onReplayEnding={() => navigate('/debrief')}
      />
    </div>
  );
}

/* =========================================================================
   NAVIGATION SIDEBAR
   ========================================================================= */

function Sidebar({
  current,
  mobileOpen,
  closeMobile,
  user,
  progress,
  onLogout,
}: {
  current: RouteView;
  mobileOpen: boolean;
  closeMobile: () => void;
  user: PrototypeUser;
  progress?: UserProgress;
  onLogout: () => void;
}) {
  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    layout: LayoutDashboard,
    folder: FolderOpen,
    file: FileText,
    terminal: Terminal,
    map: MapIcon,
    shield: ShieldAlert,
    message: MessageSquare,
    help: LifeBuoy,
    activity: Activity,
    bar: BarChart3,
    users: Users,
  };

  const unreadMessagesCount = useMemo(() => {
    if (!progress) return 0;
    const delivered = getDeliveredMessagesForPlayer(progress);
    const readSet = new Set(progress.readMessageIds ?? []);
    return delivered.filter((m) => !readSet.has(m.id)).length;
  }, [progress, progress?.readMessageIds]);

  return (
    <>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="brand-block">
          <div
            className="brand-mark cursor-pointer"
            onClick={() => {
              navigate('/');
              closeMobile();
            }}
          >
            <Radio size={20} />
          </div>
          <div
            className="cursor-pointer"
            onClick={() => {
              navigate('/');
              closeMobile();
            }}
          >
            <div className="brand-name font-serif text-lg tracking-wide">THE LAST SIGNAL</div>
            <div className="brand-kicker">CASE {CASE_ID}</div>
          </div>
          {mobileOpen && (
            <button
              className="icon-button mobile-close-btn ml-auto md:hidden"
              onClick={closeMobile}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="case-label">
          <span className="eyebrow">INVESTIGATOR CALL-SIGN</span>
          <strong className="text-crimson font-mono text-sm tracking-wide">
            {user.callSign}
          </strong>
          <span className="case-status text-[10px] text-muted-foreground">
            {user.studentClass} · {user.fullName}
          </span>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          <div className="nav-section-label">Case Files</div>
          <button
            className={`nav-item ${current === 'first-directive' || current === 'case-files' ? 'active' : ''}`}
            onClick={() => {
              navigate('/first-directive');
              closeMobile();
            }}
          >
            <FolderOpen size={16} className={current === 'first-directive' ? 'text-emerald-400' : 'text-muted-foreground'} />
            <span>First Directive (5 Files)</span>
            <span className="ml-auto font-mono text-[9px] text-[#8deb9e] border border-[#2e5237] bg-[#122116] px-1.5 py-0.5">
              DOSSIERS
            </span>
          </button>
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] ?? FileText;
            const active =
              current === item.path.slice(1) ||
              (current === 'viewer' && item.path === '/evidence');

            return (
              <button
                key={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  closeMobile();
                }}
              >
                <Icon size={16} className={active ? 'text-crimson' : 'text-muted-foreground'} />
                <span>{item.label}</span>
                {item.label === 'Messages' && unreadMessagesCount > 0 && (
                  <span className="nav-badge">{unreadMessagesCount}</span>
                )}
              </button>
            );
          })}

          <div className="nav-section-label mt-4">Operative Dossier</div>
          <button
            className={`nav-item ${current === 'account' ? 'active' : ''}`}
            onClick={() => {
              navigate('/account');
              closeMobile();
            }}
          >
            <UserRound size={16} />
            <span>Account &amp; Safety</span>
          </button>
          <button
            className={`nav-item ${current === 'admin' ? 'active' : ''}`}
            onClick={() => {
              navigate('/admin');
              closeMobile();
            }}
          >
            <Settings size={16} />
            <span>Staff Console</span>
            <span className="ml-auto font-mono text-[9px] text-muted-foreground border border-border px-1.5 py-0.5">
              RESTRICTED
            </span>
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <button
            onClick={onLogout}
            className="text-button text-xs text-crimson hover:text-red-400 flex items-center gap-2"
          >
            <LogOut size={14} /> Exit Session
          </button>
          <span
            className="text-muted-foreground text-[10px] font-mono cursor-pointer hover:underline"
            onClick={() => navigate('/account')}
          >
            Safety &amp; Debrief
          </span>
        </div>
      </aside>
    </>
  );
}

/* =========================================================================
   ROUTE DISPATCHER (AUTHENTICATED)
   ========================================================================= */

function PageDispatcher({
  route,
  user,
  progress,
  onUpdateProgress,
  onLogout,
  onTriggerDirectorReplay,
}: {
  route: AppRoute;
  user: PrototypeUser;
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onLogout: () => void;
  onTriggerDirectorReplay?: () => void;
}) {
  switch (route.view) {
    case 'dashboard':
      return <DashboardView user={user} progress={progress} onUpdateProgress={onUpdateProgress} />;
    case 'investigation':
      return <InvestigationView user={user} progress={progress} />;
    case 'terminal':
      return (
        <ClearanceTerminalView
          progress={progress}
          onUpdateProgress={onUpdateProgress}
        />
      );
    case 'evidence':
      return <EvidenceRoomView progress={progress} />;
    case 'viewer':
      return (
        <EvidenceViewerView
          id={route.id ?? 'EV-0101'}
          progress={progress}
          onUpdateProgress={onUpdateProgress}
        />
      );
    case 'map':
      return <SignalMapView progress={progress} onUpdateProgress={onUpdateProgress} />;
    case 'suspects':
      return (
        <SuspectDatabaseView
          progress={progress}
          onUpdateProgress={onUpdateProgress}
          onNavigateEvidence={(id) => navigate(`/evidence/${id}`)}
        />
      );
    case 'debrief':
      return (
        <DebriefView
          user={user}
          progress={progress}
          onUpdateProgress={onUpdateProgress}
          onNavigateHome={() => navigate('/dashboard')}
        />
      );
    case 'support':
      return <SupportTicketsView user={user} onNavigateHome={() => navigate('/dashboard')} />;
    case 'messages':
      return (
        <MessagesView
          progress={progress}
          onUpdateProgress={onUpdateProgress}
          onTriggerDirectorReplay={onTriggerDirectorReplay}
        />
      );
    case 'progress':
      return <ProgressView progress={progress} />;
    case 'leaderboard':
      return <LeaderboardView user={user} progress={progress} />;
    case 'team':
      return <TeamView user={user} progress={progress} onUpdateProgress={onUpdateProgress} />;
    case 'account':
      return (
        <AccountView
          user={user}
          progress={progress}
          onUpdateProgress={onUpdateProgress}
          onLogout={onLogout}
          onTriggerDirectorReplay={onTriggerDirectorReplay}
        />
      );
    case 'admin':
      return (
        <StaffRoomView
          user={user}
          progress={progress}
          onUpdateProgress={onUpdateProgress}
          onLogout={onLogout}
        />
      );
    case 'first-directive':
    case 'case-files':
      return (
        <ClassifiedCaseFilesViewer
          initialDocId={route.doc}
          initialCollection={route.collection}
          onReturnToDirective={() => navigate('/dashboard')}
        />
      );
    default:
      return <DashboardView user={user} progress={progress} onUpdateProgress={onUpdateProgress} />;
  }
}

/* =========================================================================
   COMMON UI PRIMITIVES
   ========================================================================= */

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="header-action shrink-0">{action}</div>}
    </div>
  );
}

/* =========================================================================
   1. HOMEPAGE (/) — Cinematic Landing + Active Investigation CTAs
   ========================================================================= */

function LandingView({
  user,
  isRegOpen,
  isLaunched,
  onLogout,
}: {
  user: PrototypeUser | null;
  isRegOpen: boolean;
  isLaunched: boolean;
  onLogout: () => void;
}) {
  const featured = evidence.filter((item) => item.status === 'available').slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc]">
      {/* Top Active Investigation Notice Banner */}
      <div className="bg-[#141514] border-b border-[#2a2927] py-2.5 px-4 text-center font-mono text-xs text-[#dcd1be] flex flex-wrap items-center justify-center gap-2">
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        <strong className="tracking-[0.2em] text-emerald-400">INVESTIGATION ACTIVE // TRANSMISSION LIVE</strong>
        <span className="text-[#8d8880] hidden sm:inline">·</span>
        <span>THE ARCHIVE IS UNSEALED: <strong className="text-crimson font-bold">ALL 7 STAGES OPEN FOR INTAKE</strong></span>
        <span className="text-[#8d8880] hidden sm:inline">·</span>
        <button
          onClick={() => navigate(user ? '/dashboard' : '/register')}
          className="text-crimson hover:underline font-bold tracking-wider inline-flex items-center gap-1 ml-1"
        >
          {user ? 'Enter Investigation Dashboard →' : 'Register Call-Sign & Begin →'}
        </button>
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#2a2927] bg-[#0c0c0b]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <span aria-hidden className="block size-2 rounded-full bg-crimson" />
            <span className="font-mono text-xs uppercase tracking-[0.32em] text-[#ebe6dc]">
              THE LAST SIGNAL
            </span>
            <span className="hidden font-mono text-xs tracking-[0.2em] text-[#8d8880] sm:inline">
              / {CASE_ID}
            </span>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-5">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="font-mono text-xs uppercase tracking-[0.2em] text-[#ebe6dc] hover:underline"
                >
                  Investigation Desk ({user.callSign})
                </button>
                <button
                  onClick={onLogout}
                  className="font-mono text-xs uppercase tracking-[0.2em] text-crimson hover:underline"
                >
                  Exit Session
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="font-mono text-xs uppercase tracking-[0.2em] text-[#8d8880] hover:text-[#ebe6dc] transition-colors"
                >
                  Investigator Log In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="button button-primary hidden sm:inline-flex"
                >
                  Register Call-Sign
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section with Alley Artwork & Atmosphere */}
      <section className="relative isolate flex min-h-[90vh] flex-col justify-end overflow-hidden">
        <img
          src="/images/hero-scene.png"
          alt="Rain-soaked alley at night with a handheld radio and police line tape"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center] saturate-[0.7]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0c0c0b] via-[#0c0c0b]/80 to-transparent" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0c0c0b] via-[#0c0c0b]/40 to-transparent" />
        <div aria-hidden className="rain absolute inset-0 -z-10 opacity-70" />
        <div aria-hidden className="film-grain absolute inset-0 -z-10" />

        <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-32 md:px-10 md:pb-24">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-xs uppercase tracking-[0.28em] text-[#8d8880]">
            <span>Case File no. {CASE_ID}</span>
            <span aria-hidden className="h-px w-10 bg-[#8d8880]/50" />
            <span className="inline-flex items-center gap-2 text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: INVESTIGATION ACTIVE // OFFICIAL BROADCAST LIVE
            </span>
          </div>

          <div className="mt-8 flex items-start gap-6">
            <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#ebe6dc] sm:text-7xl md:text-8xl lg:text-[7.5rem]">
              The Last
              <br />
              <span className="italic font-serif text-[#dc6060]">Signal</span>
            </h1>
            <span className="stamp mt-4 hidden -rotate-6 text-sm text-crimson border-crimson md:inline-block">
              Classified
            </span>
          </div>

          <p className="mt-8 max-w-xl font-serif text-lg leading-relaxed text-[#ebe6dc]/85 md:text-xl">
            A fictional interactive investigation in seven stages across fourteen days. An archive of
            historical records has been reopened for review. The case is active. Your investigation begins now.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="button button-primary px-8 py-4 text-xs font-bold tracking-[0.26em] shadow-[0_0_25px_rgba(200,40,40,0.35)]"
            >
              ENTER THE INVESTIGATION
              <ArrowRight size={16} />
            </button>

            {user ? (
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#8d8880]">
                Active Operative: <strong className="text-[#ebe6dc]">{user.callSign}</strong>
              </span>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="font-mono text-xs uppercase tracking-[0.24em] text-[#8d8880] underline-offset-8 hover:text-[#ebe6dc] hover:underline"
              >
                Returning Investigator Log In →
              </button>
            )}
          </div>
        </div>

        {/* Case Metadata Strip */}
        <dl className="relative mx-auto grid w-full max-w-7xl grid-cols-2 border-t border-[#2a2927] px-5 font-mono text-[11px] uppercase tracking-[0.2em] md:grid-cols-4 md:px-10">
          {[
            ['Investigation Status', 'ACTIVE & IN PROGRESS'],
            ['Operative Clearance', 'ALL 7 WAVES OPEN'],
            ['Investigation Duration', '14 Calendar Days'],
            ['Challenge Format', '07 Progressive Waves'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-r border-[#2a2927] py-4 pr-4 last:border-r-0 even:pl-4 md:pl-4 md:first:pl-0"
            >
              <dt className="text-[#8d8880] text-[10px]">{label}</dt>
              <dd className="mt-1 text-[#ebe6dc] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Stage Index Section (Does not claim any visitor has solved anything) */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32 border-t border-[#2a2927]">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-crimson">
              The Seven Signals
            </p>
            <h2 className="mt-4 font-serif text-4xl font-light leading-tight md:text-5xl text-[#ebe6dc]">
              Index of the investigation
            </h2>
            <p className="mt-6 max-w-md font-serif text-base leading-relaxed text-[#8d8880]">
              Seven consecutive stages, each lasting 48 hours. Stage 1 unlocks on launch day. Every
              subsequent stage remains sealed until released by schedule.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-3">
              {featured.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => navigate(user ? `/evidence/${item.id}` : '/register')}
                  className={`group relative block aspect-[3/4] overflow-hidden bg-[#151514] border border-[#2a2927] cursor-pointer ${
                    i === 1 ? 'mt-8' : ''
                  }`}
                >
                  <img
                    src={item.image ?? '/images/hero-scene.png'}
                    alt={item.title}
                    className="h-full w-full object-cover grayscale-[40%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <span className="absolute bottom-2 left-2 bg-[#0c0c0b]/85 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.15em] text-[#ebe6dc]">
                    {item.id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ol className="border-t border-[#2a2927]">
            {stages.map((stage) => {
              const displayInfo = getStageDisplayInfo(stage.number, null);
              const isLocked = !displayInfo.isReleased;

              return (
                <li
                  key={stage.number}
                  className="grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-4 border-b border-[#2a2927] py-6 md:grid-cols-[5rem_1fr_auto]"
                >
                  <span className="font-mono text-sm text-[#8d8880]">
                    {String(stage.number).padStart(2, '0')}
                  </span>
                  <div>
                    <h3
                      className={`font-serif text-2xl font-light md:text-3xl ${
                        isLocked ? 'text-[#8d8880] italic' : 'text-[#ebe6dc]'
                      }`}
                    >
                      {displayInfo.title}
                    </h3>
                    <p
                      className={`mt-1 font-mono text-xs uppercase tracking-[0.2em] ${
                        isLocked ? 'text-[#615e58]' : 'text-[#8d8880]'
                      }`}
                    >
                      {displayInfo.subtitle}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-[#8d8880]">
                    {stage.number === 1 ? (
                      <span className="text-crimson font-medium">Stage 01 Unlock</span>
                    ) : (
                      <>
                        <Lock size={12} />
                        <span>SIGNAL LOCKED</span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Safety Footer */}
      <footer className="border-t border-[#2a2927] py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 font-mono text-xs uppercase tracking-[0.22em] text-[#8d8880] md:flex-row md:items-center md:justify-between md:px-10">
          <p>THE LAST SIGNAL — CASE {CASE_ID} — A FICTIONAL SCHOOL MYSTERY GAME</p>
          <div className="flex items-center gap-4">
            <p>ONLINE-ONLY EVENT · NEVER VISIT REAL LOCATIONS</p>
            <span className="text-[#3a3937] hidden md:inline">|</span>
            <button
              onClick={() => navigate('/admin')}
              className="text-[#8d8880] hover:text-[#ebe6dc] transition-colors underline cursor-pointer text-[10px]"
            >
              Staff Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================================
   2. REGISTRATION (/register) — Required Form Fields & Validations
   ========================================================================= */

const CLASS_OPTIONS = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

function RegisterView({ onRegistered }: { onRegistered: (user: PrototypeUser) => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [studentClass, setStudentClass] = useState('Class 9');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [callSign, setCallSign] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmedUser, setConfirmedUser] = useState<PrototypeUser | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid student email address (e.g. operative@school.edu).');
      return;
    }

    setLoading(true);
    const result = await registerUser({
      fullName,
      email: cleanEmail,
      school: school.trim() || undefined,
      studentClass,
      admissionNumber,
      callSign,
      passwordPlain: password,
    });
    setLoading(false);

    if (!result.success || !result.user) {
      setError(result.error ?? 'Registration failed.');
      return;
    }

    setConfirmedUser(result.user);
  };

  if (confirmedUser) {
    return (
      <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc] flex flex-col justify-between">
        <header className="border-b border-border px-6 py-4 flex justify-between items-center bg-[#0c0c0b]/90">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <span className="block size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.28em]">THE LAST SIGNAL</span>
          </div>
          <button
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            onClick={() => onRegistered(confirmedUser)}
          >
            Enter Investigation →
          </button>
        </header>

        <div className="auth-container">
          <div className="auth-card max-w-lg space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto size-12 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Check size={24} />
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-400 block font-bold">
                REGISTRATION CONFIRMED
              </span>
              <h1 className="font-serif text-3xl font-light">Operative Dossier Enrolled</h1>
              <p className="font-serif text-sm text-muted-foreground">
                Your credentials have been securely registered for Case {CASE_ID}. Clearance granted.
              </p>
            </div>

            <div className="bg-[#141514] border border-[#2a2927] p-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-[#222120] pb-2">
                <span className="text-muted-foreground">OFFICIAL CALL-SIGN:</span>
                <span className="font-bold text-emerald-400">{confirmedUser.callSign}</span>
              </div>
              <div className="flex justify-between border-b border-[#222120] pb-2">
                <span className="text-muted-foreground">OPERATIVE NAME:</span>
                <span className="text-[#ebe6dc]">{confirmedUser.fullName}</span>
              </div>
              {confirmedUser.email && (
                <div className="flex justify-between border-b border-[#222120] pb-2">
                  <span className="text-muted-foreground">STUDENT EMAIL:</span>
                  <span className="text-[#ebe6dc]">{confirmedUser.email}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-[#222120] pb-2">
                <span className="text-muted-foreground">SCHOOL / DIVISION:</span>
                <span className="text-[#ebe6dc]">
                  {confirmedUser.school ? `${confirmedUser.school} (${confirmedUser.studentClass})` : confirmedUser.studentClass}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#222120] pb-2">
                <span className="text-muted-foreground">MASKED ADMISSION ID:</span>
                <span className="text-[#8d8880]">{confirmedUser.admissionNumberMasked}</span>
              </div>
              <div className="flex justify-between border-b border-[#222120] pb-2">
                <span className="text-muted-foreground">CLEARANCE LEVEL:</span>
                <span className="text-crimson font-bold">STAGE 01 UNSEALED</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">INVESTIGATION STATUS:</span>
                <span className="text-emerald-400 font-bold">ACTIVE · TRANSMISSION IN PROGRESS</span>
              </div>
            </div>

            <div className="bg-[#16120e] border border-[#3d2b17] p-4 text-xs font-serif text-[#d4b996] space-y-2">
              <p className="m-0 leading-relaxed">
                <strong>Investigation Active:</strong> All initial evidence files, cipher dockets, and audio archives are open.
                Begin by reviewing <strong>EV-0101 (Scene Overview)</strong> and <strong>EV-0102 (Radio Receiver)</strong>.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => onRegistered(confirmedUser)}
                className="button button-primary w-full text-xs tracking-[0.24em] py-3.5 flex items-center justify-center gap-2 font-bold"
              >
                ENTER THE INVESTIGATION <ArrowRight size={15} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `THE LAST SIGNAL — CASE ${CASE_ID}\nOperative Call-Sign: ${confirmedUser.callSign}\nEmail: ${confirmedUser.email || 'N/A'}\nStatus: Active Investigation`
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="button button-secondary w-full text-xs font-mono py-2.5 flex items-center justify-center gap-2"
              >
                <Copy size={13} /> {copied ? 'COPIED TO CLIPBOARD' : 'COPY CALL-SIGN DETAILS'}
              </button>
            </div>
          </div>
        </div>

        <footer className="border-t border-border py-4 text-center font-mono text-[11px] text-muted-foreground">
          THE LAST SIGNAL — CASE {CASE_ID} — ONLINE FICTIONAL SCHOOL INVESTIGATION
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc] flex flex-col justify-between">
      <header className="border-b border-border px-6 py-4 flex justify-between items-center bg-[#0c0c0b]/90">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <span className="block size-2 rounded-full bg-crimson" />
          <span className="font-mono text-xs uppercase tracking-[0.28em]">THE LAST SIGNAL</span>
        </div>
        <button
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/login')}
        >
          Already Registered? Log In →
        </button>
      </header>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-400 font-bold">
              STUDENT OPERATIVE INTAKE · INVESTIGATION ACTIVE
            </span>
            <h1>Register Investigator Call-Sign</h1>
            <p className="font-serif text-sm text-muted-foreground m-0">
              The case is active. Create your operative call-sign to immediately enter the investigation.
            </p>
          </div>

          <div className="auth-notice-box">
            <strong>ACTIVE INVESTIGATION PROTOCOL:</strong> Student registration is live.
            Evidence archives and suspect dossiers are unsealed. Enrolling your credentials grants instant clearance to Case {CASE_ID}.
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>1. Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Mercer"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>2. Student Email Address</label>
              <input
                type="email"
                placeholder="e.g. operative@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
                Required for case intake confirmation, credential restoration, and dispatch bulletins.
              </span>
            </div>

            <div className="form-group">
              <label>3. School / Institution</label>
              <input
                type="text"
                placeholder="e.g. Presidio Academy"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>4. School Class</label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                required
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>5. Admission Number</label>
              <input
                type="text"
                placeholder="e.g. ADM-2026-9041"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                required
              />
              <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
                Stored in cryptographically masked format to protect student privacy. Duplicate numbers rejected.
              </span>
            </div>

            <div className="form-group">
              <label>6. Call-Sign / Username</label>
              <input
                type="text"
                placeholder="e.g. Cipher_Echo"
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                minLength={3}
                maxLength={24}
                required
              />
              <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
                Letters, numbers, underscores only (3–24 chars). Must be unique across all participants.
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label>7. Case Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label>8. Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button button-primary w-full mt-4 text-xs tracking-[0.24em] py-3.5 font-bold"
            >
              <UserPlus size={15} /> {loading ? 'CONFIRMING ENROLLMENT...' : 'ENROLL AS INVESTIGATOR & ENTER'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-line-soft text-center font-mono text-xs">
            <span className="text-muted-foreground">Already registered on this terminal? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-crimson hover:underline font-bold"
            >
              Log in with call-sign or email
            </button>
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-4 text-center font-mono text-[11px] text-muted-foreground">
        THE LAST SIGNAL — CASE {CASE_ID} — ONLINE FICTIONAL SCHOOL INVESTIGATION
      </footer>
    </div>
  );
}

/* =========================================================================
   3. LOGIN (/login) — Matching Verification Screen
   ========================================================================= */

function LoginView({ onLoggedIn }: { onLoggedIn: (user: PrototypeUser) => void }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginUser(identifier, password);
    setLoading(false);

    if (!result.success || !result.user) {
      setError(result.error ?? 'Login verification failed.');
      return;
    }

    onLoggedIn(result.user);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0b] text-[#ebe6dc] flex flex-col justify-between">
      <header className="border-b border-border px-6 py-4 flex justify-between items-center bg-[#0c0c0b]/90">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <span className="block size-2 rounded-full bg-crimson" />
          <span className="font-mono text-xs uppercase tracking-[0.28em]">THE LAST SIGNAL</span>
        </div>
        <button
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/register')}
        >
          New Operative? Register →
        </button>
      </header>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-crimson">
              INVESTIGATOR VERIFICATION
            </span>
            <h1>Log In to Case</h1>
            <p className="font-serif text-sm text-muted-foreground m-0">
              Enter your registered call-sign or email address and password to restore your session.
            </p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Call-Sign / Username or Email</label>
              <input
                type="text"
                placeholder="e.g. Cipher_Echo or operative@school.edu"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
              <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
                Sign in with either your unique operative call-sign or your student email.
              </span>
            </div>

            <div className="form-group">
              <label>Case Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button button-primary w-full mt-4 text-xs tracking-[0.24em] py-3.5"
            >
              <UserCheck size={15} /> {loading ? 'VERIFYING CREDENTIALS...' : 'VERIFY & ENTER'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-line-soft text-center font-mono text-xs">
            <span className="text-muted-foreground">Haven't registered yet? </span>
            <button
              onClick={() => navigate('/register')}
              className="text-crimson hover:underline font-bold"
            >
              Register here
            </button>
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-4 text-center font-mono text-[11px] text-muted-foreground">
        THE LAST SIGNAL — CASE {CASE_ID} — ONLINE FICTIONAL SCHOOL INVESTIGATION
      </footer>
    </div>
  );
}

/* =========================================================================
   4. FIRST-TIME DASHBOARD (Fresh Investigation State)
   ========================================================================= */

function DashboardView({
  user,
  progress,
  onUpdateProgress,
}: {
  user: PrototypeUser;
  progress: UserProgress;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
}) {
  return (
    <InvestigationDashboard
      user={user}
      progress={progress}
      onUpdateProgress={onUpdateProgress}
    />
  );
}

/* =========================================================================
   5. INVESTIGATION VIEW (Case Chronology Bound to User State)
   ========================================================================= */

function InvestigationView({
  user,
  progress,
}: {
  user: PrototypeUser;
  progress: UserProgress;
}) {
  const isStage1Active = progress.activeStage === 1 && progress.stagesCompleted === 0;

  return (
    <>
      <PageHeader
        eyebrow="Archive Chronology / Seven Signals"
        title="The Investigation File"
        description="A sequential record of the case. Stages unlock according to the official event timetable or verified problem solves."
      />

      {/* Active Objective & Immediate Tactical Directive */}
      <div className="panel border-l-4 border-l-crimson bg-[#151413] mb-8 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-crimson animate-pulse" />
              <span className="eyebrow text-crimson">
                CURRENT OBJECTIVE // STAGE 0{progress.activeStage}
              </span>
            </div>
            <h3 className="font-serif text-2xl font-light text-foreground">
              {isStage1Active
                ? 'Breach the Sealed Records Vault & Decrypt Sector 01'
                : `Active Sector Investigation: Stage 0${progress.activeStage}`}
            </h3>
            <p className="font-serif text-sm text-[#c7c1b5] max-w-3xl leading-relaxed">
              {isStage1Active
                ? 'Forensic intake has catalogued four initial records in the repository. Inspect EV-0103 (The Exorcist\'s Letter & Affixed Note) and cross-reference with ARC-002 (Partial Credential Worksheet) to recover the archive directory call-sign and passphrase.'
                : 'Review all recently unlocked evidence dossiers in the Evidence Room and submit decrypted telemetry coordinates.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shrink-0">
            <button
              onClick={() => navigate('/evidence')}
              className="button button-primary flex items-center justify-center gap-2 py-3 px-5 text-xs font-mono tracking-wider shadow-lg"
            >
              <FolderOpen size={15} />
              OPEN EVIDENCE ROOM
            </button>
            {isStage1Active && (
              <button
                onClick={() => navigate('/evidence/EV-0103')}
                className="button button-secondary flex items-center justify-center gap-2 py-3 px-4 text-xs font-mono text-[#dcd6c9]"
                title="Direct link to primary Stage 1 cipher puzzle"
              >
                <FileText size={15} />
                Inspect EV-0103 Directly
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real Game State Indicators */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <div className="panel text-center py-4">
          <span className="eyebrow block mb-1 text-[10px]">CURRENT STAGE</span>
          <span className="font-mono text-3xl text-crimson font-light">
            Stage 0{progress.activeStage}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            {progress.stagesCompleted === 0 ? 'Initial Phase Active' : `${progress.stagesCompleted} Cleared`}
          </p>
        </div>
        <div className="panel text-center py-4">
          <span className="eyebrow block mb-1 text-[10px]">STAGES CLEARED</span>
          <span className="font-mono text-3xl text-foreground font-light">
            0{progress.stagesCompleted} / 07
          </span>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            {progress.stagesCompleted === 7 ? 'Full Case Solved' : 'In Progress'}
          </p>
        </div>
        <div className="panel text-center py-4">
          <span className="eyebrow block mb-1 text-[10px]">ACCESSIBLE RECORDS</span>
          <span className="font-mono text-3xl text-[#8bb393] font-light">
            0{evidence.filter((e) => e.stage <= progress.activeStage).length} Files
          </span>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            In Archive Repository
          </p>
        </div>
        <div className="panel text-center py-4">
          <span className="eyebrow block mb-1 text-[10px]">INVESTIGATOR MERIT</span>
          <span className="font-mono text-3xl text-foreground font-light">
            {progress.score} pts
          </span>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            Official Case Standing
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {stages.map((st) => {
            const displayInfo = getStageDisplayInfo(st.number, progress);
            const isCompleted = displayInfo.isCompleted;
            const isAvailable = displayInfo.isActive;
            const isLocked = !displayInfo.isReleased;
            const state = isCompleted ? 'completed' : isAvailable ? 'available' : 'locked';

            return (
              <div
                key={st.number}
                className={`panel transition-all ${
                  isAvailable
                    ? 'border-crimson bg-[#161514] shadow-[0_0_15px_rgba(158,27,27,0.08)]'
                    : isCompleted
                    ? 'border-[#2d3b2f]'
                    : 'opacity-65 bg-[#0e0e0d]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-2xl text-muted-foreground font-light">
                      {String(st.number).padStart(2, '0')}
                    </span>
                    <div>
                      <h3
                        className={`font-serif text-2xl font-light ${
                          isLocked ? 'text-[#8d8880] italic' : 'text-foreground'
                        }`}
                      >
                        {displayInfo.title}
                      </h3>
                      <p
                        className={`font-mono text-xs uppercase tracking-[0.18em] mt-0.5 ${
                          isLocked ? 'text-[#615e58]' : 'text-muted-foreground'
                        }`}
                      >
                        {displayInfo.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className={`status-pill ${state}`}>
                    {isLocked ? 'SIGNAL LOCKED' : state}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between font-mono text-xs border-t border-line-soft pt-4 text-muted-foreground">
                  <span>Schedule: {st.date}</span>
                  {isAvailable ? (
                    <div className="flex items-center gap-2">
                      <button
                        className="button button-primary py-1.5 px-3 text-[10px] flex items-center gap-1.5"
                        onClick={() => navigate('/evidence')}
                      >
                        <FolderOpen size={12} />
                        Open Evidence Room →
                      </button>
                    </div>
                  ) : (
                    <span>
                      {isCompleted
                        ? '✓ Stage Solved & Cleared'
                        : '🔒 Sealed · Content Encrypted Until Release'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Case Briefing Card */}
        <div className="space-y-6">
          <div className="panel border-t-2 border-t-crimson">
            <div className="panel-heading">
              <span>CONFIDENTIAL BRIEFING</span>
              <FileText size={15} />
            </div>
            <div className="stamp text-crimson border-crimson text-xs mb-4">CASE {CASE_ID}</div>
            <h3 className="font-serif text-2xl font-light mb-3 text-foreground">
              An archive that was never meant to reopen.
            </h3>
            <p className="text-sm font-serif leading-relaxed text-[#c7c1b5]">
              In October 2026, archivist Daniel Mercer discovered anomalies in the historical records.
              Documents were being systematically modified—not destroyed, but re-written. Hours later, an
              anonymous message was received: "You were looking at the wrong person."
            </p>
            <div className="my-4 border-t border-line-soft" />
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              INVESTIGATOR DIRECTIVE:
            </p>
            <ul className="mt-2 space-y-1.5 font-mono text-xs text-muted-foreground list-disc list-inside">
              <li>Analyze evidence in Stage 1 to unlock the password sheet.</li>
              <li>Location challenges offer exactly one irreversible submission.</li>
              <li>All gameplay is online-only.</li>
            </ul>

            <div className="mt-6 pt-4 border-t border-line-soft">
              <button
                onClick={() => navigate('/evidence')}
                className="w-full button button-secondary text-xs flex items-center justify-center gap-2 py-2"
              >
                <FolderOpen size={14} /> Browse Catalogued Evidence
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================================
   6. EVIDENCE ROOM (Photographic Grid Bound to Unlocked State)
   ========================================================================= */

function EvidenceRoomView({ progress }: { progress: UserProgress }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Photograph', 'Physical', 'Document', 'Interview', 'Audio', 'Newspaper'];

  const filtered = useMemo(() => {
    return evidence.filter((item) => {
      const matchQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.id.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());
      const matchCat = filter === 'All' || item.category === filter;
      return matchQuery && matchCat;
    });
  }, [query, filter]);

  return (
    <>
      <PageHeader
        eyebrow="Archival Collection / Presidio Vault"
        title="Evidence Room"
        description="Every recovered document, photograph, and signal cassette is catalogued here. Examine accessible files or inspect sealed dossiers."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-y border-border py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                tacticalAudio.playButtonClick();
                setFilter(cat);
              }}
              className={`font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
                filter === cat
                  ? 'text-foreground underline decoration-crimson decoration-2 underline-offset-8'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reference or clue..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-[#111110] border border-border pl-8 pr-3 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-crimson"
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {filtered.length} / {evidence.length} items
          </span>
        </div>
      </div>

      {/* 4:3 Photographic Card Grid */}
      <div className="evidence-card-grid">
        {filtered.map((item) => {
          // Items with status 'available', unlocked by stage, or accessible via verified stage override
          const itemStage = item.stage ?? 1;
          const isItemUnlocked =
            Boolean(progress.hasStageOverride) ||
            (isStageAccessible(itemStage, progress.stagesCompleted, new Date(), false) &&
              (progress.unlockedEvidenceIds.includes(item.id) || itemStage <= progress.stagesCompleted + 1));

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isItemUnlocked) {
                  tacticalAudio.playDocOpen();
                  navigate(`/evidence/${item.id}`);
                } else {
                  tacticalAudio.playError();
                }
              }}
              className={`evidence-card group ${!isItemUnlocked ? 'locked cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="evidence-media">
                <img
                  src={item.image ?? '/images/hero-scene.png'}
                  alt={item.title}
                />
                <div className="film-grain absolute inset-0" />

                <div className="evidence-overlay-chips">
                  <span className="evidence-chip">{item.id}</span>
                  {item.classification !== 'Internal' && (
                    <span className="evidence-chip restricted">{item.classification}</span>
                  )}
                </div>

                {!isItemUnlocked && (
                  <div className="evidence-locked-overlay">
                    <Lock size={20} className="text-crimson" />
                    <span>LOCKED / STAGE 0{item.stage ?? 2}</span>
                  </div>
                )}
              </div>

              <div className="evidence-body">
                <div className="evidence-topline">
                  <span>{item.kind}</span>
                  <span>{item.date}</span>
                </div>
                <h3 className="evidence-title">
                  {isItemUnlocked ? item.title : <span className="redact">{item.title}</span>}
                </h3>
                <p className="evidence-desc">
                  {isItemUnlocked
                    ? item.summary
                    : 'Classified evidence sealed under chain-of-custody. Complete previous stage requirements to declassify this docket.'}
                </p>

                <div className="evidence-footer">
                  <span>{item.source}</span>
                  {isItemUnlocked ? (
                    <span className="evidence-link-action font-mono text-xs flex items-center gap-1">
                      Inspect Record <ArrowRight size={12} />
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                      <Lock size={11} className="text-crimson" /> Sealed / Stage 0{item.stage ?? 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* =========================================================================
   7. DOCUMENT VIEWER & TERMINAL SOLVE GATEWAY
   ========================================================================= */

const ZOOM_STEPS = [0.6, 0.8, 1.0, 1.25, 1.5, 1.8, 2.0];

function EvidenceViewerView({
  id,
  progress,
  onUpdateProgress,
}: {
  id: string;
  progress: UserProgress;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
}) {
  const item = getEvidence(id);
  const [page, setPage] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(2); // Default 1.0 (100%)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCoordModal, setShowCoordModal] = useState(false);
  const zoom = ZOOM_STEPS[zoomIdx];

  const pageTitles = useMemo(() => {
    if (!item) return ['Document'];
    if (item.id === 'EV-0101') return ['SFPD Scene Report DOC-SFPD-74-091', 'Alleyway Photographic Plate'];
    if (item.id === 'EV-0102') return ['BCI Technical Lab Teardown', 'Hardware Photos'];
    if (item.id === 'EV-0103') return ["The Exorcist's Letter & Affixed Note"];
    if (item.id === 'ARC-002') return ['Partial Credential Worksheet'];
    if (item.id === 'EV-0201') return [
      'Plate 1: Lake Herman Rd (#74-17)',
      'Plate 2: Blue Rock Springs (#69-0715)',
      'Plate 3: Lake Berryessa (#1026-69)',
      'Plate 4: Presidio Heights (#1127-69)',
    ];
    if (item.id === 'CAS-017') return ['Verbatim Stenographic Witness Transcript'];
    if (item.id === 'EV-0301') return ['Signal Corps Survey DOC-SURV-74-33', 'Microwave Mast Photo'];
    if (item.id === 'EV-0501') return ['Chronicle Front Page'];
    if (item.id === 'EV-0502') return ['DOJ Dossier: Arthur Leigh Allen'];
    if (item.id === 'EV-0503') return ['Intelligence Dossier: Richard Gaikowski'];
    if (item.id === 'EV-0601') return ['Incident Report 06-B', 'The Torn Note (E.V.)', 'ARCHIVE_ACCESS.txt'];
    if (item.id === 'EV-0602') return ['Archival Revision Log Comparison', 'Unsent Teletype Fragment'];
    if (item.id === 'EV-0701') return ["Ellen Vale's Research Journal", 'FINAL_REVIEW.mp4 Reel'];
    if (item.id === 'EV-0702') return ['Chronicle Late Edition', 'Station Incident Report'];
    if (item.category === 'Audio') return ['Audio Cassette Deck', 'Signal Waveform Analysis'];
    if (item.category === 'Newspaper') return ['Chronicle Front Page', 'Archival Metadata'];
    return ['Incident Report', 'Photo Attachment', 'Witness Continuation'];
  }, [item?.id, item?.category]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return;
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (e.key === 'ArrowRight') setPage((p) => Math.min(pageTitles.length - 1, p + 1));
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1));
      if (e.key === '+' || e.key === '=') setZoomIdx((z) => Math.min(ZOOM_STEPS.length - 1, z + 1));
      if (e.key === '-') setZoomIdx((z) => Math.max(0, z - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageTitles.length, isFullscreen]);

  const isStage1Cleared = progress.stagesCompleted >= 1 || progress.activeStage >= 2;
  const isStage2Cleared = progress.stage2DeductionSolved || progress.stagesCompleted >= 2;

  // Unknown ID - 404 Not Found State
  if (!item) {
    return (
      <div className="space-y-6 my-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/evidence')}
            className="text-button hover:text-foreground flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Return to Evidence Room
          </button>
          <span className="font-mono text-xs text-crimson border border-crimson/50 px-2.5 py-1 bg-red-950/40">
            DOCKET EXPUNGED
          </span>
        </div>

        <div className="panel border-2 border-dashed border-[#5c2420] bg-[#140b0b] p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 my-8 shadow-2xl">
          <div className="size-16 rounded-full bg-red-950/60 border border-crimson flex items-center justify-center mx-auto text-crimson">
            <ShieldAlert size={32} />
          </div>
          <div>
            <span className="stamp text-crimson border-crimson text-xs mb-2">ERROR 404 // DOCKET MISSING</span>
            <h2 className="font-serif text-3xl font-light text-foreground mt-2">Classified Record Not Found</h2>
            <p className="font-mono text-xs text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
              No evidence record, surveillance negative, or transmission transcript exists under reference code{' '}
              <strong className="text-crimson font-bold">"{id}"</strong>. This docket may have been expunged from the county archives or catalogued under an unverified index.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-line-soft">
            <button className="button button-primary text-xs font-mono" onClick={() => navigate('/evidence')}>
              <FolderOpen size={14} /> Return to Evidence Room
            </button>
            <button className="button button-secondary text-xs font-mono" onClick={() => navigate('/dashboard')}>
              <LayoutDashboard size={14} /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Locked Evidence State - Protect contents from leaking
  const itemStage = item.stage ?? 1;
  const isItemUnlocked =
    Boolean(progress.hasStageOverride) ||
    (isStageAccessible(itemStage, progress.stagesCompleted, new Date(), false) &&
      (progress.unlockedEvidenceIds.includes(item.id) || itemStage <= progress.stagesCompleted + 1));

  if (!isItemUnlocked) {
    const directive = getInvestigatorDirective(progress);
    return (
      <div className="space-y-6 my-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/evidence')}
            className="text-button hover:text-foreground flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Return to Evidence Room
          </button>
          <span className="font-mono text-xs text-crimson border border-crimson/50 px-2.5 py-1 bg-red-950/40">
            SECURITY RESTRICTION ACTIVE
          </span>
        </div>

        <div className="panel border-2 border-crimson bg-[#140b0b] p-8 md:p-12 max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 pointer-events-none opacity-10">
            <Lock size={220} className="text-crimson" />
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="size-16 rounded-none bg-red-950/80 border border-crimson flex items-center justify-center shrink-0 text-crimson">
              <Lock size={32} />
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="stamp text-crimson border-crimson text-[11px]">SEALED DOSSIER</span>
                <span className="font-mono text-xs text-muted-foreground">REFERENCE: {item.id}</span>
                <span className="status-pill locked text-[10px]">LOCKED</span>
              </div>
              <h2 className="font-serif text-3xl font-light text-foreground">
                Classified Evidence Restricted
              </h2>
              <p className="font-mono text-xs text-[#dcd6c9] leading-relaxed">
                Item <strong className="text-crimson">{item.id}</strong> is sealed under archival protocol and scheduled for release in{' '}
                <strong className="text-foreground">Stage 0{item.stage ?? 2}</strong>. Contents are strictly occluded until preceding case requirements are solved.
              </p>

              <div className="p-4 bg-[#0d0909] border border-[#3d1919] font-mono text-xs space-y-2 text-muted-foreground">
                <div className="flex justify-between border-b border-[#2d1414] pb-1.5">
                  <span>ITEM CLASSIFICATION:</span>
                  <span className="text-crimson font-medium">{item.classification}</span>
                </div>
                <div className="flex justify-between border-b border-[#2d1414] pb-1.5">
                  <span>REQUIRED CLEARANCE:</span>
                  <span className="text-foreground font-semibold">Stage 0{item.stage ?? 2} Investigation Solved</span>
                </div>
                <div className="flex justify-between">
                  <span>YOUR CURRENT CLEARANCE:</span>
                  <span className="text-amber-400 font-semibold">
                    Stage 0{progress.activeStage} ({progress.stagesCompleted} of 7 Stages Cleared)
                  </span>
                </div>
              </div>

              <p className="font-serif text-sm text-muted-foreground leading-relaxed italic border-l-2 border-crimson pl-3">
                "Access to case dockets is gated by forensic chain-of-custody. Complete the active investigation directives in Stage 0{progress.activeStage} to declassify subsequent evidence."
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-line-soft">
                <button
                  className="button button-primary text-xs font-mono font-bold"
                  onClick={() => {
                    tacticalAudio.playButtonClick();
                    navigate(directive.targetRoute);
                  }}
                >
                  Continue Current Stage (Stage 0{progress.activeStage}) →
                </button>
                <button
                  className="button button-secondary text-xs font-mono"
                  onClick={() => navigate('/evidence')}
                >
                  <FolderOpen size={13} /> Browse Available Evidence
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/evidence')}
          className="text-button hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Return to Evidence Room
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground uppercase">
            EVIDENCE DOSSIER // {item.id}
          </span>
        </div>
      </div>

      <div className={`viewer-layout ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0c0c0b] p-3 sm:p-6 flex flex-col overflow-hidden shadow-2xl' : ''}`}>
        {/* Left Table of Contents */}
        <aside className="viewer-contents hidden lg:block">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground mb-4">
            Document Sheets
          </p>
          <ol className="space-y-3">
            {pageTitles.map((title, i) => (
              <li key={title}>
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playDocOpen();
                    setPage(i);
                  }}
                  className={`w-full flex items-center gap-3 p-2 text-left border transition-all ${
                    page === i
                      ? 'border-crimson bg-[#1b1918]'
                      : 'border-border bg-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="w-10 h-14 bg-[#e9e2d2] border border-black/30 shrink-0 shadow-sm flex items-center justify-center font-mono text-[9px] text-ink/70">
                    0{i + 1}
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-muted-foreground">
                      Sheet 0{i + 1}
                    </span>
                    <span className="block font-serif text-sm text-foreground">{title}</span>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* Center Viewer Surface */}
        <section className="viewer-center">
          <div className="viewer-toolbar">
            <div className="flex items-center gap-2">
              <button
                className="icon-button bordered"
                onClick={() => {
                  tacticalAudio.playDocOpen();
                  setPage((p) => Math.max(0, p - 1));
                }}
                disabled={page === 0}
                aria-label="Previous sheet"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-xs px-2">
                Sheet {page + 1} of {pageTitles.length}
              </span>
              <button
                className="icon-button bordered"
                onClick={() => {
                  tacticalAudio.playDocOpen();
                  setPage((p) => Math.min(pageTitles.length - 1, p + 1));
                }}
                disabled={page === pageTitles.length - 1}
                aria-label="Next sheet"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground hidden sm:inline">
                {item.id} · {pageTitles[page] ?? 'Document'}
              </span>
              {isFullscreen && (
                <span className="font-mono text-[10px] text-crimson font-bold uppercase tracking-wider px-2 py-0.5 border border-crimson/50 bg-red-950/40">
                  FULLSCREEN (ESC TO EXIT)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                className="icon-button bordered"
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  setZoomIdx((z) => Math.max(0, z - 1));
                }}
                disabled={zoomIdx === 0}
                title="Zoom out (-)"
                aria-label="Zoom out"
              >
                <Minus size={15} />
              </button>
              <span className="font-mono text-xs w-11 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                className="icon-button bordered"
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  setZoomIdx((z) => Math.min(ZOOM_STEPS.length - 1, z + 1));
                }}
                disabled={zoomIdx === ZOOM_STEPS.length - 1}
                title="Zoom in (+)"
                aria-label="Zoom in"
              >
                <Plus size={15} />
              </button>
              <button
                className="icon-button bordered"
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  setZoomIdx(2); // 1.0 = 100%
                }}
                title="Fit to view (100%)"
                aria-label="Fit to view"
              >
                <RotateCcw size={13} />
              </button>
              <button
                className={`icon-button bordered ${isFullscreen ? 'text-crimson border-crimson' : ''}`}
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  setIsFullscreen(!isFullscreen);
                }}
                title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen'}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>

          <div className="viewer-scroll-area">
            <div style={{ width: `${Math.min(760 * zoom, 1000)}px`, transition: 'width 0.2s ease' }}>
              {item.id === 'EV-0101' ? (
                page === 0 ? <SceneOverviewDoc item={item} /> : <AttachmentSheet item={item} />
              ) : item.id === 'EV-0102' ? (
                page === 0 ? <RadioReceiverDoc item={item} /> : <AttachmentSheet item={item} />
              ) : item.id === 'EV-0103' ? (
                <CorrespondenceSheet item={item} />
              ) : item.id === 'ARC-002' ? (
                <CredentialWorksheetSheet item={item} />
              ) : item.id.startsWith('EV-02') ? (
                <ForensicNegativeDoc
                  item={item}
                  activePlateIndex={page}
                  onPlateChange={(idx) => setPage(idx)}
                />
              ) : item.id === 'CAS-017' ? (
                <WitnessTranscriptDoc item={item} />
              ) : item.id === 'EV-0301' ? (
                page === 0 ? <TransmissionMastDoc item={item} /> : <AttachmentSheet item={item} />
              ) : item.id === 'EV-0502' ? (
                <SuspectDossierAllenDoc item={item} />
              ) : item.id === 'EV-0503' ? (
                <SuspectDossierGaikowskiDoc item={item} />
              ) : item.id === 'EV-0601' || item.id === 'EV-0602' ? (
                <RecordRememberedTomorrowDoc
                  item={item}
                  progress={progress}
                  onUpdateProgress={onUpdateProgress}
                  onAdvanceToStage7={() => navigate('/evidence/EV-0701')}
                />
              ) : item.id === 'EV-0701' ? (
                page === 0 ? (
                  <div className="space-y-8">
                    <EllenValeJournalDoc item={item} />
                    <VideoAttachmentViewer
                      progress={progress}
                      onUpdateProgress={onUpdateProgress!}
                      onAdvanceToStage7={() => navigate('/debrief')}
                    />
                  </div>
                ) : (
                  <VideoAttachmentViewer
                    progress={progress}
                    onUpdateProgress={onUpdateProgress!}
                    onAdvanceToStage7={() => navigate('/debrief')}
                  />
                )
              ) : item.id === 'EV-0702' ? (
                <StationIncidentReportDoc item={item} page={page} />
              ) : item.category === 'Audio' ? (
                <AudioPlayerSheet item={item} />
              ) : item.category === 'Newspaper' ? (
                <NewspaperSheet item={item} />
              ) : (
                <div className="space-y-6">
                  {page === 0 && <ReportSheet item={item} />}
                  {page === 1 && <AttachmentSheet item={item} />}
                  {page === 2 && <ContinuationSheet item={item} />}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Metadata & Field Notes */}
        <aside className="viewer-aside space-y-6">
          <div className="panel border-t-2 border-t-crimson">
            <div className="panel-heading">
              <span>CHAIN OF CUSTODY</span>
              <Archive size={14} />
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-muted-foreground">REFERENCE:</span>
                <span className="text-foreground font-semibold">{item.id}</span>
              </div>
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-muted-foreground">TYPE:</span>
                <span className="text-foreground">{item.kind}</span>
              </div>
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-muted-foreground">DATE LOGGED:</span>
                <span className="text-foreground">{item.date}</span>
              </div>
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-muted-foreground">CLASSIFICATION:</span>
                <span className="text-crimson font-medium">{item.classification}</span>
              </div>
              <div className="flex justify-between border-b border-line-soft pb-2">
                <span className="text-muted-foreground">STAGE UNLOCK:</span>
                <span className="text-foreground">Stage 0{item.stage ?? 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">INTEGRITY:</span>
                <span className="text-[#8bb393]">Seals Intact</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Coordinate Deduction Modal for Stage 2 */}
      {showCoordModal && (
        <CoordinateDeductionModal
          isOpen={showCoordModal}
          onClose={() => setShowCoordModal(false)}
          progress={progress}
          onUpdateProgress={onUpdateProgress}
        />
      )}

      {/* Teletype Terminal Modal */}
      {showTerminal && (
        <TeletypeTerminalModal
          isOpen={showTerminal}
          onClose={() => setShowTerminal(false)}
          progress={progress}
          onUpdateProgress={onUpdateProgress}
        />
      )}
    </>
  );
}

/* =========================================================================
   TELETYPE TERMINAL MODAL (Stage 1 Interactive Solve)
   ========================================================================= */

function TeletypeTerminalModal({
  isOpen,
  onClose,
  progress,
  onUpdateProgress,
}: {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
}) {
  const isCleared = progress.stagesCompleted >= 1 || progress.activeStage >= 2;
  const [directoryInput, setDirectoryInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'TELETYPE DOCKET DISPATCH V4.8 — ESTABLISHED 1974 / CASE 17',
    'LOCAL PORT: /dev/tty01-archive-vault-b',
    'STATUS: SECTOR 01 ENCRYPTED // RECOVERED CREDENTIALS REQUIRED',
    'Enter the credentials recovered from the evidence.',
  ]);
  const [solveState, setSolveState] = useState<'idle' | 'success' | 'failure'>(
    isCleared ? 'success' : 'idle'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setTerminalOutput((prev) => [
      ...prev,
      `> SUBMIT AUTH: [DIR: ${directoryInput.trim()}] [KEY: ******]`,
      '> VALIDATING SHA-256 SECTOR PARITY...',
    ]);

    setTimeout(() => {
      // Normalize inputs: remove whitespace, hyphens, and make lowercase
      const cleanDir = directoryInput.trim().toLowerCase().replace(/[\s_-]+/g, '');
      const cleanKey = passwordInput.trim().toLowerCase().replace(/[\s_-]+/g, '');

      // Accepted directory formats: zkcase, zcase, zk
      const isDirValid = cleanDir === 'zkcase' || cleanDir === 'zk' || cleanDir === 'zcase';
      // Accepted password formats: case17, 17
      const isKeyValid = cleanKey === 'case17' || cleanKey === '17';

      if (isDirValid && isKeyValid) {
        // Genuine success validation only
        tacticalAudio.playSuccess();
        setSolveState('success');
        setTerminalOutput((prev) => [
          ...prev,
          '[AUTH CONFIRMED] // CHECKSUM 0x9AF4 PASSED',
          '> DIRECTORY RESOLVED & VERIFIED [ARCHIVAL B]',
          '> MASTER KEY ACCEPTED',
          '-------------------------------------------------------',
          '[CLEARANCE GRANTED] STAGE 01 CLEARED // STAGE 02 UNLOCKED',
          '> NEW FILE ACCESSIBLE: EV-0201 (Records Room — Lower Level)',
          'TELETYPE SESSION ACTIVE. READY FOR STAGE 02 INVESTIGATION.',
        ]);

        if (onUpdateProgress) {
          const nowIso = new Date().toISOString();
          const scoreBreakdown = calculateStageScore(1, nowIso);

          setTerminalOutput((prev) => [
            ...prev,
            `> AWARDED: +${scoreBreakdown.totalScore} MERIT POINTS`,
            scoreBreakdown.scoringEligible
              ? `(100 Base + ${scoreBreakdown.hourlyBonus} Hourly Speed Bonus)`
              : '(Late solve: 0 competitive points awarded)',
          ]);

          onUpdateProgress((prev) => {
            const nextActive = Math.max(prev.activeStage, 2);
            const nextCompleted = Math.max(prev.stagesCompleted, 1);
            const nextUnlocked = Array.from(new Set([...prev.unlockedEvidenceIds, 'EV-0201']));
            const nextScores = {
              ...prev.stageScores,
              1: scoreBreakdown.totalScore,
            };
            const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

            return {
              ...prev,
              activeStage: nextActive,
              stagesCompleted: nextCompleted,
              unlockedEvidenceIds: nextUnlocked,
              stageScores: nextScores,
              stageSolveTimestamps: {
                ...prev.stageSolveTimestamps,
                1: nowIso,
              },
              stageScoringEligible: {
                ...prev.stageScoringEligible,
                1: scoreBreakdown.scoringEligible,
              },
              score: totalScore,
              tasksCompleted: prev.tasksCompleted + 1,
              status: 'IN PROGRESS',
            };
          });
        }
      } else {
        // Genuine rejected submission: play subtle error tone, NEVER leak plaintext solution
        tacticalAudio.playError();
        setSolveState('failure');
        setTerminalOutput((prev) => [
          ...prev,
          '[ACCESS DENIED] // 403 REJECTED: CHECKSUM MISMATCH',
          'ERROR: Credentials do not match the archival registry.',
          'Inspect the six-line memorandum note affixed to EV-0103 to recover the required sequence.',
          'Remember: Read the vertical margin boundaries sequentially.',
        ]);
      }
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#070b08] border-2 border-[#1b3b22] text-[#4af66f] font-mono text-xs max-w-2xl w-full p-6 rounded-none shadow-[0_0_30px_rgba(20,80,30,0.4)] flex flex-col max-h-[90vh]">
        {/* CRT scanline glow effect */}
        <div className="flex items-center justify-between border-b border-[#1b3b22] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold tracking-widest text-[#7dfba0]">
              RECORDS VAULT TERMINAL — TELETYPE PORT 17-B
            </span>
          </div>
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              onClose();
            }}
            className="text-[#4af66f]/60 hover:text-[#4af66f] p-1"
            aria-label="Exit terminal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Terminal Screen Output */}
        <div className="bg-[#040705] border border-[#142d1a] p-4 h-64 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed shadow-inner">
          {terminalOutput.map((line, idx) => (
            <div
              key={idx}
              className={`${
                line.includes('[CLEARANCE GRANTED]') || line.includes('[AUTH CONFIRMED]')
                  ? 'text-[#a2ffb8] font-bold'
                  : line.includes('[ACCESS DENIED]') || line.includes('ERROR')
                  ? 'text-[#ff6b6b]'
                  : 'text-[#4af66f]/90'
              }`}
            >
              {line}
            </div>
          ))}
          {isProcessing && (
            <div className="text-emerald-400 animate-pulse">&gt; VERIFYING TELETYPE CODES...</div>
          )}
        </div>

        {/* Form Inputs (Neutralized Placeholders — Zero Solution Leaks) */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 pt-3 border-t border-[#1b3b22]">
          <p className="text-[11px] text-[#7dfba0]/80">
            Enter the credentials recovered from the evidence.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#7dfba0] mb-1">
                ARCHIVE DIRECTORY / CALL-SIGN:
              </label>
              <input
                type="text"
                value={directoryInput}
                onChange={(e) => setDirectoryInput(e.target.value)}
                onKeyDown={() => tacticalAudio.playKeypress()}
                placeholder="Enter archive call-sign..."
                className="w-full bg-[#030604] border border-[#1e4827] text-[#7dfba0] p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono"
                disabled={isProcessing}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#7dfba0] mb-1">
                PASSPHRASE / DECRYPTION KEY:
              </label>
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={() => tacticalAudio.playKeypress()}
                placeholder="Enter decryption key..."
                className="w-full bg-[#030604] border border-[#1e4827] text-[#7dfba0] p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] text-[#4af66f]/60">
              {solveState === 'success'
                ? 'STATUS: CLEARED (Stage 02 Evidence EV-0201 Unlocked)'
                : 'STATUS: PENDING DECRYPTION'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-[#1e4827] text-[#4af66f]/70 hover:text-[#4af66f] text-xs font-mono"
              >
                Exit Terminal
              </button>
              <button
                type="submit"
                disabled={isProcessing || !directoryInput.trim() || !passwordInput.trim()}
                className="px-4 py-1.5 bg-[#1b3b22] hover:bg-[#23502d] text-[#e3f7e6] border border-[#3e784c] text-xs font-mono font-bold transition-all disabled:opacity-40"
              >
                {isProcessing ? 'Verifying...' : 'Transmit Credentials'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   AUTHENTIC DOCUMENT SHEETS (SANITIZED — ZERO ANSWER LEAKS)
   ========================================================================= */

function CredentialWorksheetSheet({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-14 relative text-ink font-mono text-xs">
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink/75 font-semibold">
            DEPARTMENT OF INVESTIGATION — ARCHIVAL ANNEX
          </p>
          <h2 className="font-serif text-2xl font-semibold text-ink mt-1">System Credential Worksheet</h2>
        </div>
        <span className="stamp text-crimson border-crimson text-xs">OCCLUDED FILE</span>
      </div>

      <div className="my-6 space-y-4 leading-relaxed">
        <p className="font-bold">ITEM REF: {item.id} — RECOVERED FROM RECORDS ANNEX DESK</p>
        <p className="text-ink/80">
          The following reference worksheet catalogued system access parameters before being defaced
          with permanent carbon ink. Multiple credential rows have been occluded.
        </p>

        <div className="border border-ink/40 divide-y divide-ink/30 my-4 bg-white/30 text-[11px]">
          <div className="p-3 flex justify-between items-center bg-black/5 font-semibold">
            <span>TERMINAL / DIRECTORY TARGET</span>
            <span>CLEARANCE KEY STATUS</span>
          </div>

          <div className="p-3 flex justify-between items-center">
            <span>VAULT SECTOR 01 (HISTORIC 1974)</span>
            <span className="font-mono text-ink/70">
              AFFIXED TO CORRESPONDENCE MEMO <span className="text-crimson">[SEE EV-0103]</span>
            </span>
          </div>

          <div className="p-3 flex justify-between items-center">
            <span>COUNTY RECORDS LOWER LEVEL (BAY 17)</span>
            <span className="bg-ink text-ink select-none px-4 py-0.5">REDACTED_ENTRY</span>
          </div>

          <div className="p-3 flex justify-between items-center">
            <span>PRESIDIO SURVEY QUADRANT LOG</span>
            <span className="bg-ink text-ink select-none px-6 py-0.5">REDACTED_ENTRY</span>
          </div>

          <div className="p-3 flex justify-between items-center">
            <span>SUSPECT DATABASE MASTER KEY</span>
            <span className="bg-ink text-ink select-none px-5 py-0.5">REDACTED_ENTRY</span>
          </div>
        </div>

        <div className="p-3 bg-black/5 border-l-2 border-ink/40 text-[11px]">
          <strong>ARCHIVIST NOTE:</strong> Forensic luminescence reveals that entries were masked by an
          insider with access to the records room. Further clearance keys must be derived directly from
          field artifacts.
        </div>
      </div>

      <div className="mt-8 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/70 uppercase">
        <span>WORKSHEET FORM SF-94</span>
        <span>PAGE 01 OF 01</span>
      </div>
    </div>
  );
}

function ReportSheet({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-10 md:p-14 relative font-['IBM_Plex_Mono'] text-ink">
      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink/75 font-semibold">
            DEPARTMENT OF INVESTIGATION — RECORDS DIVISION
          </p>
          <h2 className="font-serif text-3xl font-semibold text-ink mt-1">Incident Report</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-ink/70">CASE NO.</p>
          <p className="text-xl font-bold tracking-widest text-ink">{CASE_ID}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 my-6 text-xs border-b border-ink/40 pb-6">
        <div>
          <span className="text-[10px] text-ink/60 uppercase block">Date Logged</span>
          <strong className="text-sm font-semibold">{item.date}</strong>
        </div>
        <div>
          <span className="text-[10px] text-ink/60 uppercase block">Item Reference</span>
          <strong className="text-sm font-semibold">{item.id}</strong>
        </div>
        <div>
          <span className="text-[10px] text-ink/60 uppercase block">Classification</span>
          <strong className="text-sm font-semibold text-crimson">{item.classification}</strong>
        </div>
        <div className="col-span-3">
          <span className="text-[10px] text-ink/60 uppercase block">Location of Recovery</span>
          <strong className="text-sm">{item.source}</strong>
        </div>
      </div>

      <div className="space-y-4 text-xs leading-relaxed font-mono">
        <p className="text-[11px] uppercase tracking-wider text-ink/70 font-semibold">
          OFFICIAL NARRATIVE / RECORD OF EXAMINATION
        </p>
        <p>
          At approximately <span className="redact">23:45 hours</span>, the item designated {item.id} was
          entered into the repository. Inspection revealed structural markings consistent with the historical
          sequence documented under Case 17.
        </p>
        <p>"{item.summary}"</p>
        <p>
          A colleague reported that someone was changing records—not destroying them, but{' '}
          <span className="redact">changing their meaning</span>. The sequence discovered within the
          archived records appears to have been inserted into otherwise ordinary text.
        </p>
      </div>

      <div className="mt-8 pt-4 border-t border-ink/30 relative">
        <p className="font-['Caveat'] text-2xl text-[#1e3a8a] rotate-[-2deg]">
          verify against archive log · cross-reference Presidio coordinates
        </p>
      </div>

      <div className="mt-12 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/70 uppercase">
        <span>FORM PD-114 / REV. 00</span>
        <span>PAGE 01 OF 03</span>
      </div>
    </div>
  );
}

function AttachmentSheet({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-10 md:p-14 relative text-ink">
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/75 font-semibold">
            DEPARTMENT OF INVESTIGATION — EVIDENCE PHOTOGRAPHY
          </p>
          <h2 className="font-serif text-2xl font-semibold text-ink mt-1">Photo Attachment</h2>
        </div>
        <span className="stamp text-crimson border-crimson text-xs">VERIFIED</span>
      </div>

      <div className="my-6 border border-ink/40 p-4 bg-white/40 shadow-inner">
        <div className="aspect-[4/3] w-full overflow-hidden bg-black/10 relative">
          <img
            src={item.image ?? '/images/hero-scene.png'}
            alt="Photographic evidence attachment"
            className="w-full h-full object-cover saturate-[0.8]"
          />
        </div>
        <p className="font-mono text-[11px] text-ink/80 mt-3">
          ATTACHMENT A — Forensic photograph of artifact {item.id}. Preserved under chain-of-custody protocols.
        </p>
      </div>

      <div className="mt-6 pt-3 border-t border-ink/40 flex justify-between font-mono text-[10px] text-ink/70 uppercase">
        <span>ATTACHMENT FORM 2A</span>
        <span>PAGE 02 OF 03</span>
      </div>
    </div>
  );
}

function ContinuationSheet({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-10 md:p-14 relative text-ink font-mono text-xs">
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink/75 font-semibold">
            CONTINUATION SHEET / TESTIMONY LOG
          </p>
          <h2 className="font-serif text-2xl font-semibold text-ink mt-1">Witness Transcript</h2>
        </div>
        <span className="text-xs font-bold text-ink">CASE NO. {CASE_ID}</span>
      </div>

      <div className="my-6 space-y-4 leading-relaxed">
        <p className="font-bold">CASE FILE 017 — WITNESS TESTIMONY (PRESIDIO HEIGHTS, SAN FRANCISCO):</p>
        <p>
          <strong>DETECTIVE:</strong> Tell us what you remember from that night.
        </p>
        <p>
          <strong>WITNESS:</strong> Not much, I'm afraid. It was late. I remember being inside the house
          when something outside caught my attention. A sound, perhaps. A door closing. Something that made
          me look toward the window.
        </p>
        <p>
          <strong>DETECTIVE:</strong> Did you see anyone?
        </p>
        <p>
          <strong>WITNESS:</strong> No. It was too dark. I could make out shapes along the street.
        </p>
        <div className="p-3 bg-black/5 border-l-2 border-crimson text-[11px]">
          <strong>INVESTIGATOR ANNOTATION:</strong> Witness resides at the house number derived from the
          Stage 02 camera telemetry coordinate cipher. Cross-reference the decrypted numeric address with
          cartographic dispatch records.
        </div>
      </div>

      <div className="mt-12 pt-3 border-t border-ink/40 flex justify-between text-[10px] text-ink/70 uppercase">
        <span>CONTINUATION SHEET PD-114-C</span>
        <span>PAGE 03 OF 03</span>
      </div>
    </div>
  );
}

function AudioPlayerSheet({ item }: { item: EvidenceItem }) {
  const [audioState, setAudioState] = useState<SignalAudioState>(() => signalAudio.getState());

  useEffect(() => {
    return signalAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  // Guarantee clean stop when unmounting or leaving this evidence viewer
  useEffect(() => {
    return () => {
      signalAudio.cleanup();
    };
  }, []);

  const totalDuration = Math.round(audioState.duration) || 59;
  const currentSec = Math.floor(audioState.currentTime);
  const progressRatio = totalDuration > 0 ? audioState.currentTime / totalDuration : 0;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = async () => {
    tacticalAudio.playButtonClick();
    await signalAudio.togglePlayPause('document_viewer');
  };

  const handleToggleMute = () => {
    tacticalAudio.playButtonClick();
    signalAudio.toggleMute();
  };

  const handleSpeedCycle = () => {
    tacticalAudio.playButtonClick();
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(audioState.playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length] ?? 1;
    signalAudio.setPlaybackRate(nextSpeed);
  };

  const handleSeek = (seconds: number) => {
    signalAudio.seek(seconds);
  };

  const handleRestart = () => {
    tacticalAudio.playButtonClick();
    signalAudio.seek(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    signalAudio.setVolume(vol);
  };

  return (
    <div className="paper-sheet p-8 md:p-12 relative text-ink font-mono">
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink/75 font-semibold">
            AUTHENTIC AUDIO EVIDENCE CASSETTE // 59 SECONDS
          </p>
          <h2 className="font-serif text-2xl font-semibold text-ink mt-1">{item.title}</h2>
        </div>
        <span className="stamp text-crimson border-crimson text-xs">RESTRICTED AUDIO</span>
      </div>

      <div className="my-6 p-6 bg-[#161514] text-[#ebe6dc] border border-ink/40 shadow-inner">
        <div className="flex items-center justify-between text-xs font-mono text-[#8d8880] mb-3">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${audioState.isPlaying ? 'bg-crimson animate-ping' : 'bg-[#4a4844]'}`} />
            <span className="text-[#ebe6dc] font-semibold">CHANNEL A: DISPATCH INTERCEPT</span>
            <span className="text-[10px] text-muted-foreground uppercase hidden sm:inline">
              ({currentSec <= 30 ? 'MONOLOGUE' : 'CARRIER ANOMALY'})
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-crimson font-bold">{formatTime(currentSec)}</span>
            <span className="text-[#6d6860]">/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Interactive Scrub / Waveform Display */}
        <div 
          className="relative h-20 bg-[#0a0a09] p-3 border border-[#2a2927] cursor-pointer group flex items-end gap-1 select-none overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const fraction = Math.max(0, Math.min(1, clickX / rect.width));
            handleSeek(fraction * totalDuration);
          }}
          title="Click to seek along timeline"
        >
          {Array.from({ length: 44 }).map((_, i) => {
            const barFraction = i / 44;
            const isPassed = barFraction <= progressRatio;
            const baseAmp = i < 22 ? 35 + ((i * 17) % 55) : 20 + ((i * 23) % 40);
            const dynamicAmp = audioState.isPlaying
              ? Math.max(15, Math.min(100, baseAmp + Math.sin(i * 0.8 + currentSec * 4) * 25))
              : baseAmp;

            return (
              <span
                key={i}
                className={`flex-1 rounded-xs transition-all duration-100 ${
                  isPassed
                    ? 'bg-crimson group-hover:bg-[#e03838]'
                    : 'bg-[#2e2d2b] group-hover:bg-[#3d3b37]'
                }`}
                style={{ height: `${dynamicAmp}%` }}
              />
            );
          })}
          {/* Progress Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_white] pointer-events-none transition-all duration-75"
            style={{ left: `${progressRatio * 100}%` }}
          />
        </div>

        {/* Native range slider scrubber for precise accessibility */}
        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.1}
            value={audioState.currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full accent-crimson cursor-pointer h-1.5 bg-[#252422] rounded-none"
            aria-label="Audio scrubber"
          />
        </div>

        {/* Master Audio Deck Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#2a2927]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              className="size-9 bg-crimson text-white grid place-items-center rounded-sm hover:bg-[#b52222] transition-colors shadow-sm"
              aria-label={audioState.isPlaying ? 'Pause transmission' : 'Play transmission'}
              title={audioState.isPlaying ? 'Pause' : 'Play'}
            >
              {audioState.isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            </button>

            <button
              onClick={handleRestart}
              className="size-9 border border-[#2a2927] text-[#ebe6dc] grid place-items-center rounded-sm hover:border-[#44423e] hover:bg-white/5 transition-colors"
              aria-label="Restart transmission from beginning"
              title="Restart from 00:00"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={handleToggleMute}
              className={`size-9 border grid place-items-center rounded-sm transition-colors ${
                audioState.isMuted
                  ? 'border-crimson text-crimson bg-crimson/10'
                  : 'border-[#2a2927] text-[#ebe6dc] hover:border-[#44423e]'
              }`}
              aria-label={audioState.isMuted ? 'Unmute' : 'Mute'}
              title={audioState.isMuted ? 'Unmute' : 'Mute'}
            >
              {audioState.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            {/* Volume Slider */}
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-[#0f0e0d] border border-[#2a2927]">
              <span className="text-[10px] text-[#8d8880] uppercase">VOL</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioState.isMuted ? 0 : audioState.volume}
                onChange={handleVolumeChange}
                className="w-16 accent-crimson h-1 bg-[#252422]"
                aria-label="Volume level"
              />
              <span className="text-[10px] font-mono text-[#ebe6dc] w-7 text-right">
                {audioState.isMuted ? '0%' : `${Math.round(audioState.volume * 100)}%`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                tacticalAudio.playButtonClick();
                signalAudio.toggleLoop();
              }}
              className={`border px-2.5 py-1 text-xs font-mono rounded-sm transition-colors ${
                audioState.isLooping
                  ? 'border-crimson text-crimson bg-crimson/10 font-bold'
                  : 'border-[#2a2927] text-[#8d8880] hover:text-[#ebe6dc] hover:border-[#44423e]'
              }`}
              title="Toggle continuous tape looping"
            >
              LOOP {audioState.isLooping ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={handleSpeedCycle}
              className="border border-[#2a2927] px-3 py-1 text-xs text-[#ebe6dc] rounded-sm hover:border-[#44423e] hover:bg-white/5 font-mono"
              title="Cycle playback speed"
            >
              {audioState.playbackRate}× SPEED
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-xs leading-relaxed border-t border-ink/30 pt-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-[11px] uppercase tracking-wider text-ink">
            TRANSCRIPTION SUMMARY (SECONDS 00:00 – 00:30):
          </p>
          <span className="font-mono text-[10px] text-ink/60 uppercase">
            {currentSec <= 30 ? 'VOICE CHANNEL ACTIVE' : 'CARRIER PULSE PHASE'}
          </span>
        </div>
        <blockquote className={`italic border-l-2 ${currentSec <= 30 && audioState.isPlaying ? 'border-crimson bg-crimson/5 font-semibold' : 'border-ink/40'} pl-3 text-ink/90 font-serif text-sm transition-colors py-1`}>
          "Four locations. One has been chosen. Three are irrelevant. You have twenty-four hours to tell me
          which one... Choose carefully. One wrong answer. One more name on your list. Tick-tock, detectives."
        </blockquote>
        <div className={`p-3 border text-[11px] mt-4 transition-colors ${currentSec > 30 && audioState.isPlaying ? 'bg-crimson/10 border-crimson' : 'bg-black/5 border-ink/20'}`}>
          <strong className="text-crimson block mb-1">UNEXPLAINED DURATION (SECONDS 00:30 – 00:59):</strong>
          Speech terminates at 30 seconds. The remaining duration contains low-frequency carrier
          pulses, magnetic tape degradation, and rhythmic frequency bursts under acoustic filtering. Cross-reference with Signal Map telemetry.
        </div>
      </div>
    </div>
  );
}

function NewspaperSheet({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-14 relative text-ink">
      <div className="border-b-4 border-double border-ink pb-2 text-center">
        <h2 className="font-serif text-4xl font-black uppercase tracking-tight text-ink">
          The San Francisco Chronicle
        </h2>
        <div className="flex justify-between border-t border-b border-ink py-1 my-2 font-mono text-[10px] uppercase tracking-widest text-ink/80">
          <span>FRIDAY, OCTOBER 23, 2026</span>
          <span>CRIME &amp; PUBLIC SAFETY</span>
          <span>LATE EDITION</span>
        </div>
      </div>

      <div className="my-6">
        <h3 className="font-serif text-2xl font-bold leading-tight text-ink">
          NEW VICTIM FOUND IN SUSPECTED ZODIAC COPYCAT CASE
        </h3>
        <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
          ANONYMOUS MESSAGE RAISES QUESTIONS OVER HISTORIC CASE FILES
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-4 text-xs font-serif leading-relaxed text-justify">
          <div>
            <p className="first-letter:text-3xl first-letter:font-bold first-letter:float-left first-letter:mr-2">
              SAN FRANCISCO — The body of 34-year-old archivist Daniel Mercer was discovered late Thursday night
              in a disused office facility near the Presidio. Investigators have not publicly confirmed a link to
              historic unsolved killings, but sources confirm the victim had raised concerns regarding modified documents.
            </p>
            <p className="mt-3">
              "He said someone was changing the records," a colleague reported. "Not destroying them. Changing
              their meaning."
            </p>
          </div>
          <div>
            <p>
              Hours prior to the discovery, an anonymous message was reportedly logged: <em>"You were looking at
              the wrong person."</em> Beneath it was a motif resembling seven short marks.
            </p>
            <div className="p-3 bg-black/5 border border-ink/30 my-3 font-mono text-[11px]">
              <strong>INVESTIGATIVE NOTICE:</strong> The sequence identified in the archival margins matches an
              indexing code format following a 7-character cipher convention.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrespondenceSheet({ item }: { item: EvidenceItem }) {
  return (
    <div className="paper-sheet p-8 md:p-14 relative text-ink">
      <div className="border-b-2 border-ink pb-3 flex justify-between items-start">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/70 block">
            HISTORICAL CASE CORRESPONDENCE
          </span>
          <h2 className="font-serif text-3xl font-semibold text-ink mt-0.5">The Exorcist's Letter</h2>
        </div>
        <span className="stamp text-crimson border-crimson text-xs">STAGE 01 EVIDENCE</span>
      </div>

      <div className="my-6 space-y-4 font-mono text-xs text-ink/80 leading-relaxed">
        <p>
          Archived letter recovered from the historic 1974 series. On closer forensic examination, an
          uncatalogued memorandum note was discovered affixed to the lower margin.
        </p>

        <div className="p-6 bg-[#f7ef99] text-[#1c1a17] border border-[#d8cc64] shadow-md max-w-md mx-auto my-6 rotate-[-1deg] font-mono text-xs leading-relaxed">
          <p className="text-[10px] uppercase font-bold text-[#6d6418] mb-2 tracking-wider">
            AFFIXED MEMORANDUM NOTE (VERBATIM TRANSCRIPTION):
          </p>
          <pre className="font-mono text-xs leading-6 whitespace-pre-wrap select-all font-semibold">
{`Zodiac correspondence cross-referenced with precinct log book c
Key records from the October file appear altered in the annex area
Check the typewriter alignment on the original carbon studies
All inquiries regarding Vault B require senior supervisor guidance
Shift logs confirm missing negatives from storage locker bay 01
Examine margin notations before submitting dossier update to squad 07`}
          </pre>
          <div className="mt-4 pt-2 border-t border-[#d8cc64] text-[10px] text-[#554e13] flex justify-between items-center">
            <span>[REF: MEMO-74-03-B]</span>
            <span className="italic">Marginal boundary analysis: intact</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   8. SIGNAL ROOM & MAP (Forensic Locations & Transmission Intercept)
   ========================================================================= */

function SignalMapAudioMonitor() {
  const [audioState, setAudioState] = useState<SignalAudioState>(() => signalAudio.getState());

  useEffect(() => {
    return signalAudio.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  // Cleanup on unmount of Signal Map
  useEffect(() => {
    return () => {
      signalAudio.cleanup();
    };
  }, []);

  const totalDuration = Math.round(audioState.duration) || 59;
  const currentSec = Math.floor(audioState.currentTime);
  const progressRatio = totalDuration > 0 ? audioState.currentTime / totalDuration : 0;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = async () => {
    tacticalAudio.playButtonClick();
    await signalAudio.togglePlayPause('map');
  };

  const handleToggleMute = () => {
    tacticalAudio.playButtonClick();
    signalAudio.toggleMute();
  };

  return (
    <div className="p-3 bg-[#111312] border border-[#262c28] text-xs font-mono space-y-2.5 shadow-md my-2">
      <div className="flex items-center justify-between border-b border-[#202522] pb-1.5">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${audioState.isPlaying ? 'bg-crimson animate-ping' : 'bg-emerald-500/60'}`} />
          <span className="text-[#ebe6dc] font-semibold text-[11px] uppercase tracking-wider">
            SIGNAL ROOM AUDIO MONITOR // EV-0401
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
          <span className="text-crimson font-bold">{formatTime(currentSec)}</span>
          <span>/</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Mini Interactive Waveform */}
      <div
        className="relative h-10 bg-[#080a09] border border-[#1d231f] flex items-end gap-1 p-1.5 cursor-pointer select-none overflow-hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const fraction = Math.max(0, Math.min(1, clickX / rect.width));
          signalAudio.seek(fraction * totalDuration);
        }}
        title="Click to seek transmission playback"
      >
        {Array.from({ length: 28 }).map((_, i) => {
          const barFraction = i / 28;
          const isPassed = barFraction <= progressRatio;
          const baseAmp = i < 14 ? 30 + ((i * 19) % 60) : 20 + ((i * 13) % 45);
          const amp = audioState.isPlaying
            ? Math.max(15, Math.min(100, baseAmp + Math.sin(i * 0.9 + currentSec * 3) * 20))
            : baseAmp;
          return (
            <span
              key={i}
              className={`flex-1 rounded-xs transition-all duration-75 ${
                isPassed ? 'bg-crimson' : 'bg-[#232724]'
              }`}
              style={{ height: `${amp}%` }}
            />
          );
        })}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
          style={{ left: `${progressRatio * 100}%` }}
        />
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className="px-3 py-1 bg-crimson text-white rounded-sm hover:bg-[#b52222] transition-colors flex items-center gap-1.5 text-xs font-semibold"
            aria-label={audioState.isPlaying ? 'Pause transmission' : 'Play transmission'}
          >
            {audioState.isPlaying ? (
              <>
                <Pause size={12} />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span>PLAY TRANSMISSION</span>
              </>
            )}
          </button>

          <button
            onClick={handleToggleMute}
            className={`p-1.5 border rounded-sm transition-colors ${
              audioState.isMuted
                ? 'border-crimson text-crimson bg-crimson/10'
                : 'border-[#262c28] text-muted-foreground hover:text-foreground'
            }`}
            aria-label={audioState.isMuted ? 'Unmute signal' : 'Mute signal'}
            title={audioState.isMuted ? 'Unmute' : 'Mute'}
          >
            {audioState.isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>

        <button
          onClick={() => navigate('/evidence/EV-0401')}
          className="text-muted-foreground hover:text-crimson text-[11px] font-mono flex items-center gap-1 transition-colors"
          title="Inspect full EV-0401 cassette transcript"
        >
          <span>Cassette Sheet</span>
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}

function SignalMapView({
  progress,
  onUpdateProgress,
}: {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
}) {
  const [selectedLocationId, setSelectedLocationId] = useState<number>(
    progress.targetLocationChoice ?? 1
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'clues' | 'lines'>('all');
  const [isCorrecting, setIsCorrecting] = useState(false);

  // Guarantee clean stop when unmounting Signal Room / Map
  useEffect(() => {
    return () => {
      signalAudio.cleanup();
    };
  }, []);

  // If Stage 3 Map Gate is locked, render MapSecurityGate first
  if (!progress.mapGateUnlocked && progress.stagesCompleted < 3) {
    return (
      <>
        <PageHeader
          eyebrow="Investigation / Archival Triangulation"
          title="Cartographic Survey Map"
          description="Fictional regional investigation map: Northern California / San Francisco Bay Area. Authentication required to access the survey grid."
        />
        <MapSecurityGate
          progress={progress}
          onUpdateProgress={onUpdateProgress}
        />
      </>
    );
  }

  const locations = [
    {
      id: 1,
      name: 'Lake Herman Road',
      region: 'Benicia, Solano County',
      coord: '38.0934° N, 122.1481° W',
      elevation: '420 ft',
      x: 660,
      y: 410,
      status: 'Open Inspection',
      stage: 1,
      overview:
        'Remote rural turnout along an unlit roadway between Benicia and Vallejo. Cordon tape marks tire compression patterns in dry gravel shoulder.',
      clues: [
        'Off-band radio receiver found on cobblestone shoulder [EV-0102]',
        'Dual tire tracks leading east toward Interstate 680 corridor',
        'Casing discharge geometry indicates stationary firing position',
      ],
      associatedEvidence: [
        { id: 'EV-0101', title: 'Scene Overview — Rear Alley' },
        { id: 'EV-0102', title: 'Portable Radio Receiver' },
      ],
    },
    {
      id: 2,
      name: 'Blue Rock Springs Park',
      region: 'Vallejo, Solano County',
      coord: '38.1256° N, 122.2134° W',
      elevation: '280 ft',
      x: 610,
      y: 350,
      status: 'Open Inspection',
      stage: 2,
      overview:
        'Isolated public park turnout adjacent to municipal golf grounds. Phone booth dispatch recorded four minutes following initial incident alarm.',
      clues: [
        'Public telephone receiver left dangling off cradle on Springs Road',
        'Parchment fragment bearing partial credential notes [ARC-002]',
        'Recorded call log matches regional relay frequency',
      ],
      associatedEvidence: [
        { id: 'EV-0201', title: 'Records Room — Lower Level' },
        { id: 'ARC-002', title: 'Partial Credential Worksheet' },
      ],
    },
    {
      id: 3,
      name: 'Lake Berryessa',
      region: 'Napa County Highlands',
      coord: '38.5833° N, 122.2333° W',
      elevation: '440 ft',
      x: 550,
      y: 130,
      status: 'Open Inspection',
      stage: 3,
      overview:
        'Isolated shoreline spit extending into Berryessa reservoir. Coastal ridgeline mast provides line-of-sight telemetry to the Presidio corridor.',
      clues: [
        'Car door emblem inscription scratched into painted passenger door',
        'Highland transmission mast exhibiting unauthorized microwave modifications [EV-0301]',
        'Witness reports dark hooded figure carrying clothesline cord',
      ],
      associatedEvidence: [
        { id: 'EV-0301', title: 'Coastal Transmission Mast' },
      ],
    },
    {
      id: 4,
      name: 'Washington & Cherry Streets',
      region: 'Presidio Heights, San Francisco',
      coord: '37.78874° N, 122.45709° W',
      elevation: '310 ft',
      x: 240,
      y: 560,
      status: 'Primary Target Candidate',
      stage: 3,
      overview:
        'Residential urban intersection bordering the Presidio military reservation. Resident at House 3893 observed idling vehicle lights and muffled sound.',
      clues: [
        'Witness transcript from House 3893 describing late night movement [CAS-017]',
        'Section of victim bloodstained shirt fragment recovered from dispatch locker',
        'Direct street alignment with historic dispatch antenna array',
      ],
      associatedEvidence: [
        { id: 'CAS-017', title: 'Witness Testimony — Case File 017' },
        { id: 'EV-0401', title: 'Recovered Audio Cassette' },
      ],
    },
  ];

  const selectedLoc = locations.find((l) => l.id === selectedLocationId) ?? locations[0];
  const stage4Config = STAGE_SCHEDULE[3]; // Nov 07–09 IST
  const [msRemaining, setMsRemaining] = useState(() => getRemainingTime(stage4Config.deadlineIso));
  const isBeforeDeadline = msRemaining > 0;
  const hasChosen = progress.targetLocationChoice !== null && progress.targetChoiceLocked;
  const canInitiateCorrection = hasChosen && !progress.targetLocationCorrectionUsed && isBeforeDeadline && progress.targetChoiceEvaluationStatus !== 'revealed';
  const isPermanentlyLocked = hasChosen && !isCorrecting && (!canInitiateCorrection || progress.targetLocationCorrectionUsed || !isBeforeDeadline || progress.targetChoiceEvaluationStatus === 'revealed');
  const canSubmit = !isPermanentlyLocked;

  // Execute stage 4 evaluation and result reveal
  const executeTargetEvaluation = (chosenId: number) => {
    const isCorrect = chosenId === 4;
    const nowIso = new Date().toISOString();
    const scoreBreakdown = calculateStageScore(4, nowIso, { isCorrectTarget: isCorrect });
    tacticalAudio.playSuccess();

    onUpdateProgress((prev) => {
      const nextCompleted = Math.max(prev.stagesCompleted, 4);
      const nextActive = Math.max(prev.activeStage, 5);
      const nextUnlocked = Array.from(new Set([...prev.unlockedEvidenceIds, 'EV-0501']));
      const nextScores = {
        ...prev.stageScores,
        4: scoreBreakdown.totalScore,
      };
      const totalScore = Object.values(nextScores).reduce((a, b) => a + b, 0);

      return {
        ...prev,
        targetChoiceEvaluationStatus: 'revealed',
        stagesCompleted: nextCompleted,
        activeStage: nextActive,
        unlockedEvidenceIds: nextUnlocked,
        stageScores: nextScores,
        stageSolveTimestamps: {
          ...prev.stageSolveTimestamps,
          4: nowIso,
        },
        stageScoringEligible: {
          ...prev.stageScoringEligible,
          4: scoreBreakdown.scoringEligible,
        },
        score: totalScore,
      };
    });
  };

  // Live countdown timer and deadline expiration check
  useEffect(() => {
    const timer = setInterval(() => {
      const rem = getRemainingTime(stage4Config.deadlineIso);
      setMsRemaining(rem);
      if (rem <= 0 && progress.targetChoiceEvaluationStatus === 'pending' && progress.targetLocationChoice !== null) {
        executeTargetEvaluation(progress.targetLocationChoice);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [stage4Config.deadlineIso, progress.targetChoiceEvaluationStatus, progress.targetLocationChoice]);

  // Initial mount check if pending and deadline passed
  useEffect(() => {
    if (progress.targetChoiceEvaluationStatus === 'pending' && progress.targetLocationChoice !== null) {
      if (getRemainingTime(stage4Config.deadlineIso) <= 0) {
        executeTargetEvaluation(progress.targetLocationChoice);
      }
    }
  }, []);

  const handleConfirmChoice = () => {
    if (isPermanentlyLocked) return;
    // Neutral click feedback: no premature success chime or unlock
    tacticalAudio.playButtonClick();
    const nowIso = new Date().toISOString();
    const wasCorrection = isCorrecting;

    submitLocationChoice({
      callSign: progress.callSign,
      locationId: selectedLocationId,
      currentProgress: progress,
    });

    onUpdateProgress((prev) => ({
      ...prev,
      targetLocationChoice: selectedLocationId,
      targetChoiceLocked: true,
      targetLocationCorrectionUsed: wasCorrection ? true : prev.targetLocationCorrectionUsed,
      targetChoiceTimestamp: nowIso,
      targetChoiceEvaluationStatus: 'pending',
      targetChoiceRevealTimestamp: stage4Config.deadlineIso,
      tasksCompleted: prev.tasksCompleted + (wasCorrection ? 0 : 1),
    }));
    setIsCorrecting(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Investigation / Archival Triangulation"
        title="Cartographic Survey Map"
        description="Fictional regional investigation map: Northern California / San Francisco Bay Area. Inspect forensic sites, evaluate evidence connections, and submit your single target choice for Stage 03."
      />

      {/* Prominent Safety Banner */}
      <div className="p-3 bg-[#16120e] border-l-4 border-crimson border-y border-r border-[#3a201c] text-[#dfd7cc] font-mono text-xs mb-6 flex items-start gap-3 shadow-md">
        <ShieldAlert size={18} className="text-crimson shrink-0 mt-0.5" />
        <div>
          <strong className="text-crimson tracking-wide uppercase block">
            ONLINE FICTIONAL INVESTIGATION NOTICE — PHYSICAL TRAVEL PROHIBITED
          </strong>
          <p className="text-[11px] text-muted-foreground m-0 mt-0.5 leading-relaxed">
            All coordinates, locations, and narrative incidents are components of a school mystery simulation.
            Never attempt to visit, search, or conduct surveillance at any real-world physical locations.
            All clues are solved 100% within this digital browser archive.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Main Illustrated SVG Map (8 cols) */}
        <div className="xl:col-span-8 flex flex-col space-y-4">
          <div className="panel p-0 relative overflow-hidden bg-[#0a0c0b] border border-border shadow-2xl flex flex-col">
            {/* Map Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#1c221e] bg-[#0e1110] font-mono text-xs z-10">
              <div className="flex items-center gap-3">
                <span className="block size-2 rounded-full bg-crimson animate-pulse" />
                <span className="text-foreground tracking-widest uppercase font-semibold">
                  CHART 1974-NORCAL // TRIANGULATION QUADRANT
                </span>
                <span className="text-muted-foreground text-[10px] hidden sm:inline">
                  LAT 37°45'N – 38°40'N / LON 122°00'W – 122°40'W
                </span>
              </div>

              {/* Map Layer Filters */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => {
                    tacticalAudio.playButtonClick();
                    setActiveFilter('all');
                  }}
                  className={`px-2.5 py-1 border transition-all ${
                    activeFilter === 'all'
                      ? 'border-crimson text-crimson bg-[#1e1313]'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Full Chart
                </button>
                <button
                  onClick={() => {
                    tacticalAudio.playButtonClick();
                    setActiveFilter('clues');
                  }}
                  className={`px-2.5 py-1 border transition-all ${
                    activeFilter === 'clues'
                      ? 'border-crimson text-crimson bg-[#1e1313]'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Pins Only
                </button>
                <button
                  onClick={() => {
                    tacticalAudio.playButtonClick();
                    setActiveFilter('lines');
                  }}
                  className={`px-2.5 py-1 border transition-all ${
                    activeFilter === 'lines'
                      ? 'border-crimson text-crimson bg-[#1e1313]'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Telemetry Vectors
                </button>
              </div>
            </div>

            {/* Custom Illustrated Cartographic SVG Canvas */}
            <div className="relative w-full aspect-[1000/680] bg-[#0d0f0e] select-none">
              <svg
                viewBox="0 0 1000 680"
                className="w-full h-full text-xs font-mono"
                style={{ filter: 'contrast(1.05) brightness(0.98)' }}
              >
                <defs>
                  {/* Subtle paper grid pattern */}
                  <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#181d1a"
                      strokeWidth="0.6"
                      strokeDasharray="2,3"
                    />
                  </pattern>

                  {/* Red telemetry line marker */}
                  <marker
                    id="telemetryArrow"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="4"
                    markerHeight="4"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#c93838" />
                  </marker>

                  {/* Gradient vignette */}
                  <radialGradient id="mapVignette" cx="50%" cy="50%" r="65%">
                    <stop offset="60%" stopColor="#000000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#050706" stopOpacity="0.85" />
                  </radialGradient>
                </defs>

                {/* Background paper texture & grid */}
                <rect width="1000" height="680" fill="#0d0f0e" />
                <rect width="1000" height="680" fill="url(#gridPattern)" />

                {/* Water Bodies (Pacific Ocean, San Pablo Bay, SF Bay, Carquinez, Lake Berryessa) */}
                <g fill="#070908" stroke="#1c2420" strokeWidth="1.2">
                  {/* Pacific Ocean & Coastal Jagged Edge (West) */}
                  <path d="M 0,0 L 190,0 Q 180,80 160,160 T 130,300 Q 140,380 180,440 T 210,510 L 150,560 Q 120,620 100,680 L 0,680 Z" />

                  {/* San Francisco Bay & San Pablo Bay */}
                  <path d="M 230,520 Q 250,500 270,510 T 310,540 Q 340,580 320,640 L 260,680 L 220,680 Q 210,610 220,550 Z" />
                  <path d="M 330,420 Q 370,370 450,380 T 520,430 Q 480,490 390,480 T 330,420 Z" />

                  {/* Carquinez Strait & Suisun Bay eastward channel */}
                  <path d="M 520,410 Q 580,400 640,430 T 730,420 Q 750,440 700,460 T 570,440 Z" />

                  {/* Napa River Meander */}
                  <path
                    d="M 470,380 Q 490,320 480,260 T 490,190"
                    fill="none"
                    stroke="#16201b"
                    strokeWidth="3.5"
                  />

                  {/* Lake Berryessa Reservoir (North) */}
                  <path d="M 520,100 Q 560,85 580,120 T 560,170 Q 530,180 520,150 T 520,100 Z" />
                </g>

                {/* Topographic Contour Curves (Mountain Tamalpais, Howell Mountain, Sulphur Springs) */}
                <g fill="none" stroke="#1a201c" strokeWidth="0.8" strokeDasharray="3,4">
                  {/* Presidio / SF Hills */}
                  <ellipse cx="250" cy="580" rx="60" ry="40" />
                  <ellipse cx="250" cy="580" rx="35" ry="22" />

                  {/* Marin Ridge / Mt Tam */}
                  <path d="M 220,380 Q 260,330 300,360 T 270,420 Z" />
                  <path d="M 235,375 Q 260,350 280,370 T 260,405 Z" />

                  {/* Solano / Vallejo Ridge */}
                  <path d="M 600,320 Q 660,300 700,350 T 640,400 Z" />
                  <path d="M 620,335 Q 655,320 680,355 T 640,385 Z" />

                  {/* Napa Highland Terrain */}
                  <path d="M 500,90 Q 580,60 620,130 T 540,200 Z" />
                </g>

                {/* Primary Highway Arteries */}
                <g fill="none" stroke="#2a322c" strokeWidth="2">
                  {/* Hwy 101 North-South Corridor */}
                  <path d="M 245,680 L 245,540 Q 250,510 260,490 L 270,430 Q 260,320 250,200 L 240,0" />

                  {/* Interstate 80 (SF to Vallejo & Sacramento) */}
                  <path d="M 320,600 Q 420,530 520,440 L 610,390 Q 720,330 850,260 L 1000,210" />

                  {/* State Route 29 North into Napa Valley */}
                  <path d="M 580,410 Q 540,320 510,240 T 480,110 L 460,0" strokeDasharray="5,2" />

                  {/* Lake Herman Road winding connector */}
                  <path d="M 620,390 Q 645,405 680,420 T 730,440" stroke="#3d4940" strokeWidth="1.8" />
                </g>

                {/* Road Labels */}
                <g fill="#4e5b53" fontSize="9" fontWeight="bold">
                  <text x="210" y="470" transform="rotate(-75 210,470)">US-101 CORRIDOR</text>
                  <text x="730" y="325" transform="rotate(-25 730,325)">INTERSTATE 80</text>
                  <text x="525" y="270" transform="rotate(-65 525,270)">SR-29 NAPA</text>
                  <text x="670" y="440">LK HERMAN RD</text>
                  <text x="175" y="590">PRESIDIO BLVD</text>
                </g>

                {/* Water Body & Geographic Area Labels */}
                <g fill="#37433c" fontSize="11" fontStyle="italic" letterSpacing="0.15em">
                  <text x="40" y="240">PACIFIC OCEAN</text>
                  <text x="360" y="440">SAN PABLO BAY</text>
                  <text x="260" y="620">SAN FRANCISCO BAY</text>
                  <text x="590" y="460">CARQUINEZ STRAIT</text>
                  <text x="560" y="105">LAKE BERRYESSA</text>
                  <text x="430" y="160">NAPA VALLEY</text>
                </g>

                {/* Telemetry Vector Connections Between the 4 Sites */}
                {activeFilter !== 'clues' && (
                  <g stroke="#c93838" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.85">
                    {/* Site 01 (Lake Herman) to Site 02 (Blue Rock Springs) */}
                    <line x1="660" y1="410" x2="610" y2="350" />

                    {/* Site 02 (Blue Rock Springs) to Site 03 (Berryessa) */}
                    <line x1="610" y1="350" x2="550" y2="130" />

                    {/* Site 03 (Berryessa) to Site 04 (Presidio Heights) */}
                    <line x1="550" y1="130" x2="240" y2="560" />

                    {/* Site 04 (Presidio Heights) to Site 01 (Lake Herman) */}
                    <line x1="240" y1="560" x2="660" y2="410" />

                    {/* Distance annotations */}
                    <g fill="#c93838" fontSize="8" fontWeight="bold">
                      <rect x="635" y="375" width="46" height="13" fill="#140808" stroke="#5c1c1c" />
                      <text x="638" y="385">~6.4 MI</text>

                      <rect x="580" y="235" width="50" height="13" fill="#140808" stroke="#5c1c1c" />
                      <text x="583" y="245">~32.8 MI</text>

                      <rect x="375" y="340" width="50" height="13" fill="#140808" stroke="#5c1c1c" />
                      <text x="378" y="350">~54.1 MI</text>

                      <rect x="440" y="490" width="50" height="13" fill="#140808" stroke="#5c1c1c" />
                      <text x="443" y="500">~38.7 MI</text>
                    </g>
                  </g>
                )}

                {/* Cartographic Compass Rose (Top Right) */}
                <g transform="translate(900, 90)">
                  <circle r="42" fill="#0b0e0c" stroke="#253029" strokeWidth="1" />
                  <circle r="36" fill="none" stroke="#1d2621" strokeWidth="0.8" strokeDasharray="2,2" />
                  {/* Compass Needles */}
                  <polygon points="0,-36 6,-6 0,0 -6,-6" fill="#c93838" />
                  <polygon points="0,36 6,6 0,0 -6,6" fill="#44554b" />
                  <polygon points="36,0 6,6 0,0 6,-6" fill="#2d3831" />
                  <polygon points="-36,0 -6,6 0,0 -6,-6" fill="#2d3831" />
                  <text x="-4" y="-40" fill="#ebe6dc" fontSize="10" fontWeight="bold">N</text>
                  <text x="41" y="3" fill="#6d7a71" fontSize="8">E</text>
                  <text x="-3" y="48" fill="#6d7a71" fontSize="8">S</text>
                  <text x="-48" y="3" fill="#6d7a71" fontSize="8">W</text>
                  <text x="-16" y="16" fill="#c93838" fontSize="7" fontWeight="bold">N 38°</text>
                </g>

                {/* Scale Bar (Bottom Left) */}
                <g transform="translate(40, 640)" fill="#68776e" fontSize="8">
                  <line x1="0" y1="0" x2="160" y2="0" stroke="#68776e" strokeWidth="1.5" />
                  <line x1="0" y1="-4" x2="0" y2="4" stroke="#68776e" strokeWidth="1.5" />
                  <line x1="80" y1="-3" x2="80" y2="3" stroke="#68776e" strokeWidth="1" />
                  <line x1="160" y1="-4" x2="160" y2="4" stroke="#68776e" strokeWidth="1.5" />
                  <text x="0" y="-8">0</text>
                  <text x="73" y="-8">10</text>
                  <text x="145" y="-8">20 MILES</text>
                  <text x="0" y="12" fill="#45524a" fontSize="7">SURVEY ARCHIVE SCALE 1:250,000</text>
                </g>

                {/* Cartouche & Metadata Stamp (Top Left) */}
                <g transform="translate(30, 30)">
                  <rect width="210" height="62" fill="#090c0a" stroke="#25322a" strokeWidth="1" />
                  <rect x="3" y="3" width="204" height="56" fill="none" stroke="#151e18" strokeWidth="0.8" />
                  <text x="12" y="18" fill="#c93838" fontSize="8" fontWeight="bold" letterSpacing="0.1em">
                    DEPT. OF INVESTIGATION // CAS-017
                  </text>
                  <text x="12" y="32" fill="#ebe6dc" fontSize="11" fontFamily="serif" fontWeight="bold">
                    Bay Area Triangulation Grid
                  </text>
                  <text x="12" y="46" fill="#6f7f75" fontSize="7">
                    QUADRANT 4-A // CLASSIFIED RECORD
                  </text>
                  <text x="12" y="55" fill="#6f7f75" fontSize="7">
                    RECORDS RETRIEVAL LOG 1974-OCT
                  </text>
                </g>

                {/* Latitude & Longitude Coordinate Border Ticks */}
                <g fill="#435248" fontSize="8">
                  <text x="965" y="135">38°35'N</text>
                  <text x="965" y="355">38°15'N</text>
                  <text x="965" y="565">37°48'N</text>
                  <text x="230" y="670">122°27'W</text>
                  <text x="540" y="670">122°14'W</text>
                  <text x="650" y="670">122°08'W</text>
                </g>

                {/* THE 4 INTERACTIVE LOCATION MARKERS */}
                {locations.map((loc) => {
                  const isSelected = selectedLocationId === loc.id;
                  const isLockedChoice = progress.targetLocationChoice === loc.id;

                  return (
                    <g
                      key={loc.id}
                      transform={`translate(${loc.x}, ${loc.y})`}
                      onClick={() => {
                        tacticalAudio.playSelect();
                        setSelectedLocationId(loc.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          tacticalAudio.playSelect();
                          setSelectedLocationId(loc.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Location 0${loc.id}: ${loc.name}, ${loc.region}`}
                      className="cursor-pointer group focus:outline-none"
                    >
                      {/* Pulse circle when selected */}
                      {isSelected && (
                        <circle
                          r="28"
                          fill="none"
                          stroke="#c93838"
                          strokeWidth="1.2"
                          strokeDasharray="3,3"
                          className="animate-spin"
                          style={{ animationDuration: '8s' }}
                        />
                      )}

                      {/* Outer target radar ring */}
                      <circle
                        r="18"
                        fill={isSelected ? '#200e0e' : '#0c110e'}
                        stroke={isSelected ? '#c93838' : '#334238'}
                        strokeWidth={isSelected ? '2' : '1.2'}
                        className="transition-all duration-200 group-hover:stroke-crimson group-hover:scale-110"
                      />

                      {/* Center pin badge */}
                      <circle
                        r="9"
                        fill={isSelected ? '#c93838' : isLockedChoice ? '#a82c2c' : '#1e2822'}
                      />

                      {/* Marker Number */}
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        0{loc.id}
                      </text>

                      {/* Site Label Tag Below Pin */}
                      <g transform="translate(0, 24)">
                        <rect
                          x="-65"
                          y="-2"
                          width="130"
                          height="22"
                          fill={isSelected ? '#1c1010' : '#0d110f'}
                          stroke={isSelected ? '#c93838' : '#2b3830'}
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="9"
                          textAnchor="middle"
                          fill={isSelected ? '#ffffff' : '#b8c5bc'}
                          fontSize="8"
                          fontWeight="bold"
                        >
                          {loc.name.length > 18 ? loc.name.slice(0, 16) + '..' : loc.name}
                        </text>
                        <text
                          x="0"
                          y="17"
                          textAnchor="middle"
                          fill={isSelected ? '#c93838' : '#69786f'}
                          fontSize="7"
                        >
                          {loc.coord}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Dark Vignette Overlay */}
                <rect width="1000" height="680" fill="url(#mapVignette)" pointerEvents="none" />
              </svg>
            </div>

            {/* Map Footer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0d100e] border-t border-[#1c221e] font-mono text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#8bb393]" />
                <span>4 Survey Locations Available for Exploration</span>
              </div>
              <span className="text-[10px] uppercase text-[#738278]">
                Click or press tab+enter on pins to inspect forensic details
              </span>
            </div>
          </div>
        </div>

        {/* Location Details Docket / Inspection Drawer (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="panel border-t-2 border-t-crimson bg-[#121413]">
            <div className="panel-heading">
              <span>LOCATION DOSSIER // SITE 0{selectedLoc.id}</span>
              <Compass size={14} className="text-crimson" />
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-crimson block font-semibold">
                  {selectedLoc.region}
                </span>
                <h3 className="font-serif text-2xl text-foreground font-light mt-0.5">
                  {selectedLoc.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs text-muted-foreground">
                  <span>{selectedLoc.coord}</span>
                  <span>·</span>
                  <span>Elev. {selectedLoc.elevation}</span>
                </div>
              </div>

              <div className="p-3 bg-[#181b19] border border-border text-xs font-mono leading-relaxed text-[#dcd6c9]">
                <p className="m-0">{selectedLoc.overview}</p>
              </div>

              {/* Forensic Clues List */}
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2 font-semibold">
                  Forensic Artifacts &amp; Clues at this Site:
                </span>
                <ul className="space-y-2 font-mono text-xs">
                  {selectedLoc.clues.map((clue, idx) => (
                    <li
                      key={idx}
                      className="p-2 bg-[#161817] border border-border flex items-start gap-2 text-muted-foreground"
                    >
                      <span className="text-crimson font-bold mt-0.5">•</span>
                      <span className="text-[#ebe6dc] leading-tight">{clue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Associated Evidence Items with Direct Navigation */}
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2 font-semibold">
                  Linked Evidence Files:
                </span>
                <div className="space-y-2">
                  {selectedLoc.associatedEvidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 bg-[#171a18] border border-border flex items-center justify-between font-mono text-xs"
                    >
                      <div>
                        <strong className="text-foreground block">{ev.id}</strong>
                        <span className="text-[11px] text-muted-foreground">{ev.title}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/evidence/${ev.id}`)}
                        className="text-crimson hover:text-red-400 font-mono text-xs flex items-center gap-1 font-semibold"
                      >
                        Inspect <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 4 Target Candidate Deduction & Single Allowed Correction */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    STAGE 04 TARGET CANDIDATE DEDUCTION
                  </span>
                  <span
                    className={`status-pill ${
                      progress.activeStage >= 3 ? 'available' : 'restricted'
                    }`}
                  >
                    {progress.activeStage >= 3 ? 'STAGE 04 SELECTION' : 'STAGE 04 LOCKED'}
                  </span>
                </div>

                <blockquote className="font-serif text-xs text-[#dcd6c9] leading-relaxed italic border-l-2 border-crimson pl-2.5 my-2">
                  "Four survey sites. One matches the reversed audio transmission coordinates.
                  Cross-reference recovered evidence to verify the vector."
                </blockquote>

                {hasChosen && !isCorrecting ? (
                  progress.targetChoiceEvaluationStatus === 'revealed' ? (
                    <div className="p-3 bg-[#1e231f] border border-[#2e4333] text-[#8bb393] font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-emerald-400">
                          <Check size={14} />
                          <span>Official Evaluation Unsealed</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Site 0{progress.targetLocationChoice}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#b8dfc0] m-0">
                        Selected candidate:{' '}
                        <strong>
                          Site 0{progress.targetLocationChoice}:{' '}
                          {locations.find((l) => l.id === progress.targetLocationChoice)?.name}
                        </strong>
                      </p>
                      <div className="p-2 bg-[#121914] border border-[#233527] text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span>STAGE 04 SCORE:</span>
                          <span className="font-bold text-emerald-400">+{progress.stageScores[4] ?? 0} PTS</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-[10px]">
                          <span>CLEARANCE:</span>
                          <span className="text-foreground">STAGE 05 UNLOCKED</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#171816] border border-[#383734] text-[#dcd6c9] font-mono text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2d2c29] pb-2">
                        <div className="flex items-center gap-2 font-bold text-amber-300">
                          <Clock3 size={14} />
                          <span>Transmission Logged // Pending Reveal</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Site 0{progress.targetLocationChoice}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#beb8ae] m-0 leading-relaxed">
                        Signal vector logged into dispatch queue. Analysis results will remain sealed until the scheduled stage deadline.
                      </p>

                      <div className="p-2.5 bg-[#0e0f0e] border border-[#262826] space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase">
                          <span>UNSEAL COUNTDOWN</span>
                          <span className="text-amber-400 font-bold">{formatCountdown(msRemaining)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>SCHEDULED:</span>
                          <span>{stage4Config.deadlineIST}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>CANDIDATE:</span>
                          <span className="text-foreground font-semibold">
                            Site 0{progress.targetLocationChoice}: {locations.find((l) => l.id === progress.targetLocationChoice)?.name}
                          </span>
                        </div>
                      </div>

                      {/* Correction rules: 1 player correction allowed before deadline */}
                      {canInitiateCorrection ? (
                        <div className="pt-2 border-t border-[#2d2c29] space-y-1.5">
                          <p className="text-[10px] text-amber-300/80 m-0">
                            Rule: Exactly ONE player-initiated correction is permitted before the deadline ({stage4Config.deadlineIST}).
                          </p>
                          <button
                            onClick={() => {
                              tacticalAudio.playButtonClick();
                              setIsCorrecting(true);
                            }}
                            className="button bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-200 text-xs font-mono py-1.5 px-3 w-full flex items-center justify-center gap-1.5"
                          >
                            <span>Request Target Correction (1 Remaining)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground pt-1 border-t border-[#2d2c29]">
                          {progress.targetLocationCorrectionUsed
                            ? '✓ Single player correction allowance has been utilized. Target permanently locked.'
                            : 'Candidate locked until scheduled deadline unsealing.'}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed m-0">
                      {isCorrecting
                        ? `You are executing your SINGLE allowed correction. Selecting ${selectedLoc.name} (Site 0${selectedLoc.id}) will permanently record your decision.`
                        : `Confirming ${selectedLoc.name} (Site 0${selectedLoc.id}) will record your initial candidate. One player correction is allowed prior to deadline.`}
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        disabled={!canSubmit}
                        onClick={handleConfirmChoice}
                        className={`button button-primary w-full text-xs font-mono py-2.5 ${
                          !canSubmit ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Lock size={14} />
                        <span>
                          {isCorrecting
                            ? `Confirm Site 0${selectedLoc.id} (Final Correction)`
                            : `Confirm Site 0${selectedLoc.id} as Target`}
                        </span>
                      </button>

                      {isCorrecting && (
                        <button
                          onClick={() => setIsCorrecting(false)}
                          className="button button-secondary w-full text-xs font-mono py-1 text-muted-foreground"
                        >
                          Cancel Correction
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================================
   9. MESSAGES
   ========================================================================= */

function MessagesView({
  progress,
  onUpdateProgress,
  onTriggerDirectorReplay,
}: {
  progress?: UserProgress;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
  onTriggerDirectorReplay?: () => void;
}) {
  const deliveredMessages = useMemo(() => {
    return progress ? getDeliveredMessagesForPlayer(progress) : [];
  }, [progress]);

  const readSet = useMemo(() => {
    return new Set(progress?.readMessageIds ?? []);
  }, [progress?.readMessageIds]);

  const unreadCount = deliveredMessages.filter((m) => !readSet.has(m.id)).length;

  const handleMarkAllRead = () => {
    if (!onUpdateProgress || deliveredMessages.length === 0) return;
    const allIds = deliveredMessages.map((m) => m.id);
    tacticalAudio.playButtonClick();
    onUpdateProgress((prev) => ({
      ...prev,
      readMessageIds: Array.from(new Set([...(prev.readMessageIds || []), ...allIds])),
    }));
  };

  const handleMarkSingleRead = (id: string) => {
    if (!onUpdateProgress || readSet.has(id)) return;
    onUpdateProgress((prev) => ({
      ...prev,
      readMessageIds: Array.from(new Set([...(prev.readMessageIds || []), id])),
    }));
  };

  return (
    <>
      <PageHeader
        eyebrow="Communications / Radio Dispatch Archive"
        title="Incoming Transmissions"
        description="Encrypted wires, stage broadcasts, and one-way signals received from the Director, the mystery caller, and system monitors."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && onUpdateProgress && (
              <button
                onClick={handleMarkAllRead}
                className="button button-secondary text-xs font-mono py-1.5 px-3 flex items-center gap-1.5"
              >
                <Check size={13} className="text-emerald-400" />
                <span>Mark All Read ({unreadCount})</span>
              </button>
            )}
            {onTriggerDirectorReplay && (
              <button
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  onTriggerDirectorReplay();
                }}
                className="button button-secondary text-xs font-mono py-1.5 px-3 flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Replay Director Briefing</span>
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {deliveredMessages.map((m) => {
            const isRead = readSet.has(m.id);

            return (
              <div
                key={m.id}
                onClick={() => handleMarkSingleRead(m.id)}
                className={`panel transition-all cursor-pointer ${
                  !isRead ? 'ring-1 ring-crimson/50 shadow-[0_0_15px_rgba(200,40,40,0.15)]' : ''
                } ${
                  m.tone === 'antagonist'
                    ? 'border-[#5c2420] bg-[#1a0e0e]'
                    : m.tone === 'director'
                    ? 'border-[#2d3a31] bg-[#111713]'
                    : m.tone === 'staff'
                    ? 'border-[#544320] bg-[#1a170e]'
                    : 'border-border bg-[#141514]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isRead && (
                      <span
                        className="size-2 rounded-full bg-crimson animate-pulse inline-block"
                        title="Unread dispatch"
                      />
                    )}
                    <span
                      className={
                        m.tone === 'antagonist'
                          ? 'text-crimson font-bold'
                          : m.tone === 'director'
                          ? 'text-[#8bb393] font-bold'
                          : m.tone === 'staff'
                          ? 'text-amber-400 font-bold'
                          : 'text-muted-foreground'
                      }
                    >
                      {m.sender}
                    </span>
                    <span className="text-[10px] text-muted-foreground border border-border px-1 py-0.5">
                      {m.stageWindow}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-[10px]">{m.timestampIST}</span>
                </div>
                <p className="font-serif text-base text-[#e5dfd3] leading-relaxed m-0">{m.text}</p>
              </div>
            );
          })}

          {deliveredMessages.length === 0 && (
            <div className="panel p-8 text-center text-muted-foreground font-mono text-xs">
              No active dispatches available for your clearance level.
            </div>
          )}
        </div>

        <div>
          <div className="panel border-t-2 border-t-crimson space-y-4">
            <div className="panel-heading">
              <span>FREQUENCY MONITOR</span>
              <Radio size={14} />
            </div>
            <p className="font-serif text-sm leading-relaxed text-muted-foreground m-0">
              This communications channel is strictly one-way. Verified dispatches arrive as stage windows
              advance or when critical forensic dockets are declassified.
            </p>

            <div className="p-3 bg-[#111110] border border-border text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span>TOTAL DISPATCHES:</span>
                <span className="font-bold text-foreground">{deliveredMessages.length}</span>
              </div>
              <div className="flex justify-between">
                <span>UNREAD:</span>
                <span className={unreadCount > 0 ? 'text-crimson font-bold' : 'text-emerald-400'}>
                  {unreadCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ACTIVE STAGE:</span>
                <span className="text-foreground">STAGE 0{progress?.activeStage ?? 1}</span>
              </div>
            </div>

            {onTriggerDirectorReplay && (
              <button
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  onTriggerDirectorReplay();
                }}
                className="button button-secondary w-full text-xs font-mono py-2 flex items-center justify-center gap-2"
              >
                <RotateCcw size={13} />
                <span>Review Director Case Protocol</span>
              </button>
            )}

            <div className="pt-2 border-t border-line-soft font-mono text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>CHANNEL STATUS:</span>
                <span className={progress?.systemFreezeTriggered ? 'text-crimson font-bold' : 'text-[#8bb393]'}>
                  {progress?.systemFreezeTriggered ? 'SEVERED' : 'MONITORING'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SAFETY PROTOCOL:</span>
                <span className="text-foreground">ONE-WAY ONLY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================================
   10. PROGRESS VIEW
   ========================================================================= */

function ProgressView({ progress }: { progress: UserProgress }) {
  const percent = Math.round((progress.stagesCompleted / 7) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Case Mastery / Seven Signals"
        title="Investigation Progress"
        description="A complete tracking overview of all seven investigation stages, unlock windows, and completion milestones."
      />

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="panel text-center">
          <span className="eyebrow block mb-2">STAGES CLEARED</span>
          <span className="font-mono text-4xl text-foreground font-light">
            0{progress.stagesCompleted} / 07
          </span>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            {progress.stagesCompleted === 0
              ? 'No stages cleared yet'
              : `${progress.stagesCompleted} of 7 cleared (${percent}%)`}
          </p>
        </div>
        <div className="panel text-center">
          <span className="eyebrow block mb-2">ACTIVE STAGE WINDOW</span>
          <span className="font-mono text-4xl text-crimson font-light">
            Stage 0{progress.activeStage}
          </span>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            {progress.status}
          </p>
        </div>
        <div className="panel text-center">
          <span className="eyebrow block mb-2">OFFICIAL SCORE</span>
          <span className="font-mono text-4xl text-foreground font-light">
            {progress.score} pts
          </span>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            {progress.score === 0 ? 'Initial fresh state' : 'Earned through solves'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((st) => {
          const displayInfo = getStageDisplayInfo(st.number, progress);
          const isCompleted = displayInfo.isCompleted;
          const isAvailable = displayInfo.isActive;
          const isLocked = !displayInfo.isReleased;
          const state = isCompleted ? 'completed' : isAvailable ? 'available' : 'locked';

          return (
            <div
              key={st.number}
              className={`panel flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isLocked ? 'opacity-65 bg-[#0e0e0d]' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-2xl text-muted-foreground font-light">
                  {String(st.number).padStart(2, '0')}
                </span>
                <div>
                  <h3
                    className={`font-serif text-xl ${
                      isLocked ? 'text-[#8d8880] italic' : 'text-foreground'
                    }`}
                  >
                    {displayInfo.title}
                  </h3>
                  <p
                    className={`font-mono text-xs uppercase tracking-wider ${
                      isLocked ? 'text-[#615e58]' : 'text-muted-foreground'
                    }`}
                  >
                    {displayInfo.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 font-mono text-xs">
                <span className="text-muted-foreground">{st.date}</span>
                <span className={`status-pill ${state}`}>
                  {isLocked ? 'SIGNAL LOCKED' : state}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* =========================================================================
   11. LEADERBOARD
   ========================================================================= */

interface LeaderboardEntry {
  pos: number;
  name: string;
  score: number;
  stagesCompleted: number;
  lastProgress?: string | null;
}

interface LeaderboardEntry {
  pos: number;
  name: string;
  kind: 'team' | 'solo';
  score: number;
  stagesCompleted: number;
  currentStage: number;
  completionPercentage: number;
  lastProgress?: string | null;
  studentClass?: string;
  members?: string[];
  isCreator?: boolean;
  teamSize?: number;
}

function LeaderboardView({
  user,
  progress,
}: {
  user: PrototypeUser;
  progress: UserProgress;
}) {
  const [tab, setTab] = useState<'all' | 'team' | 'solo'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<LeaderboardEntry | null>(null);

  const isExcluded = Boolean(
    user.excludeFromLeaderboard ||
    progress.excludeFromLeaderboard ||
    user.hasStageOverride ||
    progress.hasStageOverride ||
    (user.email &&
      (user.email.toLowerCase().trim() === 'rudrapratapj.0562@gmail.com' ||
        user.email.toLowerCase().trim() === 'rudrapratapf.0562@gmail.com')) ||
    user.isStaff
  );

  // Sync user's live progress to server leaderboard on mount
  useEffect(() => {
    fetch('/api/leaderboard/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callSign: user.callSign,
        fullName: user.fullName,
        studentClass: user.studentClass || 'Class 9',
        score: progress.score,
        stagesCompleted: progress.stagesCompleted,
        lastProgress:
          progress.organizerAuditLog?.[progress.organizerAuditLog.length - 1]?.timestamp ||
          user.registeredAt,
        excludeFromLeaderboard: isExcluded,
        hasStageOverride: Boolean(user.hasStageOverride || progress.hasStageOverride),
        teamName: progress.teamName || null,
        isStaff: Boolean(user.isStaff),
      }),
    }).catch(() => {});
  }, [user, progress, isExcluded]);

  useEffect(() => {
    let cancelled = false;
    async function loadLeaderboard() {
      setLoading(true);

      // 1. Try server aggregated leaderboard API
      try {
        const queryParams = new URLSearchParams();
        if (tab !== 'all') queryParams.set('kind', tab);
        if (classFilter !== 'all') queryParams.set('class', classFilter);

        const res = await fetch(`/api/leaderboard?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.entries)) {
            if (!cancelled) {
              const mapped: LeaderboardEntry[] = data.entries.map((item: any) => ({
                pos: item.rank,
                name: item.name,
                kind: item.kind,
                score: item.score,
                stagesCompleted: item.stagesCompleted,
                currentStage: item.currentStage || Math.min(7, item.stagesCompleted + 1),
                completionPercentage:
                  item.completionPercentage ?? Math.round((item.stagesCompleted / 7) * 100),
                lastProgress: item.lastProgress,
                studentClass: item.studentClass,
                members: item.members,
                teamSize: item.teamSize,
              }));
              setEntries(mapped);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[LeaderboardView] Server leaderboard fetch error:', err);
      }

      // 2. Supabase get_leaderboard RPC if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const kindParam = tab === 'team' ? 'team' : tab === 'solo' ? 'solo' : 'all';
          const { data, error } = await supabase.rpc('get_leaderboard', { p_kind: kindParam });
          if (!error && Array.isArray(data)) {
            if (!cancelled) {
              const sanitizedRows: LeaderboardEntry[] = data
                .filter((row: any) => {
                  const rName = String(row.name || '').toLowerCase().trim();
                  if (
                    rName === 'rudrapratapj.0562@gmail.com' ||
                    rName === 'rudrapratapf.0562@gmail.com' ||
                    (isExcluded && rName === user.callSign.toLowerCase().trim())
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((row: any, idx: number) => ({
                  pos: idx + 1,
                  name: row.name,
                  kind: (row.kind || 'solo') as 'team' | 'solo',
                  score: Number(row.score),
                  stagesCompleted: Number(row.stages_completed ?? 0),
                  currentStage: Math.min(7, Number(row.stages_completed ?? 0) + 1),
                  completionPercentage: Math.round((Number(row.stages_completed ?? 0) / 7) * 100),
                  lastProgress: row.last_progress,
                }));
              setEntries(sanitizedRows);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('[LeaderboardView] Supabase get_leaderboard query error:', err);
        }
      }

      // 3. Prototype / local fallback
      const allUsers = getAllUsers();
      const eligibleUsers = allUsers.filter((u) => {
        if (
          u.isStaff ||
          u.excludeFromLeaderboard ||
          u.hasStageOverride ||
          (u.email &&
            (u.email.toLowerCase().trim() === 'rudrapratapj.0562@gmail.com' ||
              u.email.toLowerCase().trim() === 'rudrapratapf.0562@gmail.com'))
        ) {
          return false;
        }
        const uProg = getUserProgress(u.callSign);
        if (uProg.excludeFromLeaderboard || uProg.hasStageOverride) return false;
        if (classFilter !== 'all' && u.studentClass && u.studentClass !== classFilter) return false;
        return true;
      });

      const rows: LeaderboardEntry[] = [];

      if (tab === 'all' || tab === 'solo') {
        eligibleUsers
          .filter((u) => !getUserProgress(u.callSign).teamName)
          .forEach((u) => {
            const uProg = getUserProgress(u.callSign);
            rows.push({
              pos: 0,
              name: u.callSign,
              kind: 'solo',
              score: uProg.score,
              stagesCompleted: uProg.stagesCompleted,
              currentStage: Math.min(7, uProg.stagesCompleted + 1),
              completionPercentage: Math.round((uProg.stagesCompleted / 7) * 100),
              lastProgress:
                uProg.organizerAuditLog?.[uProg.organizerAuditLog.length - 1]?.timestamp ||
                u.registeredAt,
              studentClass: u.studentClass,
            });
          });
      }

      if (tab === 'all' || tab === 'team') {
        const teamMap = new Map<
          string,
          { score: number; stagesCompleted: number; lastProgress?: string; members: string[] }
        >();
        eligibleUsers.forEach((u) => {
          const uProg = getUserProgress(u.callSign);
          if (uProg.teamName) {
            const current = teamMap.get(uProg.teamName) || {
              score: 0,
              stagesCompleted: 0,
              members: [],
            };
            current.members.push(u.callSign);
            teamMap.set(uProg.teamName, {
              score: Math.max(current.score, uProg.score),
              stagesCompleted: Math.max(current.stagesCompleted, uProg.stagesCompleted),
              lastProgress:
                uProg.organizerAuditLog?.[uProg.organizerAuditLog.length - 1]?.timestamp ||
                u.registeredAt,
              members: current.members,
            });
          }
        });

        Array.from(teamMap.entries()).forEach(([teamName, data]) => {
          rows.push({
            pos: 0,
            name: teamName,
            kind: 'team',
            score: data.score,
            stagesCompleted: data.stagesCompleted,
            currentStage: Math.min(7, data.stagesCompleted + 1),
            completionPercentage: Math.round((data.stagesCompleted / 7) * 100),
            lastProgress: data.lastProgress,
            members: data.members,
            teamSize: data.members.length,
          });
        });
      }

      rows.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.stagesCompleted !== a.stagesCompleted) return b.stagesCompleted - a.stagesCompleted;
        return a.name.localeCompare(b.name);
      });

      const ranked = rows.map((item, idx) => ({
        ...item,
        pos: idx + 1,
      }));

      if (!cancelled) {
        setEntries(ranked);
        setLoading(false);
      }
    }

    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [tab, classFilter, isExcluded, user.callSign]);

  const topThree = entries.slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Intelligence Standings / Case TLS-0017"
        title="Investigation Leaderboard"
        description="Public operational standings for student teams and independent operatives. Verified records and competitive puzzle advances unsealed in real time."
      />

      {/* Exclusion indicator banner if the active user is an administrator, developer, or insider */}
      {isExcluded && (
        <div className="p-4 mb-6 bg-[#17110d] border border-[#52331c] text-[#e0bfa0] flex items-start gap-3 shadow-lg">
          <div className="p-1.5 bg-[#2b170c] border border-[#7a4823] text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert size={16} />
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 uppercase tracking-wider">
                UNRANKED ACCOUNT // TESTING &amp; ADMINISTRATIVE CLEARANCE
              </span>
              <span className="text-[10px] bg-amber-950/80 border border-amber-600/70 text-amber-300 px-1.5 py-0.2">
                EXCLUDED FROM PUBLIC BOARD
              </span>
            </div>
            <p className="text-[11px] text-[#c7ab93] leading-relaxed m-0">
              This operative account has testing, developer, or administrative clearance and is excluded
              from public competition standings and prize rankings. Your progress and stage answers remain
              fully verified for technical auditing.
            </p>
          </div>
        </div>
      )}

      {/* Top-3 Podium (Visible when entries exist) */}
      {entries.length >= 1 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">
            <span>FIELD LEADERS // TOP 3 RECONNAISSANCE</span>
            <span className="text-[11px] text-amber-400/80 font-bold">CASE STATUS: ACTIVE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2nd Place (Silver) */}
            {topThree[1] ? (
              <div
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  setSelectedProfile(topThree[1]);
                }}
                className="order-2 md:order-1 p-4 bg-[#141514] border border-[#383734] hover:border-slate-400 transition cursor-pointer relative group flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-slate-300/10 border border-slate-400 text-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                      2
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Silver Standing
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-[#1b1c1b] border border-border text-muted-foreground">
                    {topThree[1].kind === 'team' ? 'TEAM UNIT' : 'SOLO'}
                  </span>
                </div>
                <div className="my-3">
                  <h3 className="font-serif text-xl font-light text-foreground group-hover:text-white transition-colors">
                    {topThree[1].name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs font-mono text-muted-foreground">
                    <span>{topThree[1].stagesCompleted}/7 Stages</span>
                    <span>·</span>
                    <span>{topThree[1].completionPercentage}% Progress</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#222120] flex justify-between items-center font-mono">
                  <span className="text-[11px] text-muted-foreground">Score</span>
                  <span className="text-base font-bold text-foreground">{topThree[1].score} pts</span>
                </div>
              </div>
            ) : (
              <div className="order-2 md:order-1 p-4 bg-[#10100f] border border-dashed border-[#262624] text-center font-mono text-xs text-muted-foreground flex items-center justify-center">
                Position #2 Open
              </div>
            )}

            {/* 1st Place (Gold) */}
            {topThree[0] ? (
              <div
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  setSelectedProfile(topThree[0]);
                }}
                className="order-1 md:order-2 p-5 bg-[#171613] border-2 border-amber-500/60 hover:border-amber-400 transition cursor-pointer relative group flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.1)]"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="size-7 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center font-mono text-sm font-bold">
                      1
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                      Gold Standing
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-amber-950/40 border border-amber-600/50 text-amber-300 font-bold">
                    {topThree[0].kind === 'team' ? 'TEAM UNIT' : 'SOLO OPERATIVE'}
                  </span>
                </div>
                <div className="my-4">
                  <h3 className="font-serif text-2xl font-light text-amber-100 group-hover:text-amber-300 transition-colors">
                    {topThree[0].name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-amber-200/70">
                    <span>{topThree[0].stagesCompleted}/7 Stages</span>
                    <span>·</span>
                    <span>{topThree[0].completionPercentage}% Cleared</span>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-amber-900/40 flex justify-between items-center font-mono">
                  <span className="text-[11px] text-amber-400/80">Leading Score</span>
                  <span className="text-xl font-bold text-amber-300">{topThree[0].score} pts</span>
                </div>
              </div>
            ) : (
              <div className="order-1 md:order-2 p-4 bg-[#10100f] border border-dashed border-[#262624] text-center font-mono text-xs text-muted-foreground flex items-center justify-center">
                Position #1 Open
              </div>
            )}

            {/* 3rd Place (Bronze) */}
            {topThree[2] ? (
              <div
                onClick={() => {
                  tacticalAudio.playButtonClick();
                  setSelectedProfile(topThree[2]);
                }}
                className="order-3 p-4 bg-[#141514] border border-[#383734] hover:border-amber-700/60 transition cursor-pointer relative group flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-amber-900/20 border border-amber-700 text-amber-600 flex items-center justify-center font-mono text-xs font-bold">
                      3
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-amber-600">
                      Bronze Standing
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-[#1b1c1b] border border-border text-muted-foreground">
                    {topThree[2].kind === 'team' ? 'TEAM UNIT' : 'SOLO'}
                  </span>
                </div>
                <div className="my-3">
                  <h3 className="font-serif text-xl font-light text-foreground group-hover:text-white transition-colors">
                    {topThree[2].name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs font-mono text-muted-foreground">
                    <span>{topThree[2].stagesCompleted}/7 Stages</span>
                    <span>·</span>
                    <span>{topThree[2].completionPercentage}% Progress</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#222120] flex justify-between items-center font-mono">
                  <span className="text-[11px] text-muted-foreground">Score</span>
                  <span className="text-base font-bold text-foreground">{topThree[2].score} pts</span>
                </div>
              </div>
            ) : (
              <div className="order-3 p-4 bg-[#10100f] border border-dashed border-[#262624] text-center font-mono text-xs text-muted-foreground flex items-center justify-center">
                Position #3 Open
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Toolbar: Entity Tabs + School Class Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setTab('all');
            }}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              tab === 'all'
                ? 'bg-crimson text-white font-bold'
                : 'bg-[#151514] text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            All Units
          </button>
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setTab('team');
            }}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              tab === 'team'
                ? 'bg-crimson text-white font-bold'
                : 'bg-[#151514] text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            Teams Roster
          </button>
          <button
            onClick={() => {
              tacticalAudio.playButtonClick();
              setTab('solo');
            }}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              tab === 'solo'
                ? 'bg-crimson text-white font-bold'
                : 'bg-[#151514] text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            Solo Operatives
          </button>
        </div>

        {/* Class Filter Dropdown */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <Filter size={13} className="text-muted-foreground" />
          <span className="text-muted-foreground uppercase text-[11px]">Class Filter:</span>
          <select
            value={classFilter}
            onChange={(e) => {
              tacticalAudio.playButtonClick();
              setClassFilter(e.target.value);
            }}
            className="bg-[#141514] border border-[#2a2927] text-[#ebe6dc] px-2.5 py-1 text-xs font-mono focus:border-crimson focus:outline-none"
          >
            <option value="all">All Divisions</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="panel p-0 overflow-hidden shadow-lg border border-border">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[60px_1fr_100px_90px_120px_110px_130px] gap-3 p-3.5 border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground bg-[#111211]">
              <span>Rank</span>
              <span>Investigator Entity</span>
              <span>Unit Type</span>
              <span>Stage</span>
              <span>Completion</span>
              <span className="text-right">Total Score</span>
              <span className="text-right">Last Solve (IST)</span>
            </div>

            <div className="divide-y divide-border font-mono text-xs">
              {/* Active user entry (Always visible for personal benchmarking) */}
              <div className="grid grid-cols-[60px_1fr_100px_90px_120px_110px_130px] gap-3 p-3.5 items-center bg-[#201514] border-l-2 border-l-crimson">
                <span className={isExcluded ? 'text-amber-400 font-bold text-[11px]' : 'text-crimson font-bold'}>
                  {isExcluded ? 'UNRANKED' : '—'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm text-foreground font-medium block">
                      {user.callSign} (You)
                    </span>
                    {isExcluded && (
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-950/80 border border-amber-600 text-amber-300">
                        ADMIN/TEST
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {user.studentClass || 'Class 9'}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {progress.teamName ? `Team: ${progress.teamName}` : 'Solo'}
                </span>
                <span className="text-muted-foreground">Stage 0{progress.activeStage || 1}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-[#151514] rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-crimson"
                      style={{ width: `${Math.round((progress.stagesCompleted / 7) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round((progress.stagesCompleted / 7) * 100)}%
                  </span>
                </div>
                <span className="text-right text-crimson font-bold">{progress.score} pts</span>
                <span className="text-right text-[10px] text-muted-foreground">Personal Record</span>
              </div>

              {/* Verified Entries List */}
              {loading ? (
                <div className="p-10 text-center text-muted-foreground font-mono text-xs animate-pulse">
                  Querying verified intelligence standings...
                </div>
              ) : entries.length > 0 ? (
                entries.map((item) => (
                  <div
                    key={`${item.pos}-${item.name}`}
                    onClick={() => {
                      tacticalAudio.playButtonClick();
                      setSelectedProfile(item);
                    }}
                    className="grid grid-cols-[60px_1fr_100px_90px_120px_110px_130px] gap-3 p-3.5 items-center hover:bg-[#161716] transition-colors cursor-pointer group"
                  >
                    <span className="font-bold flex items-center gap-1">
                      {item.pos === 1 ? (
                        <span className="text-amber-400 font-bold">🥇 1</span>
                      ) : item.pos === 2 ? (
                        <span className="text-slate-300 font-bold">🥈 2</span>
                      ) : item.pos === 3 ? (
                        <span className="text-amber-600 font-bold">🥉 3</span>
                      ) : (
                        <span className="text-muted-foreground">#{item.pos}</span>
                      )}
                    </span>
                    <div>
                      <span className="font-serif text-sm text-foreground group-hover:text-crimson font-medium block transition-colors">
                        {item.name}
                      </span>
                      {item.studentClass && (
                        <span className="text-[10px] text-muted-foreground">{item.studentClass}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#181918] border border-border text-muted-foreground inline-block w-fit">
                      {item.kind === 'team' ? `TEAM (${item.teamSize ?? 2})` : 'SOLO'}
                    </span>
                    <span className="text-muted-foreground text-xs">Stage 0{item.currentStage}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#151514] rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${item.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {item.stagesCompleted}/7
                      </span>
                    </div>
                    <span className="text-right text-foreground font-bold">{item.score} pts</span>
                    <span className="text-right text-[10px] text-muted-foreground">
                      {item.lastProgress ? formatToIST(item.lastProgress) : '—'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-muted-foreground font-mono text-xs">
                  <p>No verified public participants recorded under this filter.</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    Leaderboard records reflect live solves as eligible students submit verified stage answers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Explanation & Rules Card */}
      <div className="mt-8 p-5 bg-[#141514] border border-[#2a2927] space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-foreground font-bold uppercase tracking-wider border-b border-border pb-2">
          <Info size={14} className="text-crimson" />
          <span>Case TLS-0017 Scoring Model &amp; Point Breakdown</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground text-[11px] leading-relaxed">
          <div className="p-3 bg-[#0e0f0e] border border-border space-y-1">
            <strong className="text-foreground block">1. Base Challenge Points</strong>
            <span>100 points awarded for every verified stage clearance across Stages 01 through 07 (700 base points total).</span>
          </div>
          <div className="p-3 bg-[#0e0f0e] border border-border space-y-1">
            <strong className="text-foreground block">2. Hourly Speed Bonus</strong>
            <span>Up to +24 bonus points per stage for early puzzle submission (1 pt per hour remaining in the 48h wave window).</span>
          </div>
          <div className="p-3 bg-[#0e0f0e] border border-border space-y-1">
            <strong className="text-foreground block">3. Target Intercept Bonus</strong>
            <span>+20 bonus points on Stage 04 for correctly deducing and designating Site 04 (Presidio Observation Outpost).</span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground flex justify-between items-center pt-1 border-t border-[#222120]">
          <span>Maximum theoretical score: 888 points</span>
          <span className="text-amber-400">Ties resolved chronologically by earliest verified solve timestamp</span>
        </div>
      </div>

      {/* Investigator / Team Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#141514] border border-border max-w-md w-full p-6 space-y-5 text-foreground shadow-2xl relative font-mono text-xs">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="size-10 rounded-full bg-crimson/20 border border-crimson text-crimson flex items-center justify-center font-bold text-sm">
                #{selectedProfile.pos}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">
                  {selectedProfile.kind === 'team' ? 'TEAM RECONNAISSANCE UNIT' : 'SOLO INVESTIGATOR'}
                </span>
                <h3 className="font-serif text-xl font-light text-foreground">{selectedProfile.name}</h3>
              </div>
            </div>

            <div className="space-y-2 bg-[#0e0f0e] p-4 border border-border">
              <div className="flex justify-between border-b border-[#222120] pb-1.5">
                <span className="text-muted-foreground">TOTAL SCORE:</span>
                <span className="font-bold text-crimson">{selectedProfile.score} PTS</span>
              </div>
              <div className="flex justify-between border-b border-[#222120] pb-1.5">
                <span className="text-muted-foreground">STAGES CLEARED:</span>
                <span className="text-foreground">{selectedProfile.stagesCompleted} of 07</span>
              </div>
              <div className="flex justify-between border-b border-[#222120] pb-1.5">
                <span className="text-muted-foreground">CURRENT ACTIVE SECTOR:</span>
                <span className="text-foreground">Sector 0{selectedProfile.currentStage}</span>
              </div>
              <div className="flex justify-between border-b border-[#222120] pb-1.5">
                <span className="text-muted-foreground">COMPLETION:</span>
                <span className="text-emerald-400 font-bold">{selectedProfile.completionPercentage}%</span>
              </div>
              {selectedProfile.studentClass && (
                <div className="flex justify-between border-b border-[#222120] pb-1.5">
                  <span className="text-muted-foreground">DIVISION / CLASS:</span>
                  <span className="text-foreground">{selectedProfile.studentClass}</span>
                </div>
              )}
              {selectedProfile.members && (
                <div className="flex justify-between border-b border-[#222120] pb-1.5">
                  <span className="text-muted-foreground">ENROLLED MEMBERS:</span>
                  <span className="text-foreground">{selectedProfile.members.join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-[11px]">
                <span className="text-muted-foreground">LAST VERIFIED ACTIVITY:</span>
                <span className="text-foreground">
                  {selectedProfile.lastProgress ? formatToIST(selectedProfile.lastProgress) : 'Record Sealed'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedProfile(null)}
                className="button button-secondary w-full text-xs font-mono py-2"
              >
                Close Investigator Docket
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* =========================================================================
   12. TEAM VIEW (Full Authoritative Supabase & Server Team Management)
   ========================================================================= */

function TeamView({
  user,
  progress,
  onUpdateProgress,
}: {
  user: PrototypeUser;
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
}) {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamInput, setTeamInput] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copied, setCopied] = useState(false);

  // Load team data on mount and whenever user changes
  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchMyTeam(user);
      if (res.inTeam && res.team) {
        setTeamData(res.team);
        if (progress.teamName !== res.team.name || progress.teamCode !== res.team.inviteCode) {
          onUpdateProgress((prev) => ({
            ...prev,
            teamName: res.team!.name,
            teamCode: res.team!.inviteCode,
          }));
        }
      } else {
        setTeamData(null);
        if (progress.teamName) {
          onUpdateProgress((prev) => ({
            ...prev,
            teamName: null,
            teamCode: null,
          }));
        }
      }
    } catch (err) {
      console.warn('[TeamView] Failed to fetch team dossier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [user.callSign]);

  // Handle creating a new team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = teamInput.trim();
    if (cleanName.length < 3 || cleanName.length > 40) {
      setStatusMsg({ text: 'Team designation must be between 3 and 40 characters.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await createTeamAction(cleanName, user, progress, onUpdateProgress);
      if (res.success && res.team) {
        setTeamData(res.team);
        setTeamInput('');
        setStatusMsg({ text: res.message, type: 'success' });
      } else {
        setStatusMsg({ text: res.message || 'Team creation rejected by registry.', type: 'error' });
      }
    } catch (err) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'Failed to establish unit in registry.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle joining an existing team by invite code
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinInput.trim().toUpperCase();
    if (!cleanCode) {
      setStatusMsg({ text: 'Please enter a valid team invite code.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await joinTeamAction(cleanCode, user, progress, onUpdateProgress);
      if (res.success) {
        setJoinInput('');
        setStatusMsg({ text: res.message, type: 'success' });
        await loadTeamData();
      } else {
        setStatusMsg({ text: res.message || 'Invalid or rejected invite code.', type: 'error' });
      }
    } catch (err) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'Database verification failed.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle departing current team
  const handleLeaveTeam = async () => {
    const isLead = teamData?.isCreator;
    const confirmPrompt = isLead
      ? 'Are you sure you want to depart this tactical unit? If all members depart, the unit will be retired.'
      : 'Depart your current tactical unit and revert to Solo Operative?';

    if (!confirm(confirmPrompt)) return;

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await leaveTeamAction(user, onUpdateProgress);
      if (res.success) {
        setTeamData(null);
        setStatusMsg({ text: res.message, type: 'info' });
        await loadTeamData();
      } else {
        setStatusMsg({ text: res.message || 'Could not depart unit.', type: 'error' });
      }
    } catch (err) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'Departure error.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rotating invite code (Lead Operative only)
  const handleRotateCode = async () => {
    if (!confirm('Rotate team invite code? The previous code will become invalid immediately.')) return;
    setIsSubmitting(true);
    try {
      const res = await rotateInviteCodeAction(user);
      if (res.success && res.inviteCode) {
        if (teamData) {
          setTeamData({ ...teamData, inviteCode: res.inviteCode });
        }
        onUpdateProgress((prev) => ({ ...prev, teamCode: res.inviteCode! }));
        setStatusMsg({ text: `Invite code updated to ${res.inviteCode}. Share this with new recruits.`, type: 'success' });
      } else {
        setStatusMsg({ text: res.message || 'Failed to cycle invite code.', type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: 'Error rotating invite code.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Copy Invite Code
  const handleCopyCode = () => {
    const code = teamData?.inviteCode || progress.teamCode;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <PageHeader
        eyebrow="Departmental Team Registry / Maximum 5 Operatives"
        title="Tactical Team Dossier"
        description="Investigators may operate solo or form an allied unit of up to five operatives. Team members coordinate stage clearances and share location deduction findings."
      />

      {statusMsg && (
        <div
          className={`mb-6 p-3.5 border font-mono text-xs flex items-center justify-between transition-all ${
            statusMsg.type === 'success'
              ? 'bg-[#18261b] border-[#36613d] text-[#9ae0a3]'
              : statusMsg.type === 'error'
              ? 'bg-[#291717] border-[#662828] text-[#f89b9b]'
              : 'bg-[#1b2229] border-[#2f4b66] text-[#9fc2e6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider">
              [{statusMsg.type.toUpperCase()}]
            </span>
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs opacity-60 hover:opacity-100 font-mono px-1"
          >
            DISMISS
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="panel p-12 text-center">
          <RefreshCw size={24} className="animate-spin text-accent mx-auto mb-3" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Verifying Unit Registry with Supabase...
          </p>
        </div>
      ) : teamData || progress.teamName ? (
        /* Team Enlisted State */
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="panel lg:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-line-soft pb-5 gap-4">
              <div>
                <span className="eyebrow block">OFFICIAL UNIT DESIGNATION</span>
                <h2 className="font-serif text-3xl font-light text-foreground">
                  {teamData?.name || progress.teamName}
                </h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="font-mono text-xs text-muted-foreground">
                    Invite Code:
                  </span>
                  <span className="font-mono text-xs text-accent font-semibold tracking-wider bg-[#1a1918] px-2 py-0.5 border border-border">
                    {teamData?.inviteCode || progress.teamCode || 'TLS-PENDING'}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="button button-secondary text-[11px] py-0.5 px-2 flex items-center gap-1.5"
                    title="Copy invite code to clipboard"
                  >
                    {copied ? <Check size={12} className="text-[#8bb393]" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  {teamData?.isCreator && (
                    <button
                      onClick={handleRotateCode}
                      disabled={isSubmitting}
                      className="button button-secondary text-[11px] py-0.5 px-2 flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      title="Generate a new invite code"
                    >
                      <RefreshCw size={12} className={isSubmitting ? 'animate-spin' : ''} />
                      <span>Rotate Code</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="status-pill open">ACTIVE TACTICAL UNIT</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {teamData?.isCreator ? 'You are Lead Operative' : 'Allied Investigator'}
                </span>
              </div>
            </div>

            {/* Team Members Roster */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Active Operatives ({teamData?.members.length || 1} / {teamData?.maxSize || 5})
                </p>
                <button
                  onClick={loadTeamData}
                  disabled={isLoading || isSubmitting}
                  className="font-mono text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                  <span>Refresh Roster</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {(teamData?.members && teamData.members.length > 0) ? (
                  teamData.members.map((member, idx) => (
                    <div
                      key={member.callSign || idx}
                      className="flex items-center justify-between p-3.5 bg-[#111110] border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="avatar">
                          {member.callSign.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-base text-foreground">
                              {member.fullName || member.callSign}
                            </h4>
                            {member.isCreator && (
                              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[#26241b] text-[#d4af37] border border-[#524a2c]">
                                Lead Operative
                              </span>
                            )}
                            {member.callSign.toLowerCase() === user.callSign.toLowerCase() && (
                              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[#1c241e] text-[#8bb393] border border-[#2f4f34]">
                                You
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            @{member.callSign}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs text-[#8bb393]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8bb393] inline-block animate-pulse" />
                        <span>Connected</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between p-3.5 bg-[#111110] border border-border">
                    <div className="flex items-center gap-3">
                      <span className="avatar">{user.callSign.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-base text-foreground">{user.fullName}</h4>
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[#26241b] text-[#d4af37] border border-[#524a2c]">
                            Lead Operative
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          @{user.callSign} (You)
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#8bb393]">Connected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-5 border-t border-line-soft flex flex-wrap justify-between items-center gap-4">
              <span className="font-mono text-xs text-muted-foreground">
                Capacity: {teamData?.members.length || 1} / {teamData?.maxSize || 5} Operatives
              </span>
              <button
                onClick={handleLeaveTeam}
                disabled={isSubmitting}
                className="button button-secondary text-xs text-crimson hover:bg-[#2b1414] border-crimson/40"
              >
                {teamData?.isCreator ? 'Disband / Depart Unit' : 'Leave Unit'}
              </button>
            </div>
          </div>

          {/* Right Sidebar Info */}
          <div className="space-y-6">
            <div className="panel">
              <div className="panel-heading">
                <span>TEAM PROTOCOLS</span>
                <Users size={14} />
              </div>
              <ul className="font-serif text-sm leading-relaxed text-muted-foreground space-y-3">
                <li>
                  <strong className="text-foreground">Shared Progression:</strong> Submitting a correct challenge solution unlocks that stage for every operative in your unit.
                </li>
                <li>
                  <strong className="text-foreground">Location Intercept:</strong> Only one coordinate hypothesis may be lodged per unit in Stage 4. Coordinate with your team before lodging.
                </li>
                <li>
                  <strong className="text-foreground">Roster Lock:</strong> Once the investigation launches, unit rosters are locked to maintain competition integrity.
                </li>
              </ul>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <span>DATABASE REGISTRY</span>
                <ShieldAlert size={14} />
              </div>
              <p className="font-serif text-xs leading-relaxed text-muted-foreground mb-3">
                All team assignments and invite codes are verified against the authoritative database.
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#8bb393]">
                <span className="w-2 h-2 rounded-full bg-[#8bb393]" />
                <span>Authoritative Verification Active</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State for Solo Operative */
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Create Team Form */}
          <div className="panel space-y-5">
            <div className="panel-heading">
              <span>FORM TACTICAL UNIT</span>
              <UserPlus size={14} />
            </div>
            <h3 className="font-serif text-2xl font-light text-foreground">
              Establish a New Allied Unit
            </h3>
            <p className="font-serif text-sm text-muted-foreground leading-relaxed">
              Forming a tactical unit allows up to five investigators to combine efforts. As team lead,
              you will receive a unique cryptographic invite code to share with your teammates.
            </p>

            <form onSubmit={handleCreateTeam} className="pt-2 space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Unit Designation (3–40 characters)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Presidio Night Watch"
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-[#111110] border border-border p-2.5 font-mono text-xs flex-1 text-foreground focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || teamInput.trim().length < 3}
                  className="button button-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Forming...</span>
                    </>
                  ) : (
                    <>
                      <Users size={14} />
                      <span>Form Unit</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                Note: Creating a unit will convert your account status from Solo Operative to Team Lead.
              </p>
            </form>
          </div>

          {/* Join Team Form */}
          <div className="panel space-y-5">
            <div className="panel-heading">
              <span>JOIN EXISTING UNIT</span>
              <Key size={14} />
            </div>
            <h3 className="font-serif text-2xl font-light text-foreground">
              Have an Invite Code?
            </h3>
            <p className="font-serif text-sm text-muted-foreground leading-relaxed">
              If your lead operative has already established a unit, enter their invite code below to
              join their roster and synchronize your investigation dossier.
            </p>

            <form onSubmit={handleJoinTeam} className="pt-2 space-y-3">
              <label className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Enter Unit Invite Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TLS-904B2C or 904B2C"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-[#111110] border border-border p-2.5 font-mono text-xs flex-1 text-foreground uppercase tracking-widest focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !joinInput.trim()}
                  className="button button-secondary flex items-center gap-2 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      <span>Enlist in Unit</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8bb393]" />
                <span>Validated against departmental database registry</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================================
   13. ACCOUNT & SAFETY VIEW
   ========================================================================= */

function AccountView({
  user,
  progress,
  onUpdateProgress,
  onLogout,
  onTriggerDirectorReplay,
}: {
  user: PrototypeUser;
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onLogout: () => void;
  onTriggerDirectorReplay?: () => void;
}) {
  const [fullName, setFullName] = useState(user.fullName);
  const [studentClass, setStudentClass] = useState(user.studentClass);
  const [feedback, setFeedback] = useState('');
  const [audioSettings, setAudioSettings] = useState(() => tacticalAudio.getState());

  useEffect(() => {
    return tacticalAudio.subscribe((state) => {
      setAudioSettings(state);
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('Profile preview details updated locally.');
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <>
      <PageHeader
        eyebrow="Personal Record / Investigator Preferences"
        title="Account &amp; Safety"
        description="Review your registered operative identification, privacy protections, and safety controls."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profile Card */}
        <form onSubmit={handleSave} className="panel space-y-4">
          <div className="panel-heading">
            <span>REGISTERED OPERATIVE PROFILE</span>
            <UserRound size={14} />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase text-muted-foreground mb-1">
              Investigator Call-Sign (Fixed)
            </label>
            <input
              type="text"
              value={user.callSign}
              readOnly
              className="w-full bg-[#161514] border border-border p-2 font-mono text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase text-muted-foreground mb-1">
              Admission Number (Protected)
            </label>
            <input
              type="text"
              value={user.admissionNumberMasked}
              readOnly
              className="w-full bg-[#161514] border border-border p-2 font-mono text-sm text-muted-foreground cursor-not-allowed"
            />
            <span className="font-mono text-[10px] text-muted-foreground mt-1 block">
              Admission credentials are protected and never revealed to other participants.
            </span>
          </div>

          <div>
            <label className="block font-mono text-xs uppercase text-muted-foreground mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#111110] border border-border p-2 font-mono text-sm text-foreground focus:outline-none focus:border-crimson"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase text-muted-foreground mb-1">
              School Class
            </label>
            <select
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="w-full bg-[#111110] border border-border p-2 font-mono text-sm text-foreground focus:outline-none focus:border-crimson"
            >
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button type="submit" className="button button-primary">
              Save Details
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="button button-secondary text-crimson"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
          {feedback && <p className="font-mono text-xs text-[#8bb393] mt-2">{feedback}</p>}
        </form>

        {/* Safety & Audio Controls */}
        <div className="panel space-y-6">
          <div className="panel-heading">
            <span>SOUND DESIGN &amp; SAFETY CONTROLS</span>
            <ShieldAlert size={14} className="text-crimson" />
          </div>

          <div className="space-y-4">
            {/* Tactical SFX Setting */}
            <div className="p-3 bg-[#111110] border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-foreground block font-mono text-xs uppercase tracking-wider">
                    Tactical Interface Sound Effects (SFX)
                  </strong>
                  <p className="text-muted-foreground text-[11px] font-mono m-0">
                    Mechanical menu relays, dossier document rustle, typewriter keystrokes, and validation chimes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => tacticalAudio.toggleSfxMute()}
                  className={`status-pill cursor-pointer ml-3 shrink-0 ${
                    !audioSettings.sfxMuted ? 'available' : ''
                  }`}
                >
                  {!audioSettings.sfxMuted ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>
              {!audioSettings.sfxMuted && (
                <div className="pt-2 border-t border-line-soft flex items-center gap-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioSettings.sfxVolume}
                    onChange={(e) => tacticalAudio.setSfxVolume(parseFloat(e.target.value))}
                    className="w-full accent-crimson cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                    {Math.round(audioSettings.sfxVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Ambient Soundscape Setting */}
            <div className="p-3 bg-[#111110] border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-foreground block font-mono text-xs uppercase tracking-wider">
                    Atmospheric Ambience (Wind &amp; Static)
                  </strong>
                  <p className="text-muted-foreground text-[11px] font-mono m-0">
                    Subtle procedural nighttime coastal wind and distant shortwave radio crackle.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => tacticalAudio.toggleAmbientMute()}
                  className={`status-pill cursor-pointer ml-3 shrink-0 ${
                    !audioSettings.ambientMuted ? 'available' : ''
                  }`}
                >
                  {!audioSettings.ambientMuted ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>
              {!audioSettings.ambientMuted && (
                <div className="pt-2 border-t border-line-soft flex items-center gap-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioSettings.ambientVolume}
                    onChange={(e) => tacticalAudio.setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full accent-crimson cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                    {Math.round(audioSettings.ambientVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Rain Ambience Setting */}
            <div className="p-3 bg-[#111110] border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-foreground block font-mono text-xs uppercase tracking-wider">
                    Atmospheric Rain Ambience
                  </strong>
                  <p className="text-muted-foreground text-[11px] font-mono m-0">
                    Continuous procedural rainfall wash synthesized through filtered Web Audio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => tacticalAudio.toggleRainMute()}
                  className={`status-pill cursor-pointer ml-3 shrink-0 ${
                    !audioSettings.rainMuted ? 'available' : ''
                  }`}
                >
                  {!audioSettings.rainMuted ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>
              {!audioSettings.rainMuted && (
                <div className="pt-2 border-t border-line-soft flex items-center gap-3">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioSettings.rainVolume}
                    onChange={(e) => tacticalAudio.setRainVolume(parseFloat(e.target.value))}
                    className="w-full accent-crimson cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                    {Math.round(audioSettings.rainVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Reduced Scare Mode */}
            <div
              onClick={() =>
                onUpdateProgress((prev) => ({
                  ...prev,
                  reducedScareMode: !prev.reducedScareMode,
                }))
              }
              className="p-3 bg-[#181413] border border-[#3b2422] flex items-center justify-between cursor-pointer"
            >
              <div>
                <strong className="text-foreground block font-mono text-xs uppercase tracking-wider text-crimson mb-0.5">
                  Reduced-Scare Mode
                </strong>
                <p className="text-muted-foreground text-xs font-mono m-0">
                  Substitutes high-intensity auditory and visual cues with calm teletype transcripts.
                </p>
              </div>
              <span className={`status-pill ${progress.reducedScareMode ? 'available' : ''}`}>
                {progress.reducedScareMode ? 'ACTIVE' : 'OFF'}
              </span>
            </div>

            <div className="p-3 bg-[#111110] border border-border">
              <strong className="text-foreground block font-mono text-xs uppercase tracking-wider mb-1">
                Fictional Investigation Notice
              </strong>
              <p className="text-muted-foreground text-xs font-mono leading-relaxed m-0">
                All communications, transcripts, and evidence are student mystery fiction. Never attempt
                to visit any real-world coordinates or contact emergency services.
              </p>
            </div>

            {onTriggerDirectorReplay && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    tacticalAudio.playButtonClick();
                    onTriggerDirectorReplay();
                  }}
                  className="button button-secondary w-full text-xs font-mono py-2.5 flex items-center justify-center gap-2 border-border hover:border-foreground"
                >
                  <RotateCcw size={14} className="text-crimson" />
                  <span>Replay Director Case Orientation Briefing</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================================
   14. ADMIN / STAFF CONSOLE (Protected Surface)
   ========================================================================= */

function AdminView({
  progress,
  onUpdateProgress,
}: {
  progress?: UserProgress;
  onUpdateProgress?: (updater: (prev: UserProgress) => UserProgress) => void;
}) {
  if (!progress || !onUpdateProgress) {
    return null;
  }
  return <StaffRoomView progress={progress} onUpdateProgress={onUpdateProgress} />;
}

