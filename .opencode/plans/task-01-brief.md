# Task 1: Fix generic saveEntity to create mind map nodes

**Files:**
- Modify: `src/context/ProjectContext.jsx` (lines 583-595)
- The import from `migration.js` (`updateEntity`, `deleteEntity`) will still be used by other code — don't remove the imports

**Problem:** `saveEntity()` delegates to `updateEntity()` in `migration.js`, which updates entity arrays but never touches `mindMapNodes`/`mindMapLinks`. Specialized functions (`saveCharacter`/`saveLocation`/`saveObject`) DO create nodes. Corkboard uses the generic path for all types, so entities created there get no mind map node.

**Fix:** Replace `saveEntity` / `deleteEntityById` with inline logic that also creates/deletes mind map nodes, mirroring the `saveCharacter` pattern.

## Steps

- [ ] **Step 1: Read the existing code** — read `ProjectContext.jsx` around lines 464-595 to see the full `saveCharacter`, `saveLocation`, `saveObject`, `saveEntity`, `deleteEntityById` functions. Also read `migration.js` lines 195-266 (`updateEntity` and `deleteEntity`).

- [ ] **Step 2: Rewrite `saveEntity`** — replace the simple delegation at line 583. New logic:
  - If entity has id (update): update entity in array + update mindMapNode label/details
  - If entity has no id (create): create entity + create mindMapNode with random position + `linkNodeToFirstAct()`
  - Sync legacy arrays (characters/locations/objects) like `migration.js:updateEntity` does

  Exact code to write:
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

  Exact code to write:
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

- [ ] **Step 4: Do NOT remove the imports from migration.js** — other code in the file still uses `updateEntity` and `deleteEntityFromProject`. Keep the import.

- [ ] **Step 5: Commit** — commit with message: `feat: saveEntity/deleteEntityById now sync mind map nodes`

## Verification

After making the changes:
1. Read the modified `saveEntity` and `deleteEntityById` functions
2. Confirm they follow the same pattern as `saveCharacter`/`saveLocation`/`saveObject`
3. Confirm the imports from `migration.js` are preserved