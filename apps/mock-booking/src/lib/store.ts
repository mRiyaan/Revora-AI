import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { PROPERTIES, getSeedReviewsForPlatform } from '@revora/shared';

export interface BookingReply {
  reply_id: string;
  created_timestamp: string;
  text: string;
  language_code: string;
  publish_after_ms: number;
  status?: 'PENDING_MODERATION' | 'PUBLISHED';
}

export interface BookingReview {
  review_id: string;
  property_id: string;
  reservation_id: string;
  reviewer_name: string;
  created_timestamp: string;
  last_change_timestamp: string;
  review_score: number;
  content: {
    language_code: string;
    headline: string;
    positive: string;
    negative: string;
  };
  scores: {
    cleanliness: number;
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value_for_money: number;
  };
  traveler_type: string;
  reply: BookingReply | null;
}

export const BOOKING_PROPERTIES = PROPERTIES.map((p) => ({
  property_id: p.bookingPropertyId,
  canonical_id: p.propertyId,
  name: p.name,
  city: p.city,
  address: p.address,
}));

export const VALID_PROPERTY_IDS = new Set(BOOKING_PROPERTIES.map((p) => p.property_id));

const DATA_FILE = path.resolve(process.cwd(), 'data', 'reviews.json');

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function corsOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function verifyBookingAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.SANDBOX_BOOKING_TOKEN || 'sandbox-booking-jwt';
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      {
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing machine account JWT',
          },
        ],
        warnings: [],
        meta: { ruid: 'sandbox-ruid-401' },
      },
      { status: 401, headers: CORS_HEADERS }
    );
  }
  return null;
}

function buildInitialReviews(): BookingReview[] {
  const seeds = getSeedReviewsForPlatform('booking');
  return seeds.map((s) => {
    const prop = PROPERTIES.find((p) => p.propertyId === s.propertyId)!;
    const score10 = s.originalRatingText?.includes('/10')
      ? parseFloat(s.originalRatingText.split('/')[0])
      : s.rating * 2;
    const base = Math.max(2, Math.min(10, score10));
    return {
      review_id: s.externalReviewId,
      property_id: prop.bookingPropertyId,
      reservation_id: s.reservationId || `RES-${s.externalReviewId.slice(-6)}`,
      reviewer_name: s.reviewerName,
      created_timestamp: s.createdAt.replace('T', ' ').slice(0, 19),
      last_change_timestamp: s.createdAt.replace('T', ' ').slice(0, 19),
      review_score: score10,
      content: {
        language_code: 'en',
        headline: s.reviewTitle || 'Guest Stay Review',
        positive: s.positiveText || (s.rating >= 4 ? s.reviewText : ''),
        negative: s.negativeText || (s.rating <= 3 ? s.reviewText : ''),
      },
      scores: {
        cleanliness: base,
        comfort: Math.min(10, base + 0.5),
        location: 9.2,
        facilities: base,
        staff: Math.min(10, base + 0.3),
        value_for_money: s.scenarioHint === 'billing' ? 2.0 : base,
      },
      traveler_type: s.travelerType || 'Business',
      reply: null,
    };
  });
}

function resolveModerationStatus(review: BookingReview): BookingReview {
  if (!review.reply) return review;
  const computed: 'PENDING_MODERATION' | 'PUBLISHED' =
    Date.now() < review.reply.publish_after_ms ? 'PENDING_MODERATION' : 'PUBLISHED';
  return {
    ...review,
    reply: {
      ...review.reply,
      status: computed,
    },
  };
}

export function readBookingReviews(): BookingReview[] {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = buildInitialReviews();
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial.map(resolveModerationStatus);
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as BookingReview[];
  return raw.map(resolveModerationStatus);
}

export function writeBookingReviews(reviews: BookingReview[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2));
}

export function validateBookingModeration(text: string): string | null {
  if (!text || text.trim().length === 0 || text.length > 2000) {
    return 'Reply text must be between 1 and 2000 characters.';
  }
  if (/(https?:\/\/|www\.|\b\S+@\S+\.\S+\b|\b\d{10,}\b)/i.test(text)) {
    return 'External URLs, email addresses, or phone numbers are not permitted in Booking.com replies.';
  }
  return null;
}
