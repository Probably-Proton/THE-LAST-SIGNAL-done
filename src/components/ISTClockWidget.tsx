/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IST REAL-TIME CLOCK & DEADLINE COUNTDOWN WIDGET
 * 
 * Displays authoritative Indian Standard Time (Asia/Kolkata / UTC+05:30)
 * and dynamic countdown to active stage scoring deadlines.
 */

import React, { useEffect, useState } from 'react';
import { Clock3, ShieldAlert } from 'lucide-react';
import {
  STAGE_SCHEDULE,
  formatCountdown,
  formatToIST,
  getRemainingTime,
} from '@/src/lib/stageConfig';

interface ISTClockWidgetProps {
  activeStageNumber?: number;
  variant?: 'compact' | 'detailed' | 'banner';
}

export function ISTClockWidget({
  activeStageNumber = 1,
  variant = 'compact',
}: ISTClockWidgetProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeStage =
    STAGE_SCHEDULE.find((s) => s.number === activeStageNumber) ?? STAGE_SCHEDULE[0];
  const msRemaining = getRemainingTime(activeStage.deadlineIso, now);
  const isExpired = msRemaining <= 0;
  const countdownText = formatCountdown(msRemaining);
  const timeStringIST = formatToIST(now);

  if (variant === 'banner') {
    return (
      <div className="bg-[#121413] border border-[#232d26] p-3 text-xs font-mono flex flex-wrap items-center justify-between gap-3 text-[#dcd6c9]">
        <div className="flex items-center gap-2">
          <Clock3 size={15} className="text-crimson animate-pulse" />
          <span className="text-muted-foreground uppercase text-[10px] tracking-wider">
            OFFICIAL TIME (IST):
          </span>
          <span className="text-foreground font-bold tracking-widest">{timeStringIST}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground uppercase">
            STAGE 0{activeStage.number} DEADLINE:
          </span>
          <span
            className={`px-2 py-0.5 border text-[11px] font-bold tracking-wider ${
              isExpired
                ? 'border-red-900 bg-red-950/60 text-red-400'
                : 'border-emerald-900 bg-emerald-950/40 text-emerald-400'
            }`}
          >
            {countdownText}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="panel bg-[#0e1110] border border-border p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-crimson animate-pulse" />
            <span className="text-foreground font-semibold tracking-wider uppercase">
              CHRONOLOGY TELEMETRY // ASIA/KOLKATA
            </span>
          </div>
          <span className="text-crimson font-bold text-[11px]">UTC+05:30</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
          <div className="p-2.5 bg-[#141816] border border-border">
            <span className="text-[10px] text-muted-foreground uppercase block">
              Current Event Time
            </span>
            <strong className="text-sm text-foreground tracking-wider block mt-0.5">
              {timeStringIST}
            </strong>
          </div>

          <div className="p-2.5 bg-[#141816] border border-border">
            <span className="text-[10px] text-muted-foreground uppercase block">
              Stage 0{activeStage.number} Scoring Window
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <strong className="text-xs text-foreground">{activeStage.deadlineIST}</strong>
              <span
                className={`text-[10px] px-1.5 py-0.5 border ${
                  isExpired
                    ? 'border-red-900 text-red-400 bg-red-950/40'
                    : 'border-emerald-800 text-emerald-400 bg-emerald-950/30'
                }`}
              >
                {isExpired ? 'CLOSED' : countdownText}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1">
          <ShieldAlert size={12} className="text-amber-500 shrink-0" />
          <span>
            Solves submitted prior to deadline award 100 base pts + up to 24 hourly bonus points.
            Late submissions enable story progression with 0 competitive points.
          </span>
        </div>
      </div>
    );
  }

  // Compact header badge
  return (
    <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] px-2.5 py-1 bg-[#121614] border border-[#212b24] text-[#cfc9be]">
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        <span className="text-muted-foreground text-[10px]">IST:</span>
        <span className="font-semibold text-foreground tracking-wider">
          {now.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: false,
          })}{' '}
          IST
        </span>
      </div>
      <span className="text-border">|</span>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-[10px]">S0{activeStage.number}:</span>
        <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
          {countdownText}
        </span>
      </div>
    </div>
  );
}
