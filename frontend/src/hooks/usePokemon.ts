'use client'

import { useCallback, useEffect, useState } from 'react'

import type { ApiResponse, Pokemon } from '@/types/pokemon'

export function usePokemon(search: string): {
  hasNext: boolean
  isLoading: boolean
  loadMore: () => void
  pokemon: Pokemon[]
} {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Reset pagination when search changes
  useEffect(() => {
    setPage(1)
    setPokemon([])
  }, [search])

  // Fetch on page or search change; stale requests cancelled via cleanup
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    const params = new URLSearchParams({ limit: '20', page: String(page) })
    if (search) params.set('search', search)

    fetch(`/api/pokemon?${params}`)
      .then(res => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json() as Promise<ApiResponse>
      })
      .then(data => {
        if (!cancelled) {
          setPokemon(prev => (page === 1 ? data.data : [...prev, ...data.data]))
          setHasNext(data.pagination.hasNext)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, search])

  const loadMore = useCallback(() => {
    if (!isLoading && hasNext) setPage(prev => prev + 1)
  }, [isLoading, hasNext])

  return { hasNext, isLoading, loadMore, pokemon }
}
