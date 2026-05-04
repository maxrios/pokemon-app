'use client'

import Image from 'next/image'
import Link from 'next/link'

import type { BattleSummary } from '@/types/pokemon'

type BattleCardProps = {
  battle: BattleSummary
}

export function BattleCard({ battle }: BattleCardProps) {
  const { pokemon_one, pokemon_two, winner_id, started_at, battle_id } = battle

  const p1Won = winner_id === pokemon_one.id
  const p2Won = winner_id === pokemon_two.id

  return (
    <div className="flex w-72 flex-shrink-0 flex-col gap-3 rounded-lg border border-pc-border bg-pc-card p-4">
      <div className="flex items-center gap-2">
        <PokemonSlot pokemon={pokemon_one} winner={p1Won} />
        <span className="text-sm font-bold text-white/40">VS</span>
        <PokemonSlot pokemon={pokemon_two} winner={p2Won} />
      </div>

      <div className="text-center text-xs text-white/40">
        {new Date(started_at).toLocaleDateString(undefined, {
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          month: 'short',
        })}
      </div>

      <Link
        className="rounded bg-[--pc-accent] px-3 py-1.5 text-center text-sm font-semibold text-white transition hover:opacity-80"
        href={`/battles/${battle_id}`}
      >
        Watch Battle
      </Link>
    </div>
  )
}

type PokemonSlotProps = {
  pokemon: BattleSummary['pokemon_one']
  winner: boolean
}

function PokemonSlot({ pokemon, winner }: PokemonSlotProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-1">
      {winner && (
        <span className="absolute -top-1 right-0 rounded bg-yellow-500 px-1 py-0.5 text-[10px] font-bold text-black">
          WIN
        </span>
      )}
      <div className="relative h-16 w-16">
        <Image
          alt={pokemon.name}
          className={`object-contain ${!winner && 'opacity-50 grayscale'}`}
          fill
          sizes="64px"
          src={pokemon.image_url}
        />
      </div>
      <span className="max-w-full truncate text-center text-xs capitalize text-white/80">
        {pokemon.name}
      </span>
    </div>
  )
}
