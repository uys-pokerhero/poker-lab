import "./styles.css";
import { locations } from "../data/locations";

export function App() {
  return (
    <div className="pvh-hero-map-root">
      <header className="site-header">
        <h1 className="site-title">Poker Lab</h1>
        <p className="site-subtitle">
          Tools and study guides for the focused poker player
        </p>
      </header>

      <nav className="topic-grid" aria-label="Poker topics">
        {locations.map((loc) => {
          const Tag = loc.available ? "a" : "div";
          return (
            <Tag
              key={loc.id}
              className={`topic-card${loc.available ? "" : " topic-card--disabled"}`}
              {...(loc.available ? { href: loc.url } : {})}
              aria-label={
                loc.available
                  ? loc.name
                  : `${loc.name} — coming soon`
              }
            >
              <span className="topic-icon" aria-hidden="true">
                {loc.icon}
              </span>
              <div className="topic-content">
                <span className="topic-name">{loc.name}</span>
                <span className="topic-desc">{loc.description}</span>
              </div>
              {!loc.available && (
                <span className="topic-badge">Soon</span>
              )}
              {loc.available && (
                <span className="topic-arrow" aria-hidden="true">
                  &rarr;
                </span>
              )}
            </Tag>
          );
        })}
      </nav>
    </div>
  );
}
