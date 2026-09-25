/**
 * Canned answers for demo mode (no XAI_API_KEY). Each one declares the citation
 * ids it depends on and is only used when all of them were actually retrieved —
 * otherwise the deterministic digest answers instead, so the text never
 * contradicts the sources shown.
 */
import type { Intent } from "../retrieval/router.js";

export interface FixtureAnswer {
  requires: string[];
  reply: string;
  relatedQuestions: string[];
}

const CORE = "gloverthomas/liquid-accounting-core";
const REPORTING = "gloverthomas/liquid-accounting-reporting";
const coreCheck = (name: string) => `github:check:${CORE}@dca645f:${name}`;
const reportingCheck = (name: string) => `github:check:${REPORTING}@27d9878:${name}`;

const LIQ_24: FixtureAnswer = {
  requires: ["linear:LIQ-24", `github:PR:${CORE}#5`, `github:PR:${REPORTING}#5`],
  reply: [
    "**LIQ-24 is In Progress: the AI Assistant answers on Core, but chat is missing on Reporting.** [linear:LIQ-24]",
    "- **Customer impact:** Reporting users see the assistant rail, but questions fail because the Reporting BFF has no `POST /api/v1/assistant/chat` route.",
    "- **Root cause class:** a missing BFF route (parity gap), not a UI defect.",
    `- **Delivered so far:** Core shipped the Grok-backed rail [github:PR:${CORE}#5]; Reporting shipped the chrome with an intentional BFF miss [github:PR:${REPORTING}#5].`,
    "- **Next step:** add the chat route to the Reporting BFF using Core's fail-closed pattern, plus a contract test.",
    "",
    "_Sample data — connect Linear and GitHub for live status._",
  ].join("\n"),
  relatedQuestions: ["Show me CI checks on the Reporting repo", "Which other LIQ tickets are parity-related?", "What merged on Reporting this week?"],
};

const CI: FixtureAnswer = {
  requires: [coreCheck("assistant-unit"), reportingCheck("assistant-unit")],
  reply: [
    "**All checks are green on `main` in both repos.**",
    `- **Core** (commit \`dca645f\`): build, assistant-unit, smoke and parity-proof all passed [${coreCheck("assistant-unit")}] [${coreCheck("parity-proof")}]`,
    `- **Reporting** (commit \`27d9878\`): build, assistant-unit and help-proof all passed [${reportingCheck("assistant-unit")}] [${reportingCheck("help-proof")}]`,
    "- **Watch out:** `assistant-unit` covers the assistant UI only; nothing in CI calls the Reporting BFF chat route yet.",
    "",
    "_Sample data — connect GitHub for live check runs._",
  ].join("\n"),
  relatedQuestions: ["What's going on with LIQ-24?", "What merged on Core this week?", "Which tickets are In Review?"],
};

const MERGED: FixtureAnswer = {
  requires: [`github:PR:${CORE}#10`, `github:PR:${REPORTING}#10`, `github:PR:${REPORTING}#2`],
  reply: [
    "**Most recent merges are AI Assistant work, landed in matching pairs across Core and Reporting.**",
    `- **Assistant rail:** Grok chat on Core [github:PR:${CORE}#5] and the Reporting chrome [github:PR:${REPORTING}#5], followed by UX polish, docking and viewport fixes.`,
    `- **Tests:** Vitest + RTL assistant unit tests added to both repos [github:PR:${CORE}#10] [github:PR:${REPORTING}#10].`,
    `- **Parity fixes:** Help centre parity merged on Reporting [github:PR:${REPORTING}#2]; the Core-side Help test is still open.`,
    "",
    "_Sample data — connect GitHub for live pull requests._",
  ].join("\n"),
  relatedQuestions: ["Is assistant-unit passing on Core main?", "What's going on with LIQ-24?", "Which parity PRs are still open?"],
};

const OVERVIEW: FixtureAnswer = {
  requires: ["linear:LIQ-24", "linear:LIQ-17", "linear:LIQ-21", "linear:LIQ-12"],
  reply: [
    "**Seven LIQ tickets are active; most are parity fixes waiting in review.**",
    "- **In Progress (1):** LIQ-24, assistant chat missing on Reporting [linear:LIQ-24]",
    "- **In Review (4):** LIQ-17 Notifications [linear:LIQ-17], LIQ-16 Help centre [linear:LIQ-16], LIQ-15 and LIQ-9 deep links [linear:LIQ-15] [linear:LIQ-9]",
    "- **Todo (1):** LIQ-21, empty assistant follow-ups [linear:LIQ-21]",
    "- **Done (1):** LIQ-12, dashboard dead space [linear:LIQ-12]",
    "",
    "_Sample data — connect Linear for live tickets._",
  ].join("\n"),
  relatedQuestions: ["What's blocking LIQ-24?", "Which PRs reference LIQ-17?", "What merged on Reporting this week?"],
};

const TREND: FixtureAnswer = {
  requires: ["posthog:insight:assistant-adoption-28d", "linear:LIQ-24", "linear:LIQ-21"],
  reply: [
    "**There isn't enough history to call a trend; the signals point to a Reporting-specific gap rather than rising failures overall.**",
    "- **Usage:** navigation to the AI Assistant is up, but chats per org are flat, and Reporting `bff_status` errors rose after the chrome shipped [posthog:insight:assistant-adoption-28d]",
    "- **Tickets:** two assistant-labelled tickets are open: LIQ-24 (In Progress) [linear:LIQ-24] and LIQ-21 (Todo) [linear:LIQ-21]",
    `- **Delivery:** most recent merges are assistant work on both repos [github:PR:${CORE}#5] [github:PR:${REPORTING}#5]`,
    "- **Confidence:** low; this is under two weeks of sample data, with no error-rate series.",
    "",
    "_Sample data — PostHog is sample-only in this MVP._",
  ].join("\n"),
  relatedQuestions: ["What's going on with LIQ-24?", "Is assistant-unit passing on Core main?", "Which tickets mention the AI assistant?"],
};

export function fixtureAnswerFor(intent: Intent, issueIds: string[]): FixtureAnswer | null {
  switch (intent) {
    case "issue_status":
      return issueIds.includes("LIQ-24") ? LIQ_24 : null;
    case "ci_health":
      return CI;
    case "merged_prs":
      return MERGED;
    case "linear_overview":
      return OVERVIEW;
    case "trend":
      return TREND;
    default:
      return null;
  }
}
