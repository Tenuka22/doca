### Technical Design Document v1.0

---

## 1. Overview

ZenDoc is an Android mental health and wellness app connecting users anonymously with licensed doctors and therapists. This document describes the **Crisis Safety System (CSS)**, which detects distress from smartwatch and app signals and escalates by risk level.

The system is designed around three core principles:

- **Patient anonymity is preserved** - users are identified publicly by alias.
- **Data minimalism** - crisis data is encrypted and retained only as needed for safety and audit.
- **Human + AI in the loop** - the system logs risk, alerts the assigned doctor or guardian when applicable, and escalates automatically for severe events.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (Android Mobile App)                                    │
│                                                                  │
│   Smartwatch health feed                                         │
│   ├── Heart rate variability                                    │
│   ├── Stress level                                              │
│   ├── Sleep anomaly signals                                     │
│   └── Activity anomaly signals                                  │
│                                              │                  │
│                                     On risk pattern             │
│                                              │                  │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                                        POST /crisis-triage
                                               │
┌──────────────────────────────────────────────▼──────────────────┐
│  BACKEND                                                         │
│                                                                  │
│  Crisis Triage Service                                           │
│  ├── Receives: smartwatch signals + session metadata            │
│  ├── Evaluates risk score and classification                     │
│  ├── On low risk → log only                                      │
│  ├── On medium risk → notify doctor and guardian                 │
│  └── On high risk → escalate to emergency services              │
│                                                                  │
│  Temporary Storage (encrypted, TTL governed by policy)          │
│  ├── user_id (hashed)                                            │
│  ├── session_id                                                  │
│  ├── smartwatch signal references                                │
│  └── consent_record_id                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                    │                        │
          ┌─────────▼──────┐     ┌───────────▼──────────┐
          │ Doctor / Guardian│   │ Emergency Escalation  │
          │ Alert (push)     │    │ Path (local services) │
          └─────────┬──────┘     └───────────┬──────────┘
                    │                        │
          Doctor acknowledges          Escalates by severity
          or guardian notified         and policy
                    │                  + location
                    └──────┬─────────────────┘
                           │
                    Location + info
                    released if required
```

---

## 3. Risk Levels

| Risk Score | Action |
| --- | --- |
| Below 60% | Monitor only, log to dashboard |
| 60% to 80% | Notify assigned doctor + send alert to guardian if applicable |
| Above 80% to 90% | Automatically contact emergency services or local crisis line |

Low-level alerts can be dismissed with a reason log.

---

## 4. Layer 1 - Detection (Client-Side)

### 4.1 Smartwatch Signal Monitor

Runs continuously on the device using health integration data.

```javascript
function monitorHealth(signals) {
  const riskScore = classifyRisk(signals)
  if (riskScore >= 80) triggerEscalation()
  else if (riskScore >= 60) notifyDoctorAndGuardian()
  else logToDashboard()
}
```

Risk scoring uses heart rate variability, stress level, sleep anomalies, and activity anomalies. Short spikes alone should not trigger severe escalation.

### 4.2 Alert Dismissal Rules

Low-level alerts may be dismissed by the user with a reason log. Medium and high-risk alerts should remain visible and actionable.

---

## 5. Layer 2 - AI Triage (Backend)

### 5.1 What Gets Sent to the Classifier

When a risk event fires, the backend receives:

- smartwatch signal bundle
- session metadata
- guardian linkage status
- relative profile context when applicable

### 5.2 Triage Prompt

```
You are a crisis risk classifier for a mobile mental health platform.

You will receive smartwatch and app context signals.

Your job is to return a severity score and a short reason.

Be conservative. Only return severe escalation when the pattern is sustained and high confidence.
```

### 5.3 Decision Routing

| Output | Action |
|---|---|
| Low risk | Log event and resume monitoring |
| Medium risk | Notify assigned doctor and guardian when applicable |
| High risk | Trigger emergency escalation flow |

All triage decisions are logged to an audit table with non-PII metadata for safety review.

---

## 6. Layer 3 - Simultaneous Escalation

### 6.1 Doctor and Guardian Alert

The assigned doctor receives an immediate alert. If the user is in guardian mode, the guardian also receives an alert when the threshold requires it.

### 6.2 Emergency Escalation

High-severity events trigger automatic contact with emergency services or a local crisis line, following the app's regional policy.

### 6.3 What Information Is Released

Only the minimum required data should be shared for escalation:

- user alias or internal reference
- relevant location details if consented
- session reference
- timestamp of event

Patient real name should not be exposed unless explicitly required by policy or consent.

---

## 7. Data Storage and Retention

### 7.1 Temporary Crisis Store

```
Key:   crisis:{session_id}:{timestamp}
TTL:   policy-defined
Encryption: AES-256-GCM, key stored in approved secrets storage

Fields:
  - risk_score
  - signal_ref
  - triage_result
  - triage_reason
  - escalation_status            (monitor / notified / escalated)
  - consent_record_id            (reference to signup consent log)
```

### 7.2 Permanent Audit Log

Non-PII only. Retained indefinitely for safety and regulatory review:

```
crisis_events table:
  - id
  - session_id (hashed)
  - event_timestamp
  - triage_result
  - escalation_path  (monitor / guardian / doctor / emergency)
  - authority_contacted  (boolean)
  - time_to_escalation_ms
  - consent_record_id
```

### 7.3 Data Policy Summary

| Data type | Stored | Retention | Sold |
|---|---|---|---|
| Smartwatch signals | Temporary store | Policy-defined | Never |
| Triage result + reason | Audit log | Indefinite | Never |
| Consent records | Audit log | Indefinite | Never |

---

## 8. Consent Framework

### 8.1 At Signup (Required - Cannot Be Skipped)

Users must explicitly accept the crisis monitoring consent flow before smartwatch monitoring can be enabled.

### 8.2 What the User Can and Cannot Control

| Setting | User Can Change | Notes |
|---|---|---|
| Smartwatch connection | Yes, any time | Optional feature |
| Crisis monitoring consent | Only at account deletion | Required for monitoring |
| View their own crisis log | Yes, in account settings | Shows events and outcomes |

---

## 9. Anonymity Model

The user-to-doctor anonymity system works as follows:

- **Display name:** User may choose a pseudonym at signup. Doctors and other users see aliases only.
- **Guardian mode:** A relative may be linked under the account when consented.
- **Smartwatch:** Optional and privacy-scoped.
- **Crisis data:** Shared only under the minimum necessary policy.

---

## 10. Tech Stack

| Component | Technology |
|---|---|
| Mobile app | Android |
| Health integration | Wear OS / Google Fit |
| Backend | App API |
| AI triage | Risk classifier service |
| Temporary storage | Encrypted policy-controlled store |
| Permanent storage | Audit log database |

---

## 11. Key Risks and Mitigations

| Risk | Mitigation |
|---|---|
| False positive alert | Keep low-risk alerts dismissible with reason logging |
| Missed severe event | Use multiple signals and conservative thresholds |
| Guardian alert overload | Notify only when threshold is met |
| User confusion during crisis | Full-screen red alert with direct actions |

---

## 12. Glossary

| Term | Meaning |
|---|---|
| CSS | Crisis Safety System |
| HRV | Heart rate variability |
| Risk score | Model output used to decide alert level |
| Guardian mode | Monitoring a relative under the user account |

---

*Document owner: Tenu22 // Claude Collab*
*Last updated: May 2026*
*Version: 1.0 - mobile app aligned design*
