# NovaTalk — Frontend (Design Pass 1)

Cosmic-themed frontend for NovaTalk, built with React + TypeScript + Tailwind v4 + Framer Motion + Lucide icons + React Router. No backend/Firebase logic — placeholder data only.

## Run it

```bash
npm install
npm run dev
```

Then open the printed localhost URL.

## What's included in this pass

- `/` — Landing page (hero, live stats, feature catalog, testimonials, download CTA, footer)
- `/login` — Login (glass card, Google button, animated backdrop)
- `/register` — Registration (avatar upload UI, full profile fields, interests picker)
- `/forgot-password` — Password reset
- `/dashboard` — User dashboard (quick actions, recent chats, online friends, suggested friends, community feed, notifications) inside the app shell (sidebar + topbar + mobile bottom nav)
- `/admin` — Admin passcode gate (6-digit code, no separate admin account/login flow)
- `/admin/dashboard` — Mission Control overview (stat widgets, growth chart, recent reports, recent users table)

## Signature design element

A live "constellation field" canvas (`src/components/ConstellationField.tsx`) drifts particles that connect into faint lines when close — a literal constellation forming and dissolving. It sits behind every screen via `AmbientBackdrop.tsx`, tying the cosmic theme directly into the UI rather than using generic blurred blobs.

Feature cards on the landing page are labeled with real constellation/star names (ORION, LYRA, POLARIS, AEGIS, VEGA, CARTOGRAPHY) chosen to match what each feature does, instead of generic 01/02/03 numbering.

## Not yet built (next passes)

Stranger Chat, Friends, Friend Requests, full Profile, Settings, Notifications feed, Communities + Community Details + Community Feed, Support, error pages (404/500/offline), and the remaining Admin sub-pages (Users, Reports, Communities, Analytics, Audit Logs, Database Health). The `AppShell` and `ui.tsx` primitives are built to make adding these fast and visually consistent.

## Stack notes

- Tailwind v4 via `@tailwindcss/vite` — tokens live in `src/index.css` under `@theme`.
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (eyebrows/labels) — loaded via Google Fonts in `index.html`.
- All components are plain Tailwind + custom primitives (`src/components/ui.tsx`) — no shadcn/ui, to keep the bundle light and the cosmic aesthetic tightly controlled.
