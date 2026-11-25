import { z } from 'zod';

export const AnalysisOutputSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'mixed', 'negative']),
  primaryCategory: z.enum([
    'praise',
    'suggestion',
    'cleanliness',
    'billing',
    'safety',
    'privacy',
    'misconduct',
    'service_delay',
    'facilities',
  ]),
  categories: z.array(z.string()).min(1).max(6),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  summary: z.string().min(10).max(800),
  allegations: z.array(z.string()).max(8),
  customerIntent: z.string().min(4).max(300),
  recommendedDepartment: z.enum([
    'Support',
    'Finance',
    'Security',
    'Housekeeping',
    'Management',
  ]),
  suggestedNextSteps: z.array(z.string()).min(1).max(6),
  evidenceChecklist: z.array(z.string()).max(6),
  draftReply: z.string().min(15).max(1800),
  confidence: z.number().min(0).max(1),
  promptInjectionDetected: z.boolean(),
  containsRefundOrCompRequest: z.boolean(),
});

export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
