# Vidro AI

AI-powered video creation platform for e-commerce brands. Generate long-form product videos and 5-second social clips using customizable templates — powered by Firebase, Stripe, and a hybrid AI + programmatic editing pipeline.

## Features

- **Long-Form Video Creator** — 4-step wizard (Setup → AI Images → Video Clips → Final) with model customization, background/surface selection, and URL scraping
- **5-Second Template Videos** — Upload a product image, pick a template, and generate a short-form social clip in seconds
- **Template Gallery** — Browse templates by category (Apparel, Shoes, Beauty, Jewelry) with AI prompt layers, editing configs, and platform-specific marketing copy
- **Billing & Subscription** — Credit-based system with Stripe Checkout, Billing Portal, and payment history
- **Authentication** — Firebase Auth with protected routes

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend | Express.js (served via Vite middleware mode) |
| Database / Auth | Firebase (Auth, Firestore, Storage) |
| Payments | Stripe (Checkout Sessions, Billing Portal, Webhooks) |
| Analytics | PostHog |
| State | Zustand |

## Project Structure

```
src/
├── components/
│   ├── Breadcrumb.tsx       # Hierarchical nav (Profile → Billing → ...)
│   ├── DashboardLayout.tsx  # App shell with sidebar
│   └── Sidebar.tsx          # Main navigation
├── data/
│   └── templates.ts         # 3-layer template definitions
├── pages/
│   ├── VideoCreator.tsx     # Long-form video creator (4-step wizard)
│   ├── Templates5s.tsx      # 5-second template generator
│   ├── TemplatesGallery.tsx # Browse all templates
│   ├── Billing.tsx          # Plan management + payment history
│   ├── Upgrade.tsx          # Credit pack purchase
│   └── Profile.tsx          # Account settings
├── types/
│   └── template.ts          # TypeScript types for 3-layer template system
└── lib/
    ├── firebase.ts          # Firebase client SDK
    └── posthog.ts           # Analytics
server.ts                    # Express API (credits, Stripe, generation)
```

## Template System

Templates follow a **3-layer hybrid architecture**:

1. **Prompt Layer** — Fill-in-the-blank AI prompt formula (`systemPrompt`, `userPromptTemplate`, `styleModifiers`). Designed to slot into Kling, Veo, or any image-to-video API.
2. **Editing Layer** — Programmatic clip sequence with timings, transitions, music track, and supported aspect ratios. Designed for Shotstack or Creatomate.
3. **Marketing Layer** — Pre-written hook, CTA, SEO tags, and platform recommendations (TikTok, Instagram Reels, etc.).

## Run Locally

**Prerequisites:** Node.js 18+, Firebase project, Stripe account

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example env file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   Required keys: `VITE_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_KEY` (inline JSON), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

3. Start the dev server (frontend + backend together):
   ```bash
   npm run dev
   ```

The app runs at `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK JSON (single-line) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_STARTER_PRICE_ID` | Stripe Price ID for the Starter pack |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for the Pro pack |
| `VITE_POSTHOG_KEY` | PostHog project API key |
