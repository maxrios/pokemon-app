'use client'

import Image from 'next/image'

import type { Pokemon } from '@/types/pokemon'

import { getTypeColor } from '@/lib/pokemon'

type PokemonCardProps = {
  onClick: () => void
  pokemon: Pokemon
}

export function PokemonCard({ onClick, pokemon }: PokemonCardProps) {
  return (
    <div
      className="relative aspect-[3/4] cursor-pointer overflow-hidden rounded-lg border border-pc-border bg-pc-card transition hover:scale-[1.02] hover:border-[--pc-accent]"
      onClick={onClick}
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
