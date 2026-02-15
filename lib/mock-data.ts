import { SpatialCell } from './simulation-engine'

export async function loadMockCaliforniaData(
  bounds: [[number, number], [number, number]]
): Promise<SpatialCell[]> {
  const cells: SpatialCell[] = []
  const [west, south] = bounds[0]
  const [east, north] = bounds[1]
  
  const gridSize = 0.5
  
  for (let lat = south; lat < north; lat += gridSize) {
    for (let lon = west; lon < east; lon += gridSize) {
      cells.push({
        id: `cell_${lat}_${lon}`,
        lat,
        lon,
        features: {
          dist_to_substation_km: Math.random() * 50 + 5,
          dist_to_transmission_km: Math.random() * 30 + 2,
          solar_irradiance_proxy: 0.6 + Math.random() * 0.4,
          wildfire_risk_proxy: Math.random(),
          heat_risk_proxy: Math.random(),
          zoning_complexity_proxy: Math.random(),
          population_density_proxy: Math.random() * 500,
          buildable_area_km2: Math.random() * 10 + 1,
          land_use_class: Math.random() > 0.9 ? 'protected' : 'available'
        }
      })
    }
  }
  
  return cells
}
