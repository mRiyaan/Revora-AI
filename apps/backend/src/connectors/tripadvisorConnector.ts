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

interface TerraReviewPayload {
  id: number | string;
  location_id: number;
  title?: string;
  text: string;
  rating: number;
  published_date: string;
  trip_type?: string;
  user?: { username?: string };
  owner_response?: {
    id: string;
    author_connection: string;
    language: string;
    text: string;
    published_date: string;
    status?: 'PENDING_MODERATION' | 'PUBLISHED';
    publish_after_ms?: number;
  } | null;
}

function mapTerraToCanonical(
  item: TerraReviewPayload,
  propertyId: PropertyId
): CanonicalReview {
  return {
    platform: 'tripadvisor',
    externalReviewId: String(item.id),
    propertyId,
    reviewerName: item.user?.username || 'Tripadvisor Traveler',
    rating: Math.max(1, Math.min(5, Math.round(item.rating))),
    originalRatingText: `${item.rating}/5 bubbles`,
    reviewTitle: item.title,
    reviewText: item.title ? `${item.title}. ${item.text}` : item.text,
    travelerType: item.trip_type,
    createdAt: item.published_date,
    responseStatus: item.owner_response ? 'approved_published' : 'unanswered',
    rawPayload: item as unknown as Record<string, unknown>,
  };
}

export async function isTripadvisorMockOnline(): Promise<boolean> {
  if (CONFIG.connectorMode === 'loopback') return false;
  try {
    const res = await fetch(`${CONFIG.mockTripadvisorUrl}/api/allowlist`, {
      headers: { 'x-oauth-token': CONFIG.sandboxTerraOauthToken },
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export class TripadvisorConnector implements ReviewConnector {
  public readonly platform = 'tripadvisor' as const;
  public readonly capabilities: ConnectorCapabilities = {
    readReviews: true,
    readSingleReview: true,
    publishReply: true,
    getReplyStatus: true,
    verifyWebhook: false,
    liveApiNote:
      'Mimics terra.tripadvisor.com/api (allowlist /api/allowlist, author_connection, 409 conflict guard, polling only).',
  };

  async fetchReviews(propertyId?: PropertyId): Promise<CanonicalReview[]> {
    const targets = propertyId ? [PROPERTY_BY_ID[propertyId]] : PROPERTIES;
    const online = await isTripadvisorMockOnline();

    if (online) {
      const results: CanonicalReview[] = [];
      for (const prop of targets) {
        const res = await fetch(
          `${CONFIG.mockTripadvisorUrl}/api/locations/${prop.tripadvisorLocationId}/reviews`,
          {
            headers: { 'x-oauth-token': CONFIG.sandboxTerraOauthToken },
            signal: AbortSignal.timeout(3000),
          }
        );
        if (res.ok) {
          const json = (await res.json()) as { data?: TerraReviewPayload[] };
          for (const item of json.data || []) {
            results.push(mapTerraToCanonical(item, prop.propertyId));
          }
        }
      }
      return results;
    }

    const db = getDb();
    const rows = (propertyId
      ? db
          .prepare(
            `SELECT * FROM sandbox_platform_store WHERE platform = 'tripadvisor' AND property_id = ?`
          )
          .all(propertyId)
      : db
          .prepare(`SELECT * FROM sandbox_platform_store WHERE platform = 'tripadvisor'`)
          .all()) as Record<string, unknown>[];

    return rows.map((row) => {
      const payload = JSON.parse(String(row.payload_json)) as TerraReviewPayload;
      const reply = row.reply_json ? JSON.parse(String(row.reply_json)) : null;
      return mapTerraToCanonical(
        { ...payload, owner_response: reply },
        row.property_id as PropertyId
      );
    });
  }

  async fetchReview(
    propertyId: PropertyId,
    externalReviewId: string
  ): Promise<CanonicalReview | null> {
    const prop = PROPERTY_BY_ID[propertyId];
    const online = await isTripadvisorMockOnline();

    if (online) {
      const res = await fetch(
        `${CONFIG.mockTripadvisorUrl}/api/locations/${prop.tripadvisorLocationId}/reviews/${externalReviewId}`,
        {
          headers: { 'x-oauth-token': CONFIG.sandboxTerraOauthToken },
          signal: AbortSignal.timeout(3000),
        }
      );
      if (res.ok) {
        const json = (await res.json()) as { data?: TerraReviewPayload };
        if (json.data) return mapTerraToCanonical(json.data, propertyId);
      }
      return null;
    }

    const db = getDb();
    const row = db
      .prepare(
        `SELECT * FROM sandbox_platform_store WHERE platform = 'tripadvisor' AND external_review_id = ?`
      )
      .get(externalReviewId) as Record<string, unknown> | undefined;
    if (!row) return null;

    const payload = JSON.parse(String(row.payload_json)) as TerraReviewPayload;
    const reply = row.reply_json ? JSON.parse(String(row.reply_json)) : null;
    return mapTerraToCanonical({ ...payload, owner_response: reply }, propertyId);
  }

  async publishReply(input: PublishReplyInput): Promise<PublishReplyResult> {
    const prop = PROPERTY_BY_ID[input.propertyId];
    const now = new Date().toISOString();
    const online = await isTripadvisorMockOnline();
    const authorConnection = input.authorConnection || 'General Manager';

    if (online) {
      const url = `${CONFIG.mockTripadvisorUrl}/api/locations/${prop.tripadvisorLocationId}/reviews/${input.externalReviewId}/owner-responses`;
      let res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-oauth-token': CONFIG.sandboxTerraOauthToken,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          author_connection: authorConnection,
          language: input.language || 'en',
          text: input.replyText,
        }),
        signal: AbortSignal.timeout(3000),
      });

      // Handle Tripadvisor Terra 409 Conflict cleanly if updating an existing response
      if (res.status === 409) {
        await fetch(url, {
          method: 'DELETE',
          headers: { 'x-oauth-token': CONFIG.sandboxTerraOauthToken },
          signal: AbortSignal.timeout(3000),
        });
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'x-oauth-token': CONFIG.sandboxTerraOauthToken,
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({
            author_connection: authorConnection,
            language: input.language || 'en',
            text: input.replyText,
          }),
          signal: AbortSignal.timeout(3000),
        });
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Tripadvisor Terra Mock API error ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as {
        id: string;
        published_date: string;
        status: 'PENDING_MODERATION' | 'PUBLISHED';
      };

      return {
        externalReplyId: data.id,
        publicationState: data.status || 'PENDING_MODERATION',
        updatedAt: data.published_date || now,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    }

    const db = getDb();
    const replyId = `ta_resp_${Date.now()}`;
    const replyObj = {
      id: replyId,
      author_connection: authorConnection,
      language: input.language || 'en',
      text: input.replyText,
      published_date: now,
      publish_after_ms: Date.now() + 2000,
    };
    db.prepare(
      `UPDATE sandbox_platform_store SET reply_json = ?, updated_at = ? WHERE platform = 'tripadvisor' AND external_review_id = ?`
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
    const resp = (review?.rawPayload as TerraReviewPayload | undefined)?.owner_response;
    if (!resp) return { status: 'UNANSWERED' };

    const computedStatus =
      resp.publish_after_ms && Date.now() < resp.publish_after_ms
        ? 'PENDING_MODERATION'
        : resp.status || 'PUBLISHED';
    return {
      externalReplyId: resp.id,
      status: computedStatus,
      replyText: resp.text,
      updatedAt: resp.published_date,
    };
  }

  async verifyWebhook(_input: WebhookVerifyInput): Promise<VerifiedWebhookEvent> {
    throw new CapabilityNotSupportedError(
      'tripadvisor',
      'verifyWebhook',
      'Tripadvisor Terra API does not provide push webhooks; use scheduled polling.'
    );
  }
}

export function buildLoopbackTerraPayload(review: CanonicalReview): TerraReviewPayload {
  return {
    id: review.externalReviewId,
    location_id: PROPERTY_BY_ID[review.propertyId].tripadvisorLocationId,
    title: review.reviewTitle || 'Traveler Review',
    text: review.reviewText,
    rating: review.rating,
    published_date: review.createdAt,
    trip_type: review.travelerType || 'Couples',
    user: { username: review.reviewerName },
    owner_response: null,
  };
}
