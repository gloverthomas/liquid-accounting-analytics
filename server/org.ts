import type { Organisation, SuggestedPrompt } from "../shared/contracts.js";

export const DEFAULT_ORG: Organisation = { id: "org_liquid_coffee", name: "Liquid Coffee Co.", role: "Viewer" };

/** MVP ships a single org; the switcher UI is ready for more. */
export const ORGS: Organisation[] = [DEFAULT_ORG];

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: "liq-24", label: "Open LIQ-24 status", query: "What's the status of LIQ-24 and are there PRs?" },
  { id: "merged-per-day", label: "PRs merged per day this week", query: "How many PRs merged per day this week, Core vs Reporting?" },
  { id: "ci-assistant-unit", label: "assistant-unit failures, last 2 weeks", query: "How often has assistant-unit failed over the last 2 weeks?" },
  { id: "todo-vs-done", label: "Linear bugs in Todo vs Done", query: "How many Linear bugs are in Todo vs Done?" },
];
