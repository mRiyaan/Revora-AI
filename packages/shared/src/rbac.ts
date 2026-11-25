import { DemoRole } from './canonical';

export const DEMO_ROLES: DemoRole[] = ['Support', 'Finance', 'Manager', 'Admin'];

export interface RolePermissionSummary {
  role: DemoRole;
  title: string;
  description: string;
  canApproveRoutine: boolean;
  canApproveBillingEscalation: boolean;
  canApproveSafetyOrOtherEscalation: boolean;
  canVerifyEvidence: boolean;
  canEditDraft: boolean;
  canManageAdminSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<DemoRole, RolePermissionSummary> = {
  Support: {
    role: 'Support',
    title: 'Guest Support Associate',
    description:
      'Reviews incoming feedback, verifies routine evidence, and approves held routine replies. Blocked from approving serious billing, safety, or misconduct escalations.',
    canApproveRoutine: true,
    canApproveBillingEscalation: false,
    canApproveSafetyOrOtherEscalation: false,
    canVerifyEvidence: true,
    canEditDraft: true,
    canManageAdminSettings: false,
  },
  Finance: {
    role: 'Finance',
    title: 'Finance & Billing Controller',
    description:
      'Audits billing discrepancies, verifies folios/settlements, and approves billing or refund-related escalations. Blocked from safety, misconduct, or admin settings.',
    canApproveRoutine: false,
    canApproveBillingEscalation: true,
    canApproveSafetyOrOtherEscalation: false,
    canVerifyEvidence: true,
    canEditDraft: true,
    canManageAdminSettings: false,
  },
  Manager: {
    role: 'Manager',
    title: 'General / Duty Manager',
    description:
      'Executive approval authority across all serious escalations (billing, safety, privacy, misconduct, cleanliness) and held routine responses.',
    canApproveRoutine: true,
    canApproveBillingEscalation: true,
    canApproveSafetyOrOtherEscalation: true,
    canVerifyEvidence: true,
    canEditDraft: true,
    canManageAdminSettings: false,
  },
  Admin: {
    role: 'Admin',
    title: 'System Administrator',
    description:
      'Manages sandbox configuration, auto-publish gates, SOP indexing, and demo resets. Separated from approving public guest responses.',
    canApproveRoutine: false,
    canApproveBillingEscalation: false,
    canApproveSafetyOrOtherEscalation: false,
    canVerifyEvidence: false,
    canEditDraft: false,
    canManageAdminSettings: true,
  },
};

export function checkEscalationApprovalPermission(
  role: DemoRole,
  category: string
): { allowed: boolean; reason?: string } {
  const norm = category.toLowerCase();
  const isBilling =
    norm.includes('billing') ||
    norm.includes('refund') ||
    norm.includes('payment') ||
    norm.includes('overcharge');

  if (role === 'Manager') {
    return { allowed: true };
  }
  if (role === 'Finance') {
    if (isBilling) return { allowed: true };
    return {
      allowed: false,
      reason: `Role 'Finance' is authorized only for billing/refund escalations, not '${category}' cases. Switch to 'Manager'.`,
    };
  }
  if (role === 'Support') {
    return {
      allowed: false,
      reason: `Role 'Support' lacks executive approval authority for serious '${category}' escalations. Route to ${isBilling ? "'Finance' or 'Manager'" : "'Manager'"}.`,
    };
  }
  return {
    allowed: false,
    reason: `Role 'Admin' is restricted to configuration/governance (separation of duties) and cannot approve public guest replies.`,
  };
}

export function checkRoutineApprovalPermission(role: DemoRole): {
  allowed: boolean;
  reason?: string;
} {
  if (role === 'Support' || role === 'Manager') {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Role '${role}' cannot approve routine replies. Switch to 'Support' or 'Manager'.`,
  };
}

export function checkEvidencePermission(role: DemoRole): {
  allowed: boolean;
  reason?: string;
} {
  if (ROLE_PERMISSIONS[role].canVerifyEvidence) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Role '${role}' cannot modify case evidence checklists (separation of duties).`,
  };
}

export function checkDraftEditPermission(role: DemoRole): {
  allowed: boolean;
  reason?: string;
} {
  if (ROLE_PERMISSIONS[role].canEditDraft) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Role '${role}' cannot edit public response drafts.`,
  };
}

export function checkAdminPermission(role: DemoRole): {
  allowed: boolean;
  reason?: string;
} {
  if (ROLE_PERMISSIONS[role].canManageAdminSettings) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Role '${role}' cannot modify sandbox/system configuration. Switch to 'Admin'.`,
  };
}
