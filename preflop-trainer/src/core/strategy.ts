/**
 * UTG-open strategy: how to respond to a 3-bet, as a function of the group the
 * opening hand belongs to.
 *
 * The strategy is encoded as a tuple of three ascending group thresholds
 * `(raiseMax, callMax, foldMax)`:
 *   - group <= raiseMax            -> raise (4-bet)
 *   - raiseMax < group <= callMax  -> call
 *   - callMax  < group <= foldMax  -> fold
 *
 * The default tuple (0.8, 2.0, 3.0) means: raise the very top group (0.8),
 * call groups 1.0 / 1.5 / 2.0, and fold groups 2.5 / 3.0.
 */

export type Action = "raise" | "call" | "fold";

export type Strategy = readonly [raiseMax: number, callMax: number, foldMax: number];

export const DEFAULT_STRATEGY: Strategy = [0.8, 2.0, 3.0];

/** The correct response to a 3-bet for a hand in the given group. */
export function actionForGroup(
  group: number,
  strategy: Strategy = DEFAULT_STRATEGY
): Action {
  const [raiseMax, callMax] = strategy;
  if (group <= raiseMax) return "raise";
  if (group <= callMax) return "call";
  return "fold";
}

/** Player-facing labels, framed as the "open & X" choices in the prompt. */
export const ACTION_LABELS: Record<Action, string> = {
  raise: "Open & Raise (4-bet)",
  call: "Open & Call",
  fold: "Open & Fold",
};

/** Short labels for compact UI (e.g. result chips). */
export const ACTION_SHORT: Record<Action, string> = {
  raise: "Raise",
  call: "Call",
  fold: "Fold",
};

export const ACTIONS: readonly Action[] = ["raise", "call", "fold"];
