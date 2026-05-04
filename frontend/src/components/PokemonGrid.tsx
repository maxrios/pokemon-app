'use client'

import { Swords, X } from 'lucide-react'
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { Pokemon } from '@/types/pokemon'

import { useCollection } from '@/hooks/useCollection'
import { usePokemon } from '@/hooks/usePokemon'
import { useUser } from '@/hooks/useUser'
import { initiateBattle } from '@/lib/api'

import { PokemonCard } from './PokemonCard'
import { PokemonDialog } from './PokemonDialog'
import { Input } from './ui/input'

const SKELETON_COUNT = 20

export default function PokemonGrid() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState<null | Pokemon>(null)
  const [battleMode, setBattleMode] = useState(false)
  const [battleSelection, setBattleSelection] = useState<Pokemon[]>([])
  const [battleError, setBattleError] = useState<null | string>(null)
  const [battlePending, setBattlePending] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { hasNext, isLoading, loadMore, pokemon } = usePokemon(debouncedSearch)
  const { userId } = useUser()
  const { catchPokemon, ownedIds, ownedMongoIds, releasePokemon } = useCollection(userId)

  const toggleBattleMode = useCallback(() => {
    setBattleMode(prev => !prev)
    setBattleSelection([])
    setBattleError(null)
  }, [])

  const handleBattleCardClick = useCallback(
    (p: Pokemon) => {
      setBattleError(null)
      setBattleSelection(prev => {
        if (prev.some(s => s.id === p.id)) return prev.filter(s => s.id !== p.id)
        if (prev.length >= 2) return prev
        return [...prev, p]
      })
    },
    []
  )

  const handleStartBattle = useCallback(async () => {
    if (!userId || battleSelection.length !== 2) return
    const [p1, p2] = battleSelection
    const mongoId1 = ownedMongoIds.get(p1.id)
    const mongoId2 = ownedMongoIds.get(p2.id)
    if (!mongoId1 || !mongoId2) {
      setBattleError('Could not resolve pokemon IDs. Try refreshing.')
      return
    }
    setBattlePending(true)
    try {
      const { battle_id } = await initiateBattle(userId, mongoId1, mongoId2)
      router.push(`/battles/${battle_id}`)
    } catch {
      setBattleError('Failed to start battle. Please try again.')
      setBattlePending(false)
    }
  }, [userId, battleSelection, ownedMongoIds, router])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

  const handleClear = useCallback(() => {
    clearTimeout(debounceRef.current)
    setDebouncedSearch('')
    setSearch('')
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '0px 0px 200px 0px', threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const initialLoading = isLoading && pokemon.length === 0

  return (
    <div className="min-h-screen bg-pc-bg pb-32 text-white">
      <div className="flex items-center gap-3 px-4 pb-4 pt-6">
        <div className="relative flex-1">
          <Input
            className="border-pc-border bg-pc-card pr-8 text-white placeholder:text-white/40"
            onChange={handleChange}
            placeholder="Search for a Pokémon..."
            type="text"
            value={search}
          />
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              onClick={handleClear}
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${battleMode ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400' : 'border-pc-border bg-pc-card text-white/70 hover:text-white'}`}
          onClick={toggleBattleMode}
          type="button"
        >
          <Swords size={15} />
          Battle
        </button>
      </div>

      {battleMode && (
        <p className="px-4 pb-3 text-sm text-yellow-400/80">
          Select 2 of your Pokémon to battle ({battleSelection.length}/2)
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {initialLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                className="aspect-[3/4] animate-pulse rounded-lg border border-pc-border bg-pc-card"
                key={i}
              />
            ))
          : pokemon.map(p => (
              <PokemonCard
                battleMode={battleMode}
                key={p.id}
                onClick={battleMode ? () => handleBattleCardClick(p) : () => setSelectedPokemon(p)}
                owned={ownedIds.has(p.id)}
                pokemon={p}
                selected={battleSelection.some(s => s.id === p.id)}
              />
            ))}
      </div>

      {isLoading && pokemon.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pc-border border-t-pc-accent" />
        </div>
      )}

      {!hasNext && !isLoading && pokemon.length > 0 && (
        <p className="py-6 text-center text-white/60">No more Pokémon found.</p>
      )}

      <div ref={sentinelRef} />

      {battleMode && battleSelection.length === 2 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-pc-border bg-pc-bg p-4">
          <div className="mx-auto flex max-w-lg flex-col gap-3">
            <p className="text-center text-sm font-semibold capitalize text-white">
              {battleSelection[0].name}{' '}
              <span className="text-white/40">vs</span>{' '}
              {battleSelection[1].name}
            </p>
            {battleError && <p className="text-center text-xs text-red-400">{battleError}</p>}
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg border border-pc-border py-2 text-sm text-white/60 hover:text-white"
                onClick={() => { setBattleSelection([]); setBattleError(null) }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-yellow-400 py-2 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                disabled={battlePending}
                onClick={handleStartBattle}
                type="button"
              >
                {battlePending ? 'Starting…' : 'Battle!'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PokemonDialog
        onCatch={() => selectedPokemon && catchPokemon(selectedPokemon.id)}
        onClose={() => setSelectedPokemon(null)}
        onRelease={() => selectedPokemon && releasePokemon(selectedPokemon.id)}
        open={!!selectedPokemon && !battleMode}
        owned={selectedPokemon ? ownedIds.has(selectedPokemon.id) : false}
        pokemon={selectedPokemon}
      />
    </div>
  )
}
