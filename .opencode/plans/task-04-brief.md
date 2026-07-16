# Task 4: Add syncActIdsFromMindMap backward-compat

**Files:**
- Modify: `src/context/ProjectContext.jsx`

**Purpose:** Add a `syncActIdsFromMindMap()` helper that derives `scene.actId` from mind map links (act→scene links), and call it inside `updateMindMap()` to keep `scene.actId` consistent.

## Steps

### Step 1: Add the sync helper

Add this function inside the `ProjectProvider` component, before `updateMindMap`:

```js
const syncActIdsFromMindMap = (proj) => {
  if (!proj.entities?.scenes || !proj.mindMapNodes || !proj.mindMapLinks) return;
  const sceneToActMap = {};
  proj.mindMapLinks.forEach(l => {
    const sourceNode = proj.mindMapNodes.find(n => n.id === l.source);
    if (!sourceNode) return;
    const sourceDisplayType = (() => {
      if (sourceNode.type === 'act') return 'act';
      if (sourceNode.entityId && proj.entities?.acts?.some(a => a.id === sourceNode.entityId)) return 'act';
      return null;
    })();
    if (sourceDisplayType === 'act') {
      sceneToActMap[l.target] = sourceNode.entityId || sourceNode.id;
    }
  });
  proj.entities.scenes = proj.entities.scenes.map(scene => {
    const sceneNode = proj.mindMapNodes.find(n => n.entityId === scene.id);
    if (sceneNode && sceneToActMap[sceneNode.id]) {
      const actEntityId = sceneToActMap[sceneNode.id];
      const actEntity = proj.entities.acts?.find(a => a.id === actEntityId);
      if (actEntity) {
        return { ...scene, actId: actEntity.id };
      }
    }
    return scene;
  });
};
```

### Step 2: Call it inside `updateMindMap`

Find the `updateMindMap` function and add a call to `syncActIdsFromMindMap(proj)` after setting nodes/links and before `updateProject(proj)`:

```js
const updateMindMap = (nodes, links) => {
    const proj = { ...currentProject };
    autoSaveVersionIfNeeded(proj, 'Mapa');
    proj.mindMapNodes = nodes;
    proj.mindMapLinks = links;
    syncActIdsFromMindMap(proj);  // <-- add this line
    updateProject(proj);
};
```

### Step 3: Verify

1. Read the modified `updateMindMap` function
2. Confirm `syncActIdsFromMindMap` is called correctly

### Step 4: Commit

Commit with message: `feat: syncActIdsFromMindMap keeps scene.actId consistent with mind map links`