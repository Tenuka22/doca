# ZenDoc Product

ZenDoc is an Android mobile mental health and wellness app that connects users anonymously with licensed doctors and therapists. The product combines privacy-first onboarding, wellness activities, smartwatch health integration, session booking, credit-based pricing, and a high-priority crisis safety system.

## What The Product Does

- Lets users register in self mode or relative/guardian mode.
- Lets users book therapy anonymously using alias-based profiles.
- Provides guided wellness activities like breathing, yoga, grounding, journaling, and body scan.
- Connects optional smartwatch data for health monitoring and crisis detection.
- Uses credit-based session plans and a free trial with payment info required.
- Captures consent and crisis logs for safety and audit purposes.
- Supports a bold New Brutalism mobile UI with high contrast and thick borders.

## System Flow

1. A user opens the Android app.
2. The user lands on the marketing home screen, or goes straight into onboarding if they tap a CTA.
3. Onboarding collects mode selection, relative details if needed, and alias setup.
4. The user optionally connects a smartwatch.
5. Logged-in users enter the bottom-tab app shell with Home, Activities, Doctors, and Profile.
6. Credit plans or trial access unlock bookings.
7. Crisis monitoring uses smartwatch signals and app state to trigger alerts and escalation.

## Current Architecture

### Frontend

- Android mobile app.
- Bottom tab navigation for Home, Activities, Doctors, and Profile.
- Full-screen animated activity pages.
- Brutalist landing, pricing, and contact screens for logged-out users.

### Backend

- Mobile app backend provides auth, booking, session history, credits, notifications, and crisis escalation.
- Crisis and health data are stored with strict privacy controls.

### Shared Logic

- Alias-based identity.
- Relative/guardian relationships.
- Subscription credits and trial access.
- Smartwatch telemetry ingestion.

## Identity And Authorization

- Users can register for themselves or as a relative/guardian.
- Public-facing profiles use aliases only.
- Real names are not required publicly.
- Doctors are shown anonymously in previews.
- Guarded booking and session access depend on credits or trial status.

## Screen Model

### Logged Out

- Marketing home
- Pricing
- Contact us
- Doctor preview
- Sign up / sign in

### Onboarding

- Mode selection
- Relative details
- Alias setup
- Smartwatch connection

### Logged In

- Home / dashboard
- Activities library
- Doctor list and doctor profile
- Booking flow
- My profile / patient page
- Crisis alert screen

## UI Strategy

- New Brutalism visual language.
- Heavy grotesk sans-serif typography.
- Thick black borders and hard offset shadows.
- Red, black, and white only.
- Bold outlined icons only.
- Deliberate whitespace to preserve trust and clarity.

## Core Data Model

The app model includes the foundation for:

- users
- alias profiles
- relative or guardian relationships
- doctor profiles
- subscription plans
- user credits
- appointments
- session history
- activity completion logs
- smartwatch connections
- crisis events
- consent records

### What Each One Means

- users: app account and mode ownership.
- alias profiles: public identity used throughout the app.
- relative or guardian relationships: linked monitoring profile.
- doctor profiles: anonymized clinician records.
- subscription plans: credit-based pricing tiers and trial access.
- user credits: bookable session balance.
- appointments: booked doctor sessions.
- session history: past consultations and durations.
- activity completion logs: completed wellness content.
- smartwatch connections: health integration status.
- crisis events: escalation audit trail.
- consent records: onboarding and safety consent tracking.

## API Model

### Current Procedures

- app health
- onboarding profile setup
- alias and mode updates
- relative profile updates
- doctor discovery
- booking and credit redemption
- session history retrieval
- crisis signal ingestion

### Authorization Pattern

- Public access for marketing, pricing, and doctor previews.
- Authenticated access for dashboard, bookings, profile, and activity tracking.
- Guardian access to linked relative data where consent allows.

## Crisis System

The crisis system uses smartwatch biometrics and app context to detect risk patterns.

- Low-risk events are logged to the dashboard.
- Medium-risk events notify the assigned doctor and guardian when applicable.
- High-risk events automatically escalate to emergency services or a local crisis line.
- Crisis alerts use a full-screen bold warning state.
- Users can dismiss low-level alerts with a reason log.

## Current Implementation Status

- Product direction is mobile-first and Android-only.
- The public marketing flow and logged-in tab shell are the core experience.
- Credit-based booking, smartwatch integration, and crisis escalation are product requirements.
- Privacy and anonymity are required throughout the app.

## Important Product Rules

- Anonymity is the default public identity model.
- The app must support self mode and relative or guardian mode.
- Doctor identities shown to users are anonymized.
- Crisis handling must be fast, clear, and auditable.
- The brutalist design must still feel trustworthy and readable.
