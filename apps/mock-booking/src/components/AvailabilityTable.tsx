"use client";

import React, { useState } from "react";
import {
  BedDouble,
  Calendar,
  Check,
  Coffee,
  HelpCircle,
  Tag,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { PropertyInfo } from "@/lib/types";

interface AvailabilityTableProps {
  property: PropertyInfo;
}

export default function AvailabilityTable({ property }: AvailabilityTableProps) {
  const [filterRooms, setFilterRooms] = useState(false);
  const [filterSuites, setFilterSuites] = useState(false);
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [reserveModalOpen, setReserveModalOpen] = useState(false);

  const visibleRooms = property.rooms.filter((r) => {
    if (!filterRooms && !filterSuites) return true;
    if (filterRooms && r.category === "room") return true;
    if (filterSuites && r.category === "suite") return true;
    return false;
  });

  const totalRoomsSelected = Object.values(selectedQty).reduce(
    (s, q) => s + q,
    0
  );
  const baseSubtotal = property.rooms.reduce(
    (sum, r) => sum + (selectedQty[r.id] || 0) * r.priceInr,
    0
  );
  const gstAmount = Math.round(baseSubtotal * 0.18);
  const grandTotal = baseSubtotal + gstAmount;

  return (
    <section id="info-prices" className="mx-auto max-w-[1140px] px-4 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Availability</h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006ce4]">
          <Tag className="h-3.5 w-3.5" />
          We Price Match
        </span>
      </div>

      {/* Inline Yellow Availability Search Bar */}
      <div className="mt-3 grid grid-cols-1 gap-1 rounded bg-[#ffb700] p-1 md:grid-cols-[1fr_1.3fr_auto]">
        <div className="flex items-center gap-2.5 rounded bg-white px-3 py-2">
          <Calendar className="h-4 w-4 text-[#595959]" />
          <div>
            <div className="text-[11px] text-[#595959]">Select dates</div>
            <div className="text-sm font-semibold text-[#1a1a1a]">
              Fri, Nov 27 — Sat, Nov 28
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded bg-white px-3 py-2">
          <User className="h-4 w-4 text-[#595959]" />
          <div>
            <div className="text-[11px] text-[#595959]">Select occupancy</div>
            <div className="text-sm font-semibold text-[#1a1a1a]">
              2 adults · 0 children · 1 room
            </div>
          </div>
        </div>
        <button
          type="button"
          className="rounded bg-[#006ce4] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0057b8]"
        >
          Change search
        </button>
      </div>

      {/* Filter by Rooms / Suites */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="font-bold text-[#1a1a1a]">Filter by:</span>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filterRooms}
            onChange={(e) => setFilterRooms(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#006ce4]"
          />
          <span>Rooms</span>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filterSuites}
            onChange={(e) => setFilterSuites(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#006ce4]"
          />
          <span>Suites</span>
        </label>
      </div>

      {/* Room Table */}
      <div className="mt-3 overflow-x-auto rounded border border-[#4c76b2]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#4c76b2] text-xs font-bold text-white">
              <th className="border-r border-[#6b91c4] px-3 py-3 w-[28%]">
                Room type
              </th>
              <th className="border-r border-[#6b91c4] px-3 py-3 w-[12%]">
                Number of guests
              </th>
              <th className="border-r border-[#6b91c4] bg-[#003580] px-3 py-3 w-[18%]">
                Today&apos;s Price
              </th>
              <th className="border-r border-[#6b91c4] px-3 py-3 w-[22%]">
                Choose your meals &amp; policies
              </th>
              <th className="border-r border-[#6b91c4] px-3 py-3 w-[8%]">
                Select Rooms
              </th>
              <th className="px-3 py-3 w-[12%]"></th>
            </tr>
          </thead>
          <tbody>
            {visibleRooms.map((room, idx) => (
              <tr
                key={room.id}
                className="border-t border-[#e7e7e7] align-top bg-white"
              >
                <td className="border-r border-[#e7e7e7] p-3">
                  <div className="font-bold text-[#006ce4] underline cursor-pointer">
                    {room.name}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#1a1a1a]">
                    <BedDouble className="h-3.5 w-3.5 text-[#595959]" />
                    <span>{room.bedInfo}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {room.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-[11px] text-[#333333]"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="border-r border-[#e7e7e7] p-3">
                  <div className="flex items-center gap-0.5 text-[#1a1a1a]">
                    {Array.from({ length: room.maxGuests }).map((_, g) => (
                      <Users key={g} className="h-4 w-4" />
                    ))}
                  </div>
                </td>

                <td className="border-r border-[#e7e7e7] p-3">
                  <div className="text-base font-bold text-[#1a1a1a]">
                    ₹ {room.priceInr.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-0.5 text-xs text-[#595959]">
                    +₹ {room.taxesInr.toLocaleString("en-IN")} taxes and fees
                  </div>
                </td>

                <td className="border-r border-[#e7e7e7] p-3 text-xs space-y-2">
                  {room.breakfastIncluded && (
                    <div className="flex items-start justify-between gap-1 text-[#008234]">
                      <span className="inline-flex items-center gap-1.5">
                        <Coffee className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          <strong>Wonderful breakfast</strong> included
                        </span>
                      </span>
                      <HelpCircle className="h-3.5 w-3.5 shrink-0 text-[#006ce4]" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[#1a1a1a]">
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-[#595959]" />
                    <span className="font-semibold">Total cost to cancel</span>
                  </div>
                  {room.noPrepayment && (
                    <div className="flex items-start gap-1.5 text-[#008234]">
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        <strong>No prepayment needed</strong> – pay at the
                        property
                      </span>
                    </div>
                  )}
                </td>

                <td className="border-r border-[#e7e7e7] p-3">
                  <select
                    aria-label={`Select quantity for ${room.name}`}
                    value={selectedQty[room.id] || 0}
                    onChange={(e) =>
                      setSelectedQty((prev) => ({
                        ...prev,
                        [room.id]: Number(e.target.value),
                      }))
                    }
                    className="rounded border border-[#868686] bg-white px-2 py-1 text-sm font-medium outline-none"
                  >
                    {Array.from({ length: room.availableCount + 1 }).map(
                      (_, n) => (
                        <option key={n} value={n}>
                          {n}{" "}
                          {n > 0
                            ? `(₹ ${(n * room.priceInr).toLocaleString(
                                "en-IN"
                              )})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </td>

                {idx === 0 && (
                  <td
                    rowSpan={visibleRooms.length}
                    className="bg-[#f7faff] p-3 align-top"
                  >
                    {totalRoomsSelected > 0 && (
                      <div className="mb-3 rounded border border-[#dce8fa] bg-white p-2 text-xs">
                        <div className="font-bold text-[#1a1a1a]">
                          {totalRoomsSelected} room
                          {totalRoomsSelected > 1 ? "s" : ""} selected
                        </div>
                        <div className="mt-1 text-[#595959]">
                          Subtotal: ₹ {baseSubtotal.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[#595959]">
                          18% GST: ₹ {gstAmount.toLocaleString("en-IN")}
                        </div>
                        <div className="mt-1 border-t pt-1 font-bold text-[#003580]">
                          Total: ₹ {grandTotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setReserveModalOpen(true)}
                      className="w-full rounded bg-[#006ce4] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#0057b8]"
                    >
                      I&apos;ll reserve
                    </button>
                    <ul className="mt-2 list-disc pl-4 text-[11px] text-[#1a1a1a]">
                      <li>You won&apos;t be charged yet</li>
                    </ul>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reservation Confirmation Modal */}
      {reserveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#1a1a1a]">
                Reservation Summary (Sandbox)
              </h3>
              <button
                type="button"
                onClick={() => setReserveModalOpen(false)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#1a1a1a]">
              <p className="font-semibold">{property.name}</p>
              <p className="text-xs text-[#595959]">
                Fri, Nov 27 — Sat, Nov 28 · 1 night
              </p>
              {totalRoomsSelected === 0 ? (
                <p className="rounded bg-amber-50 p-3 text-xs text-amber-800">
                  No rooms selected yet. Choose at least 1 room in the
                  &ldquo;Select Rooms&rdquo; dropdown to calculate your INR
                  subtotal + 18% GST.
                </p>
              ) : (
                <div className="rounded border bg-[#f5f5f5] p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Rooms ({totalRoomsSelected})</span>
                    <span>₹ {baseSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>18% GST</span>
                    <span>₹ {gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-bold text-[#003580]">
                    <span>Estimated Total</span>
                    <span>₹ {grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReserveModalOpen(false)}
                className="rounded bg-[#006ce4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0057b8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

