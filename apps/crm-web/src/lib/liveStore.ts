import fs from 'node:fs';
import path from 'node:path';
import { DemoStoreState, createInitialDemoState } from './mockDemoStore';

function getStorePath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'storage', 'live-demo-store.json'),
    path.resolve(process.cwd(), '..', '..', 'storage', 'live-demo-store.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.dirname(p))) return p;
  }
  return candidates[candidates.length - 1];
}

function buildCuratedStarterState(): DemoStoreState {
  const full = createInitialDemoState();
  // Curate a crisp, uncluttered starter set (12 representative reviews across all 3 platforms & 6 scenarios)
  const keepIds = new Set([
    'bk_rev_201', // Flagship Booking.com ₹5,000 vs ₹6,200 dispute (RES-994821)
    '301003',     // Tripadvisor solo traveler DND & lock safety incident
    'gbp_rev_105',// Google ₹5,000 vs ₹6,200 billing dispute
    'gbp_rev_104',// Google cleanliness complaint
    'gbp_rev_101',// Google 5-star praise (auto-published)
    'bk_rev_202', // Booking.com 9.6/10 praise (auto-published)
    '301002',     // Tripadvisor 5/5 praise (auto-published)
    '301001',     // Tripadvisor mixed 4/5 (held for review)
    'gbp_rev_103',// Google 4-star suggestion (held for review)
    'bk_rev_205', // Booking.com Goa resort praise
    '301009',     // Tripadvisor Jaipur palace praise
    'bk_rev_210', // Booking.com Jaipur safety lock escalation
  ]);

  const curatedReviews = full.reviews.filter((r) => keepIds.has(r.review.externalReviewId));
  const curatedEscalations = full.escalations.filter((e) =>
    keepIds.has(e.review.externalReviewId)
  );

  return {
    ...full,
    reviews: curatedReviews,
    escalations: curatedEscalations,
  };
}

export function readLiveStore(): DemoStoreState {
  const storePath = getStorePath();
  if (!fs.existsSync(storePath)) {
    const initial = buildCuratedStarterState();
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(storePath, 'utf8')) as DemoStoreState;
}

export function writeLiveStore(state: DemoStoreState): void {
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(state, null, 2));
}

export function resetLiveStore(): DemoStoreState {
  const initial = buildCuratedStarterState();
  writeLiveStore(initial);
  return initial;
}
