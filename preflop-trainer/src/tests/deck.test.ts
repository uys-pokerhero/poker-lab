import { describe, it, expect } from "vitest";
import { dealCards, isRedSuit } from "../core/deck";
import { HANDS, type HandClass } from "../core/hands";

function findHand(code: string): HandClass {
  const hand = HANDS.find((h) => h.code === code);
  if (!hand) throw new Error(`missing test hand ${code}`);
  return hand;
}

describe("dealCards", () => {
  it("gives a pair two of the same rank with different suits", () => {
    const [c1, c2] = dealCards(findHand("AA"));
    expect(c1.rank).toBe("A");
    expect(c2.rank).toBe("A");
    expect(c1.suit).not.toBe(c2.suit);
  });

  it("gives a suited hand two ranks sharing one suit", () => {
    const [c1, c2] = dealCards(findHand("AKs"));
    expect(c1.rank).toBe("A");
    expect(c2.rank).toBe("K");
    expect(c1.suit).toBe(c2.suit);
  });

  it("gives an offsuit hand two ranks with different suits", () => {
    const [c1, c2] = dealCards(findHand("KJo"));
    expect(c1.rank).toBe("K");
    expect(c2.rank).toBe("J");
    expect(c1.suit).not.toBe(c2.suit);
  });

  it("never produces two identical cards across many deals", () => {
    for (const hand of HANDS) {
      for (let i = 0; i < 50; i++) {
        const [c1, c2] = dealCards(hand);
        expect(c1.rank !== c2.rank || c1.suit !== c2.suit).toBe(true);
      }
    }
  });
});

describe("isRedSuit", () => {
  it("treats hearts and diamonds as red", () => {
    expect(isRedSuit("h")).toBe(true);
    expect(isRedSuit("d")).toBe(true);
  });

  it("treats spades and clubs as not red", () => {
    expect(isRedSuit("s")).toBe(false);
    expect(isRedSuit("c")).toBe(false);
  });
});
