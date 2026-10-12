# Pirate Battle

A single-player naval arcade game built with **React, TypeScript and PixiJS**. The game features real-time naval combat, configurable sessions, pause and resume controls, audio settings, and a ranking and match history system powered by simulated REST APIs.

The project uses **Axios, TanStack Query and Mock Service Worker (MSW)** to simulate API responses without requiring private backend services. End-to-end tests are written with **Playwright**.

## Features

- Top-down naval combat with keyboard and touch controls.
- Configurable session duration and enemy spawn interval.
- Pause and resume functionality.
- Audio controls and ocean ambience.
- Ranking and match history.
- API simulation scenarios for successful, empty, delayed and failed requests.
- Local persistence for gameplay settings and pending match submissions.
- Desktop and mobile end-to-end test projects.

## Requirements

- Node.js 20+
- npm 10+

## Getting Started

Clone the repository and enter the project directory:

```bash
git clone https://github.com/ThiagoSDNZ/pirate-battle.git
cd pirate-battle
```

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Follow the local URL printed in the terminal to open the game.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Runs the TypeScript project build and creates the production bundle |
| `npm run preview` | Serves the production build locally |
| `npm run typecheck` | Checks TypeScript types |
| `npm run lint` | Runs ESLint |
| `npm run test:e2e` | Runs Playwright end-to-end tests |
| `npm run test:e2e:report` | Opens the test report, if configured by the project |

## Controls

| Key | Action |
|---|---|
| `W` / `↑` | Move forward |
| `A` / `←` | Rotate left |
| `D` / `→` | Rotate right |
| `Space` | Fire the front cannon |
| `Q` | Fire the left broadside |
| `E` | Fire the right broadside |

Use the in-game **Pause** button to pause or resume a match. Touch devices also provide on-screen controls.

The sound button toggles audio. Low-volume ocean ambience plays in the menu, while gameplay sound effects play during a match.

## Gameplay Options

- **Session duration:** configurable from 60 to 180 seconds.
- **Enemy spawn interval:** configurable from 1 to 15 seconds.
- **Persistence:** options are saved in local storage.
- **Configuration snapshot:** each session uses the settings selected when it starts.

## API Simulation

Use the **API Simulation** selector in the main menu to test different backend conditions:

- **Normal:** regular responses.
- **Empty lists:** empty ranking and match history.
- **Slow responses:** delayed API responses.
- **Network offline:** simulated connection failures.
- **HTTP 503:** simulated server errors.

Use **Reset** to clear confirmed mock records and pending submission state.

The selected scenario persists locally. Match IDs are idempotent, and pending records are retained locally after request failures and retried when returning to the menu.

## Testing

Install the Playwright browser dependencies:

```bash
npx playwright install
```

Run the end-to-end tests:

```bash
npm run test:e2e
```

Create a production build:

```bash
npm run build
```

The current test suite covers the main menu, gameplay options, and starting, pausing and resuming a match across desktop and mobile browser projects.

## Deployment

Build the project with:

```bash
npm run build
```

Deploy the generated `dist/` directory to a static hosting provider such as Vercel, Netlify or Cloudflare Pages.

The MSW service worker is generated into the `assets/` directory by the `postinstall` script. If lifecycle scripts are skipped by your package manager, initialize it before building:

```bash
npx msw init assets --save
```

## Architecture

See [ARCHITECTURE.md](https://github.com/ThiagoSDNZ/pirate-battle/blob/main/ARCHITECTURE.md) for details about the React/PixiJS boundary, game simulation, API mocks and persistence decisions.
