/**
 * Chat actions. Entries live in the conversation store; every request writes
 * back to the conversation it was sent from (by id), so a reply still lands
 * if the viewer has switched to another chat in the meantime.
 */
import { useCallback, useEffect, useRef } from "react";
import { HISTORY_MAX_TURNS, MESSAGE_MAX_CHARS, MESSAGE_MIN_CHARS, type ChatTurn } from "../../shared/contracts";
import { api, describeError } from "../lib/api";
import type { ConversationsApi, ThreadEntry } from "./useConversations";

export type { ThreadEntry } from "./useConversations";

type Store = Pick<ConversationsApi, "entriesOf" | "update" | "isPending" | "setPending">;

export interface InsightsChat {
  entries: ThreadEntry[];
  isSending: boolean;
  send: (message: string) => Promise<void>;
  retry: (message: string) => Promise<void>;
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

/** In-flight requests live for the page lifetime, keyed by conversation — not by what's on screen. */
const inFlight = new Map<string, AbortController>();

export function abortConversation(id: string): void {
  inFlight.get(id)?.abort();
  inFlight.delete(id);
}

export function useInsightsChat(orgId: string | undefined, conversationId: string, store: Store): InsightsChat {
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  });

  const ask = useCallback(
    async (id: string, message: string, history: ChatTurn[]) => {
      const controller = new AbortController();
      inFlight.set(id, controller);
      storeRef.current.setPending(id, true);
      try {
        const response = await api.chat({ message, history, orgId }, controller.signal);
        storeRef.current.update(id, (prev) => [...prev, { id: nextId("a"), role: "assistant", response }]);
      } catch (error) {
        if (controller.signal.aborted) return;
        storeRef.current.update(id, (prev) => [...prev, { id: nextId("e"), role: "error", message: describeError(error), retryOf: message }]);
      } finally {
        if (inFlight.get(id) === controller) inFlight.delete(id);
        storeRef.current.setPending(id, false);
      }
    },
    [orgId],
  );

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      const id = conversationId;
      if (!isValidMessage(message) || storeRef.current.isPending(id)) return;
      const history = toHistory(storeRef.current.entriesOf(id));
      storeRef.current.update(id, (prev) => [...prev, { id: nextId("u"), role: "user", content: message }]);
      await ask(id, message, history);
    },
    [ask, conversationId],
  );

  const retry = useCallback(
    async (message: string) => {
      const id = conversationId;
      if (storeRef.current.isPending(id)) return;
      // Drop the trailing error card (if any), keep the user's bubble, re-ask.
      const kept = storeRef.current.entriesOf(id).filter((entry, i, all) => !(i === all.length - 1 && entry.role === "error"));
      storeRef.current.update(id, () => kept);
      await ask(id, message, toHistory(kept.slice(0, -1)));
    },
    [ask, conversationId],
  );

  return { entries: store.entriesOf(conversationId), isSending: store.isPending(conversationId), send, retry };
}
