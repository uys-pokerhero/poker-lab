# Preflop Trainer

A client-side drill for memorizing a UTG opening range. Each round deals two
hole cards drawn (weighted by combinations) from the hands UTG opens with. You
identify the **group** the hand belongs to and the correct **response to a
3-bet** (open & raise / call / fold). The widget tracks hands played, success
rate, and streak.

## Scenario (prototype)

- **Position:** UTG open, facing a 3-bet.
- **Hands:** only the hands UTG opens with, across groups 0.8, 1.0, 1.5, 2.0,
  2.5 and 3.0. Hands are sampled in proportion to their combination count.
- **Strategy tuple `(0.8, 2.0, 3.0)`:**
  - group `0.8` &rarr; raise (4-bet)
  - groups `1.0` / `1.5` / `2.0` &rarr; call
  - groups `2.5` / `3.0` &rarr; fold
- A hand is scored correct only if **both** the group and the response match.

Other positions and scenarios are intentionally out of scope for this version.

## Quick Start

```bash
cd preflop-trainer
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Build for Production

```bash
npm run build
```

Produces `dist/preflop-trainer-widget.js` and `dist/preflop-trainer-widget.css`.

## Embed in Squarespace / Static Site

```html
<div id="pvh-preflop-trainer"></div>
<link rel="stylesheet" href="https://yourdomain.github.io/poker-lab/preflop-trainer-widget.css" />
<script src="https://yourdomain.github.io/poker-lab/preflop-trainer-widget.js"></script>
```

See `public/embed-example.html` for a full example.

## Tests

```bash
npm test
```

Covers the hand data (counts, weights, group assignments), the strategy
mapping, weighted sampling, card dealing, and game scoring.

## Tech Stack

- TypeScript + React 18
- Vite (dev server + bundler)
- vitest for unit tests
- No external game/poker libraries — hand data and logic are hand-rolled

## Adding hands or groups

Hand data lives in `src/core/hands.ts` (the `RAW` table). The 3-bet strategy
lives in `src/core/strategy.ts` (`DEFAULT_STRATEGY`). Both are covered by tests
in `src/tests/`.
