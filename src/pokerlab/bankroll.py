from __future__ import annotations

import math
import random
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BankrollModel:
    """
    A simple bankroll model for cash-game style results measured in big blinds (bb).

    Conventions (explicit, because poker stats are often ambiguous):
    - `winrate_bb100` is the expected bb won per 100 hands.
    - `sd_bb100` is the standard deviation of the *total result over 100 hands*.
      This implies per-hand standard deviation is `sd_bb100 / 10`.

    The Monte Carlo simulator uses a Gaussian approximation to hand results.
    It is meant for rough planning, not exact guarantees.
    """

    winrate_bb100: float
    sd_bb100: float
    hands: int
    starting_bankroll_bb: float
    ruin_threshold_bb: float = 0.0
    block_size: int = 100

    def __post_init__(self) -> None:
        if self.hands <= 0:
            raise ValueError("hands must be > 0")
        if self.sd_bb100 < 0:
            raise ValueError("sd_bb100 must be >= 0")
        if self.block_size <= 0:
            raise ValueError("block_size must be > 0")
        if self.starting_bankroll_bb <= self.ruin_threshold_bb:
            raise ValueError("starting_bankroll_bb must be > ruin_threshold_bb")


@dataclass(frozen=True, slots=True)
class RuinEstimate:
    """Monte Carlo estimate of risk-of-ruin."""

    trials: int
    ruined: int

    @property
    def probability(self) -> float:
        return self.ruined / self.trials if self.trials else float("nan")


def bb100_to_per_hand(winrate_bb100: float, sd_bb100: float) -> tuple[float, float]:
    """
    Convert bb/100 mean + (total-over-100) SD to per-hand mean + per-hand SD.

    Assumes `sd_bb100` is the standard deviation of the sum of 100 hands.
    """

    mu = winrate_bb100 / 100.0
    sigma = sd_bb100 / 10.0
    return mu, sigma


def risk_of_ruin_brownian(
    *,
    winrate_bb100: float,
    sd_bb100: float,
    starting_bankroll_bb: float,
    ruin_threshold_bb: float = 0.0,
) -> float:
    """
    Approximate probability of eventually hitting the ruin threshold.

    Uses a continuous-time Brownian motion approximation for a random walk with drift.
    For drift μ > 0 and volatility σ > 0, starting at x > 0 above the ruin boundary:

        P(ruin) = exp(-2 μ x / σ²)

    Notes:
    - If μ <= 0, eventual ruin is 1 (given enough time).
    - This does *not* model finite horizons (number of hands). Use Monte Carlo for that.
    """

    if starting_bankroll_bb <= ruin_threshold_bb:
        return 1.0

    mu, sigma = bb100_to_per_hand(winrate_bb100, sd_bb100)
    if sigma == 0:
        return 0.0 if mu > 0 else 1.0
    if mu <= 0:
        return 1.0

    x = starting_bankroll_bb - ruin_threshold_bb
    return math.exp(-2.0 * mu * x / (sigma * sigma))


def estimate_risk_of_ruin_mc(
    model: BankrollModel,
    *,
    trials: int = 5_000,
    seed: int | None = 0,
) -> RuinEstimate:
    """
    Estimate the probability of hitting `ruin_threshold_bb` within `hands`.

    Simulation details:
    - Results are simulated in blocks to keep runtime reasonable without NumPy.
    - Each block of size `n` uses Normal(μ*n, σ*sqrt(n)) increments.
    - Ruin is only checked at the end of each block (a mild approximation).
    """

    if trials <= 0:
        raise ValueError("trials must be > 0")

    mu, sigma = bb100_to_per_hand(model.winrate_bb100, model.sd_bb100)
    rng = random.Random(seed)

    ruined = 0
    total_hands = model.hands
    block = min(model.block_size, total_hands)

    for _ in range(trials):
        bankroll = model.starting_bankroll_bb
        remaining = total_hands

        while remaining > 0:
            n = block if remaining >= block else remaining
            remaining -= n

            delta = rng.gauss(mu * n, sigma * math.sqrt(n))
            bankroll += delta

            if bankroll <= model.ruin_threshold_bb:
                ruined += 1
                break

    return RuinEstimate(trials=trials, ruined=ruined)
