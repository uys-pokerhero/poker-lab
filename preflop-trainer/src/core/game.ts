import { HANDS, type Group, type HandClass } from "./hands";
import { dealCards, type Card } from "./deck";
import { weightedPick } from "./sampling";
import { actionForGroup, type Action, type Strategy } from "./strategy";

/** A single drill question: a hand class plus the concrete cards shown. */
export interface Question {
  hand: HandClass;
  cards: [Card, Card];
}

/** Draw the next weighted-random hand and deal cards for it. */
export function nextQuestion(rng: () => number = Math.random): Question {
  const hand = weightedPick(HANDS, (h) => h.weight, rng);
  const cards = dealCards(hand, rng);
  return { hand, cards };
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
  /** A win requires both the group and the action to be correct. */
  win: boolean;
  correctGroup: Group;
  correctAction: Action;
}

/** Score a guess against the truth for a given hand. */
export function evaluate(
  hand: HandClass,
  guess: Guess,
  strategy?: Strategy
): Verdict {
  const correctGroup = hand.group;
  const correctAction = actionForGroup(hand.group, strategy);
  const groupOk = guess.group === correctGroup;
  const actionOk = guess.action === correctAction;
  return {
    groupOk,
    actionOk,
    win: groupOk && actionOk,
    correctGroup,
    correctAction,
  };
}

/** Running tally across a session. */
export interface Stats {
  played: number;
  /** Hands where both group and action were correct. */
  correct: number;
  /** Hands where the group alone was correct. */
  groupCorrect: number;
  /** Hands where the action alone was correct. */
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
