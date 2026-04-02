import { describe, it, expect } from "vitest";
import { rorAfterHands, rorEventually } from "../core/ror";

describe("rorAfterHands", () => {
  it("N=0 → P(bust)=0", () => {
    expect(rorAfterHands(2000, 3, 80, 0)).toBe(0);
  });

  it("bankroll=0 → P(bust)=1", () => {
    expect(rorAfterHands(0, 3, 80, 50000)).toBe(1);
  });

  it("negative bankroll → P(bust)=1", () => {
    expect(rorAfterHands(-100, 3, 80, 50000)).toBe(1);
  });

  it("sd=0, wr>=0 → P(bust)=0 (deterministic win)", () => {
    expect(rorAfterHands(2000, 3, 0, 50000)).toBe(0);
  });

  it("sd=0, wr<0 → P(bust)=1 (deterministic loss)", () => {
    expect(rorAfterHands(2000, -3, 0, 50000)).toBe(1);
  });

  it("larger bankroll → lower bust probability", () => {
    const small = rorAfterHands(500, 3, 80, 50000);
    const large = rorAfterHands(5000, 3, 80, 50000);
    expect(large).toBeLessThan(small);
  });

  it("higher winrate → lower bust probability", () => {
    const low = rorAfterHands(2000, 1, 80, 50000);
    const high = rorAfterHands(2000, 10, 80, 50000);
    expect(high).toBeLessThan(low);
  });

  it("higher SD → higher bust probability", () => {
    const low = rorAfterHands(2000, 3, 60, 50000);
    const high = rorAfterHands(2000, 3, 120, 50000);
    expect(high).toBeGreaterThan(low);
  });

  it("returns a value between 0 and 1 for baseline params", () => {
    const p = rorAfterHands(2000, 3, 80, 50000);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });
});

describe("rorEventually", () => {
  it("rorEventually(2000, 3, 80) ≈ exp(-2*3*2000/6400)", () => {
    const expected = Math.exp((-2 * 3 * 2000) / (80 * 80));
    expect(rorEventually(2000, 3, 80)).toBeCloseTo(expected, 10);
  });

  it("bankroll=0 → 1", () => {
    expect(rorEventually(0, 3, 80)).toBe(1);
  });

  it("wr<=0 → 1", () => {
    expect(rorEventually(2000, 0, 80)).toBe(1);
    expect(rorEventually(2000, -5, 80)).toBe(1);
  });

  it("sd=0, wr>0 → 0", () => {
    expect(rorEventually(2000, 3, 0)).toBe(0);
  });

  it("sd=0, wr<0 → 1", () => {
    expect(rorEventually(2000, -3, 0)).toBe(1);
  });

  it("larger bankroll → lower eventual ruin", () => {
    const small = rorEventually(500, 3, 80);
    const large = rorEventually(10000, 3, 80);
    expect(large).toBeLessThan(small);
  });

  it("higher winrate → lower eventual ruin", () => {
    const low = rorEventually(2000, 1, 80);
    const high = rorEventually(2000, 10, 80);
    expect(high).toBeLessThan(low);
  });

  it("higher SD → higher eventual ruin", () => {
    const low = rorEventually(2000, 3, 60);
    const high = rorEventually(2000, 3, 120);
    expect(high).toBeGreaterThan(low);
  });
});
