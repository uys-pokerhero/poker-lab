/**
 * Starting-hand data for the preflop drill — the complete 169-hand matrix
 * (1326 combinations, the full deck).
 *
 * Each hand has a canonical notation, a combination count ("weight", used for
 * sampling), and a strategy group. The RAW_DATA block below is kept verbatim
 * in the order it was provided (CSV: HAND,WEIGHT,GROUP) so it is easy to verify
 * and update; offsuit hands are written without a suffix (e.g. "AK") and the
 * canonical display code adds an "o" ("AKo").
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

/** Strategy groups, strongest (0.8) to weakest (6.0). */
export type Group = 0.8 | 1.0 | 1.5 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0 | 5.0 | 6.0;

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

/** Distinct strategy groups, ascending (strongest first). */
export const GROUPS: readonly Group[] = [
  0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0,
];

const ALLOWED_GROUPS = new Set<number>(GROUPS);

/** Source rows, verbatim (HAND,WEIGHT,GROUP). */
const RAW_DATA = `
AA,6,0.8
AK,12,0.8
AQ,12,1.5
AJ,12,2.5
AT,12,3.0
A9,12,3.5
A8,12,4.0
A7,12,4.0
A6,12,5.0
A5,12,4.0
A4,12,5.0
A3,12,5.0
A2,12,5.0
AKs,4,0.8
KK,6,0.8
KQ,12,2.5
KJ,12,3.0
KT,12,3.5
K9,12,4.0
K8,12,5.0
K7,12,5.0
K6,12,5.0
K5,12,5.0
K4,12,6.0
K3,12,6.0
K2,12,6.0
AQs,4,0.8
KQs,4,1.0
QQ,6,0.8
QJ,12,3.5
QT,12,4.0
Q9,12,5.0
Q8,12,5.0
Q7,12,6.0
Q6,12,6.0
Q5,12,6.0
Q4,12,6.0
Q3,12,6.0
Q2,12,6.0
AJs,4,1.0
KJs,4,1.0
QJs,4,2.5
JJ,6,0.8
JT,12,4.0
J9,12,5.0
J8,12,6.0
J7,12,6.0
J6,12,6.0
J5,12,6.0
J4,12,6.0
J3,12,6.0
J2,12,6.0
ATs,4,1.5
KTs,4,1.5
QTs,4,2.5
JTs,4,2.5
TT,6,1.5
T9,12,5.0
T8,12,5.0
T7,12,6.0
T6,12,6.0
T5,12,6.0
T4,12,6.0
T3,12,6.0
T2,12,6.0
A9s,4,2.5
K9s,4,3.0
Q9s,4,3.5
J9s,4,3.0
T9s,4,3.0
99,6,2.0
98,12,5.0
97,12,6.0
96,12,6.0
95,12,6.0
94,12,6.0
93,12,6.0
92,12,6.0
A8s,4,3.0
K8s,4,3.0
Q8s,4,3.5
J8s,4,4.0
T8s,4,3.5
98s,4,3.5
88,6,2.0
87,12,5.0
86,12,6.0
85,12,6.0
84,12,6.0
83,12,6.0
82,12,6.0
A7s,4,3.0
K7s,4,3.5
Q7s,4,4.0
J7s,4,4.0
T7s,4,4.0
97s,4,4.0
87s,4,3.5
77,6,2.0
76,12,6.0
75,12,6.0
74,12,6.0
73,12,6.0
72,12,6.0
A6s,4,3.0
K6s,4,3.5
Q6s,4,4.0
J6s,4,5.0
T6s,4,5.0
96s,4,4.0
86s,4,4.0
76s,4,3.5
66,6,2.0
65,12,6.0
64,12,6.0
63,12,6.0
62,12,6.0
A5s,4,1.5
K5s,4,3.5
Q5s,4,4.0
J5s,4,5.0
T5s,4,6.0
95s,4,6.0
85s,4,5.0
75s,4,4.0
65s,4,3.5
55,6,3.0
54,12,6.0
53,12,6.0
52,12,6.0
A4s,4,1.5
K4s,4,4.0
Q4s,4,5.0
J4s,4,5.0
T4s,4,6.0
94s,4,6.0
84s,4,6.0
74s,4,6.0
64s,4,5.0
54s,4,4.0
44,6,3.5
43,12,6.0
42,12,6.0
A3s,4,3.0
K3s,4,4.0
Q3s,4,5.0
J3s,4,5.0
T3s,4,6.0
93s,4,6.0
83s,4,6.0
73s,4,6.0
63s,4,6.0
53s,4,6.0
43s,4,5.0
33,6,3.5
32,12,6.0
A2s,4,3.5
K2s,4,4.0
Q2s,4,5.0
J2s,4,6.0
T2s,4,6.0
92s,4,6.0
82s,4,6.0
72s,4,6.0
62s,4,6.0
52s,4,6.0
42s,4,6.0
32s,4,6.0
22,6,4.0
`;

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

function toGroup(value: string): Group {
  const g = Number(value);
  if (!ALLOWED_GROUPS.has(g)) {
    throw new Error(`Invalid group: ${value}`);
  }
  return g as Group;
}

/** All 169 hands, parsed from RAW_DATA with canonical codes. */
export const HANDS: readonly HandClass[] = RAW_DATA.trim()
  .split("\n")
  .map((line) => {
    const [code, weight, group] = line.split(",");
    const { type, high, low } = parseCode(code.trim());
    return {
      code: canonicalCode(high, low, type),
      type,
      high,
      low,
      weight: Number(weight),
      group: toGroup(group),
    };
  });

/** Format a group value for display, always with one decimal (e.g. "1.0"). */
export function formatGroup(group: number): string {
  return group.toFixed(1);
}
