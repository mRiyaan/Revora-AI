"use client";

import React, { useState, useEffect } from "react";
import { HotelProperty, StarRating } from "@/types";
import { NUMBER_TO_STAR } from "@/lib/constants";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: HotelProperty;
  onSubmitSuccess: (newReviewData: any, webhookDelivered: boolean) => void;
}

export function WriteReviewModal({
  isOpen,
  onClose,
  property,
  onSubmitSuccess,
}: WriteReviewModalProps) {
  const [starCount, setStarCount] = useState<number>(5);
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [tripType, setTripType] = useState<string>("Holiday | Family");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Preset A: 5★ Routine Praise
  const applyPresetA = () => {
    setDisplayName("Ananya Kapoor");
    setStarCount(5);
    setTripType("Holiday | Family");
    setComment(
      "Wonderful stay at Aurum Grand! Quick check-in, spotless room, and super polite front desk staff. Will definitely come back."
    );
    setErrorMsg(null);
  };

  // Preset B: 1★ Billing Dispute
  const applyPresetB = () => {
    setDisplayName("Vikram Malhotra");
    setStarCount(1);
    setTripType("Business | Solo");
    setComment(
      "Booked my room for ₹5,000 per night inclusive of taxes, but at checkout I was billed ₹6,200 with unexplained extra charges. Staff could not explain the ₹1,200 difference. Requesting an immediate refund."
    );
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!comment.trim()) {
      setErrorMsg("Please write your review comment.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const starRating: StarRating = NUMBER_TO_STAR[starCount] || "FIVE";

    try {
      const res = await fetch("/api/ui/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId: property.locationId,
          displayName: displayName.trim(),
          starRating,
          comment: comment.trim(),
          tripType,
          subRatings: {
            rooms: starCount === 5 ? 5.0 : starCount === 1 ? 2.0 : 3.5,
            service: starCount === 5 ? 5.0 : starCount === 1 ? 1.0 : 3.5,
            location: 5.0,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      const data = await res.json();
      onSubmitSuccess(data.review, data.webhookDelivered);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const starDescriptions = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
  const currentRatingDisplay = hoverStar || starCount;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div>
              <h2 id="review-dialog-title" className="text-base font-semibold text-[#202124]">
                Write a review
              </h2>
              <p className="text-xs text-[#5f6368] line-clamp-1">{property.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 1-Click Hackathon Presets Banner */}
        <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            1-Click Demo Presets:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyPresetA}
              className="text-xs font-medium bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1 rounded shadow-2xs transition"
            >
              Preset A (5★ Praise)
            </button>
            <button
              type="button"
              onClick={applyPresetB}
              className="text-xs font-medium bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 px-2.5 py-1 rounded shadow-2xs transition"
            >
              Preset B (1★ Dispute)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Interactive Star Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Overall rating
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverStar(s)}
                    onMouseLeave={() => setHoverStar(null)}
                    onClick={() => setStarCount(s)}
                    className="p-1 text-gray-300 hover:scale-110 transition cursor-pointer"
                  >
                    <svg
                      className={`w-7 h-7 ${
                        s <= currentRatingDisplay
                          ? "text-[#fbbc04] fill-[#fbbc04]"
                          : "text-gray-300 fill-gray-200"
                      }`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-600 ml-2">
                {starDescriptions[currentRatingDisplay - 1]} ({currentRatingDisplay}/5)
              </span>
            </div>
          </div>

          {/* Guest Name & Trip Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reviewer-name" className="block text-xs font-medium text-gray-700 mb-1">
                Your name *
              </label>
              <input
                id="reviewer-name"
                type="text"
                placeholder="e.g. Diya Sathish"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
              />
            </div>
            <div>
              <label htmlFor="trip-type-select" className="block text-xs font-medium text-gray-700 mb-1">
                Trip type
              </label>
              <select
                id="trip-type-select"
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white cursor-pointer"
              >
                <option value="Holiday | Family">Holiday | Family</option>
                <option value="Business | Solo">Business | Solo</option>
                <option value="Holiday | Couple">Holiday | Couple</option>
                <option value="Holiday | Friends">Holiday | Friends</option>
                <option value="Holiday | Solo">Holiday | Solo</option>
              </select>
            </div>
          </div>

          {/* Review Details Textarea */}
          <div>
            <label htmlFor="review-feedback-textarea" className="block text-xs font-medium text-gray-700 mb-1">
              Share details of your own experience at this hotel *
            </label>
            <textarea
              id="review-feedback-textarea"
              rows={4}
              placeholder="What did you like or dislike? How was the service, cleanliness, and rooms?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#5f6368] hover:bg-gray-100 rounded-full transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full transition shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Posting & firing Pub/Sub...</span>
                </>
              ) : (
                <span>Post Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
