import { ACTION_LABEL, type Action } from "../../core/scenarios";

interface ActionSelectorProps {
  /** Action options offered by the current scenario, in display order. */
  actions: readonly Action[];
  value: Action | null;
  onChange: (action: Action) => void;
  disabled?: boolean;
  /** When revealed, highlight the correct action and the wrong pick. */
  correct?: Action | null;
}

export function ActionSelector({
  actions,
  value,
  onChange,
  disabled = false,
  correct = null,
}: ActionSelectorProps) {
  // Two columns for the longer 4-option open menus, one row for shorter ones.
  const columns = actions.length > 3 ? 2 : actions.length;

  return (
    <div className="selector">
      <div className="selector-label">Your play</div>
      <div
        className="action-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {actions.map((a) => {
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
              {ACTION_LABEL[a]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
