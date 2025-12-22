import os
import subprocess
import sys

import pytest


@pytest.mark.parametrize(
    "args",
    [
        [
            sys.executable,
            "-m",
            "pokerlab",
            "bankroll",
            "eventual",
            "--winrate-bb100",
            "5",
            "--sd-bb100",
            "80",
            "--starting-bankroll-bb",
            "1000",
        ],
        [
            sys.executable,
            "-m",
            "pokerlab",
            "bankroll",
            "simulate",
            "--winrate-bb100",
            "5",
            "--sd-bb100",
            "80",
            "--hands",
            "10",
            "--starting-bankroll-bb",
            "1000",
            "--trials",
            "5",
            "--seed",
            "123",
            "--block-size",
            "10",
        ],
    ],
)
def test_bankroll_cli_commands(args: list[str]) -> None:
    env = dict(os.environ)
    env["PYTHONPATH"] = os.pathsep.join(
        [
            os.path.join(os.path.dirname(__file__), "..", "src"),
            env.get("PYTHONPATH", ""),
        ]
    )

    result = subprocess.run(args, env=env, capture_output=True, text=True)
    assert result.returncode == 0, (
        f"Return code {result.returncode}\n"
        f"STDOUT:\n{result.stdout}\n"
        f"STDERR:\n{result.stderr}"
    )
