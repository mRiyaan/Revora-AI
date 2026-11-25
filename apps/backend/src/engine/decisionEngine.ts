import { CanonicalReview, Severity } from '@revora/shared';
import { AnalysisOutput } from '../ai/schema';
import { detectPromptInjection } from '../ai/analyzer';

export type DecisionRoute =
  | 'ROUTINE_AUTO_PUBLISH'
  | 'ROUTINE_HOLD_FOR_REVIEW'
  | 'ESCALATE';

export interface DecisionOutcome {
  route: DecisionRoute;
  triggeredRules: string[];
  priority: Severity;
  ownerDepartment: string;
  escalationCategory: string;
}

const BILLING_RX =
  /overcharg|billed|billing|double.?charg|refund|invoice|folio|deposit|₹\s?\d|rs\.?\s?\d|extra\s+charge|resort\s+fee/i;
const SAFETY_PRIVACY_RX =
  /unsafe|safety|lock|keycard|without\s+knocking|dnd|do\s+not\s+disturb|privacy|stolen|missing\s+cash|theft|cctv|food\s+poison|stomach\s+illness|doctor|harass|security|police|lawyer/i;
const MISCONDUCT_RX = /rude|dismissed|misconduct|abusive|threat/i;

const FORBIDDEN_PROMISE_RX =
  /(we\s+will\s+(immediately\s+)?refund|full\s+refund\s+(is\s+)?approved|issuing\s+(you\s+)?a\s+refund|refund\s+has\s+been\s+processed|credited\s+back\s+to\s+your\s+card|guaranteed\s+compensation|we\s+accept\s+full\s+liability)/i;

const OTA_MODERATION_RX = /(https?:\/\/|www\.|\b\S+@\S+\.\S+\b)/i;

export function checkCommitmentGuardrail(
  replyText: string,
  hasVerifiedRefundEvidence = false
): { safe: boolean; violation?: string } {
  if (!hasVerifiedRefundEvidence && FORBIDDEN_PROMISE_RX.test(replyText)) {
    return {
      safe: false,
      violation:
        'SOP-FIN-01 §3.2 violation: Public reply cannot promise or confirm a refund/compensation without verified internal invoice & settlement evidence.',
    };
  }
  if (OTA_MODERATION_RX.test(replyText)) {
    return {
      safe: false,
      violation:
        'OTA Moderation Policy violation: Public replies must not include external URLs or personal email addresses.',
    };
  }
  return { safe: true };
}

export function evaluateDecision(
  review: CanonicalReview,
  analysis: AnalysisOutput,
  autoPublishRoutineEnabled: boolean
): DecisionOutcome {
  const fullText = `${review.reviewTitle || ''} ${review.reviewText}`;
  const triggeredRules: string[] = [];

  const billingMatch =
    BILLING_RX.test(fullText) ||
    analysis.primaryCategory === 'billing' ||
    analysis.categories.includes('billing') ||
    analysis.containsRefundOrCompRequest;

  const safetyMatch =
    SAFETY_PRIVACY_RX.test(fullText) ||
    ['safety', 'privacy'].includes(analysis.primaryCategory) ||
    analysis.categories.some((c) => ['safety', 'privacy'].includes(c));

  const misconductMatch =
    MISCONDUCT_RX.test(fullText) ||
    analysis.primaryCategory === 'misconduct' ||
    analysis.categories.includes('misconduct');

  const injectionMatch =
    analysis.promptInjectionDetected || detectPromptInjection(fullText);

  if (billingMatch) triggeredRules.push('RULE_BILLING_OR_REFUND_RISK');
  if (safetyMatch) triggeredRules.push('RULE_SAFETY_OR_PRIVACY_RISK');
  if (misconductMatch) triggeredRules.push('RULE_STAFF_MISCONDUCT_RISK');
  if (injectionMatch) triggeredRules.push('RULE_PROMPT_INJECTION_BLOCKED');
  if (review.rating <= 2) triggeredRules.push('RULE_LOW_RATING_THRESHOLD');
  if (analysis.severity === 'high' || analysis.severity === 'critical') {
    triggeredRules.push('RULE_HIGH_SEVERITY_RISK');
  }
  if (analysis.confidence < 0.78) {
    triggeredRules.push('RULE_LOW_CONFIDENCE_HOLD');
  }

  const draftCheck = checkCommitmentGuardrail(analysis.draftReply, false);
  if (!draftCheck.safe) {
    triggeredRules.push('RULE_UNVERIFIED_COMMITMENT_GUARDRAIL');
  }

  const mustEscalate =
    billingMatch ||
    safetyMatch ||
    misconductMatch ||
    injectionMatch ||
    review.rating <= 2 ||
    analysis.severity === 'high' ||
    analysis.severity === 'critical';

  if (mustEscalate) {
    const escalationCategory = safetyMatch
      ? 'safety'
      : billingMatch
        ? 'billing'
        : misconductMatch
          ? 'misconduct'
          : analysis.primaryCategory;

    const ownerDepartment = safetyMatch
      ? 'Security'
      : billingMatch
        ? 'Finance'
        : analysis.primaryCategory === 'cleanliness'
          ? 'Housekeeping'
          : 'Management';

    const priority: Severity =
      safetyMatch || injectionMatch
        ? 'critical'
        : billingMatch || review.rating <= 2
          ? 'high'
          : 'medium';

    return {
      route: 'ESCALATE',
      triggeredRules,
      priority,
      ownerDepartment,
      escalationCategory,
    };
  }

  // Routine path (rating >= 3 and no serious risk triggers)
  if (!autoPublishRoutineEnabled) {
    triggeredRules.push('GATE_AUTO_PUBLISH_DISABLED');
    return {
      route: 'ROUTINE_HOLD_FOR_REVIEW',
      triggeredRules,
      priority: 'low',
      ownerDepartment: 'Support',
      escalationCategory: analysis.primaryCategory,
    };
  }

  if (
    review.rating < 4 ||
    analysis.confidence < 0.78 ||
    !draftCheck.safe ||
    analysis.primaryCategory === 'cleanliness'
  ) {
    triggeredRules.push('RULE_ROUTINE_HELD_FOR_HUMAN_CHECK');
    return {
      route: 'ROUTINE_HOLD_FOR_REVIEW',
      triggeredRules,
      priority: 'low',
      ownerDepartment: analysis.recommendedDepartment,
      escalationCategory: analysis.primaryCategory,
    };
  }

  return {
    route: 'ROUTINE_AUTO_PUBLISH',
    triggeredRules: ['GATE_ROUTINE_ELIGIBLE_AUTO_PUBLISH'],
    priority: 'low',
    ownerDepartment: 'Support',
    escalationCategory: analysis.primaryCategory,
  };
}
