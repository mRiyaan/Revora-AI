import { PropertyId } from './properties';

export type PlatformId = 'google' | 'booking' | 'tripadvisor';

export type DemoRole = 'Support' | 'Finance' | 'Manager' | 'Admin';

export type ReviewScenario =
  | 'praise'
  | 'suggestion'
  | 'cleanliness'
  | 'billing'
  | 'safety'
  | 'mixed';

export type ResponseStatus =
  | 'unanswered'
  | 'queued'
  | 'auto_published'
  | 'held_for_review'
  | 'escalated'
  | 'approved_published'
  | 'rejected';

export interface CanonicalReview {
  id?: string;
  platform: PlatformId;
  externalReviewId: string;
  propertyId: PropertyId;
  reviewerName: string;
  rating: number; // 1..5 canonical scale
  originalRatingText?: string; // e.g. "9.5/10" on Booking or "FIVE" on Google
  reviewTitle?: string;
  reviewText: string;
  positiveText?: string;
  negativeText?: string;
  reservationId?: string;
  travelerType?: string;
  createdAt: string; // ISO-8601
  responseStatus: ResponseStatus;
  scenarioHint?: ReviewScenario;
  rawPayload?: Record<string, unknown>;
}

export type Sentiment = 'positive' | 'neutral' | 'mixed' | 'negative';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ReviewAnalysis {
  reviewId: string;
  sentiment: Sentiment;
  primaryCategory: string;
  categories: string[];
  severity: Severity;
  summary: string;
  allegations: string[];
  customerIntent: string;
  recommendedDepartment: string;
  suggestedNextSteps: string[];
  evidenceChecklist: string[];
  draftReply: string;
  confidence: number;
  promptInjectionDetected: boolean;
  aiMode: 'gemini_live' | 'local_fallback';
  rawModelJson?: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  label: string;
  checked: boolean;
  verifiedBy?: DemoRole;
  verifiedAt?: string;
  note?: string;
}

export interface SopCitation {
  chunkId: string;
  policyCode: string;
  docTitle: string;
  version: string;
  department: string;
  category: string;
  sectionRef: string;
  score: number;
  excerpt: string;
}

export interface EscalationBriefing {
  ticketId: string;
  reviewId: string;
  category: string;
  ownerDepartment: string;
  status: 'open' | 'approved' | 'rejected';
  priority: Severity;
  allegations: string[];
  verifiedFacts: string[];
  unknownFacts: string[];
  nextSteps: string[];
  evidenceChecklist: EvidenceItem[];
  sopCitations: SopCitation[];
  policyEvidenceUnavailable: boolean;
  triggeredRules: string[];
  promptInjectionDetected: boolean;
  review: CanonicalReview;
  analysis: ReviewAnalysis;
  response: {
    id: string;
    draftText: string;
    editedText?: string;
    approvalDecision?: 'approved' | 'rejected' | 'pending';
    approvedByRole?: DemoRole;
    publicationState: string;
    externalReplyRef?: string;
    updatedAt: string;
  };
}

export interface ReviewJob {
  id: string;
  reviewId: string;
  jobType: string;
  idempotencyKey: string;
  status: 'queued' | 'processing' | 'retry' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  nextRunAt: string;
  lockedBy?: string | null;
  lockedAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorRole: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: string | null;
  newState?: string | null;
  outcome: 'success' | 'blocked' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AppSettings {
  appMode: 'sandbox';
  autoPublishRoutine: boolean;
  connectorMode: string;
  aiMode: 'gemini_live' | 'local_fallback';
  vectorMode: 'qdrant_live' | 'local_qdrant_mirror';
  workerLastHeartbeat?: string | null;
}
