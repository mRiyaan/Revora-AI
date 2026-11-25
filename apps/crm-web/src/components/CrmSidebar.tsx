'use client';

import React, { useState } from 'react';
import {
  DEMO_ROLES,
  DemoRole,
  PROPERTIES,
  PropertyId,
  ROLE_PERMISSIONS,
} from '@revora/shared';
import {
  AlertOctagon,
  BookOpen,
  Building2,
  History,
  Inbox,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

export type CrmView =
  | 'dashboard'
  | 'inbox'
  | 'escalations'
  | 'policies'
  | 'jobs'
  | 'audit';

interface CrmSidebarProps {
  activeView: CrmView;
  onViewChange: (view: CrmView) => void;
  openEscalationsCount: number;
  inboxCount: number;
  queuedOrFailedJobsCount: number;
  selectedProperty: PropertyId | 'ALL';
  onPropertyChange: (prop: PropertyId | 'ALL') => void;
  activeRole: DemoRole;
  onRoleChange: (role: DemoRole) => void;
  geminiConnected: boolean;
  geminiModel: string;
  vectorMode: string;
  onSaveApiKey: (key: string) => Promise<{ ok: boolean; error?: string }>;
}

export function CrmSidebar({
  activeView,
  onViewChange,
  openEscalationsCount,
  inboxCount,
  queuedOrFailedJobsCount,
  selectedProperty,
  onPropertyChange,
  activeRole,
  onRoleChange,
  geminiConnected,
  geminiModel,
  vectorMode,
  onSaveApiKey,
}: CrmSidebarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
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
      setTestError(res.error || 'Could not verify Gemini API key.');
    }
  }

  const navGroups: {
    heading: string;
    items: { id: CrmView; label: string; icon: React.ReactNode; badge?: number }[];
  }[] = [
    {
      heading: 'Workspace',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          id: 'inbox',
          label: 'Review Inbox',
          icon: <Inbox className="h-4 w-4" />,
          badge: inboxCount,
        },
        {
          id: 'escalations',
          label: 'Escalations',
          icon: <AlertOctagon className="h-4 w-4" />,
          badge: openEscalationsCount,
        },
      ],
    },
    {
      heading: 'Governance & Engine',
      items: [
        {
          id: 'policies',
          label: 'SOP Knowledge',
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          id: 'jobs',
          label: 'Job Queue',
          icon: <ListChecks className="h-4 w-4" />,
          badge: queuedOrFailedJobsCount,
        },
        {
          id: 'audit',
          label: 'Audit Trail',
          icon: <History className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <>
      <aside className="flex w-full shrink-0 flex-col justify-between bg-slate-950 text-slate-200 lg:min-h-screen lg:w-64">
        <div>
          <div className="border-b border-slate-800/80 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-slate-950">
                  LP
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wide text-white">REVORA AI</p>
                  <p className="text-[10px] font-medium text-amber-400">
                    THE LEELA PALACE
                  </p>
                </div>
              </div>
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-500/30">
                SANDBOX
              </span>
            </div>

            <div className="mt-3.5">
              <label className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Building2 className="h-3 w-3" /> Property Scope
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => onPropertyChange(e.target.value as PropertyId | 'ALL')}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-amber-500"
              >
                <option value="ALL">All Leela Properties</option>
                {PROPERTIES.map((p) => (
                  <option key={p.propertyId} value={p.propertyId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <nav className="space-y-5 px-3 py-4">
            {navGroups.map((group) => (
              <div key={group.heading}>
                <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.heading}
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {group.items.map((item) => {
                    const active = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onViewChange(item.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                          active
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          {item.icon}
                          {item.label}
                        </span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              item.id === 'escalations'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="space-y-2.5 border-t border-slate-800/80 p-3">
          <div className="rounded-lg bg-slate-900/70 px-3 py-2 text-[10px] text-slate-400">
            <div className="flex items-center justify-between">
              <span>SQLite + Worker</span>
              <span className="font-semibold text-emerald-400">Connected</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>SOP Vector Store</span>
              <span className="font-semibold text-slate-300">
                {vectorMode === 'qdrant_live' ? 'Qdrant :6333' : 'Qdrant Mirror'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition ${
              geminiConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {geminiConnected ? 'Gemini Live' : 'Connect Gemini API'}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                geminiConnected ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
          </button>

          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <ShieldCheck className="h-3 w-3 text-amber-400" />
              Active CRM Role (RBAC)
            </div>
            <select
              aria-label="Active CRM Role"
              value={activeRole}
              onChange={(e) => onRoleChange(e.target.value as DemoRole)}
              className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-amber-500"
            >
              {DEMO_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r} — {ROLE_PERMISSIONS[r].title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <KeyRound className="h-4 w-4 text-indigo-600" />
                Connect Google Gemini API (Backend Engine)
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
              Model:{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">{geminiModel}</code>.
              Key is verified and persisted into the backend SQLite engine for both API &
              Worker processes.
            </p>
            <form onSubmit={handleConnect} className="mt-4 space-y-3">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIza... (leave empty to clear)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
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
                  {testing ? 'Verifying...' : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
