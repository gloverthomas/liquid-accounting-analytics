> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Liquid Insights for demo Q&A

**Prod:** [https://insights.liquid-accounting.world](https://insights.liquid-accounting.world) · **Repo:** [liquid-accounting-analytics](https://github.com/gloverthomas/liquid-accounting-analytics)

---

## When to use in the 45-minute session

- **Optional** during closing Q&A — not a scripted middle beat.
- Proves **RAG over Linear handbook + tickets + GitHub** with citations.
- Mirrors Slack `@Liquid Insights` (same BFF pipeline).

---

## Strong demo prompts

| Prompt | What it exercises |
| --- | --- |
| “What was LIQ-24?” | Linear + narrative |
| “Did Reporting #14 merge?” | GitHub |
| “What’s the workflow eval for LIQ-24?” | `/evals` via workflow connector |
| “How does the human write gate work?” | Handbook 07 / guardrails |
| “Is eval an MCP?” | Handbook 08 / Workflow 0003 |
| “Why duplicated org BFF?” | Core/Reporting decision 0002 |
| “What CI jobs must pass on Core?” | Handbook 09 |

---

## Architecture (30 sec)

One BFF (`server/app.ts`): auth → intent → retrieve bounded bundles → Grok stream → validate citations. Actions (Linear move, workflow approve) **rule-detected + confirm-gated** ([Insights 0003](https://linear.app/liquid-accounting/document/decision-insights-0003-actions-are-rule-detected-and-confirm-gated-208ee5ead2d9)).

**Privacy:** Question log stores **topics only**, not question text ([Insights 0005](https://linear.app/liquid-accounting/document/decision-insights-0005-the-question-log-records-categories-never-text-a4c4ff2037e9)).

---

## Relation to interview docs

Handbook **10–21** (this interview series) are published to Linear for Insights retrieval — ask “Where should I read about SDK vs skills?” to verify sync.

*Last updated: 2026-09-26.*
