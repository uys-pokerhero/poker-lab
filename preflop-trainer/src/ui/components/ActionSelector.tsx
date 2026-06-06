import { ACTIONS, ACTION_LABELS, type Action } from "../../core/strategy";

interface ActionSelectorProps {
  value: Action | null;
  onChange: (action: Action) => void;
  disabled?: boolean;
  /** When revealed, highlight the correct action and the wrong pick. */
  correct?: Action | null;
}

export function ActionSelector({
  value,
  onChange,
  disabled = false,
  correct = null,
}: ActionSelectorProps) {
  return (
    <div className="selector">
      <div className="selector-label">Response to 3-bet</div>
      <div className="action-grid">
        {ACTIONS.map((a) => {
          const classes = ["choice-btn", "action-btn"];
          if (correct !== null) {
            // Revealed: show correctness only, not the original selection.
            if (a === correct) classes.push("correct");
            else if (a === value) classes.push("wrong");
          } else if (value === a) {
            classes.push("selected");
          }
          return (
            <button
              key={a}
              type="button"
              className={classes.join(" ")}
              disabled={disabled}
              onClick={() => onChange(a)}
            >
              {ACTION_LABELS[a]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
