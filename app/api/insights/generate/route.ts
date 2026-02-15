import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { simulationResult } = await req.json()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Generate structured insights from simulation results.
Explain tradeoffs, dominant constraints, and capital risk implications.
Use only provided numeric data. Never invent numbers.`
        },
        { 
          role: 'user', 
          content: JSON.stringify(simulationResult) 
        }
      ]
    })
    
    return NextResponse.json({ 
      insights: response.choices[0].message.content 
    })
  } catch (error: any) {
    return NextResponse.json({ insights: 'Error generating insights: ' + error.message })
  }
}
