'use client'

import { useEffect, useRef, useState } from 'react'

export default function Map({ scenarioData }: { scenarioData: any }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [basemap, setBasemap] = useState('light')
  const [layers, setLayers] = useState({ climate: true, mdhd: true, irradiation: true, griddata: true })
  const [layerSettings, setLayerSettings] = useState({
    irradiation: { opacity: 0.8, min: 0, max: 2500 }
  })
  const [mapFilter, setMapFilter] = useState<{threshold?: number, operator?: string} | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-119.4179, 36.7783],
        zoom: 5.5
      })

      map.on('load', () => {
        setReady(true)
        loadLayers(map)
      })

      mapRef.current = map
    }

    initMap()
  }, [])

  const loadLayers = async (map: any) => {
    setLoading(true)
    setLoadingProgress(10)
    
    try {
      // Load smaller MDHD layer first
      const mdhdRes = await fetch('/data/MDHD_Dashboard_ArcGIS_Updated_Nov_6901160749949423404.geojson')
      const mdhdData = await mdhdRes.json()
      setLoadingProgress(30)

      if (!map.getSource('mdhd')) {
        map.addSource('mdhd', { type: 'geojson', data: mdhdData })
        map.addLayer({
          id: 'mdhd-points',
          type: 'circle',
          source: 'mdhd',
          paint: {
            'circle-radius': 6,
            'circle-color': '#ff6b6b',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
          }
        })
      }
      setLoadingProgress(50)
      
      // Add irradiation raster layer
      if (!map.getSource('irradiation')) {
        const baseUrl = window.location.origin + '/api/raster/california_irradiation_2025/{z}/{x}/{y}'
        
        map.addSource('irradiation', {
          type: 'raster',
          tiles: [baseUrl],
          tileSize: 256,
          minzoom: 3,
          maxzoom: 10
        })
        
        map.addLayer({
          id: 'irradiation-raster',
          type: 'raster',
          source: 'irradiation',
          paint: {
            'raster-opacity': layerSettings.irradiation.opacity,
            'raster-fade-duration': 0
          },
          layout: {
            'visibility': 'visible'
          }
        })
        
        map.on('error', (e) => {
          if (e.sourceId === 'irradiation') {
            console.error('Irradiation tile error:', e)
          }
        })
      }
      setLoadingProgress(70)
      
      // Load larger climate layer after a delay
      setTimeout(async () => {
        try {
          const climateRes = await fetch('/data/BuildingClimateZones_CEC_2015_-254197201195074155.geojson')
          const climateData = await climateRes.json()
          setLoadingProgress(90)

          if (!map.getSource('climate')) {
            map.addSource('climate', { type: 'geojson', data: climateData })
            map.addLayer({
              id: 'climate-line',
              type: 'line',
              source: 'climate',
              paint: { 'line-color': '#0080ff', 'line-width': 2 }
            })
          }
          setLoadingProgress(100)
          setTimeout(() => setLoading(false), 500)
        } catch (e) {
          console.error('Error loading climate layer:', e)
          setLoading(false)
        }
      }, 100)
      
      // Load CSV grid data
      const csvRes = await fetch('/data/griddata_with_latlon.csv')
      const csvText = await csvRes.text()
      const lines = csvText.split('\n')
      
      // Get unique counties (avoid duplicate points)
      const countyMap = new Map()
      
      lines.slice(1).filter(line => line.trim()).forEach(line => {
        const values = line.split(',')
        const county = values[0]
        const lat = parseFloat(values[10])
        const lon = parseFloat(values[11])
        
        if (!isNaN(lat) && !isNaN(lon) && !countyMap.has(county)) {
          countyMap.set(county, {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lon, lat]
            },
            properties: {
              county: county,
              renewable_share: parseFloat(values[2])
            }
          })
        }
      })
      
      const features = Array.from(countyMap.values())
      
      if (!map.getSource('griddata')) {
        map.addSource('griddata', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features }
        })
        
        map.addLayer({
          id: 'griddata-points',
          type: 'circle',
          source: 'griddata',
          paint: {
            'circle-radius': 4,
            'circle-color': '#00ff00',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
          }
        })
      }
      
    } catch (e) {
      console.error('Error loading layers:', e)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ready || !mapRef.current) return
    
    const map = mapRef.current
    const style = basemap === 'satellite' ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/light-v11'
    
    map.setStyle(style)
    
    map.once('style.load', () => {
      loadLayers(map)
    })
  }, [basemap])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    
    const map = mapRef.current
    
    if (map.getLayer('climate-line')) {
      map.setLayoutProperty('climate-line', 'visibility', layers.climate ? 'visible' : 'none')
    }
    
    if (map.getLayer('mdhd-points')) {
      map.setLayoutProperty('mdhd-points', 'visibility', layers.mdhd ? 'visible' : 'none')
    }
    
    if (map.getLayer('irradiation-raster')) {
      map.setLayoutProperty('irradiation-raster', 'visibility', layers.irradiation ? 'visible' : 'none')
    }
    
    if (map.getLayer('griddata-points')) {
      map.setLayoutProperty('griddata-points', 'visibility', layers.griddata ? 'visible' : 'none')
    }
  }, [layers, ready])

  useEffect(() => {
    if (!ready || !mapRef.current || !scenarioData) return
    
    const map = mapRef.current
    
    // Handle OpenAI map commands
    if (scenarioData.action === 'filter_irradiation') {
      const { threshold, operator } = scenarioData
      updateIrradiationLayer(map, threshold, operator)
    } else if (scenarioData.action === 'set_opacity') {
      const { layer, opacity } = scenarioData
      if (layer === 'irradiation') {
        map.setPaintProperty('irradiation-raster', 'raster-opacity', opacity)
        setLayerSettings(prev => ({
          ...prev,
          irradiation: { ...prev.irradiation, opacity }
        }))
      }
    } else if (scenarioData.action === 'set_range') {
      const { layer, min, max } = scenarioData
      if (layer === 'irradiation') {
        setLayerSettings(prev => ({
          ...prev,
          irradiation: { ...prev.irradiation, min, max }
        }))
        updateIrradiationLayer(map, null, null, min, max)
      }
    }
  }, [scenarioData, ready])
  
  const updateIrradiationLayer = (map: any, threshold?: number, operator?: string, min?: number, max?: number) => {
    const baseUrl = window.location.origin + '/api/raster/california_irradiation_2025/{z}/{x}/{y}'
    const params = new URLSearchParams()
    
    const currentMin = min !== undefined ? min : layerSettings.irradiation.min
    const currentMax = max !== undefined ? max : layerSettings.irradiation.max
    
    params.set('min', currentMin.toString())
    params.set('max', currentMax.toString())
    
    const url = `${baseUrl}?${params}`
    
    if (map.getSource('irradiation')) {
      map.getSource('irradiation').setTiles([url])
    }
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-lg font-semibold">Loading map layers...</div>
            <div className="text-sm text-gray-600">This may take a moment</div>
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{loadingProgress}%</div>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 bg-white p-3 rounded shadow-lg space-y-2">
        <div className="font-semibold text-sm mb-2">Basemap</div>
        <button
          onClick={() => setBasemap('light')}
          className={`block w-full text-left px-2 py-1 rounded text-sm ${basemap === 'light' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
        >
          Light
        </button>
        <button
          onClick={() => setBasemap('satellite')}
          className={`block w-full text-left px-2 py-1 rounded text-sm ${basemap === 'satellite' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
        >
          Satellite
        </button>
        
        <div className="font-semibold text-sm mt-4 mb-2">Layers</div>
        <label className="flex items-center text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={layers.climate}
            onChange={(e) => setLayers({...layers, climate: e.target.checked})}
            className="mr-2"
          />
          Climate Zones
        </label>
        <label className="flex items-center text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={layers.mdhd}
            onChange={(e) => setLayers({...layers, mdhd: e.target.checked})}
            className="mr-2"
          />
          MDHD Points
        </label>
        <label className="flex items-center text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={layers.irradiation}
            onChange={(e) => setLayers({...layers, irradiation: e.target.checked})}
            className="mr-2"
          />
          Solar Irradiation
        </label>
        <label className="flex items-center text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={layers.griddata}
            onChange={(e) => setLayers({...layers, griddata: e.target.checked})}
            className="mr-2"
          />
          Grid Data Points
        </label>
        
        {layers.irradiation && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <div className="mb-1">Opacity:</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={layerSettings.irradiation.opacity}
              onChange={(e) => {
                const opacity = parseFloat(e.target.value)
                setLayerSettings(prev => ({
                  ...prev,
                  irradiation: { ...prev.irradiation, opacity }
                }))
                if (mapRef.current) {
                  mapRef.current.setPaintProperty('irradiation-raster', 'raster-opacity', opacity)
                }
              }}
              className="w-full"
            />
            <div className="text-center">{layerSettings.irradiation.opacity}</div>
            
            <div className="mt-2 mb-1">Filter Range:</div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="2500"
                step="50"
                value={layerSettings.irradiation.min}
                onChange={(e) => {
                  const min = parseInt(e.target.value)
                  if (min < layerSettings.irradiation.max) {
                    setLayerSettings(prev => ({
                      ...prev,
                      irradiation: { ...prev.irradiation, min }
                    }))
                    if (mapRef.current) {
                      updateIrradiationLayer(mapRef.current, undefined, undefined, min, layerSettings.irradiation.max)
                    }
                  }
                }}
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{ zIndex: 1 }}
              />
              <input
                type="range"
                min="0"
                max="2500"
                step="50"
                value={layerSettings.irradiation.max}
                onChange={(e) => {
                  const max = parseInt(e.target.value)
                  if (max > layerSettings.irradiation.min) {
                    setLayerSettings(prev => ({
                      ...prev,
                      irradiation: { ...prev.irradiation, max }
                    }))
                    if (mapRef.current) {
                      updateIrradiationLayer(mapRef.current, undefined, undefined, layerSettings.irradiation.min, max)
                    }
                  }
                }}
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{ zIndex: 2 }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>{layerSettings.irradiation.min}</span>
              <span>{layerSettings.irradiation.max}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
