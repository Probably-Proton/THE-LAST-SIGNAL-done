/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * THE LAST SIGNAL — POST-ENDING CORRUPTED AFTERMATH OVERLAY
 * 
 * Renders the persistent post-ending atmosphere:
 * - Subtle perimeter cracked-glass fracture artifacts
 * - Diagnostic status badge in the viewport
 * - Reversible toggle control so investigators can view clean documents or return to aftermath mode
 */

import React from 'react';
import { AlertTriangle, Eye, EyeOff, Radio, RotateCcw } from 'lucide-react';

interface CrackedScreenAftermathOverlayProps {
  isAftermathActive: boolean;
  isDismissed: boolean;
  onToggleDismiss: () => void;
  onReplayEnding?: () => void;
}

export const CrackedScreenAftermathOverlay: React.FC<CrackedScreenAftermathOverlayProps> = ({
  isAftermathActive,
  isDismissed,
  onToggleDismiss,
  onReplayEnding,
}) => {
  if (!isAftermathActive) return null;

  return (
    <>
      {/* Subtle Persistent Cracked Glass Perimeter (Hidden if user toggled diagnostic mode) */}
      {!isDismissed && (
        <div className="fixed inset-0 pointer-events-none z-[99990] overflow-hidden">
          <svg
            className="w-full h-full opacity-40 mix-blend-screen"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            {/* Top right corner fracture */}
            <path
              d="M1000,0 L920,80 L880,180 M920,80 L800,40 M920,80 L960,200 L1000,240"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            {/* Bottom left corner fracture */}
            <path
              d="M0,1000 L80,910 L160,860 M80,910 L40,820 M80,910 L190,950 L240,1000"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            {/* Subtle hairline viewport fractures */}
            <line x1="0" y1="320" x2="60" y2="340" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" />
            <line x1="940" y1="710" x2="1000" y2="730" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" />
          </svg>
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/35 pointer-events-none" />
        </div>
      )}

      {/* Floating Tactical Aftermath Indicator Strip */}
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[99991] flex items-center gap-2 bg-[#0c0908]/95 border border-red-900/80 px-3 py-1.5 shadow-[0_4px_25px_rgba(180,20,20,0.35)] backdrop-blur text-xs font-mono">
        <div className="flex items-center gap-2 text-red-400">
          <Radio size={13} className="animate-pulse text-red-500" />
          <span className="font-bold tracking-widest text-[11px] hidden sm:inline">
            {isDismissed ? 'DIAGNOSTIC MODE' : 'SIGNAL LOST // ARCHIVE SEVERED'}
          </span>
          <span className="font-bold tracking-widest text-[10px] sm:hidden">
            SIGNAL LOST
          </span>
        </div>

        <div className="h-3 w-px bg-red-900/60 mx-1" />

        <button
          onClick={onToggleDismiss}
          className="text-stone-300 hover:text-white flex items-center gap-1.5 text-[10px] tracking-wider transition-colors px-1.5 py-0.5 hover:bg-stone-800/80"
          title={isDismissed ? 'Restore post-ending corrupted visuals' : 'Switch to clean diagnostic view'}
        >
          {isDismissed ? <Eye size={12} /> : <EyeOff size={12} />}
          <span>{isDismissed ? 'Restore Glitch View' : 'Diagnostic Mode'}</span>
        </button>

        {onReplayEnding && (
          <button
            onClick={onReplayEnding}
            className="text-amber-400 hover:text-amber-200 flex items-center gap-1 text-[10px] tracking-wider transition-colors px-1.5 py-0.5 hover:bg-amber-950/60 ml-1"
            title="Replay final transmission sequence"
          >
            <RotateCcw size={11} />
            <span className="hidden md:inline">Replay Transmission</span>
          </button>
        )}
      </div>
    </>
  );
};
