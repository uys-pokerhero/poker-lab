import { describe, it, expect } from "vitest";
import { HANDS, GROUPS, parseCode, formatGroup } from "../core/hands";

describe("HANDS data", () => {
  it("contains exactly 37 hand classes", () => {
    expect(HANDS).toHaveLength(37);
  });

  it("totals 216 combinations across all hands", () => {
    const total = HANDS.reduce((sum, h) => sum + h.weight, 0);
    expect(total).toBe(216);
  });

  it("uses only the six allowed groups", () => {
    const allowed = new Set<number>(GROUPS);
    for (const h of HANDS) {
      expect(allowed.has(h.group)).toBe(true);
    }
  });

  it("GROUPS matches the distinct groups present in the data", () => {
    const present = [...new Set(HANDS.map((h) => h.group))].sort((a, b) => a - b);
    expect(present).toEqual([...GROUPS]);
  });

  it("has no duplicate hand codes", () => {
    const codes = HANDS.map((h) => h.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("assigns the correct weight per hand shape", () => {
    for (const h of HANDS) {
      const expected = h.type === "pair" ? 6 : h.type === "offsuit" ? 12 : 4;
      expect(h.weight, h.code).toBe(expected);
    }
  });

  it.each([
    ["AA", 0.8],
    ["AKo", 0.8],
    ["AKs", 0.8],
    ["KQs", 1.0],
    ["AQo", 1.5],
    ["TT", 1.5],
    ["99", 2.0],
    ["66", 2.0],
    ["KQo", 2.5],
    ["A9s", 2.5],
    ["55", 3.0],
    ["A3s", 3.0],
  ])("places %s in group %f", (code, group) => {
    const hand = HANDS.find((h) => h.code === code);
    expect(hand, code).toBeDefined();
    expect(hand!.group).toBe(group);
  });
});

describe("parseCode", () => {
  it("parses pairs", () => {
    expect(parseCode("AA")).toEqual({ type: "pair", high: "A", low: "A" });
  });

  it("parses suited hands with high rank first", () => {
    expect(parseCode("AKs")).toEqual({ type: "suited", high: "A", low: "K" });
  });

  it("parses offsuit hands", () => {
    expect(parseCode("KJo")).toEqual({ type: "offsuit", high: "K", low: "J" });
  });

  it("orders ranks regardless of input order", () => {
    expect(parseCode("9Ts")).toEqual({ type: "suited", high: "T", low: "9" });
  });
});

describe("formatGroup", () => {
  it("always shows one decimal place", () => {
    expect(formatGroup(1)).toBe("1.0");
    expect(formatGroup(0.8)).toBe("0.8");
    expect(formatGroup(3)).toBe("3.0");
  });
});
