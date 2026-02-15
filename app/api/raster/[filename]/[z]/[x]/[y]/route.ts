import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: Request,
  { params }: { params: { filename: string; z: string; x: string; y: string } }
) {
  const { filename, z, x, y } = params
  const url = new URL(request.url)
  const threshold = url.searchParams.get('threshold')
  const operator = url.searchParams.get('operator')
  const minVal = url.searchParams.get('min')
  const maxVal = url.searchParams.get('max')
  
  const tiffPath = path.join(process.cwd(), 'public/data', `${filename}.tif`)
  const pythonScript = path.join(process.cwd(), 'scripts/raster_tile.py')
  const venvPython = path.join(process.cwd(), 'venv/bin/python')
  
  if (!fs.existsSync(tiffPath)) {
    return NextResponse.json({ error: 'TIFF file not found' }, { status: 404 })
  }
  
  try {
    const tile = await generateTile(venvPython, pythonScript, tiffPath, parseInt(x), parseInt(y), parseInt(z), threshold, operator, minVal, maxVal)
    
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

async function generateTile(pythonPath: string, scriptPath: string, tiffPath: string, x: number, y: number, z: number, threshold?: string | null, operator?: string | null, minVal?: string | null, maxVal?: string | null): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const args = [scriptPath, tiffPath, x.toString(), y.toString(), z.toString()]
    if (threshold && operator) {
      args.push(threshold, operator)
      if (minVal && maxVal) {
        args.push(minVal, maxVal)
      }
    }
    
    const python = spawn(pythonPath, args)
    
    const chunks: Buffer[] = []
    
    python.stdout.on('data', (chunk) => {
      chunks.push(chunk)
    })
    
    python.stderr.on('data', (data) => {
      console.error('Python stderr:', data.toString())
    })
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks))
      } else {
        reject(new Error(`Python process exited with code ${code}`))
      }
    })
    
    python.on('error', reject)
  })
}