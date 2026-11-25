"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import hotelsData from "../../data/hotels.json";
import { HotelProperty, GbpReview } from "@/types";
import { SandboxBanner } from "@/components/SandboxBanner";
import { GoogleHeader } from "@/components/GoogleHeader";
import { SearchSidebar } from "@/components/SearchSidebar";
import { HotelHeader } from "@/components/HotelHeader";
import { GoogleReviewSummary } from "@/components/GoogleReviewSummary";
import { ReviewCard } from "@/components/ReviewCard";
import { WriteReviewModal } from "@/components/WriteReviewModal";
import { CrmConnectionPanel } from "@/components/CrmConnectionPanel";
import { STAR_MAP } from "@/lib/constants";

export default function MockGooglePage() {
  const properties = hotelsData as HotelProperty[];
  const [selectedLocationId, setSelectedLocationId] = useState<string>("loc-blr-001");
  const [activeTab, setActiveTab] = useState<string>("Reviews");
  const [reviews, setReviews] = useState<GbpReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"relevant" | "newest" | "highest" | "lowest">("relevant");
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [isCrmPanelOpen, setIsCrmPanelOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  // Selected property object
  const currentProperty = useMemo(() => {
    return properties.find((p) => p.locationId === selectedLocationId) || properties[0];
  }, [properties, selectedLocationId]);

  // Fetch reviews using Bearer token per Spec
  const fetchReviews = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setIsLoading(true);
      const res = await fetch(
        `/api/v4/accounts/acc-aurum-01/locations/${selectedLocationId}/reviews?pageSize=50`,
        {
          headers: {
            Authorization: "Bearer sandbox-gbp-token",
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  }, [selectedLocationId]);

  // Initial fetch on property change
  useEffect(() => {
    fetchReviews(false);
  }, [fetchReviews]);

  // 3-second Auto-polling per Spec §6.4
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReviews(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchReviews]);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Filter & Sort reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.comment.toLowerCase().includes(query) ||
          r.reviewer.displayName.toLowerCase().includes(query)
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
    } else if (sortBy === "highest") {
      result.sort((a, b) => (STAR_MAP[b.starRating] || 5) - (STAR_MAP[a.starRating] || 5));
    } else if (sortBy === "lowest") {
      result.sort((a, b) => (STAR_MAP[a.starRating] || 5) - (STAR_MAP[b.starRating] || 5));
    }

    return result;
  }, [reviews, searchQuery, sortBy]);

  // Review submission callback
  const handleReviewSubmitted = (newReview: GbpReview, webhookDelivered: boolean) => {
    setReviews((prev) => [newReview, ...prev]);
    if (webhookDelivered) {
      setToastMessage({
        text: "Review posted • Cloud Pub/Sub NEW_REVIEW webhook delivered to Revora CRM (localhost:4000)",
        type: "success",
      });
    } else {
      setToastMessage({
        text: "Review posted • Saved locally in data/reviews.json (CRM backend localhost:4000 is currently offline)",
        type: "info",
      });
    }
  };

  // Simulate CRM AI owner reply handler
  const handleSimulateReply = async (reviewId: string) => {
    const targetReview = reviews.find((r) => r.reviewId === reviewId);
    if (!targetReview) return;

    const isNegative = targetReview.starRating === "ONE" || targetReview.starRating === "TWO";
    const sampleReplyComment = isNegative
      ? `Dear ${targetReview.reviewer.displayName},\n\nNamaste from ${currentProperty.name}.\n\nThank you for taking the time to share your candid feedback. We are deeply concerned to learn that your recent stay did not meet the five-star standards we strive to deliver.\n\nOur leadership and guest relations team have taken immediate note of the issues raised in your review. Please allow us an opportunity to investigate this thoroughly and connect with you directly.\n\nWarm Regards,\nNishant Agarwal\nVice President and General Manager\n${currentProperty.name}`
      : `Dear ${targetReview.reviewer.displayName},\n\nNamaste from ${currentProperty.name}!\n\nThank you for sharing your wonderful feedback. We are thrilled to know you had an exceptional stay and that our hospitality, cuisine, and team made your visit memorable.\n\nWe look forward to welcoming you back for another delightful experience in the near future.\n\nWarm Regards,\nNishant Agarwal\nVice President and General Manager\n${currentProperty.name}`;

    try {
      const res = await fetch(
        `/api/v4/accounts/acc-aurum-01/locations/${selectedLocationId}/reviews/${reviewId}/reply`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sandbox-gbp-token",
          },
          body: JSON.stringify({ comment: sampleReplyComment }),
        }
      );

      if (res.ok) {
        setToastMessage({
          text: `Owner response published via PUT /api/v4/.../reply for ${targetReview.reviewer.displayName}`,
          type: "success",
        });
        fetchReviews(true);
      }
    } catch (err) {
      console.error("Error simulating reply:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      {/* 1. Mandatory Persistent Sandbox Banner */}
      <SandboxBanner />

      {/* 2. Google Travel Navigation Header */}
      <GoogleHeader
        properties={properties}
        selectedLocationId={selectedLocationId}
        onSelectProperty={(locId) => setSelectedLocationId(locId)}
        onOpenCrmInfo={() => setIsCrmPanelOpen(true)}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <aside
          aria-live="polite"
          className={`fixed bottom-20 right-6 z-50 max-w-md p-4 rounded-xl shadow-lg border text-xs leading-relaxed animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-900 text-emerald-100 border-emerald-700"
              : "bg-stone-900 text-stone-100 border-stone-700"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-base">
              {toastMessage.type === "success" ? "✓" : "ℹ"}
            </span>
            <div className="flex-1 font-medium">{toastMessage.text}</div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Close notification"
              className="text-stone-400 hover:text-white ml-1"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* Main Split Layout: Left Search Sidebar + Right Hotel Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Search Sidebar (Screenshot 3) */}
        <SearchSidebar
          property={currentProperty}
          reviewCount={reviews.length}
          averageRating={
            reviews.length > 0
              ? reviews.reduce((sum, r) => sum + (STAR_MAP[r.starRating] || 5), 0) /
                reviews.length
              : 4.6
          }
        />

        {/* Right Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col min-w-0">
          {/* Breadcrumbs, Hotel Title & Tabs */}
          <HotelHeader
            property={currentProperty}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />

          {/* Main Tab Content */}
          <div className="p-6 max-w-4xl space-y-8 pb-32">
            {activeTab === "Reviews" ? (
              <>
                {/* Google Review Summary & Histogram (Screenshot 3) */}
                <GoogleReviewSummary
                  property={currentProperty}
                  reviews={reviews}
                />

                <hr className="border-gray-200" />

                {/* Reviews Header Section */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-normal text-[#202124]">
                        Reviews
                      </h2>
                      {/* Live Polling Indicator */}
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>Live sync active (3s polling)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Manual Refresh Button */}
                      <button
                        type="button"
                        onClick={() => fetchReviews(false)}
                        title="Refresh reviews"
                        className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10" />
                          <polyline points="1 20 1 14 7 14" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                      </button>

                      {/* "Write a review" Button (Screenshot 3) */}
                      <button
                        type="button"
                        onClick={() => setIsWriteModalOpen(true)}
                        className="flex items-center gap-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                        <span>Write a review</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Reviews & Sort Chips */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Search Reviews Input */}
                    <div className="relative flex-1 max-w-md">
                      <svg
                        className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search reviews"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a73e8]"
                      />
                    </div>

                    {/* Sort Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                      <button
                        type="button"
                        onClick={() => setSortBy("relevant")}
                        className={`px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                          sortBy === "relevant"
                            ? "bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] font-semibold"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Most relevant
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy("newest")}
                        className={`px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                          sortBy === "newest"
                            ? "bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] font-semibold"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Newest
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy("highest")}
                        className={`px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                          sortBy === "highest"
                            ? "bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] font-semibold"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Highest rating
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy("lowest")}
                        className={`px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                          sortBy === "lowest"
                            ? "bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] font-semibold"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Lowest rating
                      </button>
                    </div>
                  </div>
                </div>

                {/* Review Cards List (Screenshots 1, 2, 4) */}
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="py-12 text-center text-xs text-gray-500">
                      Loading authentic reviews...
                    </div>
                  ) : filteredReviews.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-500">
                      No reviews found matching &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    filteredReviews.map((review) => (
                      <ReviewCard
                        key={review.reviewId}
                        review={review}
                        onSimulateReply={handleSimulateReply}
                      />
                    ))
                  )}
                </div>
              </>
            ) : (
              /* Overview / Other Tabs fallback preview */
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 text-center">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {activeTab} of {currentProperty.name}
                  </h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    This section presents {activeTab.toLowerCase()} details. For our hackathon demonstration and evaluation, please navigate to the active <strong>Reviews</strong> tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("Reviews")}
                    className="mt-4 px-4 py-2 bg-[#1a73e8] text-white text-xs font-semibold rounded-full hover:bg-[#1557b0] transition"
                  >
                    View Reviews & Pub/Sub Integration
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Bar (Matching Screenshot 3) */}
          <footer className="fixed bottom-0 right-0 left-0 lg:left-[380px] xl:left-[420px] bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shadow-lg z-30">
            <div>
              <div className="text-xs font-semibold text-[#202124] line-clamp-1">
                {currentProperty.fullName}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5f6368] mt-0.5">
                <span className="font-bold text-[#202124] text-sm">
                  {currentProperty.priceDisplay}
                </span>
                <span>•</span>
                <span>{currentProperty.dates}</span>
              </div>
            </div>

            <button
              type="button"
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold px-6 py-2.5 rounded-full transition shadow-xs"
            >
              View prices
            </button>
          </footer>
        </main>
      </div>

      {/* Write a Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        property={currentProperty}
        onSubmitSuccess={handleReviewSubmitted}
      />

      {/* Revora CRM Connection & Pub/Sub Architecture Panel */}
      <CrmConnectionPanel
        isOpen={isCrmPanelOpen}
        onClose={() => setIsCrmPanelOpen(false)}
      />
    </div>
  );
}
