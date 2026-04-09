import "./styles.css";
import { TreasureMap } from "./components/TreasureMap";
import { locations } from "../data/locations";

export function App() {
  return (
    <div className="pvh-hero-map-root">
      <h1 className="map-title">The Poker Hero's Quest</h1>
      <p className="map-subtitle">
        Chart your course through the essential skills of poker mastery
      </p>
      <TreasureMap />
      <nav className="map-nav-fallback" aria-label="Poker topics">
        <h2 className="map-nav-fallback-heading">Explore All Topics</h2>
        <ul className="map-nav-fallback-list">
          {locations.map((loc) => (
            <li key={loc.id} className="map-nav-fallback-item">
              <a href={loc.url} className="map-nav-fallback-link">
                <span className="map-nav-fallback-name">{loc.name}</span>
                <span className="map-nav-fallback-desc">{loc.description}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
