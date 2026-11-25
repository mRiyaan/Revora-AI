'use client';

import React, { useEffect, useState } from 'react';
import {
  DemoRole,
  EscalationBriefing,
  PROPERTY_BY_ID,
  checkEscalationApprovalPermission,
} from '@revora/shared';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Square,
  Star,
} from 'lucide-react';
import { CrmReviewItem, checkDraftGuardrail } from '@/lib/mockDemoStore';

interface ReviewDetailPaneProps {
  item: CrmReviewItem | null;
  escalation?: EscalationBriefing | null;
  activeRole: DemoRole;
  busy: boolean;
  onToggleEvidence: (ticketId: string, itemId: string) => void;
  onApproveEscalation: (ticketId: string, draftText: string) => void;
  onRejectEscalation: (ticketId: string) => void;
  onApproveRoutine: (reviewId: string) => void;
}

const PLATFORM_NAME: Record<string, string> = {
  google: 'Google',
  booking: 'Booking.com',
  tripadvisor: 'Tripadvisor',
};

export function ReviewDetailPane({
  item,
  escalation,
  activeRole,
  busy,
  onToggleEvidence,
  onApproveEscalation,
  onRejectEscalation,
  onApproveRoutine,
}: ReviewDetailPaneProps) {
  const [draft, setDraft] = useState('');
  const [showSopExcerpt, setShowSopExcerpt] = useState(false);

  useEffect(() => {
    if (escalation) {
      setDraft(escalation.response.editedText || escalation.response.draftText);
    } else if (item?.replyText) {
      setDraft(item.replyText);
    } else {
      setDraft('');
    }
    setShowSopExcerpt(false);
  }, [
    item?.review.id,
    escalation?.ticketId,
    escalation?.response.draftText,
    escalation?.response.editedText,
    item?.replyText,
  ]);

  if (!item) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
        Select a review on the left to inspect AI analysis and reply.
      </div>
    );
  }

  const { review, analysis } = item;
  const propName = PROPERTY_BY_ID[review.propertyId]?.name || review.propertyId;
  const verifiedCount = escalation
    ? escalation.evidenceChecklist.filter((e) => e.checked).length
    : 0;
  const guardrail = escalation
    ? checkDraftGuardrail(draft, verifiedCount, escalation.category)
    : { safe: true };
  const rbacCheck = escalation
    ? checkEscalationApprovalPermission(activeRole, escalation.category)
    : { allowed: true };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {PLATFORM_NAME[review.platform]}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-700">{propName}</span>
            {review.reservationId && (
              <>
                <span>•</span>
                <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
                  {review.reservationId}
                </span>
              </>
            )}
          </div>
          <h2 className="mt-1.5 text-lg font-semibold text-slate-900">
            {review.reviewerName}
            {review.reviewTitle ? ` — ${review.reviewTitle}` : ''}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {new Date(review.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {review.rating}/5
            {review.originalRatingText ? ` (${review.originalRatingText})` : ''}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              review.responseStatus === 'escalated'
                ? 'bg-rose-50 text-rose-700'
                : review.responseStatus === 'held_for_review'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {review.responseStatus.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Guest Review Body */}
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-slate-800">{review.reviewText}</p>
        {analysis?.promptInjectionDetected && (
          <p className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-800">
            <AlertCircle className="h-3.5 w-3.5" /> Prompt-injection instructions ignored
          </p>
        )}
      </div>

      {/* AI Context Strip */}
      {analysis && (
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              AI Context ({analysis.primaryCategory})
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
              {analysis.aiMode === 'gemini_live' ? 'Gemini Live' : 'Deterministic Fallback'}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{analysis.summary}</p>
        </div>
      )}

      {/* Escalation Briefing View (Clean, Zero Clutter) */}
      {escalation ? (
        <div className="space-y-5">
          {/* Truth Separation + Evidence Checklist */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-900">
                Allegations vs. Verified Facts
              </p>
              <div className="mt-2.5 space-y-2 text-xs">
                <div>
                  <span className="font-medium text-amber-700">Guest Alleges:</span>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    {escalation.allegations.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-slate-100 pt-2">
                  <span className="font-medium text-emerald-700">
                    Verified ({escalation.verifiedFacts.length}):
                  </span>
                  {escalation.verifiedFacts.length === 0 ? (
                    <p className="mt-1 text-slate-400">
                      Nothing verified yet — check items on the right.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-emerald-800">
                      {escalation.verifiedFacts.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  )}
                </div>
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
                    className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left text-xs transition hover:bg-slate-50"
                  >
                    {ev.checked ? (
                      <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <span className={ev.checked ? 'text-slate-900 line-through' : 'text-slate-700'}>
                      {ev.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Compact SOP Citation */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                {escalation.sopCitations[0] ? (
                  <span>
                    Matched Policy:{' '}
                    <strong>
                      {escalation.sopCitations[0].policyCode} —{' '}
                      {escalation.sopCitations[0].sectionRef}
                    </strong>
                  </span>
                ) : (
                  <span>No applicable SOP evidence found</span>
                )}
              </div>
              {escalation.sopCitations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSopExcerpt((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:underline"
                >
                  {showSopExcerpt ? 'Hide excerpt' : 'View excerpt'}
                  {showSopExcerpt ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
            {showSopExcerpt && (
              <div className="mt-2.5 space-y-2 border-t border-indigo-100 pt-2.5 text-xs text-slate-700">
                {escalation.sopCitations.map((c) => (
                  <p key={c.chunkId}>
                    <span className="font-semibold text-indigo-900">{c.sectionRef}:</span>{' '}
                    {c.excerpt}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Public Reply & Approval */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reply-draft"
                className="text-xs font-semibold text-slate-900"
              >
                Public Reply Draft
              </label>
              {escalation.status === 'open' && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft(
                      `Dear ${review.reviewerName}, we will immediately refund ₹1,200 to your card today.`
                    )
                  }
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                >
                  Test unsafe refund promise
                </button>
              )}
            </div>

            <textarea
              id="reply-draft"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={escalation.status !== 'open'}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-800 outline-none focus:border-slate-400 disabled:bg-slate-50"
            />

            {!guardrail.safe && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {guardrail.reason}
              </p>
            )}

            {!rbacCheck.allowed && escalation.status === 'open' && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {rbacCheck.reason}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                {escalation.status === 'approved'
                  ? `Published live by ${escalation.response.approvedByRole}`
                  : escalation.status === 'rejected'
                    ? 'Draft rejected'
                    : `Requires ${escalation.category === 'billing' ? 'Finance or Manager' : 'Manager'} approval`}
              </span>

              {escalation.status === 'open' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRejectEscalation(escalation.ticketId)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onApproveEscalation(escalation.ticketId, draft)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Publish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Routine Path Display */
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-900">
            {review.responseStatus === 'held_for_review'
              ? 'Drafted Reply (Held for Approval)'
              : 'Published Reply (Visible on Guest Portal)'}
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700">
            {item.replyText || 'Awaiting processing...'}
          </div>
          {review.responseStatus === 'held_for_review' && review.id && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => onApproveRoutine(review.id!)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Publish
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
