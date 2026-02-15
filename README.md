# California Renewable Siting & Interconnection Platform

AI-Native Capital Risk Compression Engine for Renewable Infrastructure Deployment

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local`:
```bash
OPENAI_API_KEY=your_key
MAPBOX_TOKEN=your_token
NEXT_PUBLIC_MAPBOX_TOKEN=your_token
```

## Deploy to Vercel

```bash
vercel
```

Set environment variables in Vercel dashboard.

## Architecture

- **Frontend**: Next.js 14 (App Router)
- **AI**: OpenAI GPT-4 with function calling
- **Maps**: Mapbox GL (California-bounded)
- **Simulation**: `/lib/simulation-engine.ts`
- **Data Model**: `/lib/data-model.ts`
- **Optimization**: `/lib/optimization.ts`

## Core Features

1. **Intent Interpretation**: Natural language → structured ScenarioRequest
2. **Simulation Engine**: Multi-factor spatial optimization (cost, yield, risk, zoning, social)
3. **Constraint Satisfaction**: Hard/soft constraints with violation detection
4. **Explainability**: Deterministic scoring with top factor attribution
5. **Visualization**: Ranked candidate sites with grid infrastructure overlay

## v1 Success Criteria

- User submits renewable siting goal
- System returns ranked candidate zones
- Map shows top sites with cost/yield/risk metrics
- AI explains tradeoffs using simulation outputs only
- Entire flow feels like reasoning engine, not dashboard

## Integration with Backend

Connect `/lib/simulation-engine.ts` to `/backend/core_feature/` for:
- California grid infrastructure data
- Wildfire/heat risk layers
- Solar irradiance maps
- Zoning/land use classifications
- Population/social indicators
