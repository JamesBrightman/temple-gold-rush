# Temple Gold Rush

![Temple Gold Rush header](public/temple-hero.svg)

Multiplayer Incan Gold-inspired game built with Next.js, Socket.IO, and an in-memory game store.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - run Next.js + Socket.IO server locally
- `npm run build` - build production assets
- `npm start` - start production server
- `npm run lint` - run ESLint

## Architecture (short)

- UI: Next.js App Router (`src/app`, `src/components`)
- API routes: Next route handlers (`src/app/api/...`)
- Realtime: Socket.IO bridge (`src/lib/server/realtime.ts`)
- Game state: server-side store and rules (`src/lib/server/game-store.ts`)
