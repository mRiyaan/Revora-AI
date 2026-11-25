import { NextRequest, NextResponse } from 'next/server';
import {
  CORS_HEADERS,
  corsOptionsResponse,
  readGbpReviews,
  validateLocation,
  verifyGbpAuth,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
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

  const review = readGbpReviews().find(
    (r) => r.locationId === locationId && r.reviewId === reviewId
  );
  if (!review) {
    return NextResponse.json(
      { error: { code: 404, message: 'Review not found', status: 'NOT_FOUND' } },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(review, {
    headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' },
  });
}
