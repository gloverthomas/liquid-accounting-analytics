import { ArrowRight, LoaderCircle, Ticket } from "lucide-react";
import { useState } from "react";
import type { ProposedAction } from "../../shared/contracts";

interface ActionProposalProps {
  action: ProposedAction;
  /** Resolves to an inline error message, or null on success. */
  onConfirm: () => Promise<string | null>;
  onCancel: () => void;
  disabled?: boolean;
}

/** The only way a ticket changes state from Liquid Insights: an explicit click here. */
export function ActionProposal({ action, onConfirm, onCancel, disabled = false }: ActionProposalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    const message = await onConfirm();
    setBusy(false);
    setError(message);
  };

  return (
    <section className="proposal" aria-label={`Confirm moving ${action.issueId}`}>
      <p className="proposal-change">
        <Ticket size={16} aria-hidden="true" />
        <span className="proposal-id mono">{action.issueId}</span>
        <span className="proposal-state">{action.fromState}</span>
        <ArrowRight size={14} aria-hidden="true" />
        <span className="proposal-state proposal-state-to">{action.toState}</span>
      </p>
      <p className="proposal-title">{action.issueTitle}</p>
      <div className="proposal-actions">
        <button type="button" className="ask-button" onClick={confirm} disabled={busy || disabled}>
          {busy ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : null}
          {busy ? "Moving…" : `Move to ${action.toState}`}
        </button>
        <button type="button" className="text-button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
