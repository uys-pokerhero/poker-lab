export function CompassRose() {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 48;
  const innerR = 16;
  const tickR = 52;
  const labelR = 56;

  const directions = [
    { label: "N", angle: -90 },
    { label: "E", angle: 0 },
    { label: "S", angle: 90 },
    { label: "W", angle: 180 },
  ];

  function pointAt(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
  }

  return (
    <svg
      className="compass-rose"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
    >
      {/* Outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke="#6b4226"
        strokeWidth={1.5}
        opacity={0.6}
      />
      <circle
        cx={cx}
        cy={cy}
        r={outerR - 4}
        fill="none"
        stroke="#6b4226"
        strokeWidth={0.5}
        opacity={0.4}
      />

      {/* Main compass points (N/S/E/W) */}
      {directions.map(({ label, angle }) => {
        const tip = pointAt(angle, outerR - 2);
        const left = pointAt(angle - 15, innerR);
        const right = pointAt(angle + 15, innerR);
        const isNorth = label === "N";

        return (
          <g key={label}>
            <polygon
              points={`${tip.x},${tip.y} ${left.x},${left.y} ${cx},${cy}`}
              fill={isNorth ? "#c0392b" : "#6b4226"}
              opacity={isNorth ? 0.9 : 0.5}
            />
            <polygon
              points={`${tip.x},${tip.y} ${right.x},${right.y} ${cx},${cy}`}
              fill={isNorth ? "#e8cda0" : "#a0764a"}
              opacity={isNorth ? 0.9 : 0.4}
            />
          </g>
        );
      })}

      {/* Intercardinal points */}
      {[{ angle: -45 }, { angle: 45 }, { angle: 135 }, { angle: -135 }].map(
        ({ angle }) => {
          const tip = pointAt(angle, outerR * 0.6);
          const left = pointAt(angle - 12, innerR * 0.6);
          const right = pointAt(angle + 12, innerR * 0.6);
          return (
            <g key={angle}>
              <polygon
                points={`${tip.x},${tip.y} ${left.x},${left.y} ${cx},${cy}`}
                fill="#6b4226"
                opacity={0.3}
              />
              <polygon
                points={`${tip.x},${tip.y} ${right.x},${right.y} ${cx},${cy}`}
                fill="#a0764a"
                opacity={0.25}
              />
            </g>
          );
        }
      )}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#6b4226" opacity={0.7} />

      {/* Tick marks */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = i * 22.5;
        const start = pointAt(angle, tickR);
        const end = pointAt(angle, tickR + 3);
        return (
          <line
            key={i}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="#6b4226"
            strokeWidth={0.7}
            opacity={0.4}
          />
        );
      })}

      {/* Direction labels */}
      {directions.map(({ label, angle }) => {
        const pos = pointAt(angle, labelR);
        return (
          <text
            key={label}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="compass-label"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
