/**
 * Rules-only intent routing (no extra LLM call): question → which connectors to
 * hit, for which repos, over what window.
 */

export type Intent = "issue_status" | "ci_health" | "trend" | "merged_prs" | "linear_overview" | "general";

export interface RetrievalPlan {
  intent: Intent;
  issueIds: string[];
  linearStates: string[];
  repos: string[];
  sinceDays: number;
  wantsChecks: boolean;
  wantsPosthog: boolean;
  keywords: string[];
}

const DEFAULT_WINDOW_DAYS = 14;
const MAX_WINDOW_DAYS = 30;
const MAX_ISSUE_IDS = 5;
const MAX_KEYWORDS = 8;

const ISSUE_ID = /\b([A-Z][A-Z0-9]{1,5}-\d{1,6})\b/gi;
const CI_WORDS = /\b(ci|checks?|build|failing|failures?|passing|green|red|assistant-unit|smoke|parity-proof|help-proof|pipeline|actions)\b/i;
const TREND_WORDS = /\b(trends?|trending|increasing|decreasing|over time|per week|week over week|rate|velocity)\b/i;
const MERGE_WORDS = /\b(merged?|shipped|pull requests?|prs?|delivery|released|landed)\b/i;
const LINEAR_WORDS = /\b(tickets?|bugs?|issues?|todo|backlog|in progress|in review|done|blocked|blocking|linear|defects?|status)\b/i;

const STATE_WORDS: Array<[RegExp, string]> = [
  [/\btodo\b/i, "Todo"],
  [/\bbacklog\b/i, "Backlog"],
  [/\bin progress\b/i, "In Progress"],
  [/\bin review\b/i, "In Review"],
  [/\bdone\b/i, "Done"],
];

const STOPWORDS = new Set(
  "a an and any are as at be been being by can could did do does for from has have how i in is it its last me my of on or our show tell that the their them there these this those to was we were what whats when where which who why will with week weeks days day about going there's what's".split(
    " ",
  ),
);

function windowDays(lower: string): number {
  const explicit = lower.match(/\b(?:last|past)\s+(\d{1,3})\s+days?\b/);
  if (explicit) return Math.min(Math.max(Number(explicit[1]), 1), MAX_WINDOW_DAYS);
  if (/\b(this|last|past) week\b/.test(lower)) return 7;
  if (/\b(this|last|past) month\b/.test(lower)) return MAX_WINDOW_DAYS;
  if (/\b(today|yesterday)\b/.test(lower)) return 2;
  return DEFAULT_WINDOW_DAYS;
}

function pickRepos(lower: string, configured: string[]): string[] {
  const named = configured.filter((repo) => {
    const suffix = repo.split("/")[1]?.split("-").pop() ?? "";
    return suffix.length > 2 && new RegExp(`\\b${suffix}\\b`, "i").test(lower);
  });
  return named.length ? named : configured;
}

function extractKeywords(lower: string): string[] {
  const words = lower
    .replace(ISSUE_ID, " ")
    .split(/[^a-z0-9-]+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
  return [...new Set(words)].slice(0, MAX_KEYWORDS);
}

function classify(message: string, hasIssueIds: boolean): Intent {
  if (hasIssueIds) return "issue_status";
  if (TREND_WORDS.test(message)) return "trend";
  if (CI_WORDS.test(message)) return "ci_health";
  if (MERGE_WORDS.test(message)) return "merged_prs";
  if (LINEAR_WORDS.test(message)) return "linear_overview";
  return "general";
}

export function planRetrieval(message: string, configuredRepos: string[]): RetrievalPlan {
  const lower = message.toLowerCase();
  const issueIds = [...new Set([...message.matchAll(ISSUE_ID)].map((m) => m[1].toUpperCase()))].slice(0, MAX_ISSUE_IDS);
  const intent = classify(message, issueIds.length > 0);

  return {
    intent,
    issueIds,
    linearStates: STATE_WORDS.filter(([pattern]) => pattern.test(lower)).map(([, state]) => state),
    repos: pickRepos(lower, configuredRepos),
    sinceDays: windowDays(lower),
    wantsChecks: intent === "ci_health" || intent === "general" || CI_WORDS.test(message),
    wantsPosthog: intent === "trend",
    keywords: extractKeywords(lower),
  };
}
