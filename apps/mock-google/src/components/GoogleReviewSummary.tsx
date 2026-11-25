"use client";

import React from "react";
import { GbpReview, HotelProperty } from "@/types";
import { STAR_MAP } from "@/lib/constants";

interface GoogleReviewSummaryProps {
  property: HotelProperty;
  reviews: GbpReview[];
}

export function GoogleReviewSummary({
  property,
  reviews,
}: GoogleReviewSummaryProps) {
  // Compute rating distribution from actual reviews
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalStars = 0;

  reviews.forEach((r) => {
    const star = STAR_MAP[r.starRating] || 5;
    counts[star as keyof typeof counts]++;
    totalStars += star;
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : "4.6";

  // Compute percentages for distribution bars
  const percentages = {
    5: totalReviews > 0 ? Math.round((counts[5] / totalReviews) * 100) : 75,
    4: totalReviews > 0 ? Math.round((counts[4] / totalReviews) * 100) : 15,
    3: totalReviews > 0 ? Math.round((counts[3] / totalReviews) * 100) : 5,
    2: totalReviews > 0 ? Math.round((counts[2] / totalReviews) * 100) : 2,
    1: totalReviews > 0 ? Math.round((counts[1] / totalReviews) * 100) : 3,
  };

  return (
    <div className="space-y-6">
      {/* Google Review Summary Title */}
      <div>
        <div className="flex items-center gap-1.5 text-lg font-medium text-[#202124]">
          <h2>Google review summary</h2>
          <button
            type="button"
            aria-label="Review information"
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>

        {/* Rating Block + Horizontal Histogram Bars (Matching Screenshot 3) */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-8">
          {/* Big Rating Number & Stars */}
          <div className="flex flex-col items-start min-w-[140px]">
            <span className="text-5xl font-light text-[#202124] tracking-tight">
              {avgRating}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[#fbbc04]">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-[#70757a] mt-1">
              {totalReviews > 20 ? "37,411 reviews" : `${totalReviews} reviews (live mock)`}
            </span>
          </div>

          {/* 5-to-1 Distribution Bars */}
          <div className="flex-1 max-w-lg space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-3 text-xs text-[#70757a]">
                <span className="w-8 text-right font-medium">{star} star</span>
                <div className="flex-1 h-2.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#fbbc04] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(percentages[star as keyof typeof percentages], 2)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews on Other Travel Sites (Matching Screenshot 3) */}
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-[#202124] mb-3">
          Reviews on other travel sites
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {property.otherTravelSites.map((site, idx) => (
            <div
              key={idx}
              className="border border-[#dadce0] rounded-xl p-3.5 hover:shadow-xs transition bg-white flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {/* Site Icon */}
                {site.icon === "tripadvisor" ? (
                  <div className="w-7 h-7 rounded-full bg-[#34e0a1] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-black fill-current" viewBox="0 0 24 24">
                      <circle cx="8" cy="12" r="3" />
                      <circle cx="16" cy="12" r="3" />
                      <circle cx="8" cy="12" r="1" fill="#fff" />
                      <circle cx="16" cy="12" r="1" fill="#fff" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#2577e3] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                    T.
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#202124]">
                    <span>{site.platform}</span>
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                  <div className="text-xs text-[#70757a] mt-0.5">
                    <span className="font-medium text-[#202124]">{site.rating}</span> · {site.reviews}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
