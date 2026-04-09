export function MapDecorations() {
  return (
    <div aria-hidden="true">
      {/* Sea monster silhouette */}
      <svg className="decoration decoration--monster" viewBox="0 0 120 60" width={120} height={60}>
        <path
          d="M 10 45 Q 20 20, 35 35 Q 45 45, 55 30 Q 65 15, 75 30 Q 85 45, 95 25 Q 100 18, 105 22 L 108 18 L 105 22 Q 110 30, 95 35 Q 80 50, 65 40 Q 50 55, 35 45 Q 20 55, 10 45 Z"
          fill="#6b4226"
          opacity={0.12}
        />
        <circle cx={100} cy={20} r={1.5} fill="#6b4226" opacity={0.2} />
      </svg>

      {/* Wave patterns */}
      <svg className="decoration decoration--waves-top" viewBox="0 0 200 20" preserveAspectRatio="none">
        <path
          d="M 0 15 Q 10 5, 20 15 Q 30 25, 40 15 Q 50 5, 60 15 Q 70 25, 80 15 Q 90 5, 100 15 Q 110 25, 120 15 Q 130 5, 140 15 Q 150 25, 160 15 Q 170 5, 180 15 Q 190 25, 200 15"
          fill="none"
          stroke="#6b4226"
          strokeWidth={1}
          opacity={0.12}
        />
      </svg>

      <svg className="decoration decoration--waves-bottom" viewBox="0 0 200 20" preserveAspectRatio="none">
        <path
          d="M 0 10 Q 10 0, 20 10 Q 30 20, 40 10 Q 50 0, 60 10 Q 70 20, 80 10 Q 90 0, 100 10 Q 110 20, 120 10 Q 130 0, 140 10 Q 150 20, 160 10 Q 170 0, 180 10 Q 190 20, 200 10"
          fill="none"
          stroke="#6b4226"
          strokeWidth={1}
          opacity={0.12}
        />
      </svg>

      {/* "Here Be Dragons" text */}
      <span className="decoration decoration--dragons-text">
        Here Be Dragons
      </span>

      {/* Small island dots */}
      <svg className="decoration decoration--islands" viewBox="0 0 40 40" width={40} height={40}>
        <ellipse cx={20} cy={22} rx={12} ry={6} fill="#6b4226" opacity={0.08} />
        <path d="M 18 22 Q 20 8, 22 22" fill="#6b4226" opacity={0.1} />
        <path d="M 16 20 Q 20 12, 24 20" fill="#6b4226" opacity={0.06} />
      </svg>
    </div>
  );
}
