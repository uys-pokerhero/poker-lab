export type BankrollUnit = "bb" | "buyins";

interface UnitToggleProps {
  unit: BankrollUnit;
  onChange: (unit: BankrollUnit) => void;
}

export function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div className="unit-toggle">
      <button
        type="button"
        className={`unit-toggle-btn ${unit === "bb" ? "active" : ""}`}
        onClick={() => onChange("bb")}
      >
        Big Blinds
      </button>
      <button
        type="button"
        className={`unit-toggle-btn ${unit === "buyins" ? "active" : ""}`}
        onClick={() => onChange("buyins")}
      >
        Buy-ins
      </button>
    </div>
  );
}
