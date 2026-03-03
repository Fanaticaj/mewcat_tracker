# LLM Context

## Why this file exists

This file is a lightweight project memory for LLM-assisted work on `mewcat_tracker`.

The goal is to give future sessions a reliable starting point even when prior chat context is gone. It should help an LLM quickly understand:

- what this project is for
- what it is not for
- how the codebase is organized
- which technologies are in use
- what major features already exist
- what constraints and caveats matter before making changes

This file is not the source of truth over the code. If this file and the code disagree, trust the code and update this file.

## How to use this file

Read this file before proposing architecture changes, UI changes, parsing changes, or breeding-logic changes.

Use it as:

- project orientation
- a memory aid for long-running work
- a checklist for what should be preserved
- a summary of important domain intent and non-goals

After any meaningful project change, update this file so future sessions inherit the latest state.

## Maintenance rule

Update this file when any of the following changes:

- project goals or non-goals
- user workflow
- architecture or folder structure
- core technologies or package choices
- breeding analysis logic
- data import pipeline
- major UI features
- known limitations or assumptions

Prefer editing existing sections instead of appending unstructured notes.

## Project summary

`mewcat_tracker` is a companion management tool for the game **Mewgenics**.

It is meant to run alongside the game and help users make faster, better breeding decisions by surfacing useful information about their cats. The focus is planning, insight, and min-maxing support.

This project is **not** meant to modify save data, alter cats, inject cheats, or automate gameplay. It is a planning and analysis layer, not a game-modification tool.

## Product goal

The current product goal is:

> Help players quickly understand which cats and room pairings create the best breeding outcomes, while reducing the manual planning burden required to min-max stat inheritance.

In practical terms, the UI should help answer questions like:

- Which room pairing has the strongest stat complement?
- Which cats overlap too much to be worth breeding together?
- Which cats uniquely contribute perfect 7s?
- Which rooms have the best ceiling for specific stats?

## Current user workflow

Current workflow is:

1. Decode cat data from a Mewgenics save using `decompress.py` or use an existing CSV.
2. Import the CSV into the browser UI.
3. Drag cats into rooms or use quick-move dropdowns.
4. Review room-level breeding insights to decide which pairings are strongest.

The app currently supports planning and comparison. It does not write results back into the game.

## High-level architecture

There are currently two major parts:

### 1. Save/CSV tooling at repo root

- `decompress.py`
  - Python script for decoding Mewgenics cat data from a `.sav` SQLite database
  - decompresses raw LZ4 cat blobs
  - extracts names, token identifiers, and base stats
  - can inspect individual cats with `--inspect`

### 2. Frontend planner in `ui/`

- Vite + React + TypeScript single-page app
- imports CSV data
- organizes cats into rooms
- analyzes room pairings and stat ceilings
- stores room assignments in browser local storage

## Current folder structure

Only the meaningful project files are listed here. Ignore generated folders like `node_modules/` and `ui/dist/`.

```text
mewcat_tracker/
├─ LLM_CONTEXT.md
├─ decompress.py
├─ cats.csv
├─ curr_cats.csv
├─ steamcampaign01.sav
├─ package.json
└─ ui/
   ├─ package.json
   ├─ vite.config.ts
   ├─ tsconfig.json
   ├─ eslint.config.js
   └─ src/
      ├─ App.tsx
      ├─ main.tsx
      ├─ index.css
      └─ features/
         └─ planner/
            ├─ constants.ts
            ├─ storage.ts
            ├─ styles.ts
            ├─ types.ts
            ├─ utils.ts
            ├─ hooks/
            │  └─ usePlannerState.ts
            └─ components/
               ├─ PlannerHeader.tsx
               ├─ DropZoneSection.tsx
               ├─ RoomInsights.tsx
               └─ CatCard.tsx
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
- Playwright MCP is used externally for manual UI verification during development

### Python tooling

- Python 3.11 is available in the local environment
- `decompress.py` uses the Python standard library only in the inspected sections seen during audit

## Important implementation details

### Data source

The UI expects cat data from CSV import.

Important columns include:

- `key`
- `name`
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

### Persistence

The frontend currently persists **room assignments** in browser local storage using:

- `mew_rooms_v1`
- `mew_auto_assign_eligibility_v1`

Current limitations:

- imported CSV data is **not** persisted across reloads
- room names are **not** persisted across reloads
- search/filter state is **not** persisted across reloads

This matters for future changes. Do not assume the planner is fully stateful across sessions.

### Breeding analysis model

Current breeding analysis is heuristic-based, not a reverse-engineered exact game simulation.

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

Important nuance:

- a pair with complementary perfect 7s is ranked above a pair that only shares the same perfect 7s
- the auto-assigner is heuristic and greedy; it favors completing strong pairs, seeding empty rooms with strong remaining pairs, then placing leftover cats where they most improve room quality

This matches the product goal of helping users maximize stat transfer potential rather than just grouping already-similar cats together.

## Current UI capabilities

As of 2026-03-03, the planner supports:

- CSV import
- search by name, key, or token
- gender/type filter
- manual room creation
- drag-and-drop room assignment
- quick-move dropdown fallback
- per-card eligibility toggle for auto-assignment
- auto-assign button for eligible unassigned cats
- room-level breeding insight panel
- “Best next pair” highlight per room
- room stat leader summary
- alternative pair comparison cards
- responsive layout improvements for smaller screens

## Recent major changes

Recent work completed before this file was created:

1. Replaced the old horizontal-scroll assignment table with draggable cat cards.
2. Redesigned cat cards to be denser, cleaner, and more legible.
3. Added room breeding analysis that surfaces:
   - best pair in a room
   - unique vs shared perfect 7 contributions
   - room stat leaders
   - kitten stat ceiling summaries
4. Refactored the UI out of a monolithic `App.tsx` into feature-based modules under `ui/src/features/planner/`.
5. Removed unused starter `App.css`.

Recent work completed after this file was created:

6. Added persistent per-cat eligibility toggles so users can exclude cats from automated planning when they are too young or otherwise unsuitable.
7. Added an auto-assign action that distributes eligible unassigned cats into existing rooms using the current breeding heuristic.

## Current coding conventions

Observed and intended conventions:

- keep `App.tsx` thin and composition-focused
- put planner-specific logic under `ui/src/features/planner/`
- keep pure calculation logic in `utils.ts`
- keep browser persistence in `storage.ts`
- keep UI-only style objects in `styles.ts`
- use Material UI `sx` styling for component-local presentation
- prefer small focused components over one giant screen file

Comments should be minimal and only used where the code would otherwise be unclear.

## Known limitations and caveats

- No automated test suite exists yet.
- Playwright validation has been manual via MCP rather than committed test files.
- `ui/README.md` is still the default Vite template and should not be treated as project-specific documentation.
- The room analysis is heuristic guidance, not a guaranteed exact reproduction of in-game breeding rules.
- The auto-assign feature is also heuristic guidance, not a guaranteed optimal global solution.
- Root-level `.gitignore` ignores `*.csv` and `*.sav`, even though sample files are currently present locally.
- The root `package.json` is minimal and only contains `@types/papaparse`; most frontend work should happen inside `ui/`.

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
- inspect the actual feature files under `ui/src/features/planner/`
- preserve the project’s non-cheat positioning
- avoid regressing the room breeding insight workflow
- validate responsive behavior if the UI layout changes

When adding new features, ask:

- does this help the player plan breeding faster?
- does this surface actionable cat insight?
- does this preserve the “companion tool” rather than “game modification” boundary?

## Update log

### 2026-03-03

- Created this file as persistent project memory for future LLM-assisted work.
- Documented current architecture after the planner refactor.
- Documented current product goal, tech stack, workflow, limitations, and recent features.
- Updated the file after adding the eligibility toggle and auto-assign feature for unassigned cats.
