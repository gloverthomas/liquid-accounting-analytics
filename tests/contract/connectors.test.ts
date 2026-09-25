/**
 * Contract tests: mocked Linear GraphQL + GitHub REST → normalised retrieval
 * bundle. Asserts request shape, citation ids, and the context budget.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { TtlCache } from "../../server/retrieval/cache.js";
import { runRetrieval } from "../../server/retrieval/index.js";
import { fetchLinearIssues, normalizeLinearIssue, type LinearIssueNode } from "../../server/retrieval/linear.js";
import { latestPerCheck, normalizePull, type GithubCheckRun, type GithubPull } from "../../server/retrieval/github.js";
import { CONTEXT_CHAR_BUDGET } from "../../server/retrieval/rank.js";
import { planRetrieval } from "../../server/retrieval/router.js";
import { jsonResponse, makeConfig, mockFetch } from "../helpers.js";

const NOW = Date.parse("2026-09-25T06:00:00Z");
const CORE = "gloverthomas/liquid-accounting-core";
const REPORTING = "gloverthomas/liquid-accounting-reporting";

const LIQ_24: LinearIssueNode = {
  identifier: "LIQ-24",
  title: "AI Assistant parity",
  url: "https://linear.app/liquid/issue/LIQ-24",
  priorityLabel: "Urgent",
  updatedAt: "2026-09-24T10:00:00Z",
  state: { name: "In Progress" },
  assignee: { displayName: "Tom Glover" },
  labels: { nodes: [{ name: "assistant" }] },
  description: "Reporting BFF lacks POST /api/v1/assistant/chat. Contact tom@example.com",
  comments: { nodes: [{ body: "token ghp_abcdefghijklmnopqrstuvwxyz0123 leaked", createdAt: "2026-09-24T11:00:00Z", user: { displayName: "Ana" } }] },
};

const LIQ_16: LinearIssueNode = { ...LIQ_24, identifier: "LIQ-16", title: "Help centre parity", url: "https://linear.app/liquid/issue/LIQ-16", description: null, comments: null };

function pull(number: number, title: string, mergedAt: string | null, repoUrl?: string): GithubPull {
  return {
    number,
    title,
    html_url: `https://github.com/x/pull/${number}`,
    state: mergedAt ? "closed" : "open",
    merged_at: mergedAt,
    updated_at: mergedAt ?? "2026-09-24T00:00:00Z",
    user: { login: "gloverthomas" },
    body: null,
    repository_url: repoUrl,
  };
}

const CHECKS: GithubCheckRun[] = [
  { name: "assistant-unit", status: "completed", conclusion: "failure", html_url: "https://github.com/c/1", head_sha: "dca645f3b1e2", completed_at: "2026-09-25T04:00:00Z" },
  { name: "assistant-unit", status: "completed", conclusion: "success", html_url: "https://github.com/c/2", head_sha: "dca645f3b1e2", completed_at: "2026-09-25T05:00:00Z" },
  { name: "build", status: "in_progress", conclusion: null, html_url: "https://github.com/c/3", head_sha: "dca645f3b1e2", completed_at: null, started_at: "2026-09-25T05:30:00Z" },
];

function linearRoute(url: string, init?: RequestInit) {
  if (!url.startsWith("https://api.linear.app/graphql")) return undefined;
  const { query } = JSON.parse(String(init?.body)) as { query: string };
  if (query.includes("issues(filter")) return jsonResponse({ data: { issues: { nodes: [LIQ_16, LIQ_24] } } });
  return jsonResponse({ data: { i0: LIQ_24 } });
}

function githubRoute(url: string) {
  if (!url.startsWith("https://api.github.com")) return undefined;
  if (url.includes("/search/issues")) {
    return jsonResponse({ items: [{ ...pull(5, "feat(LIQ-24): AI Assistant chrome", null, `https://api.github.com/repos/${REPORTING}`), pull_request: { merged_at: null } }] });
  }
  if (url.includes("/check-runs")) return jsonResponse({ check_runs: CHECKS });
  if (url.includes(`/repos/${CORE}/pulls`)) {
    return jsonResponse([pull(5, "feat(LIQ-24): AI Assistant rail", "2026-09-25T03:28:00Z"), pull(1, "ancient", "2026-06-01T00:00:00Z")]);
  }
  if (url.includes(`/repos/${REPORTING}/pulls`)) return jsonResponse([pull(2, "fix(LIQ-16): Help centre", "2026-09-24T10:58:00Z")]);
  return undefined;
}

const LIVE_ENV = { LINEAR_API_KEY: "lin_test", GITHUB_TOKEN: "gh_test" };

describe("Linear connector", () => {
  it("sends the API key and aliased issue query, and normalises + redacts", async () => {
    const fetch = mockFetch(linearRoute);
    const nodes = await fetchLinearIssues(["LIQ-24"], { apiKey: "lin_test", fetch, teamId: null, teamKey: "LIQ" });
    const init = fetch.calls[0].init!;
    expect((init.headers as Record<string, string>).Authorization).toBe("lin_test");
    expect(JSON.parse(String(init.body)).variables).toEqual({ i0: "LIQ-24" });

    const item = normalizeLinearIssue(nodes[0]);
    expect(item.citation).toMatchObject({ id: "linear:LIQ-24", status: "In Progress", url: LIQ_24.url });
    expect(item.text.startsWith("[linear:LIQ-24]")).toBe(true);
    expect(item.text).toContain("[email]");
    expect(item.text).toContain("[secret]");
    expect(item.text).not.toContain("tom@example.com");
  });

  it("throws on HTTP errors and total GraphQL failure, tolerates unknown ids", async () => {
    const deps = { apiKey: "k", teamId: null, teamKey: "LIQ" };
    await expect(fetchLinearIssues(["LIQ-1"], { ...deps, fetch: mockFetch(() => jsonResponse({}, 401)) })).rejects.toThrow("linear_401");
    await expect(fetchLinearIssues(["LIQ-1"], { ...deps, fetch: mockFetch(() => jsonResponse({ errors: [{ message: "boom" }] })) })).rejects.toThrow("linear_graphql_error");
    const partial = await fetchLinearIssues(["LIQ-1"], { ...deps, fetch: mockFetch(() => jsonResponse({ data: { i0: null }, errors: [{ message: "Entity not found" }] })) });
    expect(partial).toEqual([]);
    expect(await fetchLinearIssues([], { ...deps, fetch: mockFetch() })).toEqual([]);
  });
});

describe("GitHub connector", () => {
  it("keeps the latest run per check and normalises ids", () => {
    const latest = latestPerCheck(CHECKS);
    expect(latest.map((r) => [r.name, r.conclusion])).toEqual([
      ["assistant-unit", "success"],
      ["build", null],
    ]);
  });

  it("builds stable PR ids and extracts ticket mentions", () => {
    const item = normalizePull(CORE, pull(5, "feat(LIQ-24): AI Assistant rail", "2026-09-25T03:28:00Z"));
    expect(item.citation.id).toBe(`github:PR:${CORE}#5`);
    expect(item.citation.status).toBe("merged");
    expect(item.mentions).toEqual(["LIQ-24"]);
  });
});

describe("runRetrieval (live, mocked)", () => {
  let cache: TtlCache;
  beforeEach(() => {
    cache = new TtlCache(() => NOW);
  });

  it("golden: LIQ-24 question yields the expected citation ids within budget", async () => {
    const fetch = mockFetch(linearRoute, githubRoute);
    const config = makeConfig(LIVE_ENV);
    const plan = planRetrieval("What's the status of LIQ-24 and are there PRs?", config.github.repos);
    const outcome = await runRetrieval(plan, config, { fetch, cache, now: () => NOW });

    const ids = outcome.items.map((i) => i.citation.id);
    expect(ids.slice(0, 3)).toEqual(expect.arrayContaining(["linear:LIQ-24", `github:PR:${CORE}#5`, `github:PR:${REPORTING}#5`]));
    expect(ids).not.toContain(`github:PR:${CORE}#1`); // outside the 14-day window
    expect(outcome.context.length).toBeLessThanOrEqual(CONTEXT_CHAR_BUDGET);
    expect(outcome.meta.connectorModes).toEqual({ linear: "live", github: "live" });

    const searchCall = fetch.calls.find((c) => c.url.includes("/search/issues"))!;
    expect(decodeURIComponent(searchCall.url)).toContain(`"LIQ-24" is:pr repo:${CORE} repo:${REPORTING}`);
    expect((searchCall.init!.headers as Record<string, string>).Authorization).toBe("Bearer gh_test");
  });

  it("caches connector calls between turns", async () => {
    const fetch = mockFetch(linearRoute, githubRoute);
    const config = makeConfig(LIVE_ENV);
    const plan = planRetrieval("Is assistant-unit passing?", config.github.repos);
    await runRetrieval(plan, config, { fetch, cache, now: () => NOW });
    const first = fetch.calls.length;
    await runRetrieval(plan, config, { fetch, cache, now: () => NOW });
    expect(fetch.calls.length).toBe(first);
  });

  it("marks a failing configured connector unavailable instead of using samples", async () => {
    const fetch = mockFetch(githubRoute, () => jsonResponse({}, 500));
    const config = makeConfig(LIVE_ENV);
    const outcome = await runRetrieval(planRetrieval("status of LIQ-24", config.github.repos), config, { fetch, cache, now: () => NOW });
    expect(outcome.meta.connectorModes.linear).toBe("unavailable");
    expect(outcome.items.some((i) => i.connector === "linear")).toBe(false);
    expect(outcome.items.length).toBeGreaterThan(0);
  });

  it("uses sample data without keys, and nothing when fixtures are disabled", async () => {
    const fetch = mockFetch();
    const sample = await runRetrieval(planRetrieval("Are assistant failures increasing?", makeConfig().github.repos), makeConfig(), { fetch, cache });
    expect(sample.meta.connectorModes).toEqual({ linear: "sample", github: "sample", posthog: "sample" });
    expect(fetch.calls).toHaveLength(0);

    const off = makeConfig({ LIQUID_INSIGHTS_ALLOW_FIXTURES: "false" });
    const none = await runRetrieval(planRetrieval("status of LIQ-24", off.github.repos), off, { fetch, cache });
    expect(none.items).toEqual([]);
    expect(none.meta.connectorModes).toEqual({ linear: "unavailable", github: "unavailable" });
  });
});
