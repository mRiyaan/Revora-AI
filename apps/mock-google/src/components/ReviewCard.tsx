"use client";

import React, { useState } from "react";
import { GbpReview } from "@/types";
import { STAR_MAP } from "@/lib/constants";

interface ReviewCardProps {
  review: GbpReview;
  onSimulateReply?: (reviewId: string) => void;
}

export function ReviewCard({ review, onSimulateReply }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const starScore = STAR_MAP[review.starRating] || 5;

  // Format relative time helper
  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);

      if (diffWeeks > 0) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
      if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
      if (diffHours > 0) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
      return "Just now";
    } catch {
      return "Recently";
    }
  };

  const isLongComment = review.comment.length > 220;
  const displayComment =
    isLongComment && !isExpanded
      ? `${review.comment.slice(0, 220)}...`
      : review.comment;

  // Avatar background colors based on name
  const avatarColors = [
    "bg-emerald-600",
    "bg-blue-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-purple-600",
    "bg-teal-600",
  ];
  const charCode = review.reviewer.displayName.charCodeAt(0) || 65;
  const avatarColor = avatarColors[charCode % avatarColors.length];
  const initial = review.reviewer.displayName.charAt(0).toUpperCase();

  return (
    <article className="border border-[#dadce0] rounded-xl p-5 bg-white shadow-xs transition hover:border-gray-400">
      {/* Top Header: Avatar, Name, Relative Date, and 5/5 Rating */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div
            className={`w-10 h-10 rounded-full ${avatarColor} text-white flex items-center justify-center font-semibold text-sm flex-shrink-0 shadow-xs`}
          >
            {initial}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#202124]">
              {review.reviewer.displayName}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-[#70757a] mt-0.5">
              <span>{getRelativeTime(review.createTime)} on</span>
              {/* Google G logo */}
              <span className="inline-flex items-center gap-0.5 font-medium text-gray-700">
                <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </span>
            </div>
          </div>
        </div>

        {/* Rating Score Badge: 5/5 or 1/5 (Matching Screenshot 1, 2, 4) */}
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-light text-[#202124] tracking-tight">
            {starScore}/5
          </div>
        </div>
      </div>

      {/* Trip Type tag (e.g. Holiday | Family) */}
      {review.tripType && (
        <div className="text-xs text-[#70757a] mt-3 font-normal">
          {review.tripType}
        </div>
      )}

      {/* Review Comment Body with "More" / "Read more" toggle */}
      <div className="mt-2 text-sm text-[#3c4043] leading-relaxed whitespace-pre-line">
        {displayComment}
        {isLongComment && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1 text-[#1a73e8] hover:underline font-medium text-xs inline-block"
          >
            {isExpanded ? "Less" : "More"}
          </button>
        )}
      </div>

      {/* Sub-ratings (Rooms 5.0  Service 5.0  Location 5.0) */}
      {review.subRatings && (
        <div className="mt-3 flex items-center gap-4 text-xs text-[#70757a] flex-wrap">
          {review.subRatings.rooms !== undefined && (
            <span>
              <strong className="font-medium text-[#202124]">Rooms</strong> {review.subRatings.rooms.toFixed(1)}
            </span>
          )}
          {review.subRatings.service !== undefined && (
            <span>
              <strong className="font-medium text-[#202124]">Service</strong> {review.subRatings.service.toFixed(1)}
            </span>
          )}
          {review.subRatings.location !== undefined && (
            <span>
              <strong className="font-medium text-[#202124]">Location</strong> {review.subRatings.location.toFixed(1)}
            </span>
          )}
        </div>
      )}

      {/* Highlights and Details Tags (matching screenshots 1 & 2) */}
      <div className="mt-2 space-y-1 text-xs text-[#70757a]">
        {review.hotelHighlights && (
          <div>
            <strong className="font-medium text-[#202124]">Hotel highlights</strong>{" "}
            {review.hotelHighlights}
          </div>
        )}
        {review.roomDetails && (
          <div>
            <strong className="font-medium text-[#202124]">Rooms</strong> {review.roomDetails}
          </div>
        )}
        {review.foodDetails && (
          <div>
            <strong className="font-medium text-[#202124]">Food and drinks</strong>{" "}
            {review.foodDetails}
          </div>
        )}
        {review.noteworthyDetails && (
          <div>
            <strong className="font-medium text-[#202124]">Noteworthy details</strong>{" "}
            {review.noteworthyDetails}
          </div>
        )}
      </div>

      {/* Card Action footer (Three dots menu) */}
      <div className="flex items-center justify-between mt-3 pt-2">
        <div>
          {/* Quick reply helper button for hackathon live testing */}
          {!review.reviewReply && onSimulateReply && (
            <button
              type="button"
              onClick={() => onSimulateReply(review.reviewId)}
              className="text-[11px] text-[#1a73e8] hover:bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition font-medium"
            >
              + Simulate CRM AI Reply
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="More options"
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </div>

      {/* Indented "Response from the owner" Card (Matching Screenshots 1 & 4) */}
      {review.reviewReply && (
        <div className="mt-4 pt-4 border-t border-gray-100 pl-4 sm:pl-6 border-l-2 border-l-gray-300 ml-1 sm:ml-2 bg-gray-50/60 rounded-r-lg p-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#202124]">
              Response from the owner
            </h4>
            <span className="text-[11px] text-[#70757a]">
              {getRelativeTime(review.reviewReply.updateTime)}
            </span>
          </div>
          <div className="mt-2 text-xs text-[#3c4043] leading-relaxed whitespace-pre-line">
            {review.reviewReply.comment}
          </div>
        </div>
      )}
    </article>
  );
}
