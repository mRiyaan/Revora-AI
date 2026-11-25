import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { checkAdminPermission } from '@revora/shared';
import { CONFIG } from '../config';
import { getVectorModeStatus, indexAllSops, listPolicies, searchSops } from '../rag/sopRag';
import { recordAuditLog } from '../db/audit';

export const policiesRouter = Router();

policiesRouter.get('/', async (_req, res) => {
  const policies = listPolicies();
  const vectorMode = await getVectorModeStatus();
  res.json({ policies, vectorMode });
});

policiesRouter.post('/search', async (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  const category =
    typeof req.body?.category === 'string' && req.body.category !== 'ALL'
      ? req.body.category
      : undefined;
  const department =
    typeof req.body?.department === 'string' && req.body.department !== 'ALL'
      ? req.body.department
      : undefined;
  const propertyId =
    typeof req.body?.propertyId === 'string' && req.body.propertyId !== 'ALL'
      ? req.body.propertyId
      : undefined;
  const limit = Number(req.body?.limit || 5);

  if (!query) {
    res.json({
      citations: [],
      policyEvidenceUnavailable: false,
      vectorMode: await getVectorModeStatus(),
    });
    return;
  }

  const result = await searchSops({ query, category, department, propertyId, limit });
  res.json(result);
});

policiesRouter.post('/reindex', async (req, res) => {
  const perm = checkAdminPermission(req.demoRole);
  if (!perm.allowed) {
    res.status(403).json({ error: perm.reason });
    return;
  }
  const summary = await indexAllSops();
  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'SOP_CORPUS_REINDEXED',
    entityType: 'policy',
    entityId: 'all',
    outcome: 'success',
    metadata: summary,
  });
  res.json({ ok: true, ...summary });
});

policiesRouter.post('/upload', async (req, res) => {
  const perm = checkAdminPermission(req.demoRole);
  if (!perm.allowed) {
    res.status(403).json({ error: perm.reason });
    return;
  }

  const incoming = Array.isArray(req.body?.files)
    ? (req.body.files as { filename?: unknown; content?: unknown }[])
    : [];

  if (incoming.length === 0) {
    res.status(400).json({ error: 'Provide at least one .md or .txt SOP file in files[].' });
    return;
  }

  fs.mkdirSync(CONFIG.sopsDir, { recursive: true });
  const filesSaved: string[] = [];

  for (const item of incoming) {
    if (typeof item?.filename !== 'string' || typeof item?.content !== 'string') continue;
    const rawBase = path.basename(item.filename.trim());
    const safeName = rawBase.replace(/[^a-zA-Z0-9._-]/g, '-');
    if (!/\.(md|txt)$/i.test(safeName)) continue;
    const trimmed = item.content.trim();
    if (!trimmed) continue;

    const targetPath = path.join(CONFIG.sopsDir, safeName);
    fs.writeFileSync(targetPath, `${trimmed}\n`, 'utf8');
    filesSaved.push(safeName);
  }

  if (filesSaved.length === 0) {
    res.status(400).json({
      error: 'No valid non-empty .md or .txt SOP files were found in the upload.',
    });
    return;
  }

  const summary = await indexAllSops();
  recordAuditLog({
    actorRole: req.demoRole,
    actorName: req.actorName,
    action: 'SOP_DOCUMENTS_UPLOADED',
    entityType: 'policy',
    entityId: filesSaved.join(','),
    outcome: 'success',
    metadata: { filesSaved, ...summary },
  });

  res.json({ ok: true, filesSaved, ...summary });
});
