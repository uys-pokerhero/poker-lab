import { describe, it, expect } from "vitest";
import {
  SCENARIOS,
  scenarioForRound,
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
    0.8: "open-raise",
    1.0: "open-call",
    1.5: "open-call",
    2.0: "open-call",
    2.5: "open-fold",
    3.0: "open-fold",
    3.5: "fold",
    4.0: "fold",
  },
  "mp-open": {
    0.8: "open-raise",
    1.0: "open-raise",
    1.5: "open-call",
    2.0: "open-call",
    2.5: "open-call",
    3.0: "open-fold",
    3.5: "open-fold",
    4.0: "fold",
  },
  "early-3bet": {
    0.8: "3bet",
    1.0: "3bet",
    1.5: "3bet",
    2.0: "call",
    2.5: "call",
    3.0: "fold",
    3.5: "fold",
    4.0: "fold",
  },
};

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
  it("offers four open options for open scenarios", () => {
    for (const id of ["ep-open", "mp-open"] as ScenarioId[]) {
      expect(byId(id).actions).toEqual([
        "open-raise",
        "open-call",
        "open-fold",
        "fold",
      ]);
    }
  });

  it("offers three options for the 3-bet scenario", () => {
    expect(byId("early-3bet").actions).toEqual(["3bet", "call", "fold"]);
  });

  it("only ever returns an action from its own menu", () => {
    for (const scenario of SCENARIOS) {
      for (const group of GROUPS) {
        expect(scenario.actions).toContain(scenario.correctAction(group));
      }
    }
  });
});

describe("scenarioForRound rotation", () => {
  it("cycles EP -> MP -> Early 3-bet in fixed order", () => {
    expect(scenarioForRound(0).id).toBe("ep-open");
    expect(scenarioForRound(1).id).toBe("mp-open");
    expect(scenarioForRound(2).id).toBe("early-3bet");
    expect(scenarioForRound(3).id).toBe("ep-open");
    expect(scenarioForRound(7).id).toBe("mp-open");
  });
});

describe("explainAction", () => {
  it("describes every action with a non-empty phrase", () => {
    for (const scenario of SCENARIOS) {
      for (const action of scenario.actions) {
        expect(explainAction(scenario, action).length).toBeGreaterThan(0);
      }
    }
  });

  it("phrases a fold differently for open vs 3-bet scenarios", () => {
    expect(explainAction(byId("ep-open"), "fold")).toMatch(/don't open/);
    expect(explainAction(byId("early-3bet"), "fold")).toMatch(/open/);
  });
});
