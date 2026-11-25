"use client";

import React from "react";
import { HotelProperty } from "@/types";

interface GoogleHeaderProps {
  properties: HotelProperty[];
  selectedLocationId: string;
  onSelectProperty: (locationId: string) => void;
  onOpenCrmInfo: () => void;
}

export function GoogleHeader({
  properties,
  selectedLocationId,
  onSelectProperty,
  onOpenCrmInfo,
}: GoogleHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-4 sticky top-[37px] z-40 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Hamburger menu */}
        <button
          type="button"
          aria-label="Google Menu"
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Google Logo */}
        <div className="flex items-center select-none cursor-pointer">
          <span className="text-xl font-medium tracking-tight">
            <span className="text-[#4285F4] font-bold">G</span>
            <span className="text-[#EA4335] font-bold">o</span>
            <span className="text-[#FBBC05] font-bold">o</span>
            <span className="text-[#4285F4] font-bold">g</span>
            <span className="text-[#34A853] font-bold">l</span>
            <span className="text-[#EA4335] font-bold">e</span>
          </span>
          <span className="ml-2 text-xs text-gray-500 font-sans hidden sm:inline-block border-l border-gray-300 pl-2">
            Travel
          </span>
        </div>

        {/* Google Travel Category Pills (Explore, Flights, Hotels [active], Holiday rentals) */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Explore
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Flights
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc] transition shadow-xs"
          >
            <svg className="w-4 h-4 text-[#1a73e8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v11m0-4h18m0-7v11M3 11h18" />
              <circle cx="7" cy="7" r="2" />
            </svg>
            Hotels
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
          >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Holiday rentals
          </button>
        </nav>
      </div>

      {/* Right Controls: Property Switcher & CRM Architecture Info Button */}
      <div className="flex items-center gap-3">
        {/* Property Switcher */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5">
          <label htmlFor="property-switcher" className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider hidden sm:inline">
            Property:
          </label>
          <select
            id="property-switcher"
            value={selectedLocationId}
            onChange={(e) => onSelectProperty(e.target.value)}
            className="bg-transparent text-xs font-medium text-gray-800 outline-none cursor-pointer"
          >
            {properties.map((p) => (
              <option key={p.locationId} value={p.locationId}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>
        </div>

        {/* CRM Integration Button */}
        <button
          type="button"
          onClick={onOpenCrmInfo}
          className="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>CRM Architecture</span>
        </button>

        {/* User profile avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          AG
        </div>
      </div>
    </header>
  );
}
