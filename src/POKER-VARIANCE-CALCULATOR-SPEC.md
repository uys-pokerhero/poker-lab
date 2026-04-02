# Poker Variance Calculator — MVP Specification

**Project:** uyspokerhero.com / Poker Lab  
**Version:** 1.0 (MVP)  
**Scope:** Cash games only · Client-side · No server

---

## 1. Product Goal

Build a static, client-side poker variance calculator widget that answers two questions:

1. *"Given my win rate and volatility, what can happen over N hands?"*
2. *"What is the probability of losing my entire bankroll within N hands?"*

The widget will be embedded into a Squarespace site via a Code Block pointing to a hosted JS bundle (GitHub Pages or Cloudflare Pages).

---

## 2. Constraints

| Constraint | Value |
|---|---|
| Game type | Cash games only (NLHE) |
| Input/output units | Big blinds (bb) |
| Max interactive volume | 50,000 hands |
| Risk of ruin model | Closed-form (Normal approx + Brownian hitting) |
| Server requirement | None — 100% client-side |
| Simulation | Disabled for MVP; architecture must support v1.1 Monte Carlo |

---

## 3. Inputs

### Basic (always visible)

| Field | Variable | Default | Range | Unit / Notes |
|---|---|---|---|---|
| Bankroll | `bankroll` | 2000 | 0 – 999,999 | bb or buy-ins (toggle) |
| Buy-in size | `buyin_size` | 100 | 1 – 1,000 | bb · Only shown when unit = buy-ins |
| Winrate | `wr` | 3 | -50 – 50 | bb/100 · Step 0.5 |
| Standard Deviation | `sd` | 80 | 1 – 300 | bb/100 · Step 1 |
| Volume | `N` | 50,000 | 100 – 500,000 | hands · Quick buttons: 10k / 25k / 50k / 100k |

### Advanced (MVP: disabled by default, architecture for v1.1)

| Feature | Notes |
|---|---|
| Stop at zero | Always enabled — this is the definition of "ruin" |
| Stop-loss rule | v1.1 — requires Monte Carlo simulation |
| Seed control | v1.1 — expose seed in URL params for reproducible sim results |

### Bankroll Unit Toggle

- Two modes: **Big Blinds** or **Buy-ins**
- When buy-ins selected, show an additional "Buy-in size (bb)" field (default 100)
- Internal calculation always uses `bankroll_bb = bankroll_input × buyin_size` (or raw bb)

---

## 4. Mathematical Model

### Model Choice: Normal Approximation + Brownian Hitting Probability

Poker hand results are modeled as a sum of independent outcomes with constant mean and variance. Profit is additive in bb (not multiplicative), so the normal distribution applies. Lognormal is inappropriate for cash game bb accounting.

### Core Formulas

Given user inputs `wr`, `sd`, `N`:

```
t = N / 100                          # number of 100-hand blocks
μ = wr × t                           # mean profit (bb)
σ = sd × √t                          # std dev of profit (bb)

Profit_N ~ Normal(μ, σ²)
```

### Risk of Ruin — Closed-Form

**Bust within N hands:**

```
P(bust | N) = Φ( (-x₀ - a·t) / (b·√t) )

where:
  x₀ = bankroll_bb
  t  = N / 100
  a  = wr             (drift per 100-hand block)
  b  = sd             (vol per 100-hand block)
  Φ  = standard normal CDF
```

**Eventual ruin** (only shown when `wr > 0`):

```
P(eventual bust) = exp(-2 · wr · bankroll_bb / sd²)
```

### Fan Chart Data

Generate ~50 grid points from 0 to N. At each point compute:

```
hands_i = round((i / 50) × N)
μ_i     = wr × (hands_i / 100)
σ_i     = sd × √(hands_i / 100)

median  = bankroll_bb + μ_i
p5      = bankroll_bb + μ_i + Φ⁻¹(0.05) × σ_i
p25     = bankroll_bb + μ_i + Φ⁻¹(0.25) × σ_i
p75     = bankroll_bb + μ_i + Φ⁻¹(0.75) × σ_i
p95     = bankroll_bb + μ_i + Φ⁻¹(0.95) × σ_i
```

### Assumptions to Disclose on Page

- iid outcomes, constant winrate and standard deviation
- Ignores table selection changes, tilt, quitting behavior, game toughness changes, rake changes
- SD treated as constant across stakes and time
- Assumes player continues playing after losing initial bankroll (for the formula)
- Normal approximation (improves at larger N)

---

## 5. Outputs

### Result Cards

| Output | Formula | Display |
|---|---|---|
| Expected Profit | `wr × (N / 100)` | `+X bb (Y buy-ins)` |
| Bust within N hands | Closed-form P(bust\|N) | `X%` |
| Eventual Ruin | `exp(-2·wr·bankroll/sd²)` | `Y%` — only show when `wr > 0` |

When `wr ≤ 0`, show "~100% if you play forever with a non-positive edge" instead of eventual ruin.

### Fan Chart (Graph 1 — MVP)

- **x-axis:** hands played (0 → N)
- **y-axis:** bankroll (bb)
- **Layers:**
  - Shaded outer band: 5th–95th percentile
  - Shaded inner band: 25th–75th percentile
  - Solid median line
  - Dashed line at starting bankroll
  - Dashed line at zero (if visible)
- **Interactivity:** Hover/touch shows tooltip with exact values at that hand count
- **Performance:** Pure analytic computation at 50 grid points — no simulation

---

## 6. Warning Messages

Show contextually, inline above the results:

| Condition | Message |
|---|---|
| `N < 2,000` | "Small sample — your estimated winrate is likely noisy. Treat these results as illustrative." |
| `wr > 15` | "Very high winrate entered — double-check your estimate. Selection bias is common." |
| `sd < 30` or `sd > 150` | "Unusual SD entered. Cash game SD typically falls between 60–120 bb/100." |
| `wr ≤ 0` | "Non-positive winrate — eventual ruin is effectively certain if you keep playing." |

---

## 7. UI/UX Requirements

### Layout

- **Desktop:** Two-column — inputs (left, ~320px), results + chart (right, fluid)
- **Mobile:** Single-column stack — inputs → results → chart
- **Responsive breakpoint:** 720px

### Design Direction

- Dark theme (deep navy/slate background: `#0a0f1a`, `#111827`)
- Accent color: cyan (`#22d3ee`)
- Typography: Display font (e.g., Outfit) + monospace for numbers (JetBrains Mono)
- Cards with subtle borders (`#1e293b`), no heavy shadows
- Poker-appropriate aesthetic: serious, data-driven, not gamey

### Input Panel

1. Bankroll unit toggle (bb / buy-ins) at top
2. Buy-in size field (conditional on unit = buy-ins)
3. Bankroll field
4. Winrate field with tooltip
5. Standard Deviation field with tooltip
6. Volume field with quick buttons below
7. Assumptions disclosure block at bottom of panel

### Tooltips

Each input has a `?` icon that shows a tooltip on hover:

- **Bankroll:** "Your total bankroll. 1 buy-in is typically 100bb for cash games."
- **Winrate:** "Your long-run average profit per 100 hands. If your sample is small, this estimate is very uncertain."
- **SD:** "Measures how swingy your results are. Depends on play style, stake, rake, and game type. 60–100 is common for NLHE cash."

### Results Panel

1. Warning messages (conditional)
2. Three stat cards in a row (expected profit, bust in N hands, eventual ruin)
3. Fan chart with legend
4. "How to use" explanation block

### How-to-Use Text (verbatim)

> Enter your bankroll, winrate (bb/100), standard deviation (bb/100), and the number of hands you plan to play. The calculator estimates a range of likely outcomes and the probability of going bust. Results assume your edge and volatility stay constant — use it to understand variance, not to predict exact results.

---

## 8. Math Utilities to Implement

All math is client-side. No external math libraries required.

### `normal.ts`

| Function | Spec |
|---|---|
| `erf(x): number` | Horner-form approximation (Abramowitz & Stegun 7.1.26) |
| `normCdf(x): number` | `0.5 × (1 + erf(x / √2))` |
| `normInv(p): number` | Acklam's rational approximation. Handle p ∈ (0,1), return ±Infinity at boundaries |

### `profit.ts`

| Function | Spec |
|---|---|
| `profitMean(wr, N): number` | `wr × (N / 100)` |
| `profitStdDev(sd, N): number` | `sd × √(N / 100)` |

### `ror.ts`

| Function | Spec |
|---|---|
| `rorAfterHands(bankrollBb, wr, sd, N): number` | Closed-form bust prob within N hands |
| `rorEventually(bankrollBb, wr, sd): number` | `exp(-2·wr·bankroll/sd²)` when `wr > 0` |

**Edge cases for all functions:**

| Condition | Result |
|---|---|
| `N ≤ 0` | `P(bust) = 0` |
| `bankroll ≤ 0` | `P(bust) = 1` |
| `sd ≤ 0, wr ≥ 0` | `P(bust) = 0` (deterministic win) |
| `sd ≤ 0, wr < 0` | `P(bust) = 1` (deterministic loss) |
| `wr ≤ 0` | Eventual ruin = 1 |

### `grid.ts`

| Function | Spec |
|---|---|
| `generateFanChartData(wr, sd, N, bankrollBb, points=50)` | Returns array of `{ hands, median, p5, p25, p75, p95 }` |

### `units.ts`

| Function | Spec |
|---|---|
| `buyinsToBb(buyins, buyinSize): number` | `buyins × buyinSize` |
| `bbToBuyins(bb, buyinSize): number` | `bb / buyinSize` |

---

## 9. Folder Structure

```
poker-lab/
  variance-calculator/
    README.md
    package.json
    tsconfig.json
    vite.config.ts
    src/
      index.ts                    # widget entry point
      ui/
        App.tsx
        components/
          Inputs.tsx              # input panel with toggles, tooltips
          Results.tsx             # stat cards + warnings
          FanChart.tsx            # SVG fan chart with hover
          Tooltip.tsx             # reusable tooltip component
          QuickButtons.tsx        # volume quick-select buttons
          UnitToggle.tsx          # bb/buy-in toggle
        styles.css
      core/
        units.ts                  # buy-in ↔ bb conversions
        normal.ts                 # erf, normCdf, normInv
        profit.ts                 # profitMean, profitStdDev
        ror.ts                    # rorAfterHands, rorEventually
        grid.ts                   # fan chart data generator
      tests/
        normal.test.ts
        profit.test.ts
        ror.test.ts
        grid.test.ts
    public/
      embed-example.html          # Squarespace embed demo
```

---

## 10. Cursor Ticket Sequence

### Ticket 1: Core Math Utilities

**File:** `src/core/normal.ts`

Implement `erf`, `normCdf`, `normInv` with Acklam's rational approximation.

**Acceptance criteria:**
- `normCdf(0) === 0.5`
- `normCdf(1.96) ≈ 0.975` (within 1e-6)
- `normInv(normCdf(x)) ≈ x` round-trip for x ∈ [-4, 4]
- `normInv(0) === -Infinity`, `normInv(1) === Infinity`

Add input validation helpers (`clamp`, range checks).

### Ticket 2: Profit Distribution Functions

**File:** `src/core/profit.ts`

Implement `profitMean(wr, N)` and `profitStdDev(sd, N)`.

**Acceptance criteria:**
- `profitMean(3, 10000) === 300`
- `profitStdDev(80, 10000) === 800`
- Linear scaling of mean with N, square-root scaling of SD with N

### Ticket 3: Risk of Ruin (Closed-Form)

**File:** `src/core/ror.ts`

Implement `rorAfterHands(bankrollBb, wr, sd, N)` and `rorEventually(bankrollBb, wr, sd)`.

**Acceptance criteria:**
- All edge cases from Section 8 pass
- `rorAfterHands(2000, 3, 80, 0) === 0`
- `rorAfterHands(0, 3, 80, 50000) === 1`
- `rorEventually(2000, 3, 80) ≈ 0.223` (verify against `exp(-2×3×2000/6400)`)
- Larger bankroll → lower RoR
- Higher winrate → lower RoR
- Higher SD → higher RoR

### Ticket 4: Fan Chart Data Generator

**File:** `src/core/grid.ts`

Implement `generateFanChartData(wr, sd, N, bankrollBb, points)`.

**Acceptance criteria:**
- Returns `points + 1` data points
- First point: `hands=0`, all values = `bankrollBb`
- Last point: `hands=N`
- Quantiles are monotonically ordered: `p5 ≤ p25 ≤ median ≤ p75 ≤ p95` at each point
- Band width increases with hands (variance grows with √N)

### Ticket 5: Unit Conversions

**File:** `src/core/units.ts`

**Acceptance criteria:**
- `buyinsToBb(20, 100) === 2000`
- `bbToBuyins(2000, 100) === 20`
- Handles fractional buy-ins correctly

### Ticket 6: UI — Input Panel

**File:** `src/ui/components/Inputs.tsx` and related

Build the input form with:
- Bankroll unit toggle (bb / buy-ins)
- Conditional buy-in size field
- All input fields with tooltips (see Section 7)
- Volume quick buttons (10k / 25k / 50k / 100k)
- Assumptions disclosure block
- Input validation (min/max ranges per Section 3)

### Ticket 7: UI — Results Panel + Warnings

**File:** `src/ui/components/Results.tsx`

Build:
- Contextual warning messages (see Section 6)
- Three stat cards: Expected Profit, Bust in N hands, Eventual Ruin
- Conditional rendering: hide Eventual Ruin when `wr ≤ 0`
- Color coding: green for favorable values, red for unfavorable

### Ticket 8: UI — Fan Chart

**File:** `src/ui/components/FanChart.tsx`

Build an SVG-based fan chart:
- Responsive sizing (ResizeObserver)
- Two shaded bands (5–95%, 25–75%)
- Median line + starting bankroll line
- Hover tooltip showing exact values at cursor position
- Auto-scaling axes with smart tick formatting (e.g., "10k")
- Legend (Median line + 5–95% band)

**Libraries:** None required — implement as raw SVG. If charting lib desired, use uPlot (tiny, fast).

### Ticket 9: UI — App Shell + Wiring

**File:** `src/ui/App.tsx`, `src/index.ts`

- Wire inputs → core functions → outputs
- All computation via `useMemo` (recalculate only when inputs change)
- State management: React `useState` for all inputs
- Dark theme with CSS variables
- Responsive layout (grid on desktop, stack on mobile at 720px)

### Ticket 10: Build + Embed

**File:** `vite.config.ts`, `public/embed-example.html`

- Configure Vite to produce a single JS bundle + optional CSS
- `embed-example.html` showing the Squarespace embed pattern:

```html
<div id="pvh-variance"></div>
<script src="https://yourdomain.github.io/poker-lab/variance-widget.js"></script>
```

- Document the embed snippet for Squarespace Code Block

### Ticket 11: Validation Harness

Create a test page / script that runs fixed scenarios and prints outputs for manual comparison:

| Scenario | bankroll | wr | sd | N | Expected Bust% |
|---|---|---|---|---|---|
| Baseline | 2000 | 3 | 80 | 50,000 | verify |
| Break-even | 2000 | 0 | 80 | 50,000 | verify |
| High edge | 2000 | 10 | 80 | 50,000 | verify |
| Short roll | 500 | 3 | 80 | 50,000 | verify |
| Massive roll | 10,000 | 3 | 80 | 50,000 | verify |

Cross-check against Primedope (note: differences expected due to model assumptions).

### Ticket 12 (v1.1): Monte Carlo Simulation Engine

*Deferred — architecture stub only in MVP.*

- Simulate bankroll path in 100-hand blocks: `ΔProfit ~ Normal(wr, sd²)`
- Stop when bankroll hits 0 or reaches N hands
- Default 2,000 simulations, target < 1s in browser
- Seeded RNG (seedrandom or mulberry32 + Box-Muller)
- Expose seed in URL query params for reproducibility
- Add convergence warning: "simulation error roughly ±X%"
- Enable stop-loss rule toggle

---

## 11. Testing Plan

### Unit Tests (vitest)

**normal.test.ts:**
- `normCdf(0) === 0.5`
- `normCdf(1.96)` within 1e-6 of 0.975
- `normInv` round-trip accuracy
- Boundary handling (0, 1, negative)

**profit.test.ts:**
- `profitMean` scales linearly with N
- `profitStdDev` scales with √N
- Zero inputs return zero

**ror.test.ts:**
- `N=0` → `P(bust) = 0`
- `bankroll=0` → `P(bust) = 1`
- `sd→0` → deterministic (handle division by zero)
- `wr≤0` → eventual RoR = 1
- Monotonicity: more bankroll → less RoR
- Known value: `rorEventually(2000, 3, 80) ≈ exp(-1200/6400) ≈ 0.8290`

**grid.test.ts:**
- Correct number of data points
- Quantile ordering at every point
- First point equals starting bankroll

### Sanity Checks

- For large N, analytic profit distribution should match simulated (when sims added)
- Compare bust-within-N formula vs simulation in standard scenarios
- Cross-reference Primedope outputs (small differences expected)

---

## 12. Performance Targets

| Mode | Target |
|---|---|
| MVP (analytic) | Instantaneous — pure math, no delay |
| v1.1 (simulation, 2k sims, 50k hands) | < 1 second in browser |
| Chart rendering (50 grid points) | Immediate — no visible delay |

If N is very large in simulation mode (v1.1), increase step size from 100 to 500–1,000 hands to cap computation.

---

## 13. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Type safety, Cursor-friendly |
| UI | Preact or React | Small bundle; component model |
| Build | Vite | Fast dev, single-bundle output |
| Charts | Raw SVG (or uPlot) | Minimal deps, fast rendering |
| Math | Hand-rolled `erf`, `normCdf`, `normInv` | Tiny, no deps, reliable |
| RNG (v1.1) | seedrandom / mulberry32 + Box-Muller | Reproducible simulation |
| Tests | vitest | Fast, TS-native |
| Hosting | GitHub Pages or Cloudflare Pages | Free, fast CDN |

---

## 14. Embed Strategy (Squarespace)

The final build produces:
- `variance-widget.js` — single bundled JS file
- `variance-widget.css` — optional extracted CSS (or inlined)

Squarespace embed via Code Block:

```html
<div id="pvh-variance"></div>
<link rel="stylesheet" href="https://yourdomain.github.io/poker-lab/variance-widget.css" />
<script src="https://yourdomain.github.io/poker-lab/variance-widget.js"></script>
```

The widget mounts itself into `#pvh-variance` on load.

---

## 15. Future Roadmap (Out of Scope for MVP)

| Version | Feature |
|---|---|
| v1.1 | Monte Carlo simulation engine with seeded RNG |
| v1.1 | Stop-loss rule toggle |
| v1.1 | URL query params for shareable calculator states |
| v1.2 | Winrate uncertainty input (sample size → confidence interval on RoR) |
| v1.2 | Rake/rakeback adjustment field |
| v1.3 | Tournament variance model (structurally different from cash) |
| v2.0 | Shot-taking / moving stakes simulation |
| v2.0 | Mixture model toggle ("good table" / "bad table" regimes) |

---

## 16. Page Disclosures

Surface these on the published page (not hidden in tooltips):

- **Winrate uncertainty:** Most players' winrate estimate is noisy due to selection bias and small samples.
- **Rake impact:** Rake and rakeback differences materially change effective winrate.
- **Non-stationarity:** Games change over time; moving up in stakes changes both winrate and SD.
- **Tilt / quit behavior:** Stop-losses, quitting when stuck, and playing longer when winning all distort real outcomes.
- **Table selection:** Winrate is not a fixed constant — it's partly skill and partly a selection process.
