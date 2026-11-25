"use client";

import React from "react";
import { HotelProperty } from "@/types";

interface HotelHeaderProps {
  property: HotelProperty;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function HotelHeader({
  property,
  activeTab,
  onTabChange,
}: HotelHeaderProps) {
  const tabs = ["Overview", "Prices", "Reviews", "Location", "About", "Photos"];

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Top breadcrumb & navigation bar (matching screenshot 2) */}
      <div className="px-6 py-2.5 flex items-center justify-between text-xs text-gray-600 border-b border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="text-[#1a73e8] hover:underline font-medium flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to hotels
          </button>
          <span className="text-gray-300">|</span>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
            {property.breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span className={idx === property.breadcrumbs.length - 1 ? "font-medium text-gray-700" : "hover:underline cursor-pointer"}>
                  {crumb}
                </span>
                {idx < property.breadcrumbs.length - 1 && (
                  <span className="text-gray-400">›</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Action icons (Open in new tab, Back X) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Open in new window"
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition"
          >
            <svg className="w-4 h-4 text-[#1a73e8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
          <button
            type="button"
            title="Back"
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#1a73e8] border border-gray-300 rounded-full hover:bg-gray-50 transition font-medium"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Main Hotel Title Header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-[28px] font-normal text-[#202124] tracking-tight">
                {property.fullName}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#5f6368] mt-1">
              <span>{property.category}</span>
              <span>•</span>
              <span>{property.address}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Matching Screenshot 2 & 3) */}
        <div className="flex items-center gap-8 mt-5 border-b border-gray-200 text-sm overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`pb-3 font-medium text-sm transition relative whitespace-nowrap ${
                  isActive
                    ? "text-[#1a73e8] font-semibold"
                    : "text-[#5f6368] hover:text-[#202124]"
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1a73e8] rounded-t-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
