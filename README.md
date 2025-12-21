# Poker Lab

This repo is my “Poker Lab” for 2026: small tools and experiments to study and play better.

## Goals

- Become a winning cash + tournament player (target: **≥ +5 bb/hour**)
- Keep a stable bankroll and a balanced life
- Build simple, practical study tooling along the way

## What’s in here (so far)

### Bankroll / risk-of-ruin (Python)

- **Eventual risk-of-ruin** (infinite horizon): Brownian-motion approximation
- **Finite-horizon risk-of-ruin**: Monte Carlo simulation over a fixed number of hands

Code lives in `src/pokerlab/bankroll.py`.

## Quickstart (Python)

Create a virtual environment and install:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -U pip
python3 -m pip install -e ".[dev]"
```

Run tests:

```bash
python3 -m pytest
```

Run the CLI:

```bash
# Eventual (infinite-horizon) approximation
python3 -m pokerlab bankroll eventual --winrate-bb100 5 --sd-bb100 80 --starting-bankroll-bb 10000

# Finite-horizon Monte Carlo estimate
python3 -m pokerlab bankroll simulate --winrate-bb100 5 --sd-bb100 80 --hands 200000 --starting-bankroll-bb 10000 --trials 5000
```

## Repo structure

- `src/pokerlab/`: Python package code (tools live here)
- `tests/`: pytest tests

## Next tool ideas

- Hand history parsing (PokerStars / GG / etc.)
- Simple EV calculators
- Preflop clustering experiments (PCA + clustering)
- Training / quiz apps (likely a small React app later)
