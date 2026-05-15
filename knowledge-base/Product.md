# ZenDoc Product

ZenDoc is a licensed digital privacy focused therapy platform. The product combines patient privacy, therapist verification, booking and video sessions, subscription billing, and a high-priority crisis safety system.

## What The Product Does

- Lets patients book therapy anonymously or with revealed identity when required.
- Lets therapists verify their qualifications and manage availability.
- Lets admins approve therapist credentials and manage user roles.
- Runs live video/audio therapy sessions through LiveKit.
- Tracks subscription access and session limits.
- Captures consent and crisis logs for safety and audit purposes.
- Uses animated client-facing experiences with GSAP on public, patient, and therapist routes.

## System Flow

1. A user opens the Next.js web app.
2. Clerk handles authentication and session tokens.
3. `apps/web/src/proxy.ts` protects route groups.
4. The web app calls the oRPC API through `apps/web/src/utils/orpc.ts`.
5. `apps/server/src/index.ts` exposes `/rpc` and `/api-reference`.
6. `packages/api` applies auth and role checks.
7. `packages/db` reads and writes Cloudflare D1 through Drizzle.
8. The route group chosen depends on role: public, patient, doctor, or admin.

## Current Architecture

### Frontend

- `apps/web` is the Next.js application.
- `apps/web/src/app/layout.tsx` mounts `ClerkProvider`, theme support, and query support.
- `apps/web/src/components/gsap-provider.tsx` registers GSAP plugins and provides animation scope.
- `apps/web/src/components/cl/*` holds route-specific layout and animation primitives.

### Backend

- `apps/server` is the Hono worker entrypoint.
- It wires oRPC RPC handling and OpenAPI reference handling.
- CORS is configured for the web app origin.

### Shared Packages

- `packages/api` contains auth helpers, role guards, and API routers.
- `packages/db` contains the D1 schema and Drizzle client.
- `packages/ui` contains shared shadcn-style primitives.
- `packages/env` contains environment typing.
- `packages/infra` holds Cloudflare/Alchemy deployment bindings.

## Identity And Authorization

- Clerk is the authentication source of truth.
- The app stores the internal role in the `users` table.
- Roles are `patient`, `doctor`, and `admin`.
- Admins can change user roles.
- Doctors need verification before they can be treated as approved clinicians.
- Public patient anonymity is stored per user and per appointment.

## Route Model

### Public

- `/` landing page
- `/about`
- `/therapy`
- `/crisis-safety`
- `/pricing`
- `/therapists`
- `/therapist/[id]`

### Patient

- `/dashboard`
- `/book`
- `/book/[doctorId]`
- `/session/[id]`
- `/sessions`
- `/settings`
- `/billing`
- `/crisis-log`

### Doctor

- `/doctor/dashboard`
- `/doctor/schedule`
- `/doctor/reservations`
- `/doctor/sessions`
- `/doctor/profile`
- `/doctor/settings`

### Admin

- `/admin/dashboard`
- `/admin/therapists`
- `/admin/users`
- `/admin/crisis-events`
- `/admin/billing`
- `/admin/settings`

## UI Strategy

- Public, patient, and doctor routes use GSAP-driven animation primitives.
- Admin routes use standard UI without the marketing motion layer.
- Shared components live in `components/cl` and compose `packages/ui` primitives.
- The app uses route shells to keep the experience role-aware.

## Core Database Model

The D1 schema now includes the foundation for:

- `users`
- `patient_private_data`
- `doctor_qualifications`
- `subscription_plans`
- `user_subscriptions`
- `schedules`
- `schedule_blocks`
- `appointments`
- `session_usage`
- `crisis_events`
- `consent_records`

### What Each One Means

- `users`: Clerk-linked identity, role, anonymity, availability, auto-accept.
- `patient_private_data`: encrypted private profile data.
- `doctor_qualifications`: therapist verification workflow.
- `subscription_plans`: internal plan mapping for billing.
- `user_subscriptions`: user plan state and session usage.
- `schedules`: recurring availability blocks.
- `schedule_blocks`: blocked periods and exceptions.
- `appointments`: booking, anonymity, room data, and lifecycle.
- `session_usage`: session consumption records for billing.
- `crisis_events`: crisis audit trail.
- `consent_records`: required signup and safety consent tracking.

## API Model

### Current Procedures

- `healthCheck`
- `privateData`
- `users.getProfile`
- `users.updateProfile`
- `users.updateRole`
- `users.getPrivateData`
- `users.updatePrivateData`

### Authorization Pattern

- `publicProcedure` for public endpoints.
- `protectedProcedure` for authenticated endpoints.
- `requireRole(...)` for role-based access.
- `requireAdmin`, `requireDoctor`, and `requirePatient` are the current role helpers.

## Crisis System

The full crisis system is still to be built, but the product design is clear:

- Client-side audio monitoring detects risk spikes.
- A triage endpoint receives compressed crisis signals.
- AI classifies urgency.
- Audio, snapshots, and transcripts are stored with encryption and TTL.
- Therapist alerts are pushed immediately.
- If the threshold is severe enough, the system escalates to an authority voice agent.

## Current Implementation Status

- Phase 1 foundation is complete.
- GSAP is installed and the animation layer exists.
- Route groups are in place for public, patient, doctor, and admin paths.
- Clerk auth and role guards are in place.
- The first real API router exists.
- The D1 schema foundation exists.
- LiveKit, Twilio, billing, and crisis automation are still future phases.

## Important Product Rules

- Patient anonymity is a feature, not a default-only UI state.
- Role assignment is admin-driven.
- Crisis handling must be fast and auditable.
- Client-facing motion should support clarity, not obscure critical actions.
- Admin interfaces should stay conventional and easy to audit.
