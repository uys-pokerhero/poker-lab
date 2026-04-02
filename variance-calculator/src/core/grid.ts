import { normInv } from "./normal";

export interface FanChartPoint {
  hands: number;
  median: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
}

const Z_05 = normInv(0.05);
const Z_25 = normInv(0.25);
const Z_75 = normInv(0.75);
const Z_95 = normInv(0.95);

/**
 * Generate fan chart data: percentile bands at evenly-spaced hand counts.
 * Returns `points + 1` entries (including the starting point at hands=0).
 */
export function generateFanChartData(
  wr: number,
  sd: number,
  N: number,
  bankrollBb: number,
  points: number = 50
): FanChartPoint[] {
  const data: FanChartPoint[] = [];

  for (let i = 0; i <= points; i++) {
    const hands = Math.round((i / points) * N);
    const t = hands / 100;
    const mu = wr * t;
    const sigma = sd * Math.sqrt(t);

    data.push({
      hands,
      median: bankrollBb + mu,
      p5: bankrollBb + mu + Z_05 * sigma,
      p25: bankrollBb + mu + Z_25 * sigma,
      p75: bankrollBb + mu + Z_75 * sigma,
      p95: bankrollBb + mu + Z_95 * sigma,
    });
  }

  return data;
}
