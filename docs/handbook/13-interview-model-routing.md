> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Model routing Q&A

**Code:** `liquid-workflow/src/models.ts` · **Decision:** [Workflow 0004](https://linear.app/liquid-accounting/document/decision-workflow-0004-per-role-model-routing-and-read-only-specialist-36a193a4324c)

---

## Policy table

| Role | SDK label | Router `optimize_for` | Env override | Why |
| --- | --- | --- | --- | --- |
| Planner | Planner (orchestrator) | **intelligence** | `CURSOR_MODEL_PLANNER` | Cross-repo classification, bounded plans |
| Security reviewer | Security reviewer | **intelligence** | `CURSOR_MODEL_SECURITY` | Auth, CORS, deep-link abuse |
| Quality reviewer | Code quality reviewer | **cost** | `CURSOR_MODEL_QUALITY` | Parity scans, diff hygiene |
| Implementer | Implementer | **balanced** | `CURSOR_MODEL_IMPLEMENTER` | Throughput vs quality for mechanical edits |

**Resolution order:** `CURSOR_MODEL_<ROLE>` fixed id → Cursor Router `auto-smart` + param → fallback `CURSOR_MODEL` (default `composer-2.5`).

**Inspect live:** `GET https://workflow.liquid-accounting.world/models` · `npm run models` in workflow repo.

---

## What routing is *not*

- Eval harness does **not** choose models ([08 · Eval](https://linear.app/liquid-accounting/document/08-deterministic-eval-rubric-reference-53c129d9cb9a)).
- Parent agent does **not** self-assign “use opus for everything” — roster is injected via `${rosterBlock}` in prompts ([07 · SDK](https://linear.app/liquid-accounting/document/07-cursor-sdk-and-cloud-agents-reference-d455f9df1888)).
- In-app Grok model (`XAI_MODEL` on Core/Reporting BFF) is **independent** of SDK routing.

---

## Sample questions

1. **Why Cost for quality reviewer?** High-volume read-only diff scan; blocking findings still stop implement.
2. **Can interviewers change routing live?** Yes — env override or extend `ROLE_POLICY`; re-run `GET /models` to show change (extension prompt).
3. **What if Router unavailable?** Fixed model fallback; demo defaults to Composer family.
4. **Do specialists implement fixes?** No — PASS/FAIL read-only; implement parent opens PRs.

---

## Demo beat (30 sec)

Open `/models` alongside a plan brief: “Planner gets intelligence for classification; quality is cost-effective; implementer balanced for PR throughput.”

*Last updated: 2026-09-26.*
