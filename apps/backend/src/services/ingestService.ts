import crypto from 'node:crypto';
import { CanonicalReview, PlatformId, PROPERTY_BY_ID } from '@revora/shared';
import { getDb } from '../db/connection';
import { recordAuditLog } from '../db/audit';
import { enqueueReviewJob } from '../queue/jobQueue';
import { buildLoopbackGooglePayload } from '../connectors/googleConnector';
import { buildLoopbackBookingPayload } from '../connectors/bookingConnector';
import { buildLoopbackTerraPayload } from '../connectors/tripadvisorConnector';

export function buildPlatformNativePayload(review: CanonicalReview): Record<string, unknown> {
  if (review.rawPayload) return review.rawPayload;
  if (review.platform === 'google') {
    return buildLoopbackGooglePayload(review) as unknown as Record<string, unknown>;
  }
  if (review.platform === 'booking') {
    return buildLoopbackBookingPayload(review) as unknown as Record<string, unknown>;
  }
  return buildLoopbackTerraPayload(review) as unknown as Record<string, unknown>;
}

export function getExternalLocationId(
  platform: PlatformId,
  propertyId: CanonicalReview['propertyId']
): string {
  const prop = PROPERTY_BY_ID[propertyId];
  if (platform === 'google') return prop.googleLocationId;
  if (platform === 'booking') return prop.bookingPropertyId;
  return String(prop.tripadvisorLocationId);
}

export function ingestCanonicalReview(
  review: CanonicalReview,
  sourceLabel = 'connector_ingest'
): {
  reviewId: string;
  deduplicated: boolean;
  enqueued: boolean;
  jobId: string;
} {
  const db = getDb();
  const now = new Date().toISOString();

  // Keep sandbox loopback mirror populated for demo reliability
  const extLocId = getExternalLocationId(review.platform, review.propertyId);
  const nativePayload = buildPlatformNativePayload(review);
  db.prepare(
    `INSERT OR IGNORE INTO sandbox_platform_store (
      id, platform, external_location_id, property_id, external_review_id, payload_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `sps_${crypto.randomUUID().slice(0, 12)}`,
    review.platform,
    extLocId,
    review.propertyId,
    review.externalReviewId,
    JSON.stringify(nativePayload),
    now
  );

  const existing = db
    .prepare(
      `SELECT id FROM reviews WHERE platform = ? AND external_review_id = ?`
    )
    .get(review.platform, review.externalReviewId) as { id: string } | undefined;

  if (existing) {
    const idempotencyKey = `process:${review.platform}:${review.externalReviewId}`;
    const jobRes = enqueueReviewJob(existing.id, idempotencyKey, 'process_review');
    return {
      reviewId: existing.id,
      deduplicated: true,
      enqueued: jobRes.enqueued,
      jobId: jobRes.job.id,
    };
  }

  const reviewId = `rev_${crypto.randomUUID().slice(0, 12)}`;
  db.prepare(
    `INSERT INTO reviews (
      id, platform, external_review_id, property_id, reviewer_name, rating,
      original_rating_text, review_title, review_text, positive_text, negative_text,
      reservation_id, traveler_type, scenario_hint, raw_payload_json,
      created_at, ingested_at, response_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')`
  ).run(
    reviewId,
    review.platform,
    review.externalReviewId,
    review.propertyId,
    review.reviewerName,
    review.rating,
    review.originalRatingText ?? null,
    review.reviewTitle ?? null,
    review.reviewText,
    review.positiveText ?? null,
    review.negativeText ?? null,
    review.reservationId ?? null,
    review.travelerType ?? null,
    review.scenarioHint ?? null,
    JSON.stringify(nativePayload),
    review.createdAt,
    now
  );

  const idempotencyKey = `process:${review.platform}:${review.externalReviewId}`;
  const jobRes = enqueueReviewJob(reviewId, idempotencyKey, 'process_review');

  recordAuditLog({
    actorRole: 'System',
    actorName: sourceLabel,
    action: 'REVIEW_INGESTED_AND_QUEUED',
    entityType: 'review',
    entityId: reviewId,
    previousState: 'external',
    newState: 'queued',
    outcome: 'success',
    metadata: {
      platform: review.platform,
      externalReviewId: review.externalReviewId,
      propertyId: review.propertyId,
      idempotencyKey,
    },
  });

  return {
    reviewId,
    deduplicated: false,
    enqueued: jobRes.enqueued,
    jobId: jobRes.job.id,
  };
}
