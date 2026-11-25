'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PROPERTIES } from '@revora/shared';
import { AlertTriangle, CheckCircle2, Clock, Plus, RefreshCw } from 'lucide-react';

interface BookingReviewItem {
  review_id: string;
  property_id: string;
  reservation_id: string;
  reviewer_name: string;
  created_timestamp: string;
  review_score: number;
  content: {
    headline: string;
    positive: string;
    negative: string;
  };
  traveler_type: string;
  reply?: {
    reply_id: string;
    text: string;
    created_timestamp: string;
    status?: 'PENDING_MODERATION' | 'PUBLISHED';
  } | null;
}

export default function MockBookingPage() {
  const [propertyId, setPropertyId] = useState('800101');
  const [reviews, setReviews] = useState<BookingReviewItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);

  const [reviewerName, setReviewerName] = useState('');
  const [score, setScore] = useState(9.5);
  const [headline, setHeadline] = useState('');
  const [positive, setPositive] = useState('');
  const [negative, setNegative] = useState('');
  const [travelerType, setTravelerType] = useState('Business');
  const [reservationId, setReservationId] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/review-api/properties/${propertyId}/reviews`, {
        headers: { Authorization: 'Bearer sandbox-booking-jwt' },
        cache: 'no-store',
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data?: { reviews?: BookingReviewItem[] } };
      setReviews(json.data?.reviews || []);
    } catch {
      // ignore poll error
    }
  }, [propertyId]);

  useEffect(() => {
    fetchReviews();
    const t = setInterval(fetchReviews, 3000);
    return () => clearInterval(t);
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/ui/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: propertyId,
        reviewer_name: reviewerName || 'Booking Guest',
        review_score: score,
        headline,
        positive,
        negative,
        traveler_type: travelerType,
        reservation_id: reservationId || undefined,
      }),
    });
    setModalOpen(false);
    setReviewerName('');
    setHeadline('');
    setPositive('');
    setNegative('');
    setReservationId('');
    await fetchReviews();
  }

  const activeProp =
    PROPERTIES.find((p) => p.bookingPropertyId === propertyId) || PROPERTIES[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950">
        <AlertTriangle className="h-3.5 w-3.5" />
        SANDBOX / SIMULATION — Mock Booking.com Guest Reviews (Local Demo Only — Not Live
        Booking.com)
      </div>

      <header className="bg-[#003580] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-lg font-bold tracking-tight">Booking.com</p>
            <p className="text-xs text-blue-100">
              {activeProp.name} • Property ID {propertyId}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
            >
              {PROPERTIES.map((p) => (
                <option key={p.bookingPropertyId} value={p.bookingPropertyId}>
                  {p.name} ({p.bookingPropertyId})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchReviews}
              className="inline-flex items-center gap-1 rounded-md border border-blue-400 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-[#006ce4] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Plus className="h-3.5 w-3.5" /> Submit Guest Review
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h1 className="text-base font-bold text-slate-900">
            Guest reviews for {activeProp.name} ({reviews.length})
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Teammate 2 starter shell — replace/enhance the hotel hero, photo collage, and
            sub-score bars in <code className="rounded bg-slate-100 px-1">src/app/page.tsx</code>{' '}
            using your Booking.com screenshots while keeping{' '}
            <code className="rounded bg-slate-100 px-1">src/app/api/**</code> intact.
          </p>
        </div>

        <div className="space-y-3">
          {reviews.map((rev) => {
            const isLong =
              (rev.content.positive + rev.content.negative).length > 180;
            const isExp = Boolean(expanded[rev.review_id]);
            return (
              <article
                key={rev.review_id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {rev.reviewer_name}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {rev.traveler_type}
                      </span>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
                        {rev.reservation_id}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Reviewed {rev.created_timestamp}
                    </p>
                  </div>

                  <span className="flex h-8 w-9 items-center justify-center rounded-md rounded-bl-none bg-[#003580] text-xs font-bold text-white">
                    {rev.review_score.toFixed(1)}
                  </span>
                </div>

                <h2 className="mt-2.5 text-sm font-bold text-slate-900">
                  {rev.content.headline}
                </h2>

                <div className="mt-2 space-y-1.5 text-xs text-slate-700">
                  {rev.content.positive && (
                    <p>
                      <span className="mr-1.5 font-bold text-emerald-700">+</span>
                      {!isExp && isLong
                        ? `${rev.content.positive.slice(0, 110)}...`
                        : rev.content.positive}
                    </p>
                  )}
                  {rev.content.negative && (
                    <p>
                      <span className="mr-1.5 font-bold text-slate-500">−</span>
                      {!isExp && isLong
                        ? `${rev.content.negative.slice(0, 110)}...`
                        : rev.content.negative}
                    </p>
                  )}
                </div>

                {isLong && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((p) => ({ ...p, [rev.review_id]: !isExp }))
                    }
                    className="mt-1.5 text-xs font-semibold text-[#006ce4] hover:underline"
                  >
                    {isExp ? 'Show less' : 'Read more'}
                  </button>
                )}

                {rev.reply && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">Property response</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          rev.reply.status === 'PENDING_MODERATION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rev.reply.status === 'PENDING_MODERATION' ? (
                          <>
                            <Clock className="h-3 w-3" /> PENDING_MODERATION
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> PUBLISHED
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-700">{rev.reply.text}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-900">
              Submit Mock Booking.com Guest Review
            </h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setReviewerName('Meera Krishnan');
                  setScore(9.5);
                  setTravelerType('Couple');
                  setHeadline('Memorable stay at THE LEELA PALACE BANGALORE');
                  setPositive('Warm welcome, quiet rooms, and extraordinary breakfast.');
                  setNegative('Nothing at all.');
                }}
                className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
              >
                Quick Fill: 9.5/10 Praise
              </button>
              <button
                type="button"
                onClick={() => {
                  setReviewerName('Arjun Deshmukh');
                  setScore(3.0);
                  setTravelerType('Business');
                  setReservationId('RES-994821');
                  setHeadline('Billed ₹6,200 instead of confirmed ₹5,000 rate');
                  setPositive('Room was clean and Wi-Fi worked well.');
                  setNegative(
                    'My confirmed booking was ₹5,000 total, yet ₹6,200 was charged at checkout. Please refund the ₹1,200 overcharge immediately.'
                  );
                }}
                className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800"
              >
                Quick Fill: ₹5,000 vs ₹6,200 Dispute
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-3 space-y-2.5 text-xs">
              <input
                required
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Reviewer Name"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="rounded border border-slate-300 px-3 py-2"
                />
                <input
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                  placeholder="Reservation ID (RES-...)"
                  className="rounded border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <input
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
              <textarea
                rows={2}
                value={positive}
                onChange={(e) => setPositive(e.target.value)}
                placeholder="Liked (Positive)"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
              <textarea
                rows={2}
                value={negative}
                onChange={(e) => setNegative(e.target.value)}
                placeholder="Disliked (Negative)"
                className="w-full rounded border border-slate-300 px-3 py-2"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-slate-300 px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#003580] px-4 py-1.5 font-semibold text-white"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
