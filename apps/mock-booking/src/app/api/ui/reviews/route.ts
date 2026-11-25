import { NextRequest, NextResponse } from 'next/server';
import {
  BookingReview,
  CORS_HEADERS,
  VALID_PROPERTY_IDS,
  corsOptionsResponse,
  readBookingReviews,
  writeBookingReviews,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    property_id?: string;
    reviewer_name?: string;
    review_score?: number;
    headline?: string;
    positive?: string;
    negative?: string;
    traveler_type?: string;
    reservation_id?: string;
  };

  const property_id = body.property_id || '800101';
  if (!VALID_PROPERTY_IDS.has(property_id)) {
    return NextResponse.json(
      { error: `Invalid property_id: ${property_id}` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const score = Math.max(1, Math.min(10, Number(body.review_score || 9.0)));
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const suffix = String(Date.now()).slice(-6);

  const newReview: BookingReview = {
    review_id: `bk_rev_${suffix}`,
    property_id,
    reservation_id: body.reservation_id?.trim() || `RES-${suffix}`,
    reviewer_name: body.reviewer_name?.trim() || 'Booking Guest',
    created_timestamp: ts,
    last_change_timestamp: ts,
    review_score: score,
    content: {
      language_code: 'en',
      headline: body.headline?.trim() || 'Guest Stay Feedback',
      positive: body.positive?.trim() || '',
      negative: body.negative?.trim() || '',
    },
    scores: {
      cleanliness: score,
      comfort: score,
      location: Math.min(10, score + 0.5),
      facilities: score,
      staff: score,
      value_for_money: score,
    },
    traveler_type: body.traveler_type || 'Business',
    reply: null,
  };

  const current = readBookingReviews();
  writeBookingReviews([newReview, ...current]);

  return NextResponse.json(
    { review: newReview },
    { status: 201, headers: CORS_HEADERS }
  );
}
