import { initSchema } from '../db/schema';
import { getDb } from '../db/connection';
import { claimNextJob, completeJob, failJob } from '../queue/jobQueue';
import { processSingleJob } from './processor';

export async function drainQueueOnce(): Promise<{
  completed: number;
  failed: number;
}> {
  initSchema();
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('worker_last_heartbeat', ?, ?)`
  ).run(now, now);

  let completed = 0;
  let failed = 0;
  while (true) {
    const job = claimNextJob('worker_once');
    if (!job) break;
    try {
      await processSingleJob(job);
      completeJob(job.id);
      completed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failJob(job.id, msg);
      failed++;
    }
  }
  return { completed, failed };
}

if (require.main === module) {
  drainQueueOnce()
    .then((res) => {
      console.log(`[worker:once] Drained queue -> completed=${res.completed}, failed=${res.failed}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[worker:once] Error:', err);
      process.exit(1);
    });
}
