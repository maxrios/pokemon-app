// Shape returned by the backend battle endpoints (snake_case from FastAPI)
export type BattlePokemon = {
  id: string
  name: string
  types: string[]
  hp: number
  image_url: string
  speed: number
}

export type BattleTurn = {
  turn_number: number
  first_attacker_id: string
  damage_to_pokemon_one: number
  damage_to_pokemon_two: number
  battle_over: boolean
}

export type BattleDetail = BattleSummary & {
  turns: BattleTurn[]
}

export type BattleSummary = {
  battle_id: string
  trainer_id: string
  status: string
  started_at: string
  ended_at: string | null
  pokemon_one: BattlePokemon
  pokemon_two: BattlePokemon
  winner_id: string | null
}

export type ApiResponse = {
  data: Pokemon[]
  pagination: {
    hasNext: boolean
    hasPrev: boolean
    limit: number
    page: number
    total: number
    totalPages: number
  }
}

export type Pokemon = {
  attack: number
  defense: number
  description: string
  generation: number
  height: number
  hp: number
  id: number
  imageUrl: string
  isLegendary?: boolean
  name: string
  specialAttack: number
  specialDefense: number
  speed: number
  types: string[]
  weight: number
}
