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
  // 1–3 options fit in one row; 4 sit as a 2x2; 5+ (SB's six) use 3 columns.
  const columns =
    actions.length <= 3 ? actions.length : actions.length === 4 ? 2 : 3;

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
