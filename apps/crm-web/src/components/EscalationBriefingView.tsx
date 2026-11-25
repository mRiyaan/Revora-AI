'use client';

import React, { useEffect, useState } from 'react';
import {
  AuditLogEntry,
  DemoRole,
  EscalationBriefing,
  PROPERTY_BY_ID,
  checkEscalationApprovalPermission,
} from '@revora/shared';
import {
  AlertOctagon,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  FileWarning,
  HelpCircle,
  History,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  XCircle,
} from 'lucide-react';
import { checkDraftGuardrail } from '@/lib/mockDemoStore';

interface EscalationBriefingViewProps {
  escalations: EscalationBriefing[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
  activeRole: DemoRole;
  auditLogs: AuditLogEntry[];
  onToggleEvidence: (ticketId: string, itemId: string) => void;
  onSaveDraft: (ticketId: string, text: string) => void;
  onApprove: (ticketId: string, text: string) => void;
  onReject: (ticketId: string) => void;
}

const PRIORITY_STYLE: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-800 ring-rose-300',
  high: 'bg-orange-100 text-orange-800 ring-orange-300',
  medium: 'bg-amber-100 text-amber-800 ring-amber-300',
  low: 'bg-slate-100 text-slate-700 ring-slate-300',
};

export function EscalationBriefingView({
  escalations,
  selectedTicketId,
  onSelectTicket,
  activeRole,
  auditLogs,
  onToggleEvidence,
  onSaveDraft,
  onApprove,
  onReject,
}: EscalationBriefingViewProps) {
  const activeCase =
    escalations.find((e) => e.ticketId === selectedTicketId) || escalations[0] || null;

  const [draftText, setDraftText] = useState(
    activeCase ? activeCase.response.editedText || activeCase.response.draftText : ''
  );

  useEffect(() => {
    if (activeCase) {
      setDraftText(activeCase.response.editedText || activeCase.response.draftText);
    }
  }, [activeCase?.ticketId, activeCase?.response.draftText, activeCase?.response.editedText]);

  if (!activeCase) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No escalation tickets match the selected property filter.
      </div>
    );
  }

  const propName =
    PROPERTY_BY_ID[activeCase.review.propertyId]?.name || activeCase.review.propertyId;
  const verifiedEvCount = activeCase.evidenceChecklist.filter((i) => i.checked).length;
  const guardrail = checkDraftGuardrail(
    draftText,
    verifiedEvCount,
    activeCase.category
  );
  const rbacCheck = checkEscalationApprovalPermission(activeRole, activeCase.category);

  const caseAudits = auditLogs.filter(
    (a) => a.entityId === activeCase.ticketId || a.entityId === activeCase.reviewId
  );

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      {/* Left Queue Master List */}
      <div className="space-y-2.5 xl:col-span-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Escalation Queue ({escalations.length})
          </h2>
          <span className="text-[11px] font-medium text-slate-400">
            Path 2 • Human Approval Required
          </span>
        </div>

        <div className="space-y-2.5">
          {escalations.map((esc) => {
            const isSelected = esc.ticketId === activeCase.ticketId;
            const pName = PROPERTY_BY_ID[esc.review.propertyId]?.city || esc.review.propertyId;
            return (
              <button
                key={esc.ticketId}
                type="button"
                onClick={() => onSelectTicket(esc.ticketId)}
                className={`w-full rounded-xl border p-3.5 text-left transition ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${
                      PRIORITY_STYLE[esc.priority]
                    }`}
                  >
                    {esc.priority} • {esc.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      esc.status === 'open'
                        ? 'bg-amber-100 text-amber-800'
                        : esc.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {esc.status.toUpperCase()}
                  </span>
                </div>

                <p className="mt-2 text-xs font-bold text-slate-900">
                  {esc.review.reviewerName}{' '}
                  <span className="font-normal text-slate-500">
                    ({esc.review.platform} • {pName})
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                  {esc.analysis.summary}
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>Owner: {esc.ownerDepartment}</span>
                  {esc.review.reservationId && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                      {esc.review.reservationId}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Executive Incident Briefing Panel (All 9 Spec §4.3 Elements) */}
      <div className="space-y-4 xl:col-span-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                  {activeCase.ticketId}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ring-1 ${
                    PRIORITY_STYLE[activeCase.priority]
                  }`}
                >
                  {activeCase.priority} • {activeCase.category}
                </span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                  Owner Dept: {activeCase.ownerDepartment}
                </span>
                {activeCase.promptInjectionDetected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800 ring-1 ring-purple-300">
                    <Lock className="h-3 w-3" /> PROMPT INJECTION QUARANTINED
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-base font-bold text-slate-900">
                Executive Incident Briefing — {propName}
              </h2>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-700">
                Source: {activeCase.review.platform.toUpperCase()}
              </p>
              <p>{new Date(activeCase.review.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* 1. Review Context (Untrusted Input Box) */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <FileWarning className="h-3.5 w-3.5 text-amber-600" />
                1. Original Review Context (Untrusted Guest Input)
              </span>
              <div className="flex items-center gap-2 text-xs">
                {activeCase.review.reservationId && (
                  <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-800">
                    {activeCase.review.reservationId}
                  </span>
                )}
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                  Rating: {activeCase.review.rating}/5
                  {activeCase.review.originalRatingText
                    ? ` (${activeCase.review.originalRatingText})`
                    : ''}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-900">
              {activeCase.review.reviewerName}
              {activeCase.review.reviewTitle ? ` — ${activeCase.review.reviewTitle}` : ''}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              {activeCase.review.reviewText}
            </p>
          </div>

          {/* 2 & 3. AI Summary + Deterministic Risk Rules */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                2. AI Incident Summary
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">
                {activeCase.analysis.summary}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Guest Intent:</span>{' '}
                {activeCase.analysis.customerIntent}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                3. Deterministic Classification & Risk Rules
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeCase.triggeredRules.map((rule) => (
                  <span
                    key={rule}
                    className="rounded-md bg-rose-50 px-2 py-1 font-mono text-[10px] font-semibold text-rose-800 ring-1 ring-rose-200"
                  >
                    {rule}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                AI Confidence: {(activeCase.analysis.confidence * 100).toFixed(0)}% • Zod
                Schema Validated
              </p>
            </div>
          </div>

          {/* 4. Truth Separation Grid: Allegations vs Verified Facts vs Unknown */}
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              4. Fact Status — Allegations vs. Verified Facts vs. Unknown (Spec §4.3 & §13.1)
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Guest Allegations (Unverified)
                </p>
                <ul className="mt-2 space-y-1.5 text-[11px] text-amber-950">
                  {activeCase.allegations.map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Internal Facts ({activeCase.verifiedFacts.length})
                </p>
                {activeCase.verifiedFacts.length === 0 ? (
                  <p className="mt-2 text-[11px] italic text-emerald-800">
                    No internal records verified yet. Check items in the Evidence Checklist below.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-[11px] text-emerald-950">
                    {activeCase.verifiedFacts.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        • {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                  Unknown / Pending Checks ({activeCase.unknownFacts.length})
                </p>
                <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
                  {activeCase.unknownFacts.map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 5. Qdrant SOP RAG Context */}
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                5. Retrieved SOP Policy Context (Qdrant Semantic RAG + Metadata Filter)
              </h3>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                Filter: category={activeCase.category} • active=true
              </span>
            </div>

            {activeCase.policyEvidenceUnavailable || activeCase.sopCitations.length === 0 ? (
              <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                Policy evidence unavailable in Qdrant for this query — Revora will not invent a
                rule. Escalate manually per Management judgment.
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                {activeCase.sopCitations.map((cit) => (
                  <div
                    key={cit.chunkId}
                    className="rounded-lg border border-indigo-100 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-900">
                        {cit.policyCode} (v{cit.version}) — {cit.sectionRef}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        Score {(cit.score * 100).toFixed(0)}% • {cit.department}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                      {cit.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6 & 7. Next Steps + Interactive Evidence Checklist */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                6. Recommended Next Steps ({activeCase.ownerDepartment})
              </h3>
              <ol className="mt-2.5 space-y-2 text-xs text-slate-700">
                {activeCase.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                7. Interactive Evidence Checklist
              </h3>
              <div className="mt-2.5 space-y-2">
                {activeCase.evidenceChecklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleEvidence(activeCase.ticketId, item.id)}
                    className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left text-xs transition ${
                      item.checked
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {item.checked ? (
                      <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <div className="flex-1">
                      <p className={item.checked ? 'font-semibold' : ''}>{item.label}</p>
                      {item.checked && item.verifiedBy && (
                        <p className="mt-0.5 text-[10px] text-emerald-700">
                          Verified by {item.verifiedBy}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 8. Editable Public Reply Draft + Commitment Guardrail + RBAC Action Bar */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                8. Editable Public Response Draft (Local Sandbox Target)
              </h3>
              <button
                type="button"
                onClick={() =>
                  setDraftText(
                    `Dear ${activeCase.review.reviewerName}, we are sorry and we will immediately refund ₹1,200 back to your card today.`
                  )
                }
                className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
              >
                Test Unsafe Refund Promise
              </button>
            </div>

            <textarea
              rows={4}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              disabled={activeCase.status !== 'open'}
              className="mt-2.5 w-full rounded-lg border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            />

            {!guardrail.safe && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{guardrail.reason}</span>
              </div>
            )}

            {!rbacCheck.allowed && activeCase.status === 'open' && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>RBAC Preview ({activeRole}):</strong> {rbacCheck.reason}
                </span>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Publication State:{' '}
                <span className="font-semibold text-slate-800">
                  {activeCase.response.publicationState}
                </span>
                {activeCase.response.approvedByRole && (
                  <span> • Approved by {activeCase.response.approvedByRole}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSaveDraft(activeCase.ticketId, draftText)}
                  disabled={activeCase.status !== 'open'}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => onReject(activeCase.ticketId)}
                  disabled={activeCase.status !== 'open'}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject Draft
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(activeCase.ticketId, draftText)}
                  disabled={activeCase.status !== 'open'}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Publish Locally
                </button>
              </div>
            </div>
          </div>

          {/* 9. Case Approval & Audit Trail */}
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <History className="h-3.5 w-3.5 text-slate-500" />
              9. Case Approval & Audit History ({caseAudits.length})
            </h3>
            <div className="mt-2.5 space-y-2">
              {caseAudits.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No actions recorded on this case yet.
                </p>
              ) : (
                caseAudits.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"
                  >
                    <div>
                      <span
                        className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          a.outcome === 'blocked'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {a.outcome}
                      </span>
                      <span className="font-semibold text-slate-800">{a.action}</span>
                      <span className="text-slate-500">
                        {' '}
                        by {a.actorRole} ({a.actorName})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(a.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
