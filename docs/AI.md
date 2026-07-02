# AI Engine — Architecture

Promax AI foundation — **no API calls in v1**

---

## Overview

The AI Engine provides a capability registry and provider interface for future features. No external AI APIs are called in Version 1.

Registry: `platform/engines/ai/capabilities.ts`

---

## Planned capabilities

| ID | Name | Audience | Status |
|----|------|----------|--------|
| `faq-assistant` | FAQ Assistant | Public | Planned |
| `sponsor-drafting` | Sponsor Proposal Drafting | Committee | Planned |
| `committee-assistant` | Committee Assistant | Committee | Planned |
| `announcement-drafting` | Announcement Drafting | Committee | Planned |
| `meeting-minutes` | Meeting Minute Summarisation | Committee | Planned |
| `social-media-drafting` | Social Media Drafting | Committee | Planned |

Visible in **Dashboard → Announcements** (planned section).

---

## Provider interface

```typescript
type AiProvider = {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
};
```

Future implementations:
- OpenAI GPT
- Anthropic Claude
- Azure OpenAI (enterprise customers)

---

## Integration points

| Surface | Capability |
|---------|------------|
| Public site chat widget | FAQ assistant |
| Dashboard → Announcements | Announcement + social drafting |
| Dashboard → Sponsors | Sponsor deck drafting |
| Dashboard → Tasks | Meeting minutes |

---

## Security & governance

- All AI calls server-side only
- Rate limiting per user / org
- Audit log of prompts and outputs
- Human approval before publish (announcements, social)
- No PII in prompts without consent

---

## Environment variables (future)

```bash
AI_PROVIDER=openai          # or anthropic, azure
OPENAI_API_KEY=sk-xxx       # server only
AI_ENABLED=false            # feature flag
```

---

## Estimated effort

2–3 days per capability once provider and auth are in place.
