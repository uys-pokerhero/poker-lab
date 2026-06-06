/**
 * Starting-hand data for the UTG-open drill.
 *
 * Each hand is described by its canonical notation, the number of card
 * combinations it represents ("weight"), and the strategy group it belongs to.
 *
 * Notation:
 *   - "AA"   pocket pair      (6 combos)
 *   - "AKs"  suited           (4 combos)
 *   - "AKo"  offsuit          (12 combos)
 *
 * Only the hands UTG opens with are included. The groups present are
 * 0.8, 1.0, 1.5, 2.0, 2.5 and 3.0. (Other groups exist but UTG does not open
 * them, so they are intentionally excluded from this prototype.)
 */

export type Rank =
  | "A"
  | "K"
  | "Q"
  | "J"
  | "T"
  | "9"
  | "8"
  | "7"
  | "6"
  | "5"
  | "4"
  | "3"
  | "2";

/** A hand's shape. */
export type HandType = "pair" | "suited" | "offsuit";

/** Strategy groups that appear in the UTG-open range. */
export type Group = 0.8 | 1.0 | 1.5 | 2.0 | 2.5 | 3.0;

export interface HandClass {
  /** Canonical notation, e.g. "AA", "AKs", "AKo". */
  code: string;
  /** Shape of the hand. */
  type: HandType;
  /** Higher of the two ranks (equals `low` for pairs). */
  high: Rank;
  /** Lower of the two ranks (equals `high` for pairs). */
  low: Rank;
  /** Number of card combinations (used as the sampling weight). */
  weight: number;
  /** Strategy group this hand belongs to. */
  group: Group;
}

/** Rank order, strongest first. Index doubles as a strength score. */
export const RANK_ORDER: readonly Rank[] = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
];

/**
 * Source table: [code, weight, group]. Offsuit hands carry an explicit "o"
 * suffix here for clarity even though they are written without one in casual
 * notation.
 */
const RAW: ReadonlyArray<[string, number, Group]> = [
  // Group 0.8
  ["AA", 6, 0.8],
  ["AKo", 12, 0.8],
  ["AKs", 4, 0.8],
  ["AQs", 4, 0.8],
  ["KK", 6, 0.8],
  ["QQ", 6, 0.8],
  ["JJ", 6, 0.8],
  // Group 1.0
  ["KQs", 4, 1.0],
  ["AJs", 4, 1.0],
  ["KJs", 4, 1.0],
  // Group 1.5
  ["AQo", 12, 1.5],
  ["ATs", 4, 1.5],
  ["KTs", 4, 1.5],
  ["TT", 6, 1.5],
  ["A5s", 4, 1.5],
  ["A4s", 4, 1.5],
  // Group 2.0
  ["99", 6, 2.0],
  ["88", 6, 2.0],
  ["77", 6, 2.0],
  ["66", 6, 2.0],
  // Group 2.5
  ["AJo", 12, 2.5],
  ["KQo", 12, 2.5],
  ["QJs", 4, 2.5],
  ["QTs", 4, 2.5],
  ["JTs", 4, 2.5],
  ["A9s", 4, 2.5],
  // Group 3.0
  ["ATo", 12, 3.0],
  ["KJo", 12, 3.0],
  ["K9s", 4, 3.0],
  ["J9s", 4, 3.0],
  ["T9s", 4, 3.0],
  ["A8s", 4, 3.0],
  ["K8s", 4, 3.0],
  ["A7s", 4, 3.0],
  ["A6s", 4, 3.0],
  ["55", 6, 3.0],
  ["A3s", 4, 3.0],
];

function isRank(c: string): c is Rank {
  return (RANK_ORDER as readonly string[]).includes(c);
}

/** Parse a hand code into its shape and the two ranks (high first). */
export function parseCode(code: string): {
  type: HandType;
  high: Rank;
  low: Rank;
} {
  const r1 = code[0];
  const r2 = code[1];
  if (!isRank(r1) || !isRank(r2)) {
    throw new Error(`Invalid hand code: ${code}`);
  }
  // Order the two ranks so the stronger one is `high`.
  const [high, low] =
    RANK_ORDER.indexOf(r1) <= RANK_ORDER.indexOf(r2) ? [r1, r2] : [r2, r1];

  if (r1 === r2) return { type: "pair", high, low };
  if (code[2] === "s") return { type: "suited", high, low };
  return { type: "offsuit", high, low };
}

/** All hands UTG opens with, fully expanded. */
export const HANDS: readonly HandClass[] = RAW.map(([code, weight, group]) => ({
  code,
  ...parseCode(code),
  weight,
  group,
}));

/** Distinct strategy groups, ascending (strongest first). */
export const GROUPS: readonly Group[] = [0.8, 1.0, 1.5, 2.0, 2.5, 3.0];

/** Format a group value for display, always with one decimal (e.g. "1.0"). */
export function formatGroup(group: number): string {
  return group.toFixed(1);
}
