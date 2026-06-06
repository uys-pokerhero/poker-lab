import { SUIT_SYMBOL, isRedSuit, type Card } from "../../core/deck";

interface PlayingCardProps {
  card: Card;
}

/** A single rendered playing card (white face, red/dark pips). */
export function PlayingCard({ card }: PlayingCardProps) {
  const symbol = SUIT_SYMBOL[card.suit];
  const colorClass = isRedSuit(card.suit) ? "red" : "dark";
  const rankLabel = card.rank === "T" ? "10" : card.rank;

  return (
    <div className={`card ${colorClass}`} aria-label={`${rankLabel} of ${card.suit}`}>
      <span className="card-corner top">
        <span className="card-rank">{rankLabel}</span>
        <span className="card-suit-small">{symbol}</span>
      </span>
      <span className="card-suit-big">{symbol}</span>
      <span className="card-corner bottom">
        <span className="card-rank">{rankLabel}</span>
        <span className="card-suit-small">{symbol}</span>
      </span>
    </div>
  );
}
