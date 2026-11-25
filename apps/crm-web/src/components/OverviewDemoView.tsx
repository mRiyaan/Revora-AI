'use client';

import React from 'react';
import { DemoRole, ROLE_PERMISSIONS } from '@revora/shared';
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  ClipboardCheck,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DemoPreset, DemoStoreState } from '@/lib/mockDemoStore';

interface OverviewDemoViewProps {
  state: DemoStoreState;
  activeRole: DemoRole;
  onInjectPreset: (preset: DemoPreset) => void;
  onToggleAutoPublish: () => void;
  onResetDemo: () => void;
  onNavigateTab: (tab: 'inbox' | 'escalations' | 'policies' | 'jobs' | 'audit') => void;
}

export function OverviewDemoView({
  state,
  activeRole,
  onInjectPreset,
  onToggleAutoPublish,
  onResetDemo,
  onNavigateTab,
}: OverviewDemoViewProps) {
  const totalReviews = state.reviews.length;
  const autoPublished = state.reviews.filter(
    (r) => r.review.responseStatus === 'auto_published'
  ).length;
  const heldCount = state.reviews.filter(
    (r) => r.review.responseStatus === 'held_for_review'
  ).length;
  const openEscalations = state.escalations.filter((e) => e.status === 'open').length;
  const failedJobs = state.jobs.filter((j) => j.status === 'failed').length;
  const roleInfo = ROLE_PERMISSIONS[activeRole];

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Ingested Reviews</span>
            <Activity className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalReviews}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Across 3 platforms & 3 Aurum properties
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-700">
            <span>Path 1: Auto-Published</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{autoPublished}</p>
          <p className="mt-1 text-[11px] text-emerald-700">
            Routine praise passing deterministic gates
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-amber-800">
            <span>Held for Review</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{heldCount}</p>
          <p className="mt-1 text-[11px] text-amber-700">
            Mixed feedback or auto-gate disabled
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('escalations')}
          className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-left shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
        >
          <div className="flex items-center justify-between text-xs font-medium text-rose-700">
            <span>Path 2: Open Escalations</span>
            <AlertOctagon className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-900">{openEscalations}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-700">
            Billing, safety & policy cases <ArrowRight className="h-3 w-3" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('jobs')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Queue Exceptions</span>
            <ShieldAlert className="h-4 w-4 text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{failedJobs}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Visible retries & dead-letter monitor
          </p>
        </button>
      </div>

      {/* Live Two-Path Demo Launcher + Automation Gate */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Zap className="h-4 w-4 text-indigo-600" />
                Live Two-Path Demo Injector (Spec §7.2 Sequence)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Trigger simulated platform events to demonstrate Routine Automation vs. Executive
                SOP-Grounded Escalation.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onInjectPreset('praise_google')}
              className="group rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  PATH 1 • GOOGLE PUB/SUB
                </span>
                <Sparkles className="h-4 w-4 text-emerald-600 transition group-hover:scale-110" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Inject 5★ Routine Praise
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Normalizes GBP &ldquo;FIVE&rdquo; rating, runs Zod validation, and auto-publishes
                locally if the routine gate is ON.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onInjectPreset('billing_booking')}
              className="group rounded-xl border border-rose-200 bg-rose-50/40 p-4 text-left transition hover:border-rose-400 hover:bg-rose-50"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                  PATH 2 • BOOKING.COM DISPUTE
                </span>
                <AlertOctagon className="h-4 w-4 text-rose-600 transition group-hover:scale-110" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Inject ₹5,000 vs ₹6,200 Overcharge
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Blocks auto-reply, opens Finance Briefing, retrieves SOP-FIN-01 from Qdrant, and
                enforces zero unverified refund promises.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onInjectPreset('safety_tripadvisor')}
              className="group rounded-xl border border-orange-200 bg-orange-50/40 p-4 text-left transition hover:border-orange-400 hover:bg-orange-50"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-800">
                  PATH 2 • TRIPADVISOR SAFETY
                </span>
                <ShieldAlert className="h-4 w-4 text-orange-600 transition group-hover:scale-110" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Inject Room Lock & DND Breach
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Triggers critical Security escalation (SOP-SEC-01), RFID/CCTV checklist, and
                Manager-only executive sign-off.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onInjectPreset('prompt_injection')}
              className="group rounded-xl border border-purple-200 bg-purple-50/40 p-4 text-left transition hover:border-purple-400 hover:bg-purple-50"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800">
                  SECURITY • UNTRUSTED INPUT
                </span>
                <Lock className="h-4 w-4 text-purple-600 transition group-hover:scale-110" />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Inject Prompt-Injection Refund Attack
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Tests untrusted guest text trying to override system rules; deterministic engine
                flags and escalates safely.
              </p>
            </button>
          </div>
        </div>

        {/* Governance & Gate Controls */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Automation Gate & Role Authority
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Active Persona:{' '}
              <span className="font-semibold text-indigo-700">
                {activeRole} ({roleInfo.title})
              </span>
            </p>
            <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200">
              {roleInfo.description}
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    Routine Auto-Publish Gate
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Admin-only toggle (Spec §4.1 step 7)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleAutoPublish}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    state.autoPublishRoutine ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      state.autoPublishRoutine ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="mt-2 text-[11px] font-medium text-slate-600">
                Status:{' '}
                {state.autoPublishRoutine ? (
                  <span className="text-emerald-700">
                    ENABLED — Eligible 4–5★ praise auto-publishes locally
                  </span>
                ) : (
                  <span className="text-amber-700">
                    DISABLED — Routine replies held for human review
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Demo State
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('escalations')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <ClipboardCheck className="h-3.5 w-3.5" /> Open Briefing
            </button>
          </div>
        </div>
      </div>

      {/* 3-Platform Decoupled Sandbox Connectors */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Unified Platform Connectors (Decoupled Mock Ecosystem)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Each connector normalizes platform-specific payloads into Revora&apos;s canonical
              review schema and enforces declared API capabilities (Spec §5.3 & §7.3).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                Google Business Profile
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                :3001 • Teammate 1
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">
              Mimics <code className="rounded bg-slate-200 px-1">mybusiness.googleapis.com/v4</code>{' '}
              with <code className="rounded bg-slate-200 px-1">starRating</code> enums + Cloud
              Pub/Sub Base64 push webhooks.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                Read: Yes
              </span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                Reply: PUT
              </span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                Webhook: Pub/Sub
              </span>
            </div>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Mock Google UI <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                Booking.com Connectivity
              </span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                :3002 • Teammate 2
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">
              Mimics <code className="rounded bg-slate-200 px-1">supply-xml/review-api</code>{' '}
              (10-pt score, <code className="rounded bg-slate-200 px-1">reservation_id</code>,
              URL/PII moderation queue).
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                Read: Poll
              </span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                Reply: Moderated
              </span>
              <span className="rounded bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                Webhook: Unsupported
              </span>
            </div>
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Mock Booking.com UI <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Tripadvisor Terra</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                :3003 • Teammate 3
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">
              Mimics <code className="rounded bg-slate-200 px-1">terra.tripadvisor.com/api</code>{' '}
              with <code className="rounded bg-slate-200 px-1">/api/allowlist</code>,{' '}
              <code className="rounded bg-slate-200 px-1">author_connection</code>, and 409
              conflict guard.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                Read: Poll
              </span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                Reply: Owner Resp
              </span>
              <span className="rounded bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                Webhook: Unsupported
              </span>
            </div>
            <a
              href="http://localhost:3003"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Mock Tripadvisor UI <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
