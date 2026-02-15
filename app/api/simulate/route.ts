import { NextResponse } from 'next/server'
import { simulateScenario, ScenarioRequest } from '@/lib/simulation-engine'

export async function POST(req: Request) {
  try {
    const scenarioRequest: ScenarioRequest = await req.json()
    const result = await simulateScenario(scenarioRequest)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
