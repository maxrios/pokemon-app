# Pokemon PC — Task Tracker

Agents: mark your task `[x]` when done. Add a one-line note if you hit anything unexpected.

---

## Wave 1
- [x] **FOUNDATION** — Extract `Pokemon` type to `src/types/pokemon.ts`; add PC theme tokens to `globals.css`

## Wave 2
- [x] **1A** — `usePokemon` hook (`src/hooks/usePokemon.ts`) · _requires: FOUNDATION_ — note: project has `perfectionist` ESLint rules requiring sorted imports/object keys

## Wave 3
- [x] **1B** — Scroll sentinel + IntersectionObserver (inside `PokemonGrid.tsx`) · _requires: 1A_
- [x] **1C** — PC grid shell + skeleton loaders (`PokemonGrid.tsx` layout) · _requires: 1A_
- [x] **2A** — Debounced search input wired to `usePokemon` · _requires: 1A_

## Wave 4
- [x] **3A** — `PokemonCard` default view (`src/components/PokemonCard.tsx`) · _requires: 1C_

## Wave 5
- [x] **3B** — `PokemonDialog` expanded view (`src/components/PokemonDialog.tsx`) · _requires: 3A_

## Notes
<!-- Agents: drop any cross-cutting observations here -->
- 1B/1C/2A: All implemented in one `PokemonGrid.tsx` rewrite. `colors`/`getTypeColor` exported (not moved) for 3A to migrate to `src/lib/pokemon.ts`. React 19 `useRef` requires explicit initial value — use `useRef<T | undefined>(undefined)` not `useRef<T>()`. Perfectionist sorts internal type imports into a separate group above internal value imports.
- 3A: `colors`/`getTypeColor` moved to `src/lib/pokemon.ts`. `PokemonCard` uses `next/image fill` + gradient footer overlay; `picsum.photos` added to `next.config.ts` remotePatterns. `onClick` is a no-op for now — 3B will wire the selected state and dialog.
- 3B: shadcn `dialog` install imports `Button` which doesn't exist — patched `DialogFooter` to remove that dependency. ESLint `--fix` needed to satisfy perfectionist rules on the generated file.
