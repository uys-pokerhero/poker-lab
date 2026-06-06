# Preflop Trainer

A client-side drill for memorizing preflop ranges. Each round deals two hole
cards drawn (weighted by combinations) from the full hand universe, and the
player identifies the hand's **group** and the correct **play** for the current
scenario. The widget tracks hands played, success rate, and streak.

## Scenarios

The drill rotates through three scenarios in a fixed order, repeating:

1. **EP OPEN** — first to act from early position.
2. **MP OPEN** — first to act from middle position.
3. **EARLY 3-BET** — facing an early-position open.

Hands are sampled from the whole universe (groups 0.8 – 4.0) in every scenario,
so weak hands that fall outside an opening range show up too — the correct play
there is just to fold.

### Strategies

Open scenarios use a tuple `(raiseMax, callMax, foldMax)`; the 3-bet scenario
uses `(threeBetMax, callMax)`:

| Group | EP OPEN `(0.8, 2.0, 3.0)` | MP OPEN `(1.0, 2.5, 3.5)` | EARLY 3-BET `(1.5, 2.5)` |
|------|------|------|------|
| 0.8 | Open & Raise | Open & Raise | 3-Bet |
| 1.0 | Open & Call | Open & Raise | 3-Bet |
| 1.5 | Open & Call | Open & Call | 3-Bet |
| 2.0 | Open & Call | Open & Call | Call |
| 2.5 | Open & Fold | Open & Call | Call |
| 3.0 | Open & Fold | Open & Fold | Fold |
| 3.5 | Fold | Open & Fold | Fold |
| 4.0 | Fold | Fold | Fold |

In the open scenarios, **Open & Fold** means open-raise then fold to a 3-bet,
while **Fold** means don't open at all. A hand is scored correct only if
**both** the group and the play match.

## Quick Start

```bash
cd preflop-trainer
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173/poker-lab/`).

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

Covers the hand data (74 hands, 442 combos, group assignments), the per-scenario
strategy matrix and rotation, weighted sampling, card dealing, and game scoring.

## Tech Stack

- TypeScript + React 18
- Vite (dev server + bundler)
- vitest for unit tests
- No external game/poker libraries — hand data and logic are hand-rolled

## Adding hands, groups, or scenarios

- **Hands** live in `src/core/hands.ts` (the `RAW` table, kept in source order).
- **Scenarios and strategies** live in `src/core/scenarios.ts` (`SCENARIOS`, with
  each scenario's threshold tuple and action menu).

Both are covered by tests in `src/tests/`.
