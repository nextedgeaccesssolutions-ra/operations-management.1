# OPSDECK · Web Apps for Operations Management

Offline-first operations control platform with three separate role portals, governed approvals, geo-tagging (Philippines network), Gantt + S-curve planning, and 28 operational modules. Built with **Vite + React + TypeScript + Tailwind CSS v4** — deployable to **Vercel** straight from this repository.

Repository: `https://github.com/infonextedgeaccesssolutions-neas/Web-Apps-for-Operations-Management.git`

---

## Deploy to Vercel

### Option A — Git import (recommended, auto-deploys on every push)

1. Push this project to the repository above:
   ```bash
   git init
   git add .
   git commit -m "OPSDECK operations platform"
   git branch -M main
   git remote add origin https://github.com/infonextedgeaccesssolutions-neas/Web-Apps-for-Operations-Management.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import `Web-Apps-for-Operations-Management`.
3. Vercel auto-detects the **Vite** preset. Confirm:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
4. Deploy. Every subsequent `git push` produces a production deploy; pull requests get preview URLs automatically.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Already configured in-repo

- `public/vercel.json` — SPA rewrites (`/operations/*`, `/data:*` style deep links), security headers, immutable caching for `/assets/*`, no-cache for `sw.js`
- `public/manifest.webmanifest` + `public/icon.svg` — installable PWA (standalone display, brand icons)
- `public/sw.js` — service worker: precaches the app shell + hashed assets, cache-first with background refresh, stale-while-revalidate for fonts → the app loads with **no network at all**

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Portals & demo credentials

| Portal | Clearance | Sign-in | Password |
|---|---|---|---|
| **Command Portal** (Admin) | L5 · full authority | `a.kessler` | `deck-admin` |
| **Client Portal** (Meridian Energy) | L2 · read + request | `j.okafor` | `deck-client` |
| **Field Portal** (Inspector) | L4 · field ops | `r.vance` | `deck-field` |

## What's inside

- **Role-based dashboards** — KPI strips, project health, live activity ledger, per-portal quick actions
- **Gantt planner** — role-scoped timelines; inspector edits route through the approval gate, admin applies under L5
- **S-curve control** — planned vs actual vs forecast earned value; inspector certifications gate before the curve re-baselines
- **Geo-tagging** — sector grid + Philippines archipelago network (Luzon / Visayas / Mindanao / Palawan waypoints); non-admin drops land pending L5
- **Inspection reports** — geo-tagged, offline-queued, countersigned through the admin gate before client release
- **Approval gate** — change requests, edits, deletes, geo-tags, settings changes, report approvals; every decision ledgered
- **Governed settings** — 16 platform keys; inspector edits apply **only after** admin sign-off
- **28 modules** — `/operations:*`, `/pdf-viewer:*`, `/engineering:*`, `/design:*`, `/data:*`, `/enterprise-search:*`, `/productivity:*`, `/product-management:*`
- **Offline system** — manual or automatic offline node, device outbox with timestamps, reconciliation on uplink, service-worker app-shell caching
- **Theme toggle** — dark console ↔ light product theme, persisted, flash-free

## Tech notes

- React 18 + TypeScript (strict), Vite 6, Tailwind CSS v4 (`@theme` tokens, dual light/dark palettes)
- Custom SVG charts (Gantt, S-curve, sparklines, PH archipelago map) — no chart libs
- State persists to `localStorage` under a versioned key (`opsdeck:v5`)
- Honors `prefers-reduced-motion`
