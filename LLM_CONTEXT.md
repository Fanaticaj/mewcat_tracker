# LLM Context

## Why this file exists

This file is persistent project memory for LLM-assisted work on `mewcat_tracker`.

It exists so a future session can quickly recover the purpose, structure, constraints,
and recent feature history of the project even when prior chat context is gone.

This file is not more authoritative than the code. If this file and the code disagree,
trust the code and update this file.

## How to use this file

Read this file before making architecture, UI, planner, parsing, or persistence changes.

Use it as:

- project orientation
- a short-term memory aid for long-running work
- a reminder of product intent and non-goals
- a checklist of important behaviors that should not be regressed

After any meaningful project change, update this file.

## Maintenance rule

Update this file when any of the following changes:

- project goals or non-goals
- user workflow
- folder structure or architecture
- core technologies
- breeding-analysis logic
- import/export or persistence behavior
- major UI features
- known limitations or assumptions

Prefer updating existing sections instead of appending loose notes.

## Project summary

`mewcat_tracker` is a companion management tool for the game **Mewgenics**.

It is intended to run alongside the game and help players make faster, better breeding
decisions by surfacing useful information about their cats.

This project is **not** intended to modify save data, alter cats, inject cheats, or
automate gameplay. It is a planning and analysis tool only.

## Product goal

Current product goal:

> Help players quickly understand which cats and room pairings create the best breeding
> outcomes while reducing the manual planning burden required to min-max stat inheritance.

In practice, the UI should help answer questions like:

- Which cats complement each other instead of overlapping on the same perfect 7s?
- Which room has the strongest next breeding pair?
- Which cats should be grouped first when many are still unassigned?
- Which cats should be excluded from automated planning because they are not eligible?

## Current user workflow

Current workflow:

1. Decode cat data from a Mewgenics save in the browser UI or use an existing CSV.
2. Clean up the generated CSV if needed.
3. Import the CSV into the browser planner.
4. Filter and sort the roster to inspect specific stat floors or rankings.
5. Drag cats into rooms, quick-move them, or use auto-assign for eligible unassigned cats.
6. Review room-level breeding insights to decide which pairings are strongest.
7. Save the room plan to a JSON file when the layout should persist outside the browser.

The app currently supports planning and comparison only. It does not write results back
into the game.

## High-level architecture

There are two main parts:

### 1. Save and CSV tooling at repo root

- `decompress.py`
  - Python script for decoding Mewgenics cat data from a `.sav` SQLite database
  - decompresses raw LZ4 cat blobs
  - extracts names, token identifiers, and base stats
  - can inspect individual cats with `--inspect`

### 2. Frontend planner in `ui/`

- Vite + React + TypeScript single-page app
- imports CSV data
- manages rooms and breeding analysis
- supports sorting, filtering, drag-drop, auto-assign, and room-plan file export/import
- exposes a local Vite middleware endpoint that can run `decompress.py` on uploaded
  `.sav` files and write decoded CSV output into `decoded_csv/`

## Current folder structure

Only meaningful project files are listed here. Ignore generated folders like
`node_modules/` and `ui/dist/`.

```text
mewcat_tracker/
|- README.md
|- LLM_CONTEXT.md
|- decompress.py
|- cats.csv
|- curr_cats.csv
|- steamcampaign01.sav
|- package.json
`- ui/
   |- README.md
   |- package.json
   |- vite.config.ts
   |- tsconfig.json
   |- eslint.config.js
   `- src/
      |- App.tsx
      |- main.tsx
      |- index.css
      |- theme.ts
      `- features/
         `- planner/
            |- constants.ts
            |- storage.ts
            |- styles.ts
            |- types.ts
            |- utils.ts
            |- hooks/
            |  `- usePlannerState.ts
            `- components/
               |- PlannerHeader.tsx
               |- DropZoneSection.tsx
               |- RoomInsights.tsx
               `- CatCard.tsx
```

## Technologies in use

### Frontend

- React 19
- TypeScript 5
- Vite 7
- Material UI 7
- Emotion
- PapaParse for CSV parsing
- native HTML drag-and-drop

### Tooling

- ESLint
- Playwright MCP for manual browser verification during development

### Python tooling

- Python 3.11 is available locally
- `decompress.py` uses Python tooling at repo root and is separate from the browser app

## Important implementation details

### Data source

The planner expects cat data from CSV import.

Important columns include:

- `key`
- `name`
- `status`
- `gender`
- `gender_source`
- `token`
- `token_kind`
- `token_id`
- `STR`
- `DEX`
- `CON`
- `INT`
- `SPD`
- `CHA`
- `LCK`
- `error`

Rows with a populated `error` field are treated as invalid in the planner UI.
`status` comes from the save file's `house_state` and `adventure_state` records
when decoding `.sav` files.
`gender` comes from the authoritative sex byte near the name block when decoding
`.sav` files. The raw token fields are preserved separately because they often do
not match actual sex.
Sexual preference / compatibility flags are not currently decoded into the CSV.

### Persistence

There are now two persistence layers:

1. Browser local storage for convenience
2. JSON room-plan files for explicit save/load outside the browser

Current local storage keys:

- `mew_rooms_v1`
- `mew_room_names_v1`
- `mew_auto_assign_eligibility_v1`

Current room-plan JSON file contents:

- `version`
- `savedAt`
- `roomNames`
- `rooms`
- `eligibility`

Important nuance:

- imported CSV data is still **not** persisted across reloads
- room names and assignments **are** persisted in local storage
- room plans can now be saved and loaded from a JSON file
- uploaded `.sav` files can now be decoded from the web app, but this depends on the
  local Vite server because the browser itself cannot run Python
- search, sort, and filter UI state are still session-only

### Breeding analysis model

Current breeding analysis is heuristic-based, not a reverse-engineered exact game
simulation.

The planner currently computes:

- room stat leaders
- per-pair best inherited stat ceiling
- perfect 7 coverage
- complementary perfect 7s
- shared perfect 7s
- number of strong stats at 6+
- combined ceiling total
- ranked pair recommendations
- heuristic room auto-assignment for eligible unassigned cats

Important ranking nuance:

- complementary perfect 7 coverage is favored over overlapping perfect 7s
- the auto-assigner is greedy and heuristic-based, not a guaranteed global optimum
- adding more cats to a room is penalized once the room gets crowded

## Current UI capabilities

As of 2026-03-03, the planner supports:

- `.sav` upload from the web UI with local Python-backed CSV generation
- CSV import
- search by name, key, or token
- status filtering (`alive`, `In House`, `Adventure`, `Gone`, `Unknown`)
- gender/type filtering
- stat floor filtering with per-stat minimum values
- sorting by name, total stats, or any individual stat
- manual room creation
- room renaming
- room removal, allowing fewer than 3 rooms or even zero rooms
- drag-and-drop room assignment
- quick-move dropdown fallback
- per-card eligibility toggle for auto-assign
- auto-assign button for eligible unassigned cats
- room-level breeding insight panels
- JSON room-plan export
- JSON room-plan import
- a compact planner header with collapsible sort and filter controls
- a warm Mewgenics-inspired visual theme based on parchment, ash, moss, clay, and charcoal tones
- responsive card-based layout

## Recent major changes

Recent work completed before this file existed:

1. Replaced the old horizontal-scroll assignment table with draggable cat cards.
2. Redesigned cat cards to be denser, cleaner, and more legible.
3. Added room breeding analysis that surfaces best pairs, unique versus shared perfect
   7 contributions, room stat leaders, and kitten ceiling summaries.
4. Refactored the UI out of a monolithic `App.tsx` into feature-based modules under
   `ui/src/features/planner/`.
5. Removed unused starter `App.css`.

Recent work completed after this file was created:

6. Added persistent per-cat eligibility toggles so users can exclude cats from
   automated planning.
7. Added auto-assign for eligible unassigned cats using the current breeding heuristic.
8. Added sorting by name, total stats, and individual stats.
9. Added stat floor filters.
10. Added persistent room names in local storage.
11. Added room rename and delete controls so the planner is no longer locked to three
    rooms.
12. Added JSON room-plan save/load so room information can live in a file.
13. Added a local `.sav` decode flow in the web app that writes generated CSV files via
    `decompress.py` into `decoded_csv/`.
14. Re-themed the planner UI to better match Mewgenics art direction with warmer earthy tones.
15. Tightened the visual system with a more compact header, collapsible sort/filter controls,
    and reduced corner radii for better readability.
16. Added a real root README and replaced the old `ui/README.md` template with a workspace note.
17. Added authoritative save-derived status export (`In House`, `Adventure`, `Gone`) to
    `decompress.py` and exposed status filtering in the planner UI.

## Current coding conventions

Observed and intended conventions:

- keep `App.tsx` thin and composition-focused
- keep planner-specific code under `ui/src/features/planner/`
- keep pure scoring and transformation logic in `utils.ts`
- keep browser persistence in `storage.ts`
- keep MUI `sx` styling near the relevant component
- prefer focused components over large multi-purpose screen files

Comments should remain minimal and only explain non-obvious logic.

## Known limitations and caveats

- No automated test suite exists yet.
- Playwright verification is still manual via MCP rather than committed browser tests.
- The root `README.md` is the main user-facing documentation; `ui/README.md` is only a
  short frontend workspace note.
- Breeding analysis is heuristic guidance, not guaranteed in-game breeding simulation.
- Auto-assign is heuristic guidance, not a proven optimal global assignment solver.
- CSV import is session-only; a reload still requires re-importing cat data.
- The `.sav` decode button depends on the local Vite server middleware, so changes to
  that integration require restarting `npm run dev`.
- Root-level `.gitignore` ignores `*.csv` and `*.sav`, even though sample files may be
  present locally.
- The root `package.json` is minimal; most frontend work should happen inside `ui/`.

## Commands worth remembering

Frontend commands, run from `ui/`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Python tooling, run from repo root:

```bash
python decompress.py --help
```

## Guidance for future LLM sessions

Before making changes:

- read this file
- inspect the actual planner modules under `ui/src/features/planner/`
- preserve the non-cheat positioning of the product
- avoid regressing the breeding-insight workflow
- recheck responsive behavior if the layout changes
- update this file after meaningful planner, persistence, or workflow changes

When adding features, ask:

- does this reduce planning time?
- does this surface actionable breeding insight?
- does this stay on the companion-tool side of the line instead of game modification?

## Update log

### 2026-03-03

- Created this file as persistent project memory for future LLM-assisted work.
- Documented the planner refactor, current tech stack, workflow, and limitations.
- Documented the eligibility toggle and auto-assign features.
- Updated the file after adding sorting, stat filtering, persistent room names, room
  rename/delete controls, and JSON room-plan save/load.
- Updated the file after adding `.sav` decoding from the web app through a local
  Python-backed Vite endpoint.
- Updated the file after adding project-specific README documentation and tightening
  the planner UI shape system.
