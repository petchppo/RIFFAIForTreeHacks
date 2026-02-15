import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { fromArrayBuffer } from 'geotiff'
import sharp from 'sharp'

// Simple tile bounds calculation
function tileToBounds(x: number, y: number, z: number) {
  const n = Math.pow(2, z)
  const lonDeg = (x / n) * 360.0 - 180.0
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)))
  const latDeg = (latRad * 180.0) / Math.PI
  
  const lonDeg2 = ((x + 1) / n) * 360.0 - 180.0
  const latRad2 = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n)))
  const latDeg2 = (latRad2 * 180.0) / Math.PI
  
  return [lonDeg, latDeg2, lonDeg2, latDeg] // [west, south, east, north]
}

async function generateTile(
  tiffBuffer: Buffer,
  x: number,
  y: number,
  z: number,
  minVal?: number,
  maxVal?: number
): Promise<Buffer> {
  try {
    const tiff = await fromArrayBuffer(tiffBuffer.buffer.slice(0))
    const image = await tiff.getImage()
    const rasters = await image.readRasters()
    const data = rasters[0] as Float32Array
    
    const [width, height] = [image.getWidth(), image.getHeight()]
    const bbox = image.getBoundingBox()
    
    // Get tile bounds
    const tileBounds = tileToBounds(x, y, z)
    
    // Check if tile intersects raster
    if (tileBounds[2] <= bbox[0] || tileBounds[0] >= bbox[2] || 
        tileBounds[3] <= bbox[1] || tileBounds[1] >= bbox[3]) {
      return createEmptyTile()
    }
    
    // Simple nearest neighbor sampling for tile generation
    const tileSize = 256
    const rgba = new Uint8Array(tileSize * tileSize * 4)
    
    const xScale = (bbox[2] - bbox[0]) / width
    const yScale = (bbox[3] - bbox[1]) / height
    const tileXScale = (tileBounds[2] - tileBounds[0]) / tileSize
    const tileYScale = (tileBounds[3] - tileBounds[1]) / tileSize
    
    for (let ty = 0; ty < tileSize; ty++) {
      for (let tx = 0; tx < tileSize; tx++) {
        const worldX = tileBounds[0] + tx * tileXScale
        const worldY = tileBounds[3] - ty * tileYScale // Flip Y
        
        // Convert to raster coordinates
        const rasterX = Math.floor((worldX - bbox[0]) / xScale)
        const rasterY = Math.floor((bbox[3] - worldY) / yScale)
        
        if (rasterX >= 0 && rasterX < width && rasterY >= 0 && rasterY < height) {
          const value = data[rasterY * width + rasterX]
          
          if (value > 0 && (!minVal || value >= minVal) && (!maxVal || value <= maxVal)) {
            const displayMin = minVal || 0
            const displayMax = maxVal || 2500
            const normalized = Math.max(0, Math.min(1, (value - displayMin) / (displayMax - displayMin)))
            
            const idx = (ty * tileSize + tx) * 4
            rgba[idx] = Math.floor(normalized * 255)     // Red
            rgba[idx + 1] = Math.floor(Math.sin(normalized * Math.PI) * 255) // Green
            rgba[idx + 2] = Math.floor((1 - normalized) * 255) // Blue
            rgba[idx + 3] = 200 // Alpha
          }
        }
      }
    }
    
    return sharp(rgba, {
      raw: { width: tileSize, height: tileSize, channels: 4 }
    }).png().toBuffer()
    
  } catch (error) {
    console.error('Tile generation error:', error)
    return createEmptyTile()
  }
}

function createEmptyTile(): Buffer {
  const tileSize = 256
  const rgba = new Uint8Array(tileSize * tileSize * 4) // All zeros = transparent
  return sharp(rgba, {
    raw: { width: tileSize, height: tileSize, channels: 4 }
  }).png().toBuffer()
}

export async function GET(
  request: Request,
  { params }: { params: { filename: string; z: string; x: string; y: string } }
) {
  const { filename, z, x, y } = params
  const url = new URL(request.url)
  const minVal = url.searchParams.get('min')
  const maxVal = url.searchParams.get('max')
  
  const tiffPath = path.join(process.cwd(), 'public/data', `${filename}.tif`)
  
  if (!fs.existsSync(tiffPath)) {
    return NextResponse.json({ error: 'TIFF file not found' }, { status: 404 })
  }
  
  try {
    const tiffBuffer = fs.readFileSync(tiffPath)
    const tile = await generateTile(
      tiffBuffer,
      parseInt(x),
      parseInt(y),
      parseInt(z),
      minVal ? parseFloat(minVal) : undefined,
      maxVal ? parseFloat(maxVal) : undefined
    )
    
    return new NextResponse(tile, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Tile generation error:', error)
    return NextResponse.json({ error: 'Tile generation failed' }, { status: 500 })
  }
}