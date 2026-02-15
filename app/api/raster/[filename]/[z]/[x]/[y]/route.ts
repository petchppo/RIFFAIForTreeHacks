import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { generateTile } from '../../../../../lib/raster-utils'

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