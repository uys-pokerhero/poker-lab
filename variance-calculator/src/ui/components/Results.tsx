interface ResultsProps {
  expectedProfit: number;
  bustProbN: number;
  eventualRuin: number;
  winrate: number;
  sd: number;
  volume: number;
  bankrollBb: number;
  buyinSize: number;
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

function fmtPct(p: number): string {
  if (p <= 0.0001) return "<0.01%";
  if (p >= 0.9999) return ">99.99%";
  return (p * 100).toFixed(2) + "%";
}

function fmtBb(bb: number): string {
  const sign = bb >= 0 ? "+" : "";
  return sign + Math.round(bb).toLocaleString() + " bb";
}

interface Warning {
  key: string;
  message: string;
}

function getWarnings(wr: number, sd: number, volume: number): Warning[] {
  const warnings: Warning[] = [];
  if (volume < 2000) {
    warnings.push({
      key: "small-sample",
      message:
        "Small sample \u2014 your estimated winrate is likely noisy. Treat these results as illustrative.",
    });
  }
  if (wr > 15) {
    warnings.push({
      key: "high-wr",
      message:
        "Very high winrate entered \u2014 double-check your estimate. Selection bias is common.",
    });
  }
  if (sd < 30 || sd > 150) {
    warnings.push({
      key: "unusual-sd",
      message:
        "Unusual SD entered. Cash game SD typically falls between 60\u2013120 bb/100.",
    });
  }
  if (wr <= 0) {
    warnings.push({
      key: "neg-wr",
      message:
        "Non-positive winrate \u2014 eventual ruin is effectively certain if you keep playing.",
    });
  }
  return warnings;
}

export function Results({
  expectedProfit,
  bustProbN,
  eventualRuin,
  winrate,
  sd,
  volume,
  buyinSize,
}: ResultsProps) {
  const warnings = getWarnings(winrate, sd, volume);
  const profitBuyins = fmt(expectedProfit / buyinSize, 1);

  return (
    <div className="results-panel">
      {warnings.length > 0 && (
        <div className="warnings">
          {warnings.map((w) => (
            <div key={w.key} className="warning">
              {w.message}
            </div>
          ))}
        </div>
      )}

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Expected Profit</div>
          <div className={`stat-value ${expectedProfit >= 0 ? "positive" : "negative"}`}>
            {fmtBb(expectedProfit)}
          </div>
          <div className="stat-sub">{profitBuyins} buy-ins</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Bust in {(volume / 1000).toFixed(0)}k hands
          </div>
          <div className={`stat-value ${bustProbN > 0.1 ? "negative" : "positive"}`}>
            {fmtPct(bustProbN)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Eventual Ruin</div>
          {winrate > 0 ? (
            <div className={`stat-value ${eventualRuin > 0.5 ? "negative" : "positive"}`}>
              {fmtPct(eventualRuin)}
            </div>
          ) : (
            <div className="stat-value negative stat-value-small">
              ~100% if you play forever with a non-positive edge
            </div>
          )}
        </div>
      </div>

      <div className="how-to-use">
        <h3>How to Use</h3>
        <p>
          Enter your bankroll, winrate (bb/100), standard deviation (bb/100),
          and the number of hands you plan to play. The calculator estimates a
          range of likely outcomes and the probability of going bust. Results
          assume your edge and volatility stay constant &mdash; use it to
          understand variance, not to predict exact results.
        </p>
      </div>
    </div>
  );
}
