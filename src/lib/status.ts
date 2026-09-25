/** Maps connector status strings to the semantic colour tone used by source chips. */

export type Tone = "good" | "wait" | "bad" | "neutral";

export function statusTone(status: string | undefined): Tone {
  const s = (status ?? "").toLowerCase();
  if (["success", "merged", "done", "completed"].includes(s)) return "good";
  if (["failure", "cancelled", "timed_out", "action_required", "closed", "canceled"].includes(s)) return "bad";
  if (["in progress", "in review", "open", "in_progress", "queued", "pending", "todo", "sample"].includes(s)) return "wait";
  return "neutral";
}
