"use client";

import React, { useState } from "react";
import {
  Ban,
  BedDouble,
  Car,
  Coffee,
  Dumbbell,
  Gift,
  HeartHandshake,
  MapPin,
  ParkingCircle,
  Plane,
  Sparkles,
  Utensils,
  Waves,
  Wifi,
  Wine,
} from "lucide-react";
import { PropertyInfo } from "@/lib/types";

interface HighlightsAndDescriptionProps {
  property: PropertyInfo;
}

export default function HighlightsAndDescription({
  property,
}: HighlightsAndDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  const highlights = [
    {
      icon: Coffee,
      title: "Superb breakfast",
      sub: "Continental, Italian, Full English/Irish, Asian",
    },
    {
      icon: Waves,
      title: "Outdoor swimming pool",
      sub: "Pool bar",
    },
    {
      icon: ParkingCircle,
      title: "Free private parking",
      sub: "Valet, Accessible",
    },
    {
      icon: Wifi,
      title: "Exceptional free WiFi",
      sub: "Rated 9.6 by guests",
    },
    {
      icon: Sparkles,
      title: "Wellness",
      sub: "Spa & wellness centre, Massage, Steam room, Fitness centre",
    },
  ];

  const facilities = [
    { icon: Waves, label: "Outdoor swimming pool" },
    { icon: Plane, label: "Airport shuttle" },
    { icon: Sparkles, label: "Spa & wellness centre" },
    { icon: HeartHandshake, label: "Room service" },
    { icon: Ban, label: "Non-smoking rooms" },
    { icon: Dumbbell, label: "Fitness centre" },
    { icon: Utensils, label: "5 restaurants" },
    { icon: Car, label: "Free parking" },
    { icon: Wine, label: "Bar" },
    { icon: Coffee, label: "Wonderful Breakfast", underlined: true },
  ];

  return (
    <section id="facilities" className="mx-auto max-w-[1140px] px-4 pt-6">
      {/* 5 Property Highlights */}
      <h2 className="text-base font-bold text-[#1a1a1a]">
        Property highlights
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((h) => {
          const Icon = h.icon;
          return (
            <div
              key={h.title}
              className="flex items-start gap-3 rounded-lg border border-[#e7e7e7] bg-white px-4 py-3"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1a1a1a]" />
              <div>
                <div className="text-sm font-bold text-[#1a1a1a]">
                  {h.title}
                </div>
                <div className="text-xs text-[#595959]">{h.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Genius / Brand Box */}
      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-xs leading-relaxed text-[#1a1a1a]">
          <span className="text-[#006ce4] underline cursor-pointer">
            Sign in
          </span>{" "}
          to unlock the members-only price for your selected dates at{" "}
          {property.name}
          <div className="mt-1 text-[#595959]">
            Genius discounts at this property are subject to booking dates, stay
            dates, and other available deals.
          </div>
        </div>
        <div className="shrink-0 rounded-lg border border-[#e7e7e7] bg-white px-4 py-2.5">
          <div className="text-xs text-[#595959]">Hotel chain/brand</div>
          <div className="text-sm font-bold text-[#1a1a1a]">
            Aurum Grand Hospitality
          </div>
        </div>
      </div>

      {/* Description + "Perfect for a 1-night stay!" Sidebar */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_290px]">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">
            Get the celebrity treatment with world-class service at{" "}
            {property.name}
          </h2>
          <p className="mt-2 text-sm text-[#1a1a1a]">{property.quoteHeader}</p>

          <div className="relative mt-4 space-y-3 text-sm leading-relaxed text-[#1a1a1a]">
            {(expanded
              ? property.descriptionParagraphs
              : property.descriptionParagraphs.slice(0, 3)
            ).map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
            {!expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 rounded border border-[#006ce4] px-3.5 py-1.5 text-sm font-semibold text-[#006ce4] hover:bg-blue-50"
          >
            {expanded ? "Show less" : "Show me more"}
          </button>

          {/* Most popular facilities */}
          <h3 className="mt-6 text-base font-bold text-[#1a1a1a]">
            Most popular facilities
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
            {facilities.map((fac) => {
              const Icon = fac.icon;
              return (
                <div
                  key={fac.label}
                  className="inline-flex items-center gap-2 text-sm text-[#1a1a1a]"
                >
                  <Icon className="h-4 w-4 text-[#008234]" />
                  <span
                    className={
                      fac.underlined ? "underline decoration-[#595959]" : ""
                    }
                  >
                    {fac.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Perfect for a 1-night stay! */}
        <aside className="h-fit rounded-lg bg-[#f0f6ff] p-4 border border-[#dce8fa]">
          <h3 className="text-sm font-bold text-[#1a1a1a]">
            Perfect for a 1-night stay!
          </h3>
          <div className="mt-3 space-y-3 text-xs text-[#1a1a1a]">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]" />
              <span>
                Top Location: Highly rated by recent guests (9.0)
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]" />
              <span>
                Want a great night&apos;s sleep? This hotel was highly-rated for
                its very comfy beds.
              </span>
            </div>

            <div>
              <div className="font-bold">Breakfast Info</div>
              <p className="mt-1 leading-relaxed text-[#333333]">
                Continental, Italian, Full English/Irish, Vegetarian, Vegan,
                Halal, Gluten-free, Kosher, Asian, American, Buffet, Breakfast
                to go
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <ParkingCircle className="h-4 w-4 shrink-0 text-[#1a1a1a]" />
              <span>Free private parking available at the hotel</span>
            </div>

            <div>
              <div className="font-bold">Loyal Customers</div>
              <p className="mt-1 text-[#333333]">
                There are more repeat guests here than most other properties.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Genius Card */}
      <div className="mt-6 flex items-center justify-between rounded-lg border border-[#e7e7e7] bg-white p-4">
        <div>
          <h3 className="text-base font-bold text-[#1a1a1a]">
            Unlock members-only prices
          </h3>
          <p className="mt-1 text-sm text-[#1a1a1a]">
            Save instantly at this Genius property – just sign in or join for
            free
          </p>
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              className="rounded border border-[#006ce4] px-3.5 py-1.5 text-sm font-semibold text-[#006ce4] hover:bg-blue-50"
            >
              Sign in
            </button>
            <button
              type="button"
              className="text-sm font-semibold text-[#006ce4] hover:underline"
            >
              Create a free account
            </button>
          </div>
        </div>
        <div className="hidden h-20 w-24 items-center justify-center rounded-lg bg-[#f0f6ff] text-[#006ce4] sm:flex">
          <Gift className="h-11 w-11 text-[#006ce4]" />
        </div>
      </div>
    </section>
  );
}

