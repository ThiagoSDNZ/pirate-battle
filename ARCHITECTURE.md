# Architecture Notes

## Application boundaries

- **React** owns menus, settings, pause/result overlays, accessible controls and the ranking/history panels.
- **PixiJS** owns the real-time arena and entities. Simulation updates happen in the Pixi ticker; React receives a throttled HUD snapshot rather than per-frame state.
- **Axios** is the HTTP boundary for ranking, history and match submission.
- **TanStack Query** owns request lifecycle, caching, retries and invalidation of the two remote-style views.
- **MSW** intercepts `/api/*` so the deployed demo does not need a private service.

## Simulation

The ticker uses elapsed wall-clock time clamped to 40ms per step. Ship movement, rotation, cooldowns, projectile travel, enemy AI, spawns and match time all use `dt`. The arena uses fixed logical coordinates (960 × 600); the world container is scaled to fit the available viewport. The player and enemies are kept in a simulation collection, projectiles have a single owner and expire on collision, obstacle impact, bounds exit or lifetime expiry. Islands block movement and projectiles.

The current visual ship silhouettes are drawn with Pixi Graphics. The supplied PNG assets are used in the menu artwork; the full provided asset library remains in `assets/` for future visual enhancement. Graphics and event listeners are destroyed when the gameplay component unmounts or resets.

## Persistence and API consistency

Options, the latest result, confirmed mocked matches, the selected MSW scenario and a pending match submission are persisted in local storage. A match has a UUID idempotency key. The mock handler checks that ID before inserting a new record, so retrying a timed-out request does not duplicate it. The UI lets a new match start even when a prior submission is pending. The ranking is deterministic: score descending, then date ascending, and is filtered to the same gameplay configuration.

## Configuration

`GameConfig` currently exposes session duration (60–180 seconds) and enemy spawn interval (1–15 seconds). A game receives a snapshot of the selected config. Options are saved before starting the next session.

## Known limitations

This is the initial implementation pass. It includes the core loop, enemy types, projectiles, local persistence, simulated APIs and responsive controls, but the supplied challenge also expects a deeper visual regression baseline suite, reproducible simulation clock/seed controls, performance profiling evidence, full health bars above every ship, robust retry queue scheduling and a more exhaustive Playwright matrix. These should be completed and verified before treating the delivery as a fully scored final submission.
