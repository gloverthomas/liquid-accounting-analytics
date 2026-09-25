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

export type Provider = `grok:${string}` | "fixture" | "digest";

export interface ChatResponse {
  requestId: string;
  reply: string;
  citations: Citation[];
  relatedQuestions: string[];
  provider: Provider;
  retrievalMeta: RetrievalMeta;
  latencyMs: number;
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
