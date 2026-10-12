# Project Continuation Context

## Goal
Complete the supplied Jungle Gaming React + PixiJS Pirate Battle hiring challenge. The goal is a working, presentable project that fulfills as many of the stated requirements as possible, not an over-engineered rewrite.

## Repository state
- Original source ZIP was mostly the challenge README and 520 supplied assets; it did not contain a React app, package manifest, source code, or tests.
- Scaffolded a Vite + React + strict TypeScript app.
- Added PixiJS game loop with player movement, rotation, front/broadside shots, islands, Chaser and Shooter enemies, projectile collision, health/score/time, pause and touch controls.
- Added Options and result screens, responsive styling, assets-based menu artwork.
- Added Axios API client, TanStack Query queries/mutation, MSW handlers for ranking/history and network scenarios.
- Added local options/result persistence and pending submission storage/idempotency in mock API.
- Added initial Playwright tests and ARCHITECTURE.md / README.

## Important current issues / next actions
1. Install dependencies and run `npm run build`; resolve TypeScript/PixiJS API errors.
2. Generate the MSW service worker: `npx msw init assets --save` because Vite uses `assets` as `publicDir`. Verify production mock APIs.
3. Test game play manually. Improve auto-pause: current visibility handler flips an internal pause ref, but no visible resume UI is automatically surfaced. Prefer callback to App to set paused state.
4. Add health bars above every ship; current HUD has health/score/time but per-ship health bars are not yet rendered.
5. Fix projectile lifetime/cleanup, test island collisions and enemy AI, add reproducible seed/clock test hooks.
6. Improve retry queue so a failed pending match is retried without creating repeated React effect submissions.
7. Add tests for network failures, match result, touch controls, collisions/combat and API pagination; add visual baselines and profiling report if feasible.
8. Generate package-lock.json with npm install and include it in the submission.
9. Build, preview and deploy to a public URL. No deployment credentials are currently available in this workspace.

## Run
`npm install`, `npx msw init assets --save`, `npm run dev`.

## Stable project facts
- Public assets are served from `/` because `vite.config.ts` sets `publicDir: 'assets'`.
- Gameplay logical dimensions are 960 × 600.
- Options: session time 60–180 seconds; spawn interval 1–15 seconds.
- Controls: W/Up move, A/Left rotate left, D/Right rotate right, Space front shot, Q/E broadside.


## Follow-up fixes (2026-10-11)
- Ranking's three visible captain names are seeded mock API fixtures; the challenge requires a paginated ranking API, but does not mandate those names or a pre-populated ranking.
- Added three clearly demo-style local-player match-history fixtures so the Match History tab demonstrates date, score, duration and end reason before a real match is completed. The Empty lists scenario still returns no rows.
- Made Pixi and Canvas fallback canvases absolutely fill the arena host, preventing the canvas from retaining a fixed-width centered layout and leaving part of the arena blank.
- Still run `npm install`, `npm run build`, and browser checks locally before submission.
