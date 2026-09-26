# Start here: Liquid engineering directory

Everything we run, where it lives, and where to go next. New to the team? Read this page, then [the system map](01-system-map.md), then [the agent workflow](02-agent-workflow.md).

> Quickest way to get an answer: ask **Liquid Insights** at https://insights.liquid-accounting.world or `@Liquid Insights` in Slack, e.g. "How does the human write gate work?" or "Why did we build a deterministic eval harness?". It answers from these pages, the decision records and the code's design comments, with links.

## What we run

| System | What it is | Live at | Repo |
| --- | --- | --- | --- |
| **Liquid Core** | The canonical accounting app (dashboard, invoices, AI Assistant) | https://liquid-accounting.world | [liquid-accounting-core](https://github.com/gloverthomas/liquid-accounting-core) |
| **Liquid Reporting** | The reporting app, a separate shell for now (to be migrated into Core) | https://reporting.liquid-accounting.world | [liquid-accounting-reporting](https://github.com/gloverthomas/liquid-accounting-reporting) |
| **Liquid Insights** | Ask questions about tickets, code, errors, usage, the Cursor workflow and how things work; web + Slack bot | https://insights.liquid-accounting.world | [liquid-accounting-analytics](https://github.com/gloverthomas/liquid-accounting-analytics) |
| **liquid-workflow** | Cursor SDK service: plans, evals, approvals and PRs for Linear tickets | https://workflow.liquid-accounting.world (`/status`, `/evals` are public) | [liquid-workflow](https://github.com/gloverthomas/liquid-workflow) |

All four repos are **public**. Never commit secrets, and never write unfixed security issues into docs or PR descriptions.

## Where things are decided and tracked

- **Work:** Linear, team *Liquid accounting* (`LIQ-*`). Moving a ticket drives the agent workflow, see [02](02-agent-workflow.md).
- **Why we built it this way:** decision records in each repo's `docs/decisions/` (also published here as "Decision · …" pages).
- **Code review:** GitHub PRs. `main` is protected on Core and Reporting; humans merge.
- **Errors:** Sentry (org `liquid-accounting`, production only). **Product analytics:** PostHog (US). **Hosting:** Vercel. **Workflow tunnel:** Cloudflare.

## Your first day

1. Get access: GitHub (the four repos), Linear (*Liquid accounting*), Vercel, Slack, and the Insights access code.
2. Run Core locally (README → "Run locally", "Core BFF"). Then Reporting.
3. Read [the security overview](03-security-overview.md) and [the write policy](https://github.com/gloverthomas/liquid-workflow/blob/main/WRITE-POLICY.md).
4. Ask Insights "I'm new, where do I start?" and "What can I ask?".
5. Pick a Todo ticket and follow it through the pipeline ("Where is LIQ-N in the pipeline?").

## Pages in this directory

| Page | Read it when |
| --- | --- |
| [01 System map](01-system-map.md) | You want to know how the pieces connect |
| [02 The agent workflow](02-agent-workflow.md) | You're working a ticket, or wondering what the agents do |
| [03 Security overview](03-security-overview.md) | Before touching auth, tokens, webhooks or analytics |
| [04 Runbooks](04-runbooks.md) | Something is down or not responding |
| [05 Tooling & config](05-tooling-and-config.md) | You need to know which env var or tool does what |
| [06 Glossary](06-glossary.md) | A term doesn't make sense |
