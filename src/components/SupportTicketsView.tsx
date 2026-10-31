/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPERATIVE SUPPORT TICKETS VIEW
 * 
 * Provides registered investigators with a dedicated interface to:
 * 1. Submit support requests, technical bug reports, or cipher inquiries.
 * 2. Validate input lengths and categories before filing.
 * 3. Inspect their own submitted tickets with authentic status tracking.
 * 4. Review official staff responses.
 * 
 * SECURITY GUARANTEE:
 * Players can only retrieve and view tickets filed under their own authenticated call-sign.
 * Internal staff notes are stripped from player responses.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Inbox,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import type { PrototypeUser } from '@/src/lib/prototypeAuth';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  getPlayerTickets,
  getPlayerTicketsAsync,
  getSupportStorageStatus,
  submitPlayerTicket,
  submitPlayerTicketAsync,
  type SupportTicket,
  type TicketCategory,
  type TicketPriority,
} from '@/src/lib/tickets';
import { tacticalAudio } from '@/src/lib/tacticalAudio';
import { formatToIST } from '@/src/lib/stageConfig';

interface SupportTicketsViewProps {
  user: PrototypeUser;
  onNavigateHome?: () => void;
}

export function SupportTicketsView({ user, onNavigateHome }: SupportTicketsViewProps) {
  const [tickets, setTickets] = useState<Omit<SupportTicket, 'staffNotes'>[]>([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('TECHNICAL_BUG');
  const [priority, setPriority] = useState<TicketPriority>('NORMAL');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const storageStatus = getSupportStorageStatus();

  const loadUserTickets = async () => {
    if (!user?.callSign) return;
    const userList = await getPlayerTicketsAsync(user.callSign);
    setTickets(userList);
    if (userList.length > 0 && !selectedTicketId) {
      setSelectedTicketId(userList[0].id);
    }
  };

  useEffect(() => {
    loadUserTickets();
  }, [user?.callSign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLastSubmittedId(null);

    if (isSubmitting) return;

    setIsSubmitting(true);
    tacticalAudio.playButtonClick();

    try {
      const result = await submitPlayerTicketAsync({
        user,
        subject,
        category,
        priority,
        message,
      });

      if (!result.success || !result.ticket) {
        tacticalAudio.playError();
        setFormError(result.error ?? 'Failed to submit support ticket.');
        setIsSubmitting(false);
        return;
      }

      tacticalAudio.playSuccess();
      setLastSubmittedId(result.ticket.id);
      setSubject('');
      setMessage('');
      setPriority('NORMAL');
      await loadUserTickets();
      setSelectedTicketId(result.ticket.id);
    } catch (err: any) {
      tacticalAudio.playError();
      setFormError(err?.message || 'Error communicating with ticket service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? tickets[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="border-b border-[#2a2927] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#8d8880] mb-1">
              <LifeBuoy size={14} className="text-crimson" />
              <span>CASE TLS-0017 // INVESTIGATION SUPPORT DESK</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#ebe6dc]">
              Operative Support &amp; Help Desk
            </h1>
            <p className="font-serif text-sm text-[#8d8880] mt-1 max-w-2xl">
              File technical anomaly reports, ask for docket clarifications, or report account credential
              issues to event organizers. All tickets are authenticated under your call-sign.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                tacticalAudio.playButtonClick();
                loadUserTickets();
              }}
              className="button button-secondary text-xs font-mono py-2 px-3 flex items-center gap-1.5"
              title="Refresh ticket list"
            >
              <RefreshCw size={13} />
              <span>Refresh Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Persistence Architecture & Security Banner */}
      <div className="p-3.5 bg-[#141514] border border-[#2a2927] text-xs font-mono space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#b0aba0]">
            <Shield size={14} className="text-amber-400" />
            <strong className="text-foreground">PERSISTENCE ARCHITECTURE:</strong>
            <span className="text-amber-300 font-bold uppercase">
              {storageStatus.mode === 'live_supabase' ? 'LIVE SUPABASE ACTIVE' : 'PROTOTYPE LOCAL STORAGE'}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            AUTHENTICATED: {user.callSign}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground m-0 leading-relaxed font-serif">
          {storageStatus.note} Your submitted tickets remain private to your investigator account.
        </p>
      </div>

      {/* Main Grid: Submit Form & Player Ticket List */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: New Ticket Submission Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="panel border-t-2 border-t-crimson p-5 space-y-4">
            <div className="border-b border-[#2a2927] pb-3 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-foreground font-bold flex items-center gap-2">
                <Send size={13} className="text-crimson" />
                Submit New Support Docket
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">ONE-ON-ONE DESK</span>
            </div>

            {lastSubmittedId && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-700/80 text-emerald-200 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <CheckCircle2 size={14} />
                  <span>TICKET DISPATCHED SUCCESSFULLY</span>
                </div>
                <p className="text-[11px] text-emerald-200/90 m-0">
                  Reference: <strong className="text-white select-all">{lastSubmittedId}</strong>.
                  Staff will review your inquiry shortly.
                </p>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-red-950/70 border border-crimson text-red-200 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-300">
                  <AlertCircle size={14} />
                  <span>SUBMISSION VALIDATION FAILED</span>
                </div>
                <p className="text-[11px] m-0">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              {/* Operative Metadata (Auto-populated) */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0e0e0d] border border-[#232220] text-[11px]">
                <div>
                  <span className="text-[9px] uppercase text-muted-foreground block">OPERATIVE</span>
                  <span className="font-bold text-foreground">{user.callSign}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-muted-foreground block">STUDENT CLASS</span>
                  <span className="text-[#a8a39a]">{user.studentClass}</span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Subject Line *
                  </label>
                  <span className={`text-[10px] ${subject.length > 90 ? 'text-crimson' : 'text-muted-foreground'}`}>
                    {subject.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Issue reading margin stamp on EV-0201..."
                  maxLength={100}
                  className="w-full bg-[#0a0a09] border border-[#2a2927] p-2.5 text-xs text-foreground focus:outline-none focus:border-crimson"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-bold">
                  Inquiry Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full bg-[#0a0a09] border border-[#2a2927] p-2.5 text-xs text-foreground focus:outline-none focus:border-crimson"
                  disabled={isSubmitting}
                >
                  <option value="TECHNICAL_BUG">{CATEGORY_LABELS.TECHNICAL_BUG}</option>
                  <option value="CIPHER_CLARIFICATION">{CATEGORY_LABELS.CIPHER_CLARIFICATION}</option>
                  <option value="SCHEDULE_DEADLINE">{CATEGORY_LABELS.SCHEDULE_DEADLINE}</option>
                  <option value="ACCOUNT_CREDENTIALS">{CATEGORY_LABELS.ACCOUNT_CREDENTIALS}</option>
                  <option value="OTHER_INQUIRY">{CATEGORY_LABELS.OTHER_INQUIRY}</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-bold">
                  Severity / Urgency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NORMAL', 'HIGH', 'CRITICAL'] as TicketPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`p-2 border text-[10px] uppercase tracking-wider font-bold transition-all ${
                        priority === p
                          ? p === 'CRITICAL'
                            ? 'bg-red-950 border-crimson text-crimson'
                            : p === 'HIGH'
                            ? 'bg-amber-950 border-amber-500 text-amber-300'
                            : 'bg-[#1e1e1c] border-[#44423e] text-foreground'
                          : 'bg-[#0a0a09] border-[#20201e] text-muted-foreground hover:border-[#333]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Detailed Message *
                  </label>
                  <span className={`text-[10px] ${message.length > 1400 ? 'text-crimson' : 'text-muted-foreground'}`}>
                    {message.length}/1500
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or anomaly with as much detail as possible. Do not include passwords."
                  rows={5}
                  maxLength={1500}
                  className="w-full bg-[#0a0a09] border border-[#2a2927] p-2.5 text-xs text-foreground focus:outline-none focus:border-crimson leading-relaxed"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !subject.trim() || !message.trim()}
                className="button button-primary w-full text-xs font-mono font-bold py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Transmitting Support Docket...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>File Support Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Player Ticket Roster & Selected Ticket Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="panel p-5 space-y-4 min-h-[500px] flex flex-col">
            <div className="border-b border-[#2a2927] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-foreground font-bold">
                <Inbox size={14} className="text-muted-foreground" />
                <span>My Submitted Dockets ({tickets.length})</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                CALL-SIGN: {user.callSign}
              </span>
            </div>

            {tickets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-3">
                <HelpCircle size={36} className="text-[#3a3936]" />
                <div className="space-y-1">
                  <h3 className="font-serif text-base text-foreground font-semibold">
                    No Support Tickets Filed
                  </h3>
                  <p className="font-serif text-xs text-muted-foreground max-w-sm mx-auto">
                    You have not submitted any inquiries. If you encounter a puzzle blockage, system anomaly,
                    or have an account question, use the form on the left to reach staff.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-12 flex-1">
                {/* Ticket List (Left subsection 5 cols) */}
                <div className="md:col-span-5 space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {tickets.map((t) => {
                    const statusMeta = STATUS_LABELS[t.status];
                    const isSelected = selectedTicket?.id === t.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          tacticalAudio.playButtonClick();
                          setSelectedTicketId(t.id);
                        }}
                        className={`p-3 border cursor-pointer transition-all text-xs font-mono space-y-1.5 ${
                          isSelected
                            ? 'bg-[#1a1918] border-crimson shadow-sm'
                            : 'bg-[#111110] border-[#22211f] hover:border-[#383734]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-foreground">{t.id}</span>
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="font-serif text-xs text-[#ded8cc] font-medium line-clamp-1 m-0">
                          {t.subject}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                          <span>{CATEGORY_LABELS[t.category]}</span>
                          {t.staffResponse && (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <MessageSquare size={10} /> Reply
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ticket Details Panel (Right subsection 7 cols) */}
                <div className="md:col-span-7 bg-[#0b0b0a] border border-[#22211f] p-4 flex flex-col justify-between space-y-4">
                  {selectedTicket ? (
                    <div className="space-y-4 flex-1">
                      {/* Ticket Header */}
                      <div className="border-b border-[#20201e] pb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {selectedTicket.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                              STATUS_LABELS[selectedTicket.status].badgeClass
                            }`}
                          >
                            {STATUS_LABELS[selectedTicket.status].label}
                          </span>
                        </div>

                        <h3 className="font-serif text-lg font-bold text-foreground m-0">
                          {selectedTicket.subject}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-muted-foreground">
                          <span>Category: <strong>{CATEGORY_LABELS[selectedTicket.category]}</strong></span>
                          <span>•</span>
                          <span>Logged: {formatToIST(selectedTicket.createdAt)}</span>
                        </div>
                      </div>

                      {/* Player Submitted Message */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-bold">
                          Your Inquiry:
                        </span>
                        <div className="p-3 bg-[#121211] border border-[#242321] text-xs font-serif text-[#d8d2c5] leading-relaxed whitespace-pre-wrap">
                          {selectedTicket.message}
                        </div>
                      </div>

                      {/* Staff Official Response (if available) */}
                      {selectedTicket.staffResponse ? (
                        <div className="space-y-1.5 p-3.5 bg-[#0e1711] border border-[#1b3d26] text-xs font-mono">
                          <div className="flex items-center justify-between text-[#7dfba0] border-b border-[#1b3d26] pb-1.5">
                            <span className="font-bold flex items-center gap-1.5">
                              <ShieldAlert size={13} className="text-emerald-400" />
                              OFFICIAL STAFF RESPONSE
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {selectedTicket.resolvedBy ? `BY: ${selectedTicket.resolvedBy}` : 'CASE DIRECTORATE'}
                            </span>
                          </div>
                          <p className="font-serif text-sm text-[#e4f7e8] leading-relaxed m-0 pt-1 whitespace-pre-wrap">
                            {selectedTicket.staffResponse}
                          </p>
                          <div className="text-[9px] text-muted-foreground pt-1 flex justify-between">
                            <span>Status: {STATUS_LABELS[selectedTicket.status].label}</span>
                            <span>Updated: {formatToIST(selectedTicket.updatedAt)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-[#111110] border border-[#22211f] text-[11px] font-mono text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <Clock3 size={13} />
                            <span>PENDING STAFF REVIEW</span>
                          </div>
                          <p className="m-0 text-[10px] leading-relaxed">
                            This ticket has been queued in the organizer docket. When staff review and respond,
                            the authorized feedback will appear directly in this panel.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
