/**
 * Starting-hand data for the preflop drill.
 *
 * Each hand is described by its canonical notation, the number of card
 * combinations it represents ("weight"), and the strategy group it belongs to.
 *
 * Notation:
 *   - "AA"   pocket pair      (6 combos)
 *   - "AKs"  suited           (4 combos)
 *   - "AKo"  offsuit          (12 combos)
 *
 * The full universe spans groups 0.8 through 4.0. Every scenario samples from
 * the whole list; weaker groups simply map to "fold" in a given scenario.
 *
 * The RAW table below is kept in the order it was provided, with offsuit hands
 * written without a suffix (e.g. "AK"); the canonical display code adds the
 * "o" suffix ("AKo").
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

/** Strategy groups that appear in the hand universe. */
export type Group = 0.8 | 1.0 | 1.5 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0;

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

/** Source table: [code, weight, group], in the order originally provided. */
const RAW: ReadonlyArray<[string, number, Group]> = [
  ["AA", 6, 0.8],
  ["AK", 12, 0.8],
  ["AQ", 12, 1.5],
  ["AJ", 12, 2.5],
  ["AT", 12, 3.0],
  ["A9", 12, 3.5],
  ["A8", 12, 4.0],
  ["A7", 12, 4.0],
  ["A5", 12, 4.0],
  ["AKs", 4, 0.8],
  ["KK", 6, 0.8],
  ["KQ", 12, 2.5],
  ["KJ", 12, 3.0],
  ["KT", 12, 3.5],
  ["K9", 12, 4.0],
  ["AQs", 4, 0.8],
  ["KQs", 4, 1.0],
  ["QQ", 6, 0.8],
  ["QJ", 12, 3.5],
  ["QT", 12, 4.0],
  ["AJs", 4, 1.0],
  ["KJs", 4, 1.0],
  ["QJs", 4, 2.5],
  ["JJ", 6, 0.8],
  ["JT", 12, 4.0],
  ["ATs", 4, 1.5],
  ["KTs", 4, 1.5],
  ["QTs", 4, 2.5],
  ["JTs", 4, 2.5],
  ["TT", 6, 1.5],
  ["A9s", 4, 2.5],
  ["K9s", 4, 3.0],
  ["Q9s", 4, 3.5],
  ["J9s", 4, 3.0],
  ["T9s", 4, 3.0],
  ["99", 6, 2.0],
  ["A8s", 4, 3.0],
  ["K8s", 4, 3.0],
  ["Q8s", 4, 3.5],
  ["J8s", 4, 4.0],
  ["T8s", 4, 3.5],
  ["98s", 4, 3.5],
  ["88", 6, 2.0],
  ["A7s", 4, 3.0],
  ["K7s", 4, 3.5],
  ["Q7s", 4, 4.0],
  ["J7s", 4, 4.0],
  ["T7s", 4, 4.0],
  ["97s", 4, 4.0],
  ["87s", 4, 3.5],
  ["77", 6, 2.0],
  ["A6s", 4, 3.0],
  ["K6s", 4, 3.5],
  ["Q6s", 4, 4.0],
  ["96s", 4, 4.0],
  ["86s", 4, 4.0],
  ["76s", 4, 3.5],
  ["66", 6, 2.0],
  ["A5s", 4, 1.5],
  ["K5s", 4, 3.5],
  ["Q5s", 4, 4.0],
  ["75s", 4, 4.0],
  ["65s", 4, 3.5],
  ["55", 6, 3.0],
  ["A4s", 4, 1.5],
  ["K4s", 4, 4.0],
  ["54s", 4, 4.0],
  ["44", 6, 3.5],
  ["A3s", 4, 3.0],
  ["K3s", 4, 4.0],
  ["33", 6, 3.5],
  ["A2s", 4, 3.5],
  ["K2s", 4, 4.0],
  ["22", 6, 4.0],
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

/** Build the canonical display code, e.g. "AA", "AKs", "AKo". */
function canonicalCode(high: Rank, low: Rank, type: HandType): string {
  if (type === "pair") return high + low;
  return high + low + (type === "suited" ? "s" : "o");
}

/** All hands in the universe, fully expanded with canonical codes. */
export const HANDS: readonly HandClass[] = RAW.map(([code, weight, group]) => {
  const { type, high, low } = parseCode(code);
  return { code: canonicalCode(high, low, type), type, high, low, weight, group };
});

/** Distinct strategy groups, ascending (strongest first). */
export const GROUPS: readonly Group[] = [
  0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0,
];

/** Format a group value for display, always with one decimal (e.g. "1.0"). */
export function formatGroup(group: number): string {
  return group.toFixed(1);
}
