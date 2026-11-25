import cors from 'cors';
import express from 'express';
import { CONFIG } from './config';
import { initSchema } from './db/schema';
import { listAuditLogs } from './db/audit';
import { listJobs, requeueJob } from './queue/jobQueue';
import { extractDemoRole } from './middleware/rbac';
import { reviewsRouter } from './routes/reviews';
import { escalationsRouter } from './routes/escalations';
import { policiesRouter } from './routes/policies';
import { sandboxRouter } from './routes/sandbox';
import { webhooksRouter } from './routes/webhooks';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(extractDemoRole);

initSchema();

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'revora-backend',
    mode: CONFIG.appMode,
    port: CONFIG.port,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/reviews', reviewsRouter);
app.use('/api/escalations', escalationsRouter);
app.use('/api/policies', policiesRouter);
app.use('/api/sandbox', sandboxRouter);
app.use('/api/webhooks', webhooksRouter);

app.get('/api/jobs', (req, res) => {
  const limit = Number(req.query.limit || 100);
  res.json({ jobs: listJobs(limit) });
});

app.post('/api/jobs/:id/retry', (req, res) => {
  const job = requeueJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found.' });
    return;
  }
  res.json({ ok: true, job });
});

app.get('/api/audit', (req, res) => {
  const limit = Number(req.query.limit || 100);
  const entityId = typeof req.query.entityId === 'string' ? req.query.entityId : undefined;
  res.json({ auditLogs: listAuditLogs(limit, entityId) });
});

app.listen(CONFIG.port, () => {
  console.log(`[Revora Backend] Express API listening on http://localhost:${CONFIG.port}`);
});
