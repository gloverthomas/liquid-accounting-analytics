# Connectors

All connectors are **read-only** and run on the server only. The browser never talks to Linear, GitHub or xAI directly.

## Linear (`server/retrieval/linear.ts`)

- **Auth:** `LINEAR_API_KEY`, sent as the raw `Authorization` header, which is how Linear personal keys work.
- **Scope:** `LINEAR_TEAM_ID` if set, otherwise `LINEAR_TEAM_KEY` (default `LIQ`).
- **Queries:**
  - One aliased query fetches up to 5 issues by identifier, with description and the last 5 comments. An unknown ID is skipped rather than treated as an error.
  - The 50 most recently updated issues in the team are fetched for ranking, including state filters such as "Todo vs Done".
- **Limits:** descriptions are clipped to 700 characters and comments to 280, and emails are redacted.

## GitHub (`server/retrieval/github.ts`)

- **Auth:** `GITHUB_TOKEN`, a fine-grained PAT with **read-only** access to Contents, Pull requests and Checks on the repos in `GITHUB_REPOS`.
- **Calls:**
  - `GET /repos/{repo}/pulls?state=closed&sort=updated` (50 per page), filtered to PRs merged inside the question's time window.
  - `GET /search/issues?q="LIQ-24" is:pr repo:…` for PRs that mention a ticket.
  - `GET /repos/{repo}/commits/{branch}/check-runs`, keeping the latest run of each check name. Expected names are `build`, `assistant-unit`, `smoke` and `parity-proof` on Core, and `build`, `assistant-unit` and `help-proof` on Reporting.
- **Not fetched:** diffs, file contents and binary assets. PR descriptions are clipped to 240 characters.

## PostHog (sample only in MVP)

- For trend questions, the app adds one pre-aggregated **sample** insight (`server/retrieval/posthog.ts`).
- Live PostHog is planned for v2 and will use allowlisted, aggregated insights only: no raw events and no PII.

## Sentry, code search

- Not in the MVP (spec v2).

## Adding a connector

1. Add the ID to `ConnectorId` in `shared/contracts.ts`.
2. Write `fetch*` and `normalize*` functions. Normalised text must start with `[<id>]` and be clipped with `clip()`.
3. Wire the connector into `runRetrieval` with a live source and, optionally, a sample source.
4. Add contract tests with a mocked `fetch` (see `tests/contract/connectors.test.ts`).
