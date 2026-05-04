'use client'

import { useEffect, useState } from 'react'

import { apiPost } from '@/lib/api'

type UserResponse = { id: string; name: string }

const USER_ID_KEY = 'pokemon_user_id'

export function useUser(): { isLoading: boolean; userId: null | string } {
  const [userId, setUserId] = useState<null | string>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(USER_ID_KEY)
    if (stored) {
      setUserId(stored)
      setIsLoading(false)
      return
    }

    const name = `trainer_${crypto.randomUUID().slice(0, 8)}`
    apiPost<UserResponse>('/users', { name })
      .then(user => {
        localStorage.setItem(USER_ID_KEY, user.id)
        setUserId(user.id)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { isLoading, userId }
}
