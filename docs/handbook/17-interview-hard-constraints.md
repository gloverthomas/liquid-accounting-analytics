> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Interview prep: Hard constraints and anti-patterns

From assignment + Liquid decisions — **violating these fails the story**.

---

## Must be true

| Constraint | Evidence |
| --- | --- |
| Prototype uses **Cursor SDK** | `liquid-workflow` imports `@cursor/sdk` |
| **Two repos** stay separate in demo fix | No merge Reporting into Core as hero outcome |
| **Deterministic eval** in workflow service | `harness.ts`, not MCP |
| **Linear** curated tickets | Hero `LIQ-*`; signal → Todo only |
| **Agents open PRs; humans merge** | WRITE-POLICY, Core/Reporting 0005 |
| Presentation-grade UI, synthetic data | Core + Reporting prod-like shells |
| Grok and/or SDK with clear split | Assistant BFF + workflow |

---

## Must not claim

- Production Liquid fleet runs this exact stack today.
- Agents merge or deploy prod.
- Eval is LLM-judged or MCP-based.
- PostHog auto-spams Linear (curated human/agent ticket creation).
- Big-bang shared BFF or full repo merge in one LIQ run.

---

## Security / hygiene

- No secrets in git; no PII in PostHog/Sentry allowlists ([Core 0003](https://linear.app/liquid-accounting/document/decision-core-0003-posthog-allowlisted-events-and-properties-only-1f7091a0fc6f)).
- Demo tokens stay server-side ([Core 0001](https://linear.app/liquid-accounting/document/decision-core-0001-each-app-has-its-own-loopback-bff-secrets-stay-out-70ddc115826d)).
- Workflow routes token-gated ([Workflow 0006](https://linear.app/liquid-accounting/document/decision-workflow-0006-every-control-plane-route-needs-a-token-19fe07367fc6)).

---

## If interviewer pushes “why not X?”

| Push | Response |
| --- | --- |
| Merge repos now | Second act narrative; first act proves governed loop at seam |
| Skip eval | Shows ungoverned agent risk at enterprise scale |
| Let agent merge when CI green | Removes human accountability; violates assignment |
| Single monorepo | Real Liquid constraint is *not* monorepo yet — that’s the problem statement |

*Last updated: 2026-09-26.*
