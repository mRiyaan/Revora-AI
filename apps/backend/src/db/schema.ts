import { getDb } from './connection';

export function initSchema(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_connections (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL UNIQUE,
      connection_mode TEXT NOT NULL DEFAULT 'sandbox',
      status TEXT NOT NULL DEFAULT 'connected',
      credential_ref TEXT NOT NULL,
      capabilities_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_locations (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      property_name TEXT NOT NULL,
      city TEXT NOT NULL,
      platform TEXT NOT NULL,
      external_location_id TEXT NOT NULL,
      UNIQUE(platform, external_location_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      external_review_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      reviewer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      original_rating_text TEXT,
      review_title TEXT,
      review_text TEXT NOT NULL,
      positive_text TEXT,
      negative_text TEXT,
      reservation_id TEXT,
      traveler_type TEXT,
      scenario_hint TEXT,
      raw_payload_json TEXT,
      created_at TEXT NOT NULL,
      ingested_at TEXT NOT NULL,
      response_status TEXT NOT NULL DEFAULT 'unanswered',
      UNIQUE(platform, external_review_id)
    );

    CREATE TABLE IF NOT EXISTS review_analysis (
      review_id TEXT PRIMARY KEY,
      sentiment TEXT NOT NULL,
      primary_category TEXT NOT NULL,
      categories_json TEXT NOT NULL,
      severity TEXT NOT NULL,
      summary TEXT NOT NULL,
      allegations_json TEXT NOT NULL,
      customer_intent TEXT NOT NULL,
      recommended_department TEXT NOT NULL,
      suggested_next_steps_json TEXT NOT NULL,
      evidence_checklist_json TEXT NOT NULL,
      draft_reply TEXT NOT NULL,
      confidence REAL NOT NULL,
      prompt_injection_detected INTEGER NOT NULL DEFAULT 0,
      ai_mode TEXT NOT NULL,
      raw_model_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS review_jobs (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL,
      job_type TEXT NOT NULL DEFAULT 'process_review',
      idempotency_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'queued',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      next_run_at TEXT NOT NULL,
      locked_by TEXT,
      locked_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL UNIQUE,
      draft_text TEXT NOT NULL,
      edited_text TEXT,
      approval_decision TEXT NOT NULL DEFAULT 'pending',
      approved_by_role TEXT,
      publication_state TEXT NOT NULL DEFAULT 'draft',
      external_reply_ref TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      policy_code TEXT NOT NULL UNIQUE,
      doc_title TEXT NOT NULL,
      version TEXT NOT NULL,
      department TEXT NOT NULL,
      category TEXT NOT NULL,
      property_scope TEXT NOT NULL DEFAULT 'ALL',
      file_path TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS policy_chunks (
      id TEXT PRIMARY KEY,
      policy_id TEXT NOT NULL,
      policy_code TEXT NOT NULL,
      doc_title TEXT NOT NULL,
      version TEXT NOT NULL,
      department TEXT NOT NULL,
      category TEXT NOT NULL,
      property_scope TEXT NOT NULL DEFAULT 'ALL',
      section_ref TEXT NOT NULL,
      content TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS escalation_tickets (
      id TEXT PRIMARY KEY,
      review_id TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      owner_department TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL,
      allegations_json TEXT NOT NULL,
      verified_facts_json TEXT NOT NULL,
      unknown_facts_json TEXT NOT NULL,
      next_steps_json TEXT NOT NULL,
      evidence_checklist_json TEXT NOT NULL,
      sop_citations_json TEXT NOT NULL,
      policy_evidence_unavailable INTEGER NOT NULL DEFAULT 0,
      triggered_rules_json TEXT NOT NULL,
      prompt_injection_detected INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users_roles (
      id TEXT PRIMARY KEY,
      role_name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      permissions_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_role TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      previous_state TEXT,
      new_state TEXT,
      outcome TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sandbox_platform_store (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      external_location_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      external_review_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      reply_json TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(platform, external_review_id)
    );
  `);
}
