/**
 * Wire contract between the Insights UI and the BFF. Shared by both sides so
 * the browser and server can never drift on field names.
 */

export type ConnectorId = "linear" | "github" | "posthog" | "sentry" | "github_search";

export type CitationKind = "linear_issue" | "github_pr" | "github_check" | "posthog_insight";

export interface Citation {
  /** Stable retrieval id, e.g. `linear:LIQ-24` or `github:PR:owner/repo#10`. */
  id: string;
  kind: CitationKind;
  title: string;
  url: string;
  /** Short status text shown on the chip, e.g. "In Progress", "merged", "success". */
  status?: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatTurn[];
  orgId?: string;
}

/** "live" = real API call, "sample" = fixture data, "unavailable" = not configured or the call failed. */
export type ConnectorMode = "live" | "sample" | "unavailable";

export interface RetrievalMeta {
  connectors: ConnectorId[];
  connectorModes: Partial<Record<ConnectorId, ConnectorMode>>;
  /** Human-readable window, e.g. "last 14 days". */
  window: string;
  truncated: boolean;
  itemCount: number;
}

export type Provider = `grok:${string}` | "fixture" | "digest" | "action";

/**
 * A change the viewer must confirm with a click. Nothing happens until the
 * UI posts `token` to the action endpoint.
 */
export interface ProposedAction {
  kind: "linear_transition";
  issueId: string;
  issueTitle: string;
  url: string;
  fromState: string;
  toState: string;
  token: string;
  expiresAt: number;
}

/** Colour *roles*; the UI maps them to validated tokens (categorical blue/orange, status green/red). */
export type ChartColor = "series1" | "series2" | "good" | "critical";

export interface ChartSeries {
  key: string;
  name: string;
  color: ChartColor;
  /** One value per category, same order as `categories`. */
  values: number[];
}

/**
 * A server-computed chart. Numbers never come from the model, so they always
 * match the cited sources. "grouped" = side-by-side columns, "stacked" = one column split.
 */
export interface ChartSpec {
  id: string;
  kind: "grouped" | "stacked";
  title: string;
  /** Window + source note, e.g. "Last 7 days · merged PRs on GitHub". */
  subtitle: string;
  categories: string[];
  series: ChartSeries[];
  /** Unit for tooltips/table, e.g. "PRs", "tickets", "runs". */
  unit: string;
  /** True when drawn from sample data rather than live connectors. */
  sample: boolean;
}

export const MAX_CHART_CATEGORIES = 31;
export const MAX_CHART_SERIES = 4;

export interface ChatResponse {
  requestId: string;
  reply: string;
  citations: Citation[];
  relatedQuestions: string[];
  provider: Provider;
  retrievalMeta: RetrievalMeta;
  latencyMs: number;
  proposedAction?: ProposedAction;
  charts?: ChartSpec[];
}

export interface Organisation {
  id: string;
  name: string;
  role: string;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  query: string;
}

export interface ApiError {
  requestId: string;
  error: string;
  message?: string;
}

export const MESSAGE_MIN_CHARS = 2;
export const MESSAGE_MAX_CHARS = 2000;
export const HISTORY_MAX_TURNS = 6;
