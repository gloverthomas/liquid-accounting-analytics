> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Q&A catalog (quick reference)

Expanded from SpaceX brief §15 + handbook depth. Use with Liquid Insights for cited answers.

---

## SDK & workflow

| Question | Answer |
| --- | --- |
| Why Cursor SDK vs a skill? | Persisted control plane: webhooks, eval, routing, PR-only, cross-repo cloud sandboxes |
| Why not a Python script calling Claude? | Same gap — no Cursor cloud agent lifecycle + SDK PR integration |
| Do agents merge? | **No** — humans after Bugbot + CI |
| Is eval an MCP? | **No** — `harness.ts` keyword rubric |
| What triggers plan? | Linear **In Progress** or `/trigger` |
| What triggers implement? | **In Review** after approve + eval pass |
| Does `/signal` start agents? | **No** — Slack + Linear Todo triage only |

---

## Architecture & repos

| Question | Answer |
| --- | --- |
| Why two repos? | Real Liquid constraint; demo fixes seam without big-bang merge |
| Why duplicate `/api/v1/organisation`? | Intentional ([Core 0002](https://linear.app/liquid-accounting/document/decision-core-0002-the-organisation-contract-is-duplicated-on-purpose-a3e9361a9b32)); SDK convergence classifies later |
| Why loopback BFF per app? | Secrets off browser; demo token pattern |
| Shared BFF? | **Not yet** — eval rejects “shared BFF” plan language |

---

## Models & quality

| Question | Answer |
| --- | --- |
| Who picks models? | `models.ts` policy + env overrides |
| Planner vs implementer model? | Intelligence vs balanced — [13 · Routing](https://linear.app/liquid-accounting/document/13-interview-prep-model-routing-qanda-a73e9b66315c) |
| Unit vs E2E? | `assistant-unit` fast seam; Playwright parity + proof artifacts |
| Bugbot vs eval? | Independent layers — plan rubric vs PR diff AI review |

---

## Product & observability

| Question | Answer |
| --- | --- |
| PostHog in demo? | Narrate detection; don’t tour dashboards in 45 min |
| Sentry role? | Signal → curated ticket; Insights can aggregate counts |
| Grok vs SDK? | Product chat vs migration agents — [15 · Grok vs SDK](https://linear.app/liquid-accounting/document/15-interview-prep-grok-in-product-vs-cursor-sdk-f4a4c98f7eed) |
| Production Liquid? | **Replica** — governed pattern to productionise |

---

## Meta

| Question | Answer |
| --- | --- |
| Where is docs source of truth? | GitHub handbook 00–06 auto-sync; 07–21 manual sync ([documentation-sync](https://github.com/gloverthomas/liquid-accounting-analytics/blob/main/docs/handbook/documentation-sync.md)) |
| Ask the bot? | [insights.liquid-accounting.world](https://insights.liquid-accounting.world) |

*Last updated: 2026-09-26.*
