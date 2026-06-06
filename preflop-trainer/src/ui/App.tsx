import { useState, useEffect, useCallback, useMemo } from "react";
import { PlayingCard } from "./components/PlayingCard";
import { GroupSelector } from "./components/GroupSelector";
import { ActionSelector } from "./components/ActionSelector";
import { ScorePanel } from "./components/ScorePanel";
import { Feedback } from "./components/Feedback";
import { GROUPS, formatGroup, type Group } from "../core/hands";
import {
  actionForGroup,
  ACTION_SHORT,
  type Action,
} from "../core/strategy";
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

  // Persist the running score so it survives a reload.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      /* localStorage unavailable (e.g. private mode) — ignore. */
    }
  }, [stats]);

  const deal = useCallback(() => {
    setQuestion(nextQuestion());
    setGuessGroup(null);
    setGuessAction(null);
    setVerdict(null);
    setPhase("guessing");
  }, []);

  const ready = guessGroup !== null && guessAction !== null;

  const submit = useCallback(() => {
    if (phase !== "guessing" || !question) return;
    if (guessGroup === null || guessAction === null) return;
    const v = evaluate(question.hand, { group: guessGroup, action: guessAction });
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

  // Group the strategy by action for the reference legend.
  const groupsByAction = useMemo(() => {
    const map: Record<Action, Group[]> = { raise: [], call: [], fold: [] };
    for (const g of GROUPS) map[actionForGroup(g)].push(g);
    return map;
  }, []);

  return (
    <div className="pvh-preflop-root">
      <nav className="back-nav">
        <a href="/" className="back-link">
          &larr; Poker Lab
        </a>
      </nav>

      <h1 className="page-title">Preflop Trainer</h1>
      <p className="page-subtitle">UTG Open &mdash; group &amp; response to a 3-bet</p>

      <main className="game">
        {phase === "idle" ? (
          <section className="intro">
            <p className="intro-text">
              You're first to act (UTG) and you open-raise. A later position{" "}
              <strong>3-bets</strong> you. For each hand, identify the{" "}
              <strong>group</strong> it belongs to and the correct{" "}
              <strong>response</strong> to the 3-bet.
            </p>
            <button type="button" className="primary-btn" onClick={deal}>
              Start Game
            </button>
          </section>
        ) : (
          question && (
            <>
              <ScorePanel stats={stats} onReset={resetStats} />

              <div className="position-badge">UTG Open vs 3-bet</div>

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
                    <Feedback hand={question.hand} verdict={verdict} />
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
          <p>
            UTG-open response to a 3-bet, by group (tuple{" "}
            <code>(0.8, 2.0, 3.0)</code>):
          </p>
          <ul className="strategy-list">
            {(["raise", "call", "fold"] as Action[]).map((a) => (
              <li key={a}>
                <span className={`tag tag-${a}`}>{ACTION_SHORT[a]}</span>
                {a === "raise" && " (4-bet)"} &mdash; group
                {groupsByAction[a].length > 1 ? "s " : " "}
                {groupsByAction[a].map(formatGroup).join(", ")}
              </li>
            ))}
          </ul>
          <p className="strategy-note">
            A hand counts as correct only if <strong>both</strong> the group and
            the response are right. Press <kbd>Enter</kbd> to submit and to
            advance.
          </p>
        </div>
      </details>
    </div>
  );
}
