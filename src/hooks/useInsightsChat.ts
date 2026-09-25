/** Session-only chat state (MVP: nothing persisted). */
import { useCallback, useEffect, useRef, useState } from "react";
import { HISTORY_MAX_TURNS, MESSAGE_MAX_CHARS, MESSAGE_MIN_CHARS, type ChatResponse, type ChatTurn } from "../../shared/contracts";
import { api, describeError } from "../lib/api";

export type ThreadEntry =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; response: ChatResponse }
  | { id: string; role: "error"; message: string; retryOf: string };

export interface InsightsChat {
  entries: ThreadEntry[];
  isSending: boolean;
  send: (message: string) => Promise<void>;
  retry: (message: string) => Promise<void>;
  reset: () => void;
}

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++counter}`;

export function isValidMessage(message: string): boolean {
  const length = message.trim().length;
  return length >= MESSAGE_MIN_CHARS && length <= MESSAGE_MAX_CHARS;
}

/** Last N user/assistant turns in wire format; errors are not part of history. */
export function toHistory(entries: ThreadEntry[]): ChatTurn[] {
  return entries
    .flatMap((entry): ChatTurn[] => {
      if (entry.role === "user") return [{ role: "user", content: entry.content }];
      if (entry.role === "assistant") return [{ role: "assistant", content: entry.response.reply }];
      return [];
    })
    .slice(-HISTORY_MAX_TURNS);
}

export function useInsightsChat(orgId: string | undefined): InsightsChat {
  const [entries, setEntries] = useState<ThreadEntry[]>([]);
  const [isSending, setIsSending] = useState(false);
  const entriesRef = useRef(entries);
  const abortRef = useRef<AbortController | null>(null);

  // Single write path so the ref (read by async callbacks) never lags state.
  const commit = useCallback((update: (prev: ThreadEntry[]) => ThreadEntry[]) => {
    entriesRef.current = update(entriesRef.current);
    setEntries(entriesRef.current);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = useCallback(
    async (message: string, history: ChatTurn[]) => {
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;
      setIsSending(true);
      try {
        const response = await api.chat({ message, history, orgId }, controller.signal);
        commit((prev) => [...prev, { id: nextId("a"), role: "assistant", response }]);
      } catch (error) {
        if (controller.signal.aborted) return;
        commit((prev) => [...prev, { id: nextId("e"), role: "error", message: describeError(error), retryOf: message }]);
      } finally {
        if (abortRef.current === controller) setIsSending(false);
      }
    },
    [orgId, commit],
  );

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!isValidMessage(message) || isSending) return;
      const history = toHistory(entriesRef.current);
      commit((prev) => [...prev, { id: nextId("u"), role: "user", content: message }]);
      await ask(message, history);
    },
    [ask, commit, isSending],
  );

  const retry = useCallback(
    async (message: string) => {
      if (isSending) return;
      // Drop the trailing error card, keep the user's bubble, re-ask.
      const withoutError = entriesRef.current.filter((entry, i, all) => !(i === all.length - 1 && entry.role === "error"));
      commit(() => withoutError);
      await ask(message, toHistory(withoutError.slice(0, -1)));
    },
    [ask, commit, isSending],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setIsSending(false);
    commit(() => []);
  }, [commit]);

  return { entries, isSending, send, retry, reset };
}
