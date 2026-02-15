export interface CaliforniaRegion {
  id: string
  geometry: GeoJSON.Polygon
  metrics: {
    wildfire_risk: number
    heat_vulnerability: number
    emissions_intensity: number
    housing_affordability: number
    inequality_index: number
    population_density: number
    employment_proxy: number
    solar_radiation_kwh: number
    zoning_complexity: number
  }
  grid_infrastructure: {
    substations: Array<{ lat: number; lon: number; capacity_mw: number }>
    transmission_lines: GeoJSON.LineString[]
  }
}

export async function loadCaliforniaData(): Promise<CaliforniaRegion[]> {
  return []
}

export function normalizeMetrics(raw: any): CaliforniaRegion['metrics'] {
  return {} as any
}
