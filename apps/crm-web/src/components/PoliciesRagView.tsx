'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Database, Search } from 'lucide-react';
import { SOP_MANUALS, searchLocalSops } from '@/lib/mockDemoStore';

export function PoliciesRagView() {
  const [query, setQuery] = useState('confirmed rate 5000 billed 6200 refund');
  const [department, setDepartment] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  const results = useMemo(
    () => searchLocalSops(query, department, category),
    [query, department, category]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Interactive Qdrant RAG Search */}
      <div className="space-y-4 lg:col-span-7">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Database className="h-4 w-4 text-indigo-600" />
                Qdrant Semantic SOP RAG Playground
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Tests vector + metadata filtering across Aurum Grand Hospitality SOP manuals
                (Gemini Embeddings + Qdrant payloads).
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query SOPs (e.g. 'unverified refund', 'DND room entry', 'alien spaceship')..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="ALL">Department: ALL</option>
                <option value="Finance">Finance</option>
                <option value="Security">Security</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Support">Support</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="ALL">Category: ALL</option>
                <option value="billing">billing</option>
                <option value="safety">safety</option>
                <option value="cleanliness">cleanliness</option>
                <option value="general">general</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {results.length === 0 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900">
                Policy evidence unavailable: No SOP sections matched this query & metadata
                filter. Per Spec §4.4, Revora reports missing evidence rather than inventing a rule.
              </div>
            ) : (
              results.map((cit) => (
                <div
                  key={cit.chunkId}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-900">
                      {cit.policyCode} (v{cit.version}) — {cit.sectionRef}
                    </span>
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                      Match {(cit.score * 100).toFixed(0)}% • {cit.department}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                    {cit.excerpt}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Indexed SOP Manuals Catalog */}
      <div className="space-y-3 lg:col-span-5">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500">
          Indexed SOP Manuals ({SOP_MANUALS.length})
        </h2>
        {SOP_MANUALS.map((m) => (
          <div
            key={m.policyCode}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                {m.policyCode} • v{m.version}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {m.department} / {m.category}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-700">{m.docTitle}</p>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
              {m.sections.map((s) => (
                <li key={s.chunkId}>• {s.sectionRef}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
