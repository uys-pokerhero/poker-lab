import { normCdf } from "./normal";

/**
 * Closed-form probability of going bust within N hands.
 *
 * P(bust | N) = Phi((-x0 - a*t) / (b*sqrt(t)))
 * where x0 = bankrollBb, t = N/100, a = wr, b = sd
 */
export function rorAfterHands(
  bankrollBb: number,
  wr: number,
  sd: number,
  N: number
): number {
  if (N <= 0) return 0;
  if (bankrollBb <= 0) return 1;
  if (sd <= 0) return wr >= 0 ? 0 : 1;

  const t = N / 100;
  const z = (-bankrollBb - wr * t) / (sd * Math.sqrt(t));
  return normCdf(z);
}

/**
 * Eventual risk of ruin (infinite horizon).
 * Only meaningful when wr > 0: exp(-2 * wr * bankrollBb / sd^2)
 * Returns 1 when wr <= 0.
 */
export function rorEventually(
  bankrollBb: number,
  wr: number,
  sd: number
): number {
  if (bankrollBb <= 0) return 1;
  if (sd <= 0) return wr >= 0 ? 0 : 1;
  if (wr <= 0) return 1;

  return Math.exp((-2 * wr * bankrollBb) / (sd * sd));
}
