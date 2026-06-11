/**
 * Preflop scenarios and their correct responses.
 *
 * The drill draws a random scenario each hand from the nine below. Each
 * scenario maps the hand's group to a correct action via an ascending list of
 * (max-group, action) steps, with a fallback for anything weaker.
 */

export type Action =
  | "open-raise"
  | "open-call"
  | "open-fold"
  | "limp-call"
  | "limp-fold"
  | "fold"
  | "raise"
  | "check"
  | "3bet"
  | "call";

/** Button labels for each action. */
export const ACTION_LABEL: Record<Action, string> = {
  "open-raise": "Open & Raise",
  "open-call": "Open & Call",
  "open-fold": "Open & Fold",
  "limp-call": "Limp & Call",
  "limp-fold": "Limp & Fold",
  fold: "Fold",
  raise: "Raise",
  check: "Check",
  "3bet": "3-Bet",
  call: "Call",
};

export type ScenarioId =
  | "ep-open"
  | "mp-open"
  | "co-open"
  | "btn-open"
  | "sb-open"
  | "bb-vs-limp"
  | "early-3bet"
  | "late-3bet"
  | "bb-3bet";

export interface Scenario {
  id: ScenarioId;
  /** Chip text shown above the cards, e.g. "EP OPEN". */
  label: string;
  /** Short one-line context for the spot. */
  hint: string;
  kind: "open" | "3bet" | "bb-limp";
  /** Action buttons offered, in display order. */
  actions: readonly Action[];
  /** The correct action for a hand in the given group. */
  correctAction: (group: number) => Action;
}

/** A (max-group, action) step. */
type Step = readonly [max: number, action: Action];

/**
 * Build a response function from ascending thresholds: the first step whose
 * `max` is >= the group wins; otherwise `fallback`.
 */
function responder(steps: readonly Step[], fallback: Action): (group: number) => Action {
  return (group) => {
    for (const [max, action] of steps) {
      if (group <= max) return action;
    }
    return fallback;
  };
}

const OPEN_ACTIONS: readonly Action[] = [
  "open-raise",
  "open-call",
  "open-fold",
  "fold",
];

const SB_ACTIONS: readonly Action[] = [
  "open-raise",
  "open-call",
  "open-fold",
  "limp-call",
  "limp-fold",
  "fold",
];

const BB_LIMP_ACTIONS: readonly Action[] = ["raise", "check"];

const THREE_BET_ACTIONS: readonly Action[] = ["3bet", "call", "fold"];

/** The nine scenarios; the drill picks one at random each hand. */
export const SCENARIOS: readonly Scenario[] = [
  {
    id: "ep-open",
    label: "EP OPEN",
    hint: "Opening from early position.",
    kind: "open",
    actions: OPEN_ACTIONS,
    correctAction: responder(
      [
        [0.8, "open-raise"],
        [2.0, "open-call"],
        [3.0, "open-fold"],
      ],
      "fold"
    ),
  },
  {
    id: "mp-open",
    label: "MP OPEN",
    hint: "Opening from middle position.",
    kind: "open",
    actions: OPEN_ACTIONS,
    correctAction: responder(
      [
        [1.0, "open-raise"],
        [2.5, "open-call"],
        [3.5, "open-fold"],
      ],
      "fold"
    ),
  },
  {
    id: "co-open",
    label: "CO OPEN",
    hint: "Opening from the cutoff.",
    kind: "open",
    actions: OPEN_ACTIONS,
    correctAction: responder(
      [
        [1.5, "open-raise"],
        [3.0, "open-call"],
        [4.0, "open-fold"],
      ],
      "fold"
    ),
  },
  {
    id: "btn-open",
    label: "BTN OPEN",
    hint: "Opening from the button.",
    kind: "open",
    actions: OPEN_ACTIONS,
    correctAction: responder(
      [
        [1.5, "open-raise"],
        [3.5, "open-call"],
        [5.0, "open-fold"],
      ],
      "fold"
    ),
  },
  {
    id: "sb-open",
    label: "SB OPEN",
    hint: "Opening from the small blind (raise or limp).",
    kind: "open",
    actions: SB_ACTIONS,
    correctAction: responder(
      [
        [1.0, "open-raise"],
        [2.0, "open-call"],
        [3.0, "open-fold"],
        [4.0, "limp-call"],
        [5.0, "limp-fold"],
      ],
      "fold"
    ),
  },
  {
    id: "bb-vs-limp",
    label: "BB vs SB LIMP",
    hint: "Big blind; the small blind limped.",
    kind: "bb-limp",
    actions: BB_LIMP_ACTIONS,
    correctAction: responder([[4.0, "raise"]], "check"),
  },
  {
    id: "early-3bet",
    label: "EARLY 3-BET",
    hint: "Facing an early-position open.",
    kind: "3bet",
    actions: THREE_BET_ACTIONS,
    correctAction: responder(
      [
        [1.5, "3bet"],
        [2.5, "call"],
      ],
      "fold"
    ),
  },
  {
    id: "late-3bet",
    label: "LATE 3-BET",
    hint: "Facing a late-position open.",
    kind: "3bet",
    actions: THREE_BET_ACTIONS,
    correctAction: responder(
      [
        [2.0, "3bet"],
        [3.0, "call"],
      ],
      "fold"
    ),
  },
  {
    id: "bb-3bet",
    label: "BB 3-BET",
    hint: "In the big blind, facing an open.",
    kind: "3bet",
    actions: THREE_BET_ACTIONS,
    correctAction: responder(
      [
        [2.0, "3bet"],
        [5.0, "call"],
      ],
      "fold"
    ),
  },
];

/** Pick a scenario uniformly at random. */
export function randomScenario(rng: () => number = Math.random): Scenario {
  return SCENARIOS[Math.floor(rng() * SCENARIOS.length)];
}

/**
 * A short phrase describing the correct action in context, used in feedback.
 * Reads naturally after "...so you ".
 */
export function explainAction(scenario: Scenario, action: Action): string {
  switch (action) {
    case "open-raise":
      return "open-raise (and 4-bet against a 3-bet)";
    case "open-call":
      return "open-raise (and call a 3-bet)";
    case "open-fold":
      return "open-raise but fold to a 3-bet";
    case "limp-call":
      return "limp, then call a raise";
    case "limp-fold":
      return "limp, then fold to a raise";
    case "raise":
      return "raise to isolate the limper";
    case "check":
      return "check and take a free flop";
    case "3bet":
      return "3-bet (re-raise)";
    case "call":
      return "call";
    case "fold":
      return scenario.kind === "3bet"
        ? "fold to the open"
        : "fold preflop (don't enter the pot)";
  }
}
