import { describe, it, expect } from "vitest";
import { HANDS, GROUPS, parseCode, formatGroup } from "../core/hands";

describe("HANDS data", () => {
  it("contains exactly 74 hand classes", () => {
    expect(HANDS).toHaveLength(74);
  });

  it("totals 442 combinations across all hands", () => {
    const total = HANDS.reduce((sum, h) => sum + h.weight, 0);
    expect(total).toBe(442);
  });

  it("uses only the eight allowed groups", () => {
    const allowed = new Set<number>(GROUPS);
    for (const h of HANDS) {
      expect(allowed.has(h.group), h.code).toBe(true);
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

  it("uses canonical codes with an 'o' suffix for offsuit hands", () => {
    const akOff = HANDS.find((h) => h.code === "AKo");
    const akSuited = HANDS.find((h) => h.code === "AKs");
    expect(akOff?.type).toBe("offsuit");
    expect(akSuited?.type).toBe("suited");
    // A9 appears both offsuit (3.5) and suited (2.5).
    expect(HANDS.find((h) => h.code === "A9o")?.group).toBe(3.5);
    expect(HANDS.find((h) => h.code === "A9s")?.group).toBe(2.5);
  });

  it.each<[string, number]>([
    ["AA", 0.8],
    ["AKs", 0.8],
    ["KQs", 1.0],
    ["AQo", 1.5],
    ["A5s", 1.5],
    ["99", 2.0],
    ["QJs", 2.5],
    ["55", 3.0],
    ["A3s", 3.0],
    ["KTo", 3.5],
    ["44", 3.5],
    ["A2s", 3.5],
    ["22", 4.0],
    ["A8o", 4.0],
    ["JTo", 4.0],
    ["K2s", 4.0],
  ])("places %s in group %d", (code, group) => {
    const hand = HANDS.find((h) => h.code === code);
    expect(hand, code).toBeDefined();
    expect(hand!.group).toBe(group);
  });

  it("does not expose raw offsuit codes without the 'o' suffix", () => {
    // The user data writes offsuit as "KT"; the canonical code is "KTo".
    expect(HANDS.find((h) => h.code === "KT")).toBeUndefined();
    expect(HANDS.find((h) => h.code === "KTo")).toBeDefined();
  });
});

describe("parseCode", () => {
  it("parses pairs", () => {
    expect(parseCode("AA")).toEqual({ type: "pair", high: "A", low: "A" });
  });

  it("parses suited hands with high rank first", () => {
    expect(parseCode("AKs")).toEqual({ type: "suited", high: "A", low: "K" });
  });

  it("parses offsuit hands written without a suffix", () => {
    expect(parseCode("JT")).toEqual({ type: "offsuit", high: "J", low: "T" });
  });

  it("orders ranks regardless of input order", () => {
    expect(parseCode("9Ts")).toEqual({ type: "suited", high: "T", low: "9" });
  });
});

describe("formatGroup", () => {
  it("always shows one decimal place", () => {
    expect(formatGroup(1)).toBe("1.0");
    expect(formatGroup(0.8)).toBe("0.8");
    expect(formatGroup(3.5)).toBe("3.5");
    expect(formatGroup(4)).toBe("4.0");
  });
});
