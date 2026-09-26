> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Talking points and one-liners

**Use:** Opening/closing slides, live demo narration, Q&A bridge.

**Sources:** [spacex-interview-project-brief.md](https://github.com/gloverthomas/liquid-accounting-presentation) (Project store copy), [02 · Agent workflow](https://linear.app/liquid-accounting/document/02-the-agent-workflow-end-to-end-09ac594383a7).

---

## Narrative spine (in order)

1. **Personal pain:** Split surfaces, slow lifecycles, defects reaching customers.
2. **Liquid’s tax:** One product, two repos; AI ships fast; shared chrome (especially **AI Assistant**) duplicated; Reporting drifts.
3. **Not a better skill:** Governed path — discovery → plan → specialists → eval → human-approved PR.
4. **First proof:** Fix **LIQ-24** assistant seam while repos stay split.
5. **Second act (closing slide):** Same loop to combine repos — narrative only in ~45 min format.
6. **Two AI jobs:** Grok (or fixture) **in the app** for product assistant; **Cursor SDK** in `liquid-workflow` for migration/fix agents.

---

## One-liners (keep under 15 seconds)

| Topic | Line |
| --- | --- |
| State machine | **In Progress plans → Approve unlocks → In Review opens PRs → Humans merge.** |
| Control plane | **Linear is the ticket; workflow.liquid-accounting.world is the harness; the SDK spins cloud agents — I merge.** |
| vs skills | **Skills accelerated porting; the SDK is the persisted operating system with eval and gates.** |
| vs big-bang | **Classify shared shell vs report-only; atomic PRs per LIQ hero — no shared BFF fantasy in one run.** |
| Eval | **Deterministic rubric over plan text — not vibes, not an MCP.** |
| Insights | **Discovery layer for “how did we build this?” — citations from Linear docs and GitHub, not raw API dumps.** |
| Production claim | **Relatable replica of enterprise constraints — pattern we’d productionise, not claiming live Liquid fleet today.** |

---

## Show live vs narrate only

| Show | Narrate |
| --- | --- |
| Deck, Core + Reporting UIs, AI Assistant defect/parity | PostHog dashboards |
| Linear Todo → In Progress → In Review | Sentry UI (mention signal → ticket) |
| `/status`, `/evals`, GitHub PR + CI + Bugbot | “Analytics flagged → one curated Linear ticket” |
| Optional: `@Liquid Insights` or insights.liquid-accounting.world | |

**Hero surface:** **LIQ-24 AI Assistant** right rail (not Help/Notifications as primary story).

---

## Closing Q&A bridge phrases

- “Happy to go deeper on **model routing**, **eval checks**, or **why we duplicated the org BFF**.”
- “If you want a live extension, we can add a **check to harness.ts**, a **new specialist**, or an **Insights intent** — bounded, same gates.”
- “Everything I’m describing is in **Linear handbook 00–21** and retrievable by Liquid Insights.”

---

## Anti-patterns (do not say)

- “Agents merge when CI is green.”
- “Eval is an MCP / LLM judge.”
- “We merged Reporting into Core in the demo.”
- “This is exactly how production Liquid runs today.”
- “PostHog creates tickets automatically.” (Curated Linear hero; signal is triage.)

*Last updated: 2026-09-26.*
