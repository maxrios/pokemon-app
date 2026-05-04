'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { getBattle } from '@/lib/api'
import type { BattleDetail, BattleTurn } from '@/types/pokemon'

const TURN_DELAY_MS = 1500

function hpPercent(current: number, max: number) {
  return Math.max(0, Math.round((current / max) * 100))
}

function hpBarColor(pct: number) {
  if (pct > 50) return 'bg-green-500'
  if (pct > 25) return 'bg-yellow-400'
  return 'bg-red-500'
}

function computeHp(battle: BattleDetail, upToIndex: number) {
  let p1 = battle.pokemon_one.hp
  let p2 = battle.pokemon_two.hp
  for (let i = 0; i < upToIndex; i++) {
    p1 -= battle.turns[i].damage_to_pokemon_one
    p2 -= battle.turns[i].damage_to_pokemon_two
  }
  return { p1Hp: Math.max(0, p1), p2Hp: Math.max(0, p2) }
}

function TurnLogEntry({ battle, turn }: { battle: BattleDetail; turn: BattleTurn }) {
  const p1 = battle.pokemon_one
  const p2 = battle.pokemon_two
  const firstAttacker = turn.first_attacker_id === p1.id ? p1 : p2
  const secondAttacker = firstAttacker === p1 ? p2 : p1
  const dmgFromFirst = firstAttacker === p1 ? turn.damage_to_pokemon_two : turn.damage_to_pokemon_one
  const dmgFromSecond = secondAttacker === p1 ? turn.damage_to_pokemon_two : turn.damage_to_pokemon_one

  return (
    <div className="rounded border border-pc-border bg-pc-card p-2 text-xs text-white/70">
      <span className="font-semibold text-white capitalize">{firstAttacker.name}</span>
      {' attacked for '}
      <span className="font-semibold text-red-400">{dmgFromFirst} dmg</span>
      {!turn.battle_over && dmgFromSecond > 0 && (
        <>
          {', '}
          <span className="font-semibold text-white capitalize">{secondAttacker.name}</span>
          {' struck back for '}
          <span className="font-semibold text-red-400">{dmgFromSecond} dmg</span>
        </>
      )}
      {turn.battle_over && (
        <span className="ml-1 font-semibold text-yellow-400"> — KO!</span>
      )}
    </div>
  )
}

export default function BattlePage() {
  const { battle_id } = useParams<{ battle_id: string }>()
  const [battle, setBattle] = useState<BattleDetail | null>(null)
  const [visibleTurns, setVisibleTurns] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'waiting' | 'playing' | 'done' | 'error'>('loading')
  const pollRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const playRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Load and poll until completed
  useEffect(() => {
    let cancelled = false

    async function fetchBattle() {
      try {
        const data = await getBattle(battle_id)
        if (cancelled) return
        if (data.status === 'completed') {
          setBattle(data)
          setPhase('playing')
        } else {
          setPhase('waiting')
          pollRef.current = setTimeout(fetchBattle, 1000)
        }
      } catch {
        if (!cancelled) setPhase('error')
      }
    }

    fetchBattle()
    return () => {
      cancelled = true
      clearTimeout(pollRef.current)
    }
  }, [battle_id])

  // Animate turns one by one
  useEffect(() => {
    if (phase !== 'playing' || !battle) return

    function playNextTurn(index: number) {
      if (!battle || index > battle.turns.length) {
        setPhase('done')
        return
      }
      setVisibleTurns(index)
      playRef.current = setTimeout(() => playNextTurn(index + 1), TURN_DELAY_MS)
    }

    playNextTurn(0)
    return () => clearTimeout(playRef.current)
  }, [phase, battle])

  // Scroll turn log to bottom as turns appear
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleTurns])

  if (phase === 'loading' || phase === 'waiting') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-pc-bg text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pc-border border-t-pc-accent" />
        <p className="text-white/50">{phase === 'waiting' ? 'Waiting for battle to start…' : 'Loading…'}</p>
      </main>
    )
  }

  if (phase === 'error' || !battle) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-pc-bg text-white">
        <p className="text-red-400">Battle not found.</p>
        <Link className="text-sm text-white/50 hover:text-white" href="/battles">← Battle History</Link>
      </main>
    )
  }

  const { p1Hp, p2Hp } = computeHp(battle, visibleTurns)
  const p1 = battle.pokemon_one
  const p2 = battle.pokemon_two
  const p1PctStart = hpPercent(p1Hp, p1.hp)
  const p2PctStart = hpPercent(p2Hp, p2.hp)
  const winner = battle.winner_id === p1.id ? p1 : p2
  const displayedTurns = battle.turns.slice(0, visibleTurns)

  return (
    <main className="min-h-screen bg-pc-bg text-white">

      {/* Arena */}
      <div className="flex items-end justify-center gap-6 px-6 py-4">
        <PokemonArenaSlot
          currentHp={p1Hp}
          fainted={p1Hp === 0}
          hpPct={p1PctStart}
          maxHp={p1.hp}
          pokemon={p1}
        />
        <span className="mb-16 text-2xl font-bold text-white/30">VS</span>
        <PokemonArenaSlot
          currentHp={p2Hp}
          fainted={p2Hp === 0}
          hpPct={p2PctStart}
          maxHp={p2.hp}
          pokemon={p2}
        />
      </div>

      {/* Victory banner */}
      {phase === 'done' && (
        <div className="mx-4 mb-4 rounded-lg border border-yellow-400 bg-yellow-400/10 py-3 text-center">
          <p className="text-lg font-bold text-yellow-400 capitalize">
            {winner.name} wins!
          </p>
        </div>
      )}

      {/* Turn log */}
      <div className="mx-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {displayedTurns.map(turn => (
          <TurnLogEntry battle={battle} key={turn.turn_number} turn={turn} />
        ))}
        {phase === 'playing' && visibleTurns < battle.turns.length && (
          <div className="flex justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-pc-border border-t-pc-accent" />
          </div>
        )}
        <div ref={logEndRef} />
      </div>
    </main>
  )
}

type ArenaSlotProps = {
  currentHp: number
  fainted: boolean
  hpPct: number
  maxHp: number
  pokemon: BattleDetail['pokemon_one']
}

function PokemonArenaSlot({ currentHp, fainted, hpPct, maxHp, pokemon }: ArenaSlotProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className={`relative h-32 w-32 transition-all duration-500 ${fainted ? 'opacity-30 grayscale' : ''}`}>
        <Image alt={pokemon.name} className="object-contain" fill sizes="128px" src={pokemon.image_url} />
      </div>
      <p className="font-semibold capitalize">{pokemon.name}</p>
      <div className="w-full max-w-[140px]">
        <div className="mb-1 flex justify-between text-xs text-white/50">
          <span>HP</span>
          <span>{currentHp}/{maxHp}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-700 ${hpBarColor(hpPct)}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
