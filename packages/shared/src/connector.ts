import { CanonicalReview, PlatformId } from './canonical';
import { PropertyId } from './properties';

export interface ConnectorCapabilities {
  readReviews: boolean;
  readSingleReview: boolean;
  publishReply: boolean;
  getReplyStatus: boolean;
  verifyWebhook: boolean;
  liveApiNote: string;
}

export class CapabilityNotSupportedError extends Error {
  public readonly code = 'CAPABILITY_NOT_SUPPORTED';
  public readonly platform: PlatformId;
  public readonly operation: string;

  constructor(platform: PlatformId, operation: string, reason?: string) {
    super(
      reason ||
        `Operation '${operation}' is not supported by the '${platform}' connector.`
    );
    this.name = 'CapabilityNotSupportedError';
    this.platform = platform;
    this.operation = operation;
  }
}

export interface PublishReplyInput {
  propertyId: PropertyId;
  externalReviewId: string;
  replyText: string;
  authorConnection?: string;
  language?: string;
}

export interface PublishReplyResult {
  externalReplyId: string;
  publicationState: 'PUBLISHED' | 'PENDING_MODERATION' | 'SANDBOX_LOCAL';
  updatedAt: string;
  rawResponse?: Record<string, unknown>;
}

export interface ReplyStatusResult {
  externalReplyId?: string;
  status: 'UNANSWERED' | 'PENDING_MODERATION' | 'PUBLISHED';
  replyText?: string;
  updatedAt?: string;
}

export interface WebhookVerifyInput {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface VerifiedWebhookEvent {
  platform: PlatformId;
  eventType: 'NEW_REVIEW' | 'UPDATED_REVIEW';
  propertyId: PropertyId;
  externalReviewId: string;
  externalLocationPath?: string;
}

export interface ReviewConnector {
  readonly platform: PlatformId;
  readonly capabilities: ConnectorCapabilities;
  fetchReviews(propertyId?: PropertyId): Promise<CanonicalReview[]>;
  fetchReview(propertyId: PropertyId, externalReviewId: string): Promise<CanonicalReview | null>;
  publishReply(input: PublishReplyInput): Promise<PublishReplyResult>;
  getReplyStatus(propertyId: PropertyId, externalReviewId: string): Promise<ReplyStatusResult>;
  verifyWebhook(input: WebhookVerifyInput): Promise<VerifiedWebhookEvent>;
}
