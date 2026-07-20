# Development Guide

## Architecture Overview

CineWeave is a React 19 SPA for screenwriting and pre-production, backed by Supabase PostgreSQL.

```
src/
├── App.jsx                  # Main app shell, routing, tabs
├── context/
│   ├── ProjectContext.jsx   # Global project state + updateProject()
│   └── EntitiesSchema.js    # Canonical entity type definitions
├── components/
│   ├── ScreenplayTab.jsx    # Fountain/FDX import + screenplay editor
│   ├── MindMapTab.jsx       # Interactive mind map (Konva-free)
│   ├── StoryboardTab.jsx    # Frame management + CRUD
│   ├── StoryboardCanvas.jsx # Drawing canvas (Konva)
│   ├── CorkboardTab.jsx     # Card-based view
│   ├── EncyclopediaTab.jsx  # Entity browser
│   └── BrainstormTab.jsx   # Ideas + recordings
├── lib/
│   ├── supabase.js          # Supabase client init
│   ├── db.js                # CRUD functions for all entity types
│   ├── sync.js              # Local ↔ Supabase sync layer
│   ├── fountainImport.js    # Fountain format parser
│   ├── fdxImport.js         # Final Draft (FDX) XML parser
│   ├── entityExtractor.js   # Extract entities from parsed screenplay
│   ├── export.js            # PNG/PDF export
│   ├── canvasBrushes.js     # Brush presets + pressure/smoothing utils
│   └── backgrounds.js       # Background presets for canvas
supabase/
└── migrations/              # SQL migration files
```

## Key Patterns

### Entity System

All entities live in `project.entities` — a typed object:

```js
project.entities = {
  characters: [{ id: 'char-xxx', name: '', ... }],
  scenes:     [{ id: 'scene-xxx', title: '', ... }],
  dialogues:  [{ id: 'dlg-xxx', speaker: '', ... }],
  // ... see EntitiesSchema.js for full list
};
```

Entity IDs use type prefixes: `char-`, `loc-`, `obj-`, `scene-`, `act-`, `dlg-`, `we-`, `theme-`, `plot-`, `storyboard-`, `frame-`, `layer-`, `drawing-`.

### Dual Storage

- **localStorage**: offline-first, all data persisted locally
- **Supabase**: cloud sync via `sync.js` → `db.js`
- `ProjectContext.updateProject()` writes to localStorage AND triggers Supabase sync

### Adding a New Entity Type

1. Add schema to `EntitiesSchema.js` (`ENTITY_TYPES`)
2. Add prefix to `getEntityType()` in the same file
3. Create SQL migration in `supabase/migrations/`
4. Add `fetch*()` and `save*()` functions in `db.js`
5. Add sync steps in `sync.js` (both `loadProjectsFromSupabase` and `syncProjectToSupabase`)
6. Add to `ensureEntities()` if it should exist for new projects

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_OPENAI_API_KEY` | No | For LLM enrichment features |

## Common Tasks

### Add a new tab
1. Create `src/components/NewTab.jsx`
2. Add button in `App.jsx` header nav
3. Add tab content rendering in App.jsx

### Debug sync issues
1. Check browser console for Supabase errors
2. Verify `db.js` functions match your migration column names
3. Check `sync.js` field mappings (snake_case ↔ camelCase)

### Test screenplay import
1. Drop a `.fountain` or `.fdx` file on the import zone in ScreenplayTab
2. Check extracted entities in Encyclopedia tab
3. Verify scenes appear in Mind Map

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Run oxlint |
| `npm run format` | Auto-fix with oxlint |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run preview` | Preview production build |
