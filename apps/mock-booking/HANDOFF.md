# Teammate 2 Handoff — Mock Booking.com (`apps/mock-booking`, Port `3002`)

Read full design & screenshot instructions in: `handoffs/Revora_AI_Booking_com.txt`

## Quick Start
```bash
git clone https://github.com/mRiyaan/Revora-AI.git
cd Revora-AI
git checkout feat/mock-booking
npm install
npm run dev --workspace=apps/mock-booking
```
Open: `http://localhost:3002`

## Strict File Rules (Zero Merge Conflicts)
- **ONLY edit UI files inside `apps/mock-booking/`** (`src/app/page.tsx`, `layout.tsx`, `globals.css`, `src/components/**`).
- **DO NOT edit** `apps/mock-booking/src/app/api/**` or `src/lib/store.ts` — these are already wired 1:1 to `apps/backend`'s `BookingConnector` (`http://localhost:4000`).
- **DO NOT edit** `packages/shared/`, `apps/backend/`, or `apps/crm-web/`.

## Before Merging Your PR into `main`
```bash
npm run build --workspace=apps/mock-booking
git status   # Confirm only apps/mock-booking/ UI files changed
git add apps/mock-booking
git commit -m "feat(mock-booking): polish Booking.com UI from screenshots"
git push origin feat/mock-booking
```
Once merged into `main`, `apps/backend` (`CONNECTOR_MODE=auto`) automatically detects `http://localhost:3002` and syncs/publishes live!
