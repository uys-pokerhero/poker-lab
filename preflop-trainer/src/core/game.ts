import { HANDS, type Group, type HandClass } from "./hands";
import { dealCards, type Card } from "./deck";
import { weightedPick } from "./sampling";
import { type Action, type Scenario } from "./scenarios";

/** A single drill question: a scenario, a hand class, and the cards shown. */
export interface Question {
  scenario: Scenario;
  hand: HandClass;
  cards: [Card, Card];
}

/** Draw the next weighted-random hand and deal cards for the given scenario. */
export function nextQuestion(
  scenario: Scenario,
  rng: () => number = Math.random
): Question {
  const hand = weightedPick(HANDS, (h) => h.weight, rng);
  const cards = dealCards(hand, rng);
  return { scenario, hand, cards };
}

/** What the player submitted. */
export interface Guess {
  group: Group;
  action: Action;
}

/** Scoring breakdown for one answered question. */
export interface Verdict {
  groupOk: boolean;
  actionOk: boolean;
  /**
   * Whether the hand counts as a win. The action is what matters, so this is
   * the action alone — picking the wrong group is never penalised.
   */
  win: boolean;
  correctGroup: Group;
  correctAction: Action;
}

/** Score a guess against the truth for a given question. */
export function evaluate(question: Question, guess: Guess): Verdict {
  const correctGroup = question.hand.group;
  const correctAction = question.scenario.correctAction(question.hand.group);
  const groupOk = guess.group === correctGroup;
  const actionOk = guess.action === correctAction;
  return {
    groupOk,
    actionOk,
    // Scored on the action only; the group is an unscored self-check.
    win: actionOk,
    correctGroup,
    correctAction,
  };
}

/** Running tally across a session. */
export interface Stats {
  played: number;
  /** Wins, i.e. hands where the action was correct. */
  correct: number;
  /** Hands where the (unscored) group self-check was also correct. */
  groupCorrect: number;
  /** Hands where the action was correct (same as `correct`; kept for clarity). */
  actionCorrect: number;
  streak: number;
  bestStreak: number;
}

export const EMPTY_STATS: Stats = {
  played: 0,
  correct: 0,
  groupCorrect: 0,
  actionCorrect: 0,
  streak: 0,
  bestStreak: 0,
};

/** Fold a verdict into the running stats, returning a new Stats object. */
export function applyVerdict(stats: Stats, verdict: Verdict): Stats {
  const streak = verdict.win ? stats.streak + 1 : 0;
  return {
    played: stats.played + 1,
    correct: stats.correct + (verdict.win ? 1 : 0),
    groupCorrect: stats.groupCorrect + (verdict.groupOk ? 1 : 0),
    actionCorrect: stats.actionCorrect + (verdict.actionOk ? 1 : 0),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
}

/** Success rate in [0, 1]; 0 when nothing has been played yet. */
export function successRate(stats: Stats): number {
  return stats.played === 0 ? 0 : stats.correct / stats.played;
}
