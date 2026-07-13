# Pitch Legends

A football arcade game with a career mode, imported from Lovable. Built with
TanStack Start (React 19 + Vite + Nitro/SSR), Tailwind CSS v4, and shadcn/ui
(Radix UI) components. Package manager is **bun**.

## Structure
- `src/routes/` — TanStack Start file-based routes (career hub, calendar,
  squad, stats, table, transfers, match, settings).
- `src/components/career/` — career mode UI (crest, layout).
- `src/components/match/match-simulation.tsx` — the fast-forward "sim mode"
  placeholder (SVG-animated), used when `/match?mode=sim`. Not the real
  gameplay engine.
- `src/game/` — the real match gameplay engine, built with **Phaser** (v4,
  API-compatible with the Phaser 3 Scale config the project was designed
  around). `create-match-game.ts` boots the `Phaser.Game` instance;
  `match-scene.ts` is the actual gameplay `Scene`.
- `src/routes/match.tsx` — the match screen. `MatchViewport` owns the
  `#match-canvas-root` div and mounts/destroys the Phaser game via a
  `useEffect` (dynamic `import()` of `src/game/create-match-game.ts`, so
  Phaser — a browser-only lib that touches `navigator` at module init —
  never gets pulled into the SSR module graph).
- `src/lib/career-data.ts` — mock club/fixture data driving career mode.

## Running the app
- Workflow **"Start application"** runs `bun run dev` (Vite dev server) on
  port 5000.
- Build: `bun run build`. Preview build: `bun run preview`.

## Environment notes
- The base Vite config comes from `@lovable.dev/vite-tanstack-config`
  (see comment at the top of `vite.config.ts` — do not add its bundled
  plugins manually). That package unconditionally binds the dev server to
  host `"::"` (IPv6 any-interface) outside the Lovable sandbox, which this
  container's network stack rejects (`EAFNOSUPPORT`). `vite.config.ts`
  overrides `server.host`/`server.port` via the `vite` option to
  `0.0.0.0:5000` so it works on Replit — this only works because
  non-sandbox mode merges the user's `vite` config *after* its own
  defaults.

## User preferences
- Keep the existing React/UI structure, routing, and screens as-is when
  adding the Phaser game layer — only touch the game engine layer itself.
