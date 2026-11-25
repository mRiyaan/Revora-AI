import { NextRequest, NextResponse } from 'next/server';
import {
  CORS_HEADERS,
  GbpReview,
  StarRatingEnum,
  VALID_LOCATION_IDS,
  corsOptionsResponse,
  dispatchPubSubWebhook,
  readGbpReviews,
  writeGbpReviews,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    locationId?: string;
    displayName?: string;
    starRating?: StarRatingEnum;
    comment?: string;
  };

  const locationId = body.locationId || 'loc-blr-001';
  if (!VALID_LOCATION_IDS.has(locationId)) {
    return NextResponse.json(
      { error: `Invalid locationId: ${locationId}` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const validStars: StarRatingEnum[] = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
  const starRating: StarRatingEnum =
    body.starRating && validStars.includes(body.starRating)
      ? body.starRating
      : 'FIVE';

  const now = new Date().toISOString();
  const suffix = String(Date.now()).slice(-6);
  const reviewId = `gbp_rev_${suffix}`;

  const newReview: GbpReview = {
    reviewId,
    locationId,
    reviewer: {
      profilePhotoUrl: '',
      displayName: body.displayName?.trim() || 'Google Local Guide',
      isAnonymous: false,
    },
    starRating,
    comment: body.comment?.trim() || '',
    createTime: now,
    updateTime: now,
    reviewReply: null,
  };

  const current = readGbpReviews();
  writeGbpReviews([newReview, ...current]);

  const webhookDelivered = await dispatchPubSubWebhook(locationId, reviewId);

  return NextResponse.json(
    { review: newReview, webhookDelivered },
    { status: 201, headers: CORS_HEADERS }
  );
}
