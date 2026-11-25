"use client";

import React from "react";
import { HotelProperty } from "@/types";

interface SearchSidebarProps {
  property: HotelProperty;
  reviewCount: number;
  averageRating: number;
}

export function SearchSidebar({
  property,
  reviewCount,
  averageRating,
}: SearchSidebarProps) {
  return (
    <aside className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto lg:h-[calc(100vh-80px)] p-4 flex flex-col gap-4">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2.5 shadow-xs hover:shadow-sm transition">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          defaultValue={property.searchTag}
          readOnly
          className="w-full text-sm text-gray-800 bg-transparent outline-none cursor-default font-normal"
        />
        <button
          type="button"
          aria-label="Clear search"
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Filter and Expand Controls */}
      <div className="flex items-center justify-between text-xs text-gray-700">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-full hover:bg-gray-50 font-medium"
        >
          <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          All filters
        </button>

        <button
          type="button"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
        >
          <span>Expand</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Result Count */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 pt-1">
        <svg className="w-4 h-4 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
        </svg>
        <span>
          {property.city} · 18 results
        </span>
      </div>

      {/* Hotel Cards List */}
      <div className="flex flex-col gap-3">
        {/* Selected Hotel Card (Active) */}
        <div className="border-2 border-[#1a73e8] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
          <div className="p-3.5 flex flex-col gap-2">
            <div className="flex gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-amber-100 flex-shrink-0 relative">
                {/* Hotel thumbnail image */}
                <img
                  src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=300&q=80"
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">
                  Photos
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                  {property.fullName}
                </h3>
                <div className="text-base font-bold text-gray-900 mt-1">
                  {property.priceDisplay}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                  <span className="font-semibold text-gray-800">{averageRating.toFixed(1)}</span>
                  <span className="text-[#fbbc04]">★</span>
                  <span>({reviewCount > 20 ? "37.4K" : `${reviewCount}`})</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-600">
              5-star hotel · Free breakfast
            </div>

            <button
              type="button"
              className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold py-2 px-3 rounded-full transition text-center shadow-xs mt-1"
            >
              View prices
            </button>
          </div>
        </div>

        {/* Competitor Hotel Cards (Matching Screenshot 3) */}
        {property.competitors.map((comp, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-gray-300 transition p-3.5 flex flex-col gap-2 opacity-90"
          >
            <div className="flex gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={comp.image}
                  alt={comp.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-gray-900 leading-snug line-clamp-2">
                  {comp.name}
                </h4>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {comp.price}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                  <span className="font-medium text-gray-800">{comp.rating}</span>
                  <span className="text-[#fbbc04]">★</span>
                  <span>({comp.reviews})</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {comp.badge}
            </div>

            <button
              type="button"
              className="w-full border border-gray-300 hover:bg-gray-50 text-[#1a73e8] text-xs font-semibold py-1.5 px-3 rounded-full transition text-center"
            >
              View details
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
