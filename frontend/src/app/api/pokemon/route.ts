import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

const BACKEND_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type BackendPokemon = {
  attack: number
  defense: number
  description: string
  generation: number
  height: number
  hp: number
  id: string
  image_url: string
  name: string
  pokemon_id: number
  special_attack: number
  special_defense: number
  speed: number
  types: string[]
  weight: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const search = searchParams.get('search') ?? ''

    const res = await fetch(`${BACKEND_URL}/pokemon`)
    if (!res.ok) throw new Error(`Backend returned ${res.status}`)
    const raw = (await res.json()) as BackendPokemon[]
    let pokemon = raw.map(toPokemon)

    if (search) {
      const q = search.toLowerCase()
      pokemon = pokemon.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.types.some(t => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      )
    }

    const total = pokemon.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginatedPokemon = pokemon.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      data: paginatedPokemon,
      pagination: {
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit,
        page,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching Pokemon:', error)
    return NextResponse.json({ error: 'Failed to fetch Pokemon' }, { status: 500 })
  }
}

function toPokemon(p: BackendPokemon) {
  return {
    attack: p.attack,
    defense: p.defense,
    description: p.description,
    generation: p.generation,
    height: p.height,
    hp: p.hp,
    id: p.pokemon_id,
    imageUrl: p.image_url,
    name: p.name,
    specialAttack: p.special_attack,
    specialDefense: p.special_defense,
    speed: p.speed,
    types: p.types,
    weight: p.weight,
  }
}
