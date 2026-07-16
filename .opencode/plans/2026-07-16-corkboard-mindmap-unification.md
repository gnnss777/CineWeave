# Corkboard→MindMap Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement.

**Goal:** Make CorkboardTab a true alternate visualization of mind map data (mindMapNodes/mindMapLinks), so both views reflect the exact same structure.

**Architecture:** CorkboardTab stops reading entities directly for scene/act layout and derives act columns from mindMapNodes + mindMapLinks via `resolveNodeDisplay()`. Entity data is still source for ribbon previews and FichaModal. All entity CRUD goes through ProjectContext functions that also sync mind map nodes. Drag-and-drop updates mindMapLinks directly. A `syncActIdsFromMindMap()` helper keeps `scene.actId` consistent with links.

**Tech Stack:** React 18, custom ProjectContext (no router), hand-rolled SVG canvas (MindMapTab), HTML+CSS cards (CorkboardTab)

## Global Constraints

- All entity creation MUST create a corresponding mindMapNode with entityId
- mindMapLinks are source of truth for act↔scene relationships; `scene.actId` is derived via sync
- Never duplicate state: Corkboard reads `currentProject.mindMapNodes/links` directly
- Follow existing patterns: `resolveNodeDisplay()`, `getColorForNodeType()`, `cleanNodesForSave()`
- No new external dependencies

---
### Task 1: Fix generic `saveEntity` to create mind map nodes

**Files:**
- Modify: `src/context/ProjectContext.jsx` (lines 583-595)

**Problem:** `saveEntity()` delegates to `updateEntity()` in `migration.js`, which updates entity arrays but never touches `mindMapNodes`/`mindMapLinks`. Specialized functions (`saveCharacter`/`saveLocation`/`saveObject`) DO create nodes. Corkboard uses the generic path for all types.

**Fix:** Replace `saveEntity` / `deleteEntityById` with inline logic that also creates/deletes mind map nodes, mirroring the `saveCharacter` pattern.

- [ ] **Step 1: Read existing code** — read `ProjectContext.jsx` lines 583-595 and `migration.js` lines 195-266.

- [ ] **Step 2: Rewrite `saveEntity`** — replace the simple delegation. New logic:
  - If entity has id (update): update entity in array + update mindMapNode label/details
  - If entity has no id (create): create entity + create mindMapNode with random position + `linkNodeToFirstAct()`
  - Sync legacy arrays (characters/locations/objects) like `migration.js:updateEntity` does

  ```js
  const saveEntity = (type, entity) => {
      const proj = { ...currentProject };
      autoSaveVersionIfNeeded(proj, 'Ficha');
      const now = Date.now();
      const list = proj.entities[type] || [];
      const existingIdx = entity.id ? list.findIndex(e => e.id === entity.id) : -1;

      if (existingIdx >= 0) {
        proj.entities[type] = list.map(e => e.id === entity.id ? { ...e, ...entity, updatedAt: now } : e);
        proj.mindMapNodes = (proj.mindMapNodes || []).map(node => {
          if (node.entityId === entity.id || node.id === `n-${entity.id}`) {
            const label = entity.name || entity.title || entity.statement || '';
            const details = entity.description || entity.synopsis || entity.evidence || '';
            return { ...node, entityId: entity.id, ...(label ? { label } : {}), ...(details ? { details } : {}) };
          }
          return node;
        });
      } else {
        const newEntity = { ...entity, id: entity.id || `${type.slice(0, -1)}-${now}`, createdAt: now, updatedAt: now };
        if (!proj.entities[type]) proj.entities[type] = [];
        proj.entities[type] = [...list, newEntity];
        const nodeId = `n-${newEntity.id}`;
        if (!(proj.mindMapNodes || []).some(n => n.id === nodeId || n.entityId === newEntity.id)) {
          if (!proj.mindMapNodes) proj.mindMapNodes = [];
          proj.mindMapNodes.push({ id: nodeId, entityId: newEntity.id, x: Math.round(300 + Math.random() * 400), y: Math.round(300 + Math.random() * 200) });
          linkNodeToFirstAct(proj, nodeId);
        }
      }
      // Sync legacy arrays
      ['characters','locations','objects'].forEach(legacyType => {
        if (type !== legacyType) return;
        const legacyArr = legacyType === 'characters' ? proj.characters : legacyType === 'locations' ? proj.locations : proj.objects;
        const updatedEntity = (proj.entities[type] || []).find(e => e.id === entity.id);
        if (!updatedEntity) return;
        if (legacyArr?.some(e => e.id === entity.id)) {
          if (legacyType === 'characters') proj.characters = legacyArr.map(e => e.id === entity.id ? updatedEntity : e);
          else if (legacyType === 'locations') proj.locations = legacyArr.map(e => e.id === entity.id ? updatedEntity : e);
          else proj.objects = legacyArr.map(e => e.id === entity.id ? updatedEntity : e);
        } else {
          if (!proj[legacyType]) proj[legacyType] = [];
          proj[legacyType].push(updatedEntity);
        }
      });
      updateProject(proj);
  };
  ```

- [ ] **Step 3: Rewrite `deleteEntityById`** — replace delegation with inline logic that also removes mind map node + links.

  ```js
  const deleteEntityById = (type, entityId) => {
      const proj = { ...currentProject };
      autoSaveVersionIfNeeded(proj, 'Ficha');
      proj.entities[type] = (proj.entities[type] || []).filter(e => e.id !== entityId);
      proj.mindMapNodes = (proj.mindMapNodes || []).filter(n => n.entityId !== entityId && n.id !== `n-${entityId}`);
      proj.mindMapLinks = (proj.mindMapLinks || []).filter(l => l.source !== `n-${entityId}` && l.target !== `n-${entityId}`);
      if (type === 'characters' && proj.characters) proj.characters = proj.characters.filter(c => c.id !== entityId);
      if (type === 'locations' && proj.locations) proj.locations = proj.locations.filter(l => l.id !== entityId);
      if (type === 'objects' && proj.objects) proj.objects = proj.objects.filter(o => o.id !== entityId);
      updateProject(proj);
  };
  ```

- [ ] **Step 4: Verify** — read modified functions to ensure the pattern matches `saveCharacter`/`saveLocation`/`saveObject`.

---
### Task 2: Create `corkboardFromMindMap.js` utility

**Files:**
- Create: `src/lib/corkboardFromMindMap.js`

**Purpose:** Pure function that takes mindMapNodes + mindMapLinks + project entities and derives structured data for Corkboard rendering.

- [ ] **Step 1: Write the utility**

```js
import { resolveNodeDisplay } from './mindMapUtils';

export function getCorkboardData(nodes, links, project) {
  if (!nodes || !project) return { scenesByAct: [], unlinkedScenes: [], allEntityNodes: [], actNodes: [], sceneNodes: [], linkMap: {} };

  const resolved = nodes.map(n => ({ node: n, display: resolveNodeDisplay(n, project) }));
  const actNodes = resolved.filter(r => r.display.type === 'act');
  const sceneNodes = resolved.filter(r => r.display.type === 'scene');
  const otherNodes = resolved.filter(r => r.display.type !== 'act' && r.display.type !== 'scene');

  const linkMap = {};
  (links || []).forEach(l => {
    if (!linkMap[l.source]) linkMap[l.source] = { out: [], in: [] };
    if (!linkMap[l.target]) linkMap[l.target] = { out: [], in: [] };
    linkMap[l.source].out.push(l.target);
    linkMap[l.target].in.push(l.source);
  });

  const scenesByAct = actNodes.map(a => {
    const linkedSceneIds = linkMap[a.node.id]?.out || [];
    const actScenes = sceneNodes
      .filter(s => linkedSceneIds.includes(s.node.id))
      .sort((a, b) => (a.display.entity?.order ?? 0) - (b.display.entity?.order ?? 0));
    return { act: a.display, scenes: actScenes };
  });

  const allActLinkedSceneIds = new Set();
  actNodes.forEach(a => (linkMap[a.node.id]?.out || []).forEach(id => allActLinkedSceneIds.add(id)));
  const unlinkedScenes = sceneNodes.filter(s => !allActLinkedSceneIds.has(s.node.id));

  return { scenesByAct, unlinkedScenes, allEntityNodes: otherNodes, actNodes, sceneNodes, linkMap };
}

export function moveSceneToAct(nodes, links, sceneNodeId, targetActNodeId) {
  const updatedLinks = links.filter(l => l.target !== sceneNodeId);
  const exists = updatedLinks.some(l => l.source === targetActNodeId && l.target === sceneNodeId);
  if (!exists) {
    updatedLinks.push({
      id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: targetActNodeId,
      target: sceneNodeId,
    });
  }
  return updatedLinks;
}
```

- [ ] **Step 2: Verify** — check exports and function signatures.

---
### Task 3: Refactor CorkboardTab to read from mind map data

**Files:**
- Modify: `src/components/CorkboardTab.jsx` (major refactor)
- Modify: `src/components/CorkboardTab.css` (minor)

- [ ] **Step 1: Update imports** — add `useEffect`, `resolveNodeDisplay`, `getColorForNodeType`, `getCorkboardData`, `moveSceneToAct`, `updateMindMap`.

- [ ] **Step 2: Add mind map data derivation** — replace compiled `scenesByAct` + `unassignedScenes` with:
  ```js
  const { scenesByAct, unlinkedScenes, actNodes } = getCorkboardData(
    currentProject?.mindMapNodes || [],
    currentProject?.mindMapLinks || [],
    currentProject
  );
  ```
  Keep `useEntities()` only for the ribbon entity previews.

- [ ] **Step 3: Rewrite `handleDrop`** — instead of updating `scene.actId`, use `moveSceneToAct()` + `updateMindMap()`.

- [ ] **Step 4: Update `renderCard`** — receives a resolved scene object `{ node, display }`. Use `display.label`, `display.details`, `display.entity` instead of scene.title/synopsis.

- [ ] **Step 5: Update column rendering** — loop over `scenesByAct` from derived data. Act header uses `display.label` and `display.color`. Drop handler passes the act node's entityId or node id.

- [ ] **Step 6: Keep the ribbon** — entity summaries from `useEntities()` remain, with optional visual indicator (colored dot) for entities that have mind map nodes.

- [ ] **Step 7: Add "Ver no Mapa" button** — in ribbon items that have a mind map node, show a small button calling `navigateTo('mindmap', entity.id)`.

---
### Task 4: Add `syncActIdsFromMindMap` backward-compat

**Files:**
- Modify: `src/context/ProjectContext.jsx`

- [ ] **Step 1: Write sync helper** — a function that reads mindMapLinks + mindMapNodes and derives `scene.actId` for each scene entity based on which act node links to which scene node.

- [ ] **Step 2: Call inside `updateMindMap`** — after setting `proj.mindMapNodes` and `proj.mindMapLinks`, call `syncActIdsFromMindMap(proj)` before `updateProject(proj)`.

---
### Task 5: Create `useMindMapEntities` shared hook (optional)

**Files:**
- Create: `src/context/useMindMapEntities.js`

**Purpose:** Shared hook for both CorkboardTab and MindMapTab: provides `{ nodes, links, scenesByAct, ... }` derived from mind map data.

- [ ] **Step 1: Write the hook** using `useMemo` + `getCorkboardData`.

- [ ] **Step 2: Update CorkboardTab** to optionally use it (reduces duplication).

---
## Execution Order

1. **Task 1** — mind map node creation in `saveEntity` is prerequisite
2. **Task 2** — utility functions
3. **Task 3** — main Corkboard refactor
4. **Task 4** — actId backward compat
5. **Task 5** — shared hook (polish)
