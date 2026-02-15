'use client'

import { useState } from 'react'

export default function ChatInterface({ onScenarioUpdate }: { onScenarioUpdate: (data: any) => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    setLoading(true)
    setResult(null)
    onScenarioUpdate(null)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Check if OpenAI returned a map command
      if (data.mapCommand) {
        onScenarioUpdate(data.mapCommand)
      }
      
      setResult({ tradeoffs: [data.response] })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-4 z-50 bg-white p-2 rounded shadow-lg hover:bg-gray-100"
      >
        {isOpen ? '←' : '→'}
      </button>
      
      <div className={`absolute top-0 left-0 h-full bg-white shadow-lg transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '400px' }}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Renewable Siting Engine</h1>
            <p className="text-sm text-gray-600">California Infrastructure Optimization</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="bg-yellow-50 p-3 rounded mb-4">
                <div className="font-semibold">Processing...</div>
                <div className="text-sm">Asking OpenAI</div>
              </div>
            )}
            
            {result?.error && (
              <div className="bg-red-50 p-3 rounded mb-4">
                <div className="font-semibold">Error</div>
                <div className="text-sm">{result.error}</div>
              </div>
            )}
            
            {result?.tradeoffs && (
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-semibold mb-2">OpenAI Response</div>
                <div className="text-sm whitespace-pre-wrap">{result.tradeoffs[0]}</div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about solar optimization..."
              className="w-full p-2 border rounded mb-2"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
            >
              {loading ? 'Asking...' : 'Ask OpenAI'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
