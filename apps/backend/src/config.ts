import path from 'node:path';
import dotenv from 'dotenv';

// Always resolve repo root cleanly whether invoked from monorepo root or apps/backend
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

dotenv.config({ path: path.join(REPO_ROOT, '.env') });

export const CONFIG = {
  appMode: 'sandbox' as const,
  connectorMode: (process.env.CONNECTOR_MODE || 'auto').toLowerCase(),
  port: Number(process.env.BACKEND_PORT || 4000),
  sqlitePath: path.join(REPO_ROOT, 'storage', 'app.db'),
  qdrantStorageFile: path.join(REPO_ROOT, 'storage', 'qdrant', 'local-vectors.json'),
  sopsDir: path.join(REPO_ROOT, 'docs', 'sops'),
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantCollection: process.env.QDRANT_COLLECTION || 'revora_sops',
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  defaultAutoPublishRoutine: (process.env.AUTO_PUBLISH_ROUTINE || 'true') === 'true',
  mockGoogleUrl: process.env.MOCK_GOOGLE_URL || 'http://localhost:3001',
  sandboxGbpToken: process.env.SANDBOX_GBP_TOKEN || 'sandbox-gbp-token',
  sandboxWebhookSecret: process.env.SANDBOX_WEBHOOK_SECRET || 'sandbox-gbp-webhook-secret',
  mockBookingUrl: process.env.MOCK_BOOKING_URL || 'http://localhost:3002',
  sandboxBookingToken: process.env.SANDBOX_BOOKING_TOKEN || 'sandbox-booking-jwt',
  mockTripadvisorUrl: process.env.MOCK_TRIPADVISOR_URL || 'http://localhost:3003',
  sandboxTerraOauthToken: process.env.SANDBOX_TERRA_OAUTH_TOKEN || 'sandbox-terra-jwt',
};
