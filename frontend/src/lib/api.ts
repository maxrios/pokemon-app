import type { BattleDetail, BattleSummary } from '@/types/pokemon'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<T>
}

export async function getBattle(battleId: string): Promise<BattleDetail> {
  return apiGet<BattleDetail>(`/battles/${battleId}`)
}

export async function getBattles(limit = 50): Promise<BattleSummary[]> {
  return apiGet<BattleSummary[]>(`/battles?limit=${limit}`)
}

export async function initiateBattle(
  userId: string,
  pokemonOneId: string,
  pokemonTwoId: string
): Promise<{ battle_id: string }> {
  return apiPost<{ battle_id: string }>('/battles', {
    user_id: userId,
    pokemon_one_id: pokemonOneId,
    pokemon_two_id: pokemonTwoId,
  })
}
