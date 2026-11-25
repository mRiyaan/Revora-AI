import crypto from 'node:crypto';
import {
  CanonicalReview,
  EvidenceItem,
  PlatformId,
  PropertyId,
  ReviewJob,
} from '@revora/shared';
import { getDb } from '../db/connection';
import { recordAuditLog } from '../db/audit';
import { analyzeReview } from '../ai/analyzer';
import { evaluateDecision, checkCommitmentGuardrail } from '../engine/decisionEngine';
import { searchSops } from '../rag/sopRag';
import { getConnector } from '../connectors/connectorRegistry';
import { CONFIG } from '../config';

export function getAutoPublishSetting(): boolean {
  const db = getDb();
  const row = db
    .prepare(`SELECT value FROM app_settings WHERE key = 'auto_publish_routine'`)
    .get() as { value: string } | undefined;
  if (!row) return CONFIG.defaultAutoPublishRoutine;
  return row.value === 'true';
}

export function getReviewById(reviewId: string): CanonicalReview | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(reviewId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;

  return {
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
    scenarioHint: row.scenario_hint
      ? (String(row.scenario_hint) as CanonicalReview['scenarioHint'])
      : undefined,
    createdAt: String(row.created_at),
    responseStatus: row.response_status as CanonicalReview['responseStatus'],
  };
}

export async function processSingleJob(job: ReviewJob): Promise<void> {
  const db = getDb();
  const review = getReviewById(job.reviewId);
  if (!review) {
    throw new Error(`Review ${job.reviewId} not found for job ${job.id}`);
  }

  // Test hook for demonstrating visible queue failure / retry handling
  if (review.reviewText.includes('__SIMULATE_WORKER_ERROR__')) {
    throw new Error('Simulated transient AI upstream error for queue retry demonstration');
  }

  // Idempotency guard: if review already has a final published/escalated decision, skip re-publishing
  const existingResponse = db
    .prepare(`SELECT id, publication_state FROM responses WHERE review_id = ?`)
    .get(review.id!) as { id: string; publication_state: string } | undefined;
  if (
    existingResponse &&
    ['PUBLISHED', 'PENDING_MODERATION', 'SANDBOX_LOCAL'].includes(
      existingResponse.publication_state
    )
  ) {
    return;
  }

  const now = new Date().toISOString();
  const { output: analysis, aiMode, rawModelJson } = await analyzeReview(review);
  const autoPublishEnabled = getAutoPublishSetting();
  const decision = evaluateDecision(review, analysis, autoPublishEnabled);

  db.prepare(
    `INSERT OR REPLACE INTO review_analysis (
      review_id, sentiment, primary_category, categories_json, severity, summary,
      allegations_json, customer_intent, recommended_department, suggested_next_steps_json,
      evidence_checklist_json, draft_reply, confidence, prompt_injection_detected,
      ai_mode, raw_model_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    review.id!,
    analysis.sentiment,
    analysis.primaryCategory,
    JSON.stringify(analysis.categories),
    analysis.severity,
    analysis.summary,
    JSON.stringify(analysis.allegations),
    analysis.customerIntent,
    analysis.recommendedDepartment,
    JSON.stringify(analysis.suggestedNextSteps),
    JSON.stringify(analysis.evidenceChecklist),
    analysis.draftReply,
    analysis.confidence,
    analysis.promptInjectionDetected ? 1 : 0,
    aiMode,
    rawModelJson,
    now
  );

  if (decision.route === 'ROUTINE_AUTO_PUBLISH') {
    const guardrail = checkCommitmentGuardrail(analysis.draftReply, false);
    if (!guardrail.safe) {
      throw new Error(`Guardrail blocked auto-publish: ${guardrail.violation}`);
    }

    const connector = getConnector(review.platform);
    const pubRes = await connector.publishReply({
      propertyId: review.propertyId,
      externalReviewId: review.externalReviewId,
      replyText: analysis.draftReply,
      authorConnection: 'Guest Relations Team',
      language: 'en',
    });

    const respId = `resp_${crypto.randomUUID().slice(0, 12)}`;
    db.prepare(
      `INSERT OR REPLACE INTO responses (
        id, review_id, draft_text, edited_text, approval_decision, approved_by_role,
        publication_state, external_reply_ref, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, 'approved', 'System', ?, ?, ?, ?)`
    ).run(
      respId,
      review.id!,
      analysis.draftReply,
      pubRes.publicationState,
      pubRes.externalReplyId,
      now,
      now
    );

    db.prepare(`UPDATE reviews SET response_status = 'auto_published' WHERE id = ?`).run(
      review.id!
    );

    recordAuditLog({
      actorRole: 'System',
      actorName: 'Revora Decision Engine',
      action: 'ROUTINE_AUTO_PUBLISHED_LOCAL',
      entityType: 'review',
      entityId: review.id!,
      previousState: 'queued',
      newState: 'auto_published',
      outcome: 'success',
      metadata: {
        aiMode,
        triggeredRules: decision.triggeredRules,
        externalReplyId: pubRes.externalReplyId,
        publicationState: pubRes.publicationState,
      },
    });
    return;
  }

  if (decision.route === 'ROUTINE_HOLD_FOR_REVIEW') {
    const respId = `resp_${crypto.randomUUID().slice(0, 12)}`;
    db.prepare(
      `INSERT OR REPLACE INTO responses (
        id, review_id, draft_text, edited_text, approval_decision, approved_by_role,
        publication_state, external_reply_ref, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, 'pending', NULL, 'held_for_review', NULL, ?, ?)`
    ).run(respId, review.id!, analysis.draftReply, now, now);

    db.prepare(`UPDATE reviews SET response_status = 'held_for_review' WHERE id = ?`).run(
      review.id!
    );

    recordAuditLog({
      actorRole: 'System',
      actorName: 'Revora Decision Engine',
      action: 'ROUTINE_HELD_FOR_HUMAN_REVIEW',
      entityType: 'review',
      entityId: review.id!,
      previousState: 'queued',
      newState: 'held_for_review',
      outcome: 'success',
      metadata: {
        aiMode,
        triggeredRules: decision.triggeredRules,
      },
    });
    return;
  }

  // Path 2: Serious / policy-sensitive escalation + Qdrant SOP RAG
  const ragRes = await searchSops({
    query: `${decision.escalationCategory} ${analysis.summary} ${review.reviewText}`,
    category: decision.escalationCategory,
    department: decision.ownerDepartment === 'Management' ? undefined : decision.ownerDepartment,
    propertyId: review.propertyId,
    limit: 3,
  });

  const evidenceChecklist: EvidenceItem[] = (
    analysis.evidenceChecklist.length > 0
      ? analysis.evidenceChecklist
      : [
          review.reservationId
            ? `Verify booking confirmation & folio for ${review.reservationId}`
            : 'Locate booking confirmation & PMS folio record',
          'Complete internal department verification before public commitment',
        ]
  ).map((label, idx) => ({
    id: `ev_${idx + 1}`,
    label,
    checked: false,
  }));

  const verifiedFacts: string[] = [];
  if (review.reservationId) {
    verifiedFacts.push(`Platform payload includes Reservation ID ${review.reservationId} (unreconciled against PMS folio).`);
  }
  const unknownFacts = [
    ...evidenceChecklist.map((e) => `Pending verification: ${e.label}`),
    'Internal root cause and staff/system audit outcome remain UNKNOWN until verified.',
  ];

  const ticketId = `esc_${crypto.randomUUID().slice(0, 12)}`;
  db.prepare(
    `INSERT OR REPLACE INTO escalation_tickets (
      id, review_id, category, owner_department, status, priority,
      allegations_json, verified_facts_json, unknown_facts_json,
      next_steps_json, evidence_checklist_json, sop_citations_json,
      policy_evidence_unavailable, triggered_rules_json, prompt_injection_detected,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    ticketId,
    review.id!,
    decision.escalationCategory,
    decision.ownerDepartment,
    decision.priority,
    JSON.stringify(
      analysis.allegations.length > 0
        ? analysis.allegations
        : [analysis.summary]
    ),
    JSON.stringify(verifiedFacts),
    JSON.stringify(unknownFacts),
    JSON.stringify(analysis.suggestedNextSteps),
    JSON.stringify(evidenceChecklist),
    JSON.stringify(ragRes.citations),
    ragRes.policyEvidenceUnavailable ? 1 : 0,
    JSON.stringify(decision.triggeredRules),
    analysis.promptInjectionDetected ? 1 : 0,
    now,
    now
  );

  const respId = `resp_${crypto.randomUUID().slice(0, 12)}`;
  db.prepare(
    `INSERT OR REPLACE INTO responses (
      id, review_id, draft_text, edited_text, approval_decision, approved_by_role,
      publication_state, external_reply_ref, created_at, updated_at
    ) VALUES (?, ?, ?, NULL, 'pending', NULL, 'pending_approval', NULL, ?, ?)`
  ).run(respId, review.id!, analysis.draftReply, now, now);

  db.prepare(`UPDATE reviews SET response_status = 'escalated' WHERE id = ?`).run(
    review.id!
  );

  recordAuditLog({
    actorRole: 'System',
    actorName: 'Revora Decision Engine',
    action: 'ESCALATION_CASE_CREATED',
    entityType: 'escalation',
    entityId: ticketId,
    previousState: 'queued',
    newState: 'open',
    outcome: 'success',
    metadata: {
      reviewId: review.id!,
      category: decision.escalationCategory,
      ownerDepartment: decision.ownerDepartment,
      priority: decision.priority,
      triggeredRules: decision.triggeredRules,
      sopCitationsCount: ragRes.citations.length,
      vectorMode: ragRes.vectorMode,
      aiMode,
    },
  });
}
