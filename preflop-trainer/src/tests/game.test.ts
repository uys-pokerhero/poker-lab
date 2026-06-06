import { describe, it, expect } from "vitest";
import {
  nextQuestion,
  evaluate,
  applyVerdict,
  successRate,
  EMPTY_STATS,
  type Question,
  type Verdict,
} from "../core/game";
import { HANDS, type HandClass } from "../core/hands";
import { dealCards } from "../core/deck";
import { SCENARIOS, type ScenarioId } from "../core/scenarios";

function findHand(code: string): HandClass {
  const hand = HANDS.find((h) => h.code === code);
  if (!hand) throw new Error(`missing test hand ${code}`);
  return hand;
}

function scenario(id: ScenarioId) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s;
}

function question(code: string, id: ScenarioId): Question {
  const hand = findHand(code);
  return { scenario: scenario(id), hand, cards: dealCards(hand, () => 0) };
}

describe("nextQuestion", () => {
  it("returns the requested scenario with a known hand and two cards", () => {
    const q = nextQuestion(scenario("mp-open"), () => 0);
    expect(q.scenario.id).toBe("mp-open");
    expect(HANDS).toContain(q.hand);
    expect(q.cards).toHaveLength(2);
  });
});

describe("evaluate", () => {
  it("counts a win only when group and action are both correct", () => {
    // AA: group 0.8 -> EP open-raise
    const v = evaluate(question("AA", "ep-open"), {
      group: 0.8,
      action: "open-raise",
    });
    expect(v).toMatchObject({ groupOk: true, actionOk: true, win: true });
  });

  it("applies the scenario-specific action (AA 3-bets in Early 3-Bet)", () => {
    const v = evaluate(question("AA", "early-3bet"), {
      group: 0.8,
      action: "3bet",
    });
    expect(v.correctAction).toBe("3bet");
    expect(v.win).toBe(true);
  });

  it("maps a too-weak hand to a plain fold in an open spot", () => {
    // 22: group 4.0 -> EP fold (do not open)
    const v = evaluate(question("22", "ep-open"), {
      group: 4.0,
      action: "fold",
    });
    expect(v.correctAction).toBe("fold");
    expect(v.win).toBe(true);
  });

  it("judges the action against the true group, not the guessed one", () => {
    // TT: group 1.5 -> EP open-call
    const v = evaluate(question("TT", "ep-open"), {
      group: 4.0,
      action: "open-call",
    });
    expect(v.actionOk).toBe(true);
    expect(v.groupOk).toBe(false);
    expect(v.win).toBe(false);
    expect(v.correctGroup).toBe(1.5);
    expect(v.correctAction).toBe("open-call");
  });
});

describe("applyVerdict / successRate", () => {
  const win: Verdict = {
    groupOk: true,
    actionOk: true,
    win: true,
    correctGroup: 0.8,
    correctAction: "open-raise",
  };
  const loss: Verdict = {
    groupOk: false,
    actionOk: false,
    win: false,
    correctGroup: 0.8,
    correctAction: "open-raise",
  };

  it("accumulates plays, wins, and streaks", () => {
    let s = applyVerdict(EMPTY_STATS, win);
    s = applyVerdict(s, win);
    expect(s.streak).toBe(2);
    expect(s.bestStreak).toBe(2);

    s = applyVerdict(s, loss);
    expect(s.played).toBe(3);
    expect(s.correct).toBe(2);
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(2);
    expect(successRate(s)).toBeCloseTo(2 / 3, 10);
  });

  it("reports a zero success rate before any hands are played", () => {
    expect(successRate(EMPTY_STATS)).toBe(0);
  });
});
