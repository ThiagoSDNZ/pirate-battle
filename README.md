# Pirate Battle

A single-player top-down naval arcade game built with React, strict TypeScript and PixiJS. Ranking and Match History use Axios, TanStack Query and MSW-backed REST mocks so the public build works without private services.

## Requirements

- Node.js 20+
- npm 10+

## Run locally

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev          # local development
npm run build        # strict TypeScript check and production build
npm run preview      # serve production build locally
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run test:e2e     # Playwright desktop and mobile projects
npm run test:e2e:report
```

## Controls

- `W` / `↑`: move forward
- `A` / `←`: rotate left
- `D` / `→`: rotate right
- `Space`: front cannon
- `Q`: left broadside
- `E`: right broadside
- Pause with the in-game Pause button. On touch devices, use the on-screen controls.
- Use the sound button to toggle audio; low-volume ocean ambience plays on the menu, while gameplay effects play during a match.

## Gameplay options

Session duration is configurable from 60 to 180 seconds. Enemy spawn interval is configurable from 1 to 15 seconds. Options persist in local storage and each session receives a config snapshot.

## API mock scenarios

The menu includes an API Simulation selector:

- **Normal** — regular responses
- **Empty lists** — empty ranking/history
- **Slow responses** — delayed responses
- **Network offline** — simulated connection failure
- **HTTP 503** — simulated server failure

Use **Reset** to clear confirmed mock records and pending submission state. The current scenario is persisted locally. Match IDs are idempotent; pending records are kept locally after request failures and retried when returning to the menu.

## Deployment

Build with `npm run build` and deploy the generated `dist/` folder to a static host such as Vercel, Netlify or Cloudflare Pages. The MSW service worker is generated automatically by the `postinstall` script into the public asset directory (`assets/`). If your package manager skips lifecycle scripts, run `npx msw init assets --save` once before building.

## Notes

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the React/PixiJS boundary, simulation, API mocks and persistence decisions.
