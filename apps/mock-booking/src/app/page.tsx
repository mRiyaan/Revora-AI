"use client";

import React, { useCallback, useEffect, useState } from "react";
import BookingHeader from "@/components/BookingHeader";
import HeroGalleryAndSidebar from "@/components/HeroGalleryAndSidebar";
import HighlightsAndDescription from "@/components/HighlightsAndDescription";
import AvailabilityTable from "@/components/AvailabilityTable";
import ReviewsSection from "@/components/ReviewsSection";
import ReviewsDrawer from "@/components/ReviewsDrawer";
import SubmitReviewModal from "@/components/SubmitReviewModal";
import { PROPERTIES } from "@/lib/properties";
import { computeCategoryAverages } from "@/lib/score-utils";
import { BookingReview, PropertyId } from "@/lib/types";

const SANDBOX_TOKEN = "sandbox-booking-jwt";

export default function MockBookingPage() {
  const [selectedPropertyId, setSelectedPropertyId] =
    useState<PropertyId>("800101");
  const [reviews, setReviews] = useState<BookingReview[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTopic, setDrawerTopic] = useState<string | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  const property = PROPERTIES[selectedPropertyId];

  const fetchReviews = useCallback(async (propId: PropertyId) => {
    setIsPolling(true);
    try {
      const res = await fetch(
        `/api/review-api/properties/${propId}/reviews?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${SANDBOX_TOKEN}`,
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const json = await res.json();
        setReviews(json.data?.reviews || []);
        setLastSyncedAt(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }
    } catch {
      // Keep existing state on transient network errors
    } finally {
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(selectedPropertyId);
    const interval = setInterval(() => {
      fetchReviews(selectedPropertyId);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedPropertyId, fetchReviews]);

  const { overall, categories } = computeCategoryAverages(reviews);
  const totalReviewCount = property.baseReviewCount + reviews.length;

  return (
    <div className="min-h-screen bg-white">
      <BookingHeader
        property={property}
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={(id) => setSelectedPropertyId(id)}
        totalReviewCount={totalReviewCount}
        activeTab={activeTab}
        onTabClick={(tab) => setActiveTab(tab)}
      />

      <main>
        <HeroGalleryAndSidebar
          property={property}
          overallScore={overall}
          totalReviewCount={totalReviewCount}
          reviews={reviews}
          onOpenReviewsDrawer={() => {
            setDrawerTopic(null);
            setDrawerOpen(true);
          }}
          onOpenSubmitModal={() => setSubmitModalOpen(true)}
        />

        <HighlightsAndDescription property={property} />

        <AvailabilityTable property={property} />

        {/* House Rules & Legal Info anchors */}
        <section
          id="house-rules"
          className="mx-auto max-w-[1140px] px-4 pt-8"
        >
          <div className="rounded-lg border border-[#e7e7e7] bg-[#f9fafb] p-5">
            <h2 className="text-lg font-bold text-[#1a1a1a]">House rules</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-[#333333] sm:grid-cols-3">
              <div>
                <span className="font-bold text-[#1a1a1a]">Check-in:</span>{" "}
                From 14:00 (Government photo ID required)
              </div>
              <div>
                <span className="font-bold text-[#1a1a1a]">Check-out:</span>{" "}
                Until 12:00
              </div>
              <div>
                <span className="font-bold text-[#1a1a1a]">Pets:</span> Pets are
                not allowed
              </div>
            </div>
          </div>
        </section>

        <section id="legal" className="mx-auto max-w-[1140px] px-4 pt-4">
          <div className="rounded-lg border border-[#e7e7e7] bg-white p-4 text-xs text-[#595959]">
            <span className="font-bold text-[#1a1a1a]">
              Important and legal info:
            </span>{" "}
            Local simulation sandbox for Aurum Grand Hospitality (Property ID{" "}
            {selectedPropertyId} / {property.canonical_id}). Connected to Revora
            AI CRM via Booking.com Connectivity Guest Reviews API polling.
          </div>
        </section>

        <ReviewsSection
          property={property}
          reviews={reviews}
          overallScore={overall}
          totalReviewCount={totalReviewCount}
          categories={categories}
          lastSyncedAt={lastSyncedAt}
          isPolling={isPolling}
          onManualRefresh={() => fetchReviews(selectedPropertyId)}
          onOpenDrawer={(topic) => {
            setDrawerTopic(topic ?? null);
            setDrawerOpen(true);
          }}
          onOpenSubmitModal={() => setSubmitModalOpen(true)}
        />
      </main>

      <footer className="border-t border-[#e7e7e7] bg-[#003580] py-6 text-center text-xs text-blue-100">
        Aurum Grand Hospitality · Mock Booking.com Guest Reviews Sandbox (Port
        3002) · For Revora AI Demo Only
      </footer>

      <ReviewsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        property={property}
        reviews={reviews}
        overallScore={overall}
        totalReviewCount={totalReviewCount}
        categories={categories}
        initialTopic={drawerTopic}
      />

      <SubmitReviewModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        property={property}
        propertyId={selectedPropertyId}
        onSubmitted={() => fetchReviews(selectedPropertyId)}
      />
    </div>
  );
}

