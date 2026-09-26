/**
 * Everything Insights can answer, grouped for the "What can I ask?" panel and
 * the in-chat help answer. Each example is a real, routable question.
 */
export interface AskTopic {
  id: string;
  title: string;
  blurb: string;
  sources: string;
  examples: string[];
}

export const ASK_CATALOG: AskTopic[] = [
  {
    id: "tickets",
    title: "Tickets",
    blurb: "Status, what's in flight and what shipped.",
    sources: "Linear",
    examples: ["What's the status of LIQ-24 and are there PRs?", "Which tickets are still in progress?", "How many Linear bugs are in Todo vs Done?"],
  },
  {
    id: "code",
    title: "Pull requests & CI",
    blurb: "Merges, failing checks and flaky jobs.",
    sources: "GitHub",
    examples: ["What merged this week?", "How often has assistant-unit failed over the last 2 weeks?", "How many PRs merged per day this week, Core vs Reporting?"],
  },
  {
    id: "problems",
    title: "Problems & errors",
    blurb: "One overview across bugs, failing CI and production errors.",
    sources: "Linear · GitHub · Sentry",
    examples: ["What issues have we had from our code base this week?", "What errors are we seeing in production?", "Show Sentry errors per day, Core vs Reporting"],
  },
  {
    id: "product",
    title: "Product analytics",
    blurb: "Usage of Core and Reporting, and BFF health.",
    sources: "PostHog",
    examples: ["How are people using the product this week?", "How is the AI Assistant being used?", "How often has the BFF disconnected this week?"],
  },
  {
    id: "workflow",
    title: "Cursor workflow",
    blurb: "The agent's plan, eval results and where a ticket is up to.",
    sources: "liquid-workflow",
    examples: ["What's the Cursor plan for LIQ-24?", "How are our evals tracking?", "Where is LIQ-24 in the pipeline?"],
  },
  {
    id: "how",
    title: "How it works & why",
    blurb: "Onboarding and triage: the workflow, tooling, security, and the decisions behind them.",
    sources: "Docs · decision records · PRs",
    examples: ["How does the human write gate work?", "Why did we build a deterministic eval harness?", "How is the workflow API secured?", "I'm new, where do I start?"],
  },
  {
    id: "actions",
    title: "Actions (you confirm)",
    blurb: "Kick off work. Nothing changes until you click Confirm.",
    sources: "Linear · liquid-workflow",
    examples: ["Move LIQ-17 to In Progress", "What's the Cursor plan for LIQ-24?"],
  },
  {
    id: "usage",
    title: "Insights itself",
    blurb: "What people ask here (topics only, never the text).",
    sources: "PostHog",
    examples: ["What have people been asking this week?"],
  },
];

const HELP = /^\s*(help|\?+|what can (i|we|you) (ask|do)( here| with (this|it|insights|you))?|what (questions|kinds? of questions|things) can (i|we) ask( here| you)?|what do you (know|do)|how do i use (this|insights))\s*[?.!]*\s*$/i;

/** "What can I ask?" and friends; anchored so real questions containing "help" aren't caught. */
export function isHelpQuestion(message: string): boolean {
  return HELP.test(message);
}
