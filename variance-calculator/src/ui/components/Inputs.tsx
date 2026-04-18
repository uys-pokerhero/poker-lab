import { Tooltip } from "./Tooltip";
import { UnitToggle, type BankrollUnit } from "./UnitToggle";
import { QuickButtons } from "./QuickButtons";

export interface InputValues {
  unit: BankrollUnit;
  bankroll: number;
  buyinSize: number;
  winrate: number;
  sd: number;
  volume: number;
}

interface InputsProps {
  values: InputValues;
  onChange: (values: InputValues) => void;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function parseNum(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function Inputs({ values, onChange }: InputsProps) {
  function set<K extends keyof InputValues>(key: K, val: InputValues[K]) {
    onChange({ ...values, [key]: val });
  }

  function numField(
    label: string,
    key: keyof InputValues,
    min: number,
    max: number,
    step: number,
    tooltip?: string,
    suffix?: string
  ) {
    const val = values[key] as number;
    return (
      <label className="field">
        <span className="field-label">
          {label}
          {suffix && <span className="field-suffix">{suffix}</span>}
          {tooltip && <Tooltip text={tooltip} />}
        </span>
        <input
          type="number"
          className="field-input"
          value={val}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = parseNum(e.target.value, val);
            set(key, clamp(raw, min, max) as never);
          }}
        />
      </label>
    );
  }

  return (
    <div className="inputs-panel">
      <UnitToggle
        unit={values.unit}
        onChange={(u) => set("unit", u)}
      />

      {values.unit === "buyins" &&
        numField("Buy-in Size", "buyinSize", 1, 1000, 1, undefined, "bb")}

      {numField(
        "Bankroll",
        "bankroll",
        0,
        999999,
        1,
        "Your total bankroll. 1 buy-in is typically 100bb for cash games.",
        values.unit === "bb" ? "bb" : "buy-ins"
      )}

      {numField(
        "Winrate",
        "winrate",
        -50,
        50,
        0.5,
        "Your long-run average profit per 100 hands. If your sample is small, this estimate is very uncertain.",
        "bb/100"
      )}

      {numField(
        "Standard Deviation",
        "sd",
        1,
        300,
        1,
        "Measures how swingy your results are. Depends on play style, stake, rake, and game type. 100\u2013200 is common for NLHE cash.",
        "bb/100"
      )}

      {numField("Volume", "volume", 100, 500000, 100, undefined, "hands")}

      <QuickButtons
        value={values.volume}
        onChange={(v) => set("volume", v)}
      />

      <details className="assumptions">
        <summary>Assumptions &amp; Limitations</summary>
        <ul>
          <li>Results assume iid outcomes with constant winrate and standard deviation.</li>
          <li>Ignores table selection changes, tilt, and quitting behavior.</li>
          <li>Standard deviation treated as constant across stakes and time.</li>
          <li>Normal approximation improves at larger sample sizes.</li>
        </ul>
      </details>
    </div>
  );
}
