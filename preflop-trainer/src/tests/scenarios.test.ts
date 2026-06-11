import { describe, it, expect } from "vitest";
import {
  SCENARIOS,
  randomScenario,
  explainAction,
  type Action,
  type ScenarioId,
} from "../core/scenarios";
import { GROUPS } from "../core/hands";

function byId(id: ScenarioId) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s;
}

/** Expected correct action for every group, per scenario (the spec matrix). */
const MATRIX: Record<ScenarioId, Record<number, Action>> = {
  "ep-open": {
    0.8: "open-raise", 1.0: "open-call", 1.5: "open-call", 2.0: "open-call",
    2.5: "open-fold", 3.0: "open-fold", 3.5: "fold", 4.0: "fold",
    5.0: "fold", 6.0: "fold",
  },
  "mp-open": {
    0.8: "open-raise", 1.0: "open-raise", 1.5: "open-call", 2.0: "open-call",
    2.5: "open-call", 3.0: "open-fold", 3.5: "open-fold", 4.0: "fold",
    5.0: "fold", 6.0: "fold",
  },
  "co-open": {
    0.8: "open-raise", 1.0: "open-raise", 1.5: "open-raise", 2.0: "open-call",
    2.5: "open-call", 3.0: "open-call", 3.5: "open-fold", 4.0: "open-fold",
    5.0: "fold", 6.0: "fold",
  },
  "btn-open": {
    0.8: "open-raise", 1.0: "open-raise", 1.5: "open-raise", 2.0: "open-call",
    2.5: "open-call", 3.0: "open-call", 3.5: "open-call", 4.0: "open-fold",
    5.0: "open-fold", 6.0: "fold",
  },
  "sb-open": {
    0.8: "open-raise", 1.0: "open-raise", 1.5: "open-call", 2.0: "open-call",
    2.5: "open-fold", 3.0: "open-fold", 3.5: "limp-call", 4.0: "limp-call",
    5.0: "limp-fold", 6.0: "fold",
  },
  "bb-vs-limp": {
    0.8: "raise", 1.0: "raise", 1.5: "raise", 2.0: "raise", 2.5: "raise",
    3.0: "raise", 3.5: "raise", 4.0: "raise", 5.0: "check", 6.0: "check",
  },
  "early-3bet": {
    0.8: "3bet", 1.0: "3bet", 1.5: "3bet", 2.0: "call", 2.5: "call",
    3.0: "fold", 3.5: "fold", 4.0: "fold", 5.0: "fold", 6.0: "fold",
  },
  "late-3bet": {
    0.8: "3bet", 1.0: "3bet", 1.5: "3bet", 2.0: "3bet", 2.5: "call",
    3.0: "call", 3.5: "fold", 4.0: "fold", 5.0: "fold", 6.0: "fold",
  },
  "bb-3bet": {
    0.8: "3bet", 1.0: "3bet", 1.5: "3bet", 2.0: "3bet", 2.5: "call",
    3.0: "call", 3.5: "call", 4.0: "call", 5.0: "call", 6.0: "fold",
  },
};

describe("there are nine scenarios", () => {
  it("with unique ids matching the matrix", () => {
    expect(SCENARIOS).toHaveLength(9);
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(9);
    expect(new Set(SCENARIOS.map((s) => s.id))).toEqual(
      new Set(Object.keys(MATRIX))
    );
  });
});

describe("scenario correctAction matches the spec matrix", () => {
  for (const scenario of SCENARIOS) {
    for (const group of GROUPS) {
      it(`${scenario.id} @ group ${group}`, () => {
        expect(scenario.correctAction(group)).toBe(MATRIX[scenario.id][group]);
      });
    }
  }
});

describe("scenario action menus", () => {
  it("offers four options for the EP/MP/CO/BTN opens", () => {
    for (const id of ["ep-open", "mp-open", "co-open", "btn-open"] as ScenarioId[]) {
      expect(byId(id).actions).toEqual([
        "open-raise", "open-call", "open-fold", "fold",
      ]);
    }
  });

  it("offers six options for the SB open", () => {
    expect(byId("sb-open").actions).toEqual([
      "open-raise", "open-call", "open-fold", "limp-call", "limp-fold", "fold",
    ]);
  });

  it("offers raise/check for BB vs a limp", () => {
    expect(byId("bb-vs-limp").actions).toEqual(["raise", "check"]);
  });

  it("offers 3-bet/call/fold for the 3-bet spots", () => {
    for (const id of ["early-3bet", "late-3bet", "bb-3bet"] as ScenarioId[]) {
      expect(byId(id).actions).toEqual(["3bet", "call", "fold"]);
    }
  });

  it("only ever returns an action from its own menu", () => {
    for (const scenario of SCENARIOS) {
      for (const group of GROUPS) {
        expect(scenario.actions).toContain(scenario.correctAction(group));
      }
    }
  });
});

describe("randomScenario", () => {
  it("indexes by the rng across the full range", () => {
    expect(randomScenario(() => 0).id).toBe("ep-open");
    expect(randomScenario(() => 0.999).id).toBe("bb-3bet");
  });

  it("can produce every scenario", () => {
    const seen = new Set<string>();
    let t = 0;
    const rng = () => ((t += 0.013), t % 1);
    for (let i = 0; i < 5000; i++) seen.add(randomScenario(rng).id);
    expect(seen.size).toBe(SCENARIOS.length);
  });
});

describe("explainAction", () => {
  it("describes every action in every scenario with a non-empty phrase", () => {
    for (const scenario of SCENARIOS) {
      for (const action of scenario.actions) {
        expect(explainAction(scenario, action).length).toBeGreaterThan(0);
      }
    }
  });

  it("phrases a fold differently for open vs 3-bet scenarios", () => {
    expect(explainAction(byId("ep-open"), "fold")).toMatch(/don't enter/);
    expect(explainAction(byId("early-3bet"), "fold")).toMatch(/open/);
  });
});
