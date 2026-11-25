"use client";

import React, { useState } from "react";
import {
  Award,
  BedDouble,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Frown,
  Hotel,
  Leaf,
  MessageSquarePlus,
  RefreshCw,
  ShieldCheck,
  Smile,
  Users,
} from "lucide-react";
import {
  BookingReview,
  PropertyInfo,
  ReviewScores,
  TravelerType,
} from "@/lib/types";
import { getCountryFlag, getScoreLabel } from "@/lib/score-utils";

interface ReviewsSectionProps {
  property: PropertyInfo;
  reviews: BookingReview[];
  overallScore: number;
  totalReviewCount: number;
  categories: { key: keyof ReviewScores; label: string; score: number }[];
  lastSyncedAt: string;
  isPolling: boolean;
  onManualRefresh: () => void;
  onOpenDrawer: (topic?: string | null) => void;
  onOpenSubmitModal: () => void;
}

const TRAVELER_FILTERS: ("All" | TravelerType)[] = [
  "All",
  "Business",
  "Couple",
  "Family",
  "Solo",
];

const TOPIC_CHIPS = [
  "Breakfast",
  "Room",
  "Dinner",
  "Location",
  "Restaurant",
  "Noise",
];

export default function ReviewsSection({
  property,
  reviews,
  overallScore,
  totalReviewCount,
  categories,
  lastSyncedAt,
  isPolling,
  onManualRefresh,
  onOpenDrawer,
  onOpenSubmitModal,
}: ReviewsSectionProps) {
  const [travelerFilter, setTravelerFilter] = useState<"All" | TravelerType>(
    "All"
  );
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedLoved, setExpandedLoved] = useState<Record<string, boolean>>(
    {}
  );

  const lovedCards = reviews
    .filter((r) => r.review_score >= 8.5 && r.content.positive.length > 0)
    .slice(0, 3);

  const filteredReviews = reviews.filter((r) => {
    if (travelerFilter !== "All" && r.traveler_type !== travelerFilter) {
      return false;
    }
    if (selectedTopic) {
      const hay =
        `${r.content.headline} ${r.content.positive} ${r.content.negative} ${(
          r.topics || []
        ).join(" ")}`.toLowerCase();
      if (!hay.includes(selectedTopic.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-[1140px] px-4 pt-8 pb-12">
      {/* Sustainability Section */}
      <section className="border-t border-[#e7e7e7] pt-6">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Sustainability</h2>
        <p className="mt-1 text-xs text-[#595959]">
          This property has 3 third-party sustainability certifications.{" "}
          <span className="text-[#006ce4] hover:underline cursor-pointer">
            Learn more about certifications
          </span>
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-[#e7e7e7] bg-white px-4 py-3">
            <Award className="h-7 w-7 shrink-0 text-[#595959]" />
            <span className="text-xs font-bold text-[#1a1a1a]">
              Beyond Green
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[#e7e7e7] bg-white px-4 py-3">
            <ShieldCheck className="h-7 w-7 shrink-0 text-[#008234]" />
            <span className="text-xs font-bold text-[#1a1a1a]">
              EDGE Green Building Certification
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[#e7e7e7] bg-white px-4 py-3">
            <Leaf className="h-7 w-7 shrink-0 text-[#008234]" />
            <span className="text-xs font-bold text-[#1a1a1a]">
              IGBC Net Zero
            </span>
          </div>
        </div>
      </section>

      {/* Guest Reviews Section */}
      <section id="guest-reviews" className="mt-8 border-t border-[#e7e7e7] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Guest reviews</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-t-md rounded-br-md bg-[#003580] text-sm font-bold text-white">
                {overallScore.toFixed(1)}
              </div>
              <span className="text-sm font-bold text-[#1a1a1a]">
                {getScoreLabel(overallScore)}
              </span>
              <span className="text-sm text-[#595959]">
                · {totalReviewCount} reviews
              </span>
              <button
                type="button"
                onClick={() => onOpenDrawer(null)}
                className="text-sm font-medium text-[#006ce4] hover:underline"
              >
                Read all reviews
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Sync 3s Polling Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-[#008234]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#008234] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#008234]" />
              </span>
              <span>Live Sync (3s polling)</span>
              {lastSyncedAt && (
                <span className="text-[11px] text-green-700/80">
                  · {lastSyncedAt}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onManualRefresh}
              className="inline-flex items-center gap-1.5 rounded border border-[#e7e7e7] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1a1a] hover:bg-gray-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isPolling ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={onOpenSubmitModal}
              className="inline-flex items-center gap-1.5 rounded bg-[#006ce4] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0057b8]"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Submit guest review
            </button>

            <a
              href="#info-prices"
              className="rounded bg-[#006ce4] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0057b8]"
            >
              See availability
            </a>
          </div>
        </div>

        {/* Categories Progress Bars */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-[#1a1a1a]">Categories:</h3>
          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.key}>
                <div className="flex justify-between text-xs font-medium text-[#1a1a1a]">
                  <span>{cat.label}</span>
                  <span className="font-bold">{cat.score.toFixed(1)}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#e7e7e7]">
                  <div
                    className="h-full rounded-full bg-[#003580] transition-all duration-500"
                    style={{ width: `${(cat.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Pills */}
        <div className="mt-6">
          <div className="text-sm font-bold text-[#1a1a1a]">
            Select topics to read reviews:
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {TOPIC_CHIPS.map((topic) => {
              const active = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(active ? null : topic)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-[#006ce4] bg-[#f0f6ff] text-[#006ce4]"
                      : "border-[#868686] bg-white text-[#1a1a1a] hover:bg-gray-50"
                  }`}
                >
                  + {topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* See what guests loved the most (3-Column Highlight Cards) */}
        {lovedCards.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[#1a1a1a]">
              See what guests loved the most:
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              {lovedCards.map((card) => {
                const isExp = !!expandedLoved[card.review_id];
                return (
                  <div
                    key={card.review_id}
                    className="flex flex-col justify-between rounded-lg border border-[#e7e7e7] bg-white p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#008234] text-sm font-bold text-white">
                          {card.reviewer_name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#1a1a1a]">
                            {card.reviewer_name}
                          </div>
                          <div className="text-[11px] text-[#595959]">
                            {getCountryFlag(card.country_code)}{" "}
                            {card.country || "India"}
                          </div>
                        </div>
                      </div>
                      <p
                        className={`mt-3 text-xs leading-relaxed text-[#1a1a1a] ${
                          !isExp ? "line-clamp-4" : ""
                        }`}
                      >
                        “{card.content.positive}”
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLoved((prev) => ({
                          ...prev,
                          [card.review_id]: !isExp,
                        }))
                      }
                      className="mt-3 w-fit text-xs font-semibold text-[#006ce4] hover:underline"
                    >
                      {isExp ? "Show less" : "Read more"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onOpenDrawer(selectedTopic)}
                className="rounded border border-[#006ce4] px-4 py-2 text-xs font-semibold text-[#006ce4] hover:bg-blue-50"
              >
                Read all reviews
              </button>
              <button
                type="button"
                onClick={() => onOpenDrawer(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#006ce4] hover:underline"
              >
                Open full review drawer
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Traveler-Type Filter Pills + Live Review Feed */}
        <div className="mt-8 border-t border-[#e7e7e7] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[#1a1a1a]">
              Recent Verified Guest Reviews ({filteredReviews.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {TRAVELER_FILTERS.map((t) => {
                const active = travelerFilter === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTravelerFilter(t)}
                    className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "border-[#003580] bg-[#003580] text-white"
                        : "border-[#d9d9d9] bg-white text-[#1a1a1a] hover:bg-gray-50"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Review Cards */}
          <div className="mt-4 space-y-4">
            {filteredReviews.map((rev) => {
              const isExp = !!expandedCards[rev.review_id];
              const isLong =
                rev.content.positive.length > 140 ||
                rev.content.negative.length > 140;

              return (
                <article
                  key={rev.review_id}
                  className="rounded-lg border border-[#e7e7e7] bg-white p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[210px_1fr]">
                    {/* Left Reviewer Metadata */}
                    <div className="space-y-2 text-xs text-[#595959]">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#008234] text-sm font-bold text-white">
                          {rev.reviewer_name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-[#1a1a1a]">
                            {rev.reviewer_name}
                          </div>
                          <div>
                            {getCountryFlag(rev.country_code)}{" "}
                            {rev.country || "India"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span className="rounded bg-[#f5f5f5] px-2 py-0.5 font-semibold text-[#1a1a1a]">
                          {rev.traveler_type}
                        </span>
                      </div>

                      {rev.room_name && (
                        <div className="flex items-start gap-1.5">
                          <BedDouble className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{rev.room_name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {rev.stay_nights || 1} night
                          {(rev.stay_nights || 1) > 1 ? "s" : ""} ·{" "}
                          {rev.stay_date || rev.created_timestamp.slice(0, 10)}
                        </span>
                      </div>

                      <div className="pt-1">
                        <span className="inline-block rounded border border-[#dce8fa] bg-[#f0f6ff] px-2 py-0.5 font-mono text-[11px] font-bold text-[#003580]">
                          {rev.reservation_id}
                        </span>
                      </div>
                    </div>

                    {/* Right Review Content */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] text-[#595959]">
                            Reviewed: {rev.created_timestamp}
                          </div>
                          <h4 className="mt-0.5 text-base font-bold text-[#1a1a1a]">
                            {rev.content.headline}
                          </h4>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-t-md rounded-br-md bg-[#003580] text-sm font-bold text-white">
                          {rev.review_score.toFixed(1)}
                        </div>
                      </div>

                      {rev.content.positive && (
                        <div className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-[#1a1a1a]">
                          <Smile className="mt-0.5 h-4 w-4 shrink-0 text-[#008234]" />
                          <p
                            className={
                              !isExp && isLong ? "line-clamp-2" : ""
                            }
                          >
                            {rev.content.positive}
                          </p>
                        </div>
                      )}

                      {rev.content.negative && (
                        <div className="mt-2.5 flex items-start gap-2.5 text-sm leading-relaxed text-[#1a1a1a]">
                          <Frown className="mt-0.5 h-4 w-4 shrink-0 text-[#595959]" />
                          <p
                            className={
                              !isExp && isLong ? "line-clamp-2" : ""
                            }
                          >
                            {rev.content.negative}
                          </p>
                        </div>
                      )}

                      {isLong && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              [rev.review_id]: !isExp,
                            }))
                          }
                          className="mt-2 text-xs font-semibold text-[#006ce4] hover:underline"
                        >
                          {isExp ? "Show less" : "Read more"}
                        </button>
                      )}

                      {/* Indented Property Response Box */}
                      {rev.reply && (
                        <div className="mt-4 ml-2 rounded-md border border-[#e7e7e7] bg-[#f5f5f5] p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a]">
                              <Hotel className="h-3.5 w-3.5 text-[#003580]" />
                              Property response
                            </span>
                            {rev.reply.status === "PENDING_MODERATION" ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                <Clock className="h-3 w-3" />
                                PENDING_MODERATION
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-[#008234]">
                                <CheckCircle2 className="h-3 w-3" />
                                PUBLISHED
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-[#333333]">
                            {rev.reply.text}
                          </p>
                          <div className="mt-1.5 text-[10px] text-[#595959]">
                            Replied: {rev.reply.created_timestamp} ·{" "}
                            {property.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

