## Overview

This document specifies the system architecture for an AI-native renewable siting + interconnection reasoning platform.

The platform is designed as:
- an interactive GIS product surface,
- backed by a deterministic simulation/optimization engine,
- with LLM-based intent parsing and structured insight generation.

The system must feel like a reasoning and simulation tool, not a dashboard.

---

## High-Level Components

### Frontend (Product Surface)
The frontend is responsible for:
- map visualization (multi-layer GIS)
- scenario configuration UI (sliders + natural language)
- displaying ranked candidates and tradeoffs
- visualizing grid lines/substations and candidate zones
- showing explanation panels and “why this result” insight

Frontend must not contain simulation logic.
It consumes structured outputs from backend.

---

### Backend API (Orchestrator)
The backend orchestrates:
- scenario validation
- data loading from GCS
- simulation engine execution
- optimization search
- returning map-ready layers and ranked results
- calling LLM for intent parsing + insight generation

The backend exposes a small number of endpoints:
- `GET /api/lever-catalog`
- `POST /api/intent/parse`
- `POST /api/simulate`
- `POST /api/optimize` (optional; can be merged into simulate)
- `POST /api/insights/generate`

---

### Simulation & Optimization Engine (Deterministic Core)
This is the core system.

It:
- computes scores and constraints
- ranks candidate cells/zones
- provides explainability fields
- returns consistent numeric outputs

This engine must be testable without any LLM.

---

### Data Layer (Central Resource)
Use GCS as the central data lake:

- `gs://<bucket>/raw/`  
- `gs://<bucket>/processed/`  
- `gs://<bucket>/reports/`

Processed datasets include:
- baseline indicators per spatial unit
- grid infrastructure geometries
- zoning/land use masks
- solar potential proxies
- risk proxies
- social indicators

---

### AI Layer (LLM Tools)
LLM is used only for:
1) intent parsing into structured ScenarioRequest
2) summarizing deterministic simulation results into a structured insight packet

LLM must never invent numeric outputs.

All numeric facts in insights must be sourced from simulation results.

---

## Data Flow

### Flow A: Slider/Structured Scenario
1) user adjusts levers and constraints
2) frontend sends ScenarioRequest JSON to backend
3) backend runs engine
4) backend returns SimulationResult + map layers
5) frontend renders heatmap + ranked zones + panels

### Flow B: Natural Language Scenario
1) user types natural language requirement
2) backend calls LLM intent parser
3) parser outputs ScenarioRequest JSON
4) backend validates and runs engine
5) backend returns results
6) backend calls LLM insight generator with result JSON
7) insight generator returns structured narrative
8) frontend renders insight and allows iterative refinement

---

## GIS Visualization Requirements

Frontend must support:
- a base map
- overlay layers:
  - candidate suitability heatmap
  - selected candidate zone polygon(s)
  - substations (points)
  - transmission lines (polylines)
  - risk overlays (wildfire/heat)
  - social overlays (population density)
- a “zoom to best zone” action
- tooltips that reveal explainability fields

Map layers must be derived from engine outputs.
Not just static toggles.

---

## Deployment Architecture (GCP + GitHub + Vercel)

### Backend on Cloud Run
- containerized backend service
- reads data from GCS
- reads secrets from Secret Manager
- exposes HTTPS endpoints

### CI/CD
- GitHub triggers build/deploy (Cloud Build Trigger or GitHub Actions)
- pushes image to Artifact Registry
- deploys Cloud Run service

### Frontend on Vercel
- frontend deployed via Vercel Git integration
- uses environment variable:
  - `API_BASE_URL = https://<cloud-run-service>`
- handles CORS + auth token if used

---

## Runtime Secrets

Store in Secret Manager:
- OpenAI/Claude keys
- Bright Data keys (if used)
- any internal API keys

Never commit secrets to repo.

---

## Observability (Hackathon-grade)

The platform should show:
- pipeline step status for each run
  - parsing
  - data load
  - simulation
  - optimization
  - insight generation

This can be done with simple backend logs + frontend step indicators.

This “reasoning trace” is a strong professional signal.

---

## v1 Minimal End-to-End Success

System is considered complete when:
- a user can submit a scenario and receive ranked zones
- the heatmap updates based on scenario
- nearest substation and grid line are shown
- cost/yield/risk proxies are displayed
- the AI can parse intent and generate structured insights grounded in results

The result must feel like a simulation and reasoning engine.
