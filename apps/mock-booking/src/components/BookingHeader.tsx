"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  Calendar,
  Car,
  ChevronDown,
  HelpCircle,
  Plane,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { PROPERTIES, VALID_PROPERTY_IDS } from "@/lib/properties";
import { PropertyId, PropertyInfo } from "@/lib/types";

interface BookingHeaderProps {
  property: PropertyInfo;
  selectedPropertyId: PropertyId;
  onSelectProperty: (id: PropertyId) => void;
  totalReviewCount: number;
  activeTab: string;
  onTabClick: (tab: string) => void;
}

export default function BookingHeader({
  property,
  selectedPropertyId,
  onSelectProperty,
  totalReviewCount,
  activeTab,
  onTabClick,
}: BookingHeaderProps) {
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [occupancyOpen, setOccupancyOpen] = useState(false);
  const [destination, setDestination] = useState(property.city);

  React.useEffect(() => {
    setDestination(property.city);
  }, [property.city]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "info-prices", label: "Info & prices" },
    { id: "facilities", label: "Facilities" },
    { id: "house-rules", label: "House rules" },
    { id: "legal", label: "Important and legal info" },
    { id: "guest-reviews", label: `Guest reviews (${totalReviewCount})` },
  ];

  return (
    <>
      {/* Mandatory Persistent Top Sandbox Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#b91c1c] via-[#d97706] to-[#b91c1c] px-4 py-1.5 text-center text-xs font-bold tracking-wide text-white shadow-md">
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          SANDBOX / SIMULATION — Mock Booking.com Guest Reviews (Local Demo Only — Not Live Booking.com)
        </span>
      </div>

      {/* Deep Navy Booking.com Header */}
      <header className="bg-[#003b95] text-white">
        <div className="mx-auto max-w-[1140px] px-4 pt-3 pb-10">
          {/* Top Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <a
                href="#overview"
                className="text-2xl font-bold tracking-tight text-white"
              >
                Booking.com
              </a>

              {/* Multi-Property Switcher */}
              <div className="relative flex items-center gap-2 rounded-md border border-white/25 bg-[#002a6b] px-2.5 py-1 text-xs">
                <span className="hidden text-blue-200 sm:inline">
                  Aurum Grand Property:
                </span>
                <select
                  aria-label="Switch Aurum Grand Property"
                  value={selectedPropertyId}
                  onChange={(e) =>
                    onSelectProperty(e.target.value as PropertyId)
                  }
                  className="cursor-pointer bg-transparent font-semibold text-white outline-none"
                >
                  {VALID_PROPERTY_IDS.map((pid) => {
                    const p = PROPERTIES[pid];
                    return (
                      <option
                        key={pid}
                        value={pid}
                        className="bg-[#003580] text-white"
                      >
                        {p.name} ({pid})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="rounded px-2.5 py-1.5 hover:bg-white/10 cursor-pointer">
                INR
              </span>
              <span
                title="India"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-base cursor-pointer hover:bg-white/20"
              >
                🇮🇳
              </span>
              <button
                type="button"
                aria-label="Help"
                className="rounded-full p-1.5 hover:bg-white/10"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <span className="hidden cursor-pointer rounded px-3 py-1.5 hover:bg-white/10 md:inline">
                List your property
              </span>
              <button
                type="button"
                className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-[#006ce4] hover:bg-blue-50"
              >
                Register
              </button>
              <button
                type="button"
                className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-[#006ce4] hover:bg-blue-50"
              >
                Sign in
              </button>
            </div>
          </div>

          {/* Service Pills */}
          <nav className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white bg-white/15 px-4 py-2 font-medium"
            >
              <BedDouble className="h-4 w-4" />
              Stays
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium hover:bg-white/10"
            >
              <Plane className="h-4 w-4" />
              Flights
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4" />
              Flight + Hotel
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium hover:bg-white/10"
            >
              <Car className="h-4 w-4" />
              Car rental
            </button>
            <button
              type="button"
              className="hidden items-center gap-2 rounded-full px-4 py-2 font-medium hover:bg-white/10 sm:inline-flex"
            >
              Attractions
            </button>
            <button
              type="button"
              className="hidden items-center gap-2 rounded-full px-4 py-2 font-medium hover:bg-white/10 sm:inline-flex"
            >
              Airport taxis
            </button>
          </nav>
        </div>
      </header>

      {/* Overlapping Yellow-Bordered Search Strip */}
      <div className="mx-auto -mt-7 max-w-[1140px] px-4">
        <div className="grid grid-cols-1 gap-1 rounded-lg bg-[#ffb700] p-1 shadow-md md:grid-cols-[1.4fr_1.1fr_1.2fr_auto]">
          {/* Destination */}
          <div className="flex items-center justify-between rounded bg-white px-3 py-2">
            <div className="flex items-center gap-2.5 w-full">
              <BedDouble className="h-5 w-5 shrink-0 text-[#595959]" />
              <div className="w-full">
                <div className="text-[11px] font-medium text-[#595959]">
                  Enter destination
                </div>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-sm font-semibold text-[#1a1a1a] outline-none"
                />
              </div>
            </div>
            {destination && (
              <button
                type="button"
                onClick={() => setDestination("")}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Clear destination"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2.5 rounded bg-white px-3 py-2">
            <Calendar className="h-5 w-5 shrink-0 text-[#595959]" />
            <div>
              <div className="text-[11px] font-medium text-[#595959]">
                Select dates
              </div>
              <div className="text-sm font-semibold text-[#1a1a1a]">
                Fri, Nov 27 — Sat, Nov 28
              </div>
            </div>
          </div>

          {/* Occupancy */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOccupancyOpen((o) => !o)}
              className="flex h-full w-full items-center justify-between rounded bg-white px-3 py-2 text-left"
            >
              <div className="flex items-center gap-2.5">
                <User className="h-5 w-5 shrink-0 text-[#595959]" />
                <div>
                  <div className="text-[11px] font-medium text-[#595959]">
                    Select occupancy
                  </div>
                  <div className="text-sm font-semibold text-[#1a1a1a]">
                    {adults} adults · {children} children · {rooms} room
                    {rooms > 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-[#595959]" />
            </button>

            {occupancyOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border border-[#e7e7e7] bg-white p-4 shadow-xl">
                {[
                  {
                    label: "Adults",
                    value: adults,
                    min: 1,
                    setter: setAdults,
                  },
                  {
                    label: "Children",
                    value: children,
                    min: 0,
                    setter: setChildren,
                  },
                  { label: "Rooms", value: rooms, min: 1, setter: setRooms },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm font-medium text-[#1a1a1a]">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-3 rounded border border-[#868686] px-2 py-1">
                      <button
                        type="button"
                        onClick={() =>
                          item.setter(Math.max(item.min, item.value - 1))
                        }
                        className="px-1.5 text-base font-bold text-[#006ce4] disabled:text-gray-300"
                        disabled={item.value <= item.min}
                      >
                        -
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">
                        {item.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => item.setter(item.value + 1)}
                        className="px-1.5 text-base font-bold text-[#006ce4]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOccupancyOpen(false)}
                  className="mt-2 w-full rounded border border-[#006ce4] py-1.5 text-sm font-semibold text-[#006ce4] hover:bg-blue-50"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="button"
            onClick={() => onTabClick("info-prices")}
            className="flex items-center justify-center gap-2 rounded bg-[#006ce4] px-7 py-3 text-base font-semibold text-white hover:bg-[#0057b8]"
          >
            <Search className="h-4 w-4 md:hidden" />
            Search
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#595959]">
          <span className="text-[#006ce4] hover:underline cursor-pointer">
            Home
          </span>
          <span>&gt;</span>
          <span className="text-[#006ce4] hover:underline cursor-pointer">
            Hotels
          </span>
          <span>&gt;</span>
          <span className="text-[#006ce4] hover:underline cursor-pointer">
            {property.country}
          </span>
          <span>&gt;</span>
          <span className="text-[#006ce4] hover:underline cursor-pointer">
            {property.state}
          </span>
          <span>&gt;</span>
          <span className="text-[#006ce4] hover:underline cursor-pointer">
            {property.breadcrumbCity}
          </span>
          <span>&gt;</span>
          <span className="font-medium text-[#1a1a1a]">
            {property.name} (Hotel) ({property.country}) Deals
          </span>
        </div>

        {/* Sticky Property Tab Bar */}
        <div className="mt-3 flex overflow-x-auto border-b border-[#e7e7e7] bg-white">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                onClick={() => onTabClick(tab.id)}
                className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#006ce4] text-[#006ce4]"
                    : "border-transparent text-[#1a1a1a] hover:bg-[#f5f5f5]"
                }`}
              >
                {tab.label}
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}

