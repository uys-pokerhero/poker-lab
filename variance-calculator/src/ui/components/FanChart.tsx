import { useRef, useState, useEffect, useCallback } from "react";
import type { FanChartPoint } from "../../core/grid";

interface FanChartProps {
  data: FanChartPoint[];
  bankrollBb: number;
}

const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };
const CHART_HEIGHT = 360;

function niceStep(range: number, targetTicks: number): number {
  const rough = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let nice: number;
  if (norm <= 1.5) nice = 1;
  else if (norm <= 3) nice = 2;
  else if (norm <= 7) nice = 5;
  else nice = 10;
  return nice * mag;
}

function fmtTick(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (v / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + "k";
  return v.toString();
}

export function FanChart({ data, bankrollBb }: FanChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const maxHands = data.length > 0 ? data[data.length - 1].hands : 1;
  const allValues = data.flatMap((d) => [d.p5, d.p95]);
  allValues.push(bankrollBb, 0);
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const yRange = yMax - yMin || 1;
  const yPadded = yRange * 0.05;
  const yLo = yMin - yPadded;
  const yHi = yMax + yPadded;

  const sx = (hands: number) => PADDING.left + (hands / maxHands) * plotW;
  const sy = (val: number) =>
    PADDING.top + (1 - (val - yLo) / (yHi - yLo)) * plotH;

  function buildPath(accessor: (d: FanChartPoint) => number): string {
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"}${sx(d.hands)},${sy(accessor(d))}`)
      .join("");
  }

  function buildBand(
    lo: (d: FanChartPoint) => number,
    hi: (d: FanChartPoint) => number
  ): string {
    const upper = data.map((d) => `${sx(d.hands)},${sy(hi(d))}`).join(" L");
    const lower = [...data]
      .reverse()
      .map((d) => `${sx(d.hands)},${sy(lo(d))}`)
      .join(" L");
    return `M${upper} L${lower} Z`;
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left - PADDING.left;
      const fraction = Math.max(0, Math.min(1, mx / plotW));
      const targetHands = fraction * maxHands;
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < data.length; i++) {
        const dist = Math.abs(data[i].hands - targetHands);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      setHover(closest);
    },
    [data, maxHands, plotW]
  );

  const xStep = niceStep(maxHands, 5);
  const yStep = niceStep(yHi - yLo, 5);

  const xTicks: number[] = [];
  for (let v = 0; v <= maxHands; v += xStep) xTicks.push(v);

  const yTicks: number[] = [];
  const yStart = Math.ceil(yLo / yStep) * yStep;
  for (let v = yStart; v <= yHi; v += yStep) yTicks.push(v);

  const hoverPoint = hover !== null ? data[hover] : null;

  const showZeroLine = yLo < 0 && yHi > 0;

  return (
    <div className="fan-chart-container" ref={containerRef}>
      <svg
        width={width}
        height={CHART_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Outer band: 5th-95th */}
        <path
          d={buildBand((d) => d.p5, (d) => d.p95)}
          fill="var(--color-band-outer)"
        />
        {/* Inner band: 25th-75th */}
        <path
          d={buildBand((d) => d.p25, (d) => d.p75)}
          fill="var(--color-band-inner)"
        />

        {/* Median line */}
        <path
          d={buildPath((d) => d.median)}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
        />

        {/* Starting bankroll dashed line */}
        <line
          x1={PADDING.left}
          y1={sy(bankrollBb)}
          x2={PADDING.left + plotW}
          y2={sy(bankrollBb)}
          stroke="var(--color-muted)"
          strokeWidth={1}
          strokeDasharray="6 4"
        />

        {/* Zero line (if visible) */}
        {showZeroLine && (
          <line
            x1={PADDING.left}
            y1={sy(0)}
            x2={PADDING.left + plotW}
            y2={sy(0)}
            stroke="var(--color-danger)"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.6}
          />
        )}

        {/* X axis ticks */}
        {xTicks.map((v) => (
          <g key={`x-${v}`}>
            <line
              x1={sx(v)}
              y1={PADDING.top + plotH}
              x2={sx(v)}
              y2={PADDING.top + plotH + 5}
              stroke="var(--color-muted)"
            />
            <text
              x={sx(v)}
              y={PADDING.top + plotH + 20}
              textAnchor="middle"
              className="chart-tick"
            >
              {fmtTick(v)}
            </text>
          </g>
        ))}

        {/* Y axis ticks */}
        {yTicks.map((v) => (
          <g key={`y-${v}`}>
            <line
              x1={PADDING.left - 5}
              y1={sy(v)}
              x2={PADDING.left}
              y2={sy(v)}
              stroke="var(--color-muted)"
            />
            <text
              x={PADDING.left - 10}
              y={sy(v) + 4}
              textAnchor="end"
              className="chart-tick"
            >
              {fmtTick(v)}
            </text>
          </g>
        ))}

        {/* Axis label */}
        <text
          x={PADDING.left + plotW / 2}
          y={CHART_HEIGHT - 2}
          textAnchor="middle"
          className="chart-axis-label"
        >
          Hands Played
        </text>

        {/* Hover crosshair + tooltip */}
        {hoverPoint && (
          <>
            <line
              x1={sx(hoverPoint.hands)}
              y1={PADDING.top}
              x2={sx(hoverPoint.hands)}
              y2={PADDING.top + plotH}
              stroke="var(--color-accent)"
              strokeWidth={1}
              opacity={0.5}
              strokeDasharray="3 2"
            />
            <circle
              cx={sx(hoverPoint.hands)}
              cy={sy(hoverPoint.median)}
              r={4}
              fill="var(--color-accent)"
            />
          </>
        )}
      </svg>

      {hoverPoint && (
        <div
          className="chart-tooltip"
          style={{
            left: Math.min(sx(hoverPoint.hands), width - 180),
            top: PADDING.top,
          }}
        >
          <div className="chart-tooltip-row">
            <strong>{hoverPoint.hands.toLocaleString()} hands</strong>
          </div>
          <div className="chart-tooltip-row">
            95th: {Math.round(hoverPoint.p95).toLocaleString()} bb
          </div>
          <div className="chart-tooltip-row">
            75th: {Math.round(hoverPoint.p75).toLocaleString()} bb
          </div>
          <div className="chart-tooltip-row">
            Median: {Math.round(hoverPoint.median).toLocaleString()} bb
          </div>
          <div className="chart-tooltip-row">
            25th: {Math.round(hoverPoint.p25).toLocaleString()} bb
          </div>
          <div className="chart-tooltip-row">
            5th: {Math.round(hoverPoint.p5).toLocaleString()} bb
          </div>
        </div>
      )}

      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-line accent" /> Median
        </span>
        <span className="legend-item">
          <span className="legend-swatch inner" /> 25th&ndash;75th
        </span>
        <span className="legend-item">
          <span className="legend-swatch outer" /> 5th&ndash;95th
        </span>
      </div>
    </div>
  );
}
