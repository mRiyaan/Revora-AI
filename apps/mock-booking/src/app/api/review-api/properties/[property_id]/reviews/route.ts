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
  context: { params: Promise<{ property_id: string }> }
) {
  const authErr = verifyBookingAuth(req);
  if (authErr) return authErr;

  const { property_id } = await context.params;
  if (!VALID_PROPERTY_IDS.has(property_id)) {
    return NextResponse.json(
      {
        errors: [{ code: 'NOT_FOUND', message: `Unknown property_id: ${property_id}` }],
        warnings: [],
        meta: { ruid: 'sandbox-ruid-404' },
      },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') || 50);
  const reviews = readBookingReviews()
    .filter((r) => r.property_id === property_id)
    .slice(0, limit);

  return NextResponse.json(
    {
      errors: [],
      warnings: [],
      meta: { ruid: `sandbox-ruid-${Date.now()}`, next_page: null },
      data: { reviews },
    },
    { headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } }
  );
}
