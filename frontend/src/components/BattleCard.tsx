'use client'

import Image from 'next/image'
import Link from 'next/link'

import type { BattleSummary } from '@/types/pokemon'

type BattleCardProps = {
  battle: BattleSummary
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
}

export function BattleCard({ battle }: BattleCardProps) {
  const { pokemon_one, pokemon_two, winner_id, started_at, battle_id } = battle

  const p1Won = winner_id === pokemon_one.id
  const p2Won = winner_id === pokemon_two.id
  const formattedDate = new Date(started_at).toLocaleDateString(undefined, DATE_FORMAT)

  return (
    <>
      {/* Mobile card row */}
      <tr className="border-b border-pc-border md:hidden">
        <td colSpan={5} className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold capitalize text-white">{pokemon_one.name}</span>
              <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 text-xs font-black uppercase tracking-widest text-white">
                vs
              </span>
              <span className="font-bold capitalize text-white">{pokemon_two.name}</span>
            </div>

            <div className="flex items-end justify-center gap-12">
              <PokemonSlot pokemon={pokemon_one} winner={p1Won} />
              <PokemonSlot pokemon={pokemon_two} winner={p2Won} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">{formattedDate}</span>
              <Link
                className="rounded bg-[--pc-accent] px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-80"
                href={`/battles/${battle_id}`}
              >
                Watch Battle
              </Link>
            </div>
          </div>
        </td>
      </tr>

      {/* Desktop table row */}
      <tr className="hidden border-b border-pc-border transition-colors hover:bg-white/5 md:table-row">
        <td className="px-4 py-3 text-center">
          <PokemonSlot pokemon={pokemon_one} winner={p1Won} />
        </td>

        <td className="px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="flex-1 text-right text-base font-bold capitalize tracking-wide text-white">
              {pokemon_one.name}
            </span>
            <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 text-xs font-black uppercase tracking-widest text-white">
              vs
            </span>
            <span className="flex-1 text-left text-base font-bold capitalize tracking-wide text-white">
              {pokemon_two.name}
            </span>
          </div>
        </td>

        <td className="px-4 py-3 text-center">
          <PokemonSlot pokemon={pokemon_two} winner={p2Won} />
        </td>

        <td className="whitespace-nowrap px-4 py-3 text-sm text-white/50">{formattedDate}</td>

        <td className="px-4 py-3">
          <Link
            className="rounded bg-[--pc-accent] px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-80"
            href={`/battles/${battle_id}`}
          >
            Watch Battle
          </Link>
        </td>
      </tr>
    </>
  )
}

type PokemonSlotProps = {
  pokemon: BattleSummary['pokemon_one']
  winner: boolean
}

function PokemonSlot({ pokemon, winner }: PokemonSlotProps) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="flex h-5 items-center justify-center">
        {winner && (
          <span className="rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
            WIN
          </span>
        )}
      </div>
      <div className="relative h-12 w-12 flex-shrink-0">
        <Image
          alt={pokemon.name}
          className={`object-contain ${!winner ? 'opacity-40 grayscale' : ''}`}
          fill
          sizes="48px"
          src={pokemon.image_url}
        />
      </div>
    </div>
  )
}
