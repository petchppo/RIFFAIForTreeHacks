## Purpose

This document specifies the v1 simulation + optimization logic for an AI-native renewable siting and interconnection intelligence platform in California.

The goal is not perfect physical accuracy.
The goal is to create a consistent, explainable, scenario-based reasoning engine that:
- evaluates many candidate sites quickly,
- simulates multi-variable tradeoffs,
- supports constraints and optimization,
- generates structured outputs for GIS visualization and AI explanation.

Numeric outputs must be deterministic and reproducible from model inputs.
LLMs must not invent numeric values; LLMs only interpret, summarize, and explain model outputs.

---

## Core Concepts

### Baseline vs Scenario

The engine always compares:
- Baseline indicators (as-is)
- Scenario indicators (after applying user levers/constraints)

A scenario is defined by a `ScenarioRequest`:
- Geographic scope (AOI)
- Project parameters (e.g., 10MW solar)
- Constraints (grid distance, zoning, risk tolerance)
- Objective weights (cost vs yield vs risk vs social impact)
- Lever settings (optional policy/infrastructure levers)

---

## Output Types

The engine produces two outputs:

1) **Candidate Ranking Output**  
A ranked list of site candidates with:
- scores per dimension
- constraint violations (if any)
- explainable drivers (top factors)
- geometry references (grid cell / polygon / centroid)

2) **Scenario Simulation Output**  
A consolidated summary of:
- expected project viability
- cost/yield proxies
- environmental/social impacts
- tradeoffs and dominant constraints

---

## Modeling Units

### Spatial Unit

For v1, model the AOI as a grid of cells (e.g., ~1–5 km resolution), each cell producing:
- feature vector
- feasibility score
- suitability score
- risk score

Candidates are derived by selecting top cells and optionally clustering adjacent high-score cells into “zones”.

This makes the engine:
- fast to compute,
- easy to visualize as a heatmap,
- scalable to statewide coverage.

---

## Feature Set (v1)

Each spatial unit (cell/zone) must have a feature vector:

### Infrastructure Features
- `dist_to_substation_km` (nearest substation)
- `dist_to_transmission_km` (nearest high-voltage line)
- `grid_density_proxy` (optional, proxy for network robustness)
- `interconnection_cost_proxy_usd` (derived from distances and upgrade risk)

### Site & Resource Features
- `solar_irradiance_proxy` (or a normalized solar potential score)
- `land_use_class` (e.g., urban, agriculture, barren, protected)
- `buildable_area_km2` (proxy from land use mask)

### Risk & Constraint Features
- `wildfire_risk_proxy`
- `heat_risk_proxy`
- `zoning_complexity_proxy` (from land use + known constraints)
- `protected_area_flag` (hard constraint if available)

### Social Impact Features (policy maker dimension)
- `population_density_proxy`
- `housing_affordability_proxy` (regional)
- `inequality_proxy` (regional)
- `employment_impact_proxy` (estimated from project size + regional multipliers)

---

## ScenarioRequest → Engine Inputs

A scenario request must be converted into:
- AOI grid
- project requirements:
  - capacity_mw
  - footprint_km2_estimate (derived)
- constraint thresholds:
  - max_grid_distance_km
  - forbidden_land_use (e.g., protected)
  - wildfire_risk_max
  - zoning_complexity_max
- objective weights:
  - minimize_cost
  - maximize_yield
  - minimize_risk
  - minimize_social_impact (or maximize benefit)
  - minimize_zoning_friction

---

## Deterministic Scoring & Constraints

### Hard Constraints (binary)

If violated, candidate is infeasible.

Examples:
- inside protected areas
- insufficient buildable area
- grid distance > max threshold

Hard constraint output must include explicit flags:
- `violations: ["PROTECTED_AREA", "GRID_DISTANCE_TOO_HIGH"]`

### Soft Constraints (penalized)

If exceeded, candidate remains feasible but score decreases.

Examples:
- high wildfire proxy
- high zoning complexity
- high population proximity

---

## Multi-Objective Scoring

Define normalized scores for each dimension:

- `S_cost` (lower cost is better)
- `S_yield` (higher yield is better)
- `S_risk` (lower wildfire/heat risk is better)
- `S_zoning` (lower zoning complexity is better)
- `S_social` (lower negative social impact is better, or higher benefit is better)

Normalize each score to [0, 1].

Compute final score:

`S_total = w_cost*S_cost + w_yield*S_yield + w_risk*S_risk + w_zoning*S_zoning + w_social*S_social`

Where weights sum to 1.

---

## Proxy Formulas (v1)

### Footprint Estimation

Estimate land footprint from capacity:

`footprint_km2 = capacity_mw * footprint_factor`

Use a configurable `footprint_factor` (e.g., 0.01–0.04 km² per MW) to keep v1 simple.

### Interconnection Cost Proxy

Use a simple proxy:

`base_cost = a * dist_to_substation_km + b * dist_to_transmission_km`

`upgrade_risk_multiplier = 1 + c * wildfire_risk_proxy + d * zoning_complexity_proxy`

`interconnection_cost_proxy = base_cost * upgrade_risk_multiplier`

Coefficients a, b, c, d are tunable.

### Yield Proxy

`yield_proxy = solar_irradiance_proxy * (1 - heat_risk_proxy * heat_penalty)`

---

## Upgrade Risk Modeling (probabilistic banding)

For v1, represent “upgrade exposure” as a probabilistic band derived from:
- distance proxies
- grid density proxy (if available)
- zoning complexity proxy

Example:

- Low risk: risk_score <= 0.33
- Moderate: 0.33 < risk_score <= 0.66
- High: > 0.66

Return:
- `upgrade_risk_band`
- `risk_drivers` (top 3 features that drive risk)

---

## Optimization Strategy (v1)

The engine must support:
- user-specified lever values (direct scenario evaluation)
- automatic search for best candidates given objectives (optimization)

Optimization approach for hackathon:
- generate all grid cell candidates in AOI
- filter by hard constraints
- compute S_total
- return top-k
- optionally cluster top cells into zones

For “search over levers”, start minimal:
- small grid search across 1–2 levers (e.g., max_grid_distance and zoning tolerance)
- return Pareto-like set of 3–5 scenarios (cost vs risk vs yield)

---

## Explainability Output (required)

For each candidate, output:
- top contributing factors to score
- constraints satisfied/violated
- “dominant constraint pressure” feature

Example:
- “Ranked #2 because yield is high and grid distance is low, but zoning complexity reduced score by 0.12.”

This will be consumed by the AI insight generator.

---

## v1 Deliverable Behavior

A v1 demo is considered valid if:
- the engine accepts a ScenarioRequest,
- returns top-k candidates,
- outputs a heatmap-ready layer,
- provides deterministic scores,
- supports at least one optimization loop (search / ranking),
- and returns explainability fields usable by an LLM.
