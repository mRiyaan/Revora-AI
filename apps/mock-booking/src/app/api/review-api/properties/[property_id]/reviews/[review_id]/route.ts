import { NextRequest, NextResponse } from 'next/server';
import {
  CORS_HEADERS,
  VALID_PROPERTY_IDS,
  corsOptionsResponse,
  readBookingReviews,
  verifyBookingAuth,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ property_id: string; review_id: string }> }
) {
  const authErr = verifyBookingAuth(req);
  if (authErr) return authErr;

  const { property_id, review_id } = await context.params;
  if (!VALID_PROPERTY_IDS.has(property_id)) {
    return NextResponse.json(
      {
        errors: [{ code: 'NOT_FOUND', message: 'Property not found' }],
        warnings: [],
        meta: { ruid: 'sandbox-ruid-404' },
      },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const review = readBookingReviews().find(
    (r) => r.property_id === property_id && r.review_id === review_id
  );
  if (!review) {
    return NextResponse.json(
      {
        errors: [{ code: 'NOT_FOUND', message: 'Review not found' }],
        warnings: [],
        meta: { ruid: 'sandbox-ruid-404' },
      },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      errors: [],
      warnings: [],
      meta: { ruid: `sandbox-ruid-${Date.now()}` },
      data: { review },
    },
    { headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } }
  );
}
