'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PROPERTIES } from '@revora/shared';
import {
  AlertTriangle,
  MapPin,
  MessageSquarePlus,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react';

type StarRatingEnum = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';

const STAR_NUM: Record<StarRatingEnum, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

const NUM_STAR: Record<number, StarRatingEnum> = {
  1: 'ONE',
  2: 'TWO',
  3: 'THREE',
  4: 'FOUR',
  5: 'FIVE',
};

interface GbpReviewItem {
  reviewId: string;
  locationId: string;
  reviewer: {
    displayName: string;
    isAnonymous: boolean;
  };
  starRating: StarRatingEnum;
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply: {
    comment: string;
    updateTime: string;
  } | null;
}

export default function MockGooglePage() {
  const [locationId, setLocationId] = useState('loc-blr-001');
  const [reviews, setReviews] = useState<GbpReviewItem[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [orderBy, setOrderBy] = useState('updateTime desc');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v4/accounts/acc-aurum-01/locations/${locationId}/reviews?orderBy=${encodeURIComponent(
          orderBy
        )}`,
        {
          headers: { Authorization: 'Bearer sandbox-gbp-token' },
          cache: 'no-store',
        }
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        reviews: GbpReviewItem[];
        averageRating: number;
      };
      setReviews(data.reviews || []);
      setAvgRating(data.averageRating || 0);
    } catch {
      // ignore poll error
    }
  }, [locationId, orderBy]);

  useEffect(() => {
    fetchReviews();
    const t = setInterval(fetchReviews, 3000);
    return () => clearInterval(t);
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/ui/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId,
        displayName: displayName.trim() || 'Google Local Guide',
        starRating: NUM_STAR[stars] || 'FIVE',
        comment: comment.trim(),
      }),
    });
    const data = (await res.json()) as { webhookDelivered?: boolean };
    setModalOpen(false);
    setDisplayName('');
    setStars(5);
    setComment('');
    setToast(
      data.webhookDelivered
        ? 'Review posted • Cloud Pub/Sub NEW_REVIEW webhook delivered to Revora CRM!'
        : 'Review saved locally (Revora CRM :4000 offline — ready to sync).'
    );
    await fetchReviews();
  }

  const activeProp =
    PROPERTIES.find((p) => p.googleLocationId === locationId) || PROPERTIES[0];

  const visibleReviews = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter(
      (r) =>
        r.reviewer.displayName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
    );
  }, [reviews, query]);

  const histogram = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) counts[STAR_NUM[r.starRating]]++;
    return counts;
  }, [reviews]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950">
        <AlertTriangle className="h-3.5 w-3.5" />
        SANDBOX / SIMULATION — Mock Google Business Profile (Local Demo Only — Not Live
        Google)
      </div>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">{activeProp.name}</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                Google Maps Mock
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> {activeProp.address}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              {PROPERTIES.map((p) => (
                <option key={p.googleLocationId} value={p.googleLocationId}>
                  {p.name} ({p.googleLocationId})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchReviews}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" /> Write a review
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        {toast && (
          <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-900">
            <span>{toast}</span>
            <button type="button" onClick={() => setToast(null)} className="underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Rating Summary Card */}
        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-12">
          <div className="flex flex-col justify-center md:col-span-4">
            <p className="text-4xl font-bold text-slate-900">{avgRating.toFixed(1)}</p>
            <div className="mt-1 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">{reviews.length} reviews</p>
          </div>

          <div className="space-y-1.5 md:col-span-8">
            {[5, 4, 3, 2, 1].map((n) => {
              const pct = reviews.length
                ? Math.round((histogram[n] / reviews.length) * 100)
                : 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-3 font-medium text-slate-600">{n}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] text-slate-400">
                    {histogram[n]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sort & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'updateTime desc', label: 'Newest' },
              { id: 'rating desc', label: 'Highest' },
              { id: 'rating asc', label: 'Lowest' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setOrderBy(s.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
                  orderBy === s.id
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300'
                    : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Google reviews..."
              className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Review Cards */}
        <div className="space-y-3">
          {visibleReviews.map((rev) => {
            const numStars = STAR_NUM[rev.starRating];
            const isLong = rev.comment.length > 160;
            const isExp = Boolean(expanded[rev.reviewId]);

            return (
              <article
                key={rev.reviewId}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {rev.reviewer.displayName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= numStars
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
                  {isLong && !isExp ? `${rev.comment.slice(0, 160)}...` : rev.comment}
                </p>

                {isLong && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((p) => ({ ...p, [rev.reviewId]: !isExp }))
                    }
                    className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {isExp ? 'Show less' : 'Read more'}
                  </button>
                )}

                {rev.reviewReply && (
                  <div className="mt-3 rounded-xl border-l-4 border-blue-500 bg-slate-50 p-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        Response from the owner
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.reviewReply.updateTime).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-700">{rev.reviewReply.comment}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-900">
              {activeProp.name} — Write a Google Review
            </h2>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDisplayName('Ananya Kapoor');
                  setStars(5);
                  setComment(
                    `Wonderful stay at ${activeProp.name}! Quick check-in, spotless room, and super polite front desk staff.`
                  );
                }}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
              >
                Quick Fill: 5★ Praise
              </button>
              <button
                type="button"
                onClick={() => {
                  setDisplayName('Vikram Malhotra');
                  setStars(1);
                  setComment(
                    'Booked my room for ₹5,000 inclusive of taxes, but at checkout I was billed ₹6,200 with unexplained extra charges. Requesting an immediate refund.'
                  );
                }}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800"
              >
                Quick Fill: ₹5,000 vs ₹6,200 Dispute
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        s <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details of your own experience at this place..."
                className="w-full rounded-lg border border-slate-300 p-3"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
