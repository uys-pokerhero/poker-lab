import { formatGroup, type HandClass } from "../../core/hands";
import { ACTION_SHORT } from "../../core/strategy";
import type { Verdict } from "../../core/game";

interface FeedbackProps {
  hand: HandClass;
  verdict: Verdict;
}

const HAND_SHAPE: Record<HandClass["type"], string> = {
  pair: "pocket pair",
  suited: "suited",
  offsuit: "offsuit",
};

export function Feedback({ hand, verdict }: FeedbackProps) {
  const headline = verdict.win ? "Correct!" : "Not quite";

  return (
    <div className={`feedback ${verdict.win ? "win" : "loss"}`}>
      <div className="feedback-headline">{headline}</div>

      <ul className="feedback-lines">
        <li className={verdict.groupOk ? "ok" : "bad"}>
          <span className="feedback-mark">{verdict.groupOk ? "✓" : "✗"}</span>
          Group: <strong>{formatGroup(verdict.correctGroup)}</strong>
        </li>
        <li className={verdict.actionOk ? "ok" : "bad"}>
          <span className="feedback-mark">{verdict.actionOk ? "✓" : "✗"}</span>
          Response: <strong>{ACTION_SHORT[verdict.correctAction]}</strong> to a 3-bet
        </li>
      </ul>

      <p className="feedback-explain">
        <strong>{hand.code}</strong> ({HAND_SHAPE[hand.type]}) is in group{" "}
        <strong>{formatGroup(verdict.correctGroup)}</strong>, so UTG{" "}
        {verdict.correctAction === "fold"
          ? "folds to a 3-bet."
          : verdict.correctAction === "call"
            ? "calls a 3-bet."
            : "4-bets (raises) against a 3-bet."}
      </p>
    </div>
  );
}
