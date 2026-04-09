import "./styles.css";
import { TreasureMap } from "./components/TreasureMap";

export function App() {
  return (
    <div className="pvh-hero-map-root">
      <h1 className="map-title">The Poker Hero's Quest</h1>
      <p className="map-subtitle">
        Chart your course through the essential skills of poker mastery
      </p>
      <TreasureMap />
    </div>
  );
}
