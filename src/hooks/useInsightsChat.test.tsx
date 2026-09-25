import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatResponse, jsonRes } from "../test/fixtures";
import { isValidMessage, toHistory, useInsightsChat, type ThreadEntry } from "./useInsightsChat";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("useInsightsChat", () => {
  it("sends a message with history and appends the answer", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes(chatResponse())).mockResolvedValueOnce(jsonRes(chatResponse({ reply: "second" })));
    const { result } = renderHook(() => useInsightsChat("org_liquid_coffee"));

    await act(() => result.current.send("  What's up with LIQ-24?  "));
    expect(result.current.entries.map((e) => e.role)).toEqual(["user", "assistant"]);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init!.body))).toEqual({ message: "What's up with LIQ-24?", history: [], orgId: "org_liquid_coffee" });

    await act(() => result.current.send("And CI?"));
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1][1]!.body));
    expect(secondBody.history).toEqual([
      { role: "user", content: "What's up with LIQ-24?" },
      { role: "assistant", content: chatResponse().reply },
    ]);
    expect(result.current.isSending).toBe(false);
  });

  it("ignores invalid messages", async () => {
    const { result } = renderHook(() => useInsightsChat(undefined));
    await act(() => result.current.send(" x "));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.entries).toEqual([]);
  });

  it("shows a friendly error and retries", async () => {
    fetchMock.mockResolvedValueOnce(jsonRes({ requestId: "r", error: "rate_limit_exceeded" }, 429)).mockResolvedValueOnce(jsonRes(chatResponse()));
    const { result } = renderHook(() => useInsightsChat(undefined));

    await act(() => result.current.send("status of LIQ-24"));
    const error = result.current.entries.at(-1)!;
    expect(error.role).toBe("error");
    expect(error.role === "error" && error.message).toMatch(/faster than we can answer/);

    await act(() => result.current.retry("status of LIQ-24"));
    await waitFor(() => expect(result.current.entries.map((e) => e.role)).toEqual(["user", "assistant"]));
  });

  it("maps network failures and resets", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useInsightsChat(undefined));
    await act(() => result.current.send("hello there"));
    const last = result.current.entries.at(-1)!;
    expect(last.role === "error" && last.message).toMatch(/Can't reach/);
    act(() => result.current.reset());
    expect(result.current.entries).toEqual([]);
  });
});

describe("helpers", () => {
  it("validates length bounds", () => {
    expect(isValidMessage("a")).toBe(false);
    expect(isValidMessage("ok")).toBe(true);
    expect(isValidMessage("x".repeat(2001))).toBe(false);
  });

  it("builds history from the last turns, skipping errors", () => {
    const entries: ThreadEntry[] = [
      ...Array.from({ length: 4 }, (_, i): ThreadEntry => ({ id: `u${i}`, role: "user", content: `q${i}` })),
      { id: "e", role: "error", message: "x", retryOf: "q" },
      { id: "a", role: "assistant", response: chatResponse({ reply: "r" }) },
      ...Array.from({ length: 3 }, (_, i): ThreadEntry => ({ id: `v${i}`, role: "user", content: `z${i}` })),
    ];
    const history = toHistory(entries);
    expect(history).toHaveLength(6);
    expect(history.some((t) => t.content === "x")).toBe(false);
    expect(history.at(-1)).toEqual({ role: "user", content: "z2" });
  });
});
