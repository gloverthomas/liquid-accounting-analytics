> 📌 **Manual sync:** Edit this file and [Linear 10](https://linear.app/liquid-accounting/document/10-interview-prep-sdk-vs-skills-api-mcp-b038d0f2c221) in the same change ([documentation-sync.md](./documentation-sync.md)). Insights RAG reads Linear.

# Interview prep: Cursor SDK vs skills, API, MCP, and scripts

**Audience:** Tom Glover — SpaceXAI Field Engineering live Q&A and extension prompts.

**Related:** [07 · SDK reference](https://linear.app/liquid-accounting/document/07-cursor-sdk-and-cloud-agents-reference-d455f9df1888) · [Decision Workflow 0001](https://linear.app/liquid-accounting/document/decision-workflow-0001-agents-open-prs-humans-approve-merge-and-deploy-9e0dc91029a3) · [12 · Talking points](https://linear.app/liquid-accounting/document/12-interview-prep-talking-points-and-one-liners)

---

## The assignment constraint

The exercise requires a **working prototype using the Cursor SDK** (and/or Grok API) for a **non-trivial enterprise SDLC workflow**. Liquid’s answer is **`liquid-workflow`**: a Node control plane that calls `@cursor/sdk` `Agent.create()` for **plan**, **read-only specialists**, and **implement → PR** — not a one-off IDE session.

---

## Comparison matrix (memorize for Q&A)

| Approach | Best for | What Liquid uses it for | Why not *only* this for the demo |
| --- | --- | --- | --- |
| **Cursor SDK** (`Agent.create`, cloud agents, subagents) | Durable, webhook-driven, multi-step automation with PR output | `liquid-workflow` plan/implement; specialists in `agents` block | Requires a service you own (gates, eval, tokens) |
| **IDE skills / rules** | Author guidance inside a repo; repeatable local edits | Prior porting velocity; project rules in Cursor | No persisted eval, no Linear state machine, no formal write-gate across machines |
| **Raw LLM API** (xAI Grok, OpenAI, etc.) | Product features needing chat/completion in *your* UX | **In-app AI Assistant** BFF (`POST /api/v1/assistant/chat`) | No built-in repo tools, cloud sandbox, or PR workflow |
| **MCP servers** | Tooling surface for agents (Linear, GitHub, PostHog) | Optional on Tom’s laptop; **Insights** uses server-side connectors, not MCP in prod path | Eval harness is **not** an MCP ([Workflow 0003](https://linear.app/liquid-accounting/document/decision-workflow-0003-plans-are-scored-by-a-deterministic-rubric-not-2984bc0eccfd)) |
| **Shell scripts / cron** | Glue, one-shot triggers | Tunnel install, local dev | No model routing, specialists, or Cursor cloud isolation |

---

## Sound bites

- **“Skills helped us port fast; the SDK is how we *operate* the convergence loop.”**
- **“Grok answers customers in the app; the SDK fixes the repo seam across Core and Reporting.”**
- **“MCP is how *I* steer agents in the IDE; Liquid Insights and workflow use first-party APIs with bounded retrieval.”**
- **“Eval is deterministic TypeScript over plan text — not an MCP tool and not an LLM judge.”**

---

## Sample interviewer questions

1. **Why not just a Cursor skill in each repo?** — Skills don’t give you webhook-driven plan/implement, cross-repo cloud sandboxes, eval artifacts on `/evals`, or enforced PR-only policy across operators.
2. **Could you replace the SDK with the Agents API only?** — You’d reimplement sandbox lifecycle, subagent roster, and PR creation; the SDK is the supported path for cloud agents + `autoCreatePR`.
3. **Where does MCP fit?** — Developer ergonomics and Insights-style connectors; not the workflow eval or merge authority.
4. **Is Liquid Insights part of the SDK demo?** — Separate product ([Decision Insights 0001](https://linear.app/liquid-accounting/document/decision-insights-0001-the-server-retrieves-grok-only-writes-up-e5d91c627e24)): retrieve → Grok → citations; optional Q&A surface during closing Q&A.

---

## Evidence to point at live

- `liquid-workflow` `src/sdk-planner.ts`, `src/agents.ts`, `src/models.ts`
- Workflow `/status`, `/evals/latest?issue=LIQ-24`
- GitHub PR opened by implement run (never merged by agent)
- [08 · Eval rubric](https://linear.app/liquid-accounting/document/08-deterministic-eval-rubric-reference-53c129d9cb9a)

*Last updated: 2026-09-26.*
