"use client";

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { PropertyId, PropertyInfo, TravelerType } from "@/lib/types";

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyInfo;
  propertyId: PropertyId;
  onSubmitted: () => Promise<void>;
}

export default function SubmitReviewModal({
  isOpen,
  onClose,
  property,
  propertyId,
  onSubmitted,
}: SubmitReviewModalProps) {
  const [reviewerName, setReviewerName] = useState("");
  const [reviewScore, setReviewScore] = useState(9.0);
  const [travelerType, setTravelerType] = useState<TravelerType>("Couple");
  const [reservationId, setReservationId] = useState("");
  const [headline, setHeadline] = useState("");
  const [positive, setPositive] = useState("");
  const [negative, setNegative] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const applyPresetA = () => {
    setReviewerName("Meera Krishnan");
    setReviewScore(9.5);
    setTravelerType("Couple");
    setReservationId("RES-995102");
    setHeadline("Memorable weekend getaway");
    setPositive("Warm welcome, quiet rooms, and delicious breakfast buffet.");
    setNegative("Nothing at all.");
    setError(null);
  };

  const applyPresetB = () => {
    setReviewerName("Arjun Deshmukh");
    setReviewScore(3.0);
    setTravelerType("Business");
    setReservationId("RES-994821");
    setHeadline("Billed ₹6,200 instead of confirmed ₹5,000 rate");
    setPositive("Room was clean and Wi-Fi worked well.");
    setNegative(
      "My confirmed booking was ₹5,000 total, yet ₹6,200 was charged at checkout with no itemized explanation. Please refund the ₹1,200 overcharge immediately."
    );
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reviewerName.trim() || !headline.trim()) {
      setError("Please provide both Reviewer Name and Headline.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ui/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          reviewer_name: reviewerName.trim(),
          review_score: reviewScore,
          traveler_type: travelerType,
          reservation_id: reservationId.trim() || undefined,
          headline: headline.trim(),
          positive: positive.trim(),
          negative: negative.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit review");
      }
      await onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">
              Submit Guest Review — {property.name}
            </h2>
            <p className="text-xs text-[#595959]">
              Property ID: {propertyId} ({property.canonical_id}) · Persists to
              local sandbox JSON
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1-Click Hackathon Demo Presets */}
        <div className="mt-4 rounded-lg border border-[#dce8fa] bg-[#f0f6ff] p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#003580]">
            <Sparkles className="h-3.5 w-3.5" />
            1-Click Hackathon Demo Presets
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyPresetA}
              className="rounded border border-[#008234] bg-white px-3 py-1.5 text-xs font-semibold text-[#008234] hover:bg-green-50"
            >
              Preset A: 9.5/10 Routine Praise
            </button>
            <button
              type="button"
              onClick={applyPresetB}
              className="rounded border border-[#b91c1c] bg-white px-3 py-1.5 text-xs font-semibold text-[#b91c1c] hover:bg-red-50"
            >
              Preset B: 3.0/10 Billing Dispute (₹5,000 vs ₹6,200)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a]">
                Reviewer Name *
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g. Sneha Nair"
                className="mt-1 w-full rounded border border-[#868686] px-3 py-2 text-sm outline-none focus:border-[#006ce4]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a]">
                Reservation ID (optional)
              </label>
              <input
                type="text"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                placeholder="e.g. RES-994821"
                className="mt-1 w-full rounded border border-[#868686] px-3 py-2 text-sm outline-none focus:border-[#006ce4]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a]">
                Overall Score:{" "}
                <span className="rounded bg-[#003580] px-1.5 py-0.5 text-white">
                  {reviewScore.toFixed(1)} / 10
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={reviewScore}
                onChange={(e) => setReviewScore(Number(e.target.value))}
                className="mt-2 w-full accent-[#006ce4]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a1a1a]">
                Traveler Type
              </label>
              <select
                value={travelerType}
                onChange={(e) =>
                  setTravelerType(e.target.value as TravelerType)
                }
                className="mt-1 w-full rounded border border-[#868686] px-3 py-2 text-sm outline-none focus:border-[#006ce4]"
              >
                <option value="Business">Business</option>
                <option value="Couple">Couple</option>
                <option value="Family">Family</option>
                <option value="Solo">Solo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a1a1a]">
              Headline *
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Summarize your stay in one line"
              className="mt-1 w-full rounded border border-[#868686] px-3 py-2 text-sm outline-none focus:border-[#006ce4]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#008234]">
              Liked (Positive)
            </label>
            <textarea
              rows={2}
              value={positive}
              onChange={(e) => setPositive(e.target.value)}
              placeholder="What did you enjoy?"
              className="mt-1 w-full rounded border border-[#868686] px-3 py-2 text-sm outline-none focus:border-[#006ce4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#595959]">
              Disliked (Negative)
            </label>
            <textarea
              rows={3}
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
              placeholder="What could be improved?"
              className="mt-1 w-full rounded border border-[#868686] px-3 py-2 text-sm outline-none focus:border-[#006ce4]"
            />
          </div>

          {error && (
            <div className="rounded bg-red-50 p-2.5 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#868686] px-4 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-[#006ce4] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0057b8] disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Publish Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

