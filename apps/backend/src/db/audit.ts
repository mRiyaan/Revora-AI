import crypto from 'node:crypto';
import { AuditLogEntry } from '@revora/shared';
import { getDb } from './connection';

export interface RecordAuditInput {
  actorRole: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: string | null;
  newState?: string | null;
  outcome: 'success' | 'blocked' | 'failed';
  metadata?: Record<string, unknown>;
}

export function recordAuditLog(input: RecordAuditInput): AuditLogEntry {
  const db = getDb();
  const id = `aud_${crypto.randomUUID().slice(0, 12)}`;
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO audit_logs (
      id, actor_role, actor_name, action, entity_type, entity_id,
      previous_state, new_state, outcome, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.actorRole,
    input.actorName,
    input.action,
    input.entityType,
    input.entityId,
    input.previousState ?? null,
    input.newState ?? null,
    input.outcome,
    input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt
  );

  return {
    id,
    actorRole: input.actorRole,
    actorName: input.actorName,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    previousState: input.previousState ?? null,
    newState: input.newState ?? null,
    outcome: input.outcome,
    metadata: input.metadata,
    createdAt,
  };
}

export function listAuditLogs(limit = 100, entityId?: string): AuditLogEntry[] {
  const db = getDb();
  const rows = entityId
    ? (db
        .prepare(
          `SELECT * FROM audit_logs WHERE entity_id = ? ORDER BY created_at DESC LIMIT ?`
        )
        .all(entityId, limit) as Record<string, unknown>[])
    : (db
        .prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`)
        .all(limit) as Record<string, unknown>[]);

  return rows.map((row) => ({
    id: String(row.id),
    actorRole: String(row.actor_role),
    actorName: String(row.actor_name),
    action: String(row.action),
    entityType: String(row.entity_type),
    entityId: String(row.entity_id),
    previousState: row.previous_state ? String(row.previous_state) : null,
    newState: row.new_state ? String(row.new_state) : null,
    outcome: row.outcome as 'success' | 'blocked' | 'failed',
    metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : undefined,
    createdAt: String(row.created_at),
  }));
}
