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
│   ├── ScreenplayTab.jsx    # Fountain/FDX import + screenplay editor + revision system
│   ├── AnalysisTab.jsx      # 🆕 Technical analysis tab
│   ├── VisualizationsTab.jsx # 🆕 Data visualizations
│   ├── ConfigTab.jsx        # 🆕 Project configuration
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

## 🆕 Revision System

### Data Model

Revisions are stored in the BEAT metadata block:

```javascript
const meta = {
  'Revision Level': 0,        // Current active generation
  'Revision Mode': false,     // Whether revision mode is on
  'PrintMode': false,         // Whether print mode is on
  'BlockRevisions': {         // Map of blockId → generation level
    'block-123': 1,           // This block is revision level 1 (Rosa)
    'block-456': 3,           // This block is revision level 3 (Verde)
    'block-789': 0,           // This block is revision level 0 (Branco)
  },
  'DocumentStyle': 'screenplay'
};
```

### Key Components

#### 1. `blockRevisionGen` Ref
Tracks which generation was selected when each block was edited:

```javascript
const blockRevisionGen = useRef(new Map());

// Set when block gains focus (handleInput)
if (!blockRevisionGen.current.has(id)) {
  blockRevisionGen.current.set(id, revisionGeneration);
}

// Set when block loses focus (handleBlur) - CRITICAL
blockRevisionGen.current.set(id, revisionGeneration);
```

#### 2. `revisionMeta` State
Stores the loaded revision metadata from BEAT block:

```javascript
const [revisionMeta, setRevisionMeta] = useState({});

useEffect(() => {
  if (currentProject) {
    const meta = parseBeatMetadata(currentProject.screenplay || []);
    setRevisionMeta(meta['BlockRevisions'] || {});
  }
}, [currentProject]);
```

#### 3. Rendering Logic
When rendering a block, use `revisionMeta[block.id]` instead of `revisionGeneration`:

```javascript
const isRevised = revisions.includes(el.id);
// Get the generation from metadata, NOT from current dropdown
const gen = REVISION_GENERATIONS.find(
  g => g.level === revisionMeta[el.id]
) || REVISION_GENERATIONS[0];
```

### Fixing Common Issues

#### Issue: Revisions disappear after page refresh
**Symptoms**:
- Console shows `Loading BEAT metadata: {}`
- `revisionMeta: {}` is always empty
- `blockRevisionGen.current.get(id)` returns undefined

**Root Cause**: The ref is never populated when creating revisions outside of typing

**Fix**: Ensure `handleBlur` always calls `blockRevisionGen.current.set(id, revisionGeneration)`:

```javascript
const handleBlur = (id) => {
  const text = blockTexts.current[id];
  const pendingType = pendingAutoTypes[id];
  if (text !== undefined || pendingType) {
    const updated = elements.map(el =>
      el.id === id
        ? { ...el, text: text !== undefined ? text : el.text, ...(pendingType ? { type: pendingType } : {}) }
        : el
    );
    saveScreenplay(updated);
  }

  // ✅ CRITICAL: Register the generation when editing ends
  blockRevisionGen.current.set(id, revisionGeneration);

  setPendingAutoTypes(prev => {
    const next = { ...prev };
    delete next[id];
    return next;
  });
};
```

#### Issue: Hydration error with SVG in option elements
**Error**: `In HTML, <svg> cannot be a child of <option>. This will cause a hydration error.`

**Fix**: Remove SVG icons from option elements:

```javascript
// ❌ WRONG - causes hydration error
<option value="all">
  <Eye size={11} /> Todas
</option>

// ✅ CORRECT - plain text only
<option value="all" style={{ background: '#1a1a2e', color: 'white' }}>
  Todas
</option>
```

### Debugging

Enable debug logs in `ScreenplayTab.jsx`:

```javascript
// In saveScreenplay, before creating metaBlock
console.log('[DEBUG] Guardando metadata do screenplay:', meta);
console.log('[DEBUG] revisionMeta atual:', revisionMeta);
console.log('[DEBUG] blockRevisionGen:', blockRevisionGen.current);

// In useEffect that loads metadata
console.log('[Revision System] Loading BEAT metadata:', meta);
console.log('[Revision System] BlockRevisions loaded:', meta['BlockRevisions']);

// In render logic
console.log('[Revision Panel] Current revisions:', revisions);
console.log('[Revision Panel] revisionMeta:', revisionMeta);
console.log('[Revision Panel] revisionGeneration:', revisionGeneration);
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
