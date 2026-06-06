import { describe, it, expect } from "vitest";
import {
  nextQuestion,
  evaluate,
  applyVerdict,
  successRate,
  EMPTY_STATS,
} from "../core/game";
import { HANDS, type HandClass } from "../core/hands";

function findHand(code: string): HandClass {
  const hand = HANDS.find((h) => h.code === code);
  if (!hand) throw new Error(`missing test hand ${code}`);
  return hand;
}

describe("nextQuestion", () => {
  it("returns a known hand with two dealt cards", () => {
    const q = nextQuestion(() => 0);
    expect(HANDS).toContain(q.hand);
    expect(q.cards).toHaveLength(2);
  });
});

describe("evaluate", () => {
  it("counts a win only when group and action are both correct", () => {
    const aa = findHand("AA"); // group 0.8 -> raise
    const v = evaluate(aa, { group: 0.8, action: "raise" });
    expect(v).toMatchObject({ groupOk: true, actionOk: true, win: true });
  });

  it("fails the whole hand when the group is wrong", () => {
    const aa = findHand("AA");
    const v = evaluate(aa, { group: 1.0, action: "raise" });
    expect(v.groupOk).toBe(false);
    expect(v.win).toBe(false);
  });

  it("judges the action against the true group, not the guessed one", () => {
    const tt = findHand("TT"); // group 1.5 -> call
    const v = evaluate(tt, { group: 3.0, action: "call" });
    expect(v.actionOk).toBe(true); // call is correct for the real group
    expect(v.groupOk).toBe(false);
    expect(v.win).toBe(false);
    expect(v.correctGroup).toBe(1.5);
    expect(v.correctAction).toBe("call");
  });
});

describe("applyVerdict / successRate", () => {
  it("accumulates plays, wins, and streaks", () => {
    const win = { groupOk: true, actionOk: true, win: true, correctGroup: 0.8 as const, correctAction: "raise" as const };
    const loss = { groupOk: false, actionOk: false, win: false, correctGroup: 0.8 as const, correctAction: "raise" as const };

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
