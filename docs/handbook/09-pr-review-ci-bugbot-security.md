# PR review stack: CI, Bugbot, Security Agent

**Purpose:** How human merge decisions use **automated** evidence beyond the workflow eval — for Insights and onboarding.

**Human rule:** Agents open PRs; **humans merge** after this stack ([Workflow 0001](https://linear.app/liquid-accounting/document/decision-workflow-0001-agents-open-prs-humans-approve-merge-and-deploy-9e0dc91029a3), Core/Reporting [0005](https://linear.app/liquid-accounting/document/decision-core-0005-main-is-protected-agents-open-prs-humans-merge-01dd6a170109)).

---

## Layered evidence model

| Layer | What it validates | Who runs it | Substitutes for eval? |
| --- | --- | --- | --- |
| **Deterministic eval** | Plan/implement *text* structure, scope, gates | `liquid-workflow` | — (baseline) |
| **Specialist subagents** | Security + quality PASS/FAIL on diff (SDK) | Cursor cloud agent | No — advisory; eval only checks plan *mentions* them |
| **GitHub Actions CI** | Build, unit, E2E, artifacts | GitHub on PR | No |
| **Bugbot** | AI review comments on PR diff | Cursor/GitHub integration | No |
| **Cursor Security Agent** | Security-focused PR analysis | GitHub (org/repo setting) | No |
| **Vercel preview** | Runtime smoke in deployed preview | Vercel | No |
| **Human review** | Product intent, merge button | Engineer | Yes — final authority |

Workflow **implement** may also require **`main` CI green** before starting (`CI_GATE`) — separate from PR checks on the feature branch.

---

## Required CI jobs (branch protection)

### liquid-accounting-core (`main`)

| Job | What it covers |
| --- | --- |
| `build` | Production build |
| `assistant-unit` | Vitest + RTL on `AiAssistant` (welcome, send, accordion, related questions) |
| `smoke` | Playwright smoke |
| `parity-proof` | Cross-repo parity / LIQ seams, uploads `e2e/proof/` artifacts |

### liquid-accounting-reporting (`main`)

| Job | What it covers |
| --- | --- |
| `build` | Production build |
| `assistant-unit` | Same AI Assistant unit coverage |
| `help-proof` | Help/assistant shell proof (legacy naming; includes LIQ-24 assistant proofs) |

Branch protection: required checks, linear history, **enforce admins**, no force-push.

---

## Bugbot

**What it is:** Cursor **Bugbot** — automated PR reviewer that comments on diffs (style, logic, possible bugs). Enabled on Liquid GitHub repos as part of the Cursor/GitHub integration.

**How we use it:**

- Expected in SpaceX demo **Beat 9** — expand one finding or “clean” summary.
- **Independent** of workflow eval: Bugbot did not see the plan rubric; eval did not run Bugbot.
- Agents must **not** treat Bugbot approval as permission to merge or deploy.

**Insights questions:** “Did Bugbot comment on Reporting #14?” → retrieve GitHub PR checks/comments via GitHub connector.

---

## Cursor Security Agent

**What it is:** GitHub PR security analysis provided through Cursor’s security agent integration (org/repo configuration). Complements specialist `security-reviewer` (SDK, read-only, pre-PR) with **post-diff** analysis on the open PR.

**Typical focus (aligned with specialist prompt themes):**

- Secrets in client bundles
- Auth/token handling in BFF routes
- CORS / origin allowlists
- Open redirects and untrusted navigation targets
- Logging/analytics leaking PII

**Not a merge bot:** humans still merge; Security Agent findings are inputs.

*(Exact enablement lives in GitHub/Cursor settings — not duplicated here.)*

---

## Visual proof expectations

From workflow `VISUAL_PROOF_GATE` and PR templates:

1. **`docs/pr-proof/*.png`** — before/after for feature-map path; on PRs, CI also copies Playwright output here and **embeds images in a PR comment** (no artifact zip required).
2. **`e2e/proof/`** — Playwright output; CI still uploads artifacts as backup.
3. PR description **Screenshots** table (`.github/pull_request_template.md`).
4. **Vercel preview URL** on PR.

**Linear:** On PRs, CI uploads proof PNGs and posts a **Visual proof (CI)** comment on each referenced `LIQ-*` issue (requires repo secret `LINEAR_API_KEY`). GitHub PR comments remain the fallback when the secret is unset.

Hero examples: LIQ-24 assistant answers, LIQ-9 revenue hash, LIQ-17 bell, LIQ-16 Help.

---

## Merge → Linear Done

When a PR to `main` **merges** and title/body/branch mentions `LIQ-N`:

1. GitHub webhook → `liquid-workflow` `POST /webhooks/github`
2. Curated issue → Linear **Done**
3. Slack + Linear comment brief

**Gotcha:** Mentioning extra `LIQ-*` ids in PR text moves those tickets to Done too.

---

## Comparison table (for RAG / Insights)

| Question | Answer location |
| --- | --- |
| Did eval pass? | `/evals/latest?issue=LIQ-N`, Slack eval checklist |
| Did CI pass? | GitHub Checks tab, required contexts above |
| Bugbot findings? | GitHub PR review comments |
| Security Agent? | GitHub PR / security tab per Cursor integration |
| Who can merge? | Humans with repo access; agents never |
| What blocks implement in workflow? | Write-gate, eval gate, optional CI gate |

---

## Related handbook

- [02 · Agent workflow end to end](https://linear.app/liquid-accounting/document/02-the-agent-workflow-end-to-end-09ac594383a7)
- [07 · Cursor SDK & cloud agents](https://linear.app/liquid-accounting/document/07-cursor-sdk-and-cloud-agents-reference)
- [08 · Deterministic eval rubric](https://linear.app/liquid-accounting/document/08-deterministic-eval-rubric-reference)
- [03 · Security overview](https://linear.app/liquid-accounting/document/03-security-overview-f4c8c69d13cf)
