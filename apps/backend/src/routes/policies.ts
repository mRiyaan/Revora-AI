import { Router } from 'express';
import { checkAdminPermission } from '@revora/shared';
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
  const category = typeof req.body?.category === 'string' && req.body.category !== 'ALL' ? req.body.category : undefined;
  const department = typeof req.body?.department === 'string' && req.body.department !== 'ALL' ? req.body.department : undefined;
  const propertyId = typeof req.body?.propertyId === 'string' && req.body.propertyId !== 'ALL' ? req.body.propertyId : undefined;
  const limit = Number(req.body?.limit || 5);

  if (!query) {
    res.json({ citations: [], policyEvidenceUnavailable: false, vectorMode: await getVectorModeStatus() });
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
