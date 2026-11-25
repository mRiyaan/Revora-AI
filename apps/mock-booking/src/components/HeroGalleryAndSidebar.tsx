"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Leaf,
  MapPin,
  MessageSquarePlus,
  Share2,
  Star,
  Tag,
  ThumbsUp,
  X,
} from "lucide-react";
import { BookingReview, PropertyInfo } from "@/lib/types";
import { getCountryFlag, getScoreLabel } from "@/lib/score-utils";

interface HeroGalleryAndSidebarProps {
  property: PropertyInfo;
  overallScore: number;
  totalReviewCount: number;
  reviews: BookingReview[];
  onOpenReviewsDrawer: () => void;
  onOpenSubmitModal: () => void;
}

export default function HeroGalleryAndSidebar({
  property,
  overallScore,
  totalReviewCount,
  reviews,
  onOpenReviewsDrawer,
  onOpenSubmitModal,
}: HeroGalleryAndSidebarProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const positiveQuotes = reviews.filter(
    (r) => r.review_score >= 8.0 && r.content.positive.length > 15
  );
  const displayQuotes =
    positiveQuotes.length > 0 ? positiveQuotes : reviews.slice(0, 3);
  const activeQuote = displayQuotes[quoteIdx % Math.max(1, displayQuotes.length)];

  const allPhotos = [
    property.heroImages.main,
    property.heroImages.topRight,
    property.heroImages.midRight,
    ...property.heroImages.thumbs,
  ];

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  return (
    <section id="overview" className="mx-auto max-w-[1140px] px-4 pt-4">
      {/* Title & Action Row */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 text-[#ffb700]">
              {Array.from({ length: property.stars }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-[#ffb700]" />
              ))}
            </div>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#ffb700] text-white">
              <ThumbsUp className="h-3 w-3 fill-white" />
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-[#d9d9d9] bg-white px-2 py-0.5 text-xs font-medium text-[#1a1a1a]">
              <Leaf className="h-3.5 w-3.5 text-[#008234]" />
              Sustainability certification
            </span>
          </div>

          <h1 className="mt-1.5 text-2xl font-bold text-[#1a1a1a] md:text-[26px]">
            {property.name}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[#1a1a1a]">
            <MapPin className="h-4 w-4 text-[#006ce4]" />
            <span>{property.address}</span>
            <span>–</span>
            <button
              type="button"
              onClick={() => setMapModalOpen(true)}
              className="font-semibold text-[#006ce4] hover:underline"
            >
              Excellent location – show map
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenSubmitModal}
              className="inline-flex items-center gap-1.5 rounded border border-[#ffb700] bg-[#fff8e1] px-3 py-2 text-xs font-bold text-[#92400e] shadow-sm hover:bg-[#ffecb3]"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Submit guest review
            </button>
            <button
              type="button"
              onClick={() => setWishlisted((w) => !w)}
              aria-label="Save to wishlist"
              className="rounded p-2 text-[#006ce4] hover:bg-blue-50"
            >
              <Heart
                className={`h-5 w-5 ${
                  wishlisted ? "fill-[#e11d48] text-[#e11d48]" : ""
                }`}
              />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share property"
                className="rounded p-2 text-[#006ce4] hover:bg-blue-50"
              >
                <Share2 className="h-5 w-5" />
              </button>
              {shareToast && (
                <span className="absolute right-0 top-full mt-1 whitespace-nowrap rounded bg-[#1a1a1a] px-2 py-1 text-[11px] text-white shadow">
                  Link copied!
                </span>
              )}
            </div>
            <a
              href="#info-prices"
              className="rounded bg-[#006ce4] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0057b8]"
            >
              Reserve
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#006ce4]">
            <Tag className="h-3.5 w-3.5" />
            <span>We Price Match</span>
          </div>
        </div>
      </div>

      {/* Bento Photo Collage (72%) + Score & Map Sidebar (28%) */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[72%_1fr]">
        {/* Left 72%: Asymmetric Bento Collage */}
        <div>
          <div className="grid h-[340px] grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setLightboxIdx(0)}
              className="col-span-2 h-full overflow-hidden rounded-tl-lg"
            >
              <img
                src={property.heroImages.main}
                alt={property.name}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
            <div className="grid grid-rows-2 gap-2 h-full">
              <button
                type="button"
                onClick={() => setLightboxIdx(1)}
                className="h-full overflow-hidden rounded-tr-lg"
              >
                <img
                  src={property.heroImages.topRight}
                  alt={`${property.name} dining`}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIdx(2)}
                className="h-full overflow-hidden"
              >
                <img
                  src={property.heroImages.midRight}
                  alt={`${property.name} lobby`}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </button>
            </div>
          </div>

          {/* 5 Bottom Thumbnails */}
          <div className="mt-2 grid grid-cols-5 gap-2">
            {property.heroImages.thumbs.map((src, idx) => {
              const isLast = idx === property.heroImages.thumbs.length - 1;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIdx(idx + 3)}
                  className="relative h-20 overflow-hidden rounded-sm"
                >
                  <img
                    src={src}
                    alt={`${property.name} gallery ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {isLast && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white underline">
                      +{property.heroImages.extraCount} photos
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 28%: Score Card + Quote Carousel + Free Wifi + Mini Map */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-[#e7e7e7] bg-white p-3.5">
            <button
              type="button"
              onClick={onOpenReviewsDrawer}
              className="flex w-full items-center justify-end gap-2.5 text-right group"
            >
              <div>
                <div className="text-base font-bold text-[#1a1a1a] group-hover:underline">
                  {getScoreLabel(overallScore)}
                </div>
                <div className="text-xs text-[#595959]">
                  {totalReviewCount} reviews
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-t-md rounded-br-md bg-[#003580] text-sm font-bold text-white">
                {overallScore.toFixed(1)}
              </div>
            </button>

            <div className="my-3 border-t border-[#e7e7e7]" />

            <div className="text-xs font-bold text-[#1a1a1a]">
              Guests who stayed here loved
            </div>

            {activeQuote && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-xs leading-relaxed text-[#1a1a1a]">
                  <p className="line-clamp-4">
                    “{activeQuote.content.positive}”
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#008234] text-[11px] font-bold text-white">
                      {activeQuote.reviewer_name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-semibold text-[#1a1a1a]">
                      {activeQuote.reviewer_name}
                    </span>
                    <span className="text-[#595959]">
                      {getCountryFlag(activeQuote.country_code)}{" "}
                      {activeQuote.country || "India"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuoteIdx((i) => (i + 1) % displayQuotes.length)
                  }
                  aria-label="Next guest quote"
                  className="shrink-0 rounded-full p-1 text-[#595959] hover:bg-gray-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="my-3 border-t border-[#e7e7e7]" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1a1a1a]">Free Wifi</span>
              <span className="rounded border border-[#1a1a1a] px-2 py-0.5 text-xs font-bold text-[#1a1a1a]">
                9.6
              </span>
            </div>
          </div>

          {/* Stylized Mini-Map Card */}
          <div className="relative h-36 overflow-hidden rounded-lg border border-[#e7e7e7] bg-[#e6efe9]">
            <svg
              viewBox="0 0 320 150"
              className="h-full w-full opacity-90"
              aria-hidden="true"
            >
              <rect width="320" height="150" fill="#e8f0e8" />
              <path d="M0 30 L320 60" stroke="#fcd34d" strokeWidth="6" />
              <path d="M40 0 L120 150" stroke="#ffffff" strokeWidth="5" />
              <path d="M210 0 L170 150" stroke="#ffffff" strokeWidth="4" />
              <path d="M0 110 L320 95" stroke="#ffffff" strokeWidth="5" />
              <rect x="65" y="45" width="75" height="35" rx="4" fill="#d1e7dd" />
              <rect x="195" y="25" width="85" height="45" rx="4" fill="#dbeafe" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#006ce4] text-white shadow-md">
                <MapPin className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={() => setMapModalOpen(true)}
                className="rounded bg-[#006ce4] px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#0057b8]"
              >
                Show on map
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() =>
              setLightboxIdx(
                (lightboxIdx - 1 + allPhotos.length) % allPhotos.length
              )
            }
            className="mr-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={allPhotos[lightboxIdx]}
            alt="Property photo"
            className="max-h-[82vh] max-w-[80vw] rounded-lg object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setLightboxIdx((lightboxIdx + 1) % allPhotos.length)}
            className="ml-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Map Modal */}
      {mapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1a1a1a]">
                  {property.name}
                </h3>
                <p className="text-xs text-[#595959]">{property.address}</p>
              </div>
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex h-64 flex-col items-center justify-center rounded-lg border bg-[#e8f0e8] p-6 text-center">
              <MapPin className="h-10 w-10 text-[#006ce4]" />
              <p className="mt-2 text-sm font-bold text-[#1a1a1a]">
                Excellent Location — Rated 9.0 / 10
              </p>
              <p className="mt-1 text-xs text-[#595959]">
                Property ID: {property.property_id} ({property.canonical_id}) ·{" "}
                {property.tagline}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

