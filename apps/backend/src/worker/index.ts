import crypto from 'node:crypto';
import { initSchema } from '../db/schema';
import { getDb } from '../db/connection';
import { claimNextJob, completeJob, failJob } from '../queue/jobQueue';
import { processSingleJob } from './processor';
import { getConnector } from '../connectors/connectorRegistry';
import { isBookingMockOnline } from '../connectors/bookingConnector';
import { isGoogleMockOnline } from '../connectors/googleConnector';
import { isTripadvisorMockOnline } from '../connectors/tripadvisorConnector';
import { ingestCanonicalReview } from '../services/ingestService';

const WORKER_ID = `worker_${process.pid}_${crypto.randomBytes(2).toString('hex')}`;
const POLL_MS = 1200;
let tickCounter = 0;

function updateHeartbeat() {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('worker_last_heartbeat', ?, ?)`
  ).run(now, now);
}

async function pollLiveConnectors() {
  const checks: Array<{
    platform: 'booking' | 'google' | 'tripadvisor';
    onlineFn: () => Promise<boolean>;
  }> = [
    { platform: 'booking', onlineFn: isBookingMockOnline },
    { platform: 'google', onlineFn: isGoogleMockOnline },
    { platform: 'tripadvisor', onlineFn: isTripadvisorMockOnline },
  ];

  for (const { platform, onlineFn } of checks) {
    try {
      const online = await onlineFn();
      if (!online) continue;
      const conn = getConnector(platform);
      const items = await conn.fetchReviews();
      for (const item of items) {
        const res = ingestCanonicalReview(item, `scheduled_poll_${platform}`);
        if (!res.deduplicated) {
          console.log(
            `[Worker ${WORKER_ID}] Auto-polled new ${platform} review ${item.externalReviewId} -> job ${res.jobId}`
          );
        }
      }
    } catch (err) {
      console.warn(
        `[Worker ${WORKER_ID}] Connector poll error (${platform}):`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

async function tick() {
  updateHeartbeat();
  tickCounter++;

  // Poll online mock review sites every 2 ticks (~2.4s) for live demo sync
  if (tickCounter === 1 || tickCounter % 2 === 0) {
    await pollLiveConnectors();
  }

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
  console.log(`[Worker ${WORKER_ID}] Started SQLite job queue + live connector polling every ${POLL_MS}ms`);
  await tick();
  setInterval(() => {
    tick().catch((e) => console.error('[Worker] Tick error:', e));
  }, POLL_MS);
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
