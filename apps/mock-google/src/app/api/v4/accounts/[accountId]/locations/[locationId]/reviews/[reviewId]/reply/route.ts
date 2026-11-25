import { NextRequest, NextResponse } from 'next/server';
import {
  CORS_HEADERS,
  corsOptionsResponse,
  readGbpReviews,
  validateLocation,
  verifyGbpAuth,
  writeGbpReviews,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function PUT(
  req: NextRequest,
  context: {
    params: Promise<{ accountId: string; locationId: string; reviewId: string }>;
  }
) {
  const authErr = verifyGbpAuth(req);
  if (authErr) return authErr;

  const { accountId, locationId, reviewId } = await context.params;
  const locErr = validateLocation(accountId, locationId);
  if (locErr) return locErr;

  const body = (await req.json().catch(() => ({}))) as { comment?: string };
  const comment = (body.comment || '').trim();
  if (!comment || comment.length > 4096) {
    return NextResponse.json(
      {
        error: {
          code: 400,
          message: 'Reply comment must be 1–4096 characters.',
          status: 'INVALID_ARGUMENT',
        },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const reviews = readGbpReviews();
  const idx = reviews.findIndex(
    (r) => r.locationId === locationId && r.reviewId === reviewId
  );
  if (idx === -1) {
    return NextResponse.json(
      { error: { code: 404, message: 'Review not found', status: 'NOT_FOUND' } },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const now = new Date().toISOString();
  const reviewReply = { comment, updateTime: now };
  reviews[idx] = { ...reviews[idx], updateTime: now, reviewReply };
  writeGbpReviews(reviews);

  return NextResponse.json(reviewReply, { headers: CORS_HEADERS });
}

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{ accountId: string; locationId: string; reviewId: string }>;
  }
) {
  const authErr = verifyGbpAuth(req);
  if (authErr) return authErr;

  const { accountId, locationId, reviewId } = await context.params;
  const locErr = validateLocation(accountId, locationId);
  if (locErr) return locErr;

  const reviews = readGbpReviews();
  const idx = reviews.findIndex(
    (r) => r.locationId === locationId && r.reviewId === reviewId
  );
  if (idx === -1) {
    return NextResponse.json(
      { error: { code: 404, message: 'Review not found', status: 'NOT_FOUND' } },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  reviews[idx] = {
    ...reviews[idx],
    updateTime: new Date().toISOString(),
    reviewReply: null,
  };
  writeGbpReviews(reviews);

  return NextResponse.json({}, { headers: CORS_HEADERS });
}
