import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  CanonicalReview,
  CapabilityNotSupportedError,
  PlatformId,
  PropertyId,
  checkAdminPermission,
} from '@revora/shared';
import { CONFIG } from '../config';
import { getDb } from '../db/connection';
import { recordAuditLog } from '../db/audit';
import { seedDatabase } from '../db/seed';
import { ingestCanonicalReview } from '../services/ingestService';
import { getAllConnectors, getConnectorHealthSummary } from '../connectors/connectorRegistry';
import { getVectorModeStatus } from '../rag/sopRag';
import { getAutoPublishSetting } from '../worker/processor';

export const sandboxRouter = Router();

function getEffectiveGeminiKey(): string {
  if (CONFIG.geminiApiKey) return CONFIG.geminiApiKey;
  const db = getDb();
  const row = db
    .prepare(`SELECT value FROM app_settings WHERE key = 'runtime_gemini_api_key'`)
    .get() as { value: string } | undefined;
  return row?.value?.trim() || '';
}

sandboxRouter.get('/state', async (_req, res) => {
  const db = getDb();
  const hbRow = db
    .prepare(`SELECT value FROM app_settings WHERE key = 'worker_last_heartbeat'`)
    .get() as { value: string } | undefined;

  const counts = {
    totalReviews: (db.prepare(`SELECT COUNT(*) AS c FROM reviews`).get() as { c: number }).c,
    openEscalations: (
      db
        .prepare(`SELECT COUNT(*) AS c FROM escalation_tickets WHERE status = 'open'`)
        .get() as { c: number }
    ).c,
    queuedJobs: (
      db
        .prepare(`SELECT COUNT(*) AS c FROM review_jobs WHERE status IN ('queued','retry','processing')`)
        .get() as { c: number }
    ).c,
    failedJobs: (
      db.prepare(`SELECT COUNT(*) AS c FROM review_jobs WHERE status = 'failed'`).get() as {
        c: number;
      }
    ).c,
  };

  const [connectors, vectorMode] = await Promise.all([
    getConnectorHealthSummary(),
    getVectorModeStatus(),
  ]);

  const effectiveKey = getEffectiveGeminiKey();

  res.json({
    appMode: 'sandbox',
    autoPublishRoutine: getAutoPublishSetting(),
    connectorMode: CONFIG.connectorMode,
    geminiConnected: Boolean(effectiveKey),
    aiMode: effectiveKey ? 'gemini_live' : 'local_fallback',
    geminiModel: CONFIG.geminiModel,
    vectorMode,
    workerLastHeartbeat: hbRow?.value || null,
    connectors,
    counts,
  });
});

sandboxRouter.post('/inject', (req, res) => {
  const body = req.body as Partial<CanonicalReview>;
  const platform: PlatformId =
    body.platform && ['google', 'booking', 'tripadvisor'].includes(body.platform)
      ? body.platform
      : 'google';
  const propertyId: PropertyId =
    body.propertyId && ['HOTEL001', 'HOTEL002', 'HOTEL003'].includes(body.propertyId)
      ? body.propertyId
      : 'HOTEL001';
  const reviewText = (body.reviewText || '').trim();
  if (!reviewText) {
    res.status(400).json({ error: 'reviewText is required.' });
    return;
  }

  const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating || 5))));
  const now = new Date().toISOString();
  const suffix = String(Date.now()).slice(-6);
  const externalReviewId = (body.externalReviewId || `${platform}_live_${suffix}`).trim();

  const canonical: CanonicalReview = {
    platform,
    externalReviewId,
    propertyId,
    reviewerName: (body.reviewerName || 'Guest Traveler').trim(),
    rating,
    originalRatingText:
      body.originalRatingText ||
      (platform === 'booking'
        ? `${(rating * 2).toFixed(1)}/10`
        : platform === 'tripadvisor'
          ? `${rating}/5 bubbles`
          : ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][rating - 1]),
    reviewTitle: body.reviewTitle?.trim(),
    reviewText,
    reservationId: body.reservationId?.trim(),
    travelerType: body.travelerType?.trim(),
    createdAt: body.createdAt || now,
    responseStatus: 'queued',
  };

  const result = ingestCanonicalReview(canonical, 'sandbox_portal_inject');
  res.status(result.deduplicated ? 200 : 201).json(result);
});

sandboxRouter.post('/sync', async (req, res) => {
  const connectors = getAllConnectors();
  let fetched = 0;
  let ingested = 0;
  let deduplicated = 0;

  for (const conn of connectors) {
    const items = await conn.fetchReviews();
    fetched += items.length;
    for (const item of items) {
      const r = ingestCanonicalReview(item, `sync_${conn.platform}`);
      if (r.deduplicated) deduplicated++;
      else ingested++;
    }
  }

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'SANDBOX_PLATFORMS_SYNCED',
    entityType: 'connector',
    entityId: 'all',
    outcome: 'success',
    metadata: { fetched, ingested, deduplicated },
  });

  res.json({ ok: true, fetched, ingested, deduplicated });
});

sandboxRouter.patch('/settings', (req, res) => {
  const perm = checkAdminPermission(req.demoRole);
  if (!perm.allowed) {
    recordAuditLog({
      actorRole: req.demoRole,
      actorName: req.actorName,
      action: 'SETTINGS_UPDATE_DENIED',
      entityType: 'settings',
      entityId: 'auto_publish_routine',
      outcome: 'blocked',
    });
    res.status(403).json({ error: perm.reason });
    return;
  }

  const nextVal = Boolean(req.body?.autoPublishRoutine);
  const prevVal = getAutoPublishSetting();
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('auto_publish_routine', ?, ?)`
  ).run(String(nextVal), now);

  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'TOGGLE_AUTO_PUBLISH_GATE',
    entityType: 'settings',
    entityId: 'auto_publish_routine',
    previousState: String(prevVal),
    newState: String(nextVal),
    outcome: 'success',
  });

  res.json({ ok: true, autoPublishRoutine: nextVal });
});

sandboxRouter.post('/reset', async (req, res) => {
  const perm = checkAdminPermission(req.demoRole);
  if (!perm.allowed) {
    res.status(403).json({ error: perm.reason });
    return;
  }

  const summary = await seedDatabase(true);
  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'SANDBOX_DEMO_RESET',
    entityType: 'system',
    entityId: 'seed',
    outcome: 'success',
    metadata: summary,
  });

  res.json({ ok: true, message: 'SQLite & SOP vectors reset cleanly.', summary });
});

sandboxRouter.post('/gemini-key', async (req, res) => {
  const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';
  if (!apiKey) {
    const db = getDb();
    db.prepare(`DELETE FROM app_settings WHERE key = 'runtime_gemini_api_key'`).run();
    res.json({ connected: false, model: CONFIG.geminiModel, error: 'Cleared runtime Gemini key.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({
      model: CONFIG.geminiModel,
      contents: 'Reply with JSON {"ok":true}',
      config: { responseMimeType: 'application/json', maxOutputTokens: 20 },
    });

    const db = getDb();
    db.prepare(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('runtime_gemini_api_key', ?, ?)`
    ).run(apiKey, new Date().toISOString());

    recordAuditLog({
      actorRole: req.demoRole,
      actorName: req.actorName,
      action: 'GEMINI_API_CONNECTED',
      entityType: 'settings',
      entityId: CONFIG.geminiModel,
      outcome: 'success',
    });

    res.json({ connected: true, model: CONFIG.geminiModel });
  } catch (err) {
    res.status(400).json({
      connected: false,
      model: CONFIG.geminiModel,
      error: err instanceof Error ? err.message : 'Gemini verification failed',
    });
  }
});

sandboxRouter.get('/capabilities', async (_req, res) => {
  const results = [];
  for (const conn of getAllConnectors()) {
    let webhookCheck: Record<string, unknown>;
    try {
      await conn.verifyWebhook({ headers: {}, body: {} });
      webhookCheck = { supported: true };
    } catch (err) {
      if (err instanceof CapabilityNotSupportedError) {
        webhookCheck = {
          supported: false,
          code: err.code,
          operation: err.operation,
          message: err.message,
        };
      } else {
        webhookCheck = {
          supported: true,
          note: 'Requires valid webhook signature/payload',
        };
      }
    }
    results.push({
      platform: conn.platform,
      capabilities: conn.capabilities,
      webhookCheck,
    });
  }
  res.json({ connectors: results });
});
