import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PipelineTimeline as Timeline, ProposedAction } from "../../shared/contracts";
import { ActionProposal } from "./ActionProposal";
import { PipelineTimeline } from "./PipelineTimeline";

afterEach(cleanup);

const timeline: Timeline = {
  issueId: "LIQ-24",
  title: "Assistant replies slow",
  url: "https://linear.app/x/LIQ-24",
  state: "Todo",
  steps: [
    { key: "signal", label: "Triage", status: "done", at: "2026-09-20T00:00:00Z", detail: "Ticket opened", url: "https://linear.app/x/LIQ-24" },
    { key: "implement", label: "Implement", status: "failed", at: null, detail: "Blocked by write gate", url: "javascript:alert(1)" },
    { key: "approval", label: "Human approval", status: "current", at: null, detail: "Awaiting approval", url: null },
  ],
};

describe("PipelineTimeline", () => {
  it("renders each stage with an accessible status and safe links only", () => {
    render(<PipelineTimeline timeline={timeline} />);
    expect(screen.getByRole("figure", { name: "LIQ-24 pipeline" })).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.getAttribute("data-status"))).toEqual(["done", "failed", "current"]);
    expect(items[2].getAttribute("aria-current")).toBe("step");
    expect(items[1].textContent).toContain("Failed:");
    expect(screen.getByRole("link", { name: /Triage/ }).getAttribute("href")).toBe("https://linear.app/x/LIQ-24");
    expect(screen.queryByRole("link", { name: /Implement/ })).toBeNull();
  });
});

describe("ActionProposal for workflow_implement", () => {
  it("labels the button and explains the gates", async () => {
    const action: ProposedAction = { kind: "workflow_implement", issueId: "LIQ-24", issueTitle: "t", url: "https://x", fromState: "Todo", toState: "In Review", token: "tok", expiresAt: 1 };
    const onConfirm = vi.fn().mockResolvedValue(null);
    render(<ActionProposal action={action} onConfirm={onConfirm} onCancel={() => {}} />);
    expect(screen.getByRole("region", { name: "Confirm approving LIQ-24" }).textContent).toContain("PRs still need a human to merge");
    await userEvent.click(screen.getByRole("button", { name: "Approve & implement" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
