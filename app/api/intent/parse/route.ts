import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Parse user intent into ScenarioRequest JSON.
Extract: capacity_mw, aoi_bounds (California region), constraints, objective_weights.
Default weights: {cost:0.3, yield:0.3, risk:0.2, zoning:0.1, social:0.1}
Default bounds: [[-121, 36], [-119, 38]] (Central California)
Return valid JSON only.`
        },
        { role: 'user', content: query }
      ],
      response_format: { type: 'json_object' }
    })
    
    const scenarioRequest = JSON.parse(response.choices[0].message.content || '{}')
    
    return NextResponse.json(scenarioRequest)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
