# Teammate 1 Handoff — Mock Google Business Profile (`apps/mock-google`, Port `3001`)

Read full design & screenshot instructions in: `handoffs/Revora_AI_Google_Business_Profile.txt`

## Quick Start
```bash
git clone https://github.com/mRiyaan/Revora-AI.git
cd Revora-AI
git checkout feat/mock-google
npm install
npm run dev --workspace=apps/mock-google
```
Open: `http://localhost:3001`

## Strict File Rules (Zero Merge Conflicts)
- **ONLY edit UI files inside `apps/mock-google/`** (`src/app/page.tsx`, `layout.tsx`, `globals.css`, `src/components/**`).
- **DO NOT edit** `apps/mock-google/src/app/api/**` or `src/lib/store.ts` — these are pre-wired 1:1 to `apps/backend`'s `GoogleConnector` (GBP v4 + Cloud Pub/Sub Base64 `NEW_REVIEW` push to `http://localhost:4000/api/webhooks/google`).
- **DO NOT edit** `packages/shared/`, `apps/backend/`, `apps/crm-web/`, or other `apps/mock-*` folders.

## Before Raising Your PR into `main`
```bash
npm run build --workspace=apps/mock-google
git status   # Confirm only apps/mock-google/ UI files changed
git add apps/mock-google
git commit -m "feat(mock-google): polish Google Maps / Business Profile UI from screenshots"
git push origin feat/mock-google
```
Once merged into `main`, `apps/backend` (`CONNECTOR_MODE=auto`) automatically detects `http://localhost:3001` and pushes/receives live replies!
