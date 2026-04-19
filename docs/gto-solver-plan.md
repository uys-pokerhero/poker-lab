# GTO Solver Plan — 6-max NLHE Cash, 100bb

A concrete, staged plan for building a solver that produces near-Nash
strategies for 6-max No-Limit Hold'em cash with 100bb effective stacks. The
goal is to make the problem tractable by splitting it into a well-understood
postflop subgame solver (Track A) and a later abstracted full-game solver
(Track B), and to be honest about what is achievable on commodity hardware.

---

## 0. Scope, targets, non-goals

**In scope**

- 6-max NLHE, 100bb effective, standard cash rake model (optional later).
- Two deliverables:
  - **Track A — Postflop subgame solver** (PioSOLVER-class). User supplies
    both players' starting ranges, pot, stack, bet tree; solver returns a
    strategy per node with an exploitability bound.
  - **Track B — Abstracted full-game solver** (Pluribus-class). Self-play
    produces a blueprint preflop strategy and real-time postflop refinement.
- Reproducible benchmarks against public solver outputs (small boards,
  toy games, Kuhn/Leduc as correctness oracles).

**Out of scope (initially)**

- Multi-street rake-aware solving for full 6-max preflop — only approximated.
- Exploitative modeling against specific opponents.
- Live solve during play with sub-second latency.

**Targets**

| Track | Milestone | Metric |
|-------|-----------|--------|
| A | Turn subgame solve, 2 sizings, 169×169 ranges | ε ≤ 0.5% pot in < 5 min on 16-core CPU |
| A | Flop subgame solve, 3 sizings | ε ≤ 1% pot in < 2 h, 64 GB RAM |
| B | 6-max blueprint | Exploitability estimate via local best-response on sampled infosets; qualitative match to published 6-max preflop charts |
| B | Head-to-head vs baselines | +bb/100 vs a rule-based bot and a slumbot-style agent over ≥ 1M hands |

We verify correctness on Kuhn and Leduc poker (closed-form Nash known) before
trusting any NLHE number.

---

## 1. Why this is hard (complexity sanity check)

- Full 6-player NLHE with continuous bet sizing has an effectively infinite
  game tree. Even a coarse abstraction has ~10¹²–10¹⁴ information sets.
- Pluribus (Brown & Sandholm 2019) solved 6-max by combining Monte Carlo CFR
  with aggressive card + action abstraction and real-time subgame re-solving.
  Blueprint training: ~8 days on a 64-core server, ~512 GB RAM. That is the
  reference cost for Track B at "research-quality" not "commercial".
- PioSOLVER-class postflop solves are tractable: a single flop with 2–3
  sizings per street and 1326×1326 hand combos resolves in minutes to hours
  on a workstation with CFR+ and good vectorisation.

Implication: Track A is a real engineering project with predictable cost.
Track B is a research project where we should expect to ship a weaker
blueprint than Pluribus and iterate.

---

## 2. Architecture

```
                 +-------------------------+
                 |  CLI / Notebook / UI    |
                 +-----------+-------------+
                             |
                 +-----------v-------------+
                 |   Solver orchestrator   |   (Python)
                 |  - job config           |
                 |  - checkpointing        |
                 |  - convergence tracking |
                 +-----------+-------------+
                             |
       +---------------------+---------------------+
       |                                           |
+------v-------+                          +--------v--------+
| Track A      |                          | Track B         |
| Postflop     |                          | Full-game MCCFR |
| CFR+ solver  |                          | + abstraction   |
+------+-------+                          +--------+--------+
       |                                           |
       +---------------------+---------------------+
                             |
                 +-----------v-------------+
                 |   Core engine (C++)     |
                 |  - hand evaluator       |
                 |  - isomorphism          |
                 |  - equity / EV          |
                 |  - game tree            |
                 |  - range / regret store |
                 +-------------------------+
```

- **Core engine**: C++20 with a thin pybind11 layer. Performance critical;
  all tight loops (regret updates, equity rollouts, tree traversal) live here.
- **Orchestrator**: Python. Owns config, logging, metrics, checkpoints, tests.
- **UI**: defer. Command-line + JSON output is enough for v1. Reuse the
  existing `hero-map` React app later if a tree viewer is wanted.

Repo layout (proposed, incremental on the current tree):

```
src/pokerlab/
  solver/
    __init__.py
    config.py            # dataclasses for solver jobs
    postflop.py          # Track A driver
    blueprint.py         # Track B driver
    abstraction.py       # card + action abstraction
    tree.py              # game tree builders
    metrics.py           # exploitability, best-response
    io.py                # checkpoint / export
engine/                    # C++ sources
  include/pokerlab/...
  src/...
  python/                # pybind11 bindings
tests/
  solver/
    test_kuhn.py
    test_leduc.py
    test_equity.py
    test_isomorphism.py
benchmarks/
  postflop/...
  blueprint/...
docs/
  gto-solver-plan.md     # this file
```

---

## 3. Core engine components

### 3.1 Hand evaluator

- 7-card evaluator, ≥ 100M evals/sec/core. Start with a reference
  implementation (OMPEval or a port of TwoPlusTwo's 123M-entry LUT), then
  write a unit-tested in-house variant.
- API: `rank7(c0..c6) -> u16`; smaller rank = better hand.

### 3.2 Card isomorphism

- Reduce 1326 preflop combos to 169 strategic classes.
- Reduce flop/turn/river boards by suit canonicalization (the four suits are
  interchangeable except for which suits our hole cards live in).
- Implementation: Waugh / Johanson style canonical suit mapping. Unit-test
  that two isomorphic boards map to identical canonical IDs and that their
  strategies are bit-identical when solved.

### 3.3 Equity / EV calculators

- Vectorised all-in equity across a pair of ranges on a given board
  (pre-enumerate the rest of the deck, use SIMD to compare ranks).
- EV rollout under a given strategy pair at a terminal node.
- These are the inner loops of CFR; they must be fast and allocation-free.

### 3.4 Range representation

- Range = vector of 1326 weights (one per hole-card combo), floats.
- Store per-node reach probabilities as separate vectors for each player.
- Removal effects (card blockers) are non-negotiable; naive approximations
  produce visibly wrong solver outputs.

### 3.5 Game tree

- Nodes: chance, decision, terminal.
- Bet sizes are chosen at tree-build time from the user's abstraction
  (Track A) or from a fixed preflop + postflop size set (Track B).
- Allow tree reuse across solves by parameterising (board, pot, stack).

### 3.6 Regret / strategy storage

- CFR+ requires per-infoset regret vectors (one float per action) and
  average-strategy accumulators.
- Memory is the constraint. For a flop solve with ~1.7k combos × ~thousands
  of nodes per street × ~6 actions, plan for 30–80 GB per solve. Use
  `float32`; consider `bfloat16` for averages once convergence is validated.
- On-disk checkpointing via memory-mapped files so solves can resume.

---

## 4. Algorithms

### 4.1 Track A: postflop CFR+

- **CFR+**: regret-matching-plus with linear averaging. Empirically the best
  choice for postflop subgames with known ranges.
- Iterate until exploitability (measured by local best-response on a sampled
  subset of infosets) is below threshold or a time budget elapses.
- Support "locked" strategies for one player (for scripted-opponent studies).
- Inputs: board, pot, effective stack, OOP range, IP range, bet-size
  abstraction per street, ante/rake config.
- Outputs: strategy tensor per node, EV per hand combo at root, per-combo
  frequencies, solver log with ε curve over time.

**Convergence diagnostic**: we implement both a cheap "MES" (mean-exploitability
surrogate: max regret / iteration) and an expensive true best-response sweep
run every N iterations.

### 4.2 Track B: MCCFR with abstraction

- **External-sampling MCCFR** on an abstracted game:
  - **Card abstraction**: bucket turn/river hands by EHS² (expected hand
    strength squared) with ~500 buckets per street initially; potential-aware
    K-means later.
  - **Action abstraction**: fixed per-street bet sizes. Preflop:
    {2.5bb, 3bb, pot, all-in}. Flop/turn/river: {33%, 75%, 150% pot, all-in}.
- **Linear CFR / Discounted CFR** to speed early convergence.
- **Real-time subgame solving**: at runtime, expand a full (un-abstracted)
  subgame from the current public state and run Track A's CFR+ on it,
  constrained by the blueprint's reach probabilities ("nested safe re-solving"
  in the Unsafe/Maxmargin family — start with Unsafe re-solve).
- **Blueprint size**: target 10–50 GB for the preflop + early-street
  strategy. Everything later is resolved on demand.

### 4.3 Correctness oracles

- **Kuhn poker**: 3-card toy game with closed-form Nash. Our solver must
  reproduce it to machine precision.
- **Leduc poker**: 6-card 2-street game with published exploitability
  curves. Our CFR+ should hit ε < 0.001 per-hand in < 1 s.
- **Tiny NLHE**: 2-card 1-street NLHE with fixed range, hand-verified EVs.
- Every change to the engine runs these in CI before any NLHE benchmark.

---

## 5. Milestones

Order matters; each milestone delivers something runnable.

| # | Milestone | Exit criteria |
|---|-----------|---------------|
| M0 | Repo scaffolding: `pokerlab.solver` package, C++ build via scikit-build-core, CI running Kuhn unit test | `pytest` green; wheels build on Linux |
| M1 | Hand evaluator + isomorphism + equity calc | ≥ 100M rank7/s/core; isomorphism fuzz tests pass; all-in equity matches a reference enumerator to 1e-9 |
| M2 | Kuhn + Leduc CFR+ solver | ε < 1e-3 on both; closed-form Nash match |
| M3 | Track A v1: single-street (river) NLHE subgame | Benchmarks vs hand-computed EVs; UI-free CLI job config |
| M4 | Track A v2: turn + river | Solves published benchmark spots to ε ≤ 0.5% pot within time budget |
| M5 | Track A v3: full flop-to-river with configurable sizings, checkpointing, JSON export | Matches published flop solutions qualitatively on 10 test boards |
| M6 | Track B: abstraction builders + MCCFR for HU NLHE blueprint (not 6-max yet) | Blueprint beats always-call and a rule-based bot over ≥ 100k hands |
| M7 | Track B: scale to 6-max blueprint | Runs on a single 64-core box; exports preflop strategy comparable to public 6-max charts |
| M8 | Subgame re-solving glue: combine Track A + Track B at play time | End-to-end agent plays a hand on a local server; exploitability measured by sampled best-response |

Rough calendar, single developer, part-time: M0–M2 in ~4 weeks; M3–M5
~3 months; M6–M8 open-ended.

---

## 6. Engineering practices

- **Language split**: C++20 engine, Python orchestration. Avoid Python in any
  inner loop.
- **Build**: `scikit-build-core` + CMake, pybind11 for bindings, ninja.
- **Testing**: pytest for end-to-end, GoogleTest for C++ units, property-based
  tests (hypothesis) for isomorphism and equity.
- **Benchmarks**: `benchmarks/` directory with pinned jobs; a nightly script
  that writes ε-vs-time curves to `benchmarks/results/` so regressions are
  visible.
- **Determinism**: fixed RNG seeds everywhere except when sweeping. MCCFR
  runs emit a hash of the final strategy so reruns are verified.
- **Checkpointing**: mmap-backed regret/strategy files; resume on crash.
- **Profiling**: `perf`, `vtune`, or `py-spy` against solver driver; target
  ≥ 60% of peak memory bandwidth on the CFR+ hot path.
- **GPU (stretch)**: only after the CPU solver is correct. The win is on
  equity rollouts and regret updates over hand-vectors; keep game-tree
  traversal on CPU.

---

## 7. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Memory blowup on flop solves | `float32` regrets, bucketed storage, per-street streaming; measure early on a small flop |
| Incorrect card-removal handling | Dedicated tests comparing to brute-force enumeration on river subgames |
| MCCFR convergence plateaus | Start with Linear/Discounted CFR, switch sampling schemes, revisit abstraction before tuning hyperparams |
| Scope creep into UI and tooling | Keep CLI + JSON as the only supported interface until M5 |
| "Looks right but isn't" | Correctness oracles (Kuhn/Leduc) in CI, not just NLHE spot-checks |

---

## 8. Open questions to resolve before M3

1. Which bet-size abstraction is the default? Suggest {33%, 75%, 150%, all-in}
   postflop plus a learned "add sizing if EV gap > X" step.
2. Rake model on/off by default? Suggest off for v1; rake-aware is a distinct
   mode later because it changes equilibria materially.
3. Storage format for strategies: custom binary vs Parquet. Suggest custom
   binary plus a Parquet exporter for analysis in the existing notebooks.
4. Do we want to reuse any existing open-source engine (OpenSpiel, PokerRL,
   Slumbot code) for parts of M2–M3 to save time, accepting the dependency?

---

## 9. Minimum viable deliverable

If only one thing ships: **Track A through M5** — a working postflop solver
with CLI, JSON export, and a benchmark suite. That alone is directly useful
for studying 6-max spots (run it on filtered histories from the hand-history
parser on the "Next tool ideas" list in the main README) and is a credible
foundation for Track B later.
