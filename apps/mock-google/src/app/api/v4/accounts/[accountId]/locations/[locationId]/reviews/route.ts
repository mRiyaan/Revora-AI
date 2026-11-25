import { NextRequest, NextResponse } from 'next/server';
import {
  CORS_HEADERS,
  STAR_ENUM_TO_NUM,
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
  context: { params: Promise<{ accountId: string; locationId: string }> }
) {
  const authErr = verifyGbpAuth(req);
  if (authErr) return authErr;

  const { accountId, locationId } = await context.params;
  const locErr = validateLocation(accountId, locationId);
  if (locErr) return locErr;

  const pageSize = Math.min(
    50,
    Math.max(1, Number(req.nextUrl.searchParams.get('pageSize') || 20))
  );
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get('pageToken') || 0));
  const orderBy = req.nextUrl.searchParams.get('orderBy') || 'updateTime desc';

  const allForLocation = readGbpReviews().filter((r) => r.locationId === locationId);

  allForLocation.sort((a, b) => {
    if (orderBy === 'rating desc') {
      return STAR_ENUM_TO_NUM[b.starRating] - STAR_ENUM_TO_NUM[a.starRating];
    }
    if (orderBy === 'rating asc') {
      return STAR_ENUM_TO_NUM[a.starRating] - STAR_ENUM_TO_NUM[b.starRating];
    }
    return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime();
  });

  const totalReviewCount = allForLocation.length;
  const averageRating =
    totalReviewCount > 0
      ? Number(
          (
            allForLocation.reduce(
              (sum, r) => sum + STAR_ENUM_TO_NUM[r.starRating],
              0
            ) / totalReviewCount
          ).toFixed(1)
        )
      : 0;

  const page = allForLocation.slice(offset, offset + pageSize);
  const nextPageToken =
    offset + pageSize < totalReviewCount ? String(offset + pageSize) : null;

  return NextResponse.json(
    {
      reviews: page,
      averageRating,
      totalReviewCount,
      nextPageToken,
    },
    { headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' } }
  );
}
