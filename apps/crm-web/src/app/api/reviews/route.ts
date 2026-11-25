import { NextRequest, NextResponse } from 'next/server';
import { CanonicalReview, PlatformId, PropertyId } from '@revora/shared';
import { analyzeWithGemini, resolveGeminiConfig, routeAndBuildEscalation } from '@/lib/geminiEngine';
import { readLiveStore, writeLiveStore } from '@/lib/liveStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const overrideKey = req.headers.get('x-gemini-api-key') || undefined;
  const { apiKey, model } = resolveGeminiConfig(overrideKey);
  const state = readLiveStore();

  return NextResponse.json(
    {
      state,
      geminiConfigured: Boolean(apiKey),
      model,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      platform?: PlatformId;
      propertyId?: PropertyId;
      reviewerName?: string;
      rating?: number;
      reviewTitle?: string;
      reviewText?: string;
      reservationId?: string;
    };

    const platform: PlatformId =
      body.platform && ['google', 'booking', 'tripadvisor'].includes(body.platform)
        ? body.platform
        : 'google';
    const propertyId: PropertyId =
      body.propertyId && ['HOTEL001', 'HOTEL002', 'HOTEL003'].includes(body.propertyId)
        ? body.propertyId
        : 'HOTEL001';
    const reviewerName = (body.reviewerName || '').trim() || 'Guest Reviewer';
    const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating || 5))));
    const reviewText = (body.reviewText || '').trim();

    if (!reviewText) {
      return NextResponse.json({ error: 'Review text is required.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const suffix = String(Date.now()).slice(-6);
    const reviewId = `rev_live_${suffix}`;

    const canonical: CanonicalReview = {
      id: reviewId,
      platform,
      externalReviewId: `${platform}_live_${suffix}`,
      propertyId,
      reviewerName,
      rating,
      originalRatingText:
        platform === 'booking'
          ? `${(rating * 2).toFixed(1)}/10`
          : platform === 'tripadvisor'
            ? `${rating}/5 bubbles`
            : ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][rating - 1],
      reviewTitle: body.reviewTitle?.trim() || undefined,
      reviewText,
      reservationId: body.reservationId?.trim() || undefined,
      createdAt: now,
      responseStatus: 'queued',
    };

    const overrideKey = req.headers.get('x-gemini-api-key') || undefined;
    const state = readLiveStore();
    const { analysis, aiMode, modelUsed, errorNote } = await analyzeWithGemini(
      canonical,
      overrideKey
    );
    const decision = routeAndBuildEscalation(
      canonical,
      analysis,
      state.autoPublishRoutine
    );

    if (decision.route === 'ROUTINE_AUTO_PUBLISH') {
      canonical.responseStatus = 'auto_published';
    } else if (decision.route === 'ROUTINE_HOLD_FOR_REVIEW') {
      canonical.responseStatus = 'held_for_review';
    } else {
      canonical.responseStatus = 'escalated';
    }

    const newItem = {
      review: canonical,
      analysis,
      replyText: analysis.draftReply,
      publicationState:
        decision.route === 'ROUTINE_AUTO_PUBLISH'
          ? 'PUBLISHED'
          : decision.route === 'ROUTINE_HOLD_FOR_REVIEW'
            ? 'held_for_review'
            : 'pending_approval',
      escalationTicketId: decision.escalation?.ticketId,
    };

    state.reviews = [newItem, ...state.reviews];
    if (decision.escalation) {
      state.escalations = [decision.escalation, ...state.escalations];
    }

    state.jobs = [
      {
        id: `job_${suffix}`,
        reviewId,
        jobType: 'process_review',
        idempotencyKey: `process:${platform}:${canonical.externalReviewId}`,
        status: 'completed',
        attempts: 1,
        maxAttempts: 3,
        nextRunAt: now,
        createdAt: now,
        updatedAt: now,
      },
      ...state.jobs,
    ];

    state.auditLogs = [
      {
        id: `aud_${suffix}`,
        actorRole: 'System',
        actorName: aiMode === 'gemini_live' ? `Revora (${modelUsed})` : 'Revora Fallback Engine',
        action:
          decision.route === 'ROUTINE_AUTO_PUBLISH'
            ? 'ROUTINE_AUTO_PUBLISHED_LOCAL'
            : decision.route === 'ROUTINE_HOLD_FOR_REVIEW'
              ? 'ROUTINE_HELD_FOR_HUMAN_REVIEW'
              : 'ESCALATION_CASE_CREATED',
        entityType: decision.escalation ? 'escalation' : 'review',
        entityId: decision.escalation ? decision.escalation.ticketId : reviewId,
        previousState: 'queued',
        newState: canonical.responseStatus,
        outcome: 'success',
        metadata: { platform, propertyId, aiMode },
        createdAt: now,
      },
      ...state.auditLogs,
    ];

    writeLiveStore(state);

    return NextResponse.json(
      {
        review: newItem,
        escalation: decision.escalation || null,
        route: decision.route,
        aiMode,
        modelUsed,
        errorNote,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to process review' },
      { status: 500 }
    );
  }
}
