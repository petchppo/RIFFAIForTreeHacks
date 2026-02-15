'use client'

import { useState } from 'react'
import Map from '@/components/MapOptimized'
import Sidebar from '@/components/Sidebar'

export default function Home() {
  const [scenarioData, setScenarioData] = useState(null)

  return (
    <main className="relative h-screen overflow-hidden">
      <Sidebar onScenarioUpdate={setScenarioData} />
      <Map scenarioData={scenarioData} />
    </main>
  )
}
