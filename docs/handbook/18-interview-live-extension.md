> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Live extension playbook

Assignment: **extend part of the prototype based on interviewer prompt.** Pre-load safe, bounded extensions.

---

## Tier A — Low risk (5–10 min)

| Extension | Where | Story |
| --- | --- | --- |
| Add eval check needle | `liquid-workflow/src/eval/harness.ts` | “Tighten rubric without new AI” |
| Show `/models` roster change | Env `CURSOR_MODEL_QUALITY` | “Ops override per role” |
| Add Insights sample question pill | `liquid-accounting-analytics` UI | “Same BFF pipeline” |
| Run `npm run eval` on saved plan | workflow CLI | “Re-score artifact” |

---

## Tier B — Medium (10–15 min)

| Extension | Where | Story |
| --- | --- | --- |
| New forbidden phrase in eval | `harness.ts` `requireMention(..., required: false)` | Block toxic plan language |
| Specialist prompt tweak | `src/agents.ts` | Read-only security scope |
| Document new interview Q in handbook 20 | Linear + GitHub sync | Insights RAG freshness |

**Keep:** PR-only, no merge, run tests if touching harness.

---

## Tier C — Avoid live unless asked

- Changing Linear webhook secrets / tunnel
- Live implement run without eval pass
- Cross-repo CI token fixes (Reporting private checkout)
- Merging any open `hello/*` PR

---

## Script if prompted cold

1. Restate **gate** (“I’ll extend X but keep human merge and eval.”)
2. Show **file** + **test or /evals** outcome
3. Tie to **enterprise** (“Same pattern for policy-as-code on agent outputs.”)

*Last updated: 2026-09-26.*
