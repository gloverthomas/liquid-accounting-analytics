import { describe, expect, it } from "vitest";
import { parseGrokResponse } from "../../server/grok/parseResponse.js";

const known = new Set(["linear:LIQ-24", "github:PR:gloverthomas/liquid-accounting-core#5"]);

describe("parseGrokResponse", () => {
  it("parses a well-formed JSON answer", () => {
    const raw = JSON.stringify({
      reply: "**LIQ-24 is In Progress** [linear:LIQ-24]",
      citations: ["linear:LIQ-24"],
      relatedQuestions: ["a", "b", "c", "d"],
    });
    const parsed = parseGrokResponse(raw, known);
    expect(parsed).toEqual({
      reply: "**LIQ-24 is In Progress** [linear:LIQ-24]",
      citationIds: ["linear:LIQ-24"],
      relatedQuestions: ["a", "b", "c"],
    });
  });

  it("strips markdown fences", () => {
    const raw = '```json\n{"reply":"ok","citations":[],"relatedQuestions":[]}\n```';
    expect(parseGrokResponse(raw, known)?.reply).toBe("ok");
  });

  it("recovers a JSON object wrapped in prose", () => {
    const raw = 'Sure! Here you go: {"reply":"ok","citations":[]} Hope that helps.';
    expect(parseGrokResponse(raw, known)?.reply).toBe("ok");
  });

  it("returns null for malformed output", () => {
    expect(parseGrokResponse("not json at all", known)).toBeNull();
    expect(parseGrokResponse("{broken", known)).toBeNull();
    expect(parseGrokResponse("[1,2]", known)).toBeNull();
    expect(parseGrokResponse('{"reply":"   "}', known)).toBeNull();
  });

  it("drops hallucinated citation ids from the list and the reply text", () => {
    const raw = JSON.stringify({
      reply: "Fixed in [github:PR:gloverthomas/liquid-accounting-core#99] and tracked in [linear:LIQ-24]",
      citations: ["linear:LIQ-999", { id: "[github:PR:gloverthomas/liquid-accounting-core#5]" }, 42],
    });
    const parsed = parseGrokResponse(raw, known);
    expect(parsed?.reply).toBe("Fixed in and tracked in [linear:LIQ-24]");
    expect(parsed?.citationIds).toEqual(["linear:LIQ-24", "github:PR:gloverthomas/liquid-accounting-core#5"]);
  });

  it("ignores non-string related questions", () => {
    const raw = JSON.stringify({ reply: "ok", relatedQuestions: ["  one  ", 2, null, ""] });
    expect(parseGrokResponse(raw, known)?.relatedQuestions).toEqual(["one"]);
  });
});
