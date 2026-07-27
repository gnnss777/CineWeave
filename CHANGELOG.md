# Changelog

All notable changes to CineWeave are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(starting from the first tagged release).

> `package.json` currently reports `0.0.0`. Versioning will start with the
> first tagged release after this changelog is in place.

## [Unreleased]

### Pending (tracked in issues)
- **#5** — Plugin System: wire `registerPlugin`/`hydratePlugins` at app boot
  (Plugin Store currently always shows "Nenhum plugin instalado").
- **#6** — Clean up 241 oxlint warnings (unused vars, exhaustive-deps, etc).
- **#7** — Decide fate of uncommitted WIP (landing page) and add `.gitignore`
  entries for scratch files.

---

## 2026-07-26 — PR #4

### Fixed
- **`src/App.jsx`**: `ReferenceError: useProject is not defined` in
  `CineWeaveShell`. The hook was called at line 54 but never imported;
  every other consumer imported it explicitly. Also added
  `setProjectVisibility` to the destructure (was a latent second crash on
  the project-drawer visibility toggle).
- **`src/components/GuideModal.jsx`**: moved the `if (!isOpen) return null`
  early-return to *after* the `useState`/`useOnboarding` hooks. Returning
  before hooks violates `react-hooks/rules-of-hooks`, was a CI lint error,
  and would crash at runtime when `isOpen` toggled.

### Changed (Plugin System, from 7 CodeRabbit review issues)
- **`src/components/PluginManager.jsx`**: now injects the full API
  (`{ screenplay, entities, log, notify }`) into the plugin `api` argument.
  Previously only `{ screenplay, log }` was passed, causing `BechdelPlugin`
  and `LinterPlugin` to crash on missing `entities`/`notify`.
- **`src/lib/pluginSystem/index.js`**:
  - Persistence now stores **only serializable metadata** (`id`, `name`,
    `description`, `version`, `type`). Functions (`execute`, `template`,
    `applyChanges`) live in a new `pluginImplRegistry` (runtime-only) and
    are reattached by id during `hydratePlugins()`. Previously,
    `JSON.stringify([...pluginRegistry])` silently dropped all functions,
    leaving the restored registry inert.
  - `registerPlugin` defers persistence until hydration completes. Calling
    `persistMetadata()` during boot would otherwise truncate the persisted
    list as soon as one plugin registered, permanently losing the others.
  - `hydratePlugins()` now sets `hydrated = true` in **all paths** (including
    when `cineweave_plugins` is absent or empty), so `isHydrated()`
    correctly reports completion.
- **`src/plugins/BechdelPlugin.js`**: docstring now describes the analyzer
  as a **heuristic** covering only criteria (1) and part of (2) of the
  canonical Bechdel-Wallace test. Topic analysis (criterion 3) would
  require NLP and is not implemented.
- **`src/plugins/*.js`**: JSDoc `@example` blocks now consistently use the
  nested `api.*` shape (`executePlugin(id, { api: { ... } })`) matching the
  actual execution contract.

### Known Issues (filed during this PR)
- **#5**: Plugin System is fully implemented but never activated at boot.
- **#6**: 241 lint warnings (0 errors).
- **#7**: Working-tree WIP (landing page, etc.) intentionally excluded.

---

## 2026-07-25 — PR #3

### Docs
- Added comprehensive JSDoc to all plugin system files to reach ~80%
  docstring coverage (`src/lib/pluginSystem/`, `src/plugins/*`,
  `src/lib/pluginAPI.js`).
- Resolved 16 CodeRabbit review comments from PR #2.

---

## 2026-07-25 — PR #2

### Added
- **Plugin System** (BeatPlugins-style): Map-based registry, `executePlugin`,
  `listPlugins`, `getPlugin`, `getPluginMetadata`, `unregisterPlugin`,
  `hydratePlugins`, `isHydrated`.
- **Plugin API hook** `useCineWeaveAPI` exposing screenplay, entities,
  project info, settings, and notification helpers.
- **Three built-in plugins**:
  - `LinterPlugin` — slugline normalizer (scene headings → UPPERCASE).
  - `BechdelPlugin` — diversity analyzer (heuristic Bechdel-Wallace check).
  - `CleanerPlugin` — markup cleaner (empty blocks, hidden notes, tags).
- **Plugin templates** (`src/plugins/templates/`) for each plugin's result UI.
- **`PluginManager` component** with execution logs, results preview, and
  glassmorphism design.
- **Plugins tab** in the app shell (`Cpu` icon).
- **Revision persistence**: screenplay blocks store per-block revision
  metadata (`BlockRevisions: { blockId: level }`) so revision colors are
  preserved across edits and reloads.

---

## 2026-07-23 — PR #1

### Fixed
- **Dialogue sync**: removed strict UUID guard in `saveDialogue` and added
  `project_id` to the `UPDATE` path, fixing dialogues silently skipped
  during cloud sync.
- **LLM proxy**: migrated NVIDIA proxy to Web Handler signature, added
  explicit Vercel rewrite for the catch-all route, and switched serverless
  detection to use `builds` + `routes`. Made request body parsing defensive
  (read via `text()` then `JSON.parse` with try/catch).
