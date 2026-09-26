> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: 45-minute session arc

**Format:** Opening slides → live demo (~20–22 min) → closing slides → Q&A.

---

## Timing table

| Block | Minutes | Content |
| --- | --- | --- |
| Opening | 8–10 | Problem, two repos, SDK vs skill, operating model (slides 1–7) |
| Live | 20–22 | LIQ-24 assistant → Linear In Progress → plan/eval → approve → In Review → PRs |
| Closing | 8–10 | Combine repos second act, outcomes (slides 8–9) |
| Q&A | remainder | Insights optional; deep dives on 10–21 handbook |

---

## Live demo state path

```text
Todo → In Progress (plan + eval)
     → Approve (Slack or /approve)
     → In Review (implement + PRs)
Human merge (narrated or show existing merged PR)
     → Done (webhook)
```

**Do not** live-merge unless room explicitly wants it — narrate is fine.

---

## Pre-room minimum

- Prod Core + Reporting; assistant demonstrable
- Hero ticket in **Todo**
- `/status` — know `DRY_RUN`, gates
- Backup: merged PR with CI green, `/evals` screenshot

**If demo breaks:** Show eval failure, stale plan, or CI — gates working is a valid outcome.

---

## Deck URLs

- [accounting-presentation.vercel.app](https://accounting-presentation.vercel.app)
- Jump `#7` before live, `#8` after

*Last updated: 2026-09-26.*
