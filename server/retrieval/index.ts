/**
 * Retrieval orchestration: plan → parallel connector fetch (live or sample) →
 * normalise → rank → pack into the Grok context budget.
 */
import type { ConnectorId, ConnectorMode, RetrievalMeta } from "../../shared/contracts.js";
import type { Config } from "../config.js";
import { sampleCheckRuns, samplePulls } from "../fixtures/github.js";
import { sampleLinearIssues } from "../fixtures/linear.js";
import { errorCode, logEvent } from "../log.js";
import { CACHE_TTL_MS, retrievalCache, type TtlCache } from "./cache.js";
import {
  fetchCheckRuns,
  fetchRecentPulls,
  latestPerCheck,
  mergedWithin,
  normalizeCheck,
  normalizePull,
  searchPullsMentioning,
  type GithubCheckRun,
  type GithubDeps,
  type GithubPull,
} from "./github.js";
import { fetchLinearIssues, fetchLinearRecent, normalizeLinearIssue, type LinearDeps, type LinearIssueNode } from "./linear.js";
import { samplePosthogInsight } from "./posthog.js";
import { CONTEXT_CHAR_BUDGET, dedupe, packContext, rankItems } from "./rank.js";
import type { RetrievalPlan } from "./router.js";
import type { ConnectorResult, FetchLike, RetrievedItem } from "./types.js";

interface LinearSource {
  issues(ids: string[]): Promise<LinearIssueNode[]>;
  recent(): Promise<LinearIssueNode[]>;
}

interface GithubSource {
  pulls(repo: string): Promise<GithubPull[]>;
  search(ids: string[], repos: string[]): Promise<Array<{ repo: string; pull: GithubPull }>>;
  checks(repo: string, ref: string): Promise<GithubCheckRun[]>;
}

export interface RetrievalDeps {
  fetch: FetchLike;
  cache?: TtlCache;
  now?: () => number;
}

export interface RetrievalOutcome {
  results: ConnectorResult[];
  context: string;
  items: RetrievedItem[];
  meta: RetrievalMeta;
}

function liveLinear(deps: LinearDeps, cache: TtlCache): LinearSource {
  const scope = deps.teamId ?? deps.teamKey;
  return {
    issues: (ids) => cache.getOrLoad(`linear:issues:${ids.join(",")}`, CACHE_TTL_MS.linearIssue, () => fetchLinearIssues(ids, deps)),
    recent: () => cache.getOrLoad(`linear:recent:${scope}`, CACHE_TTL_MS.linearList, () => fetchLinearRecent(deps)),
  };
}

const sampleLinear: LinearSource = {
  issues: async (ids) => sampleLinearIssues().filter((issue) => ids.includes(issue.identifier)),
  recent: async () => sampleLinearIssues(),
};

function liveGithub(deps: GithubDeps, cache: TtlCache): GithubSource {
  return {
    pulls: (repo) => cache.getOrLoad(`github:prs:${repo}`, CACHE_TTL_MS.githubPrs, () => fetchRecentPulls(repo, deps)),
    search: (ids, repos) =>
      cache.getOrLoad(`github:search:${ids.join(",")}:${repos.join(",")}`, CACHE_TTL_MS.githubSearch, () => searchPullsMentioning(ids, repos, deps)),
    checks: (repo, ref) => cache.getOrLoad(`github:checks:${repo}:${ref}`, CACHE_TTL_MS.githubChecks, () => fetchCheckRuns(repo, ref, deps)),
  };
}

const sampleGithub: GithubSource = {
  pulls: async (repo) => samplePulls(repo),
  search: async (ids, repos) =>
    repos.flatMap((repo) => samplePulls(repo).filter((pull) => ids.some((id) => pull.title.includes(id))).map((pull) => ({ repo, pull }))),
  checks: async (repo) => sampleCheckRuns(repo),
};

async function collectLinear(source: LinearSource, plan: RetrievalPlan): Promise<RetrievedItem[]> {
  const [detail, recent] = await Promise.all([source.issues(plan.issueIds), source.recent()]);
  return [...detail, ...recent].map(normalizeLinearIssue);
}

async function collectGithub(source: GithubSource, plan: RetrievalPlan, branch: string, nowMs: number): Promise<RetrievedItem[]> {
  const merged = plan.repos.map(async (repo) => mergedWithin(await source.pulls(repo), plan.sinceDays, nowMs).map((pull) => normalizePull(repo, pull)));
  const mentioned = source
    .search(plan.issueIds, plan.repos)
    .then((hits) => hits.map(({ repo, pull }) => normalizePull(repo, pull)));
  const checks = plan.wantsChecks
    ? plan.repos.map(async (repo) => latestPerCheck(await source.checks(repo, branch)).map((run) => normalizeCheck(repo, branch, run)))
    : [];
  const groups = await Promise.all([...merged, mentioned, ...checks]);
  return groups.flat();
}

/** Tags each sample item inline so Grok can't blend it with live data. Keeps the leading [id]. */
function markSample(item: RetrievedItem): RetrievedItem {
  const idToken = `[${item.citation.id}]`;
  if (!item.text.startsWith(idToken) || item.text.includes("SAMPLE DATA")) return item;
  return { ...item, text: `${idToken} (SAMPLE DATA)${item.text.slice(idToken.length)}` };
}

function tally(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ");
}

/**
 * Deterministic counts over every Linear issue retrieved (before the context
 * budget trims anything) — the model reads numbers here instead of counting.
 */
export function linearCounts(items: RetrievedItem[], sinceDays?: number, nowMs = Date.now()): string | null {
  const issues = dedupe(items.filter((item) => item.citation.kind === "linear_issue"));
  if (!issues.length) return null;
  const lines = [`COUNTS (computed by the server over the ${issues.length} most recently updated Linear issues; use these for any numbers):`];
  lines.push(`- All issues by state: ${tally(issues.map((i) => i.citation.status ?? "Unknown"))}`);
  const isClosed = (i: RetrievedItem) => /^(done|canceled|cancelled|duplicate)$/i.test(i.citation.status ?? "");
  const idList = (list: RetrievedItem[]) => list.map((i) => i.mentions[0]).join(", ") || "none";
  const open = issues.filter((i) => !isClosed(i));
  lines.push(`- Open now (not Done/Canceled): ${open.length} (${idList(open)})`);
  if (sinceDays) {
    const recent = issues.filter((i) => i.updatedAt && nowMs - Date.parse(i.updatedAt) <= sinceDays * 86_400_000);
    const resolved = recent.filter((i) => /^done$/i.test(i.citation.status ?? ""));
    lines.push(`- Moved to Done and last updated in the last ${sinceDays} days: ${resolved.length} (${idList(resolved)})`);
    const ids = recent.map((i) => i.mentions[0]).join(", ") || "none";
    lines.push(`- Updated in the last ${sinceDays} days: ${recent.length} (${recent.length ? tally(recent.map((i) => i.citation.status ?? "Unknown")) + "; " : ""}${ids})`);
  }
  const labels = [...new Set(issues.flatMap((i) => i.labels ?? []))].sort();
  for (const label of labels) {
    const tagged = issues.filter((i) => i.labels?.includes(label));
    lines.push(`- Label "${label}" by state: ${tally(tagged.map((i) => i.citation.status ?? "Unknown"))} (${tagged.map((i) => i.mentions[0]).join(", ")})`);
  }
  return lines.join("\n");
}

/** Merged/open PR totals per repo within the plan window, so Grok never counts PRs itself. */
export function githubCounts(items: RetrievedItem[], sinceDays: number, nowMs: number): string | null {
  const pulls = dedupe(items.filter((item) => item.citation.kind === "github_pr"));
  if (!pulls.length) return null;
  const cutoff = nowMs - sinceDays * 86_400_000;
  const byRepo = new Map<string, { merged: string[]; open: string[] }>();
  for (const pull of pulls) {
    const [repo, number] = pull.citation.id.replace(/^github:PR:/, "").split("#");
    const entry = byRepo.get(repo) ?? { merged: [], open: [] };
    if (pull.citation.status === "merged" && Date.parse(pull.updatedAt ?? "") >= cutoff) entry.merged.push(`#${number}`);
    if (pull.citation.status === "open") entry.open.push(`#${number}`);
    byRepo.set(repo, entry);
  }
  const lines = [...byRepo].map(
    ([repo, { merged, open }]) => `- ${repo}: merged in last ${sinceDays} days ${merged.length} (${merged.join(", ") || "none"}); open PRs retrieved ${open.length} (${open.join(", ") || "none"})`,
  );
  return [`PR COUNTS (computed by the server; use these for any PR numbers):`, ...lines].join("\n");
}

async function runConnector(
  connector: ConnectorId,
  live: (() => Promise<RetrievedItem[]>) | null,
  sample: (() => Promise<RetrievedItem[]>) | null,
  now: () => number,
): Promise<ConnectorResult> {
  const fetchedAt = new Date(now()).toISOString();
  if (live) {
    try {
      return { connector, mode: "live", fetchedAt, items: await live() };
    } catch (error) {
      // Configured-but-failing never silently falls back to sample data.
      logEvent("connector_error", { connectors: [connector], connector_error: errorCode(error) });
      return { connector, mode: "unavailable", fetchedAt, items: [] };
    }
  }
  if (sample) return { connector, mode: "sample", fetchedAt, items: (await sample()).map(markSample) };
  return { connector, mode: "unavailable", fetchedAt, items: [] };
}

export async function runRetrieval(plan: RetrievalPlan, config: Config, deps: RetrievalDeps): Promise<RetrievalOutcome> {
  const cache = deps.cache ?? retrievalCache;
  const now = deps.now ?? Date.now;
  const { linear, github, allowFixtures } = config;

  const linearLive = linear.apiKey
    ? () => collectLinear(liveLinear({ apiKey: linear.apiKey!, fetch: deps.fetch, teamId: linear.teamId, teamKey: linear.teamKey }, cache), plan)
    : null;
  const githubLive = github.token
    ? () => collectGithub(liveGithub({ token: github.token!, fetch: deps.fetch }, cache), plan, github.branch, now())
    : null;

  const tasks: Array<Promise<ConnectorResult>> = [
    runConnector("linear", linearLive, allowFixtures ? () => collectLinear(sampleLinear, plan) : null, now),
    runConnector("github", githubLive, allowFixtures ? () => collectGithub(sampleGithub, plan, github.branch, now()) : null, now),
  ];
  if (plan.wantsPosthog) {
    const nowIso = new Date(now()).toISOString();
    tasks.push(runConnector("posthog", null, allowFixtures ? async () => [samplePosthogInsight(nowIso)] : null, now));
  }

  const results = await Promise.all(tasks);
  const ranked = rankItems(
    results.flatMap((r) => r.items),
    plan,
    now(),
  );
  const allItems = results.flatMap((r) => r.items);
  const counts = [linearCounts(allItems, plan.sinceDays, now()), githubCounts(allItems, plan.sinceDays, now())].filter(Boolean).join("\n\n") || null;
  const packed = packContext(ranked, CONTEXT_CHAR_BUDGET - (counts ? counts.length + 2 : 0));

  return {
    results,
    context: counts ? `${counts}\n\n${packed.context}` : packed.context,
    items: packed.included,
    meta: {
      connectors: results.map((r) => r.connector),
      connectorModes: Object.fromEntries(results.map((r) => [r.connector, r.mode])) as Partial<Record<ConnectorId, ConnectorMode>>,
      window: `last ${plan.sinceDays} days`,
      truncated: packed.truncated,
      itemCount: packed.included.length,
    },
  };
}
