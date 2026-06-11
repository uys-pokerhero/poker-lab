# Preflop Trainer

A client-side drill for memorizing preflop ranges. Each round draws a **random
scenario** and deals two hole cards (weighted by combinations) from the full
169-hand matrix. The player identifies the hand's **group** and the correct
**play**. Scoring is on the play only — the group is an unscored self-check.
The widget tracks hands played, success rate, and streak.

## Scenarios

A random scenario is drawn each hand from these nine:

| # | Scenario | Spot |
|---|----------|------|
| 1 | **EP OPEN** | Opening from early position |
| 2 | **MP OPEN** | Opening from middle position |
| 3 | **CO OPEN** | Opening from the cutoff |
| 4 | **BTN OPEN** | Opening from the button |
| 5 | **SB OPEN** | Opening from the small blind (raise or limp) |
| 6 | **BB vs SB LIMP** | Big blind facing a small-blind limp |
| 7 | **EARLY 3-BET** | Facing an early-position open |
| 8 | **LATE 3-BET** | Facing a late-position open |
| 9 | **BB 3-BET** | In the big blind, facing an open |

Hands are sampled from the whole 169-hand universe (groups 0.8 – 6.0), so weak
hands outside a given range show up too — the correct play there is just to fold
(or, in the blinds, to limp or check).

### Strategy matrix

| Grp | EP | MP | CO | BTN | SB | BBvLimp | Early3B | Late3B | BB3B |
|----|----|----|----|----|----|---------|---------|--------|------|
|0.8 | R | R | R | R | R | Rz | 3B | 3B | 3B |
|1.0 | C | R | R | R | R | Rz | 3B | 3B | 3B |
|1.5 | C | C | R | R | C | Rz | 3B | 3B | 3B |
|2.0 | C | C | C | C | C | Rz | Ca | 3B | 3B |
|2.5 | OF | C | C | C | OF | Rz | Ca | Ca | Ca |
|3.0 | OF | OF | C | C | OF | Rz | · | Ca | Ca |
|3.5 | · | OF | OF | C | LC | Rz | · | · | Ca |
|4.0 | · | · | OF | C | LC | Rz | · | · | Ca |
|5.0 | · | · | · | OF | LF | Ck | · | · | Ca |
|6.0 | · | · | · | · | · | Ck | · | · | · |

**Legend** — `R`=Open & Raise · `C`=Open & Call · `OF`=Open & Fold · `·`=Fold ·
`LC`=Limp & Call · `LF`=Limp & Fold · `3B`=3-Bet · `Ca`=Call · `Rz`=Raise ·
`Ck`=Check

In the open scenarios, **Open & Fold** means open-raise then fold to a 3-bet,
while **Fold** means don't enter the pot. A hand is scored correct when the
**play** matches; the group does not affect the score.

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

Covers the hand data (169 hands, 1326 combos, group assignments), the full
per-scenario strategy matrix, random scenario selection, weighted sampling, card
dealing, and game scoring.

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
