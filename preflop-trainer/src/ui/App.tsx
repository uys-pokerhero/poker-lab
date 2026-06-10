import { useState, useEffect, useCallback, useRef } from "react";
import { PlayingCard } from "./components/PlayingCard";
import { GroupSelector } from "./components/GroupSelector";
import { ActionSelector } from "./components/ActionSelector";
import { ScorePanel } from "./components/ScorePanel";
import { Feedback } from "./components/Feedback";
import { GROUPS, formatGroup, type Group } from "../core/hands";
import {
  SCENARIOS,
  scenarioForRound,
  ACTION_LABEL,
  type Action,
} from "../core/scenarios";
import {
  nextQuestion,
  evaluate,
  applyVerdict,
  EMPTY_STATS,
  type Question,
  type Stats,
  type Verdict,
} from "../core/game";
import "./styles.css";

type Phase = "idle" | "guessing" | "revealed";

const STORAGE_KEY = "pvh-preflop-trainer-stats-v1";

/** Colour tone used for an action's tag/label in the reference legend. */
const ACTION_TONE: Record<Action, "raise" | "call" | "fold"> = {
  "open-raise": "raise",
  "3bet": "raise",
  "open-call": "call",
  call: "call",
  "open-fold": "fold",
  fold: "fold",
};

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATS;
    return { ...EMPTY_STATS, ...JSON.parse(raw) };
  } catch {
    return EMPTY_STATS;
  }
}

export function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [question, setQuestion] = useState<Question | null>(null);
  const [guessGroup, setGuessGroup] = useState<Group | null>(null);
  const [guessAction, setGuessAction] = useState<Action | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [stats, setStats] = useState<Stats>(loadStats);

  // Counts hands dealt this session; drives the fixed scenario rotation.
  const roundRef = useRef(0);

  // Persist the running score so it survives a reload.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      /* localStorage unavailable (e.g. private mode) — ignore. */
    }
  }, [stats]);

  const deal = useCallback(() => {
    const scenario = scenarioForRound(roundRef.current);
    roundRef.current += 1;
    setQuestion(nextQuestion(scenario));
    setGuessGroup(null);
    setGuessAction(null);
    setVerdict(null);
    setPhase("guessing");
  }, []);

  const ready = guessGroup !== null && guessAction !== null;

  const submit = useCallback(() => {
    if (phase !== "guessing" || !question) return;
    if (guessGroup === null || guessAction === null) return;
    const v = evaluate(question, { group: guessGroup, action: guessAction });
    setVerdict(v);
    setStats((s) => applyVerdict(s, v));
    setPhase("revealed");
  }, [phase, question, guessGroup, guessAction]);

  const resetStats = useCallback(() => setStats(EMPTY_STATS), []);

  // Enter advances: submit when ready, deal the next hand once revealed.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      if (phase === "guessing" && ready) {
        e.preventDefault();
        submit();
      } else if (phase === "revealed") {
        e.preventDefault();
        deal();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, ready, submit, deal]);

  return (
    <div className="pvh-preflop-root">
      <nav className="back-nav">
        <a href="/" className="back-link">
          &larr; Poker Lab
        </a>
      </nav>

      <h1 className="page-title">Preflop Trainer</h1>

      <main className="game">
        {phase === "idle" ? (
          <section className="intro">
            <p className="intro-text">
              Each round deals two hole cards. Identify the hand's{" "}
              <strong>group</strong> and choose the correct{" "}
              <strong>play</strong> for the spot. The drill rotates through{" "}
              <strong>EP Open</strong>, <strong>MP Open</strong>, and facing an{" "}
              <strong>Early 3-Bet</strong>.
            </p>
            <button type="button" className="primary-btn" onClick={deal}>
              Start Game
            </button>
          </section>
        ) : (
          question && (
            <>
              <ScorePanel stats={stats} onReset={resetStats} />

              <div className="scenario">
                <div className="scenario-badge">{question.scenario.label}</div>
                <div className="scenario-hint">{question.scenario.hint}</div>
              </div>

              <div className="cards">
                <PlayingCard card={question.cards[0]} />
                <PlayingCard card={question.cards[1]} />
              </div>

              <GroupSelector
                value={guessGroup}
                onChange={setGuessGroup}
                disabled={phase === "revealed"}
                correct={verdict ? verdict.correctGroup : null}
              />

              <ActionSelector
                actions={question.scenario.actions}
                value={guessAction}
                onChange={setGuessAction}
                disabled={phase === "revealed"}
                correct={verdict ? verdict.correctAction : null}
              />

              {phase === "guessing" ? (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={submit}
                  disabled={!ready}
                >
                  Submit
                </button>
              ) : (
                verdict && (
                  <>
                    <Feedback
                      scenario={question.scenario}
                      hand={question.hand}
                      verdict={verdict}
                    />
                    <button type="button" className="primary-btn" onClick={deal}>
                      Next Hand
                    </button>
                  </>
                )
              )}
            </>
          )
        )}
      </main>

      <details className="strategy-ref">
        <summary>Strategy &amp; scoring</summary>
        <div className="strategy-body">
          {SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="strategy-scenario">
              <div className="strategy-scenario-title">{scenario.label}</div>
              <ul className="strategy-list">
                {scenario.actions
                  .map((action) => ({
                    action,
                    groups: GROUPS.filter(
                      (g) => scenario.correctAction(g) === action
                    ),
                  }))
                  .filter((row) => row.groups.length > 0)
                  .map(({ action, groups }) => (
                    <li key={action}>
                      <span className={`tag tag-${ACTION_TONE[action]}`}>
                        {ACTION_LABEL[action]}
                      </span>
                      <span className="strategy-groups">
                        {groups.map(formatGroup).join(", ")}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <p className="strategy-note">
            Scenarios rotate in order: EP Open &rarr; MP Open &rarr; Early
            3-Bet. You're scored on the <strong>play</strong> &mdash; the group
            is a self-check and doesn't affect your score. Press{" "}
            <kbd>Enter</kbd> to submit and to advance.
          </p>
        </div>
      </details>
    </div>
  );
}
