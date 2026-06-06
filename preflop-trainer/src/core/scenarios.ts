/**
 * Preflop scenarios and their correct responses.
 *
 * The drill rotates through three scenarios in a fixed order:
 *   1. EP OPEN     — first to act from early position
 *   2. MP OPEN     — first to act from middle position
 *   3. EARLY 3-BET — facing an early-position open
 *
 * Open scenarios are defined by a tuple of three ascending group thresholds
 * `(raiseMax, callMax, foldMax)`:
 *   - group <= raiseMax            -> Open & Raise
 *   - raiseMax < group <= callMax  -> Open & Call
 *   - callMax  < group <= foldMax  -> Open & Fold (open, then fold to a 3-bet)
 *   - group  > foldMax             -> Fold (do not open at all)
 *
 * The 3-bet scenario uses a tuple `(threeBetMax, callMax)`:
 *   - group <= threeBetMax          -> 3-Bet
 *   - threeBetMax < group <= callMax -> Call
 *   - group > callMax                -> Fold
 */

export type Action =
  | "open-raise"
  | "open-call"
  | "open-fold"
  | "fold"
  | "3bet"
  | "call";

/** Button labels for each action. */
export const ACTION_LABEL: Record<Action, string> = {
  "open-raise": "Open & Raise",
  "open-call": "Open & Call",
  "open-fold": "Open & Fold",
  fold: "Fold",
  "3bet": "3-Bet",
  call: "Call",
};

export type ScenarioId = "ep-open" | "mp-open" | "early-3bet";

export interface Scenario {
  id: ScenarioId;
  /** Chip text shown above the cards, e.g. "EP OPEN". */
  label: string;
  /** Short one-line context for the spot. */
  hint: string;
  kind: "open" | "3bet";
  /** Action buttons offered, in display order. */
  actions: readonly Action[];
  /** The correct action for a hand in the given group. */
  correctAction: (group: number) => Action;
}

const OPEN_ACTIONS: readonly Action[] = [
  "open-raise",
  "open-call",
  "open-fold",
  "fold",
];

const THREE_BET_ACTIONS: readonly Action[] = ["3bet", "call", "fold"];

/** Build the response function for an open scenario. */
function openResponse(
  raiseMax: number,
  callMax: number,
  foldMax: number
): (group: number) => Action {
  return (group) => {
    if (group <= raiseMax) return "open-raise";
    if (group <= callMax) return "open-call";
    if (group <= foldMax) return "open-fold";
    return "fold";
  };
}

/** Build the response function for the 3-bet scenario. */
function threeBetResponse(
  threeBetMax: number,
  callMax: number
): (group: number) => Action {
  return (group) => {
    if (group <= threeBetMax) return "3bet";
    if (group <= callMax) return "call";
    return "fold";
  };
}

/** The scenarios, in the order the drill cycles through them. */
export const SCENARIOS: readonly Scenario[] = [
  {
    id: "ep-open",
    label: "EP OPEN",
    hint: "First to act from early position.",
    kind: "open",
    actions: OPEN_ACTIONS,
    correctAction: openResponse(0.8, 2.0, 3.0),
  },
  {
    id: "mp-open",
    label: "MP OPEN",
    hint: "First to act from middle position.",
    kind: "open",
    actions: OPEN_ACTIONS,
    correctAction: openResponse(1.0, 2.5, 3.5),
  },
  {
    id: "early-3bet",
    label: "EARLY 3-BET",
    hint: "Facing an early-position open.",
    kind: "3bet",
    actions: THREE_BET_ACTIONS,
    correctAction: threeBetResponse(1.5, 2.5),
  },
];

/** The scenario for a given (0-based) round, cycling in fixed order. */
export function scenarioForRound(round: number): Scenario {
  return SCENARIOS[round % SCENARIOS.length];
}

/**
 * A short phrase describing the correct action in context, used in feedback.
 * Reads naturally after "...so you ".
 */
export function explainAction(scenario: Scenario, action: Action): string {
  switch (action) {
    case "open-raise":
      return "open-raise and 4-bet against a 3-bet";
    case "open-call":
      return "open-raise and call a 3-bet";
    case "open-fold":
      return "open-raise but fold to a 3-bet";
    case "3bet":
      return "3-bet (re-raise)";
    case "call":
      return "call the open";
    case "fold":
      return scenario.kind === "3bet"
        ? "fold to the open"
        : "fold preflop (don't open)";
  }
}
