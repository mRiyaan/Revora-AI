'use client';

import React, { useEffect, useState } from 'react';
import {
  AuditLogEntry,
  DemoRole,
  EscalationBriefing,
  PROPERTY_BY_ID,
  checkEscalationApprovalPermission,
  checkRoutineApprovalPermission,
} from '@revora/shared';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  RotateCcw,
  Save,
  Sparkles,
  Square,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { BackendReviewItem } from '@/lib/backendApi';
import { checkDraftGuardrail } from '@/lib/mockDemoStore';

type DrawerTab = 'reply' | 'evidence' | 'activity';

interface CaseDrawerProps {
  item: BackendReviewItem | null;
  escalation: EscalationBriefing | null;
  auditLogs: AuditLogEntry[];
  activeRole: DemoRole;
  busy: boolean;
  onClose: () => void;
  onToggleEvidence: (ticketId: string, itemId: string) => void;
  onSaveEscalationDraft: (ticketId: string, draftText: string) => void;
  onDeleteEscalationDraft: (ticketId: string) => void;
  onApproveEscalation: (ticketId: string, draftText: string) => void;
  onRejectEscalation: (ticketId: string) => void;
  onSaveRoutineDraft: (reviewId: string, draftText: string) => void;
  onDeleteRoutineDraft: (reviewId: string) => void;
  onApproveRoutine: (reviewId: string, draftText: string) => void;
  onRejectRoutine: (reviewId: string) => void;
}

const CHANNEL_LABEL: Record<string, string> = {
  google: 'Google Business Profile',
  booking: 'Booking.com',
  tripadvisor: 'Tripadvisor',
};

export function CaseDrawer({
  item,
  escalation,
  auditLogs,
  activeRole,
  busy,
  onClose,
  onToggleEvidence,
  onSaveEscalationDraft,
  onDeleteEscalationDraft,
  onApproveEscalation,
  onRejectEscalation,
  onSaveRoutineDraft,
  onDeleteRoutineDraft,
  onApproveRoutine,
  onRejectRoutine,
}: CaseDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('reply');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setTab('reply');
    if (escalation) {
      setDraft(
        escalation.response.editedText !== undefined
          ? escalation.response.editedText
          : escalation.response.draftText
      );
    } else if (item) {
      setDraft(item.replyText ?? '');
    } else {
      setDraft('');
    }
  }, [
    item?.review.id,
    escalation?.ticketId,
    escalation?.response.draftText,
    escalation?.response.editedText,
    item?.replyText,
  ]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;

  const { review, analysis } = item;
  const propName = PROPERTY_BY_ID[review.propertyId]?.name || review.propertyId;
  const initials = review.reviewerName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const verifiedCount = escalation
    ? escalation.evidenceChecklist.filter((e) => e.checked).length
    : 0;
  const guardrail = escalation
    ? checkDraftGuardrail(draft, verifiedCount, escalation.category)
    : checkDraftGuardrail(draft, 0, 'general');

  const rbacCheck = escalation
    ? checkEscalationApprovalPermission(activeRole, escalation.category)
    : checkRoutineApprovalPermission(activeRole);

  const isEditable = escalation
    ? escalation.status === 'open'
    : review.responseStatus === 'held_for_review' ||
      review.responseStatus === 'unanswered';

  const originalAiDraft = escalation
    ? escalation.response.draftText
    : item.draftReplyOriginal || analysis?.draftReply || '';

  const relatedLogs = auditLogs.filter(
    (a) =>
      a.entityId === review.id ||
      (escalation && a.entityId === escalation.ticketId)
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/35 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {initials || 'G'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  {review.reviewerName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {review.rating}/5
                </span>
                {review.reservationId && (
                  <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
                    {review.reservationId}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {propName} • {CHANNEL_LABEL[review.platform]} •{' '}
                {new Date(review.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('reply')}
            className={`border-b-2 py-3 transition ${
              tab === 'reply'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Reply Editor
          </button>
          {escalation && (
            <button
              type="button"
              onClick={() => setTab('evidence')}
              className={`flex items-center gap-1.5 border-b-2 py-3 transition ${
                tab === 'evidence'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Evidence & SOP
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                {verifiedCount}/{escalation.evidenceChecklist.length}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab('activity')}
            className={`border-b-2 py-3 transition ${
              tab === 'activity'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Activity ({relatedLogs.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'reply' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                {review.reviewTitle && (
                  <p className="mb-1 text-xs font-semibold text-slate-900">
                    {review.reviewTitle}
                  </p>
                )}
                <p className="text-sm leading-relaxed text-slate-700">
                  {review.reviewText}
                </p>
                {analysis?.promptInjectionDetected && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-800">
                    <AlertCircle className="h-3.5 w-3.5" /> Prompt-injection attempt isolated
                  </p>
                )}
              </div>

              {analysis && (
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Live Processing Pipeline
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-semibold">
                    <div className="rounded-lg bg-emerald-50 px-1.5 py-1.5 text-emerald-800">
                      1. Ingested
                      <div className="mt-0.5 truncate text-[9px] font-normal text-emerald-700">
                        {CHANNEL_LABEL[review.platform]}
                      </div>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-1.5 py-1.5 text-emerald-800">
                      2. SQLite Queue
                      <div className="mt-0.5 text-[9px] font-normal text-emerald-700">
                        Claimed
                      </div>
                    </div>
                    <div
                      className={`rounded-lg px-1.5 py-1.5 ${
                        analysis.aiMode === 'gemini_live'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      3. Gemini AI
                      <div className="mt-0.5 text-[9px] font-normal">
                        {analysis.aiMode === 'gemini_live' ? 'Gemini Live' : 'Fallback'}
                      </div>
                    </div>
                    <div
                      className={`rounded-lg px-1.5 py-1.5 ${
                        escalation
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      4. Policy Gate
                      <div className="mt-0.5 text-[9px] font-normal">
                        {escalation ? 'Escalated' : 'Routine'}
                      </div>
                    </div>
                    <div
                      className={`rounded-lg px-1.5 py-1.5 ${
                        review.responseStatus === 'auto_published' ||
                        review.responseStatus === 'approved_published'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      5. Channel Reply
                      <div className="mt-0.5 text-[9px] font-normal">
                        {review.responseStatus === 'auto_published' ||
                        review.responseStatus === 'approved_published'
                          ? 'Published'
                          : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysis && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-950">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      AI Triage ({analysis.primaryCategory})
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {analysis.aiMode === 'gemini_live'
                        ? 'Gemini Live'
                        : 'Deterministic Fallback'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                    {analysis.summary}
                  </p>
                </div>
              )}

              {/* Executive Reply Editor (Available for BOTH Escalations AND Held Routine Reviews) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="drawer-reply"
                    className="text-xs font-semibold text-slate-900"
                  >
                    {isEditable
                      ? 'Executive Reply Editor (Edit or Delete Draft Before Publishing)'
                      : 'Published / Final Reply'}
                  </label>

                  {isEditable && (
                    <div className="flex items-center gap-3">
                      {originalAiDraft && draft !== originalAiDraft && (
                        <button
                          type="button"
                          onClick={() => setDraft(originalAiDraft)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" /> Restore AI Draft
                        </button>
                      )}
                      {escalation && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraft(
                              `Dear ${review.reviewerName}, we will immediately refund ₹1,200 to your card today.`
                            )
                          }
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-900"
                        >
                          Test unsafe refund
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <textarea
                  id="drawer-reply"
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={!isEditable}
                  placeholder={
                    isEditable
                      ? 'Draft cleared — type a custom executive response here...'
                      : 'No reply published.'
                  }
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-800 outline-none focus:border-slate-900 disabled:bg-slate-50"
                />

                {isEditable && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        escalation
                          ? onSaveEscalationDraft(escalation.ticketId, draft)
                          : review.id && onSaveRoutineDraft(review.id, draft)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Edit
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDraft('');
                        if (escalation) {
                          onDeleteEscalationDraft(escalation.ticketId);
                        } else if (review.id) {
                          onDeleteRoutineDraft(review.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Draft
                    </button>
                  </div>
                )}

                {!guardrail.safe && isEditable && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                    {guardrail.reason}
                  </div>
                )}

                {!rbacCheck.allowed && isEditable && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {rbacCheck.reason}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'evidence' && escalation && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                  <p className="text-xs font-semibold text-amber-900">
                    Guest Allegations (Unverified)
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-amber-950">
                    {escalation.allegations.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <p className="text-xs font-semibold text-emerald-900">
                    Verified Internal Facts ({escalation.verifiedFacts.length})
                  </p>
                  {escalation.verifiedFacts.length === 0 ? (
                    <p className="mt-2 text-xs text-emerald-800">
                      No facts verified yet. Check evidence items below.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-xs text-emerald-950">
                      {escalation.verifiedFacts.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-900">
                  Evidence Checklist ({escalation.ownerDepartment})
                </p>
                <div className="mt-2.5 space-y-2">
                  {escalation.evidenceChecklist.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      disabled={busy}
                      onClick={() => onToggleEvidence(escalation.ticketId, ev.id)}
                      className="flex w-full items-start gap-2.5 rounded-lg border border-slate-100 p-2.5 text-left text-xs transition hover:bg-slate-50"
                    >
                      {ev.checked ? (
                        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <span
                        className={
                          ev.checked ? 'text-slate-900 line-through' : 'text-slate-700'
                        }
                      >
                        {ev.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                  Matched SOP Policy Excerpts (Qdrant RAG)
                </p>
                {escalation.policyEvidenceUnavailable ||
                escalation.sopCitations.length === 0 ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Policy evidence unavailable — Revora does not invent rules.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    {escalation.sopCitations.map((c) => (
                      <div key={c.chunkId} className="rounded-lg bg-slate-50 p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>
                            {c.policyCode} — {c.sectionRef}
                          </span>
                          <span className="text-[11px] text-indigo-700">
                            {(c.score * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="mt-1 leading-relaxed text-slate-600">{c.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-2.5">
              {relatedLogs.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No actions recorded on this case yet.
                </p>
              ) : (
                relatedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{log.action}</p>
                      <p className="text-[11px] text-slate-500">
                        {log.actorRole} • {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        log.outcome === 'blocked'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {log.outcome}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <span className="text-xs text-slate-500">
            Status:{' '}
            <strong className="text-slate-800">
              {item.publicationState || review.responseStatus.replace(/_/g, ' ')}
            </strong>
          </span>

          {isEditable && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  escalation
                    ? onRejectEscalation(escalation.ticketId)
                    : review.id && onRejectRoutine(review.id)
                }
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={() =>
                  escalation
                    ? onApproveEscalation(escalation.ticketId, draft)
                    : review.id && onApproveRoutine(review.id, draft)
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Publish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
