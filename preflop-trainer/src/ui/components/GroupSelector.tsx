import { GROUPS, formatGroup, type Group } from "../../core/hands";

interface GroupSelectorProps {
  value: Group | null;
  onChange: (group: Group) => void;
  disabled?: boolean;
  /** When revealed, highlight the correct group and the wrong pick. */
  correct?: Group | null;
}

export function GroupSelector({
  value,
  onChange,
  disabled = false,
  correct = null,
}: GroupSelectorProps) {
  return (
    <div className="selector">
      <div className="selector-label">Group</div>
      <div className="group-grid">
        {GROUPS.map((g) => {
          const classes = ["choice-btn"];
          if (correct !== null) {
            // Revealed: show correctness only, not the original selection.
            if (g === correct) classes.push("correct");
            else if (g === value) classes.push("wrong");
          } else if (value === g) {
            classes.push("selected");
          }
          return (
            <button
              key={g}
              type="button"
              className={classes.join(" ")}
              disabled={disabled}
              onClick={() => onChange(g)}
            >
              {formatGroup(g)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
