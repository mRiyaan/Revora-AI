import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_ROLES,
  DemoRole,
  checkAdminPermission,
  checkDraftEditPermission,
  checkEscalationApprovalPermission,
  checkEvidencePermission,
  checkRoutineApprovalPermission,
} from '@revora/shared';
import { checkDraftGuardrail } from '@/lib/mockDemoStore';
import { readLiveStore, resetLiveStore, writeLiveStore } from '@/lib/liveStore';

export const dynamic = 'force-dynamic';

function parseRole(req: NextRequest): DemoRole {
  const raw = (req.headers.get('x-demo-role') || 'Manager').trim();
  return DEMO_ROLES.find((r) => r.toLowerCase() === raw.toLowerCase()) || 'Manager';
}

export async function POST(req: NextRequest) {
  const role = parseRole(req);
  const body = (await req.json()) as {
    action:
      | 'approve_escalation'
      | 'reject_escalation'
      | 'save_draft'
      | 'toggle_evidence'
      | 'approve_routine'
      | 'toggle_auto_publish'
      | 'reset_demo';
    ticketId?: string;
    itemId?: string;
    reviewId?: string;
    draftText?: string;
  };

  const now = new Date().toISOString();

  if (body.action === 'reset_demo') {
    const perm = checkAdminPermission(role);
    if (!perm.allowed) {
      return NextResponse.json({ error: perm.reason }, { status: 403 });
    }
    const fresh = resetLiveStore();
    return NextResponse.json({ state: fresh, message: 'Demo state reset.' });
  }

  const state = readLiveStore();

  if (body.action === 'toggle_auto_publish') {
    const perm = checkAdminPermission(role);
    if (!perm.allowed) {
      state.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        actorRole: role,
        actorName: `Demo ${role}`,
        action: 'TOGGLE_AUTO_PUBLISH_DENIED',
        entityType: 'settings',
        entityId: 'auto_publish_routine',
        outcome: 'blocked',
        createdAt: now,
      });
      writeLiveStore(state);
      return NextResponse.json({ error: perm.reason }, { status: 403 });
    }

    const prev = state.autoPublishRoutine;
    state.autoPublishRoutine = !prev;
    state.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorRole: role,
      actorName: `Demo ${role}`,
      action: 'TOGGLE_AUTO_PUBLISH_GATE',
      entityType: 'settings',
      entityId: 'auto_publish_routine',
      previousState: String(prev),
      newState: String(state.autoPublishRoutine),
      outcome: 'success',
      createdAt: now,
    });
    writeLiveStore(state);
    return NextResponse.json({
      state,
      message: `Auto-Publish Routine Gate is now ${state.autoPublishRoutine ? 'ON' : 'OFF'}.`,
    });
  }

  if (body.action === 'approve_routine' && body.reviewId) {
    const perm = checkRoutineApprovalPermission(role);
    if (!perm.allowed) {
      return NextResponse.json({ error: perm.reason }, { status: 403 });
    }
    state.reviews = state.reviews.map((item) =>
      item.review.id === body.reviewId
        ? {
            ...item,
            review: { ...item.review, responseStatus: 'approved_published' },
            publicationState: 'PUBLISHED',
          }
        : item
    );
    state.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorRole: role,
      actorName: `Demo ${role}`,
      action: 'ROUTINE_REPLY_APPROVED_LOCAL',
      entityType: 'review',
      entityId: body.reviewId,
      previousState: 'held_for_review',
      newState: 'approved_published',
      outcome: 'success',
      createdAt: now,
    });
    writeLiveStore(state);
    return NextResponse.json({
      state,
      message: `Reply approved by ${role} and published to Guest Portal.`,
    });
  }

  const esc = state.escalations.find((e) => e.ticketId === body.ticketId);
  if (!esc) {
    return NextResponse.json({ error: 'Escalation ticket not found.' }, { status: 404 });
  }

  if (body.action === 'toggle_evidence' && body.itemId) {
    const perm = checkEvidencePermission(role);
    if (!perm.allowed) {
      return NextResponse.json({ error: perm.reason }, { status: 403 });
    }
    state.escalations = state.escalations.map((item) => {
      if (item.ticketId !== esc.ticketId) return item;
      const updatedList = item.evidenceChecklist.map((ev) =>
        ev.id === body.itemId
          ? {
              ...ev,
              checked: !ev.checked,
              verifiedBy: !ev.checked ? role : undefined,
              verifiedAt: !ev.checked ? now : undefined,
            }
          : ev
      );
      const verifiedFacts = updatedList
        .filter((ev) => ev.checked)
        .map((ev) => `Verified (${ev.verifiedBy}): ${ev.label}`);
      if (item.review.reservationId) {
        verifiedFacts.unshift(
          `Reservation ID ${item.review.reservationId} included in platform payload.`
        );
      }
      const unknownFacts = updatedList
        .filter((ev) => !ev.checked)
        .map((ev) => `Pending verification: ${ev.label}`);
      if (unknownFacts.length === 0) {
        unknownFacts.push('All evidence checks verified.');
      }
      return { ...item, evidenceChecklist: updatedList, verifiedFacts, unknownFacts };
    });

    state.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorRole: role,
      actorName: `Demo ${role}`,
      action: 'EVIDENCE_CHECKLIST_UPDATED',
      entityType: 'escalation',
      entityId: esc.ticketId,
      outcome: 'success',
      createdAt: now,
    });
    writeLiveStore(state);
    return NextResponse.json({ state });
  }

  if (body.action === 'save_draft') {
    const perm = checkDraftEditPermission(role);
    if (!perm.allowed) {
      return NextResponse.json({ error: perm.reason }, { status: 403 });
    }
    const text = (body.draftText || '').trim();
    state.escalations = state.escalations.map((item) =>
      item.ticketId === esc.ticketId
        ? { ...item, response: { ...item.response, editedText: text, updatedAt: now } }
        : item
    );
    writeLiveStore(state);
    return NextResponse.json({ state, message: 'Draft saved.' });
  }

  if (body.action === 'approve_escalation') {
    const rbac = checkEscalationApprovalPermission(role, esc.category);
    if (!rbac.allowed) {
      state.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        actorRole: role,
        actorName: `Demo ${role}`,
        action: 'ESCALATION_APPROVAL_BLOCKED_RBAC',
        entityType: 'escalation',
        entityId: esc.ticketId,
        previousState: 'open',
        newState: 'open',
        outcome: 'blocked',
        createdAt: now,
      });
      writeLiveStore(state);
      return NextResponse.json({ error: rbac.reason, state }, { status: 403 });
    }

    const replyText = (body.draftText || esc.response.editedText || esc.response.draftText).trim();
    const verifiedCount = esc.evidenceChecklist.filter((i) => i.checked).length;
    const guard = checkDraftGuardrail(replyText, verifiedCount, esc.category);
    if (!guard.safe) {
      state.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        actorRole: role,
        actorName: `Demo ${role}`,
        action: 'ESCALATION_APPROVAL_BLOCKED_POLICY',
        entityType: 'escalation',
        entityId: esc.ticketId,
        previousState: 'open',
        newState: 'open',
        outcome: 'blocked',
        createdAt: now,
      });
      writeLiveStore(state);
      return NextResponse.json({ error: guard.reason, state }, { status: 400 });
    }

    state.escalations = state.escalations.map((item) =>
      item.ticketId === esc.ticketId
        ? {
            ...item,
            status: 'approved',
            review: { ...item.review, responseStatus: 'approved_published' },
            response: {
              ...item.response,
              editedText: replyText,
              approvalDecision: 'approved',
              approvedByRole: role,
              publicationState: 'PUBLISHED',
              externalReplyRef: `sim_rep_${Date.now()}`,
              updatedAt: now,
            },
          }
        : item
    );
    state.reviews = state.reviews.map((item) =>
      item.review.id === esc.reviewId
        ? {
            ...item,
            review: { ...item.review, responseStatus: 'approved_published' },
            replyText,
            publicationState: 'PUBLISHED',
          }
        : item
    );
    state.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorRole: role,
      actorName: `Demo ${role}`,
      action: 'ESCALATION_APPROVED_AND_PUBLISHED_LOCAL',
      entityType: 'escalation',
      entityId: esc.ticketId,
      previousState: 'open',
      newState: 'approved',
      outcome: 'success',
      createdAt: now,
    });
    writeLiveStore(state);
    return NextResponse.json({
      state,
      message: `Approved by ${role} & published live to Guest Portal!`,
    });
  }

  if (body.action === 'reject_escalation') {
    const rbac = checkEscalationApprovalPermission(role, esc.category);
    if (!rbac.allowed) {
      return NextResponse.json({ error: rbac.reason }, { status: 403 });
    }
    state.escalations = state.escalations.map((item) =>
      item.ticketId === esc.ticketId
        ? {
            ...item,
            status: 'rejected',
            review: { ...item.review, responseStatus: 'rejected' },
            response: {
              ...item.response,
              approvalDecision: 'rejected',
              approvedByRole: role,
              publicationState: 'rejected',
              updatedAt: now,
            },
          }
        : item
    );
    state.reviews = state.reviews.map((item) =>
      item.review.id === esc.reviewId
        ? { ...item, review: { ...item.review, responseStatus: 'rejected' } }
        : item
    );
    state.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorRole: role,
      actorName: `Demo ${role}`,
      action: 'ESCALATION_DRAFT_REJECTED',
      entityType: 'escalation',
      entityId: esc.ticketId,
      previousState: 'open',
      newState: 'rejected',
      outcome: 'success',
      createdAt: now,
    });
    writeLiveStore(state);
    return NextResponse.json({ state, message: `Rejected by ${role}.` });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
