/**
 * Framework-free BFF: `(Request, ctx) → Response`. The local Node server and the
 * Vercel function are thin adapters around this, so both enforce identical rules.
 */
import { HISTORY_MAX_TURNS, MESSAGE_MAX_CHARS, MESSAGE_MIN_CHARS, type ChatResponse, type ChatStreamEvent, type ChatTurn } from "../shared/contracts.js";
import { ActionError, executeTransition } from "./actions/linearTransition.js";
import { executeImplement } from "./actions/workflowImplement.js";
import { accessCodeMatches, authenticate, buildSessionCookie, createSessionToken, sessionCookieName } from "./auth.js";
import { sessionAuthEnabled, type Config } from "./config.js";
import { createXaiClient, type GrokClient } from "./grok/client.js";
import { BodyError, errorResponse, json, ndjsonStream, noContent, parseCookies, readJsonBody, type RequestContext } from "./http.js";
import { answerQuestion } from "./insights.js";
import { progressSteps } from "./progress.js";
import { detectTicketAction } from "./actions/linearTransition.js";
import { planRetrieval } from "./retrieval/router.js";
import { anonymousViewerId, recordQuestion, type QuestionRecord } from "./telemetry.js";
import { isHelpQuestion } from "../shared/askCatalog.js";
import { errorCode, logEvent } from "./log.js";
import { ORGS, DEFAULT_ORG, SUGGESTED_PROMPTS } from "./org.js";
import { RATE_LIMITS, RateLimiter } from "./rateLimit.js";
import type { FetchLike } from "./retrieval/types.js";

export interface AppDeps {
  config: Config;
  fetch?: FetchLike;
  /** Override for tests; defaults to the real xAI client when XAI_API_KEY is set. */
  grok?: GrokClient | null;
  limiter?: RateLimiter;
  now?: () => number;
}

export type AppHandler = (request: Request, ctx: RequestContext) => Promise<Response>;

const SERVICE = "liquid-accounting-analytics-bff";
const HISTORY_TURN_MAX_CHARS = 1_500;

function sanitizeHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((turn): turn is ChatTurn => Boolean(turn) && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string")
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, HISTORY_TURN_MAX_CHARS) }))
    .slice(-HISTORY_MAX_TURNS);
}

function originAllowed(request: Request, config: Config): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (config.allowedOrigins.includes(origin)) return true;
  // Browser-set and unforgeable by page scripts: the definitive same-origin signal.
  if (request.headers.get("sec-fetch-site") === "same-origin") return true;
  // Fallback for clients without Fetch Metadata: compare against the public host(s).
  const hosts = [request.headers.get("x-forwarded-host"), request.headers.get("host")].filter((h): h is string => Boolean(h));
  return hosts.some((host) => origin === `https://${host}` || (!config.isProductionLike && origin === `http://${host}`));
}

/** Hash of the session cookie (or "local-dev" for the proxy bearer) — anonymous, never the cookie itself. */
function viewerIdFor(request: Request, config: Config): string {
  const session = parseCookies(request.headers.get("cookie"))[sessionCookieName(config)];
  return anonymousViewerId(session ?? "local-dev");
}

function connectorFlags(config: Config) {
  return {
    grok: Boolean(config.xai.apiKey),
    linear: Boolean(config.linear.apiKey),
    github: Boolean(config.github.token),
    posthog: Boolean(config.posthog.apiKey && config.posthog.projectId),
    questionLog: Boolean(config.posthog.projectToken),
    workflow: Boolean(config.workflow.token),
    sentry: Boolean(config.sentry.token),
    fixtures: config.allowFixtures,
    actions: Boolean(config.actions.linearApiKey),
  };
}

export function createApp(deps: AppDeps): AppHandler {
  const { config } = deps;
  const fetchImpl: FetchLike = deps.fetch ?? ((input, init) => fetch(input, init));
  const limiter = deps.limiter ?? new RateLimiter();
  const now = deps.now ?? Date.now;
  const grok =
    deps.grok !== undefined
      ? deps.grok
      : config.xai.apiKey
        ? createXaiClient({ apiKey: config.xai.apiKey, model: config.xai.model, timeoutMs: config.xai.timeoutMs, fetch: fetchImpl })
        : null;

  interface ChatInput {
    message: string;
    history: ChatTurn[];
  }

  /** Rate limit + validation shared by the JSON and streaming chat routes. Returns an error Response or the input. */
  async function readChat(request: Request, ctx: RequestContext): Promise<Response | ChatInput> {
    if (!limiter.allow(RATE_LIMITS.chat, ctx.ip)) return errorResponse(429, ctx.requestId, "rate_limit_exceeded");
    const body = await readJsonBody(request);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (message.length < MESSAGE_MIN_CHARS || message.length > MESSAGE_MAX_CHARS) {
      return errorResponse(400, ctx.requestId, "invalid_message", `Message must be ${MESSAGE_MIN_CHARS}–${MESSAGE_MAX_CHARS} characters.`);
    }
    if (body.orgId !== undefined && !ORGS.some((org) => org.id === body.orgId)) {
      return errorResponse(400, ctx.requestId, "unknown_org");
    }
    return { message, history: sanitizeHistory(body.history) };
  }

  /** Answers, records the question-log event and logs. Throws (after recording) on failure. */
  async function runChat(
    { message, history }: ChatInput,
    request: Request,
    ctx: RequestContext,
    onReplyDelta?: (text: string) => void,
  ): Promise<Omit<ChatResponse, "requestId">> {
    const started = now();
    const action = detectTicketAction(message);
    const help = isHelpQuestion(message);
    const plan = planRetrieval(message, config.github.repos);
    const record = (answer: Omit<QuestionRecord, "topic" | "style" | "charts" | "windowDays">): Promise<void> =>
      recordQuestion(config, fetchImpl, viewerIdFor(request, config), {
        topic: action ? "ticket_move" : help ? "help" : plan.intent,
        style: action ? "action" : help ? "direct" : plan.style,
        charts: action || help ? [] : plan.charts,
        windowDays: plan.sinceDays,
        ...answer,
      });

    let answer: Awaited<ReturnType<typeof answerQuestion>>;
    try {
      answer = await answerQuestion(message, history, config, { fetch: fetchImpl, grok, now, requestId: ctx.requestId, onReplyDelta });
    } catch (error) {
      await record({ sources: [], answerType: "none", outcome: "error", latencyMs: now() - started, citationCount: 0 });
      throw error;
    }
    const latencyMs = now() - started;
    const answerType = answer.provider.startsWith("grok:") ? "grok" : (answer.provider as "fixture" | "digest" | "action");
    await record({
      sources: Object.entries(answer.retrievalMeta.connectorModes)
        .filter(([, mode]) => mode !== "unavailable")
        .map(([c]) => c),
      answerType,
      outcome: answerType === "digest" && !help ? "fallback" : "answered",
      latencyMs,
      citationCount: answer.citations.length,
    });
    logEvent("insights_chat", {
      requestId: ctx.requestId,
      provider: answer.provider,
      connectors: answer.retrievalMeta.connectors,
      connectorModes: answer.retrievalMeta.connectorModes,
      itemCount: answer.retrievalMeta.itemCount,
      truncated: answer.retrievalMeta.truncated,
      messageLength: message.length,
      latencyMs,
      streamed: Boolean(onReplyDelta),
    });
    return { ...answer, latencyMs };
  }

  async function handleChat(request: Request, ctx: RequestContext): Promise<Response> {
    const input = await readChat(request, ctx);
    if (input instanceof Response) return input;
    return json(200, ctx.requestId, await runChat(input, request, ctx));
  }

  /** Same answer as handleChat, but the reply text streams as Grok writes it, then a final "done" event. */
  async function handleChatStream(request: Request, ctx: RequestContext): Promise<Response> {
    const input = await readChat(request, ctx);
    if (input instanceof Response) return input;
    return ndjsonStream(ctx.requestId, async (send) => {
      try {
        const payload = await runChat(input, request, ctx, (text) => send({ type: "delta", text } satisfies ChatStreamEvent));
        send({ type: "done", response: { requestId: ctx.requestId, ...payload } } satisfies ChatStreamEvent);
      } catch (error) {
        logEvent("request_error", { requestId: ctx.requestId, route: ctx.path, error: errorCode(error) });
        send({ type: "error", error: "internal_error", requestId: ctx.requestId } satisfies ChatStreamEvent);
      }
    });
  }

  async function handleTransition(request: Request, ctx: RequestContext, run = executeTransition): Promise<Response> {
    if (!limiter.allow(RATE_LIMITS.action, ctx.ip)) return errorResponse(429, ctx.requestId, "rate_limit_exceeded");
    const body = await readJsonBody(request);
    const started = now();
    try {
      const answer = await run(body.token, config, { fetch: fetchImpl, now });
      return json(200, ctx.requestId, { ...answer, latencyMs: now() - started });
    } catch (error) {
      if (error instanceof ActionError) {
        logEvent("action_refused", { requestId: ctx.requestId, error: error.code });
        return errorResponse(error.status, ctx.requestId, error.code);
      }
      throw error;
    }
  }

  async function handleSession(request: Request, ctx: RequestContext): Promise<Response> {
    if (request.method === "DELETE") return noContent(ctx.requestId, { "Set-Cookie": buildSessionCookie(config, null) });
    if (!sessionAuthEnabled(config) || !config.sessionSecret) return errorResponse(503, ctx.requestId, "auth_not_configured");
    if (!limiter.allow(RATE_LIMITS.session, ctx.ip)) return errorResponse(429, ctx.requestId, "rate_limit_exceeded");

    const body = await readJsonBody(request);
    if (!accessCodeMatches(body.accessCode, config)) {
      logEvent("session_denied", { requestId: ctx.requestId });
      return errorResponse(401, ctx.requestId, "invalid_access_code");
    }
    logEvent("session_created", { requestId: ctx.requestId });
    return noContent(ctx.requestId, { "Set-Cookie": buildSessionCookie(config, createSessionToken(config.sessionSecret, now())) });
  }

  async function route(request: Request, ctx: RequestContext): Promise<Response> {
    const { path } = ctx;
    const method = request.method;

    if (method === "GET" && (path === "/health" || path === "/api/health")) {
      return json(200, ctx.requestId, { status: "ok", service: SERVICE, grok: grok ? "grok" : "fixture", connectors: connectorFlags(config) });
    }
    if (path === "/api/v1/session" && (method === "POST" || method === "DELETE")) return handleSession(request, ctx);

    const auth = authenticate(request, config);
    if (!auth.ok) {
      logEvent("authentication_failure", { requestId: ctx.requestId, route: path });
      return auth.reason === "auth_not_configured"
        ? errorResponse(503, ctx.requestId, "auth_not_configured", "Set LIQUID_INSIGHTS_ACCESS_CODE and LIQUID_SESSION_SECRET.")
        : errorResponse(401, ctx.requestId, "unauthorized");
    }

    if (method === "POST" && path === "/api/v1/insights/chat") return handleChat(request, ctx);
    if (method === "POST" && path === "/api/v1/insights/chat/stream") return handleChatStream(request, ctx);
    if (method === "POST" && path === "/api/v1/insights/progress") {
      const body = await readJsonBody(request);
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (message.length < MESSAGE_MIN_CHARS || message.length > MESSAGE_MAX_CHARS) return errorResponse(400, ctx.requestId, "invalid_message");
      return json(200, ctx.requestId, { steps: progressSteps(message, config) });
    }
    if (method === "POST" && path === "/api/v1/actions/linear-transition") return handleTransition(request, ctx);
    if (method === "POST" && path === "/api/v1/actions/workflow-implement") return handleTransition(request, ctx, executeImplement);
    if (method !== "GET") return errorResponse(405, ctx.requestId, "method_not_allowed");

    switch (path) {
      case "/api/v1/organisation":
        return json(200, ctx.requestId, DEFAULT_ORG);
      case "/api/v1/orgs":
        return json(200, ctx.requestId, { orgs: ORGS });
      case "/api/v1/suggested-prompts":
        return json(200, ctx.requestId, { prompts: SUGGESTED_PROMPTS });
      case "/api/v1/connectors/status":
        return json(200, ctx.requestId, { connectors: connectorFlags(config) });
      default:
        return errorResponse(404, ctx.requestId, "not_found");
    }
  }

  return async function handle(request, ctx) {
    if (!originAllowed(request, config)) {
      logEvent("origin_rejected", {
        requestId: ctx.requestId,
        route: ctx.path,
        origin: request.headers.get("origin"),
        host: request.headers.get("host"),
        forwardedHost: request.headers.get("x-forwarded-host"),
        fetchSite: request.headers.get("sec-fetch-site"),
      });
      return errorResponse(403, ctx.requestId, "origin_not_allowed");
    }
    if (request.method === "OPTIONS") return noContent(ctx.requestId);
    if (!limiter.allow(RATE_LIMITS.general, ctx.ip)) return errorResponse(429, ctx.requestId, "rate_limit_exceeded");

    try {
      return await route(request, ctx);
    } catch (error) {
      if (error instanceof BodyError) return errorResponse(error.status, ctx.requestId, error.code);
      logEvent("request_error", { requestId: ctx.requestId, route: ctx.path, error: errorCode(error) });
      return errorResponse(500, ctx.requestId, "internal_error");
    }
  };
}
