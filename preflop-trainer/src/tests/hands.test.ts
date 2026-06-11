import { describe, it, expect } from "vitest";
import { HANDS, GROUPS, RANK_ORDER, parseCode, formatGroup } from "../core/hands";

describe("HANDS data", () => {
  it("contains the full 169-hand matrix", () => {
    expect(HANDS).toHaveLength(169);
  });

  it("totals 1326 combinations (the whole deck)", () => {
    const total = HANDS.reduce((sum, h) => sum + h.weight, 0);
    expect(total).toBe(1326);
  });

  it("covers exactly the 169 distinct starting hands", () => {
    const expected = new Set<string>();
    for (let i = 0; i < RANK_ORDER.length; i++) {
      expected.add(RANK_ORDER[i] + RANK_ORDER[i]); // pair
      for (let j = i + 1; j < RANK_ORDER.length; j++) {
        expected.add(RANK_ORDER[i] + RANK_ORDER[j] + "s"); // suited
        expected.add(RANK_ORDER[i] + RANK_ORDER[j] + "o"); // offsuit
      }
    }
    expect(expected.size).toBe(169);
    expect(new Set(HANDS.map((h) => h.code))).toEqual(expected);
  });

  it("uses only the ten allowed groups", () => {
    const allowed = new Set<number>(GROUPS);
    for (const h of HANDS) {
      expect(allowed.has(h.group), h.code).toBe(true);
    }
  });

  it("GROUPS matches the distinct groups present in the data", () => {
    const present = [...new Set(HANDS.map((h) => h.group))].sort((a, b) => a - b);
    expect(present).toEqual([...GROUPS]);
  });

  it("assigns the correct weight per hand shape", () => {
    for (const h of HANDS) {
      const expected = h.type === "pair" ? 6 : h.type === "offsuit" ? 12 : 4;
      expect(h.weight, h.code).toBe(expected);
    }
  });

  it("matches the expected hand count per group", () => {
    const counts: Record<number, number> = {};
    for (const h of HANDS) counts[h.group] = (counts[h.group] ?? 0) + 1;
    expect(counts).toEqual({
      0.8: 7,
      1.0: 3,
      1.5: 6,
      2.0: 4,
      2.5: 6,
      3.0: 11,
      3.5: 16,
      4.0: 21,
      5.0: 26,
      6.0: 69,
    });
  });

  it.each<[string, number]>([
    ["AA", 0.8],
    ["KQs", 1.0],
    ["A5s", 1.5],
    ["99", 2.0],
    ["A9s", 2.5],
    ["55", 3.0],
    ["A9o", 3.5],
    ["22", 4.0],
    ["A6o", 5.0],
    ["K4o", 6.0],
    ["32o", 6.0],
    ["Q2s", 5.0],
    ["J2s", 6.0],
  ])("places %s in group %d", (code, group) => {
    const hand = HANDS.find((h) => h.code === code);
    expect(hand, code).toBeDefined();
    expect(hand!.group).toBe(group);
  });
});

describe("parseCode", () => {
  it("parses pairs, suited, and suffix-less offsuit", () => {
    expect(parseCode("AA")).toEqual({ type: "pair", high: "A", low: "A" });
    expect(parseCode("AKs")).toEqual({ type: "suited", high: "A", low: "K" });
    expect(parseCode("32")).toEqual({ type: "offsuit", high: "3", low: "2" });
  });
});

describe("formatGroup", () => {
  it("always shows one decimal place", () => {
    expect(formatGroup(0.8)).toBe("0.8");
    expect(formatGroup(5)).toBe("5.0");
    expect(formatGroup(6)).toBe("6.0");
  });
});
