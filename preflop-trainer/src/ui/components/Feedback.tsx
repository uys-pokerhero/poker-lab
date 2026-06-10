import { formatGroup, type HandClass } from "../../core/hands";
import { ACTION_LABEL, explainAction, type Scenario } from "../../core/scenarios";
import type { Verdict } from "../../core/game";

interface FeedbackProps {
  scenario: Scenario;
  hand: HandClass;
  verdict: Verdict;
}

const HAND_SHAPE: Record<HandClass["type"], string> = {
  pair: "pocket pair",
  suited: "suited",
  offsuit: "offsuit",
};

export function Feedback({ scenario, hand, verdict }: FeedbackProps) {
  // The action is what's scored, so the headline follows it.
  const headline = verdict.win ? "Correct!" : "Not quite";

  return (
    <div className={`feedback ${verdict.win ? "win" : "loss"}`}>
      <div className="feedback-headline">{headline}</div>

      <ul className="feedback-lines">
        <li className={verdict.actionOk ? "ok" : "bad"}>
          <span className="feedback-mark">{verdict.actionOk ? "✓" : "✗"}</span>
          Play: <strong>{ACTION_LABEL[verdict.correctAction]}</strong>
        </li>
      </ul>

      <p className={`feedback-group${verdict.groupOk ? " ok" : ""}`}>
        {verdict.groupOk ? (
          <>
            ✓ Group <strong>{formatGroup(verdict.correctGroup)}</strong> &mdash;
            nice read.
          </>
        ) : (
          <>
            Group was <strong>{formatGroup(verdict.correctGroup)}</strong>{" "}
            &mdash; just a self-check, not scored.
          </>
        )}
      </p>

      <p className="feedback-explain">
        <strong>{hand.code}</strong> ({HAND_SHAPE[hand.type]}) is in group{" "}
        <strong>{formatGroup(verdict.correctGroup)}</strong>, so in{" "}
        <strong>{scenario.label}</strong> you{" "}
        {explainAction(scenario, verdict.correctAction)}.
      </p>
    </div>
  );
}
