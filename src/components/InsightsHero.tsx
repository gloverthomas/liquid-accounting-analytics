import type { SuggestedPrompt } from "../../shared/contracts";
import { Composer } from "./Composer";
import { PromptPills } from "./PromptPills";

interface InsightsHeroProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onAsk: (query: string) => void;
  prompts: SuggestedPrompt[];
  disabled: boolean;
}

export function InsightsHero({ draft, onDraftChange, onAsk, prompts, disabled }: InsightsHeroProps) {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <p className="kicker reveal reveal-1">
        <span className="kicker-dot" aria-hidden="true" />
        Linear · GitHub · CI, read-only
      </p>
      <h1 id="hero-heading" className="hero-title reveal reveal-2">
        What do you want <em>to know?</em>
      </h1>
      <p className="hero-sub reveal reveal-2">Plain-English answers about tickets, pull requests and checks, with a source for every claim.</p>
      <div className="reveal reveal-3">
        <Composer value={draft} onChange={onDraftChange} onSubmit={onAsk} disabled={disabled} autoFocus />
      </div>
      <div className="reveal reveal-4">
        <PromptPills items={prompts} onPick={onAsk} disabled={disabled} label="Try asking" className="pills-hero" />
      </div>
    </section>
  );
}
