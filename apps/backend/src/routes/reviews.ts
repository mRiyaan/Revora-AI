import { Router } from 'express';
import {
  CanonicalReview,
  PlatformId,
  PropertyId,
  ROLE_PERMISSIONS,
  checkDraftEditPermission,
  checkRoutineApprovalPermission,
} from '@revora/shared';
import { getDb } from '../db/connection';
import { recordAuditLog } from '../db/audit';
import { checkCommitmentGuardrail } from '../engine/decisionEngine';
import { getConnector } from '../connectors/connectorRegistry';
import { requeueJob } from '../queue/jobQueue';

export const reviewsRouter = Router();

reviewsRouter.get('/', (req, res) => {
  const db = getDb();
  const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId : undefined;
  const platform = typeof req.query.platform === 'string' ? req.query.platform : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

  const rows = db
    .prepare(
      `SELECT
         r.*,
         ra.sentiment, ra.primary_category, ra.categories_json, ra.severity, ra.summary,
         ra.allegations_json, ra.customer_intent, ra.recommended_department,
         ra.suggested_next_steps_json, ra.evidence_checklist_json, ra.draft_reply,
         ra.confidence, ra.prompt_injection_detected, ra.ai_mode, ra.created_at AS analysis_created_at,
         resp.id AS resp_id, resp.draft_text AS resp_draft_text, resp.edited_text AS resp_edited_text,
         resp.approval_decision, resp.approved_by_role, resp.publication_state, resp.external_reply_ref,
         resp.updated_at AS resp_updated_at,
         esc.id AS escalation_ticket_id
       FROM reviews r
       LEFT JOIN review_analysis ra ON ra.review_id = r.id
       LEFT JOIN responses resp ON resp.review_id = r.id
       LEFT JOIN escalation_tickets esc ON esc.review_id = r.id
       ORDER BY r.ingested_at DESC, r.created_at DESC`
    )
    .all() as Record<string, unknown>[];

  const items = rows
    .filter((row) => {
      if (propertyId && propertyId !== 'ALL' && String(row.property_id) !== propertyId) {
        return false;
      }
      if (platform && platform !== 'ALL' && String(row.platform) !== platform) {
        return false;
      }
      if (status && status !== 'ALL' && String(row.response_status) !== status) {
        return false;
      }
      if (search) {
        const hay = `${row.reviewer_name} ${row.review_title || ''} ${row.review_text} ${row.reservation_id || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    })
    .map((row) => {
      const review: CanonicalReview = {
        id: String(row.id),
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
        positiveText: row.positive_text ? String(row.positive_text) : undefined,
        negativeText: row.negative_text ? String(row.negative_text) : undefined,
        reservationId: row.reservation_id ? String(row.reservation_id) : undefined,
        travelerType: row.traveler_type ? String(row.traveler_type) : undefined,
        createdAt: String(row.created_at),
        responseStatus: row.response_status as CanonicalReview['responseStatus'],
      };

      const analysis = row.summary
        ? {
            reviewId: String(row.id),
            sentiment: String(row.sentiment),
            primaryCategory: String(row.primary_category),
            categories: JSON.parse(String(row.categories_json || '[]')),
            severity: String(row.severity),
            summary: String(row.summary),
            allegations: JSON.parse(String(row.allegations_json || '[]')),
            customerIntent: String(row.customer_intent || ''),
            recommendedDepartment: String(row.recommended_department || 'Support'),
            suggestedNextSteps: JSON.parse(String(row.suggested_next_steps_json || '[]')),
            evidenceChecklist: JSON.parse(String(row.evidence_checklist_json || '[]')),
            draftReply: String(row.draft_reply || ''),
            confidence: Number(row.confidence || 0.9),
            promptInjectionDetected: Boolean(row.prompt_injection_detected),
            aiMode: String(row.ai_mode || 'local_fallback'),
            createdAt: String(row.analysis_created_at || row.created_at),
          }
        : undefined;

      const replyText =
        row.resp_edited_text !== null && row.resp_edited_text !== undefined
          ? String(row.resp_edited_text)
          : row.resp_draft_text
            ? String(row.resp_draft_text)
            : undefined;

      return {
        review,
        analysis,
        replyText,
        draftReplyOriginal: row.resp_draft_text ? String(row.resp_draft_text) : undefined,
        publicationState: row.publication_state ? String(row.publication_state) : undefined,
        approvedByRole: row.approved_by_role ? String(row.approved_by_role) : undefined,
        escalationTicketId: row.escalation_ticket_id
          ? String(row.escalation_ticket_id)
          : undefined,
      };
    });

  res.json({ reviews: items });
});

reviewsRouter.patch('/:id/draft', (req, res) => {
  const perm = checkDraftEditPermission(req.demoRole);
  if (!perm.allowed) {
    recordAuditLog({
      actorRole: req.demoRole,
      actorName: req.actorName,
      action: 'RESPONSE_DRAFT_EDIT_DENIED',
      entityType: 'review',
      entityId: req.params.id,
      outcome: 'blocked',
      metadata: { reason: perm.reason },
    });
    res.status(403).json({ error: perm.reason });
    return;
  }

  const draftText = typeof req.body?.draftText === 'string' ? req.body.draftText.trim() : '';
  const db = getDb();
  const existing = db
    .prepare(`SELECT * FROM responses WHERE review_id = ?`)
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Response draft not found for review.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE responses SET edited_text = ?, publication_state = 'edited_draft', updated_at = ? WHERE review_id = ?`
  ).run(draftText, now, req.params.id);

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'RESPONSE_DRAFT_EDITED',
    entityType: 'review',
    entityId: req.params.id,
    previousState: String(existing.publication_state),
    newState: 'edited_draft',
    outcome: 'success',
  });

  res.json({ ok: true, editedText: draftText, updatedAt: now });
});

reviewsRouter.delete('/:id/draft', (req, res) => {
  const perm = checkDraftEditPermission(req.demoRole);
  if (!perm.allowed) {
    res.status(403).json({ error: perm.reason });
    return;
  }

  const db = getDb();
  const existing = db
    .prepare(`SELECT * FROM responses WHERE review_id = ?`)
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Response draft not found for review.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE responses SET edited_text = '', publication_state = 'draft_cleared', updated_at = ? WHERE review_id = ?`
  ).run(now, req.params.id);

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'RESPONSE_DRAFT_CLEARED',
    entityType: 'review',
    entityId: req.params.id,
    previousState: String(existing.publication_state),
    newState: 'draft_cleared',
    outcome: 'success',
  });

  res.json({ ok: true, editedText: '', publicationState: 'draft_cleared', updatedAt: now });
});

reviewsRouter.post('/:id/approve-routine', async (req, res) => {
  const perm = checkRoutineApprovalPermission(req.demoRole);
  if (!perm.allowed) {
    recordAuditLog({
      actorRole: req.demoRole,
      actorName: req.actorName,
      action: 'ROUTINE_APPROVAL_DENIED',
      entityType: 'review',
      entityId: req.params.id,
      outcome: 'blocked',
      metadata: { reason: perm.reason },
    });
    res.status(403).json({ error: perm.reason });
    return;
  }

  const db = getDb();
  const rev = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  const resp = db.prepare(`SELECT * FROM responses WHERE review_id = ?`).get(req.params.id) as
    | Record<string, unknown>
    | undefined;

  if (!rev || !resp) {
    res.status(404).json({ error: 'Review or response draft not found.' });
    return;
  }

  const suppliedDraft =
    typeof req.body?.draftText === 'string' ? req.body.draftText.trim() : undefined;
  const finalReply = (
    suppliedDraft !== undefined
      ? suppliedDraft
      : resp.edited_text !== null && resp.edited_text !== undefined
        ? String(resp.edited_text)
        : String(resp.draft_text)
  ).trim();

  if (!finalReply) {
    res.status(400).json({
      error: 'Reply draft is empty/cleared. Enter response text before publishing.',
    });
    return;
  }

  const guardrail = checkCommitmentGuardrail(finalReply, false);
  if (!guardrail.safe) {
    res.status(400).json({ error: guardrail.violation });
    return;
  }

  const connector = getConnector(rev.platform as PlatformId);
  const pubRes = await connector.publishReply({
    propertyId: rev.property_id as PropertyId,
    externalReviewId: String(rev.external_review_id),
    replyText: finalReply,
    authorConnection: ROLE_PERMISSIONS[req.demoRole].title,
    language: 'en',
  });

  const now = new Date().toISOString();
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
    req.params.id
  );
  db.prepare(`UPDATE reviews SET response_status = 'approved_published' WHERE id = ?`).run(
    req.params.id
  );

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'ROUTINE_REPLY_APPROVED_LOCAL',
    entityType: 'review',
    entityId: req.params.id,
    previousState: String(rev.response_status),
    newState: 'approved_published',
    outcome: 'success',
    metadata: { externalReplyId: pubRes.externalReplyId, publicationState: pubRes.publicationState },
  });

  res.json({
    ok: true,
    publicationState: pubRes.publicationState,
    externalReplyId: pubRes.externalReplyId,
    message: `Approved by ${req.demoRole} & published locally.`,
  });
});

reviewsRouter.post('/:id/reject-routine', (req, res) => {
  const perm = checkRoutineApprovalPermission(req.demoRole);
  if (!perm.allowed) {
    res.status(403).json({ error: perm.reason });
    return;
  }
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE responses SET approval_decision = 'rejected', approved_by_role = ?, publication_state = 'rejected', updated_at = ? WHERE review_id = ?`
  ).run(req.demoRole, now, req.params.id);
  db.prepare(`UPDATE reviews SET response_status = 'rejected' WHERE id = ?`).run(
    req.params.id
  );

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'ROUTINE_REPLY_REJECTED',
    entityType: 'review',
    entityId: req.params.id,
    previousState: 'held_for_review',
    newState: 'rejected',
    outcome: 'success',
  });

  res.json({ ok: true, message: `Routine draft rejected by ${req.demoRole}.` });
});

reviewsRouter.post('/:id/requeue', (req, res) => {
  const db = getDb();
  const job = db
    .prepare(`SELECT id FROM review_jobs WHERE review_id = ?`)
    .get(req.params.id) as { id: string } | undefined;
  if (!job) {
    res.status(404).json({ error: 'Job not found for review.' });
    return;
  }
  const updated = requeueJob(job.id);
  res.json({ ok: true, job: updated });
});
