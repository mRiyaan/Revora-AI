import {
  CanonicalReview,
  CapabilityNotSupportedError,
  ConnectorCapabilities,
  PROPERTIES,
  PROPERTY_BY_ID,
  PropertyId,
  PublishReplyInput,
  PublishReplyResult,
  ReplyStatusResult,
  ReviewConnector,
  VerifiedWebhookEvent,
  WebhookVerifyInput,
} from '@revora/shared';
import { CONFIG } from '../config';
import { getDb } from '../db/connection';

interface BookingReviewPayload {
  review_id: string;
  property_id: string;
  reservation_id?: string;
  reviewer_name?: string;
  created_timestamp: string;
  last_change_timestamp: string;
  review_score: number;
  content: {
    language_code: string;
    headline?: string;
    positive?: string;
    negative?: string;
  };
  traveler_type?: string;
  reply?: {
    reply_id: string;
    created_timestamp: string;
    text: string;
    status?: 'PENDING_MODERATION' | 'PUBLISHED';
    publish_after_ms?: number;
  } | null;
}

function mapBookingToCanonical(
  item: BookingReviewPayload,
  propertyId: PropertyId
): CanonicalReview {
  const canonicalRating = Math.max(1, Math.min(5, Math.round(item.review_score / 2)));
  const parts = [
    item.content.headline,
    item.content.positive ? `Positive: ${item.content.positive}` : '',
    item.content.negative ? `Negative: ${item.content.negative}` : '',
  ].filter(Boolean);

  return {
    platform: 'booking',
    externalReviewId: item.review_id,
    propertyId,
    reviewerName: item.reviewer_name || `Booking Guest (${item.traveler_type || 'Stay'})`,
    rating: canonicalRating,
    originalRatingText: `${item.review_score.toFixed(1)}/10`,
    reviewTitle: item.content.headline,
    reviewText: parts.join(' '),
    positiveText: item.content.positive,
    negativeText: item.content.negative,
    reservationId: item.reservation_id,
    travelerType: item.traveler_type,
    createdAt: item.created_timestamp.includes('T')
      ? item.created_timestamp
      : `${item.created_timestamp.replace(' ', 'T')}Z`,
    responseStatus: item.reply ? 'approved_published' : 'unanswered',
    rawPayload: item as unknown as Record<string, unknown>,
  };
}

export async function isBookingMockOnline(): Promise<boolean> {
  if (CONFIG.connectorMode === 'loopback') return false;
  try {
    const res = await fetch(
      `${CONFIG.mockBookingUrl}/api/review-api/properties/800101/reviews`,
      {
        headers: { Authorization: `Bearer ${CONFIG.sandboxBookingToken}` },
        signal: AbortSignal.timeout(1500),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export class BookingConnector implements ReviewConnector {
  public readonly platform = 'booking' as const;
  public readonly capabilities: ConnectorCapabilities = {
    readReviews: true,
    readSingleReview: true,
    publishReply: true,
    getReplyStatus: true,
    verifyWebhook: false,
    liveApiNote:
      'Mimics supply-xml.booking.com/review-api (10-pt score, reservation_id, moderated replies, polling only — no webhooks).',
  };

  async fetchReviews(propertyId?: PropertyId): Promise<CanonicalReview[]> {
    const targets = propertyId ? [PROPERTY_BY_ID[propertyId]] : PROPERTIES;
    const online = await isBookingMockOnline();

    if (online) {
      const results: CanonicalReview[] = [];
      for (const prop of targets) {
        const res = await fetch(
          `${CONFIG.mockBookingUrl}/api/review-api/properties/${prop.bookingPropertyId}/reviews`,
          {
            headers: { Authorization: `Bearer ${CONFIG.sandboxBookingToken}` },
            signal: AbortSignal.timeout(3000),
          }
        );
        if (res.ok) {
          const json = (await res.json()) as {
            data?: { reviews?: BookingReviewPayload[] };
          };
          for (const item of json.data?.reviews || []) {
            results.push(mapBookingToCanonical(item, prop.propertyId));
          }
        }
      }
      return results;
    }

    const db = getDb();
    const rows = (propertyId
      ? db
          .prepare(
            `SELECT * FROM sandbox_platform_store WHERE platform = 'booking' AND property_id = ?`
          )
          .all(propertyId)
      : db
          .prepare(`SELECT * FROM sandbox_platform_store WHERE platform = 'booking'`)
          .all()) as Record<string, unknown>[];

    return rows.map((row) => {
      const payload = JSON.parse(String(row.payload_json)) as BookingReviewPayload;
      const reply = row.reply_json ? JSON.parse(String(row.reply_json)) : null;
      return mapBookingToCanonical({ ...payload, reply }, row.property_id as PropertyId);
    });
  }

  async fetchReview(
    propertyId: PropertyId,
    externalReviewId: string
  ): Promise<CanonicalReview | null> {
    const prop = PROPERTY_BY_ID[propertyId];
    const online = await isBookingMockOnline();

    if (online) {
      const res = await fetch(
        `${CONFIG.mockBookingUrl}/api/review-api/properties/${prop.bookingPropertyId}/reviews/${externalReviewId}`,
        {
          headers: { Authorization: `Bearer ${CONFIG.sandboxBookingToken}` },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (res.ok) {
        const json = (await res.json()) as { data?: { review?: BookingReviewPayload } };
        if (json.data?.review) {
          return mapBookingToCanonical(json.data.review, propertyId);
        }
      }
      return null;
    }

    const db = getDb();
    const row = db
      .prepare(
        `SELECT * FROM sandbox_platform_store WHERE platform = 'booking' AND external_review_id = ?`
      )
      .get(externalReviewId) as Record<string, unknown> | undefined;
    if (!row) return null;

    const payload = JSON.parse(String(row.payload_json)) as BookingReviewPayload;
    const reply = row.reply_json ? JSON.parse(String(row.reply_json)) : null;
    return mapBookingToCanonical({ ...payload, reply }, propertyId);
  }

  async publishReply(input: PublishReplyInput): Promise<PublishReplyResult> {
    const prop = PROPERTY_BY_ID[input.propertyId];
    const now = new Date().toISOString();
    const online = await isBookingMockOnline();

    if (online) {
      const res = await fetch(
        `${CONFIG.mockBookingUrl}/api/review-api/properties/${prop.bookingPropertyId}/reviews/${input.externalReviewId}/replies`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CONFIG.sandboxBookingToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: input.replyText,
            language_code: input.language || 'en',
          }),
          signal: AbortSignal.timeout(3000),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Booking.com Mock API error ${res.status}: ${errText}`);
      }
      const json = (await res.json()) as {
        data: {
          reply_id: string;
          status: 'PENDING_MODERATION' | 'PUBLISHED';
          last_change_timestamp: string;
        };
      };
      return {
        externalReplyId: json.data.reply_id,
        publicationState: json.data.status || 'PENDING_MODERATION',
        updatedAt: json.data.last_change_timestamp || now,
        rawResponse: json as unknown as Record<string, unknown>,
      };
    }

    const db = getDb();
    const replyId = `bk_rep_${Date.now()}`;
    const replyObj = {
      reply_id: replyId,
      created_timestamp: now,
      text: input.replyText,
      language_code: input.language || 'en',
      publish_after_ms: Date.now() + 2000,
    };
    db.prepare(
      `UPDATE sandbox_platform_store SET reply_json = ?, updated_at = ? WHERE platform = 'booking' AND external_review_id = ?`
    ).run(JSON.stringify(replyObj), now, input.externalReviewId);

    return {
      externalReplyId: replyId,
      publicationState: 'PENDING_MODERATION',
      updatedAt: now,
      rawResponse: replyObj,
    };
  }

  async getReplyStatus(
    propertyId: PropertyId,
    externalReviewId: string
  ): Promise<ReplyStatusResult> {
    const review = await this.fetchReview(propertyId, externalReviewId);
    const reply = (review?.rawPayload as BookingReviewPayload | undefined)?.reply;
    if (!reply) return { status: 'UNANSWERED' };

    const computedStatus =
      reply.publish_after_ms && Date.now() < reply.publish_after_ms
        ? 'PENDING_MODERATION'
        : reply.status || 'PUBLISHED';
    return {
      externalReplyId: reply.reply_id,
      status: computedStatus,
      replyText: reply.text,
      updatedAt: reply.created_timestamp,
    };
  }

  async verifyWebhook(_input: WebhookVerifyInput): Promise<VerifiedWebhookEvent> {
    throw new CapabilityNotSupportedError(
      'booking',
      'verifyWebhook',
      'Booking.com Connectivity Guest Review API does not support push webhooks; use scheduled polling.'
    );
  }
}

export function buildLoopbackBookingPayload(
  review: CanonicalReview
): BookingReviewPayload {
  const score10 = review.originalRatingText?.includes('/10')
    ? parseFloat(review.originalRatingText.split('/')[0])
    : review.rating * 2;
  return {
    review_id: review.externalReviewId,
    property_id: PROPERTY_BY_ID[review.propertyId].bookingPropertyId,
    reservation_id: review.reservationId || `RES-${review.externalReviewId.slice(-6)}`,
    reviewer_name: review.reviewerName,
    created_timestamp: review.createdAt,
    last_change_timestamp: review.createdAt,
    review_score: score10,
    content: {
      language_code: 'en',
      headline: review.reviewTitle || 'Guest Stay Feedback',
      positive: review.positiveText || (review.rating >= 4 ? review.reviewText : ''),
      negative: review.negativeText || (review.rating <= 3 ? review.reviewText : ''),
    },
    traveler_type: review.travelerType || 'Business',
    reply: null,
  };
}
