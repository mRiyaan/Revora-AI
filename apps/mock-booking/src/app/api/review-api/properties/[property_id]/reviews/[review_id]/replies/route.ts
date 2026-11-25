import { NextRequest, NextResponse } from 'next/server';
import {
  CORS_HEADERS,
  VALID_PROPERTY_IDS,
  corsOptionsResponse,
  readBookingReviews,
  validateBookingModeration,
  verifyBookingAuth,
  writeBookingReviews,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(
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

  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    language_code?: string;
  };
  const text = (body.text || '').trim();
  const moderationErr = validateBookingModeration(text);
  if (moderationErr) {
    return NextResponse.json(
      {
        errors: [{ code: 'MODERATION_REJECTED', message: moderationErr }],
        warnings: [],
        meta: { ruid: 'sandbox-ruid-400' },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const reviews = readBookingReviews();
  const idx = reviews.findIndex(
    (r) => r.property_id === property_id && r.review_id === review_id
  );
  if (idx === -1) {
    return NextResponse.json(
      {
        errors: [{ code: 'NOT_FOUND', message: 'Review not found' }],
        warnings: [],
        meta: { ruid: 'sandbox-ruid-404' },
      },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const replyId = `rep_${Date.now()}`;
  reviews[idx] = {
    ...reviews[idx],
    last_change_timestamp: ts,
    reply: {
      reply_id: replyId,
      created_timestamp: ts,
      text,
      language_code: body.language_code || 'en',
      publish_after_ms: Date.now() + 2000,
    },
  };
  writeBookingReviews(reviews);

  return NextResponse.json(
    {
      errors: [],
      warnings: [],
      meta: { ruid: `sandbox-ruid-${Date.now()}` },
      data: {
        success: true,
        reply_id: replyId,
        status: 'PENDING_MODERATION',
        last_change_timestamp: ts,
      },
    },
    { status: 201, headers: CORS_HEADERS }
  );
}
