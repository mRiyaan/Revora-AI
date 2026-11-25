import {
  PROPERTIES,
  ROLE_PERMISSIONS,
  SEED_REVIEWS,
  DEMO_ROLES,
} from '@revora/shared';
import { getDb } from './connection';
import { initSchema } from './schema';
import { indexAllSops } from '../rag/sopRag';
import { getAllConnectors } from '../connectors/connectorRegistry';
import { ingestCanonicalReview } from '../services/ingestService';
import { drainQueueOnce } from '../worker/runOnce';
import { CONFIG } from '../config';

export async function seedDatabase(resetExisting = true) {
  initSchema();
  const db = getDb();
  const now = new Date().toISOString();

  if (resetExisting) {
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM escalation_tickets;
      DELETE FROM responses;
      DELETE FROM review_analysis;
      DELETE FROM review_jobs;
      DELETE FROM reviews;
      DELETE FROM sandbox_platform_store;
      DELETE FROM platform_locations;
      DELETE FROM platform_connections;
      DELETE FROM users_roles;
    `);
  }

  // 1. Seed platform_connections
  for (const conn of getAllConnectors()) {
    db.prepare(
      `INSERT OR REPLACE INTO platform_connections (
        id, platform, connection_mode, status, credential_ref, capabilities_json, updated_at
      ) VALUES (?, ?, 'sandbox', 'connected', ?, ?, ?)`
    ).run(
      `conn_${conn.platform}`,
      conn.platform,
      `SANDBOX_${conn.platform.toUpperCase()}_TOKEN`,
      JSON.stringify(conn.capabilities),
      now
    );
  }

  // 2. Seed platform_locations
  for (const prop of PROPERTIES) {
    const mappings: [string, string][] = [
      ['google', prop.googleLocationPath],
      ['booking', prop.bookingPropertyId],
      ['tripadvisor', String(prop.tripadvisorLocationId)],
    ];
    for (const [platform, extId] of mappings) {
      db.prepare(
        `INSERT OR REPLACE INTO platform_locations (
          id, property_id, property_name, city, platform, external_location_id
        ) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        `loc_${prop.propertyId}_${platform}`,
        prop.propertyId,
        prop.name,
        prop.city,
        platform,
        extId
      );
    }
  }

  // 3. Seed users_roles
  for (const role of DEMO_ROLES) {
    const info = ROLE_PERMISSIONS[role];
    db.prepare(
      `INSERT OR REPLACE INTO users_roles (id, role_name, display_name, permissions_json)
       VALUES (?, ?, ?, ?)`
    ).run(`role_${role.toLowerCase()}`, role, info.title, JSON.stringify(info));
  }

  // 4. Default settings
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('auto_publish_routine', ?, ?)`
  ).run(String(CONFIG.defaultAutoPublishRoutine), now);

  // 5. Index SOP manuals into SQLite + Qdrant / local vector mirror
  const ragInfo = await indexAllSops();

  // 6. Seed all 48 fictional reviews across Google, Booking, Tripadvisor
  let ingestedCount = 0;
  for (const item of SEED_REVIEWS) {
    const res = ingestCanonicalReview(item, 'sandbox_seeder');
    if (!res.deduplicated) ingestedCount++;
  }

  // 7. Process initial seeded queue so CRM opens with rich routine replies + open escalations
  const drained = await drainQueueOnce();

  return {
    reviewsSeeded: ingestedCount,
    totalSeedDataset: SEED_REVIEWS.length,
    processedCompleted: drained.completed,
    processedFailed: drained.failed,
    ragInfo,
  };
}

if (require.main === module) {
  seedDatabase(true)
    .then((summary) => {
      console.log('[Seed] Complete:', JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    });
}
