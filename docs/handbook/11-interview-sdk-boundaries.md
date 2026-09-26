> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Where the Cursor SDK starts and stops

**Purpose:** Clear boundaries for “what runs in Cursor cloud” vs “what Liquid owns” vs “what humans must do.”

**Related:** [07 · SDK reference](https://linear.app/liquid-accounting/document/07-cursor-sdk-and-cloud-agents-reference-d455f9df1888) · [11 boundaries](./11-interview-sdk-boundaries.md) · [WRITE-POLICY](https://github.com/gloverthomas/liquid-workflow/blob/main/WRITE-POLICY.md)

---

## SDK **starts** here

| Trigger | SDK action | Mode |
| --- | --- | --- |
| Linear **In Progress** (webhook) or `POST /trigger` | Parent **plan** run + specialists | `mode: plan`, `autoCreatePR: false` |
| Formal **approve** + Linear **In Review** (webhook) or gated `POST /implement` | Parent **implement** run | `mode: agent`, `autoCreatePR: true` |
| Parent prompt | Spawns `security-reviewer`, `quality-reviewer` (read-only) | SDK `agents` definitions |

**Credentials:** `CURSOR_API_KEY` on workflow host only — never in Core/Reporting browser bundles ([Core 0001](https://linear.app/liquid-accounting/document/decision-core-0001-each-app-has-its-own-loopback-bff-secrets-stay-out-70ddc115826d)).

**Cloud agents:** Isolated workers that clone/edit configured repos and open PRs. Same infrastructure family as Cursor cloud agents / background agents; this demo uses the **SDK programmatic** surface, not the Agents Window UI as a required beat.

---

## SDK **stops** here (hard lines)

| Action | Who |
| --- | --- |
| Merge to `main` | **Human** on GitHub |
| Production deploy / promote preview to prod | **Human** (Vercel) |
| Linear **Done** from merged PR | **Workflow webhook** (after human merge) — not agent self-close without merge |
| Treat Slack/Linear chat as deploy approval | **Forbidden** — formal approve token / button when `REQUIRE_FORMAL_APPROVAL` |
| Big-bang “merge all Reporting into Core” in one agent run | **Out of scope** — eval forbids language ([08 · Eval](https://linear.app/liquid-accounting/document/08-deterministic-eval-rubric-reference-53c129d9cb9a)) |
| `/signal` from broken Reporting chrome | **Slack + Linear Todo only** — does **not** start SDK plan |

**Prompt enforcement:** `HUMAN_WRITE_GATE`, `VISUAL_PROOF_GATE` in `liquid-workflow/src/guardrails.ts` (verbatim in [07](https://linear.app/liquid-accounting/document/07-cursor-sdk-and-cloud-agents-reference-d455f9df1888)).

---

## Liquid-owned control plane (not “the model deciding”)

| Component | Role |
| --- | --- |
| `liquid-workflow` HTTP API | Auth tokens, kill switches (`WORKFLOW_ENABLED`, `SIGNAL_ENABLED`) |
| Eval harness `harness.ts` | Pass/fail on plan/implement **text**; blocks implement when `EVAL_GATE=true` |
| Model routing `models.ts` | Per-role `optimize_for` + env overrides — model does not pick its own role |
| Linear state machine | [Workflow 0002](https://linear.app/liquid-accounting/document/decision-workflow-0002-linear-ticket-states-drive-the-workflow-376a80b98e7a) |
| Insights BFF | Retrieve bounded context; Grok writes; citations server-enforced |

---

## Diagram (say aloud)

```text
Linear state ──webhook──► liquid-workflow ──SDK──► Cursor cloud agent
                              │                      │
                              │ eval, gates          └──► GitHub PR (open)
                              │
Human ◄── merge ── GitHub ◄───┘
Human ◄── approve ── Slack / Linear /approve
```

---

## Sample questions

- **Does the SDK deploy to production?** No — PRs and previews only; humans ship.
- **Can an agent move a ticket to Done without a merge?** Not the happy path; merge webhook drives Done for hero `LIQ-*`.
- **What if eval passes but the plan is wrong?** Eval is a **floor**; humans approve plans; Bugbot + CI are separate layers ([09 · PR stack](https://linear.app/liquid-accounting/document/09-pr-review-ci-bugbot-security-agent-7880d8721b67)).
- **Where do secrets live?** Workflow host + each app’s loopback BFF — never `VITE_*` for privileged keys.

*Last updated: 2026-09-26.*
