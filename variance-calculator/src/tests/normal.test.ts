import { describe, it, expect } from "vitest";
import { erf, normCdf, normInv } from "../core/normal";

describe("erf", () => {
  it("erf(0) ≈ 0", () => {
    expect(erf(0)).toBeCloseTo(0, 7);
  });

  it("erf is odd: erf(-x) = -erf(x)", () => {
    expect(erf(-1.5)).toBeCloseTo(-erf(1.5), 7);
  });

  it("erf(large) approaches 1", () => {
    expect(erf(4)).toBeCloseTo(1, 6);
  });
});

describe("normCdf", () => {
  it("normCdf(0) ≈ 0.5", () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 7);
  });

  it("normCdf(1.96) ≈ 0.975", () => {
    expect(normCdf(1.96)).toBeCloseTo(0.975, 3);
  });

  it("normCdf(-1.96) ≈ 0.025", () => {
    expect(normCdf(-1.96)).toBeCloseTo(0.025, 3);
  });

  it("tails approach 0 and 1", () => {
    expect(normCdf(-6)).toBeCloseTo(0, 6);
    expect(normCdf(6)).toBeCloseTo(1, 6);
  });
});

describe("normInv", () => {
  it("normInv(0.5) = 0", () => {
    expect(normInv(0.5)).toBeCloseTo(0, 8);
  });

  it("normInv(0) = -Infinity", () => {
    expect(normInv(0)).toBe(-Infinity);
  });

  it("normInv(1) = Infinity", () => {
    expect(normInv(1)).toBe(Infinity);
  });

  it("normInv(0.975) ≈ 1.96", () => {
    expect(normInv(0.975)).toBeCloseTo(1.96, 2);
  });

  it("round-trip: normInv(normCdf(x)) ≈ x for x in [-3, 3]", () => {
    for (const x of [-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3]) {
      expect(normInv(normCdf(x))).toBeCloseTo(x, 4);
    }
  });

  it("round-trip has reduced precision at extreme tails", () => {
    expect(normInv(normCdf(-4))).toBeCloseTo(-4, 3);
    expect(normInv(normCdf(4))).toBeCloseTo(4, 3);
  });
});
