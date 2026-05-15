### Technical Design Document v1.0

---

## 1. Overview

ZenDoc is an affordable telehealth platform connecting patients with therapists. This document describes the **Crisis Safety System (CSS)** - the end-to-end pipeline that detects, triages, and escalates patient distress events in real time, with a hard target of **under 10 seconds from spike detection to authority notification**.

The system is designed around three core principles:

- **Patient anonymity is preserved** - a user may hide their video from the therapist at any time, but the front camera still captures environmental snapshots for crisis use only, as consented at signup.
- **Data minimalism** - all crisis data is encrypted, never sold, and auto-deleted after 24 hours unless an active escalation is open.
- **Human + AI in the loop** - the therapist is always alerted first, but the system escalates automatically if the therapist does not respond within the timeout window.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (Browser / Mobile App)                                   │
│                                                                  │
│   LiveKit Room                                                   │
│   ├── Video track (shown to therapist only if user allows)       │
│   ├── Audio track (always active for session)                    │
│   ├── Web Audio AnalyserNode  ──► Spike Detector                 │
│   ├── Canvas API  ──► 64×64 JPEG snapshot (front camera)         │
│   └── MediaRecorder ring buffer  ──► Last 30s opus audio clip    │
│                                              │                   │
│                                        On spike fire             │
│                                              │                   │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                                        POST /crisis-triage
                                               │
┌──────────────────────────────────────────────▼──────────────────┐
│  BACKEND (Node.js / Python)                                      │
│                                                                  │
│  Crisis Triage Service                                           │
│  ├── Receives: image (base64) + audio clip + session metadata    │
│  ├── Calls Claude API → CRISIS / FALSE_ALARM classification      │
│  ├── On FALSE_ALARM → log and discard, resume monitoring         │
│  └── On CRISIS → trigger Layer 3 simultaneously                  │
│                                                                  │
│  Temporary Storage (Redis, TTL 24h, AES-256 encrypted)           │
│  ├── user_id (hashed)                                            │
│  ├── location coordinates (from consented geolocation)           │
│  ├── session_id                                                  │
│  ├── crisis_snapshot (image + audio reference)                   │
│  └── consent_record_id                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                    │                        │
          ┌─────────▼──────┐     ┌───────────▼──────────┐
          │ Therapist Alert│     │  AI Voice Agent       │
          │ (WebSocket push)│    │  (Twilio + LLM)       │
          └─────────┬──────┘     └───────────┬──────────┘
                    │                        │
          Therapist confirms           Calls authority
          or times out (8s)            speaks situation
                    │                  + location
                    └──────┬─────────────────┘
                           │
                    Location + info
                    released to authority
```

---

## 3. The 10-Second Guarantee

The entire pipeline from spike detection to authority contact must complete in **≤ 10 seconds**. Time is allocated as follows:

| Step                                               | Budget    |
| -------------------------------------------------- | --------- |
| Spike detected → audio/image captured and uploaded | ~1s       |
| Claude triage API call (image + audio transcript)  | ~2s       |
| Therapist alert delivered via WebSocket            | ~0.5s     |
| Therapist response window                          | **5s**    |
| If no response → auto-escalate → voice agent dials | ~1.5s     |
| **Total (no therapist response path)**             | **~10s**  |
| **Total (therapist confirms path)**                | **~4.5s** |

> **Both paths exist.** If the therapist dismisses the alert within 5 seconds, escalation is cancelled. If the therapist confirms it, escalation fires immediately. If the therapist does not respond within 5 seconds, the system escalates automatically. The therapist can still cancel up until the moment the voice agent completes its opening statement to the authority.

---

## 4. Layer 1 - Detection (Client-Side)

### 4.1 Audio Spike Detector

Runs continuously in the browser using the Web Audio API.

```javascript
const audioCtx = new AudioContext()
const source = audioCtx.createMediaStreamSource(livekitAudioTrack)
const analyser = audioCtx.createAnalyser()
analyser.fftSize = 256
source.connect(analyser)

const dataArray = new Uint8Array(analyser.frequencyBinCount)

function monitor() {
  analyser.getByteFrequencyData(dataArray)
  const avg = dataArray.reduce((a, b) => a + b) / dataArray.length
  if (avg > SPIKE_THRESHOLD) triggerCapture()
  requestAnimationFrame(monitor)
}
```

`SPIKE_THRESHOLD` starts at 160/255 (configurable per therapist). A sustained spike for more than 1.5 seconds fires the capture - single-frame spikes (door slam, cough) are ignored.

### 4.2 Audio Ring Buffer

A 30-second rolling buffer is maintained using `MediaRecorder` writing to a circular array of 3-second blobs. When capture fires, the last 30 seconds are assembled and uploaded as a single opus file (~40–60 KB).

### 4.3 Video Snapshot

**Important behaviour:** The front camera is always captured for crisis purposes, regardless of whether the user has chosen to hide their video from the therapist. This is explicitly consented to at signup (see Section 8 - Consent).

Every 3 seconds during a session, a silent canvas capture runs:

```javascript
// Runs silently - not shown to therapist
const canvas = document.createElement('canvas')
canvas.width = 64
canvas.height = 64
const ctx = canvas.getContext('2d')
ctx.drawImage(videoElement, 0, 0, 64, 64)
const snapshot = canvas.toDataURL('image/jpeg', 0.5) // ~3–5 KB
```

The latest snapshot is held in memory. Only uploaded when a spike fires.

---

## 5. Layer 2 - AI Triage (Backend)

### 5.1 What Gets Sent to Claude

When a spike fires, the backend receives:

- `image`: base64 JPEG, 64×64px, latest environmental frame
- `audio_transcript`: Whisper transcription of the 30s clip (runs in ~1s on Whisper tiny)
- `session_meta`: session ID, timestamp, therapist ID

### 5.2 Triage Prompt

```
You are a crisis safety classifier for a telehealth platform.

You will receive:
1. A low-resolution image of the patient's environment
2. A transcript of the last 30 seconds of audio

Your job is to determine whether this is a GENUINE HUMAN DISTRESS EVENT
or a FALSE ALARM (background TV, dog barking, dropped object, etc.).

Respond with exactly one of:
  CRISIS – [one sentence reason]
  FALSE_ALARM – [one sentence reason]

Be conservative: only return CRISIS if there is strong evidence of
human distress, shouting, or threatening language directed at a person.
```

### 5.3 Decision Routing

| Claude Output | Action |
|---|---|
| `FALSE_ALARM` | Log event with reason, discard snapshot, resume monitoring |
| `CRISIS` | Simultaneously trigger therapist alert + voice agent (Layer 3) |

All triage decisions are logged to an audit table (non-PII: session_id, result, reason, timestamp) permanently for safety review.

---

## 6. Layer 3 - Simultaneous Escalation

### 6.1 Therapist Alert (WebSocket Push)

The therapist receives a full-screen overlay immediately:

```
┌─────────────────────────────────────────┐
│  ⚠  CRISIS DETECTED                     │
│                                          │
│  AI confidence: HIGH                     │
│  Reason: Sustained shouting detected     │
│                                          │
│  Location: [city, district]              │
│  Auto-escalating in  5 … 4 … 3 …        │
│                                          │
│  [CONFIRM - escalate now]                │
│  [CANCEL - false alarm]                  │
└─────────────────────────────────────────┘
```

- **Confirm** → fires voice agent immediately, countdown stops
- **Cancel** → aborts escalation, logs therapist cancellation with reason prompt
- **No response in 5s** → auto-escalates

### 6.2 AI Voice Agent

Built with **Twilio Programmable Voice** + an LLM for natural speech generation. The agent operates primarily in **English** with **Sinhala support** selectable per region.

**Call script (English):**

> *"Hello, this is an automated safety alert from ZenDoc Telehealth. We have detected a potential crisis situation involving one of our patients. The patient's last known location is [district], [city]. Our therapist on the session has confirmed this is a genuine emergency. I will now share the patient's full location and session reference code with you. Please confirm you are ready to receive. [pause] Location: [coordinates / address]. Reference: [session_id]. This call is being logged. Thank you."*

**Sinhala fallback** is triggered automatically if the dialled number is registered under a Sri Lanka regional authority known to prefer Sinhala. ElevenLabs multilingual  handles Sinhala synthesis.

### 6.3 What Information Is Released to Authorities

Information is released **only after the voice agent receives verbal confirmation** from the receiving party, or after the script completes (whichever is first):

- GPS coordinates (lat/long) from consented geolocation
- City and district (human-readable)
- Session reference ID (for follow-up with ZenDoc support)
- Timestamp of event
- Therapist's name and contact number (for authority callback)

**Not released:** patient name, patient account details, session audio/video, biometric data. The patient is identified only by location and session reference.

---

## 7. Data Storage and Retention

### 7.1 Temporary Crisis Store (Redis)

```
Key:   crisis:{session_id}:{timestamp}
TTL:   24 hours
Encryption: AES-256-GCM, key stored in AWS KMS / Vault

Fields:
  - location_lat / location_lng  (from consented geolocation)
  - snapshot_ref                 (S3 key, also TTL 24h)
  - audio_ref                    (S3 key, also TTL 24h)
  - triage_result                (CRISIS / FALSE_ALARM)
  - triage_reason                (Claude's one-line output)
  - escalation_status            (pending / confirmed / cancelled / auto)
  - consent_record_id            (reference to signup consent log)
```

### 7.2 Permanent Audit Log (Postgres)

Non-PII only. Retained indefinitely for safety and regulatory review:

```
crisis_events table:
  - id
  - session_id (hashed)
  - event_timestamp
  - triage_result
  - escalation_path  (therapist_confirmed / therapist_cancelled / auto)
  - authority_contacted  (boolean)
  - time_to_escalation_ms
  - consent_record_id
```

### 7.3 Data Policy Summary

| Data type | Stored | Retention | Sold |
|---|---|---|---|
| Location coordinates | Redis only | 24h TTL | Never |
| Audio clip | S3 (encrypted) | 24h TTL | Never |
| Video snapshot | S3 (encrypted) | 24h TTL | Never |
| Triage result + reason | Postgres (no PII) | Indefinite | Never |
| Biometric (IoT, future) | Redis only | Session + 1h | Never |
| Consent records | Postgres | Indefinite | Never |

---

## 8. Consent Framework

### 8.1 At Signup (Required - Cannot Be Skipped)

Users must explicitly accept the following, as separate checkboxes:

1. *"I consent to ZenDoc capturing low-resolution environmental images from my front camera during sessions for the purpose of crisis detection, even when I have chosen to hide my video from my therapist."*

2. *"I consent to ZenDoc recording and storing the last 30 seconds of session audio during active calls for the purpose of crisis detection. This audio is deleted within 24 hours unless an emergency escalation is active."*

3. *"I consent to ZenDoc sharing my location and session information with local emergency authorities in the event that a crisis is confirmed by my therapist or by automated detection."*

4. *"I understand that my therapist may initiate emergency contact on my behalf without my real-time approval if a crisis is detected."*

Each consent is stored with: user_id (hashed), timestamp, app version, IP country code.

### 8.2 What the User Can and Cannot Control

| Setting | User Can Change | Notes |
|---|---|---|
| Hide video from therapist | Yes, any time | Crisis snapshots still captured |
| Mute microphone | Yes, any time | Spike detection pauses; user is warned |
| Withdraw crisis consent | Only at account deletion | Cannot be toggled mid-session |
| View their own crisis log | Yes, in account settings | Shows events and outcomes, no raw data |

---

## 9. Anonymity Model

The patient-to-therapist anonymity system works as follows:

- **Display name:** User may choose a pseudonym at signup. Therapist never sees legal name unless user opts in.
- **Video:** User may toggle off at any time. Therapist sees a placeholder tile.
- **Audio:** Always on during session (required for therapy). User may mute temporarily.
- **Front camera (crisis only):** Always active at the OS level with user consent. The feed is never sent to the therapist - it goes only to the crisis triage pipeline if a spike fires.
- **Location:** Captured via `navigator.geolocation` at session start, stored encrypted in Redis for session duration, released only on confirmed crisis.

> **The therapist never receives the patient's legal identity, location, or crisis snapshots unless an escalation fires.** Even in an escalation, the therapist sees only the city/district, not precise coordinates.

---

## 10. Tech Stack

| Component | Technology |
|---|---|
| Video / audio rooms | LiveKit Cloud (free tier → paid at scale) |
| Frontend | React + LiveKit React SDK |
| Backend | Node.js / Express (or Python FastAPI) |
| AI triage | Claude API (claude-sonnet-4-20250514) |
| Audio transcription | OpenAI Whisper (tiny model, self-hosted or API) |
| Voice agent | Twilio Programmable Voice + ElevenLabs (Sinhala/English) |
| Temporary storage | Redis (Upstash serverless, free tier available) |
| Permanent storage | Supabase Postgres |
| File storage | AWS S3 or Supabase Storage (24h lifecycle rule) |
| Encryption | AES-256-GCM, keys in AWS KMS or HashiCorp Vault |
| Auth | Supabase Auth (email + phone OTP) |
| Payments (Phase 3) | Stripe Connect |
| IoT bridge (future) | MQTT broker (HiveMQ or Mosquitto) → WebSocket relay |

---

## 11. IoT Biometrics - Future Phase

The following is planned for a future phase and is **not part of the initial build**. It is documented here so the architecture is designed to accommodate it.

### 11.1 Supported Signals

- **Heart rate (HR)** - beats per minute
- **Heart rate variability (HRV)** - RMSSD metric; the most reliable real-time stress indicator. A sudden drop in HRV often precedes a rage or panic episode by 15–30 seconds, giving earlier warning than audio alone.
- **Blood oxygen (SpO2)** - detects hyperventilation or breath-holding under extreme distress
- **Skin conductance (EDA)** - if supported by device (e.g. Empatica E4)

### 11.2 Compatible Devices (Planned)

- Polar H10 (HR + HRV, Bluetooth LE)
- Fitbit Sense / Pixel Watch (HR + SpO2, REST API)
- Custom ESP32 + MAX30102 sensor (open hardware option for lowest cost)

### 11.3 How It Feeds the Crisis Pipeline

Biometric data arrives via MQTT → WebSocket relay to the backend. It is held in Redis (session duration + 1 hour). It feeds the triage model as an **additional signal**, not a replacement:

```
Spike detected + HRV drop > 30% in last 60s
  → Triage confidence multiplier applied
  → Can lower SPIKE_THRESHOLD automatically for this session
```

Biometric data is shown to the therapist as a live sidebar during the session - not raw numbers, but a simple **calm / elevated / high stress** indicator derived from HRV. This helps the therapist adjust their approach in real time, not just in crisis moments.

### 11.4 Consent Addition (IoT)

An additional consent item is added at device pairing:

*"I consent to sharing real-time biometric data from my wearable device with my therapist during sessions in the form of a stress indicator. Raw biometric values are never stored permanently and are deleted within 1 hour of session end."*

---

## 12. Key Risks and Mitigations

| Risk | Mitigation |
|---|---|
| AI triage misclassifies a genuine crisis as false alarm | Therapist is always alerted regardless of triage result; triage only affects auto-escalation timing |
| Voice agent call goes unanswered | Retry once after 8s; if still unanswered, fall back to SMS with location to the authority number |
| User mutes mic during a crisis | Warning shown: "Spike detection paused while muted." Therapist can still manually escalate |
| Location permission denied by user | Session start blocks until location is granted (required by consent) or user accepts "location unavailable" mode with reduced crisis capability |
| Sinhala TTS quality inadequate | Fallback to pre-recorded human voice clips for the authority call script in Sinhala |
| Redis TTL expires before escalation resolves | Escalation events extend TTL to 72h automatically on confirmation |
| HIPAA / data sovereignty | Host all data in AWS ap-south-1 (Mumbai) or a Sri Lanka-adjacent region; obtain BAA with all vendors |

---

## 13. Glossary

| Term | Meaning |
|---|---|
| CSS | Crisis Safety System (this document) |
| Spike | Audio amplitude exceeding threshold for >1.5 seconds |
| Ring buffer | Rolling 30-second audio store, overwritten continuously |
| Triage | AI classification of spike as CRISIS or FALSE_ALARM |
| TTL | Time-to-live; automatic expiry of stored data |
| HRV | Heart rate variability; key stress biomarker |
| BAA | Business Associate Agreement (HIPAA compliance contract) |
| EDA | Electrodermal activity (skin conductance) |

---

*Document owner: Tenu22 // Claude Collab*
*Last updated: May 2026*
*Version: 1.0 - initial design*
