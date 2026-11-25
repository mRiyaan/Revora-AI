import fs from 'node:fs';
import path from 'node:path';

const OUT_PATH = path.resolve(
  process.cwd(),
  'docs/sops/the-leela-palace-bangalore-master-sop-manual.md'
);

const PARTS = [
  {
    partNum: 1,
    partTitle: 'Front Office, Reservations, Rate Parity & OTA Channel Governance',
    department: 'Support',
    category: 'general',
    slaOwner: 'Front Office Manager & Duty Manager',
    escalationRole: 'Manager',
    sections: [
      ['1.1', 'Arrival Welcome, Palace Protocol & Identity Verification at 23 HAL Old Airport Road'],
      ['1.2', 'Royal Club Wing Priority Check-In & Maharaja Suite Escort Standard'],
      ['1.3', 'Booking.com, Google Travel & Tripadvisor OTA Voucher Reconciliation'],
      ['1.4', 'Rate Parity Verification & Direct-vs-OTA Tariff Discrepancy Handling'],
      ['1.5', 'Early Check-In, Late Check-Out & Complimentary Extension Matrix'],
      ['1.6', 'No-Show, Last-Minute Cancellation & Force Majeure Waiver Policy'],
      ['1.7', 'Walk-In Upgrade Eligibility & Overbooking Relocation Safeguards'],
      ['1.8', 'Airport Limousine Coordination (Kempegowda International Airport BLR)'],
      ['1.9', 'Diplomatic, Corporate & Long-Stay Guest Preference Profiling in Opera PMS'],
      ['1.10', 'Check-Out Express Express-Folio Review & Feedback Card Collection'],
    ],
  },
  {
    partNum: 2,
    partTitle: 'Billing Integrity, Folio Audits, Overcharges & Refund Authority Matrix',
    department: 'Finance',
    category: 'billing',
    slaOwner: 'Income Auditor & Financial Controller',
    escalationRole: 'Finance',
    sections: [
      ['2.1', 'Daily Opera PMS Night Audit & Room-Tax Posting Reconciliation'],
      ['2.2', 'Tariff Variance Protocol (INR 5,000 vs INR 6,200 Nightly Discrepancy Audits)'],
      ['2.3', 'Pre-Authorization Hold Release Rules (Domestic Cards vs International Forex Cards)'],
      ['2.4', 'GST Tax Invoice Amendments, B2B GSTIN Updates & SAC Code Compliance'],
      ['2.5', 'Duplicate Charge Verification & Merchant Acquirer Trace Number (ARN) Retrieval'],
      ['2.6', 'Minibar, Laundry & ZLB23 / Jamavar Late-Posted Outlet Charge Disputes'],
      ['2.7', 'Refund Authorization Tiers (Support Triage vs Manager INR 5,000 vs Finance Controller)'],
      ['2.8', 'Public Reply Non-Promise Rule for Unverified Monetary & Refund Claims'],
      ['2.9', 'OTA Commission Reconciliation (Booking.com Virtual Cards vs Hotel Collect)'],
      ['2.10', 'Chargeback Defense Package Assembly & Gateway Evidence Timelines'],
      ['2.11', 'Foreign Currency Exchange (FFMC) & Dynamic Currency Conversion transparency'],
      ['2.12', 'Audit Sign-Off Before Issuing Credit Notes or Bank Settlement Confirmations'],
    ],
  },
  {
    partNum: 3,
    partTitle: 'Guest Safety, Physical Security, RFID Keycards & DND Privacy Controls',
    department: 'Security',
    category: 'safety',
    slaOwner: 'Chief Security Officer & Loss Prevention Lead',
    escalationRole: 'Manager',
    sections: [
      ['3.1', '24x7 Perimeter Access Control & Vehicle Under-Chassis Screening at Palace Gate'],
      ['3.2', 'RFID Keycard Encoding, Guest ID Re-Verification & Duplicate Key Logging'],
      ['3.3', 'Do Not Disturb (DND) Strict Non-Entry Rule & Two-Person Wellness Check Protocol'],
      ['3.4', 'Unannounced Room Entry Incident Investigation & Electronic Lock Interrogation'],
      ['3.5', 'Lost, Misplaced or Suspected Stolen Valuables & In-Room Safe Reset SOP'],
      ['3.6', 'CCTV Retention, Chain-of-Custody Sealing & Authorized Footage Review'],
      ['3.7', 'Medical Emergency, Cardiac Defibrillator (AED) & Manipal Hospital Ambulance Dispatch'],
      ['3.8', 'Fire Life Safety, Evacuation Muster Points & Smoke Detector Tamper Alerts'],
      ['3.9', 'Solo Female Traveller Floor Placement & Privacy-First Escort Guidelines'],
      ['3.10', 'Visitor Registration After 22:00 Hours & Floor Elevator Keycard Restriction'],
      ['3.11', 'Slip, Trip, Fall & Wet Marble Poolside Incident Documentation'],
      ['3.12', 'Alcohol Over-Service Intervention & Safe Chauffeur Dispatch from Library Bar'],
    ],
  },
  {
    partNum: 4,
    partTitle: 'Housekeeping Excellence, Deep-Clean Audits, Linen & Hygiene Standards',
    department: 'Housekeeping',
    category: 'cleanliness',
    slaOwner: 'Executive Housekeeper & Floor Supervisor',
    escalationRole: 'Manager',
    sections: [
      ['4.1', '42-Point Departure Deep-Clean Checklist & Supervisor UV Inspection'],
      ['4.2', 'Linen, Pillow Menu & Hypoallergenic Sanctuary Turnover Standard'],
      ['4.3', 'Marble Bathroom Descaling, Brass Polishing & Mold Prevention Audits'],
      ['4.4', 'Evening Turndown Service, Jasmine Garlands & Aromatherapy Standards'],
      ['4.5', 'Pest Control Preventive Sealing & Zero-Tolerance Immediate Room Relocation'],
      ['4.6', 'Odor Neutralization (Ozone / HEPA) After Smoke or Culinary Aroma Incidents'],
      ['4.7', 'In-Room Coffee Machine, Ice Bucket & Crystal Glassware Sanitization'],
      ['4.8', 'Guest Garment Pressing, Dry-Cleaning Liability & Delicates Inspection'],
      ['4.9', 'Service Recovery Room Move Within 15 Minutes of Verified Cleanliness Complaint'],
      ['4.10', 'Monthly Mattress Inversion, Upholstery Steam Cleaning & Carpet Extraction Log'],
    ],
  },
  {
    partNum: 5,
    partTitle: 'Food & Beverage Operations, Signature Dining & FSSAI Food Safety',
    department: 'F&B',
    category: 'cleanliness',
    slaOwner: 'Director of F&B & Executive Sous Chef',
    escalationRole: 'Manager',
    sections: [
      ['5.1', 'Citrus All-Day Dining Breakfast Buffet Temperature & Freshness Audits'],
      ['5.2', 'Jamavar Royal Indian Dining Table Service & Spice-Profile Briefing'],
      ['5.3', 'Zen Pan-Asian & Teppanyaki Station Cross-Contamination Controls'],
      ['5.4', 'Le Cirque Signature Fine Dining Wine Pairing & Sommelier Decanting Standard'],
      ['5.5', 'ZLB23 Kyoto Speakeasy Mixology Standards, Capacity Control & Entry Protocol'],
      ['5.6', 'Library Bar Afternoon High Tea & Vintage Spirit Pour Accuracy'],
      ['5.7', 'FSSAI Allergen Matrix, Nut/Gluten Isolation & Dedicated Kitchen Prep Zones'],
      ['5.8', 'Suspected Foodborne Illness Escalation, Sample Retention & Lab Testing'],
      ['5.9', '24-Hour In-Room Dining Delivery SLA (30-Minute Guarantee & Hotbox Seals)'],
      ['5.10', 'Banquet, Royal Ballroom & MICE Catering Cold-Chain Compliance'],
    ],
  },
  {
    partNum: 6,
    partTitle: 'ESPA Spa, Heated Pool, Concierge, Royal Club Butler & Fleet Services',
    department: 'Support',
    category: 'general',
    slaOwner: 'Director of Rooms & ESPA Spa Director',
    escalationRole: 'Support',
    sections: [
      ['6.1', 'ESPA Holistic Consultation, Contraindication Screening & Therapist Gender Consent'],
      ['6.2', 'Temperature-Controlled Pool Chlorine/pH Testing & Lifeguard Deck Coverage'],
      ['6.3', 'Fitness Studio Equipment Calibration & Personal Trainer Liability Waiver'],
      ['6.4', 'Les Clefs d’Or Concierge City Itinerary, Bengaluru Golf & Art Tour Standards'],
      ['6.5', 'Royal Club Lounge Evening Canapés, Unpacking Service & Butler Continuity'],
      ['6.6', 'Luxury Chauffeur Fleet (BMW / Mercedes) Cabin Sanitization & GPS Telemetry'],
      ['6.7', 'Pet-Restricted Palace Grounds Enforcement & Service Animal Accommodation'],
      ['6.8', 'Curated Heritage Walk & Evening Sandhya Ceremony Hospitality Protocol'],
    ],
  },
  {
    partNum: 7,
    partTitle: 'Engineering, HVAC, Acoustics, Utilities & Preventive Maintenance SLAs',
    department: 'Operations',
    category: 'cleanliness',
    slaOwner: 'Chief Engineer & Duty Shift Engineer',
    escalationRole: 'Manager',
    sections: [
      ['7.1', 'Chilled-Water HVAC Calibration (19°C–24°C) & Thermostat Responsiveness'],
      ['7.2', 'Acoustic Insulation, Courtyard Music Curfew (22:00 Hours) & Renovation Hours'],
      ['7.3', 'Hot Water Pressure, Instant Return Loop & Shower Mixer Valve Checks'],
      ['7.4', 'Passenger & Service Elevator Emergency Intercom & 10-Minute Rescue SLA'],
      ['7.5', 'Enterprise Wi-Fi 6 Bandwidth Monitoring & Room AP Dead-Zone Remediation'],
      ['7.6', 'Uninterrupted DG Backup Power Switchover & Surge Protection Protocol'],
      ['7.7', 'Lagoon & Fountain Filtration, Mosquito Fogging & Garden Lighting Schedule'],
      ['7.8', 'Work-Order Closure Verification Before Closing Engineering Complaints in CRM'],
    ],
  },
  {
    partNum: 8,
    partTitle: 'Staff Conduct, DPDP Act 2023 Data Privacy & AI Prompt-Injection Defense',
    department: 'Security',
    category: 'safety',
    slaOwner: 'Human Resources Director & Data Protection Officer',
    escalationRole: 'Admin',
    sections: [
      ['8.1', 'Zero-Tolerance Policy Against Harassment, Discrimination & Verbal Misconduct'],
      ['8.2', 'DPDP Act 2023 Guest Personal Data Minimization & Purpose Limitation'],
      ['8.3', 'Mandatory PII Redaction in Public Review Replies (No Room/Phone/Card Data)'],
      ['8.4', 'Social Media Confidentiality & Celebrity / Political VIP Non-Disclosure'],
      ['8.5', 'Conflict-of-Interest, Gratuity Pooling & Unsolicited Gift Reporting'],
      ['8.6', 'AI Review Pipeline Prompt-Injection Defense & Instruction Override Rejection'],
      ['8.7', 'Defamation, Bribery Attempt & Extortionate Negative-Review Escalation'],
      ['8.8', 'Whistleblower Protection & Internal Ethics Hotline (24-Hour Investigation)'],
      ['8.9', 'Third-Party Vendor Background Verification & Restricted Back-of-House Badges'],
      ['8.10', 'Mandatory Quarterly Security & Privacy Refresher Certification'],
    ],
  },
  {
    partNum: 9,
    partTitle: 'Digital Reputation Governance (Google, Booking.com & Tripadvisor Terra)',
    department: 'Manager',
    category: 'general',
    slaOwner: 'Director of Guest Experience & Digital Reputation Lead',
    escalationRole: 'Manager',
    sections: [
      ['9.1', 'Channel Capability Boundaries (Google / Booking Native Reply vs Tripadvisor Partner Policy)'],
      ['9.2', 'Auto-Publish Gate Eligibility (Low Risk, 4-5 Star Routine Praise, No Policy Violation)'],
      ['9.3', 'Mandatory Hold & Human Approval Triggers (Safety, Billing, Privacy, Misconduct, <= 2 Stars)'],
      ['9.4', 'The Leela Palace Voice: Warm, Dignified, Personalized, Non-Robotic Hospitality Prose'],
      ['9.5', 'Banned Phrases List (No "Sorry for the inconvenience", No AI Self-Reference, No Legal Admissions)'],
      ['9.6', 'Customer Executive Edit & Draft-Delete Workflow Before External Channel Publication'],
      ['9.7', '24-Hour First-Response SLA & 48-Hour Root-Cause Loop Closure Metric'],
      ['9.8', 'Cross-Channel Duplicate Detection & Idempotent Review Ingestion Verification'],
    ],
  },
  {
    partNum: 10,
    partTitle: 'Crisis Management, VIP Protocol, Legal Escalation & Audit Retention',
    department: 'Manager',
    category: 'safety',
    slaOwner: 'General Manager & Legal Counsel',
    escalationRole: 'Admin',
    sections: [
      ['10.1', 'Head-of-State, Diplomatic & Royal Club Wing Lock-Down Coordination'],
      ['10.2', 'Social Media Viral Incident Containment & Corporate PR Sign-Off'],
      ['10.3', 'Legal Notice, Consumer Forum & Regulatory Ombudsman Escalation Freeze'],
      ['10.4', 'Public Health Outbreak or City Advisory Continuity Playbook'],
      ['10.5', 'Mandatory 7-Year Immutable Audit Log Retention (SQLite / WORM Archive)'],
      ['10.6', 'SOP Vector Knowledge Base Upload, Chunking & Qdrant Governance (Admin Only)'],
      ['10.7', 'AI Hallucination Prevention ("Policy Evidence Unavailable" Fail-Closed Rule)'],
      ['10.8', 'Quarterly General Manager Audit of Auto-Published vs Escalated Decisions'],
    ],
  },
];

function buildSectionBody(part, secNum, secTitle, globalIndex) {
  const controlCode = `LPB-CTRL-${part.partNum}${String(globalIndex).padStart(2, '0')}`;
  const isBilling = part.category === 'billing';
  const isSafety = part.category === 'safety';
  const isClean = part.category === 'cleanliness';

  const contextFocus = isBilling
    ? 'folio accuracy, card pre-authorization reconciliation, GST invoice compliance, and strict adherence to financial authorization thresholds'
    : isSafety
      ? 'physical guest security, electronic keycard traceability, unannounced entry prevention, DPDP Act 2023 privacy preservation, and regulatory compliance'
      : isClean
        ? 'five-star hygiene assurance, sensory inspection thresholds, allergen isolation, preventive maintenance closure, and immediate service recovery'
        : 'palatial hospitality continuity, channel capability governance, rate integrity, personalized butler service, and verifiable guest communication';

  const crmRule = isBilling
    ? 'Whenever a guest review or inquiry alleges an overcharge (including tariff variances such as INR 5,000 booked vs INR 6,200 billed), duplicate card swipe, delayed pre-authorization release, or uncredited refund, the Revora AI deterministic risk gate MUST classify the case as HIGH RISK and route it to Finance escalation. Customer executives may edit the drafted holding reply to remain empathetic and factual, OR delete the draft to compose an approved statement, but NO public reply may ever confirm a refund amount or promise reimbursement prior to Opera PMS and Income Audit verification.'
    : isSafety
      ? 'Any guest allegation involving unannounced housekeeping/engineering entry despite an active Do Not Disturb (DND) indicator, master keycard misuse, missing valuables, bodily injury, harassment, or PII exposure MUST trigger an immediate critical safety hold. Auto-publishing is strictly disabled. The Duty Manager and Chief Security Officer must capture VingCard lock interrogation logs and corridor CCTV timestamps within 30 minutes before Finance/Manager sign-off on any external communication.'
      : isClean
        ? 'Verified cleanliness, allergen, or room-readiness complaints require Executive Housekeeper or Chief Engineer physical sign-off within 15 minutes for in-house guests and root-cause corrective logging in Opera PMS before external review closure. Where rating falls at or below 2 stars or alleges illness/pest presence, escalation to Manager review is mandatory and public replies must reference verified inspection remedies rather than generic apologies.'
        : 'Routine 4-star and 5-star praise referencing verified dining at Jamavar, Citrus, Zen, Le Cirque Signature, Library Bar, ZLB23, ESPA Spa, or Royal Club butler service may qualify for automated drafting and auto-publish only when the Admin Auto-Publish gate is ON, zero risk flags are triggered, confidence meets policy threshold, and the connected channel supports native API replies.';

  const bannedReminder =
    part.partNum === 9
      ? 'Explicitly prohibit cliché phrasing ("sorry for the inconvenience", "regret the same", "due to unavoidable circumstances"), never reveal internal SOP IDs or AI scoring to guests, and never disclose reservation numbers, full names of staff under investigation, or room numbers.'
      : 'Ensure every public-facing statement reflects the refined editorial tone of THE LEELA PALACE BANGALORE, avoids disclosing PII (room numbers, phone digits, partial card numbers, or folio totals), and never invents compensation terms outside verified CRM evidence.';

  return `## Section ${secNum} — ${secTitle}
[Department: ${part.department} | Category: ${part.category} | Control: ${controlCode}]

- **Scope:** Governs **THE LEELA PALACE BANGALORE** (23 HAL Old Airport Road, Bengaluru 560008, \`HOTEL001\`) for ${contextFocus}, owned by ${part.slaOwner}.
- **SLA Timeline:** T+0 capture (Reservation ID, Opera PMS folio, channel source: \`Google\`, \`Booking.com\`, \`Tripadvisor\`); T+15m physical/ledger verification (Opera PMS, VingCard log, or FSSAI log); T+60m **${part.escalationRole}** escalation under \`${controlCode}\`; T+24h loop closure.
- **Risk-Gate Rule:** ${crmRule}
- **Guardrail:** ${bannedReminder} Every draft edit, draft delete, evidence check, and publish action logs to SQLite \`audit_logs\` with role attribution.
`;
}

function generateManual() {
  const header = `# THE LEELA PALACE BANGALORE — Master Standard Operating Procedures & Guest Reputation Governance Manual

- Policy Code: SOP-LPB-MASTER-001
- Version: 4.2
- Department: Operations & Guest Relations
- Category: general
- Property Scope: HOTEL001
- Effective Date: November 2026
- Property Address: 23 HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka 560008, India
- Covered Channels: Google Business Profile, Booking.com Connectivity API, Tripadvisor Terra

This Master Standard Operating Procedures Manual serves as the authoritative operational, financial, safety, culinary, engineering, privacy, and digital reputation governance handbook for **THE LEELA PALACE BANGALORE** (\`HOTEL001\`). Every department head, customer executive, finance auditor, duty manager, and Revora AI RAG pipeline operates strictly within the controls documented across Parts 1 through 10 below. When policy evidence is absent from this indexed corpus, automated systems must fail closed rather than fabricate rules or monetary commitments.

`;

  const blocks = [header];
  let idx = 1;
  for (const part of PARTS) {
    blocks.push(`\n### Part ${part.partNum}: ${part.partTitle}\n\n`);
    for (const [secNum, secTitle] of part.sections) {
      blocks.push(buildSectionBody(part, secNum, secTitle, idx));
      idx++;
    }
  }

  const fullText = blocks.join('\n');
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, fullText, 'utf8');

  const words = fullText.trim().split(/\s+/).length;
  const lines = fullText.split('\n').length;
  const sections = idx - 1;
  const estPages = Math.ceil(words / 430);
  console.log(
    JSON.stringify({
      ok: true,
      outPath: OUT_PATH,
      sections,
      words,
      lines,
      estimatedPages: estPages,
    })
  );
}

generateManual();
