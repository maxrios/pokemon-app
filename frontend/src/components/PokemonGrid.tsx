'use client'

import { X } from 'lucide-react'
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'

import type { Pokemon } from '@/types/pokemon'

import { usePokemon } from '@/hooks/usePokemon'

import { PokemonCard } from './PokemonCard'
import { PokemonDialog } from './PokemonDialog'
import { Input } from './ui/input'

const SKELETON_COUNT = 20

export default function PokemonGrid() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedPokemon, setSelectedPokemon] = useState<null | Pokemon>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { hasNext, isLoading, loadMore, pokemon } = usePokemon(debouncedSearch)

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
    <div className="min-h-screen bg-pc-bg text-white">
      <div className="flex justify-center px-4 pb-4 pt-6">
        <div className="relative w-full max-w-[400px]">
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
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {initialLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                className="aspect-[3/4] animate-pulse rounded-lg border border-pc-border bg-pc-card"
                key={i}
              />
            ))
          : pokemon.map(p => (
              <PokemonCard key={p.id} onClick={() => setSelectedPokemon(p)} pokemon={p} />
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

      <PokemonDialog
        onClose={() => setSelectedPokemon(null)}
        open={!!selectedPokemon}
        pokemon={selectedPokemon}
      />
    </div>
  )
}
