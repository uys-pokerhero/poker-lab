import { successRate, type Stats } from "../../core/game";

interface ScorePanelProps {
  stats: Stats;
  onReset: () => void;
}

export function ScorePanel({ stats, onReset }: ScorePanelProps) {
  const rate = successRate(stats);
  const ratePct = stats.played === 0 ? "—" : `${(rate * 100).toFixed(0)}%`;

  return (
    <div className="score-panel">
      <div className="score-cards">
        <div className="score-card">
          <div className="score-label">Hands</div>
          <div className="score-value">{stats.played}</div>
        </div>
        <div className="score-card">
          <div className="score-label">Success</div>
          <div className="score-value accent">{ratePct}</div>
        </div>
        <div className="score-card">
          <div className="score-label">Streak</div>
          <div className="score-value">{stats.streak}</div>
        </div>
        <div className="score-card">
          <div className="score-label">Best</div>
          <div className="score-value">{stats.bestStreak}</div>
        </div>
      </div>
      <button
        type="button"
        className="reset-btn"
        onClick={onReset}
        disabled={stats.played === 0}
      >
        Reset
      </button>
    </div>
  );
}
