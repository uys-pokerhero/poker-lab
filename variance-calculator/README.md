# Poker Variance Calculator

A client-side poker variance calculator widget for cash games (NLHE). Computes expected profit, risk of ruin, and displays a fan chart showing the range of likely outcomes over a given number of hands.

## Quick Start

```bash
cd variance-calculator
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Build for Production

```bash
npm run build
```

Produces `dist/variance-widget.js` and `dist/variance-widget.css`.

## Embed in Squarespace / Static Site

```html
<div id="pvh-variance"></div>
<link rel="stylesheet" href="https://yourdomain.github.io/poker-lab/variance-widget.css" />
<script src="https://yourdomain.github.io/poker-lab/variance-widget.js"></script>
```

See `public/embed-example.html` for a full example.

## Tests

```bash
npm test
```

Runs unit tests for all core math modules (normal distribution, profit, risk of ruin, fan chart grid).

## Tech Stack

- TypeScript + React 18
- Vite (dev server + bundler)
- Raw SVG for the fan chart (no charting library)
- vitest for unit tests
- Hand-rolled math utilities (no external math libraries)
