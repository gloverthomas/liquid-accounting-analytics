> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Grok in-product vs Cursor SDK

Two deliberate AI surfaces — **do not conflate** in Q&A.

---

## Side-by-side

| | **Grok in Core / Reporting** | **Cursor SDK in liquid-workflow** |
| --- | --- | --- |
| **User** | Accountant persona in demo UI | Engineer / operator via Linear + workflow |
| **Entry** | AI Assistant right rail | Linear In Progress / In Review, `/trigger`, `/implement` |
| **API** | xAI via loopback BFF `POST /api/v1/assistant/chat` | `@cursor/sdk` `Agent.create()` |
| **Secrets** | Server-side `XAI_API_KEY` | `CURSOR_API_KEY` on workflow host |
| **Output** | Chat reply (fixture if no key) | Plan text, eval artifact, GitHub PR |
| **Hero ticket** | **LIQ-24** (Reporting broken / parity) | Same ticket drives SDK plan/implement |
| **Governance** | Product UX, allowlisted context | Eval, specialists, write-gate, PR-only |

**SpaceX nod:** In-product assistant uses **Grok**; assignment SDK requirement satisfied by **workflow**, not by replacing the finance assistant with Cursor chat.

---

## Liquid Insights (third surface)

| | **Liquid Insights** |
| --- | --- |
| **User** | Engineers asking ops/delivery questions |
| **Model** | Grok over **retrieved** Linear/GitHub/PostHog/Sentry/workflow bundles |
| **Pattern** | [Insights 0001](https://linear.app/liquid-accounting/document/decision-insights-0001-the-server-retrieves-grok-only-writes-up-e5d91c627e24) retrieve → write → cite |
| **Not** | A replacement for SDK implement |

---

## Sample questions

1. **Why two models/vendors paths?** Different trust boundaries and UX; same company story.
2. **Could the assistant use Cursor instead of Grok?** Possible product choice; assignment asked for Grok API **and/or** SDK — Liquid uses both distinctly.
3. **Does Insights trigger implement?** Confirm-gated Linear moves and workflow approve — not autonomous implement from chat.

*Last updated: 2026-09-26.*
