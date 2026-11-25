import {
  AuditLogEntry,
  CanonicalReview,
  DemoRole,
  EscalationBriefing,
  PlatformId,
  PropertyId,
  ReviewAnalysis,
  ReviewJob,
  SopCitation,
} from '@revora/shared';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface BackendReviewItem {
  review: CanonicalReview;
  analysis?: ReviewAnalysis;
  replyText?: string;
  draftReplyOriginal?: string;
  publicationState?: string;
  approvedByRole?: string;
  escalationTicketId?: string;
}

export interface SandboxStateResponse {
  appMode: 'sandbox';
  autoPublishRoutine: boolean;
  connectorMode: string;
  geminiConnected: boolean;
  aiMode: 'gemini_live' | 'local_fallback';
  geminiModel: string;
  vectorMode: 'qdrant_live' | 'local_qdrant_mirror';
  workerLastHeartbeat: string | null;
  connectors: {
    platform: PlatformId;
    displayName: string;
    port: number;
    url: string;
    transportMode: string;
    capabilities: Record<string, unknown>;
  }[];
  counts: {
    totalReviews: number;
    openEscalations: number;
    queuedJobs: number;
    failedJobs: number;
  };
}

export interface PolicyDocSummary {
  id: string;
  policyCode: string;
  docTitle: string;
  version: string;
  department: string;
  category: string;
  propertyScope: string;
  wordCount?: number;
  estimatedPages?: number;
  chunksCount?: number;
  chunks: { id: string; sectionRef: string; content: string }[];
}

export async function apiRequest<T>(
  path: string,
  opts: {
    method?: string;
    role?: DemoRole;
    body?: unknown;
  } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.role ? { 'X-Demo-Role': opts.role } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function fetchDashboardBundle(propertyId: PropertyId | 'ALL') {
  const qp = propertyId !== 'ALL' ? `?propertyId=${propertyId}` : '';
  const [sandbox, revRes, escRes, polRes, jobRes, audRes] = await Promise.all([
    apiRequest<SandboxStateResponse>('/api/sandbox/state'),
    apiRequest<{ reviews: BackendReviewItem[] }>(`/api/reviews${qp}`),
    apiRequest<{ escalations: EscalationBriefing[] }>(`/api/escalations${qp}`),
    apiRequest<{ policies: PolicyDocSummary[]; vectorMode: string }>('/api/policies'),
    apiRequest<{ jobs: ReviewJob[] }>('/api/jobs'),
    apiRequest<{ auditLogs: AuditLogEntry[] }>('/api/audit?limit=60'),
  ]);

  return {
    sandbox,
    reviews: revRes.reviews,
    escalations: escRes.escalations,
    policies: polRes.policies,
    vectorMode: polRes.vectorMode,
    jobs: jobRes.jobs,
    auditLogs: audRes.auditLogs,
  };
}

export async function searchPoliciesRag(
  query: string,
  department = 'ALL',
  category = 'ALL'
) {
  return apiRequest<{
    citations: SopCitation[];
    policyEvidenceUnavailable: boolean;
    vectorMode: string;
  }>('/api/policies/search', {
    method: 'POST',
    body: { query, department, category, limit: 6 },
  });
}
