import { useState, useMemo } from "react";
import { Inputs, type InputValues } from "./components/Inputs";
import { Results } from "./components/Results";
import { FanChart } from "./components/FanChart";
import { profitMean } from "../core/profit";
import { rorAfterHands, rorEventually } from "../core/ror";
import { generateFanChartData } from "../core/grid";
import { buyinsToBb } from "../core/units";
import "./styles.css";

const DEFAULTS: InputValues = {
  unit: "bb",
  bankroll: 2000,
  buyinSize: 100,
  winrate: 3,
  sd: 80,
  volume: 50_000,
};

export function App() {
  const [inputs, setInputs] = useState<InputValues>(DEFAULTS);

  const bankrollBb = useMemo(
    () =>
      inputs.unit === "buyins"
        ? buyinsToBb(inputs.bankroll, inputs.buyinSize)
        : inputs.bankroll,
    [inputs.unit, inputs.bankroll, inputs.buyinSize]
  );

  const expectedProfit = useMemo(
    () => profitMean(inputs.winrate, inputs.volume),
    [inputs.winrate, inputs.volume]
  );

  const bustProbN = useMemo(
    () => rorAfterHands(bankrollBb, inputs.winrate, inputs.sd, inputs.volume),
    [bankrollBb, inputs.winrate, inputs.sd, inputs.volume]
  );

  const eventualRuin = useMemo(
    () => rorEventually(bankrollBb, inputs.winrate, inputs.sd),
    [bankrollBb, inputs.winrate, inputs.sd]
  );

  const fanData = useMemo(
    () =>
      generateFanChartData(
        inputs.winrate,
        inputs.sd,
        inputs.volume,
        bankrollBb
      ),
    [inputs.winrate, inputs.sd, inputs.volume, bankrollBb]
  );

  return (
    <div className="pvh-variance-root">
      <nav className="back-nav">
        <a href="/" className="back-link">&larr; Poker Lab</a>
      </nav>
      <h1 className="page-title">Variance Calculator</h1>
      <p className="page-subtitle">
        Estimate the range of outcomes for your poker sessions
      </p>
      <div className="layout">
        <aside className="layout-inputs">
          <Inputs values={inputs} onChange={setInputs} />
        </aside>
        <main className="layout-results">
          <Results
            expectedProfit={expectedProfit}
            bustProbN={bustProbN}
            eventualRuin={eventualRuin}
            winrate={inputs.winrate}
            sd={inputs.sd}
            volume={inputs.volume}
            bankrollBb={bankrollBb}
            buyinSize={inputs.buyinSize}
          />
          <FanChart data={fanData} bankrollBb={bankrollBb} />

          <div className="disclosures">
            <h3>Disclosures</h3>
            <ul>
              <li>
                <strong>Winrate uncertainty:</strong> Most players' winrate
                estimate is noisy due to selection bias and small samples.
              </li>
              <li>
                <strong>Rake impact:</strong> Rake and rakeback differences
                materially change effective winrate.
              </li>
              <li>
                <strong>Non-stationarity:</strong> Games change over time;
                moving up in stakes changes both winrate and SD.
              </li>
              <li>
                <strong>Tilt / quit behavior:</strong> Stop-losses, quitting
                when stuck, and playing longer when winning all distort real
                outcomes.
              </li>
              <li>
                <strong>Table selection:</strong> Winrate is not a fixed
                constant &mdash; it's partly skill and partly a selection
                process.
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
