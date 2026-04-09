import { useState, useCallback } from "react";
import type { MapLocation as MapLocationData } from "../../data/locations";

interface Props {
  location: MapLocationData;
}

function LocationIcon({ icon, size }: { icon: string; size: number }) {
  const s = size;
  const half = s / 2;
  const stroke = "#3d1e00";
  const fill = "#c8a04a";
  const sw = 1.5;

  switch (icon) {
    case "anchor":
      return (
        <g>
          <circle cx={half} cy={s * 0.25} r={s * 0.1} fill="none" stroke={stroke} strokeWidth={sw} />
          <line x1={half} y1={s * 0.35} x2={half} y2={s * 0.85} stroke={stroke} strokeWidth={sw} />
          <line x1={s * 0.2} y1={s * 0.6} x2={s * 0.8} y2={s * 0.6} stroke={stroke} strokeWidth={sw} />
          <path d={`M ${s * 0.2} ${s * 0.85} Q ${half} ${s} ${s * 0.8} ${s * 0.85}`} fill="none" stroke={stroke} strokeWidth={sw} />
        </g>
      );
    case "chest":
      return (
        <g>
          <rect x={s * 0.15} y={s * 0.4} width={s * 0.7} height={s * 0.45} rx={2} fill={fill} stroke={stroke} strokeWidth={sw} />
          <path d={`M ${s * 0.15} ${s * 0.4} Q ${half} ${s * 0.15} ${s * 0.85} ${s * 0.4}`} fill={fill} stroke={stroke} strokeWidth={sw} />
          <line x1={s * 0.15} y1={s * 0.55} x2={s * 0.85} y2={s * 0.55} stroke={stroke} strokeWidth={sw} />
          <circle cx={half} cy={s * 0.55} r={s * 0.06} fill={stroke} />
        </g>
      );
    case "skull":
      return (
        <g>
          <ellipse cx={half} cy={s * 0.38} rx={s * 0.28} ry={s * 0.3} fill={fill} stroke={stroke} strokeWidth={sw} />
          <circle cx={s * 0.38} cy={s * 0.34} r={s * 0.07} fill={stroke} />
          <circle cx={s * 0.62} cy={s * 0.34} r={s * 0.07} fill={stroke} />
          <ellipse cx={half} cy={s * 0.48} rx={s * 0.04} ry={s * 0.05} fill={stroke} />
          <rect x={s * 0.32} y={s * 0.65} width={s * 0.36} height={s * 0.12} rx={1} fill={fill} stroke={stroke} strokeWidth={sw} />
          <line x1={s * 0.42} y1={s * 0.65} x2={s * 0.42} y2={s * 0.77} stroke={stroke} strokeWidth={1} />
          <line x1={s * 0.5} y1={s * 0.65} x2={s * 0.5} y2={s * 0.77} stroke={stroke} strokeWidth={1} />
          <line x1={s * 0.58} y1={s * 0.65} x2={s * 0.58} y2={s * 0.77} stroke={stroke} strokeWidth={1} />
        </g>
      );
    case "swords":
      return (
        <g>
          <line x1={s * 0.2} y1={s * 0.8} x2={s * 0.65} y2={s * 0.15} stroke={stroke} strokeWidth={sw} />
          <line x1={s * 0.35} y1={s * 0.8} x2={s * 0.8} y2={s * 0.15} stroke={stroke} strokeWidth={sw} />
          <line x1={s * 0.15} y1={s * 0.55} x2={s * 0.45} y2={s * 0.45} stroke={stroke} strokeWidth={sw} />
          <line x1={s * 0.55} y1={s * 0.55} x2={s * 0.85} y2={s * 0.45} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    case "spyglass":
      return (
        <g>
          <line x1={s * 0.2} y1={s * 0.75} x2={s * 0.7} y2={s * 0.3} stroke={stroke} strokeWidth={sw + 1} />
          <circle cx={s * 0.76} cy={s * 0.24} r={s * 0.16} fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx={s * 0.76} cy={s * 0.24} r={s * 0.1} fill="rgba(135,206,250,0.3)" stroke="none" />
        </g>
      );
    case "flag":
      return (
        <g>
          <line x1={s * 0.35} y1={s * 0.15} x2={s * 0.35} y2={s * 0.85} stroke={stroke} strokeWidth={sw} />
          <path d={`M ${s * 0.35} ${s * 0.15} L ${s * 0.8} ${s * 0.3} L ${s * 0.35} ${s * 0.48}`} fill={fill} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    case "wheel":
      return (
        <g>
          <circle cx={half} cy={half} r={s * 0.32} fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx={half} cy={half} r={s * 0.1} fill={stroke} />
          {[0, 45, 90, 135].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                x1={half + Math.cos(rad) * s * 0.1}
                y1={half + Math.sin(rad) * s * 0.1}
                x2={half + Math.cos(rad) * s * 0.32}
                y2={half + Math.sin(rad) * s * 0.32}
                stroke={stroke}
                strokeWidth={sw}
              />
            );
          })}
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <circle
                key={angle}
                cx={half + Math.cos(rad) * s * 0.32}
                cy={half + Math.sin(rad) * s * 0.32}
                r={s * 0.06}
                fill={stroke}
              />
            );
          })}
        </g>
      );
    case "compass":
      return (
        <g>
          <circle cx={half} cy={half} r={s * 0.35} fill="none" stroke={stroke} strokeWidth={sw} />
          <polygon points={`${half},${s * 0.12} ${s * 0.44},${half} ${half},${s * 0.42}`} fill="#c0392b" stroke={stroke} strokeWidth={0.5} />
          <polygon points={`${half},${s * 0.12} ${s * 0.56},${half} ${half},${s * 0.42}`} fill="#e8cda0" stroke={stroke} strokeWidth={0.5} />
          <polygon points={`${half},${s * 0.88} ${s * 0.44},${half} ${half},${s * 0.58}`} fill="#e8cda0" stroke={stroke} strokeWidth={0.5} />
          <polygon points={`${half},${s * 0.88} ${s * 0.56},${half} ${half},${s * 0.58}`} fill={stroke} stroke={stroke} strokeWidth={0.5} />
        </g>
      );
    default:
      return <circle cx={half} cy={half} r={s * 0.3} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
}

export function MapLocationMarker({ location }: Props) {
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);
  const iconSize = 32;
  const showTooltip = hovered || touched;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!touched) {
      e.preventDefault();
      setTouched(true);
    }
  }, [touched]);

  const handleTouchEnd = useCallback(() => {
    if (touched) {
      setTimeout(() => setTouched(false), 3000);
    }
  }, [touched]);

  return (
    <a
      href={location.url}
      className="map-location"
      style={{
        left: `${location.x}%`,
        top: `${location.y}%`,
      }}
      aria-label={`${location.name} — ${location.description}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <svg
        className={`map-location-icon ${showTooltip ? "map-location-icon--hovered" : ""}`}
        width={iconSize}
        height={iconSize}
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        aria-hidden="true"
        focusable="false"
      >
        <LocationIcon icon={location.icon} size={iconSize} />
      </svg>
      <span className="map-location-name">{location.name}</span>
      {showTooltip && (
        <span className="map-location-tooltip" role="tooltip">
          {location.description}
        </span>
      )}
    </a>
  );
}
