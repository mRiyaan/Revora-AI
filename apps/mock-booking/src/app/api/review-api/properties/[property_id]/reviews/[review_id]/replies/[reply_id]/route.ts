import { NextRequest, NextResponse } from 'next/server';
import {
  CORS_HEADERS,
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
  context: { params: Promise<{ property_id: string; review_id: string; reply_id: string }> }
) {
  const authErr = verifyBookingAuth(req);
  if (authErr) return authErr;

  const { property_id, review_id, reply_id } = await context.params;
  const review = readBookingReviews().find(
    (r) => r.property_id === property_id && r.review_id === review_id
  );

  if (!review || !review.reply || review.reply.reply_id !== reply_id) {
    return NextResponse.json(
      {
        errors: [{ code: 'NOT_FOUND', message: 'Reply not found' }],
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
      data: {
        reply_id: review.reply.reply_id,
        status: review.reply.status || 'PUBLISHED',
        text: review.reply.text,
        created_timestamp: review.reply.created_timestamp,
      },
    },
    { headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } }
  );
}
