"use client";

import React, { useState } from "react";
import {
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  Frown,
  Hotel,
  Search,
  Smile,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { BookingReview, PropertyInfo, ReviewScores } from "@/lib/types";
import { getCountryFlag, getScoreLabel } from "@/lib/score-utils";

interface ReviewsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyInfo;
  reviews: BookingReview[];
  overallScore: number;
  totalReviewCount: number;
  categories: { key: keyof ReviewScores; label: string; score: number }[];
  initialTopic?: string | null;
}

const ALL_TOPICS = [
  "Noise",
  "Room",
  "Breakfast",
  "Airport",
  "Swimming pool",
  "Location",
  "Bed",
  "Dinner",
  "Restaurant",
  "Check-in",
];

export default function ReviewsDrawer({
  isOpen,
  onClose,
  property,
  reviews,
  overallScore,
  totalReviewCount,
  categories,
  initialTopic = null,
}: ReviewsDrawerProps) {
  const [reviewerFilter, setReviewerFilter] = useState("All");
  const [scoreFilter, setScoreFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [seasonFilter, setSeasonFilter] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    initialTopic
  );
  const [showMoreTopics, setShowMoreTopics] = useState(false);
  const [sortBy, setSortBy] = useState("relevant");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, "up" | "down">>({});

  React.useEffect(() => {
    setSelectedTopic(initialTopic);
  }, [initialTopic]);

  if (!isOpen) return null;

  const filtered = reviews
    .filter((r) => {
      if (reviewerFilter !== "All" && r.traveler_type !== reviewerFilter) {
        return false;
      }
      if (scoreFilter === "9+" && r.review_score < 9) return false;
      if (scoreFilter === "7-9" && (r.review_score < 7 || r.review_score >= 9))
        return false;
      if (scoreFilter === "5-7" && (r.review_score < 5 || r.review_score >= 7))
        return false;
      if (scoreFilter === "3-5" && (r.review_score < 3 || r.review_score >= 5))
        return false;
      if (scoreFilter === "1-3" && r.review_score >= 3) return false;
      if (selectedTopic) {
        const hay =
          `${r.content.headline} ${r.content.positive} ${r.content.negative} ${(
            r.topics || []
          ).join(" ")}`.toLowerCase();
        if (!hay.includes(selectedTopic.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return b.created_timestamp.localeCompare(a.created_timestamp);
      if (sortBy === "oldest")
        return a.created_timestamp.localeCompare(b.created_timestamp);
      if (sortBy === "highest") return b.review_score - a.review_score;
      if (sortBy === "lowest") return a.review_score - b.review_score;
      return 0;
    });

  const visibleTopics = showMoreTopics ? ALL_TOPICS : ALL_TOPICS.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-[680px] flex-col bg-white shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#e7e7e7] px-6 py-4">
          <h2 className="text-lg font-bold text-[#1a1a1a]">
            Guest reviews for {property.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reviews drawer"
            className="rounded p-1.5 text-[#595959] hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Score Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-t-md rounded-br-md bg-[#003580] text-sm font-bold text-white">
                {overallScore.toFixed(1)}
              </div>
              <div>
                <div className="text-sm font-bold text-[#1a1a1a]">
                  {getScoreLabel(overallScore)}
                </div>
                <div className="text-xs text-[#595959]">
                  {totalReviewCount} reviews
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-[#008234]">
              We aim for 100% real reviews
            </span>
          </div>

          {/* Categories */}
          <div className="mt-5">
            <div className="text-sm font-bold text-[#1a1a1a]">Categories:</div>
            <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
              {categories.map((cat) => (
                <div key={cat.key}>
                  <div className="flex justify-between text-xs font-medium text-[#1a1a1a]">
                    <span>{cat.label}</span>
                    <span>{cat.score.toFixed(1)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#e7e7e7]">
                    <div
                      className="h-full rounded-full bg-[#003580]"
                      style={{ width: `${(cat.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="my-5 border-t border-[#e7e7e7]" />

          {/* Filters */}
          <div className="text-sm font-bold text-[#1a1a1a]">Filters</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-[11px] font-medium text-[#595959]">
                Reviewers
              </label>
              <select
                value={reviewerFilter}
                onChange={(e) => setReviewerFilter(e.target.value)}
                className="mt-1 w-full rounded border border-[#868686] bg-white px-2 py-1.5 text-xs outline-none"
              >
                <option value="All">All ({reviews.length})</option>
                <option value="Family">Families</option>
                <option value="Couple">Couples</option>
                <option value="Solo">Solo travelers</option>
                <option value="Business">Business travelers</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#595959]">
                Review scores
              </label>
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="mt-1 w-full rounded border border-[#868686] bg-white px-2 py-1.5 text-xs outline-none"
              >
                <option value="All">All ({reviews.length})</option>
                <option value="9+">Wonderful: 9+</option>
                <option value="7-9">Good: 7–9</option>
                <option value="5-7">Decent: 5–7</option>
                <option value="3-5">Poor: 3–5</option>
                <option value="1-3">Very poor: 1–3</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#595959]">
                Languages
              </label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="mt-1 w-full rounded border border-[#868686] bg-white px-2 py-1.5 text-xs outline-none"
              >
                <option value="All">All ({reviews.length})</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#595959]">
                Time of year
              </label>
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="mt-1 w-full rounded border border-[#868686] bg-white px-2 py-1.5 text-xs outline-none"
              >
                <option value="All">All ({reviews.length})</option>
                <option value="Mar-May">Mar–May</option>
                <option value="Jun-Aug">Jun–Aug</option>
                <option value="Sep-Nov">Sep–Nov</option>
                <option value="Dec-Feb">Dec–Feb</option>
              </select>
            </div>
          </div>

          {/* Topic Chips */}
          <div className="mt-4">
            <div className="text-xs font-medium text-[#595959]">
              Select topics to read reviews:
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {visibleTopics.map((topic) => {
                const active = selectedTopic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSelectedTopic(active ? null : topic)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-[#006ce4] bg-[#f0f6ff] text-[#006ce4]"
                        : "border-[#868686] bg-white text-[#1a1a1a] hover:bg-gray-50"
                    }`}
                  >
                    + {topic}
                  </button>
                );
              })}
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#868686] text-[#595959]">
                <Search className="h-3.5 w-3.5" />
              </span>
              <button
                type="button"
                onClick={() => setShowMoreTopics((s) => !s)}
                className="text-xs font-semibold text-[#006ce4] hover:underline"
              >
                {showMoreTopics ? "Show less" : "Show more"}
              </button>
            </div>
          </div>

          {/* Sort Row */}
          <div className="mt-5 flex items-center justify-between border-b border-[#e7e7e7] pb-3">
            <div className="text-sm font-bold text-[#1a1a1a]">
              Guest reviews ({filtered.length})
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#595959]">Sort reviews by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded border border-[#868686] bg-white px-2.5 py-1 text-xs font-medium outline-none"
              >
                <option value="relevant">Most relevant</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest scores</option>
                <option value="lowest">Lowest scores</option>
              </select>
            </div>
          </div>

          {/* Review Cards inside Drawer */}
          <div className="divide-y divide-[#e7e7e7]">
            {filtered.map((rev) => {
              const isExpanded = !!expandedIds[rev.review_id];
              const negLong = rev.content.negative.length > 160;
              return (
                <div key={rev.review_id} className="py-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[175px_1fr]">
                    {/* Left Reviewer Meta */}
                    <div className="space-y-2 text-xs text-[#595959]">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#008234] text-sm font-bold text-white">
                          {rev.reviewer_name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="font-bold text-[#1a1a1a]">
                            {rev.reviewer_name}
                          </div>
                          <div>
                            {getCountryFlag(rev.country_code)}{" "}
                            {rev.country || "India"}
                          </div>
                        </div>
                      </div>
                      {rev.room_name && (
                        <div className="flex items-start gap-1.5">
                          <BedDouble className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="underline">{rev.room_name}</span>
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
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span>{rev.traveler_type}</span>
                      </div>
                      <div className="inline-block rounded bg-[#f0f6ff] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#003580]">
                        {rev.reservation_id}
                      </div>
                    </div>

                    {/* Right Review Content */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-[#595959]">
                            Reviewed: {rev.created_timestamp.slice(0, 10)}
                          </div>
                          <h4 className="mt-0.5 text-base font-bold text-[#1a1a1a]">
                            {rev.content.headline}
                          </h4>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-t-md rounded-br-md bg-[#003580] text-xs font-bold text-white">
                          {rev.review_score.toFixed(1)}
                        </div>
                      </div>

                      {rev.content.positive && (
                        <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[#1a1a1a]">
                          <Smile className="mt-0.5 h-4 w-4 shrink-0 text-[#008234]" />
                          <p>{rev.content.positive}</p>
                        </div>
                      )}

                      {rev.content.negative && (
                        <div className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-[#1a1a1a]">
                          <Frown className="mt-0.5 h-4 w-4 shrink-0 text-[#595959]" />
                          <div>
                            <p
                              className={
                                !isExpanded && negLong ? "line-clamp-3" : ""
                              }
                            >
                              {rev.content.negative}
                            </p>
                            {negLong && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedIds((prev) => ({
                                    ...prev,
                                    [rev.review_id]: !isExpanded,
                                  }))
                                }
                                className="mt-1 font-semibold text-[#006ce4] hover:underline"
                              >
                                {isExpanded ? "Show less" : "Continue reading"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hotel Response Block */}
                      {rev.reply && (
                        <div className="mt-3 rounded border border-[#e7e7e7] bg-[#f5f5f5] p-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-bold text-[#1a1a1a]">
                              <Hotel className="h-3.5 w-3.5" />
                              Hotel response:
                            </span>
                            {rev.reply.status === "PENDING_MODERATION" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Clock className="h-3 w-3" />
                                PENDING_MODERATION
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-[#008234]">
                                <CheckCircle2 className="h-3 w-3" />
                                PUBLISHED
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 leading-relaxed text-[#333333]">
                            {rev.reply.text}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-end gap-4 text-xs text-[#006ce4]">
                        <button
                          type="button"
                          onClick={() =>
                            setHelpfulVotes((v) => ({
                              ...v,
                              [rev.review_id]: "up",
                            }))
                          }
                          className={`inline-flex items-center gap-1 hover:underline ${
                            helpfulVotes[rev.review_id] === "up"
                              ? "font-bold"
                              : ""
                          }`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          Helpful
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setHelpfulVotes((v) => ({
                              ...v,
                              [rev.review_id]: "down",
                            }))
                          }
                          className={`inline-flex items-center gap-1 hover:underline ${
                            helpfulVotes[rev.review_id] === "down"
                              ? "font-bold"
                              : ""
                          }`}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          Not helpful
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

