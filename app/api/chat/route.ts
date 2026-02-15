import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a GIS assistant. Parse user requests for map operations. If user asks to filter/show/display irradiation data with range values, respond with JSON: {"action":"set_range","layer":"irradiation","min":number,"max":number}. If user asks to adjust opacity, respond with JSON: {"action":"set_opacity","layer":"irradiation","opacity":0.0-1.0}. For other requests, respond normally.'
        }, {
          role: 'user', 
          content: message 
        }],
        max_tokens: 1000
      })
    })
    
    const result = await response.json()
    const content = result.choices[0].message.content
    
    // Try to parse as JSON for map commands
    try {
      const parsed = JSON.parse(content)
      if (parsed.action) {
        return NextResponse.json({ mapCommand: parsed, response: content })
      }
    } catch {
      // Not JSON, return as regular response
    }
    
    return NextResponse.json({ response: content })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get OpenAI response' }, { status: 500 })
  }
}