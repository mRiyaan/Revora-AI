'use client';

import React, { useState } from 'react';
import { DEMO_ROLES, DemoRole, PROPERTIES, PropertyId } from '@revora/shared';
import { ExternalLink, KeyRound, Sparkles, X } from 'lucide-react';

export type CleanTab = 'inbox' | 'escalations' | 'policies';

interface MinimalTopBarProps {
  activeTab: CleanTab;
  onTabChange: (tab: CleanTab) => void;
  openEscalationsCount: number;
  activeRole: DemoRole;
  onRoleChange: (role: DemoRole) => void;
  selectedProperty: PropertyId | 'ALL';
  onPropertyChange: (prop: PropertyId | 'ALL') => void;
  geminiConnected: boolean;
  geminiModel: string;
  sessionApiKey: string;
  onSaveApiKey: (key: string) => Promise<{ ok: boolean; error?: string }>;
}

export function MinimalTopBar({
  activeTab,
  onTabChange,
  openEscalationsCount,
  activeRole,
  onRoleChange,
  selectedProperty,
  onPropertyChange,
  geminiConnected,
  geminiModel,
  sessionApiKey,
  onSaveApiKey,
}: MinimalTopBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(sessionApiKey);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    setTestError(null);
    const res = await onSaveApiKey(keyInput.trim());
    setTesting(false);
    if (res.ok) {
      setModalOpen(false);
    } else {
      setTestError(res.error || 'Could not validate Gemini key.');
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Brand + Sandbox Pill */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            RA
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Revora AI
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              SANDBOX
            </span>
            <span className="hidden items-center gap-1 text-[11px] text-emerald-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
        </div>

        {/* 3 Clean Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onTabChange('inbox')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'inbox'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inbox
          </button>
          <button
            type="button"
            onClick={() => onTabChange('escalations')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'escalations'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Escalations
            {openEscalationsCount > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                {openEscalationsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('policies')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeTab === 'policies'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SOP & Audit
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Property"
            value={selectedProperty}
            onChange={(e) => onPropertyChange(e.target.value as PropertyId | 'ALL')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="ALL">All Hotels</option>
            {PROPERTIES.map((p) => (
              <option key={p.propertyId} value={p.propertyId}>
                {p.city} ({p.propertyId})
              </option>
            ))}
          </select>

          <select
            aria-label="Simulated Role"
            value={activeRole}
            onChange={(e) => onRoleChange(e.target.value as DemoRole)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
          >
            {DEMO_ROLES.map((r) => (
              <option key={r} value={r}>
                Role: {r}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              geminiConnected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {geminiConnected ? 'Gemini Connected' : 'Connect Gemini'}
          </button>

          <a
            href="/portal"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
          >
            Guest Portal <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Gemini API Key Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <KeyRound className="h-4 w-4 text-indigo-600" />
                Connect Google Gemini API
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Model: <code className="rounded bg-slate-100 px-1">{geminiModel}</code>.
              Paste a Gemini API key below (saved in your browser session) or set{' '}
              <code className="rounded bg-slate-100 px-1">GEMINI_API_KEY</code> in{' '}
              <code className="rounded bg-slate-100 px-1">.env</code>.
            </p>
            <form onSubmit={handleConnect} className="mt-4 space-y-3">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIza..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-slate-900"
              />
              {testError && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {testError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testing}
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {testing ? 'Testing...' : 'Verify & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
