'use client'

import Image from 'next/image'

import type { Pokemon } from '@/types/pokemon'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { getTypeColor } from '@/lib/pokemon'

type PokemonDialogProps = {
  onClose: () => void
  open: boolean
  pokemon: null | Pokemon
}

export function PokemonDialog({ onClose, open, pokemon }: PokemonDialogProps) {
  return (
    <Dialog onOpenChange={(isOpen) => { if (!isOpen) onClose() }} open={open}>
      <DialogContent className="gap-0 overflow-hidden border-pc-border bg-pc-card p-0 text-white sm:max-w-md">
        {pokemon && (
          <>
            <DialogTitle className="sr-only">{pokemon.name}</DialogTitle>
            <div className="relative h-56 w-full">
              <Image
                alt={pokemon.name}
                className="object-cover"
                fill
                src={pokemon.imageUrl}
              />
            </div>
            <div className="overflow-y-auto p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold capitalize">{pokemon.name}</h2>
                {pokemon.isLegendary && (
                  <span className="rounded bg-yellow-500 px-2 py-0.5 text-xs font-semibold text-black">
                    Legendary
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {pokemon.types.map(type => (
                  <span
                    className={`rounded px-2 py-0.5 text-xs text-white ${getTypeColor(type)}`}
                    key={type}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(
                  [
                    ['HP', pokemon.hp],
                    ['Attack', pokemon.attack],
                    ['Defense', pokemon.defense],
                    ['Sp. Atk', pokemon.specialAttack],
                    ['Sp. Def', pokemon.specialDefense],
                    ['Speed', pokemon.speed],
                  ] as [string, number][]
                ).map(([label, value]) => (
                  <div
                    className="flex justify-between rounded bg-white/5 px-3 py-1.5"
                    key={label}
                  >
                    <span className="text-sm text-white/60">{label}</span>
                    <span className="text-sm font-bold">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/60">
                <span>Gen {pokemon.generation}</span>
                <span>Height: {pokemon.height}</span>
                <span>Weight: {pokemon.weight}</span>
              </div>
              <p className="mt-2 text-sm italic text-white/60">{pokemon.description}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
