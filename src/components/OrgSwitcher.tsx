import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Organisation } from "../../shared/contracts";

interface OrgSwitcherProps {
  orgs: Organisation[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[a-z]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Switches connector scope. MVP ships one org, but the menu is fully keyboard-usable. */
export function OrgSwitcher({ orgs, selectedId, onSelect }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = orgs.find((o) => o.id === selectedId) ?? orgs[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!selected) return null;

  return (
    <div className="org" ref={rootRef}>
      <button type="button" className="org-button" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((o) => !o)}>
        <span className="org-avatar" aria-hidden="true">
          {initials(selected.name)}
        </span>
        <span className="org-name">{selected.name}</span>
        <span className="visually-hidden">Switch organisation</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open ? (
        <ul id={menuId} className="org-menu" aria-label="Organisations">
          {orgs.map((org) => (
            <li key={org.id}>
              <button
                type="button"
                className="org-option"
                aria-current={org.id === selected.id ? "true" : undefined}
                onClick={() => {
                  onSelect(org.id);
                  setOpen(false);
                }}
              >
                <span className="org-avatar" aria-hidden="true">
                  {initials(org.name)}
                </span>
                <span>
                  {org.name}
                  <small>{org.role}</small>
                </span>
                {org.id === selected.id ? <Check size={14} aria-hidden="true" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
