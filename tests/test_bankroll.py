import math

import pytest

from pokerlab.bankroll import (
    BankrollModel,
    bb100_to_per_hand,
    estimate_risk_of_ruin_mc,
    risk_of_ruin_brownian,
)


def test_bb100_to_per_hand_convention() -> None:
    mu, sigma = bb100_to_per_hand(winrate_bb100=5.0, sd_bb100=80.0)
    assert mu == pytest.approx(0.05)
    assert sigma == pytest.approx(8.0)


def test_risk_of_ruin_brownian_basic_sanity() -> None:
    # Positive drift => probability strictly between 0 and 1.
    p = risk_of_ruin_brownian(
        winrate_bb100=5.0,
        sd_bb100=80.0,
        starting_bankroll_bb=10_000.0,
        ruin_threshold_bb=0.0,
    )
    assert 0.0 < p < 1.0


def test_risk_of_ruin_brownian_zero_volatility() -> None:
    assert (
        risk_of_ruin_brownian(
            winrate_bb100=1.0,
            sd_bb100=0.0,
            starting_bankroll_bb=100.0,
        )
        == 0.0
    )
    assert (
        risk_of_ruin_brownian(
            winrate_bb100=0.0,
            sd_bb100=0.0,
            starting_bankroll_bb=100.0,
        )
        == 1.0
    )


def test_risk_of_ruin_brownian_matches_formula() -> None:
    # Explicitly validate the documented formula for one scenario.
    winrate_bb100 = 5.0
    sd_bb100 = 80.0
    starting_bankroll_bb = 2_000.0
    ruin_threshold_bb = 0.0

    mu, sigma = bb100_to_per_hand(winrate_bb100, sd_bb100)
    x = starting_bankroll_bb - ruin_threshold_bb
    expected = math.exp(-2.0 * mu * x / (sigma * sigma))

    actual = risk_of_ruin_brownian(
        winrate_bb100=winrate_bb100,
        sd_bb100=sd_bb100,
        starting_bankroll_bb=starting_bankroll_bb,
        ruin_threshold_bb=ruin_threshold_bb,
    )
    assert actual == pytest.approx(expected)


def test_mc_estimate_is_deterministic_with_seed() -> None:
    model = BankrollModel(
        winrate_bb100=2.0,
        sd_bb100=80.0,
        hands=10_000,
        starting_bankroll_bb=2_000.0,
        ruin_threshold_bb=0.0,
        block_size=100,
    )

    a = estimate_risk_of_ruin_mc(model, trials=2000, seed=123)
    b = estimate_risk_of_ruin_mc(model, trials=2000, seed=123)
    assert a == b

