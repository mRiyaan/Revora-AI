'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AuditLogEntry,
  DemoRole,
  EscalationBriefing,
  PROPERTY_BY_ID,
  PlatformId,
  PropertyId,
  ReviewJob,
  SopCitation,
} from '@revora/shared';
import {
  ExternalLink,
  FolderUp,
  RefreshCw,
  RotateCcw,
  Search,
  Star,
  Upload,
} from 'lucide-react';
import { CrmSidebar, CrmView } from '@/components/CrmSidebar';
import { CaseDrawer } from '@/components/CaseDrawer';
import {
  BackendReviewItem,
  PolicyDocSummary,
  SandboxStateResponse,
  apiRequest,
  fetchDashboardBundle,
  searchPoliciesRag,
} from '@/lib/backendApi';

const VIEW_TITLES: Record<CrmView, string> = {
  dashboard: 'Executive Overview',
  inbox: 'Review Inbox',
  escalations: 'Escalation Queue',
  policies: 'SOP Knowledge (Qdrant RAG)',
  jobs: 'SQLite Job Queue',
  audit: 'Governance & Audit Trail',
};

const PLATFORM_BADGE: Record<PlatformId, { label: string; cls: string }> = {
  google: { label: 'Google', cls: 'bg-blue-50 text-blue-700' },
  booking: { label: 'Booking.com', cls: 'bg-indigo-50 text-indigo-700' },
  tripadvisor: { label: 'Tripadvisor', cls: 'bg-emerald-50 text-emerald-700' },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  escalated: { label: 'Escalated', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  held_for_review: {
    label: 'Needs Review',
    cls: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  auto_published: {
    label: 'Auto-Replied',
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  approved_published: {
    label: 'Published',
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  rejected: { label: 'Rejected', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  unanswered: { label: 'Open', cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  queued: { label: 'Queued', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
};

export default function RevoraConnectedCrmPage() {
  const [sandbox, setSandbox] = useState<SandboxStateResponse | null>(null);
  const [reviews, setReviews] = useState<BackendReviewItem[]>([]);
  const [escalations, setEscalations] = useState<EscalationBriefing[]>([]);
  const [policies, setPolicies] = useState<PolicyDocSummary[]>([]);
  const [jobs, setJobs] = useState<ReviewJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [activeView, setActiveView] = useState<CrmView>('dashboard');
  const [activeRole, setActiveRole] = useState<DemoRole>('Manager');
  const [selectedProperty, setSelectedProperty] = useState<PropertyId | 'ALL'>('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | PlatformId>('ALL');
  const [search, setSearch] = useState('');
  const [sopQuery, setSopQuery] = useState('');
  const [sopMatches, setSopMatches] = useState<SopCitation[]>([]);
  const [sopUnavailable, setSopUnavailable] = useState(false);

  const [drawerReviewId, setDrawerReviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);
  const folderUploadRef = useRef<HTMLInputElement | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const data = await fetchDashboardBundle(selectedProperty);
      setSandbox(data.sandbox);
      setReviews(data.reviews);
      setEscalations(data.escalations);
      setPolicies(data.policies);
      setJobs(data.jobs);
      setAuditLogs(data.auditLogs);
      setBackendError(null);
    } catch (err) {
      setBackendError(
        err instanceof Error
          ? `Backend (:4000) unreachable: ${err.message}`
          : 'Backend unreachable'
      );
    }
  }, [selectedProperty]);

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 1500);
    return () => clearInterval(timer);
  }, [loadAll]);

  useEffect(() => {
    const q = sopQuery.trim();
    if (!q) {
      setSopMatches([]);
      setSopUnavailable(false);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await searchPoliciesRag(q, 'ALL', 'ALL');
        setSopMatches(res.citations);
        setSopUnavailable(res.policyEvidenceUnavailable);
      } catch {
        // ignore transient search error
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [sopQuery]);

  async function execAction(fn: () => Promise<{ message?: string } | void>) {
    setBusy(true);
    setToast(null);
    try {
      const res = await fn();
      await loadAll();
      if (res && res.message) {
        setToast({ type: 'ok', text: res.message });
      }
    } catch (err) {
      setToast({
        type: 'err',
        text: err instanceof Error ? err.message : 'Action failed',
      });
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadSopFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const validFiles = Array.from(fileList).filter((f) =>
      /\.(md|txt)$/i.test(f.name)
    );
    if (validFiles.length === 0) {
      setToast({
        type: 'err',
        text: 'Select .md or .txt SOP files or a folder containing .md/.txt SOPs.',
      });
      return;
    }

    await execAction(async () => {
      const payloadFiles = await Promise.all(
        validFiles.map(async (file) => ({
          filename: file.name,
          content: await file.text(),
        }))
      );
      const res = await apiRequest<{
        filesSaved: string[];
        policiesCount: number;
        chunksCount: number;
      }>('/api/policies/upload', {
        method: 'POST',
        role: activeRole,
        body: { files: payloadFiles },
      });
      return {
        message: `Uploaded & indexed ${res.filesSaved.length} SOP file(s) — ${res.chunksCount} total sections indexed.`,
      };
    });
  }

  async function handleSaveApiKey(key: string) {
    try {
      const res = await apiRequest<{
        connected: boolean;
        model: string;
        error?: string;
      }>('/api/sandbox/gemini-key', {
        method: 'POST',
        role: activeRole,
        body: { apiKey: key },
      });
      await loadAll();
      if (res.connected) {
        setToast({ type: 'ok', text: `Backend connected live to ${res.model}` });
        return { ok: true };
      }
      return { ok: false, error: res.error };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to connect Gemini key',
      };
    }
  }

  const scopedReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (channelFilter !== 'ALL' && r.review.platform !== channelFilter) return false;
      if (activeView === 'escalations' && !r.escalationTicketId) return false;
      if (q) {
        const hay = `${r.review.reviewerName} ${r.review.reviewText} ${r.review.reservationId || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, channelFilter, activeView, search]);

  const openEscCount = useMemo(
    () => escalations.filter((e) => e.status === 'open').length,
    [escalations]
  );

  const queuedOrFailedCount = useMemo(
    () =>
      jobs.filter((j) => ['queued', 'retry', 'processing', 'failed'].includes(j.status))
        .length,
    [jobs]
  );

  const drawerItem = useMemo(
    () => reviews.find((r) => r.review.id === drawerReviewId) || null,
    [reviews, drawerReviewId]
  );

  const drawerEscalation = useMemo(() => {
    if (!drawerItem?.escalationTicketId) return null;
    return (
      escalations.find((e) => e.ticketId === drawerItem.escalationTicketId) || null
    );
  }, [escalations, drawerItem]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
    return (
      reviews.reduce((sum, r) => sum + r.review.rating, 0) / reviews.length
    ).toFixed(1);
  }, [reviews]);

  const repliedCount = reviews.filter(
    (r) =>
      r.review.responseStatus === 'auto_published' ||
      r.review.responseStatus === 'approved_published'
  ).length;

  const priorityCases = useMemo(
    () =>
      reviews.filter(
        (r) =>
          r.review.responseStatus === 'escalated' ||
          r.review.responseStatus === 'held_for_review'
      ),
    [reviews]
  );

  function renderReviewsTable(rows: BackendReviewItem[]) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Guest & Hotel</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review & AI Triage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No reviews match your current filters.
                  </td>
                </tr>
              ) : (
                rows.map((item) => {
                  const r = item.review;
                  const plat = PLATFORM_BADGE[r.platform];
                  const stat = STATUS_BADGE[r.responseStatus] || STATUS_BADGE.unanswered;
                  const propName = PROPERTY_BY_ID[r.propertyId]?.name || r.propertyId;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setDrawerReviewId(r.id!)}
                      className="cursor-pointer transition hover:bg-slate-50/90"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{r.reviewerName}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span>{propName}</span>
                          {r.reservationId && (
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700">
                              {r.reservationId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${plat.cls}`}
                        >
                          {plat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {r.rating}.0
                        </span>
                      </td>
                      <td className="max-w-md px-4 py-3.5">
                        <p className="line-clamp-1 font-medium text-slate-800">
                          {item.analysis?.summary || r.reviewText}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                          {r.reviewText}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${stat.cls}`}
                        >
                          {stat.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-[11px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <CrmSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        openEscalationsCount={openEscCount}
        inboxCount={reviews.length}
        queuedOrFailedJobsCount={queuedOrFailedCount}
        selectedProperty={selectedProperty}
        onPropertyChange={setSelectedProperty}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        geminiConnected={Boolean(sandbox?.geminiConnected)}
        geminiModel={sandbox?.geminiModel || 'gemini-2.5-flash'}
        vectorMode={sandbox?.vectorMode || 'local_qdrant_mirror'}
        onSaveApiKey={handleSaveApiKey}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-slate-900">
              {VIEW_TITLES[activeView]}
            </h1>
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              SQLite + Worker Live
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden w-64 sm:block">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guest or reservation ID..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                execAction(() =>
                  apiRequest('/api/sandbox/sync', { method: 'POST', role: activeRole }).then(
                    (r: unknown) => {
                      const res = r as { fetched: number; ingested: number };
                      return {
                        message: `Synced ${res.fetched} connector records (${res.ingested} new).`,
                      };
                    }
                  )
                )
              }
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              <RefreshCw className="h-3 w-3" /> Sync Platforms
            </button>

            <a
              href="/portal"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              Guest Review Portal <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </header>

        <main className="flex-1 p-6">
          {backendError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
              {backendError}
            </div>
          )}

          {toast && (
            <div
              className={`mb-5 flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs font-medium ${
                toast.type === 'err'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-[11px] underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeView === 'dashboard' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium text-slate-500">Total Reviews</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {reviews.length}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Stored in SQLite (`./storage/app.db`)
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium text-slate-500">Average Rating</p>
                  <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-slate-900">
                    {avgRating}
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Canonical 5-star scale
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium text-slate-500">Replies Published</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {repliedCount}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Auto-replied + Executive approved
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs font-medium text-slate-500">Open Escalations</p>
                  <p className="mt-2 text-2xl font-bold text-rose-600">{openEscCount}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    SOP-grounded executive review
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {(sandbox?.connectors || []).map((conn) => {
                  const list = reviews.filter((r) => r.review.platform === conn.platform);
                  const answered = list.filter(
                    (r) =>
                      r.review.responseStatus === 'auto_published' ||
                      r.review.responseStatus === 'approved_published'
                  ).length;
                  return (
                    <div
                      key={conn.platform}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {conn.displayName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {list.length} reviews • {answered} replied •{' '}
                          <span className="font-mono text-[10px]">
                            {conn.transportMode === 'live_mock_http'
                              ? `:${conn.port} HTTP`
                              : 'Loopback'}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setChannelFilter(conn.platform);
                          setActiveView('inbox');
                        }}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action Required ({priorityCases.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveView('inbox')}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    View full inbox →
                  </button>
                </div>
                {renderReviewsTable(priorityCases)}
              </div>
            </div>
          ) : activeView === 'inbox' || activeView === 'escalations' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {(['ALL', 'google', 'booking', 'tripadvisor'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannelFilter(ch)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        channelFilter === ch
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ch === 'ALL' ? 'All Channels' : PLATFORM_BADGE[ch].label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500">
                  Click any row to edit, delete draft, or approve
                </span>
              </div>

              {renderReviewsTable(scopedReviews)}
            </div>
          ) : activeView === 'policies' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={sopQuery}
                    onChange={(e) => setSopQuery(e.target.value)}
                    placeholder="Semantic Qdrant search (e.g. refund, DND, keycard)..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-slate-400"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileUploadRef}
                    type="file"
                    accept=".md,.txt"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleUploadSopFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={folderUploadRef}
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
                    className="hidden"
                    onChange={(e) => {
                      handleUploadSopFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileUploadRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload SOP File (Admin)
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => folderUploadRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <FolderUp className="h-3.5 w-3.5" />
                    Upload SOP Folder (Admin)
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      execAction(() =>
                        apiRequest('/api/policies/reindex', {
                          method: 'POST',
                          role: activeRole,
                        }).then(() => ({ message: 'Reindexed SOP manuals into vector store.' }))
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Reindex SOPs (Admin)
                  </button>
                </div>
              </div>

              {sopQuery.trim() && sopUnavailable ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
                  Policy evidence unavailable in Qdrant for this query — Revora will not
                  invent a rule.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(sopQuery.trim()
                    ? sopMatches.map((m) => ({
                        key: m.chunkId,
                        code: `${m.policyCode} — ${m.sectionRef}`,
                        dept: `${m.department} • ${(m.score * 100).toFixed(0)}%`,
                        meta: m.docTitle,
                        body: m.excerpt,
                      }))
                    : policies.map((m) => {
                        const previewRefs = m.chunks.slice(0, 6).map((c) => c.sectionRef);
                        const extra =
                          m.chunks.length > 6
                            ? ` • +${m.chunks.length - 6} more sections indexed`
                            : '';
                        return {
                          key: m.id,
                          code: `${m.policyCode} (v${m.version}) — ${m.docTitle}`,
                          dept: m.department,
                          meta: `~${m.estimatedPages || 1} pages • ${m.chunksCount ?? m.chunks.length} sections`,
                          body: `${previewRefs.join(' • ')}${extra}`,
                        };
                      })
                  ).map((card) => (
                    <div
                      key={card.key}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{card.code}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-indigo-600">
                            {card.meta}
                          </p>
                        </div>
                        <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {card.dept}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {card.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeView === 'jobs' ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Job ID</th>
                    <th className="px-4 py-3">Idempotency Key</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Attempts</th>
                    <th className="px-4 py-3">Error</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.slice(0, 40).map((j) => (
                    <tr key={j.id}>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                        {j.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {j.idempotencyKey}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            j.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : j.status === 'failed'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {j.attempts}/{j.maxAttempts}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-[11px] text-rose-700">
                        {j.lastError || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {j.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() =>
                              execAction(() =>
                                apiRequest(`/api/jobs/${j.id}/retry`, {
                                  method: 'POST',
                                  role: activeRole,
                                }).then(() => ({ message: `Retried job ${j.id}.` }))
                              )
                            }
                            className="rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Routine Auto-Publish Gate
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Admin role required to change
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      execAction(() =>
                        apiRequest('/api/sandbox/settings', {
                          method: 'PATCH',
                          role: activeRole,
                          body: {
                            autoPublishRoutine: !sandbox?.autoPublishRoutine,
                          },
                        }).then(() => ({
                          message: `Auto-Publish set to ${!sandbox?.autoPublishRoutine ? 'ON' : 'OFF'}.`,
                        }))
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      sandbox?.autoPublishRoutine ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        sandbox?.autoPublishRoutine ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    execAction(() =>
                      apiRequest('/api/sandbox/reset', {
                        method: 'POST',
                        role: activeRole,
                      }).then(() => ({
                        message: 'Reset SQLite database & SOP vectors cleanly.',
                      }))
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Demo Data (Admin)
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((a) => (
                      <tr key={a.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                          {new Date(a.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {a.actorRole}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                          {a.action}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {a.entityType}:{a.entityId}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              a.outcome === 'blocked'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {a.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <CaseDrawer
        item={drawerItem}
        escalation={drawerEscalation}
        auditLogs={auditLogs}
        activeRole={activeRole}
        busy={busy}
        onClose={() => setDrawerReviewId(null)}
        onToggleEvidence={(ticketId, itemId) =>
          execAction(() =>
            apiRequest(`/api/escalations/${ticketId}/evidence`, {
              method: 'PATCH',
              role: activeRole,
              body: { itemId },
            })
          )
        }
        onSaveEscalationDraft={(ticketId, draftText) =>
          execAction(() =>
            apiRequest(`/api/escalations/${ticketId}/draft`, {
              method: 'PATCH',
              role: activeRole,
              body: { draftText },
            }).then(() => ({ message: 'Escalation draft saved.' }))
          )
        }
        onDeleteEscalationDraft={(ticketId) =>
          execAction(() =>
            apiRequest(`/api/escalations/${ticketId}/draft`, {
              method: 'DELETE',
              role: activeRole,
            }).then(() => ({ message: 'Escalation draft deleted/cleared.' }))
          )
        }
        onApproveEscalation={(ticketId, draftText) =>
          execAction(() =>
            apiRequest<{ message?: string }>(
              `/api/escalations/${ticketId}/approve`,
              {
                method: 'POST',
                role: activeRole,
                body: { draftText },
              }
            )
          )
        }
        onRejectEscalation={(ticketId) =>
          execAction(() =>
            apiRequest<{ message?: string }>(
              `/api/escalations/${ticketId}/reject`,
              {
                method: 'POST',
                role: activeRole,
              }
            )
          )
        }
        onSaveRoutineDraft={(reviewId, draftText) =>
          execAction(() =>
            apiRequest(`/api/reviews/${reviewId}/draft`, {
              method: 'PATCH',
              role: activeRole,
              body: { draftText },
            }).then(() => ({ message: 'Draft saved.' }))
          )
        }
        onDeleteRoutineDraft={(reviewId) =>
          execAction(() =>
            apiRequest(`/api/reviews/${reviewId}/draft`, {
              method: 'DELETE',
              role: activeRole,
            }).then(() => ({ message: 'Draft deleted/cleared.' }))
          )
        }
        onApproveRoutine={(reviewId, draftText) =>
          execAction(() =>
            apiRequest<{ message?: string }>(
              `/api/reviews/${reviewId}/approve-routine`,
              {
                method: 'POST',
                role: activeRole,
                body: { draftText },
              }
            )
          )
        }
        onRejectRoutine={(reviewId) =>
          execAction(() =>
            apiRequest<{ message?: string }>(
              `/api/reviews/${reviewId}/reject-routine`,
              {
                method: 'POST',
                role: activeRole,
              }
            )
          )
        }
      />
    </div>
  );
}
