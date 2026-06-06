import type { HandClass, Rank } from "./hands";

/** Suits, by their single-letter code. */
export type Suit = "s" | "h" | "d" | "c";

export const SUITS: readonly Suit[] = ["s", "h", "d", "c"];

export interface Card {
  rank: Rank;
  suit: Suit;
}

/** Unicode glyphs for each suit. */
export const SUIT_SYMBOL: Record<Suit, string> = {
  s: "♠", // ♠
  h: "♥", // ♥
  d: "♦", // ♦
  c: "♣", // ♣
};

/** Hearts and diamonds render red; spades and clubs render dark. */
export function isRedSuit(suit: Suit): boolean {
  return suit === "h" || suit === "d";
}

/** Pick `count` distinct suits at random. */
function pickSuits(count: number, rng: () => number): Suit[] {
  const pool = [...SUITS];
  const chosen: Suit[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }
  return chosen;
}

/**
 * Materialize two concrete cards consistent with a hand class. This is what
 * lets us show the player real cards (e.g. A♠ K♠ for AKs) drawn from the deck
 * rather than abstract notation.
 */
export function dealCards(hand: HandClass, rng: () => number = Math.random): [Card, Card] {
  if (hand.type === "suited") {
    const [suit] = pickSuits(1, rng);
    return [
      { rank: hand.high, suit },
      { rank: hand.low, suit },
    ];
  }

  // Pairs and offsuit hands both use two different suits.
  const [s1, s2] = pickSuits(2, rng);
  return [
    { rank: hand.high, suit: s1 },
    { rank: hand.low, suit: s2 },
  ];
}
