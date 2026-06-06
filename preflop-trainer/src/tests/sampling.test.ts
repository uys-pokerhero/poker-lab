import { describe, it, expect } from "vitest";
import { weightedPick } from "../core/sampling";

const ITEMS = [
  { name: "a", w: 1 },
  { name: "b", w: 3 },
];

describe("weightedPick", () => {
  it("returns the first item when rng lands in its band", () => {
    // total weight = 4; rng 0.0 -> threshold 0 -> first item.
    expect(weightedPick(ITEMS, (i) => i.w, () => 0).name).toBe("a");
  });

  it("returns the second item when rng lands past the first band", () => {
    // rng 0.5 -> threshold 2.0, past a's weight of 1 -> b.
    expect(weightedPick(ITEMS, (i) => i.w, () => 0.5).name).toBe("b");
  });

  it("respects weights over many draws (approximately)", () => {
    // Deterministic cycling rng to sample the [0,1) interval evenly.
    let t = 0;
    const rng = () => {
      t = (t + 0.01) % 1;
      return t;
    };
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 10_000; i++) {
      counts[weightedPick(ITEMS, (i) => i.w, rng).name as "a" | "b"]++;
    }
    // b should be picked roughly 3x as often as a (1:3 weight ratio).
    expect(counts.b / counts.a).toBeGreaterThan(2.5);
    expect(counts.b / counts.a).toBeLessThan(3.5);
  });

  it("throws on an empty list", () => {
    expect(() => weightedPick([], () => 1)).toThrow();
  });
});
