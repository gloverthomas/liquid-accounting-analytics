import type { Organisation, SuggestedPrompt } from "../shared/contracts.js";

export const DEFAULT_ORG: Organisation = { id: "org_liquid_coffee", name: "Liquid Coffee Co.", role: "Viewer" };

/** MVP ships a single org; the switcher UI is ready for more. */
export const ORGS: Organisation[] = [DEFAULT_ORG];

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: "liq-24", label: "Open LIQ-24 status", query: "What's the status of LIQ-24 and are there PRs?" },
  { id: "merged-reporting", label: "PRs merged this week on Reporting", query: "What merged on liquid-accounting-reporting in the last 7 days?" },
  { id: "ci-assistant-unit", label: "CI failures on assistant-unit", query: "Is assistant-unit passing on Core and Reporting main?" },
  { id: "todo-vs-done", label: "Linear bugs in Todo vs Done", query: "How many Linear bugs are in Todo vs Done?" },
];
