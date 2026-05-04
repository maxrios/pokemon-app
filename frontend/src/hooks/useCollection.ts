'use client'

import { useCallback, useEffect, useState } from 'react'

import { apiDelete, apiGet, apiPost } from '@/lib/api'

type CollectionEntry = {
  caught_at: string
  ownership_id: string
  pokemon: { id: string; pokemon_id: number }
}

export function useCollection(userId: null | string): {
  catchPokemon: (pokemonId: number) => Promise<void>
  ownedIds: Set<number>
  ownedMongoIds: Map<number, string>
  releasePokemon: (pokemonId: number) => Promise<void>
} {
  const [ownedIds, setOwnedIds] = useState<Set<number>>(new Set())
  const [ownedMongoIds, setOwnedMongoIds] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    if (!userId) return
    apiGet<CollectionEntry[]>(`/users/${userId}/collection`)
      .then(entries => {
        setOwnedIds(new Set(entries.map(e => e.pokemon.pokemon_id)))
        setOwnedMongoIds(new Map(entries.map(e => [e.pokemon.pokemon_id, e.pokemon.id])))
      })
      .catch(console.error)
  }, [userId])

  const catchPokemon = useCallback(
    async (pokemonId: number) => {
      if (!userId) return
      await apiPost(`/users/${userId}/collection`, { pokemon_id: pokemonId })
      setOwnedIds(prev => new Set([pokemonId, ...prev]))
    },
    [userId]
  )

  const releasePokemon = useCallback(
    async (pokemonId: number) => {
      if (!userId) return
      await apiDelete(`/users/${userId}/collection/${pokemonId}`)
      setOwnedIds(prev => {
        const next = new Set(prev)
        next.delete(pokemonId)
        return next
      })
    },
    [userId]
  )

  return { catchPokemon, ownedIds, ownedMongoIds, releasePokemon }
}
