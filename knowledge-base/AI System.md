## AI System

ZenDoc uses AI for risk scoring and crisis triage support in the mobile app.

### Signal Inputs

- Heart rate variability
- Stress level
- Sleep anomalies
- Activity anomalies
- Session context
- Guardian mode status

### Model Goals

- Produce a conservative risk score.
- Separate low, medium, and high-risk states.
- Avoid over-escalation unless the confidence and risk pattern justify it.

### Output Logic

- Low risk: log only.
- Medium risk: notify doctor and guardian when applicable.
- High risk: trigger emergency escalation flow.

### Model Notes

- Use multiple models or signals if helpful, but the final decision should be conservative.
- Track confidence, stability, and alert history.
- Use the average or weighted result only if it improves safety.
