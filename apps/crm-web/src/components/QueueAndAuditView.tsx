'use client';

import React from 'react';
import { AuditLogEntry, ReviewJob } from '@revora/shared';
import { History, ListChecks, RefreshCw } from 'lucide-react';

export function JobsQueueView({
  jobs,
  onRetryJob,
}: {
  jobs: ReviewJob[];
  onRetryJob: (jobId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ListChecks className="h-4 w-4 text-indigo-600" />
            SQLite Async Job Queue (`review_jobs`)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Idempotent deduplication keys, atomic worker claims, retry counters, and visible
            error surfacing (Spec §12).
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-2.5 pr-3">Job ID</th>
              <th className="py-2.5 pr-3">Idempotency Key</th>
              <th className="py-2.5 pr-3">Status</th>
              <th className="py-2.5 pr-3">Attempts</th>
              <th className="py-2.5 pr-3">Last Error</th>
              <th className="py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-700">
                  {job.id}
                </td>
                <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-600">
                  {job.idempotencyKey}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      job.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : job.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-slate-600">
                  {job.attempts} / {job.maxAttempts}
                </td>
                <td className="max-w-xs truncate py-2.5 pr-3 text-[11px] text-rose-700">
                  {job.lastError || '—'}
                </td>
                <td className="py-2.5 text-right">
                  {job.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => onRetryJob(job.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                    >
                      <RefreshCw className="h-3 w-3" /> Retry Job
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AuditLogView({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="pb-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <History className="h-4 w-4 text-indigo-600" />
          Audit Trail (`audit_logs`)
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Chronological record of automated decisions, RBAC denials, evidence verifications, and
          local approvals.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-2.5 pr-3">Timestamp</th>
              <th className="py-2.5 pr-3">Actor Role</th>
              <th className="py-2.5 pr-3">Action</th>
              <th className="py-2.5 pr-3">Entity</th>
              <th className="py-2.5 pr-3">Transition</th>
              <th className="py-2.5">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap py-2.5 pr-3 text-[11px] text-slate-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
                <td className="py-2.5 pr-3 font-semibold text-slate-800">
                  {entry.actorRole}
                </td>
                <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-700">
                  {entry.action}
                </td>
                <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-600">
                  {entry.entityType}:{entry.entityId}
                </td>
                <td className="py-2.5 pr-3 text-[11px] text-slate-600">
                  {entry.previousState || '—'} → {entry.newState || '—'}
                </td>
                <td className="py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      entry.outcome === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {entry.outcome}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
