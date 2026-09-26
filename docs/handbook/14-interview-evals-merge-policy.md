> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Evals, merge policy, and gates

**Eval code:** `liquid-workflow/src/eval/harness.ts` · **Merge policy:** [Workflow 0001](https://linear.app/liquid-accounting/document/decision-workflow-0001-agents-open-prs-humans-approve-merge-and-deploy-9e0dc91029a3) · [Core/Reporting 0005](https://linear.app/liquid-accounting/document/decision-core-0005-main-is-protected-agents-open-prs-humans-merge-01dd6a170109)

---

## Gate stack (order matters)

| Gate | Blocks implement? | Blocks merge? |
| --- | --- | --- |
| `WORKFLOW_ENABLED` / kill switches | Yes | N/A |
| Plan must exist | Yes | N/A |
| **Eval pass** (`EVAL_GATE=true`) | Yes | N/A |
| Formal **approve** (`REQUIRE_FORMAL_APPROVAL`) | Yes (until approve) | N/A |
| Optional **CI_GATE** on `main` | Yes | N/A |
| GitHub required checks on PR | No (agent still opens PR) | **Yes** (human cannot merge until green) |
| Human merge button | N/A | **Only humans** |

**Demo bypass flags:** `IMPLEMENT_BYPASS_EVAL_ON_LINEAR` — **off in production**; mention only as kill-switch literacy.

---

## Eval in one paragraph

After each plan/implement run, `evaluateRun` keyword-matches required phrases (repos, Playwright, CI job names, write-gate language, forbids big-bang merge). Saves `runs/eval_*.json`; dashboard at `/evals`. **Not** an MCP; **not** an LLM judge ([Workflow 0003](https://linear.app/liquid-accounting/document/decision-workflow-0003-plans-are-scored-by-a-deterministic-rubric-not-2984bc0eccfd)).

**Common fail:** `human-write-gate` — plan missing “await approval” wording.

---

## Merge policy (humans)

1. Agent opens PR(s) with `autoCreatePR`.
2. CI: Core `build`, `assistant-unit`, `smoke`, `parity-proof`; Reporting `build`, `assistant-unit`, `help-proof`.
3. Bugbot + Cursor Security Agent = **advisory** ([09 · PR stack](https://linear.app/liquid-accounting/document/09-pr-review-ci-bugbot-security-agent-7880d8721b67)).
4. Human merges → GitHub webhook → Linear **Done** for cited `LIQ-*` (watch extra ids in PR body).

**Agents never:** merge `main`, deploy prod, or treat Bot comments as approval.

---

## Sample questions

| Question | Short answer |
| --- | --- |
| Is eval an MCP? | No — TypeScript harness |
| Can eval pass with a bad plan? | Yes — floor only; human approval |
| Who merges? | Humans with repo access |
| What if implement claims “merged to main”? | Eval `no-merge-claim` fails on implement runs |
| Show failure? | `/evals` failed check ids — acceptable demo beat |

*Last updated: 2026-09-26.*
