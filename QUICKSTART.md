# Quick Start Guide - v1

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```bash
OPENAI_API_KEY=sk-...
MAPBOX_TOKEN=pk...
NEXT_PUBLIC_MAPBOX_TOKEN=pk...
```

3. Run dev server:
```bash
npm run dev
```

Open http://localhost:3000

## How to Use

### Natural Language Input
Type in the chat interface:
- "10MW solar farm, minimize cost, avoid high wildfire zones"
- "Find sites within 20km of grid, maximize yield"
- "Deploy 5MW with low zoning complexity"

### What Happens
1. Intent parser converts to ScenarioRequest
2. Simulation engine evaluates spatial cells
3. Candidates ranked by multi-objective score
4. Map shows top 20 sites with markers
5. AI generates insights from results

## Architecture

- `/app/api/intent/parse` - Natural language → structured scenario
- `/app/api/simulate` - Core simulation engine
- `/app/api/insights/generate` - Result explanation
- `/lib/simulation-engine.ts` - Deterministic scoring logic
- `/lib/mock-data.ts` - v1 synthetic California data

## Deploy to Vercel

```bash
vercel
```

Set environment variables in Vercel dashboard.

## Next Steps for Production

1. Replace mock data with real California datasets:
   - Grid infrastructure (substations, transmission lines)
   - Wildfire risk maps
   - Solar irradiance data
   - Zoning classifications
   - Land use data

2. Connect to `/backend/core_feature/` for data processing

3. Add heatmap layer to map visualization

4. Implement Pareto frontier for multi-objective optimization
