from __future__ import annotations

import argparse

from pokerlab.bankroll import BankrollModel, estimate_risk_of_ruin_mc, risk_of_ruin_brownian


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="pokerlab", description="Poker Lab CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    bankroll = sub.add_parser("bankroll", help="Bankroll and risk-of-ruin tools")
    bankroll_sub = bankroll.add_subparsers(dest="bankroll_command", required=True)

    simulate = bankroll_sub.add_parser(
        "simulate",
        help="Estimate risk-of-ruin over a fixed hand horizon",
    )
    simulate.add_argument("--winrate-bb100", type=float, required=True)
    simulate.add_argument("--sd-bb100", type=float, required=True)
    simulate.add_argument("--hands", type=int, required=True)
    simulate.add_argument("--starting-bankroll-bb", type=float, required=True)
    simulate.add_argument("--ruin-threshold-bb", type=float, default=0.0)
    simulate.add_argument("--trials", type=int, default=5000)
    simulate.add_argument("--seed", type=int, default=0)
    simulate.add_argument(
        "--block-size",
        type=int,
        default=100,
        help="Hands per step (speed vs accuracy).",
    )

    eventual = bankroll_sub.add_parser(
        "eventual",
        help="Approximate eventual risk-of-ruin (infinite horizon)",
    )
    eventual.add_argument("--winrate-bb100", type=float, required=True)
    eventual.add_argument("--sd-bb100", type=float, required=True)
    eventual.add_argument("--starting-bankroll-bb", type=float, required=True)
    eventual.add_argument("--ruin-threshold-bb", type=float, default=0.0)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "bankroll" and args.bankroll_command == "eventual":
        p = risk_of_ruin_brownian(
            winrate_bb100=args.winrate_bb100,
            sd_bb100=args.sd_bb100,
            starting_bankroll_bb=args.starting_bankroll_bb,
            ruin_threshold_bb=args.ruin_threshold_bb,
        )
        print(f"Eventual risk-of-ruin (Brownian approx): {p:.6%} (p={p:.8g})")
        return 0

    if args.command == "bankroll" and args.bankroll_command == "simulate":
        model = BankrollModel(
            winrate_bb100=args.winrate_bb100,
            sd_bb100=args.sd_bb100,
            hands=args.hands,
            starting_bankroll_bb=args.starting_bankroll_bb,
            ruin_threshold_bb=args.ruin_threshold_bb,
            block_size=args.block_size,
        )
        est = estimate_risk_of_ruin_mc(model, trials=args.trials, seed=args.seed)
        print(
            f"Risk-of-ruin within {model.hands:,} hands (MC): "
            f"{est.probability:.6%} (p={est.probability:.8g})"
        )
        print(f"Trials: {est.trials:,} | Ruined: {est.ruined:,}")
        return 0

    parser.error("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
