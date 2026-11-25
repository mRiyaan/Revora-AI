'use client';

import React, { useMemo, useState } from 'react';
import { PROPERTY_BY_ID, PlatformId } from '@revora/shared';
import {
  CheckCircle2,
  ExternalLink,
  Search,
  Star,
} from 'lucide-react';
import { CrmReviewItem } from '@/lib/mockDemoStore';

interface ReviewInboxViewProps {
  items: CrmReviewItem[];
  onApproveHeld: (reviewId: string) => void;
  onOpenEscalation: (ticketId: string) => void;
}

const PLATFORM_BADGE: Record<PlatformId, { label: string; cls: string }> = {
  google: { label: 'Google GBP', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  booking: { label: 'Booking.com', cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  tripadvisor: { label: 'Tripadvisor Terra', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  auto_published: {
    label: 'Auto-Published (Local)',
    cls: 'bg-emerald-100 text-emerald-800',
  },
  approved_published: {
    label: 'Approved & Published',
    cls: 'bg-emerald-100 text-emerald-800',
  },
  held_for_review: {
    label: 'Held for Review',
    cls: 'bg-amber-100 text-amber-800',
  },
  escalated: {
    label: 'Escalated Case',
    cls: 'bg-rose-100 text-rose-800',
  },
  rejected: {
    label: 'Draft Rejected',
    cls: 'bg-slate-200 text-slate-700',
  },
  unanswered: {
    label: 'Unanswered',
    cls: 'bg-slate-100 text-slate-700',
  },
  queued: {
    label: 'Queued',
    cls: 'bg-sky-100 text-sky-800',
  },
};

export function ReviewInboxView({
  items,
  onApproveHeld,
  onOpenEscalation,
}: ReviewInboxViewProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | PlatformId>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(({ review }) => {
      if (platformFilter !== 'ALL' && review.platform !== platformFilter) return false;
      if (statusFilter !== 'ALL' && review.responseStatus !== statusFilter) return false;
      if (q) {
        const hay = `${review.reviewerName} ${review.reviewTitle || ''} ${review.reviewText} ${review.reservationId || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, platformFilter, statusFilter, search]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest name, reservation ID (RES-994821), or keywords..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as 'ALL' | PlatformId)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Platforms</option>
            <option value="google">Google Business Profile</option>
            <option value="booking">Booking.com</option>
            <option value="tripadvisor">Tripadvisor Terra</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="escalated">Escalated</option>
            <option value="held_for_review">Held for Review</option>
            <option value="auto_published">Auto-Published</option>
            <option value="approved_published">Approved & Published</option>
            <option value="unanswered">Unanswered</option>
          </select>

          <span className="rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-600">
            {filtered.length} reviews
          </span>
        </div>
      </div>

      {/* Review Cards List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const { review, analysis, replyText, escalationTicketId } = item;
          const plat = PLATFORM_BADGE[review.platform];
          const stat = STATUS_BADGE[review.responseStatus] || STATUS_BADGE.unanswered;
          const propName = PROPERTY_BY_ID[review.propertyId]?.name || review.propertyId;

          return (
            <div
              key={review.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ${plat.cls}`}
                  >
                    {plat.label}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {propName}
                  </span>
                  {review.reservationId && (
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">
                      {review.reservationId}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {review.rating}/5
                    {review.originalRatingText ? ` (${review.originalRatingText})` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stat.cls}`}>
                    {stat.label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-2.5">
                <p className="text-sm font-semibold text-slate-900">
                  {review.reviewerName}
                  {review.reviewTitle ? ` — "${review.reviewTitle}"` : ''}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  {review.reviewText}
                </p>
              </div>

              {analysis && (
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200/80">
                  <span className="font-semibold text-slate-800">AI Context: </span>
                  {analysis.summary}
                </div>
              )}

              {replyText && (
                <div className="mt-2.5 border-l-2 border-indigo-400 pl-3 text-xs text-slate-600">
                  <span className="font-semibold text-indigo-700">
                    {review.responseStatus === 'auto_published' ||
                    review.responseStatus === 'approved_published'
                      ? 'Published Local Reply: '
                      : 'Drafted Reply: '}
                  </span>
                  {replyText}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                {review.responseStatus === 'held_for_review' && review.id && (
                  <button
                    type="button"
                    onClick={() => onApproveHeld(review.id!)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Publish Locally
                  </button>
                )}

                {escalationTicketId && (
                  <button
                    type="button"
                    onClick={() => onOpenEscalation(escalationTicketId)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Open Executive Briefing <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
