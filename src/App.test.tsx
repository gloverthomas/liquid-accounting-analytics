import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { chatResponse, jsonRes } from "./test/fixtures";

const ORGS = { requestId: "r", orgs: [{ id: "org_liquid_coffee", name: "Liquid Coffee Co.", role: "Viewer" }] };
const PROMPTS = { requestId: "r", prompts: [{ id: "liq-24", label: "Open LIQ-24 status", query: "What's the status of LIQ-24?" }] };

const fetchMock = vi.fn<typeof fetch>();

function route(handlers: Record<string, () => Response>) {
  fetchMock.mockImplementation(async (input) => {
    const path = String(input);
    const handler = handlers[path];
    if (!handler) throw new Error(`unexpected ${path}`);
    return handler();
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("App", () => {
  it("shows the hero, sends a pill, and renders the cited answer", async () => {
    route({
      "/api/v1/orgs": () => jsonRes(ORGS),
      "/api/v1/suggested-prompts": () => jsonRes(PROMPTS),
      "/api/v1/insights/chat": () => jsonRes(chatResponse()),
    });
    render(<App />);

    expect(await screen.findByRole("heading", { name: /What do you want to know/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Switch organisation/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /Open LIQ-24 status/ }));

    expect(await screen.findByRole("article", { name: "Liquid Insights answer" })).toBeInTheDocument();
    expect(screen.getByText("What's the status of LIQ-24?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /LIQ-24 AI Assistant parity/ })).toHaveAttribute("href", "https://linear.app/x/LIQ-24");
    expect(screen.getByText("Live data")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask a follow-up…")).toBeInTheDocument();
  });

  it("sends typed questions with Enter, supports Shift+Enter, and can start over", async () => {
    route({
      "/api/v1/orgs": () => jsonRes(ORGS),
      "/api/v1/suggested-prompts": () => jsonRes(PROMPTS),
      "/api/v1/insights/chat": () => jsonRes(chatResponse({ provider: "fixture", retrievalMeta: { ...chatResponse().retrievalMeta, connectorModes: { linear: "sample" } } })),
    });
    render(<App />);
    const box = await screen.findByRole("textbox");
    expect(screen.getByRole("button", { name: /Send question/ })).toBeDisabled();

    await userEvent.type(box, "Line one{Shift>}{Enter}{/Shift}line two{Enter}");
    expect(await screen.findByText("Sample data")).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls.find(([p]) => p === "/api/v1/insights/chat")!;
    expect(JSON.parse(String(init!.body)).message).toBe("Line one\nline two");

    await userEvent.click(screen.getByRole("button", { name: /New conversation/ }));
    expect(await screen.findByRole("heading", { name: /What do you want to know/ })).toBeInTheDocument();
  });


  it("shows the access gate on 401 and unlocks with the right code", async () => {
    let unlocked = false;
    route({
      "/api/v1/orgs": () => (unlocked ? jsonRes(ORGS) : jsonRes({ requestId: "r", error: "unauthorized" }, 401)),
      "/api/v1/suggested-prompts": () => (unlocked ? jsonRes(PROMPTS) : jsonRes({ requestId: "r", error: "unauthorized" }, 401)),
      "/api/v1/session": () => {
        unlocked = true;
        return new Response(null, { status: 204 });
      },
    });
    render(<App />);
    const input = await screen.findByLabelText("Access code");
    await userEvent.type(input, "coffee-demo{Enter}");
    expect(await screen.findByRole("heading", { name: /What do you want to know/ })).toBeInTheDocument();
  });

  it("shows a wrong-code message", async () => {
    route({
      "/api/v1/orgs": () => jsonRes({ requestId: "r", error: "unauthorized" }, 401),
      "/api/v1/suggested-prompts": () => jsonRes({ requestId: "r", error: "unauthorized" }, 401),
      "/api/v1/session": () => jsonRes({ requestId: "r", error: "invalid_access_code" }, 401),
    });
    render(<App />);
    await userEvent.type(await screen.findByLabelText("Access code"), "nope{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("isn't right");
  });

  it("fails closed with a clear message when auth is not configured, and retries on error", async () => {
    route({ "/api/v1/orgs": () => jsonRes({ requestId: "r", error: "auth_not_configured" }, 503), "/api/v1/suggested-prompts": () => jsonRes(PROMPTS) });
    const { unmount } = render(<App />);
    expect(await screen.findByRole("heading", { name: "Not set up yet" })).toBeInTheDocument();
    unmount();

    let calls = 0;
    route({
      "/api/v1/orgs": () => (++calls === 1 ? jsonRes({ requestId: "r", error: "internal_error" }, 500) : jsonRes(ORGS)),
      "/api/v1/suggested-prompts": () => jsonRes(PROMPTS),
    });
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /What do you want to know/ })).toBeInTheDocument());
  });
});
