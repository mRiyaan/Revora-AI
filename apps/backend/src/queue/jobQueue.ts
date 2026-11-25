import crypto from 'node:crypto';
import { ReviewJob } from '@revora/shared';
import { getDb } from '../db/connection';

function mapJobRow(row: Record<string, unknown>): ReviewJob {
  return {
    id: String(row.id),
    reviewId: String(row.review_id),
    jobType: String(row.job_type),
    idempotencyKey: String(row.idempotency_key),
    status: row.status as ReviewJob['status'],
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    nextRunAt: String(row.next_run_at),
    lockedBy: row.locked_by ? String(row.locked_by) : null,
    lockedAt: row.locked_at ? String(row.locked_at) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function enqueueReviewJob(
  reviewId: string,
  idempotencyKey: string,
  jobType = 'process_review'
): { enqueued: boolean; job: ReviewJob } {
  const db = getDb();
  const now = new Date().toISOString();
  const id = `job_${crypto.randomUUID().slice(0, 12)}`;

  const result = db
    .prepare(
      `INSERT OR IGNORE INTO review_jobs (
        id, review_id, job_type, idempotency_key, status, attempts, max_attempts,
        next_run_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'queued', 0, 3, ?, ?, ?)`
    )
    .run(id, reviewId, jobType, idempotencyKey, now, now, now);

  const row = db
    .prepare(`SELECT * FROM review_jobs WHERE idempotency_key = ?`)
    .get(idempotencyKey) as Record<string, unknown>;

  return {
    enqueued: result.changes > 0,
    job: mapJobRow(row),
  };
}

export function claimNextJob(workerId: string): ReviewJob | null {
  const db = getDb();

  const claimTx = db.transaction((): ReviewJob | null => {
    const now = new Date().toISOString();
    const row = db
      .prepare(
        `SELECT * FROM review_jobs
         WHERE status IN ('queued', 'retry') AND next_run_at <= ?
         ORDER BY created_at ASC
         LIMIT 1`
      )
      .get(now) as Record<string, unknown> | undefined;

    if (!row) return null;

    const updated = db
      .prepare(
        `UPDATE review_jobs
         SET status = 'processing',
             attempts = attempts + 1,
             locked_by = ?,
             locked_at = ?,
             updated_at = ?
         WHERE id = ? AND status IN ('queued', 'retry')`
      )
      .run(workerId, now, now, String(row.id));

    if (updated.changes === 0) return null;

    const claimed = db
      .prepare(`SELECT * FROM review_jobs WHERE id = ?`)
      .get(String(row.id)) as Record<string, unknown>;
    return mapJobRow(claimed);
  });

  return claimTx.immediate();
}

export function completeJob(jobId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE review_jobs
     SET status = 'completed', locked_by = NULL, locked_at = NULL, last_error = NULL, updated_at = ?
     WHERE id = ?`
  ).run(now, jobId);
}

export function failJob(jobId: string, errorMessage: string): ReviewJob {
  const db = getDb();
  const now = new Date();
  const existing = db
    .prepare(`SELECT * FROM review_jobs WHERE id = ?`)
    .get(jobId) as Record<string, unknown>;

  const attempts = Number(existing.attempts);
  const maxAttempts = Number(existing.max_attempts);
  const nextStatus = attempts < maxAttempts ? 'retry' : 'failed';
  const backoffSeconds = Math.pow(2, attempts) * 2;
  const nextRunAt = new Date(now.getTime() + backoffSeconds * 1000).toISOString();

  db.prepare(
    `UPDATE review_jobs
     SET status = ?, locked_by = NULL, locked_at = NULL, last_error = ?, next_run_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(nextStatus, errorMessage.slice(0, 1000), nextRunAt, now.toISOString(), jobId);

  const updated = db
    .prepare(`SELECT * FROM review_jobs WHERE id = ?`)
    .get(jobId) as Record<string, unknown>;
  return mapJobRow(updated);
}

export function requeueJob(jobId: string): ReviewJob | null {
  const db = getDb();
  const now = new Date().toISOString();
  const res = db
    .prepare(
      `UPDATE review_jobs
       SET status = 'queued', attempts = 0, locked_by = NULL, locked_at = NULL, last_error = NULL, next_run_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(now, now, jobId);

  if (res.changes === 0) return null;
  const row = db
    .prepare(`SELECT * FROM review_jobs WHERE id = ?`)
    .get(jobId) as Record<string, unknown>;
  return mapJobRow(row);
}

export function listJobs(limit = 100): ReviewJob[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM review_jobs ORDER BY updated_at DESC LIMIT ?`)
    .all(limit) as Record<string, unknown>[];
  return rows.map(mapJobRow);
}
