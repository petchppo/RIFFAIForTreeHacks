# How the System Works

## Data Flow

### 1. User Input
User types: "10MW solar farm, minimize cost, avoid high wildfire zones"

### 2. Intent Parsing (OpenAI)
`/api/intent/parse` uses GPT-4o to convert natural language → structured JSON:
```json
{
  "capacity_mw": 10,
  "aoi_bounds": [[-121, 36], [-119, 38]],
  "constraints": {
    "max_wildfire_risk": 0.7
  },
  "objective_weights": {
    "cost": 0.4,
    "yield": 0.3,
    "risk": 0.2,
    "zoning": 0.05,
    "social": 0.05
  }
}
```

### 3. Simulation Engine (Deterministic)
`/api/simulate` runs `/lib/simulation-engine.ts`:

**Uses MOCK DATA** from `/lib/mock-data.ts`:
- Generates random spatial cells within California bounds
- Each cell has random features:
  - Distance to substation (5-55 km)
  - Solar irradiance (0.6-1.0)
  - Wildfire risk (0-1)
  - Zoning complexity (0-1)
  - etc.

**Scoring Process:**
1. Load mock spatial cells
2. Check hard constraints (grid distance, land use, area)
3. Calculate multi-objective scores:
   - Cost score = f(grid distance)
   - Yield score = f(solar irradiance, heat)
   - Risk score = f(wildfire, heat)
   - Zoning score = f(complexity)
   - Social score = f(population density)
4. Weighted total score
5. Rank top 20 candidates
6. Return with explainability

### 4. Insights Generation (OpenAI)
`/api/insights/generate` uses GPT-4o to explain simulation results:
- Takes numeric outputs from simulation
- Generates human-readable analysis
- Explains tradeoffs and constraints

### 5. Map Visualization
- Displays top 20 candidate sites as markers
- Color-coded: Green (rank 1), Blue (2-5), Gray (6-20)
- Shows California climate zones and MDHD points

## Current State: MOCK DATA

**The simulation uses randomly generated data**, not real California datasets.

To use real data, replace `/lib/mock-data.ts` with:
- Real grid infrastructure (substations, transmission lines)
- Real wildfire risk maps
- Real solar irradiance data
- Real zoning classifications

The simulation engine is ready for real data - just needs data loading implementation.

## Why OpenAI Can Answer

OpenAI doesn't need real data because:
1. **Intent Parser**: Just converts text → JSON structure
2. **Insights Generator**: Explains the numbers from simulation (which are deterministic)

The actual optimization happens in `/lib/simulation-engine.ts` (pure TypeScript, no AI).
