/**
 * PostHog is sample-only in the MVP: a pre-aggregated insight summary, never raw
 * events. Live PostHog is a v2 item (see docs/CONNECTORS.md).
 */
import type { RetrievedItem } from "./types.js";

export function samplePosthogInsight(nowIso: string): RetrievedItem {
  const id = "posthog:insight:assistant-adoption-28d";
  return {
    connector: "posthog",
    citation: {
      id,
      kind: "posthog_insight",
      title: "AI Assistant adoption · last 28 days (sample)",
      url: "https://us.posthog.com/",
      status: "sample",
    },
    text: `[${id}] PostHog insight (SAMPLE DATA, allowlisted events only) — product_navigation to "AI Assistant" up ~35% over 28 days; assistant chats per active org roughly flat week over week; bff_status errors on Reporting elevated after the assistant chrome shipped. No per-user or financial data.`,
    updatedAt: nowIso,
    mentions: [],
  };
}
