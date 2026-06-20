# Doca (ZenDoc / Suwa)

**Doca** (product name **ZenDoc**, internal monorepo name **Suwa**) is a privacy-first mental health and telehealth platform connecting patients anonymously with licensed doctors and therapists. Built as a polyglot monorepo using Turborepo + Bun.

## Surfaces

| Surface | Tech | Audience |
|---------|------|----------|
| **Mobile** | Expo + React Native + Expo Router | Patients (self and guardian modes) |
| **Web** | TanStack Start + React + TanStack Router | Doctors and admins |
| **API** | Hono v4 + oRPC (Cloudflare Workers) | Backend services |

## Features

### Patient (Mobile)
- **Onboarding** – Mode selection (self / guardian), alias setup
- **Wellness Activities** – Breathing, yoga, grounding, journaling, body scan
- **Doctor Discovery** – Browse anonymized doctor profiles
- **Plan-Based Booking** – Trial access + subscription booking with session redemption
- **Smartwatch Integration** – Health telemetry ingestion for monitoring
- **Crisis Safety System** – Real-time risk detection → low/medium/high escalation with doctor/guardian/emergency routing
- **Profile Management** – Alias-based identity, guardian linkage

### Doctor (Web)
- **Dashboard** – Appointment queue, session management, history
- **Schedule Management** – Open/block/session interval arithmetic with overlap detection
- **Patient Records** – Alias-based lookup
- **Crisis Review** – Alert workflow and escalation audit
- **Profile & Credentials** – R2-hosted media (portraits, qualifications, videos)

### Admin (Web)
- **User & Doctor Administration** – Approval, moderation
- **Consent & Audit Review** – Compliance oversight
- **Crisis Event Review** – Escalation monitoring
- **Platform Configuration** – Operational controls, plan oversight

### AI / ML Services
- **Stress Predictor Service** – FastAPI + TensorFlow risk scoring
- **Model Trainer** – scikit-learn / TensorFlow pipeline with Kaggle datasets
- **Map Scraper** – Python data ingestion via Scrapling
- **YouTube Suggestion Scraper** – Content scraping via yt-dlp

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web Framework** | TanStack Start + Vite |
| **Mobile** | Expo SDK 55 + Expo Router |
| **Styling (web)** | Tailwind CSS v4 + shadcn/ui (base-lyra) |
| **Styling (mobile)** | NativeWind v5 (neo-brutalist) |
| **Server** | Hono v4 (Cloudflare Workers) |
| **API Layer** | oRPC (end-to-end type-safe RPC with OpenAPI) |
| **Database** | Drizzle ORM + SQLite / Turso / Cloudflare D1 |
| **Auth** | Clerk (`@clerk/tanstack-react-start` + `@clerk/expo`) |
| **Payments** | Stripe Connect ($50/session doctor payouts) |
| **State** | TanStack React Query v5 |
| **Charts** | Recharts v3 |
| **Maps** | MapLibre GL + `@vis.gl/react-maplibre` |
| **Video Calls** | LiveKit |
| **Forms** | React Hook Form + Zod |
| **Notifications** | Sonner (web) |
| **Icons** | Lucide React / Lucide React Native |
| **Dates** | date-fns v4 |
| **ML / Data** | Python 3.12, TensorFlow, scikit-learn, FastAPI (uv-managed) |
| **Infrastructure** | Cloudflare (Workers, D1, R2, KV, AI) via Alchemy |

## Project Structure

```
doca/
├── apps/
│   ├── web/                         # Web app (doctors + admin)
│   ├── native/                      # Mobile app (patients)
│   ├── server/                      # API server (Hono + oRPC)
│   ├── stress-predictor-service/    # FastAPI stress risk scorer
│   ├── model-trainer/               # ML model training pipeline
│   ├── map-scraper/                 # Map data ingestion
│   └── youtube-suggestion-scraper/  # YouTube content scraper
├── packages/
│   ├── api/          # Shared oRPC routers & contracts
│   ├── db/           # Drizzle schema, migrations, queries
│   ├── ui/           # 55+ shadcn/ui components (@base-ui/react)
│   ├── env/          # Type-safe env vars per runtime
│   ├── infra/        # Alchemy Cloudflare deployment
│   ├── config/       # Shared TS & tooling config
│   ├── app-info/     # App metadata
│   └── crypto/       # Crypto & security utilities
├── knowledge-base/   # Obsidian product documentation
├── turbo.json
├── biome.jsonc       # Ultracite / Biome linting
└── package.json
```

## API Design (oRPC)

| Router | File | Auth | Purpose |
|--------|------|------|---------|
| `publicRouter` | `public.ts` | Mixed | Health check, doctor discovery |
| `doctorRouter` | `doctor.ts` | Protected | Doctor profile, schedule management |
| `patientRouter` | `patient.ts` | Protected | Onboarding, guardian management |
| `adminRouter` | `admin.ts` | Admin role | Doctor approval, oversight |
| `bookingRouter` | `booking.ts` | Protected | Session booking, Stripe Connect |
| `doctorFilesRouter` | `doctor-files.ts` | Mixed | File CRUD with R2 |

## Database (Drizzle + SQLite)

| Table | Key | Description |
|-------|-----|-------------|
| `doctor_profiles` | `userId` | Doctor profile with JSON string arrays |
| `doctor_sessions` | `id` | Booking sessions with status/payout tracking |
| `doctor_files` | `id` | Media files (portraits, qualifications, videos) |
| `doctor_schedule_entries` | `id` | Schedule blocks (open/block/session) |
| `doctor_education_entries` | `id` | Education history |
| `patient_profiles` | `userId` | Alias profiles with guardian linkage |
| `guardian_profiles` | `userId` | Guardian contact info |

## Getting Started

```bash
# Install dependencies
bun install

# Set up database
bun run db:push

# Start development
bun run dev
```

### Environment Variables

| File | Variables |
|------|-----------|
| `apps/web/.env` | `VITE_SERVER_URL`, `VITE_WEB_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` |
| `apps/native/.env` | `EXPO_PUBLIC_SERVER_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `apps/server/.env` | `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `CORS_ORIGIN` |
| `packages/infra/.env` | Deployment secrets |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps in dev mode |
| `bun run dev:web` | Web app only |
| `bun run dev:native` | Mobile app only |
| `bun run dev:server` | API server only |
| `bun run dev:stress` | Stress predictor service |
| `bun run build` | Build all apps |
| `bun run check-types` | TypeScript type checking |
| `bun run db:push` | Push Drizzle schema to DB |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run stripe:listen` | Listen for Stripe webhooks |
| `bun run deploy` | Deploy to Cloudflare via Alchemy |
| `bun run destroy` | Tear down Cloudflare resources |
| `bun x ultracite check` | Lint & format check |
| `bun x ultracite fix` | Auto-fix lint & format |

## Deployment

Infrastructure is managed as code via [Alchemy](https://alchemy.run/) (`packages/infra/`). Targets Cloudflare Workers with D1 database, R2 storage, KV namespaces, and AI bindings.

```bash
bun run deploy   # Deploy server + web
bun run destroy  # Teardown
```

## Design System

- **Mobile**: Neo-brutalist – thick black borders, offset shadows, red (#a22a2a)/black/white palette, Satoshi font, bold outlined icons
- **Web**: Clean dashboard – OKLCH color tokens, Figtree font, dense layouts optimized for laptop/tablet

## Auth & Roles

Clerk-powered with `publicMetadata.role` — `user`, `doctor`, `admin`, `pending-doctor`. Token bridge component injects Clerk session into oRPC client headers. Protected procedures enforce auth via `requireAuth` middleware.

## Product Rules

- Users are anonymous by default (alias-based identity)
- Mobile is patients only; doctors use web
- Doctor onboarding on web; patient onboarding on mobile
- Crisis handling is conservative, fast, and auditable
- `user_id` is the Clerk user ID — primary key to prevent duplicates
