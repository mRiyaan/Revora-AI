'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PROPERTIES, PROPERTY_BY_ID, PlatformId, PropertyId } from '@revora/shared';
import { CheckCircle2, ExternalLink, MapPin, Send, Sparkles, Star } from 'lucide-react';
import { BackendReviewItem, apiRequest } from '@/lib/backendApi';

const PLATFORM_LABELS: Record<PlatformId, string> = {
  google: 'Google Reviews',
  booking: 'Booking.com',
  tripadvisor: 'Tripadvisor',
};

export default function GuestReviewPortalPage() {
  const [platform, setPlatform] = useState<PlatformId>('google');
  const [propertyId, setPropertyId] = useState<PropertyId>('HOTEL001');
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reservationId, setReservationId] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [feed, setFeed] = useState<BackendReviewItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [showAllChannels, setShowAllChannels] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await apiRequest<{ reviews: BackendReviewItem[] }>(
        `/api/reviews?propertyId=${propertyId}`
      );
      setFeed(res.reviews);
    } catch {
      // ignore transient poll error
    }
  }, [propertyId]);

  useEffect(() => {
    fetchFeed();
    const timer = setInterval(fetchFeed, 1500);
    return () => clearInterval(timer);
  }, [fetchFeed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await apiRequest<{
        reviewId: string;
        jobId: string;
        deduplicated: boolean;
      }>('/api/sandbox/inject', {
        method: 'POST',
        body: {
          platform,
          propertyId,
          reviewerName: reviewerName.trim() || 'Guest Traveler',
          rating,
          reservationId: reservationId.trim() || undefined,
          reviewText: reviewText.trim(),
        },
      });
      setSubmitStatus(
        `Queued in SQLite (${res.jobId}). Worker + Gemini processing live — watch status update below!`
      );
      setReviewerName('');
      setReservationId('');
      setReviewText('');
      await fetchFeed();
    } catch (err) {
      setSubmitStatus(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const visibleFeed = useMemo(() => {
    return feed.filter((item) => {
      if (!showAllChannels && item.review.platform !== platform) return false;
      return true;
    });
  }, [feed, platform, showAllChannels]);

  const activeProp = PROPERTY_BY_ID[propertyId];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold tracking-wide text-amber-400">
                {activeProp.name}
              </span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-500/30">
                MOCK GUEST PORTAL
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {activeProp.address}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live Backend Sync (:4000)
            </span>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value as PropertyId)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white outline-none"
            >
              {PROPERTIES.map((p) => (
                <option key={p.propertyId} value={p.propertyId}>
                  {p.name}
                </option>
              ))}
            </select>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
            >
              Open Revora CRM <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h1 className="text-base font-semibold text-slate-900">Write a Guest Review</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Submits directly to SQLite Job Queue (:4000), runs the Worker + Gemini, and
              receives published replies live below.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlatform('google');
                  setReviewerName('Ananya Kapoor');
                  setRating(5);
                  setReservationId('');
                  setReviewText(
                    `Extraordinary stay at ${activeProp.name}! Warm palace welcome, spotless suite, and unforgettable breakfast service.`
                  );
                }}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Fill 5★ Praise
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlatform('booking');
                  setReviewerName('Arjun Deshmukh');
                  setRating(2);
                  setReservationId('RES-995201');
                  setReviewText(
                    'Booked my room for ₹5,000 inclusive of taxes, but at checkout I was billed ₹6,200 with unexplained extra charges. Please refund the ₹1,200 overcharge.'
                  );
                }}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 hover:bg-rose-100"
              >
                Fill ₹5,000 vs ₹6,200 Dispute
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as PlatformId)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    <option value="google">Google Reviews</option>
                    <option value="booking">Booking.com</option>
                    <option value="tripadvisor">Tripadvisor</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Rating
                  </label>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-0.5"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Your Name
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Riyaan Sharma"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400"
                />
              </div>

              {platform === 'booking' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Reservation ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={reservationId}
                    onChange={(e) => setReservationId(e.target.value)}
                    placeholder="RES-995201"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:border-slate-400"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your stay experience..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? 'Enqueueing in SQLite...' : 'Post Review Live'}
              </button>

              {submitStatus && (
                <div className="flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-xs font-medium text-indigo-900">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                  <span>{submitStatus}</span>
                </div>
              )}
            </form>
          </div>
        </section>

        <section className="space-y-3 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Guest Reviews — {activeProp.name} ({visibleFeed.length})
            </h2>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showAllChannels}
                onChange={(e) => setShowAllChannels(e.target.checked)}
              />
              Show all 3 channels
            </label>
          </div>

          {visibleFeed.map((item) => {
            const r = item.review;
            const isPublished =
              r.responseStatus === 'auto_published' ||
              r.responseStatus === 'approved_published';
            const isLong = r.reviewText.length > 150;
            const expanded = Boolean(expandedIds[r.id || '']);

            return (
              <article
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {r.reviewerName}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {PLATFORM_LABELS[r.platform]}
                    </span>
                    {r.reservationId && (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-700">
                        {r.reservationId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {r.rating}/5
                  </div>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                  {isLong && !expanded
                    ? `${r.reviewText.slice(0, 150)}...`
                    : r.reviewText}
                </p>

                {isLong && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedIds((prev) => ({ ...prev, [r.id!]: !expanded }))
                    }
                    className="mt-1 text-xs font-medium text-indigo-600 hover:underline"
                  >
                    {expanded ? 'Show less' : 'Read more'}
                  </button>
                )}

                {isPublished && item.replyText ? (
                  <div className="mt-3 rounded-xl border-l-2 border-emerald-500 bg-emerald-50/50 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Response from {activeProp.name}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">
                      {item.replyText}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2.5 text-[11px] text-slate-400">
                    Status:{' '}
                    {r.responseStatus === 'queued'
                      ? 'Queued — Worker processing...'
                      : r.responseStatus === 'escalated'
                        ? 'Under executive review in Revora CRM'
                        : r.responseStatus === 'held_for_review'
                          ? 'Pending support review in Revora CRM'
                          : 'Awaiting reply'}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
