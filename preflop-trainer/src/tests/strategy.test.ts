import { describe, it, expect } from "vitest";
import { actionForGroup, DEFAULT_STRATEGY } from "../core/strategy";

describe("actionForGroup (default tuple 0.8, 2.0, 3.0)", () => {
  it("raises the top group only", () => {
    expect(actionForGroup(0.8)).toBe("raise");
  });

  it("calls groups 1.0, 1.5 and 2.0", () => {
    expect(actionForGroup(1.0)).toBe("call");
    expect(actionForGroup(1.5)).toBe("call");
    expect(actionForGroup(2.0)).toBe("call");
  });

  it("folds groups 2.5 and 3.0", () => {
    expect(actionForGroup(2.5)).toBe("fold");
    expect(actionForGroup(3.0)).toBe("fold");
  });

  it("uses the default strategy when none is given", () => {
    for (const g of [0.8, 1.0, 1.5, 2.0, 2.5, 3.0]) {
      expect(actionForGroup(g)).toBe(actionForGroup(g, DEFAULT_STRATEGY));
    }
  });

  it("respects a custom strategy tuple", () => {
    const tight = [0.8, 1.0, 3.0] as const;
    expect(actionForGroup(1.0, tight)).toBe("call");
    expect(actionForGroup(1.5, tight)).toBe("fold");
  });
});
