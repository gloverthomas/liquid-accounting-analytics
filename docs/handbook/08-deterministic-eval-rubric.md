# Deterministic eval rubric (reference)

**Purpose:** Exact pass/fail checks Liquid applies to plan and implement artifacts — for Insights, demos, and operators. This is **not** an MCP tool and **not** an LLM judge.

**Code:** [liquid-workflow `src/eval/harness.ts`](https://github.com/gloverthomas/liquid-workflow/blob/main/src/eval/harness.ts)

**Decision:** [Workflow 0003](https://linear.app/liquid-accounting/document/decision-workflow-0003-plans-are-scored-by-a-deterministic-rubric-not-2984bc0eccfd)

**Dashboard:** https://workflow.liquid-accounting.world/evals · JSON: `/evals/latest?issue=LIQ-24`

---

## How eval works

1. After each plan or implement run, `evaluateRun(record)` concatenates `summary` + `error` text.
2. Each **check** is a keyword/phrase match (case-insensitive). `requireMention(id, desc, needles, required)`:
   - `required: true` → **pass** if any needle appears.
   - `required: false` → **pass** if **no** needle appears (used for forbidden phrases).
3. Overall **passed** only if every check passes.
4. Report saved as `runs/eval_*.json`; linked on run record and Slack/Linear briefs.

**`EVAL_GATE=true` (default):** implement blocked unless latest **plan** eval passed.

**Limits:** A plan can pass rubric but still be wrong substantively. Eval is a **floor**; humans approve; Bugbot + CI are separate evidence.

---

## Common plan checks (all hero tickets)

These apply when `record.kind === "plan"` or status is `dry_run`:

| Check id | Description | Must mention (examples) |
| --- | --- | --- |
| `lists-files-or-repos` | Names repos/files | `liquid-accounting-core`, `liquid-accounting-reporting`, `main.tsx`, `cross-repo-parity` |
| `playwright-parity` | E2E / proof | `playwright`, `parity`, `e2e`, `screenshot`, `proof` |
| `ci-jobs` | Required CI | `parity-proof`, `help-proof`, `assistant-unit`, `smoke`, `vitest`, `github actions` |
| `feature-map-path` | Concrete UI path | `feature map`, `ai assistant`, `bell`, `help`, `#revenue`, `right rail`, … |
| `out-of-scope` | Bounded work | `out-of-scope`, `must not`, `do not`, `bounded` |
| `human-write-gate` | Human approval stated | `await approval`, `write-gate`, `write gate`, `human` |
| `atomic-pr` | One ticket scope | `atomic`, `one ticket`, `this ticket`, `only` |
| `no-big-bang` | **Must NOT** propose | `merge all reporting`, `big-bang merge`, `shared bff`, `extract entire shell` |
| `specialists-invoked-or-noted` | Specialist review | `security`, `quality`, `subagent`, `specialist`, `reviewer` |

---

## Issue-specific plan checks

### LIQ-24 (AI Assistant BFF parity)

| Check id | Must mention |
| --- | --- |
| `mentions-ai-assistant` | `ai assistant`, `assistant`, `right rail`, `grok`, `chat` |
| `mentions-core-and-reporting` | core + reporting repo names or words |

### LIQ-17 (Notifications)

| Check id | Must mention |
| --- | --- |
| `mentions-notifications` | `notification`, `bell`, `inbox` |
| `mentions-core-and-reporting` | both apps |

### LIQ-16 (Help centre)

| Check id | Must mention |
| --- | --- |
| `mentions-help-centre` | `help centre`, `help menu`, `help` |
| `mentions-core-and-reporting` | both apps |

### LIQ-15 (broken `#invoice-performance`)

| Check id | Must mention |
| --- | --- |
| `mentions-invoice-performance` | `#invoice-performance` |
| `mentions-revenue-fix` | `#revenue-summary` |

### Default / LIQ-9 (deep-link)

| Check id | Must mention |
| --- | --- |
| `mentions-revenue-summary` | `#revenue-summary` |
| `mentions-legacy-sales` | `#sales-summary` |

---

## Implement-run checks

When `record.kind === "implement"`:

| Check id | Rule |
| --- | --- |
| Hero-specific | LIQ-24 → assistant/chat; LIQ-17 → notifications; LIQ-16 → help; else → `#revenue-summary` |
| `no-merge-claim` | **Fail** if text claims `merged to main`, `deployed to production`, `pushed prod` |
| `visual-proof` | Must mention `pr-proof`, `e2e/proof`, `screenshot`, `playwright` |
| `ci-named` | Must name `assistant-unit`, `parity-proof`, `help-proof`, `smoke`, `build`, `ci`, `vitest` |

If underlying SDK run `status === "failed"`, check `run-not-failed` fails.

---

## Operator tips

- **Most common failure:** `human-write-gate` — plan forgot explicit “await approval” language.
- **Re-score:** `POST /evals/rerun` with `{ "runId" }` or `npm run eval` locally.
- **Demo bypass:** `IMPLEMENT_BYPASS_EVAL_ON_LINEAR` — **off in production** (decision 0003).

---

## Model routing (linked topic)

Eval does **not** choose models. Per-role routing is documented in [07 · SDK & cloud agents](https://linear.app/liquid-accounting/document/07-cursor-sdk-and-cloud-agents-reference) and decision 0004:

| Role | Router `optimize_for` | Rationale |
| --- | --- | --- |
| Planner | **intelligence** | Cross-repo classification |
| Security reviewer | **intelligence** | Auth/CORS/deep-link abuse |
| Quality reviewer | **cost** | Parity/diff hygiene scans |
| Implementer | **balanced** | Mechanical edits + PR throughput |

Resolution order: `CURSOR_MODEL_<ROLE>` env → Cursor Router `auto-smart` + param → fallback `CURSOR_MODEL` (default `composer-2.5`). Inspect: `GET /models`, `npm run models`.

---

## Insights questions

- “Why did LIQ-24 eval fail?”
- “What checks does the eval harness run?”
- “Is eval an MCP?” → **No** — deterministic code in `harness.ts`.
- “How are evals tracking?” → pass rate + failed check ids from `/evals` and workflow API.
