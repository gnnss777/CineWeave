# Architecture

System-level overview of CineWeave. For day-to-day setup see
[README.md](./README.md); for design tokens see [DESIGN.md](./DESIGN.md);
for AI-agent conventions see [AGENTS.md](./AGENTS.md).

## At a glance

CineWeave is a single-page React 19 + Vite 8 PWA for collaborative
screenwriting. State is held in React Context with localStorage as the
primary store and Supabase as the optional cloud-sync target. An NVIDIA
API proxy (serverless) powers the AI features.

```
┌─────────────────────────── Browser ───────────────────────────┐
│                                                                │
│   App.jsx                                                      │
│     │                                                          │
│     ▼                                                          │
│   <AuthProvider><ThemeProvider><SyncProvider><ProjectProvider> │
│                          └─ CineWeaveShell                     │
│                                  │                             │
│                                  ▼                             │
│                          Tab content (Suspense + lazy)         │
│                                                                │
│   Contexts (single source of truth)                           │
│   ├─ AuthContext      auth state, login/logout                 │
│   ├─ ProjectContext   projects[], currentProject, CRUD, sync   │
│   ├─ SyncContext      online state, pending-ops queue          │
│   ├─ ThemeContext     dark/light toggle                        │
│   └─ OnboardingContext guided tours + completion flags         │
│                                                                │
│   Storage                                                      │
│   ├─ localStorage     primary (projects, revisions, settings)  │
│   └─ Supabase         cloud sync (auth + entities/dialogues)   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
              │                              │
              │ /api/nvidia/[...path]        │ Supabase JS SDK
              ▼                              ▼
   ┌──────────────────────┐        ┌──────────────────────┐
   │  NVIDIA API proxy    │        │  Supabase (Postgres) │
   │  (Vercel Web Handler)│        │  auth + entities     │
   └──────────────────────┘        └──────────────────────┘
```

## Directory layout

```
src/
├── App.jsx                # App shell: providers + CineWeaveShell (tab router)
├── main.jsx               # createRoot + StrictMode
├── index.css              # Global styles + design tokens
├── context/               # React Context providers
│   ├── AuthContext.jsx
│   ├── ProjectContext.jsx # ~1750 lines; the central context
│   ├── SyncContext.jsx
│   ├── ThemeContext.jsx
│   ├── OnboardingContext.jsx
│   └── useEntities.js     # entity helpers built on ProjectContext
├── components/            # UI components (one per tab + modals)
│   ├── BrainstormTab.jsx
│   ├── ScreenplayTab.jsx  # ~2500 lines; the biggest component
│   ├── EncyclopediaTab.jsx
│   ├── StoryboardTab.jsx
│   ├── AnalysisTab.jsx
│   ├── VisualizationsTab.jsx
│   ├── ConfigTab.jsx
│   ├── PluginManager.jsx
│   ├── GuideModal.jsx
│   ├── LoginPage.jsx
│   └── ...
├── lib/
│   ├── pluginSystem/      # BeatPlugins-style registry (index.js)
│   ├── pluginAPI.js       # useCineWeaveAPI hook
│   ├── diffEngine/        # blockDiff, wordDiff, sceneDiff, mergeUtils
│   ├── db.js              # Supabase data layer (dialogues, projects)
│   ├── sync.js            # entity → Supabase sync
│   ├── supabase.js        # client
│   ├── llm.js             # NVIDIA API client
│   ├── aiFeedback.js      # AI suggestion helpers
│   ├── entityExtractor.js # screenplay → entities linkage
│   └── ...
├── plugins/               # Built-in plugins
│   ├── LinterPlugin.js
│   ├── BechdelPlugin.js
│   ├── CleanerPlugin.js
│   └── templates/         # React result UIs per plugin
api/
└── nvidia/[...path].js    # Vercel serverless LLM proxy (Web Handler)
supabase/
└── migration.sql          # Postgres schema (auth, projects, entities)
.github/workflows/
├── ci.yml                 # lint + build + Playwright on master/main
└── deploy.yml             # (Vercel handles deploy natively)
```

## Data model

A single project is the unit of work. `project.entities` is the **only**
source of truth for entities; `project.screenplay` holds the Fountain-style
block array with `entityId` back-references and per-block revision metadata.

```
project
├── id, title, tagline, visibility, tags
├── entities           ← single source of truth
│   ├── characters     ← full sheets
│   ├── locations      ← full sheets
│   ├── objects        ← full sheets
│   ├── scenes         ← { synopsis, actId, characterIds, order, status }
│   ├── plot_points    ← full sheets
│   ├── themes
│   ├── acts           ← { name, order, description, color }
│   ├── dialogues      ← { speaker, line, context, tags, sceneId }
│   └── world_elements
├── screenplay[]       ← blocks: { id, type, text, entityId,
│                                   metadata: { BlockRevisions: { blockId: level } } }
├── mindMapNodes[]     ← layout only: { entityId, x, y }
├── ideas[]            ← free-form notes
├── recordings[]       ← audio
└── mediaUploads[]     ← concept art, references
```

### Revisions

Screenplay blocks carry per-block revision metadata:
`metadata.BlockRevisions = { [blockId]: revisionLevel }`. The 8 revision
levels map to colors (white→blue, pink, yellow, green, gold, cream, salmon,
cherry). Each block keeps its original revision color regardless of the
currently active version. See `ScreenplayTab.jsx` (StylePanel + revisions
panel).

## Plugin System

BeatPlugins-style registry in `src/lib/pluginSystem/index.js`:

- **`pluginRegistry`** (Map): active plugins, keyed by id.
- **`pluginImplRegistry`** (Map, runtime-only): source of truth for
  executable implementations. **Never serialized.**
- **Persistence**: only metadata (`id`, `name`, `description`, `version`,
  `type`) is written to `localStorage.cineweave_plugins`. On `hydratePlugins()`,
  implementations are reattached by id from `pluginImplRegistry`.
- **Execution**: `executePlugin(id, params)` calls `plugin.execute(params)`
  or `plugin.execute(params, params.api)` when an `api` object is provided.
- **Plugin API**: `useCineWeaveAPI()` hook exposes screenplay, entities,
  project info, settings, logging, and notifications.

> ⚠️ **Known issue (#5):** `registerPlugin`/`hydratePlugins` are not yet
> called at app boot, so the Plugin Store currently always shows
> "Nenhum plugin instalado".

## LLM proxy

`api/nvidia/[...path].js` is a Vercel Web Handler that proxies requests to
`integrate.api.nvidia.com/v1`. The body is read defensively via `text()`
then `JSON.parse` with try/catch. Vercel routing is configured in
`vercel.json` with `builds` + `routes`.

## Sync layer

- **Primary**: localStorage (`ProjectContext` reads/writes here).
- **Cloud**: Supabase via `src/lib/db.js` and `src/lib/sync.js`. Auth flows
  through `AuthContext`; entities and dialogues are synced per-project.
- **Queue**: `SyncContext` tracks pending operations and exposes online
  state to the shell for the "Online/Offline/Pendente(s)" status pill.

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`): on push/PR to
  `master`/`main`, runs `npm run lint`, `npm run build`, and Playwright E2E.
- **Vercel**: native GitHub integration — every push to a branch gets a
  preview deploy; merges to `master` go to production.
- **CodeRabbit**: posts incremental code reviews automatically on PRs.

## Conventions

- **Branching**: feature branches off `master`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/),
  enforced by commitlint (header ≤ 72 chars).
- **Linting**: `oxlint` via lint-staged on `*.{js,jsx}` pre-commit.
- **Hooks**: never call React hooks conditionally or after an early
  `return` — `react-hooks/rules-of-hooks` is a CI **error**, not a warning.
