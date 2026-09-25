import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatResponse } from "../../shared/contracts";
import type { ThreadEntry } from "../hooks/useInsightsChat";
import { AnswerMarkdown } from "./AnswerMarkdown";
import { CitationList } from "./CitationList";
import { PromptPills } from "./PromptPills";
import { SourcesAccordion } from "./SourcesAccordion";

interface ChatThreadProps {
  entries: ThreadEntry[];
  isSending: boolean;
  onAsk: (query: string) => void;
  onRetry: (query: string) => void;
}

const PENDING_STAGES = ["Searching Linear and GitHub…", "Ranking the most relevant sources…", "Asking Grok to summarise…"];
const STAGE_INTERVAL_MS = 1_800;

function sourceBadge(response: ChatResponse) {
  const modes = Object.values(response.retrievalMeta.connectorModes);
  if (response.provider === "digest") return <span className="badge badge-digest">Sources only</span>;
  if (modes.includes("sample")) return <span className="badge badge-sample">Sample data</span>;
  return <span className="badge badge-live">Live data</span>;
}

function AssistantCard({ entryId, response, onAsk, disabled }: { entryId: string; response: ChatResponse; onAsk: (q: string) => void; disabled: boolean }) {
  const anchorPrefix = `src-${entryId}`;
  const citationIndex = useMemo(() => new Map(response.citations.map((c, i) => [c.id, i + 1])), [response.citations]);
  const followUps = response.relatedQuestions.map((q, i) => ({ id: `${entryId}-f${i}`, label: q, query: q }));

  return (
    <article className="answer" aria-label="Liquid Insights answer">
      <header className="answer-head">
        <span>Liquid Insights</span>
        {sourceBadge(response)}
      </header>
      <AnswerMarkdown text={response.reply} citationIndex={citationIndex} anchorPrefix={anchorPrefix} />
      <CitationList citations={response.citations} anchorPrefix={anchorPrefix} />
      {followUps.length ? (
        <section className="followups" aria-label="Suggested follow-ups">
          <h3 className="section-label">Ask next</h3>
          <PromptPills items={followUps} onPick={onAsk} disabled={disabled} label={undefined} />
        </section>
      ) : null}
      <SourcesAccordion response={response} />
    </article>
  );
}

function PendingCard() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, PENDING_STAGES.length - 1)), STAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="answer pending" aria-busy="true">
      <p className="pending-status" role="status">
        <LoaderCircle size={14} aria-hidden="true" />
        {PENDING_STAGES[stage]}
      </p>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}

export function ChatThread({ entries, isSending, onAsk, onRetry }: ChatThreadProps) {
  const threadRef = useRef<HTMLElement>(null);

  // Keep the latest question pinned at the top so its answer reads beneath it.
  useEffect(() => {
    const questions = threadRef.current?.querySelectorAll(".turn-user");
    questions?.[questions.length - 1]?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [entries.length, isSending]);

  return (
    <section ref={threadRef} className="thread" aria-label="Conversation" aria-live="polite">
      {entries.map((entry) => {
        if (entry.role === "user") {
          return (
            <p key={entry.id} className="turn-user">
              {entry.content}
            </p>
          );
        }
        if (entry.role === "assistant") {
          return <AssistantCard key={entry.id} entryId={entry.id} response={entry.response} onAsk={onAsk} disabled={isSending} />;
        }
        return (
          <div key={entry.id} className="error-card" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <p>{entry.message}</p>
              <button type="button" className="text-button" onClick={() => onRetry(entry.retryOf)} disabled={isSending}>
                Try again
              </button>
            </div>
          </div>
        );
      })}
      {isSending ? <PendingCard /> : null}
    </section>
  );
}
