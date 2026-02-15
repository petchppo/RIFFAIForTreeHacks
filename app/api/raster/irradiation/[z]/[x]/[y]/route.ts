import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: { z: string; x: string; y: string } }
) {
  const { z, x, y } = params
  const tiffPath = path.join(process.cwd(), 'public/data/california_irradiation_2025.tif')
  const pythonScript = path.join(process.cwd(), 'scripts/raster_tile.py')
  const venvPython = path.join(process.cwd(), 'venv/bin/python')
  
  try {
    const tile = await generateTile(venvPython, pythonScript, tiffPath, parseInt(x), parseInt(y), parseInt(z))
    
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

async function generateTile(pythonPath: string, scriptPath: string, tiffPath: string, x: number, y: number, z: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const python = spawn(pythonPath, [scriptPath, tiffPath, x.toString(), y.toString(), z.toString()])
    
    const chunks: Buffer[] = []
    
    python.stdout.on('data', (chunk) => {
      chunks.push(chunk)
    })
    
    python.stderr.on('data', (data) => {
      console.error('Python error:', data.toString())
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