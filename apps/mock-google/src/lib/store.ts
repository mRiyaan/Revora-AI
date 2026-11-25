import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { PROPERTIES, getSeedReviewsForPlatform } from '@revora/shared';

export type StarRatingEnum = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';

export const STAR_ENUM_TO_NUM: Record<StarRatingEnum, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export const NUM_TO_STAR_ENUM: Record<number, StarRatingEnum> = {
  1: 'ONE',
  2: 'TWO',
  3: 'THREE',
  4: 'FOUR',
  5: 'FIVE',
};

export interface GbpReview {
  reviewId: string;
  locationId: string;
  reviewer: {
    profilePhotoUrl: string;
    displayName: string;
    isAnonymous: boolean;
  };
  starRating: StarRatingEnum;
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply: {
    comment: string;
    updateTime: string;
  } | null;
}

export const ACCOUNT_ID = 'acc-aurum-01';
export const VALID_LOCATION_IDS = new Set(PROPERTIES.map((p) => p.googleLocationId));

const DATA_FILE = path.resolve(process.cwd(), 'data', 'reviews.json');

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Sandbox-Webhook-Secret',
};

export function corsOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function verifyGbpAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.SANDBOX_GBP_TOKEN || 'sandbox-gbp-token';
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      {
        error: {
          code: 401,
          message: 'Invalid or missing OAuth2 bearer token',
          status: 'UNAUTHENTICATED',
        },
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }
  return null;
}

export function validateLocation(
  accountId: string,
  locationId: string
): NextResponse | null {
  if (accountId !== ACCOUNT_ID || !VALID_LOCATION_IDS.has(locationId)) {
    return NextResponse.json(
      {
        error: {
          code: 404,
          message: `Unknown accountId '${accountId}' or locationId '${locationId}'`,
          status: 'NOT_FOUND',
        },
      },
      { status: 404, headers: CORS_HEADERS }
    );
  }
  return null;
}

function buildInitialReviews(): GbpReview[] {
  const seeds = getSeedReviewsForPlatform('google');
  return seeds.map((s) => {
    const prop = PROPERTIES.find((p) => p.propertyId === s.propertyId)!;
    return {
      reviewId: s.externalReviewId,
      locationId: prop.googleLocationId,
      reviewer: {
        profilePhotoUrl: '',
        displayName: s.reviewerName,
        isAnonymous: false,
      },
      starRating: NUM_TO_STAR_ENUM[s.rating] || 'FIVE',
      comment: s.reviewText,
      createTime: s.createdAt,
      updateTime: s.createdAt,
      reviewReply: null,
    };
  });
}

export function readGbpReviews(): GbpReview[] {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = buildInitialReviews();
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as GbpReview[];
}

export function writeGbpReviews(reviews: GbpReview[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2));
}

export async function dispatchPubSubWebhook(
  locationId: string,
  reviewId: string
): Promise<boolean> {
  const webhookUrl =
    process.env.CRM_WEBHOOK_URL || 'http://localhost:4000/api/webhooks/google';
  const secret =
    process.env.SANDBOX_WEBHOOK_SECRET || 'sandbox-gbp-webhook-secret';

  const innerPayload = {
    type: 'NEW_REVIEW',
    location: `accounts/${ACCOUNT_ID}/locations/${locationId}`,
    review: `accounts/${ACCOUNT_ID}/locations/${locationId}/reviews/${reviewId}`,
  };

  const envelope = {
    message: {
      data: Buffer.from(JSON.stringify(innerPayload)).toString('base64'),
      attributes: { accountId: ACCOUNT_ID },
      messageId: `msg-${Date.now()}`,
    },
    subscription: 'projects/revora-sandbox/subscriptions/gbp-reviews-push',
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sandbox-Webhook-Secret': secret,
      },
      body: JSON.stringify(envelope),
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
