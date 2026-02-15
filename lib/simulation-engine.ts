export interface ScenarioRequest {
  aoi_bounds: [[number, number], [number, number]]
  capacity_mw: number
  constraints: {
    max_grid_distance_km?: number
    max_wildfire_risk?: number
    max_zoning_complexity?: number
    forbidden_land_use?: string[]
  }
  objective_weights: {
    cost: number
    yield: number
    risk: number
    zoning: number
    social: number
  }
}

export interface SpatialCell {
  id: string
  lat: number
  lon: number
  features: {
    dist_to_substation_km: number
    dist_to_transmission_km: number
    solar_irradiance_proxy: number
    wildfire_risk_proxy: number
    heat_risk_proxy: number
    zoning_complexity_proxy: number
    population_density_proxy: number
    buildable_area_km2: number
    land_use_class: string
  }
}

export interface CandidateResult {
  cell_id: string
  location: [number, number]
  score_total: number
  scores: {
    cost: number
    yield: number
    risk: number
    zoning: number
    social: number
  }
  metrics: {
    interconnection_cost_proxy_usd: number
    yield_proxy: number
    upgrade_risk_band: 'low' | 'moderate' | 'high'
  }
  violations: string[]
  explainability: {
    top_factors: string[]
    dominant_constraint: string | null
  }
}

export interface SimulationResult {
  candidates: CandidateResult[]
  scenario_summary: {
    total_evaluated: number
    feasible_count: number
    avg_cost_proxy: number
    avg_yield_proxy: number
  }
  tradeoffs: string[]
}

export async function simulateScenario(req: ScenarioRequest): Promise<SimulationResult> {
  // This function should not be used - we need direct user input to OpenAI
  throw new Error('Use direct OpenAI endpoint instead')
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}