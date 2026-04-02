import { describe, it, expect } from "vitest";
import { generateFanChartData } from "../core/grid";

describe("generateFanChartData", () => {
  const data = generateFanChartData(3, 80, 50000, 2000, 50);

  it("returns points+1 entries", () => {
    expect(data).toHaveLength(51);
  });

  it("first point: hands=0, all values = bankrollBb", () => {
    const first = data[0];
    expect(first.hands).toBe(0);
    expect(first.median).toBe(2000);
    expect(first.p5).toBe(2000);
    expect(first.p25).toBe(2000);
    expect(first.p75).toBe(2000);
    expect(first.p95).toBe(2000);
  });

  it("last point: hands = N", () => {
    expect(data[data.length - 1].hands).toBe(50000);
  });

  it("quantiles are ordered at every point: p5 <= p25 <= median <= p75 <= p95", () => {
    for (const pt of data) {
      expect(pt.p5).toBeLessThanOrEqual(pt.p25 + 1e-9);
      expect(pt.p25).toBeLessThanOrEqual(pt.median + 1e-9);
      expect(pt.median).toBeLessThanOrEqual(pt.p75 + 1e-9);
      expect(pt.p75).toBeLessThanOrEqual(pt.p95 + 1e-9);
    }
  });

  it("band width increases with hands (variance grows with sqrt(N))", () => {
    const early = data[5];
    const late = data[45];
    const earlyWidth = early.p95 - early.p5;
    const lateWidth = late.p95 - late.p5;
    expect(lateWidth).toBeGreaterThan(earlyWidth);
  });

  it("works with default points parameter", () => {
    const d = generateFanChartData(3, 80, 10000, 1000);
    expect(d).toHaveLength(51);
  });
});
