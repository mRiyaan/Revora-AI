import crypto from 'node:crypto';
import { initSchema } from '../db/schema';
import { getDb } from '../db/connection';
import { claimNextJob, completeJob, failJob } from '../queue/jobQueue';
import { processSingleJob } from './processor';

const WORKER_ID = `worker_${process.pid}_${crypto.randomBytes(2).toString('hex')}`;
const POLL_MS = 1200;

function updateHeartbeat() {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('worker_last_heartbeat', ?, ?)`
  ).run(now, now);
}

async function tick() {
  updateHeartbeat();
  let processed = 0;
  while (true) {
    const job = claimNextJob(WORKER_ID);
    if (!job) break;
    try {
      await processSingleJob(job);
      completeJob(job.id);
      processed++;
      console.log(`[Worker ${WORKER_ID}] Completed job ${job.id} (review ${job.reviewId})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const updated = failJob(job.id, msg);
      console.error(
        `[Worker ${WORKER_ID}] Failed job ${job.id} -> status=${updated.status} (attempt ${updated.attempts}/${updated.maxAttempts}): ${msg}`
      );
    }
  }
  return processed;
}

async function main() {
  initSchema();
  console.log(`[Worker ${WORKER_ID}] Started SQLite job queue polling every ${POLL_MS}ms`);
  // Initial immediate pass
  await tick();
  setInterval(() => {
    tick().catch((e) => console.error('[Worker] Tick error:', e));
  }, POLL_MS);
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
