'use client'

import Image from 'next/image'

import type { Pokemon } from '@/types/pokemon'

import { getTypeColor } from '@/lib/pokemon'

type PokemonCardProps = {
  battleMode?: boolean
  onClick: () => void
  owned: boolean
  pokemon: Pokemon
  selected?: boolean
}

export function PokemonCard({ battleMode, onClick, owned, pokemon, selected }: PokemonCardProps) {
  const unselectable = battleMode && !owned
  return (
    <div
      className={[
        'relative aspect-[3/4] overflow-hidden rounded-lg border bg-pc-card transition',
        unselectable
          ? 'cursor-not-allowed opacity-30 grayscale'
          : 'cursor-pointer hover:scale-[1.02]',
        selected
          ? 'border-yellow-400 ring-2 ring-yellow-400'
          : 'border-pc-border hover:border-[--pc-accent]',
        !battleMode && !owned ? 'opacity-50 grayscale' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={unselectable ? undefined : onClick}
    >
      <Image
        alt={pokemon.name}
        className="object-cover"
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        src={pokemon.imageUrl}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-center text-sm font-bold capitalize text-white">{pokemon.name}</p>
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          {pokemon.types.map(type => (
            <span
              className={`rounded px-1.5 py-0.5 text-xs text-white ${getTypeColor(type)}`}
              key={type}
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
