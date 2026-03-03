# UI Workspace

The main project documentation lives in the repo root:

- [Project README](../README.md)

Use this `ui/` directory for frontend development commands:

```bash
npm install
npm run dev
npm run build
npm run lint
```

Important note:

- The `.sav` decode flow is implemented in `vite.config.ts` as local Vite middleware.
- If you change that integration, restart `npm run dev`.
