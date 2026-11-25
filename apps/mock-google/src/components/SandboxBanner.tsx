"use client";

import React from "react";

export function SandboxBanner() {
  return (
    <div className="bg-amber-500 text-stone-900 px-4 py-2 text-xs sm:text-sm font-medium shadow-sm flex flex-wrap items-center justify-between gap-2 border-b border-amber-600 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center bg-stone-900 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider">
          SIMULATION
        </span>
        <span className="font-semibold">
          SANDBOX / SIMULATION — Mock Google Business Profile (Local Demo Only — Not Live Google)
        </span>
      </div>
      <div className="flex items-center gap-3 text-stone-800 text-[11px] font-mono">
        <span className="bg-amber-400/80 px-2 py-0.5 rounded border border-amber-600/30">
          Port: 3001
        </span>
        <span className="hidden md:inline bg-amber-400/80 px-2 py-0.5 rounded border border-amber-600/30">
          Brand: Aurum Grand Hospitality
        </span>
        <span className="hidden lg:inline bg-amber-400/80 px-2 py-0.5 rounded border border-amber-600/30">
          CRM Target: localhost:4000
        </span>
      </div>
    </div>
  );
}
