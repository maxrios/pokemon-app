'use client'

import { useEffect, useState } from 'react'

import { BattleCard } from '@/components/BattleCard'
import { getBattles } from '@/lib/api'
import type { BattleSummary } from '@/types/pokemon'

export default function BattlesPage() {
  const [battles, setBattles] = useState<BattleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBattles()
      .then(setBattles)
      .catch(() => setError('Failed to load battle history.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-pc-bg p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Battle History</h1>

      {loading && <p className="text-white/50">Loading battles…</p>}

      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && battles.length === 0 && (
        <div className="flex flex-col items-center gap-2 pt-24 text-white/40">
          <p className="text-lg">No battles yet.</p>
          <p className="text-sm">Head to the Pokédex to start one!</p>
        </div>
      )}

      {battles.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {battles.map(battle => (
            <BattleCard battle={battle} key={battle.battle_id} />
          ))}
        </div>
      )}
    </main>
  )
}
