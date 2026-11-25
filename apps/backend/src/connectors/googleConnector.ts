import crypto from 'node:crypto';
import {
  CanonicalReview,
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
  resolvePropertyByExternalId,
} from '@revora/shared';
import { CONFIG } from '../config';
import { getDb } from '../db/connection';

const STAR_ENUM_TO_NUM: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

const NUM_TO_STAR_ENUM: Record<number, string> = {
  1: 'ONE',
  2: 'TWO',
  3: 'THREE',
  4: 'FOUR',
  5: 'FIVE',
};

interface GbpReviewPayload {
  reviewId: string;
  locationId?: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating: string;
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string } | null;
}

function mapGbpToCanonical(
  item: GbpReviewPayload,
  propertyId: PropertyId
): CanonicalReview {
  return {
    platform: 'google',
    externalReviewId: item.reviewId,
    propertyId,
    reviewerName: item.reviewer?.displayName || 'Google Guest',
    rating: STAR_ENUM_TO_NUM[item.starRating] ?? 3,
    originalRatingText: item.starRating,
    reviewText: item.comment || '(Rating only — no written comment)',
    createdAt: item.createTime,
    responseStatus: item.reviewReply ? 'approved_published' : 'unanswered',
    rawPayload: item as unknown as Record<string, unknown>,
  };
}

export async function isGoogleMockOnline(): Promise<boolean> {
  if (CONFIG.connectorMode === 'loopback') return false;
  try {
    const res = await fetch(
      `${CONFIG.mockGoogleUrl}/api/v4/accounts/acc-aurum-01/locations/loc-blr-001/reviews`,
      {
        headers: { Authorization: `Bearer ${CONFIG.sandboxGbpToken}` },
        signal: AbortSignal.timeout(1500),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export class GoogleConnector implements ReviewConnector {
  public readonly platform = 'google' as const;
  public readonly capabilities: ConnectorCapabilities = {
    readReviews: true,
    readSingleReview: true,
    publishReply: true,
    getReplyStatus: true,
    verifyWebhook: true,
    liveApiNote:
      'Mimics mybusiness.googleapis.com/v4 (OAuth 2.0 Bearer + Cloud Pub/Sub Base64 NEW_REVIEW push).',
  };

  async fetchReviews(propertyId?: PropertyId): Promise<CanonicalReview[]> {
    const targets = propertyId ? [PROPERTY_BY_ID[propertyId]] : PROPERTIES;
    const online = await isGoogleMockOnline();

    if (online) {
      const results: CanonicalReview[] = [];
      for (const prop of targets) {
        const res = await fetch(
          `${CONFIG.mockGoogleUrl}/api/v4/accounts/${prop.googleAccountId}/locations/${prop.googleLocationId}/reviews`,
          {
            headers: { Authorization: `Bearer ${CONFIG.sandboxGbpToken}` },
            signal: AbortSignal.timeout(3000),
          }
        );
        if (res.ok) {
          const data = (await res.json()) as { reviews?: GbpReviewPayload[] };
          for (const item of data.reviews || []) {
            results.push(mapGbpToCanonical(item, prop.propertyId));
          }
        }
      }
      return results;
    }

    // Loopback sandbox store fallback
    const db = getDb();
    const rows = (propertyId
      ? db
          .prepare(
            `SELECT * FROM sandbox_platform_store WHERE platform = 'google' AND property_id = ?`
          )
          .all(propertyId)
      : db
          .prepare(`SELECT * FROM sandbox_platform_store WHERE platform = 'google'`)
          .all()) as Record<string, unknown>[];

    return rows.map((row) => {
      const payload = JSON.parse(String(row.payload_json)) as GbpReviewPayload;
      const reply = row.reply_json ? JSON.parse(String(row.reply_json)) : null;
      return mapGbpToCanonical(
        { ...payload, reviewReply: reply },
        row.property_id as PropertyId
      );
    });
  }

  async fetchReview(
    propertyId: PropertyId,
    externalReviewId: string
  ): Promise<CanonicalReview | null> {
    const prop = PROPERTY_BY_ID[propertyId];
    const online = await isGoogleMockOnline();

    if (online) {
      const res = await fetch(
        `${CONFIG.mockGoogleUrl}/api/v4/accounts/${prop.googleAccountId}/locations/${prop.googleLocationId}/reviews/${externalReviewId}`,
        {
          headers: { Authorization: `Bearer ${CONFIG.sandboxGbpToken}` },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (res.ok) {
        const payload = (await res.json()) as GbpReviewPayload;
        return mapGbpToCanonical(payload, propertyId);
      }
      return null;
    }

    const db = getDb();
    const row = db
      .prepare(
        `SELECT * FROM sandbox_platform_store WHERE platform = 'google' AND external_review_id = ?`
      )
      .get(externalReviewId) as Record<string, unknown> | undefined;
    if (!row) return null;

    const payload = JSON.parse(String(row.payload_json)) as GbpReviewPayload;
    const reply = row.reply_json ? JSON.parse(String(row.reply_json)) : null;
    return mapGbpToCanonical({ ...payload, reviewReply: reply }, propertyId);
  }

  async publishReply(input: PublishReplyInput): Promise<PublishReplyResult> {
    const prop = PROPERTY_BY_ID[input.propertyId];
    const now = new Date().toISOString();
    const online = await isGoogleMockOnline();

    if (online) {
      const res = await fetch(
        `${CONFIG.mockGoogleUrl}/api/v4/accounts/${prop.googleAccountId}/locations/${prop.googleLocationId}/reviews/${input.externalReviewId}/reply`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${CONFIG.sandboxGbpToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment: input.replyText }),
          signal: AbortSignal.timeout(3000),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google Mock API error ${res.status}: ${errText}`);
      }
      const data = (await res.json()) as { comment: string; updateTime: string };
      return {
        externalReplyId: `gbp_reply_${input.externalReviewId}`,
        publicationState: 'PUBLISHED',
        updatedAt: data.updateTime || now,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    }

    // Loopback persistence
    const db = getDb();
    const replyObj = { comment: input.replyText, updateTime: now };
    db.prepare(
      `UPDATE sandbox_platform_store SET reply_json = ?, updated_at = ? WHERE platform = 'google' AND external_review_id = ?`
    ).run(JSON.stringify(replyObj), now, input.externalReviewId);

    return {
      externalReplyId: `gbp_reply_${input.externalReviewId}`,
      publicationState: 'SANDBOX_LOCAL',
      updatedAt: now,
      rawResponse: replyObj,
    };
  }

  async getReplyStatus(
    propertyId: PropertyId,
    externalReviewId: string
  ): Promise<ReplyStatusResult> {
    const review = await this.fetchReview(propertyId, externalReviewId);
    const reply = (review?.rawPayload as GbpReviewPayload | undefined)?.reviewReply;
    if (!reply) {
      return { status: 'UNANSWERED' };
    }
    return {
      externalReplyId: `gbp_reply_${externalReviewId}`,
      status: 'PUBLISHED',
      replyText: reply.comment,
      updatedAt: reply.updateTime,
    };
  }

  async verifyWebhook(input: WebhookVerifyInput): Promise<VerifiedWebhookEvent> {
    const secretHeader =
      input.headers['x-sandbox-webhook-secret'] ||
      input.headers['X-Sandbox-Webhook-Secret'];
    const secret = Array.isArray(secretHeader) ? secretHeader[0] : secretHeader;
    if (secret && secret !== CONFIG.sandboxWebhookSecret) {
      throw new Error('Invalid Google Pub/Sub webhook secret.');
    }

    const envelope = input.body as {
      message?: { data?: string };
    };
    const encoded = envelope?.message?.data;
    if (!encoded) {
      throw new Error('Missing Pub/Sub message.data base64 payload.');
    }

    const decoded = JSON.parse(
      Buffer.from(encoded, 'base64').toString('utf8')
    ) as {
      type: string;
      location: string;
      review: string;
    };

    const parts = decoded.review.split('/');
    const externalReviewId = parts[parts.length - 1];
    const prop = resolvePropertyByExternalId('google', decoded.location);
    if (!prop) {
      throw new Error(`Unknown Google location path: ${decoded.location}`);
    }

    return {
      platform: 'google',
      eventType: decoded.type === 'NEW_REVIEW' ? 'NEW_REVIEW' : 'UPDATED_REVIEW',
      propertyId: prop.propertyId,
      externalReviewId,
      externalLocationPath: decoded.location,
    };
  }
}

export function buildLoopbackGooglePayload(review: CanonicalReview): GbpReviewPayload {
  return {
    reviewId: review.externalReviewId,
    locationId: PROPERTY_BY_ID[review.propertyId].googleLocationId,
    reviewer: {
      displayName: review.reviewerName,
      profilePhotoUrl: '',
      isAnonymous: false,
    },
    starRating: NUM_TO_STAR_ENUM[review.rating] || 'FIVE',
    comment: review.reviewText,
    createTime: review.createdAt,
    updateTime: review.createdAt,
    reviewReply: null,
  };
}

export function createPubSubEnvelope(propertyId: PropertyId, reviewId: string) {
  const prop = PROPERTY_BY_ID[propertyId];
  const inner = {
    type: 'NEW_REVIEW',
    location: prop.googleLocationPath,
    review: `${prop.googleLocationPath}/reviews/${reviewId}`,
  };
  return {
    message: {
      data: Buffer.from(JSON.stringify(inner)).toString('base64'),
      attributes: { accountId: prop.googleAccountId },
      messageId: `msg_${crypto.randomUUID().slice(0, 8)}`,
    },
    subscription: 'projects/revora-sandbox/subscriptions/gbp-reviews-push',
  };
}
