import { describe, expect, it } from "vitest";
import { planRetrieval } from "../../server/retrieval/router.js";

const REPOS = ["gloverthomas/liquid-accounting-core", "gloverthomas/liquid-accounting-reporting"];

describe("planRetrieval", () => {
  it("routes ticket ids to issue_status and normalises case", () => {
    const plan = planRetrieval("What's going on with liq-24 and LIQ-16?", REPOS);
    expect(plan.intent).toBe("issue_status");
    expect(plan.issueIds).toEqual(["LIQ-24", "LIQ-16"]);
    expect(plan.repos).toEqual(REPOS);
  });

  it("detects merged PR questions scoped to one repo and window", () => {
    const plan = planRetrieval("What merged on liquid-accounting-reporting in the last 7 days?", REPOS);
    expect(plan.intent).toBe("merged_prs");
    expect(plan.repos).toEqual(["gloverthomas/liquid-accounting-reporting"]);
    expect(plan.sinceDays).toBe(7);
    expect(plan.wantsChecks).toBe(false);
  });

  it("detects CI health questions", () => {
    const plan = planRetrieval("Is assistant-unit passing on Core main?", REPOS);
    expect(plan.intent).toBe("ci_health");
    expect(plan.wantsChecks).toBe(true);
    expect(plan.repos).toEqual(["gloverthomas/liquid-accounting-core"]);
  });

  it("detects trend questions and asks for PostHog", () => {
    const plan = planRetrieval("Are AI assistant failures increasing?", REPOS);
    expect(plan.intent).toBe("trend");
    expect(plan.wantsPosthog).toBe(true);
  });

  it("extracts Linear states for overview questions", () => {
    const plan = planRetrieval("How many Linear bugs are in Todo vs Done?", REPOS);
    expect(plan.intent).toBe("linear_overview");
    expect(plan.linearStates).toEqual(["Todo", "Done"]);
  });

  it("caps windows and falls back to general", () => {
    expect(planRetrieval("anything in the last 90 days", REPOS).sinceDays).toBe(30);
    expect(planRetrieval("this week", REPOS).sinceDays).toBe(7);
    expect(planRetrieval("this month", REPOS).sinceDays).toBe(30);
    expect(planRetrieval("today", REPOS).sinceDays).toBe(2);
    const general = planRetrieval("Tell me something useful", REPOS);
    expect(general.intent).toBe("general");
    expect(general.sinceDays).toBe(14);
    expect(general.keywords).toContain("useful");
  });

  it("treats 'what issues have we had' as a problems overview, not a ticket list", () => {
    const plan = planRetrieval("What issues have we had from our code base this week?", REPOS);
    expect(plan.intent).toBe("problems");
    expect(plan.style).toBe("overview");
    expect(plan.sinceDays).toBe(7);
    expect(plan.wantsChecks).toBe(true);
    expect(plan.keywords).not.toContain("issues");
  });

  it("routes interview handbook questions to how_it_works, not workflow_plan", () => {
    const signal =
      "Why does Reporting POST /signal create a Linear Todo but not start a Cursor SDK plan run?";
    expect(planRetrieval(signal, REPOS).intent).toBe("how_it_works");
    expect(planRetrieval("Why not just a Cursor skill in each repo instead of liquid-workflow?", REPOS).intent).toBe("how_it_works");
    expect(planRetrieval("Is the eval harness an MCP?", REPOS).intent).toBe("how_it_works");
    expect(planRetrieval("How does Reporting POST /signal relate to starting a plan run?", REPOS).intent).toBe("how_it_works");
    expect(planRetrieval("What's the Cursor plan for LIQ-24?", REPOS).intent).toBe("workflow_plan");
  });

  it("chooses overview style for summaries and direct style for specific questions", () => {
    expect(planRetrieval("Give me an overview of what's been happening", REPOS).style).toBe("overview");
    expect(planRetrieval("Catch me up on Reporting", REPOS).style).toBe("overview");
    expect(planRetrieval("Is assistant-unit passing on Core main?", REPOS).style).toBe("direct");
    expect(planRetrieval("What's the status of LIQ-24?", REPOS).style).toBe("direct");
    expect(planRetrieval("What went wrong with the build?", REPOS).intent).toBe("ci_health");
    expect(planRetrieval("Any regressions or broken deep links?", REPOS).intent).toBe("problems");
  });
});

