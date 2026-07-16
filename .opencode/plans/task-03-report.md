# Task 3 Report: Refactor CorkboardTab to read from mind map data

## Status
DONE

## Commits
- `2d82b10` feat: CorkboardTab now reads from mind map data

## Changes
- Updated imports to use `resolveNodeDisplay`, `getCorkboardData`, `moveSceneToAct`
- Added `updateMindMap` to useProject destructuring
- Replaced entity-based `scenesByAct`/`unassignedScenes` with mind map derived data via `getCorkboardData()`
- `handleDrop` now uses `moveSceneToAct()` + `updateMindMap()` to modify links
- `renderCard` now accepts `{ node, display }` resolved objects instead of raw scene entities
- Column keys/titles use `act.label` (mind map display) instead of `act.id`/`act.name`
- Collapse toggles keyed on `act.label`
- Unlinked column uses `unlinkedScenes` from mind map data
- Ribbon items show node existence indicator (green dot) and "Ver no Mapa" button

## Edge Cases / Concerns
- `resolveNodeDisplay` imported but not directly used in this file (used internally by `corkboardFromMindMap.js`); kept per brief instructions
- `scenes` kept in `useEntities` destructuring to support the ribbon "Cenas" section — brief Step 2 omitted it but ribbon references it
- Cards for nodes without linked entities show "Nó sem ficha vinculada" and navigate with node id
