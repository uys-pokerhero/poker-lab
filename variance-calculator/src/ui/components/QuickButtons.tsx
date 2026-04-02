interface QuickButtonsProps {
  value: number;
  onChange: (value: number) => void;
}

const OPTIONS = [
  { label: "10k", value: 10_000 },
  { label: "25k", value: 25_000 },
  { label: "50k", value: 50_000 },
  { label: "100k", value: 100_000 },
];

export function QuickButtons({ value, onChange }: QuickButtonsProps) {
  return (
    <div className="quick-buttons">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`quick-btn ${value === opt.value ? "active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
