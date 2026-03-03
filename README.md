# mewcat_tracker

`mewcat_tracker` is a companion planning tool for **Mewgenics**.

It is designed to run alongside the game and help players make faster breeding
decisions by organizing cats into rooms, surfacing strong pairings, and reducing
manual comparison work.

This project is **not** a cheat tool, save editor, or gameplay automation layer.
It does not modify cats or write changes back into the game.

## What The App Does

- decode a supported Mewgenics `.sav` file into CSV from the web UI
- import cat CSV data into a browser-based planner
- sort and filter cats by name, total stats, and individual stats
- group cats into rooms with drag-and-drop or quick-move controls
- highlight strong pairings based on complementary perfect 7s and overall stat ceilings
- auto-assign eligible unassigned cats using the current heuristic planner
- save and reload room plans as JSON files

## Current Tech Stack

### Frontend

- React 19
- TypeScript 5
- Vite 7
- Material UI 7
- PapaParse

### Local tooling

- Python 3.11+ for save decoding
- Node.js 20+ recommended
- npm 10+ recommended

## Technical Requirements

You need all of the following to use the full workflow:

1. A local Node.js + npm environment to run the web app.
2. A local Python installation available from the command line as `python` or `py -3`.
3. A Mewgenics `.sav` file that is actually an SQLite save database supported by
   `decompress.py`.
4. A modern browser.

Important limitation:

- The `.sav` decode button works through the local Vite server middleware. The browser
  cannot run Python directly.
- Because of that, the decode flow is intended for local development or local personal
  use, not static hosting.

## Installation

From the repo root:

```bash
cd mewcat_tracker
npm install
cd ui
npm install
```

Notes:

- The root `package.json` is minimal. Most app work happens inside `ui/`.
- `decompress.py` currently uses Python standard library modules only, so there is no
  separate Python dependency install step.

## Running The App

Start the frontend from `ui/`:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173/
```

If you change the Vite middleware or `.sav` decode flow, restart the dev server.

## Basic Workflow

### Option 1: Decode from a `.sav`

1. Start the app with `npm run dev` from `ui/`.
2. Click `Decode .sav`.
3. Select the Mewgenics save file.
4. The app will run `decompress.py` locally and write a CSV into `decoded_csv/`.
5. Clean up the generated CSV if needed.
6. Click `Import cats CSV` and load that file into the planner.

### Option 2: Start from an existing CSV

1. Start the app with `npm run dev` from `ui/`.
2. Click `Import cats CSV`.
3. Load a compatible CSV.

## CSV Format

The planner expects these important columns:

- `key`
- `name`
- `token`
- `token_kind`
- `token_id`
- `stats_endian`
- `STR`
- `DEX`
- `CON`
- `INT`
- `SPD`
- `CHA`
- `LCK`
- `error`

Rows with a populated `error` field are treated as invalid in the planner UI.

## Room Planning Features

- drag cats into rooms
- rename rooms
- remove rooms
- run with fewer than 3 rooms
- exclude individual cats from auto-assign
- save room plans to JSON
- reload room plans later

## Commands

From `ui/`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

From the repo root:

```bash
python decompress.py --help
```

Manual decode example:

```bash
python decompress.py steamcampaign01.sav --csv decoded_csv/output.csv
```

## Persistence Behavior

The app currently stores some planner state in browser local storage:

- room assignments
- room names
- auto-assign eligibility toggles

The app does **not** currently persist:

- imported CSV data across reloads
- search state
- sort state
- filter state

## Project Structure

```text
mewcat_tracker/
|- README.md
|- LLM_CONTEXT.md
|- decompress.py
|- ui/
|  |- package.json
|  |- vite.config.ts
|  `- src/
|     |- App.tsx
|     |- main.tsx
|     |- theme.ts
|     `- features/planner/
|- decoded_csv/            # generated when using .sav decode from the app
`- cats.csv / curr_cats.csv / *.sav
```

## Known Limitations

- Breeding analysis is heuristic-based, not a guaranteed exact simulation of the game.
- Auto-assign is heuristic-based and not guaranteed globally optimal.
- The app does not write room decisions back into Mewgenics.
- The `.sav` decode workflow depends on the local Vite server.
- There is no committed automated Playwright test suite yet.

## Troubleshooting

### The `.sav` decode button fails

Check all of the following:

- `npm run dev` is running from `ui/`
- Python is installed and accessible as `python` or `py -3`
- the selected file is a valid supported Mewgenics `.sav`

### A decoded CSV was generated but does not look right

That is expected for some saves or edge cases. Clean the CSV manually, then import it
with `Import cats CSV`.

### The app loads but old rooms are still present

Room names and assignments are stored in browser local storage. Use `Clear rooms` or
load a different room plan JSON file.

## Development Notes

- Planner UI code lives in `ui/src/features/planner/`.
- `LLM_CONTEXT.md` is the persistent memory file intended for future LLM sessions.
- If you make meaningful product, workflow, or architecture changes, update both this
  README and `LLM_CONTEXT.md`.
