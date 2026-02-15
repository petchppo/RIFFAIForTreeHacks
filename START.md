# How to Start and Run v1

## Prerequisites
- Node.js 18+
- OpenAI API key
- Mapbox token (free tier works)

## Step 1: Install Dependencies
```bash
cd /home/tin_2/user_files/TreeHack2026_YC
npm install
```

## Step 2: Configure Environment
Edit `.env.local` with your keys:
```bash
OPENAI_API_KEY=sk-your-key-here
MAPBOX_TOKEN=pk.your-token-here
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-token-here
```

Get keys:
- OpenAI: https://platform.openai.com/api-keys
- Mapbox: https://account.mapbox.com/access-tokens/

## Step 3: Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

## Step 4: Test the System

### Example Queries:
1. "Deploy a 10MW solar farm, minimize interconnection cost, avoid high wildfire zones"
2. "Find sites within 20km of grid with maximum solar yield"
3. "5MW project with low zoning complexity and minimal population impact"

### What Happens:
1. **Intent Parser** converts natural language → ScenarioRequest JSON
2. **Simulation Engine** evaluates spatial cells across California
3. **Constraint Checker** filters by hard constraints
4. **Multi-Objective Scorer** ranks by cost/yield/risk/zoning/social
5. **Map Visualization** shows top 20 candidates with markers
6. **Insight Generator** explains tradeoffs using simulation data

## Architecture Flow

```
User Input (Natural Language)
    ↓
/api/intent/parse (GPT-4 → ScenarioRequest)
    ↓
/api/simulate (Deterministic Engine)
    ↓
Simulation Engine:
  - Load spatial cells (mock data for v1)
  - Check hard constraints
  - Compute multi-objective scores
  - Rank candidates
    ↓
/api/insights/generate (GPT-4 → Structured Insights)
    ↓
Frontend:
  - Map renders top candidates
  - Panel shows ranked results
  - Insights displayed
```

## Deploy to Vercel

```bash
vercel
```

Set environment variables in Vercel dashboard.

## Current State (v1)

✅ Complete simulation engine with deterministic scoring
✅ Intent parsing (natural language → structured scenario)
✅ Multi-objective optimization (cost, yield, risk, zoning, social)
✅ Hard/soft constraint satisfaction
✅ Explainability (top factors, dominant constraints)
✅ Map visualization with ranked candidates
✅ Insight generation from simulation results
✅ Mock California data for rapid testing

## Next Steps for Production

1. **Replace Mock Data** with real California datasets:
   - Grid infrastructure (CAISO substations, transmission lines)
   - Wildfire risk maps (CAL FIRE)
   - Solar irradiance (NREL)
   - Zoning classifications
   - Land use data

2. **Connect Backend**: Link `/lib/simulation-engine.ts` to `/backend/core_feature/`

3. **Add Heatmap Layer**: Visualize suitability scores as continuous heatmap

4. **Pareto Frontier**: Multi-objective optimization with tradeoff curves

5. **Real-time Grid Data**: Live substation capacity and interconnection queue

## Troubleshooting

**Port already in use:**
```bash
kill -9 $(lsof -ti:3000)
npm run dev
```

**Missing dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**API errors:**
- Check `.env.local` has valid keys
- Verify OpenAI API key has credits
- Ensure Mapbox token is public (starts with `pk.`)

## System Philosophy

This is NOT a dashboard or GIS viewer.
This is a **capital risk compression engine** for renewable infrastructure deployment.

The system:
- Compresses decision cycles from months to minutes
- Predicts upgrade cost exposure probabilistically
- Searches spatial solution space automatically
- Surfaces dominant constraints instantly
- Reduces consultant dependency

Every number is deterministic and explainable.
AI never invents data—only interprets simulation outputs.
