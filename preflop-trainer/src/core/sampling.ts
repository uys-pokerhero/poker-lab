/**
 * Pick one item from a list with probability proportional to its weight.
 *
 * The RNG is injectable so the behaviour is deterministic in tests.
 */
export function weightedPick<T>(
  items: readonly T[],
  weight: (item: T) => number,
  rng: () => number = Math.random
): T {
  if (items.length === 0) {
    throw new Error("weightedPick: cannot pick from an empty list");
  }

  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let threshold = rng() * total;

  for (const item of items) {
    threshold -= weight(item);
    if (threshold < 0) return item;
  }

  // Floating-point fallback: return the last item.
  return items[items.length - 1];
}
