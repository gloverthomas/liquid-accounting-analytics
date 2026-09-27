> 📌 **Manual sync:** GitHub handbook + Linear in the same change ([documentation-sync.md](./documentation-sync.md)).

# Codebase file walk: ask Insights these

Ask Liquid Insights any question below. Each section names the sidebar folder on the demo machine and the symbol to jump to. Insights reads this page from Linear and from `docs/handbook/` on GitHub.

Sidebar roots in one Cursor window: **Accounting-core**, **Accounting-reporting**, **liquid-workflow**, **accounting-presentation**. Insights itself is **liquid-accounting-analytics**. Quick Open (Cmd+P) the filename, then Cmd+Shift+O the symbol. Check the breadcrumb starts with the right root.

**Accounting-reporting must be on `main` before a file walk.** On `main` the New chat click clears the thread (Reporting PR 34). The failure from the 27 Sep rehearsal is the previous commit. With `AiAssistant.tsx` focused, open Timeline at the bottom of the Files sidebar and pick **File a ticket when Reporting New chat fails to start** (Reporting PR 33).

## The whole path in one sentence

The browser posts a product signal. liquid-workflow opens a Linear ticket in Todo and does not plan. You move that ticket to In Progress to plan. Approve, then move it to In Review, and that opens the PR. You merge on GitHub. The merge webhook moves the ticket to Done and posts Slack.

## Lines to have cold

Say **Grok**. The Reporting error posts the product signal. The workflow opens the Linear ticket. PostHog and Sentry are the detection record. They do not create the ticket. You merge on GitHub. Slack and the cloud agent do not merge. Planner preference is Intelligence. **Composer is the fallback** when Cursor Router is not entitled, not the planner preference. Security reviewer is Intelligence. Quality reviewer is Cost. Implementer is Balance. BugBot autofix commits onto the open PR. It does not open a second PR and it does not merge.

## Where does New chat live in the code

Reporting New chat lives in the code in **Accounting-reporting** `src/components/AiAssistant.tsx`. Search **New chat**. On `main` the click aborts the in-flight request, calls `setMessages([])`, clears the error, and clears busy. **Accounting-core** `src/components/AiAssistant.tsx` already did that. The rehearsal click kept the thread, showed "New chat failed to start", and posted the signal. That version is the Timeline commit on this file, not the working tree on `main`.

## What code filed the New chat ticket

The function was `reportAssistantNewChatFailed` in **Accounting-reporting** `src/productSignal.ts`. It posted `/api/v1/product/signal` with hash `assistant-new-chat`, source `reporting:ai-assistant`, once per page load. An empty thread did not file. Send still worked. That function is gone from `main` because the fix removed the seam. The POST shape still in the file is `reportAssistantRelatedQuestionsFailed` (hash `assistant-related-questions`) and `reportAssistantCalculationAccordionStuck`. Use Timeline on `productSignal.ts` to show the New chat reporter.

## What receives the product signal POST

Open **Accounting-reporting** `server/productSignal.mjs`, symbol `handleProductSignal`. The browser calls same-origin `/api/v1/product/signal`. The server looks up the hash in `SEAMS` and forwards to `WORKFLOW_SIGNAL_URL`. The browser never holds the Linear key. If the workflow cannot be reached and a Linear key is configured on the Reporting server, the same file can create the issue directly. The walkthrough path is the forward.

## Does the product signal start a Cursor SDK plan

No. The product signal does not start a Cursor SDK plan. Open **liquid-workflow** `src/server.ts`, symbol `handleSignal`, then `src/linear-client.ts`, symbol `createProductSignalIssue`. `/signal` opens a Linear issue in **Todo**, assignee set, description containing the phrase **product signal**, and Slacks. It does not call `Agent.create`. You move that issue to **In Progress** to plan. Nothing is pre-created. A second page load can file again. A duplicate webhook delivery does not double-plan.

## Why was a brand-new ticket eligible

Open **liquid-workflow** `src/workflow-eligibility.ts`, symbol `isWorkflowEligible`. Plan and implement run when `TRIGGER_ISSUE_IDS` is empty, the identifier is in that list, or the title or description contains the exact phrase **product signal**. Signal tickets include that phrase, so they do not need a new allowlist entry. The harness does not change per bug. A Linear `/approve` comment that omits the description is looked up with `findIssueByIdentifier` so the phrase still counts.

## The feature map still mentions related questions

Open **liquid-workflow** `src/feature-map.ts`, then `src/prompts/dynamic-ticket.ts`. The map still describes the related-questions render error. That is a hint for older seams. The dynamic prompt says the **Linear description is the source of truth** for scope. The New chat ticket body carried the New chat writeup. Do not edit the feature map for every new seam.

## What starts the plan

Open **liquid-workflow** `src/linear-webhook.ts`, symbol `routeLinearWebhook`. An Issue update into a trigger state (In Progress) returns action `plan`. Then `src/sdk-planner.ts` `startPlanRun` calls `Agent.create` with `mode: "plan"` and `autoCreatePR: false`. The plan cannot open a PR. Moving the ticket is the trigger. `/signal` is not.

## Is the eval an MCP

Open **liquid-workflow** `src/eval/harness.ts`, symbol `evaluateRun`. The eval is a deterministic checklist in this repo over the plan text. It is not an MCP and not a model judge. A failed plan tells you to move the ticket back to **In Progress**. **Approve implement stays off** when `evalPassed` is false. Do not approve a failed plan. An empty agent result becomes a fallback sentence that only names the issue id, so content checks fail. Re-plan from In Progress.

## Which models and who writes code

Open **liquid-workflow** `src/models.ts`, symbol `ROLE_POLICY`, then `src/agents.ts`, symbol `buildSpecialistAgents`. Planner and security use Intelligence. Quality uses Cost. Implementer uses Balance. The router id is `auto-smart` with param `optimize_for`. Fixed overrides are `CURSOR_MODEL_PLANNER`, `CURSOR_MODEL_SECURITY`, `CURSOR_MODEL_QUALITY`, `CURSOR_MODEL_IMPLEMENTER`. If the router is not entitled, `src/config.ts` falls back to `composer-2.5`. The two specialists are `security-reviewer` and `quality-reviewer`. Their prompts say stay read-only and still mention LIQ-9 because that was the original scope example. They do not implement the fix.

## How do you approve and does that open the PR

Open **liquid-workflow** `src/write-gate.ts`, symbol `formalApprovalBlockReason` and `parseApproveCommand`. Approval is Slack **Approve implement**, a Linear comment `/approve` or `approve implement`, or `POST /approve`. It lasts `APPROVAL_TTL_HOURS` (default 24). Approval records the gate. It does not open the PR. You then move the issue to **In Review**, and that starts implement.

## What opens the PR

Open **liquid-workflow** `src/sdk-planner.ts`, symbol `startImplementRun`. In Review starts `Agent.create` with `mode: "agent"` and `autoCreatePR: true`, after a valid approval. The cloud agent opens the PR. There is no separate Create PR click in Slack. Slack buttons appear when the agent text contains a `github.com/.../pull/N` URL.

## Why did Slack say the PR is open

Open **liquid-workflow** `src/linear-in-review.ts`, symbol `markIssueInReview`. The GitHub `pull_request` opened handler in `src/server.ts` calls it. Slack says the PR is open and Linear is In Review, with Open PR and Open Linear. It posts even when the issue was already In Review. If it was not In Review yet, the handler arms implement suppress so the Linear status webhook does not start a second implement. Next step in that message: BugBot, CI, and the preview, then you merge. That merge moves Linear to Done.

## What does BugBot do

BugBot is advisory. Autofix commits onto the **open PR** as Cursor Agent. It does not open a second PR and it does not merge. On an open PR, review that commit. If the PR was already squash-merged, the autofix commit stays on the old branch and needs a follow-up PR onto main. The GitHub webhook in **liquid-workflow** `src/server.ts` can Slack a BugBot review. Fix in Cursor / Fix in Web / Open PR are the manual path. Do not open a second PR from those buttons when the finding is already on an open PR.

## Who is allowed to merge

You merge on GitHub. Slack and the cloud agent do not merge. Open **liquid-workflow** `src/linear-done.ts`, symbol `markIssueDone`. The GitHub merge webhook calls it when `GITHUB_AUTO_DONE_ENABLED` is on. It moves the ticket to **Done**, comments on Linear, and posts Slack **Done**. Branch protection stops agents merging `main`.

## Where do credentials live

Open **liquid-workflow** `src/access.ts`, symbol `routeAccess`. Public routes are GET `/health`, `/status`, `/`, `/evals`, POST `/signal`, and POST `/webhooks/linear` and `/webhooks/github`. Webhooks need a valid HMAC or they are refused. Everything else needs `Authorization: Bearer` `WORKFLOW_API_TOKEN` and fails closed when the token is missing. `/approve` accepts the API bearer or `APPROVE_TOKEN`, compared in constant time after hashing. The browser never holds Cursor, Linear, GitHub, or Slack secrets. `CURSOR_API_KEY` lives only on the Mac harness. Leave `.env.local` closed in the room.

## Where does the harness run and how would this scale

Open **liquid-workflow** `docs/decisions/0005-mac-behind-cloudflare-tunnel.md`. One Node process on this Mac at `127.0.0.1:4100`, reached through the named tunnel `workflow.liquid-accounting.world`. The tunnel restarts itself. The Node process does not. A git pull does not change the running process until you restart `npm start`. Scale is one harness, many seams, the same states, idempotent webhooks, one run per issue, and kill switches. Hosting that process is the next step before a team depends on it. Cloudflare Access was considered and is not configured.

## Kill switches

In **liquid-workflow** config: `WORKFLOW_ENABLED`, `SIGNAL_ENABLED`, `LINEAR_AUTO_ENABLED`, `GITHUB_AUTO_DONE_ENABLED`, and the GitHub auto In Review switch. `DRY_RUN` skips a real `Agent.create`. Gates you can name: `EVAL_GATE`, `CI_GATE`, `REQUIRE_FORMAL_APPROVAL`. `/signal` returns 503 when the workflow or signal kill switch is off.

## Grok or the Cursor SDK

Grok answers product questions. The Cursor SDK plans and implements. They are different processes. **Accounting-reporting** `server/assistant.mjs`, symbol `answerAssistant`, calls xAI when `XAI_API_KEY` is set (model `grok-4-fast-non-reasoning`) and otherwise returns a fixture. The key stays on the server. **liquid-accounting-analytics** `server/chatTurn.ts`, symbol `runChatTurn`, is the one Insights path for the web app and Slack. `server/grok/client.ts` is the xAI client. `Agent.create` exists only in **liquid-workflow** `src/sdk-planner.ts`. Grok does not plan the fix. The SDK does not answer the accounting question. Say Grok, not Groq.

## Why two repos

Core and Reporting are separate apps with the same chrome. Open the `cloud.repos` list on `Agent.create` in **liquid-workflow** `src/sdk-planner.ts`. The agent is given both repo URLs. New chat was already correct in Core, so the fix PR was Reporting only. A shared BFF is out of scope and fails the eval on purpose.

## Is CI the same thing as the cloud agent

No. CI is GitHub Actions on the PR. Reporting's proof script includes `assistant-unit` and Playwright proof. The cloud agent is the SDK run from `startPlanRun` / `startImplementRun`. You wait for CI, BugBot, and the preview, then you merge. The agent finishing is not the test suite. Cursor Agents UI: filter Source to SDK. The agent link shape is `https://cursor.com/agents/{agentId}`.

## Can Insights create or move the ticket

Open **liquid-accounting-analytics** `server/actions/linearTransition.ts`, symbol `proposeTransition`. Insights can read status and, after you confirm, move a ticket. `server/actions/workflowImplement.ts` can record approval and move toward implement, still behind a confirm. In the demo the ticket was created by the product signal, not by Insights, PostHog, or Sentry.

## Two design systems

**Accounting-core** `package.json` and **Accounting-reporting** `package.json` both depend on `lucide-react` `^0.468.0`. Do not claim two design-system versions.

## Idempotency and a second click

Webhook handlers in **liquid-workflow** `src/server.ts` skip a delivery id that was already processed and take a per-issue lock. The browser signal flags in `productSignal.ts` are once per page load. A refresh, or New chat after another reply on the planted build, can file another ticket. Say that if they ask why a second click made LIQ-N+1.

## What the Slack cues mean

Signal received: a Todo exists, move it to In Progress to plan. Plan complete and eval passed: Approve implement, then move to In Review. Plan complete and eval failed: move back to In Progress. Do not use Approve implement. PR is open: review BugBot, CI, and the preview, then you merge. Done: the GitHub merge already happened. Slack is attention. It does not deploy and it does not merge.

## Empty thread and send still works

On the planted New chat seam, clicking New chat with no messages did nothing and did not file. After a reply, New chat kept the thread and filed once. Send still worked the whole time. Core still cleared. On `main` both apps clear.

## Related questions is not this walkthrough

The earlier seam was hash `assistant-related-questions`: after a reply, an empty related-questions list showed an error and posted `/signal`. Reporting PR 32 restored chips when the assistant returns related questions. That is not the New chat walkthrough. The feature map still mentions it. Trust the Linear description on the current ticket.

## PII and retention

**liquid-workflow** `src/pii.ts` scrubs tokens before they land in Slack briefs. Run records retain for `RUN_RETENTION_DAYS` (14). Dead letters go to `runs/ops/dead-letter.jsonl`. Do not read secrets out of `.env.local` to prove this. Point at `access.ts` and `pii.ts`.

## Public eval page versus run JSON

GET `/evals` is public HTML. GET `/evals/latest` and the runs JSON need the bearer token. Do not promise a public JSON dump of the plan.

## Mac process versus git

The demo harness that was restarted for this walkthrough is **liquid-workflow** `main` at `b1ff7cc` (signal body keeps the bug writeup, Slack on PR open, failed plans do not ask for approval). Leave `npm start` and `cloudflared` running. A later merge of workflow code does not apply until fetch, reset to `origin/main`, and a restart. The New chat seam did not require a workflow restart.

## What to do when they ask for a secret

Leave `.env.local` closed. Open `liquid-workflow/src/access.ts`. Say the values stay on the harness, the browser posts same-origin, and agents can open PRs but cannot merge.

## Sidebar roots

- **Accounting-reporting** — the seam and the fix. On `main` before you start. `src/components/AiAssistant.tsx`, `src/productSignal.ts`, `server/productSignal.mjs`, `server/assistant.mjs`.
- **Accounting-core** — New chat already clears. `src/components/AiAssistant.tsx`.
- **liquid-workflow** — the harness. `src/server.ts`, `src/sdk-planner.ts`, `src/models.ts`, `src/agents.ts`, `src/eval/harness.ts`, `src/write-gate.ts`, `src/access.ts`, `src/linear-webhook.ts`, `src/linear-in-review.ts`, `src/linear-done.ts`, `src/workflow-eligibility.ts`, `src/feature-map.ts`, `src/prompts/dynamic-ticket.ts`.
- **liquid-accounting-analytics** — Insights. `server/chatTurn.ts`, `server/grok/client.ts`, `server/actions/linearTransition.ts`. This page is what it should cite for a file walk.
- **accounting-presentation** — `talk.html` is the room script. `LIVE-DELIVERY.md` is the cue card. Enterprise scale and credentials stay if-asked, off the live clock.
