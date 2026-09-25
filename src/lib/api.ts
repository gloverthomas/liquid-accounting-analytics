/**
 * Same-origin API client. Auth is handled outside the bundle: the Vite proxy
 * adds the demo bearer in dev; hosted deploys use an HttpOnly session cookie.
 */
import type { ApiError, ChatRequest, ChatResponse, Organisation, SuggestedPrompt } from "../../shared/contracts";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiRequestError(0, "network_error");
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as (T & Partial<ApiError>) | null;
  if (!res.ok) throw new ApiRequestError(res.status, body?.error ?? `http_${res.status}`, body?.requestId);
  if (body === null) throw new ApiRequestError(res.status, "invalid_response");
  return body;
}

export const api = {
  organisation: () => request<Organisation>("/api/v1/organisation"),
  orgs: () => request<{ orgs: Organisation[] }>("/api/v1/orgs").then((r) => r.orgs),
  suggestedPrompts: () => request<{ prompts: SuggestedPrompt[] }>("/api/v1/suggested-prompts").then((r) => r.prompts),
  chat: (body: ChatRequest, signal?: AbortSignal) => request<ChatResponse>("/api/v1/insights/chat", { method: "POST", body: JSON.stringify(body), signal }),
  progress: (message: string) => request<{ steps: string[] }>("/api/v1/insights/progress", { method: "POST", body: JSON.stringify({ message }) }).then((r) => r.steps),
  confirmTransition: (token: string) => request<ChatResponse>("/api/v1/actions/linear-transition", { method: "POST", body: JSON.stringify({ token }) }),
  createSession: (accessCode: string) => request<void>("/api/v1/session", { method: "POST", body: JSON.stringify({ accessCode }) }),
  endSession: () => request<void>("/api/v1/session", { method: "DELETE" }),
};

/** Maps API errors to copy a business reader can act on — never raw server detail. */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) return "Something went wrong. Please try again.";
  switch (error.code) {
    case "network_error":
      return "Can't reach the Insights service. Check your connection and try again.";
    case "rate_limit_exceeded":
      return "You're asking faster than we can answer. Wait a minute and try again.";
    case "unauthorized":
      return "Your session has expired. Reload the page to sign in again.";
    case "invalid_message":
      return "Questions need to be between 2 and 2,000 characters.";
    case "confirmation_expired":
      return "That confirmation expired. Ask again to get a fresh one.";
    case "issue_outside_team":
    case "state_not_allowed":
      return "That move isn't allowed from here.";
    case "actions_not_configured":
      return "Moving tickets isn't switched on for this deployment.";
    default:
      return "Insights couldn't answer that right now. Please try again.";
  }
}
