import { AlertTriangle, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Organisation, SuggestedPrompt } from "../shared/contracts";
import { AccessGate } from "./components/AccessGate";
import { ChatThread } from "./components/ChatThread";
import { Composer } from "./components/Composer";
import { InsightsHero } from "./components/InsightsHero";
import { useInsightsChat } from "./hooks/useInsightsChat";
import { api, ApiRequestError } from "./lib/api";

type Boot =
  | { status: "loading" }
  | { status: "locked" }
  | { status: "misconfigured" }
  | { status: "error" }
  | { status: "ready"; orgs: Organisation[]; prompts: SuggestedPrompt[] };

function useBootstrap(): [Boot, () => void] {
  const [boot, setBoot] = useState<Boot>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.orgs(), api.suggestedPrompts()])
      .then(([orgs, prompts]) => !cancelled && setBoot({ status: "ready", orgs, prompts }))
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = error instanceof ApiRequestError ? error.status : 0;
        setBoot({ status: status === 401 ? "locked" : status === 503 ? "misconfigured" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setBoot({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);
  return [boot, reload];
}

function FullPageMessage({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <main className="gate" role="alert">
      <AlertTriangle size={24} color="var(--status-bad)" aria-hidden="true" />
      <h1>{title}</h1>
      <p>{body}</p>
      {onRetry ? (
        <button type="button" className="text-button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </main>
  );
}

function Workspace({ orgs, prompts }: { orgs: Organisation[]; prompts: SuggestedPrompt[] }) {
  // Single-org MVP: scope chat to the default org (switcher removed from the UI).
  const orgId = orgs[0]?.id;
  const [draft, setDraft] = useState("");
  const chat = useInsightsChat(orgId);
  const inThread = chat.entries.length > 0;

  const ask = (query: string) => {
    setDraft("");
    void chat.send(query);
  };


  return (
    <div className="shell" data-mode={inThread ? "thread" : "hero"}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Liquid Insights home">
          <img src="/brand/liquid-mark.png" alt="" width={28} height={28} />
          <span className="brand-name">
            Liquid <span>Insights</span>
          </span>
        </a>
      </header>

      <main className="main">
        {inThread ? (
          <>
            <h1 className="visually-hidden">Liquid Insights conversation</h1>
            <ChatThread entries={chat.entries} isSending={chat.isSending} onAsk={ask} onRetry={(q) => void chat.retry(q)} />
          </>
        ) : (
          <InsightsHero draft={draft} onDraftChange={setDraft} onAsk={ask} prompts={prompts} disabled={chat.isSending} />
        )}
      </main>

      {inThread ? (
        <div className="dock">
          <Composer value={draft} onChange={setDraft} onSubmit={ask} disabled={chat.isSending} placeholder="Ask a follow-up…" />
          <div className="dock-actions">
            <button type="button" className="text-button" onClick={chat.reset}>
              <RotateCcw size={12} aria-hidden="true" /> New conversation
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [boot, reload] = useBootstrap();

  switch (boot.status) {
    case "loading":
      return (
        <main className="gate" aria-busy="true">
          <p className="kicker">
            <span className="kicker-dot" aria-hidden="true" />
            Loading Liquid Insights…
          </p>
        </main>
      );
    case "locked":
      return <AccessGate onUnlocked={reload} />;
    case "misconfigured":
      return <FullPageMessage title="Not set up yet" body="This deployment has no access control configured, so it's locked. An admin needs to set the access code and session secret." />;
    case "error":
      return <FullPageMessage title="Can't reach Insights" body="The Insights service didn't respond." onRetry={reload} />;
    case "ready":
      return <Workspace orgs={boot.orgs} prompts={boot.prompts} />;
  }
}
