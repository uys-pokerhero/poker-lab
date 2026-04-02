import { describe, it, expect } from "vitest";
import { profitMean, profitStdDev } from "../core/profit";

describe("profitMean", () => {
  it("profitMean(3, 10000) = 300", () => {
    expect(profitMean(3, 10000)).toBe(300);
  });

  it("scales linearly with N", () => {
    expect(profitMean(5, 20000)).toBe(profitMean(5, 10000) * 2);
  });

  it("returns 0 for zero winrate", () => {
    expect(profitMean(0, 50000)).toBe(0);
  });

  it("returns 0 for zero hands", () => {
    expect(profitMean(3, 0)).toBe(0);
  });

  it("handles negative winrate", () => {
    expect(profitMean(-5, 10000)).toBe(-500);
  });
});

describe("profitStdDev", () => {
  it("profitStdDev(80, 10000) = 800", () => {
    expect(profitStdDev(80, 10000)).toBe(800);
  });

  it("scales with sqrt(N)", () => {
    const sd1 = profitStdDev(80, 10000);
    const sd4 = profitStdDev(80, 40000);
    expect(sd4).toBeCloseTo(sd1 * 2, 8);
  });

  it("returns 0 for zero sd", () => {
    expect(profitStdDev(0, 50000)).toBe(0);
  });

  it("returns 0 for zero hands", () => {
    expect(profitStdDev(80, 0)).toBe(0);
  });
});
