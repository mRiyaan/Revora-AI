import { Router } from 'express';
import {
  DemoRole,
  EscalationBriefing,
  EvidenceItem,
  PlatformId,
  PropertyId,
  ROLE_PERMISSIONS,
  checkDraftEditPermission,
  checkEscalationApprovalPermission,
  checkEvidencePermission,
} from '@revora/shared';
import { getDb } from '../db/connection';
import { recordAuditLog } from '../db/audit';
import { checkCommitmentGuardrail } from '../engine/decisionEngine';
import { getConnector } from '../connectors/connectorRegistry';

export const escalationsRouter = Router();

function buildBriefingFromRow(row: Record<string, unknown>): EscalationBriefing {
  return {
    ticketId: String(row.id),
    reviewId: String(row.review_id),
    category: String(row.category),
    ownerDepartment: String(row.owner_department),
    status: row.status as EscalationBriefing['status'],
    priority: row.priority as EscalationBriefing['priority'],
    allegations: JSON.parse(String(row.allegations_json || '[]')),
    verifiedFacts: JSON.parse(String(row.verified_facts_json || '[]')),
    unknownFacts: JSON.parse(String(row.unknown_facts_json || '[]')),
    nextSteps: JSON.parse(String(row.next_steps_json || '[]')),
    evidenceChecklist: JSON.parse(String(row.evidence_checklist_json || '[]')),
    sopCitations: JSON.parse(String(row.sop_citations_json || '[]')),
    policyEvidenceUnavailable: Boolean(row.policy_evidence_unavailable),
    triggeredRules: JSON.parse(String(row.triggered_rules_json || '[]')),
    promptInjectionDetected: Boolean(row.prompt_injection_detected),
    review: {
      id: String(row.review_id),
      platform: row.platform as PlatformId,
      externalReviewId: String(row.external_review_id),
      propertyId: row.property_id as PropertyId,
      reviewerName: String(row.reviewer_name),
      rating: Number(row.rating),
      originalRatingText: row.original_rating_text
        ? String(row.original_rating_text)
        : undefined,
      reviewTitle: row.review_title ? String(row.review_title) : undefined,
      reviewText: String(row.review_text),
      reservationId: row.reservation_id ? String(row.reservation_id) : undefined,
      travelerType: row.traveler_type ? String(row.traveler_type) : undefined,
      createdAt: String(row.review_created_at),
      responseStatus: row.response_status as EscalationBriefing['review']['responseStatus'],
    },
    analysis: {
      reviewId: String(row.review_id),
      sentiment: String(row.sentiment || 'negative') as EscalationBriefing['analysis']['sentiment'],
      primaryCategory: String(row.primary_category || row.category),
      categories: JSON.parse(String(row.categories_json || '[]')),
      severity: String(row.severity || row.priority) as EscalationBriefing['analysis']['severity'],
      summary: String(row.summary || ''),
      allegations: JSON.parse(String(row.allegations_json || '[]')),
      customerIntent: String(row.customer_intent || ''),
      recommendedDepartment: String(row.recommended_department || row.owner_department),
      suggestedNextSteps: JSON.parse(String(row.suggested_next_steps_json || '[]')),
      evidenceChecklist: JSON.parse(String(row.evidence_checklist_json || '[]')).map(
        (e: EvidenceItem) => e.label
      ),
      draftReply: String(row.draft_reply || ''),
      confidence: Number(row.confidence || 0.9),
      promptInjectionDetected: Boolean(row.ra_prompt_injection),
      aiMode: (row.ai_mode === 'gemini_live' ? 'gemini_live' : 'local_fallback'),
      createdAt: String(row.analysis_created_at || row.created_at),
    },
    response: {
      id: String(row.resp_id || ''),
      draftText: String(row.resp_draft_text || ''),
      editedText:
        row.resp_edited_text !== null && row.resp_edited_text !== undefined
          ? String(row.resp_edited_text)
          : undefined,
      approvalDecision: (row.approval_decision || 'pending') as 'approved' | 'rejected' | 'pending',
      approvedByRole: row.approved_by_role
        ? (String(row.approved_by_role) as DemoRole)
        : undefined,
      publicationState: String(row.publication_state || 'pending_approval'),
      externalReplyRef: row.external_reply_ref
        ? String(row.external_reply_ref)
        : undefined,
      updatedAt: String(row.resp_updated_at || row.updated_at),
    },
  };
}

const SELECT_ESCALATION_JOIN = `
  SELECT
    esc.*,
    r.platform, r.external_review_id, r.property_id, r.reviewer_name, r.rating,
    r.original_rating_text, r.review_title, r.review_text, r.reservation_id,
    r.traveler_type, r.created_at AS review_created_at, r.response_status,
    ra.sentiment, ra.primary_category, ra.categories_json, ra.severity, ra.summary,
    ra.customer_intent, ra.recommended_department, ra.draft_reply, ra.confidence,
    ra.prompt_injection_detected AS ra_prompt_injection, ra.ai_mode,
    ra.created_at AS analysis_created_at,
    resp.id AS resp_id, resp.draft_text AS resp_draft_text, resp.edited_text AS resp_edited_text,
    resp.approval_decision, resp.approved_by_role, resp.publication_state,
    resp.external_reply_ref, resp.updated_at AS resp_updated_at
  FROM escalation_tickets esc
  JOIN reviews r ON r.id = esc.review_id
  LEFT JOIN review_analysis ra ON ra.review_id = esc.review_id
  LEFT JOIN responses resp ON resp.review_id = esc.review_id
`;

escalationsRouter.get('/', (req, res) => {
  const db = getDb();
  const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined;
  const rows = db
    .prepare(`${SELECT_ESCALATION_JOIN} ORDER BY esc.created_at DESC`)
    .all() as Record<string, unknown>[];

  const briefings = rows
    .filter((r) => !propertyId || propertyId === 'ALL' || String(r.property_id) === propertyId)
    .map(buildBriefingFromRow);

  res.json({ escalations: briefings });
});

escalationsRouter.get('/:id', (req, res) => {
  const db = getDb();
  const row = db
    .prepare(`${SELECT_ESCALATION_JOIN} WHERE esc.id = ?`)
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Escalation ticket not found.' });
    return;
  }

  res.json({ escalation: buildBriefingFromRow(row) });
});

escalationsRouter.patch('/:id/evidence', (req, res) => {
  const perm = checkEvidencePermission(req.demoRole);
  if (!perm.allowed) {
    res.status(403).json({ error: perm.reason });
    return;
  }

  const itemId = typeof req.body?.itemId === 'string' ? req.body.itemId : '';
  const db = getDb();
  const row = db
    .prepare(`${SELECT_ESCALATION_JOIN} WHERE esc.id = ?`)
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Escalation ticket not found.' });
    return;
  }

  const now = new Date().toISOString();
  const checklist = JSON.parse(String(row.evidence_checklist_json || '[]')) as EvidenceItem[];
  const updatedList = checklist.map((ev) =>
    ev.id === itemId
      ? {
          ...ev,
          checked: !ev.checked,
          verifiedBy: !ev.checked ? req.demoRole : undefined,
          verifiedAt: !ev.checked ? now : undefined,
        }
      : ev
  );

  const verifiedFacts = updatedList
    .filter((ev) => ev.checked)
    .map((ev) => `Verified (${ev.verifiedBy}): ${ev.label}`);
  if (row.reservation_id) {
    verifiedFacts.unshift(
      `Platform payload includes Reservation ID ${String(row.reservation_id)}.`
    );
  }
  const unknownFacts = updatedList
    .filter((ev) => !ev.checked)
    .map((ev) => `Pending verification: ${ev.label}`);
  if (unknownFacts.length === 0) {
    unknownFacts.push('All checklist items verified by internal staff.');
  }

  db.prepare(
    `UPDATE escalation_tickets
     SET evidence_checklist_json = ?, verified_facts_json = ?, unknown_facts_json = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    JSON.stringify(updatedList),
    JSON.stringify(verifiedFacts),
    JSON.stringify(unknownFacts),
    now,
    req.params.id
  );

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'EVIDENCE_CHECKLIST_UPDATED',
    entityType: 'escalation',
    entityId: req.params.id,
    outcome: 'success',
    metadata: { itemId },
  });

  const refreshed = db
    .prepare(`${SELECT_ESCALATION_JOIN} WHERE esc.id = ?`)
    .get(req.params.id) as Record<string, unknown>;
  res.json({ escalation: buildBriefingFromRow(refreshed) });
});

escalationsRouter.patch('/:id/draft', (req, res) => {
  const perm = checkDraftEditPermission(req.demoRole);
  if (!perm.allowed) {
    res.status(403).json({ error: perm.reason });
    return;
  }

  const draftText = typeof req.body?.draftText === 'string' ? req.body.draftText.trim() : '';
  const db = getDb();
  const esc = db
    .prepare(`SELECT review_id FROM escalation_tickets WHERE id = ?`)
    .get(req.params.id) as { review_id: string } | undefined;

  if (!esc) {
    res.status(404).json({ error: 'Escalation ticket not found.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE responses SET edited_text = ?, publication_state = 'edited_draft', updated_at = ? WHERE review_id = ?`
  ).run(draftText, now, esc.review_id);

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'RESPONSE_DRAFT_EDITED',
    entityType: 'escalation',
    entityId: req.params.id,
    newState: 'edited_draft',
    outcome: 'success',
  });

  res.json({ ok: true, editedText: draftText, updatedAt: now });
});

escalationsRouter.delete('/:id/draft', (req, res) => {
  const perm = checkDraftEditPermission(req.demoRole);
  if (!perm.allowed) {
    res.status(403).json({ error: perm.reason });
    return;
  }

  const db = getDb();
  const esc = db
    .prepare(`SELECT review_id FROM escalation_tickets WHERE id = ?`)
    .get(req.params.id) as { review_id: string } | undefined;

  if (!esc) {
    res.status(404).json({ error: 'Escalation ticket not found.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE responses SET edited_text = '', publication_state = 'draft_cleared', updated_at = ? WHERE review_id = ?`
  ).run(now, esc.review_id);

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'RESPONSE_DRAFT_CLEARED',
    entityType: 'escalation',
    entityId: req.params.id,
    newState: 'draft_cleared',
    outcome: 'success',
  });

  res.json({ ok: true, editedText: '', publicationState: 'draft_cleared', updatedAt: now });
});

escalationsRouter.post('/:id/approve', async (req, res) => {
  const db = getDb();
  const row = db
    .prepare(`${SELECT_ESCALATION_JOIN} WHERE esc.id = ?`)
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Escalation ticket not found.' });
    return;
  }

  const category = String(row.category);
  const rbac = checkEscalationApprovalPermission(req.demoRole, category);
  if (!rbac.allowed) {
    recordAuditLog({
      actorRole: req.demoRole,
      actorName: req.actorName,
      action: 'ESCALATION_APPROVAL_BLOCKED_RBAC',
      entityType: 'escalation',
      entityId: req.params.id,
      previousState: String(row.status),
      newState: String(row.status),
      outcome: 'blocked',
      metadata: { reason: rbac.reason },
    });
    res.status(403).json({ error: rbac.reason });
    return;
  }

  const suppliedDraft =
    typeof req.body?.draftText === 'string' ? req.body.draftText.trim() : undefined;
  const finalReply = (
    suppliedDraft !== undefined
      ? suppliedDraft
      : row.resp_edited_text !== null && row.resp_edited_text !== undefined
        ? String(row.resp_edited_text)
        : String(row.resp_draft_text)
  ).trim();

  if (!finalReply) {
    res.status(400).json({
      error: 'Reply draft is empty/cleared. Write a response before publishing.',
    });
    return;
  }

  const checklist = JSON.parse(String(row.evidence_checklist_json || '[]')) as EvidenceItem[];
  const verifiedCount = checklist.filter((e) => e.checked).length;
  const isBilling = category.toLowerCase().includes('billing');
  const guardrail = checkCommitmentGuardrail(finalReply, isBilling && verifiedCount >= 2);
  if (!guardrail.safe) {
    recordAuditLog({
      actorRole: req.demoRole,
      actorName: req.actorName,
      action: 'ESCALATION_APPROVAL_BLOCKED_POLICY',
      entityType: 'escalation',
      entityId: req.params.id,
      previousState: String(row.status),
      newState: String(row.status),
      outcome: 'blocked',
      metadata: { reason: guardrail.violation },
    });
    res.status(400).json({ error: guardrail.violation });
    return;
  }

  const connector = getConnector(row.platform as PlatformId);
  const pubRes = await connector.publishReply({
    propertyId: row.property_id as PropertyId,
    externalReviewId: String(row.external_review_id),
    replyText: finalReply,
    authorConnection: ROLE_PERMISSIONS[req.demoRole].title,
    language: 'en',
  });

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE escalation_tickets SET status = 'approved', updated_at = ? WHERE id = ?`
  ).run(now, req.params.id);

  db.prepare(
    `UPDATE responses
     SET edited_text = ?, approval_decision = 'approved', approved_by_role = ?,
         publication_state = ?, external_reply_ref = ?, updated_at = ?
     WHERE review_id = ?`
  ).run(
    finalReply,
    req.demoRole,
    pubRes.publicationState,
    pubRes.externalReplyId,
    now,
    String(row.review_id)
  );

  db.prepare(`UPDATE reviews SET response_status = 'approved_published' WHERE id = ?`).run(
    String(row.review_id)
  );

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'ESCALATION_APPROVED_AND_PUBLISHED_LOCAL',
    entityType: 'escalation',
    entityId: req.params.id,
    previousState: 'open',
    newState: 'approved',
    outcome: 'success',
    metadata: {
      externalReplyId: pubRes.externalReplyId,
      publicationState: pubRes.publicationState,
    },
  });

  const refreshed = db
    .prepare(`${SELECT_ESCALATION_JOIN} WHERE esc.id = ?`)
    .get(req.params.id) as Record<string, unknown>;

  res.json({
    ok: true,
    escalation: buildBriefingFromRow(refreshed),
    message: `Approved by ${req.demoRole} & published locally (${pubRes.publicationState}).`,
  });
});

escalationsRouter.post('/:id/reject', (req, res) => {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, review_id, category, status FROM escalation_tickets WHERE id = ?`)
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Escalation ticket not found.' });
    return;
  }

  const rbac = checkEscalationApprovalPermission(req.demoRole, String(row.category));
  if (!rbac.allowed) {
    res.status(403).json({ error: rbac.reason });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE escalation_tickets SET status = 'rejected', updated_at = ? WHERE id = ?`).run(
    now,
    req.params.id
  );
  db.prepare(
    `UPDATE responses SET approval_decision = 'rejected', approved_by_role = ?, publication_state = 'rejected', updated_at = ? WHERE review_id = ?`
  ).run(req.demoRole, now, String(row.review_id));
  db.prepare(`UPDATE reviews SET response_status = 'rejected' WHERE id = ?`).run(
    String(row.review_id)
  );

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'ESCALATION_DRAFT_REJECTED',
    entityType: 'escalation',
    entityId: req.params.id,
    previousState: String(row.status),
    newState: 'rejected',
    outcome: 'success',
  });

  res.json({ ok: true, message: `Escalation draft rejected by ${req.demoRole}.` });
});
