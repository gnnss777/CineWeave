# Task 3: Refactor CorkboardTab to read from mind map data

**Files:** Modify `src/components/CorkboardTab.jsx`

**Overview:** Replace entity-based scene/act structure with mind map derived data. CorkboardTab now reads `currentProject.mindMapNodes/links` and uses `getCorkboardData()` from the new utility to derive act columns. Drag-and-drop updates `mindMapLinks` via `updateMindMap()`. The ribbon entity preview is preserved with added node indicators.

## Step-by-step changes

### Step 1: Update imports

Replace the old import block with:
```js
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useEntities } from '../context/useEntities';
import FichaModal from './FichaModal';
import ConfirmModal from './ConfirmModal';
import { resolveNodeDisplay } from '../lib/mindMapUtils';
import { getCorkboardData, moveSceneToAct } from '../lib/corkboardFromMindMap';
import './CorkboardTab.css';
import { ExternalLink, FileText, User, MapPin, Target, Heart, Plus, MessageSquare, Globe, Layers, Film } from 'lucide-react';
```

### Step 2: Update component destructuring

Replace:
```js
const { currentProject, updateProject, saveEntity, deleteEntityById, navigateTo } = useProject();
const { scenes, acts, characters, locations, objects, plotPoints, themes, dialogues, worldElements } = useEntities();
```

With:
```js
const { currentProject, updateProject, saveEntity, deleteEntityById, navigateTo, updateMindMap } = useProject();
const { characters, locations, objects, plotPoints, themes, dialogues, worldElements, acts } = useEntities();
```

### Step 3: Replace scene/act data derivation

Remove this block (lines 17-22):
```js
const scenesByAct = acts.map(act => ({
    act,
    scenes: scenes.filter(s => s.actId === act.id).sort((a, b) => a.order - b.order),
}));
const unassignedScenes = scenes.filter(s => !s.actId);
```

Add instead:
```js
const nodes = currentProject?.mindMapNodes || [];
const links = currentProject?.mindMapLinks || [];
const { scenesByAct, unlinkedScenes, allEntityNodes, linkMap } = getCorkboardData(nodes, links, currentProject);
```

### Step 4: Update handleDragStart

Keep as-is — it passes the entity id via dataTransfer.

### Step 5: Replace handleDrop

Replace the handleDrop function (lines 28-38):
```js
const handleDrop = (e, targetActNodeId) => {
    e.preventDefault();
    const sceneEntityId = e.dataTransfer.getData('text/plain');
    if (!sceneEntityId) return;
    const sceneNode = nodes.find(n => n.entityId === sceneEntityId || n.id === sceneEntityId);
    if (!sceneNode) return;
    const updatedLinks = moveSceneToAct(links, sceneNode.id, targetActNodeId);
    if (updatedLinks) {
        updateMindMap(nodes, updatedLinks);
    }
};
```

### Step 6: Update renderCard

Replace the renderCard function (lines 82-114). The function now receives a resolved scene object `{ node, display }`:
```js
const renderCard = (sceneResolved) => {
    const { node: sceneNode, display } = sceneResolved;
    const entity = display.entity;
    return (
        <div key={sceneNode.id}
            className="corkboard-card"
            draggable
            onDragStart={(e) => handleDragStart(e, entity?.id || sceneNode.id)}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="card-headline" style={{ flex: 1 }}>{display.label}</div>
                {entity && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setFichaModal({ item: entity, type: 'scene', mode: 'view' }); }}
                        style={{ background: 'none', border: 'none', color: '#ccee00', cursor: 'pointer', padding: '2px', marginLeft: '8px', flexShrink: 0 }}
                        title="Ver Ficha"
                    >
                        <FileText size={12} />
                    </button>
                )}
            </div>
            <div className="card-synopsis">{display.details}</div>
            <div className="card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span>{entity?.characterIds?.length || 0} personagens</span>
                    <span>{entity?.status || ''}</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); navigateTo('screenplay', entity?.id); }}
                    style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                    title="Ir para o Roteiro"
                >
                    <ExternalLink size={10} /> Roteiro
                </button>
            </div>
            {!entity && (
                <div style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px' }}>
                    Nó sem ficha vinculada
                </div>
            )}
        </div>
    );
};
```

Note: `sceneResolved` has `{ node, display }` shape — the `scenesByAct[i].scenes[j]` items from `getCorkboardData()` use this shape. The old `renderCard` was called with a scene entity object; now it's called with the resolved object.

### Step 7: Update the main JSX return

The column rendering changes from iterating `scenesByAct` (from entities) to the new `scenesByAct` (from mind map).

Replace the columns section inside the JSX return:
```jsx
<div className="corkboard-columns">
    {scenesByAct.map(({ act, scenes }) => (
        <div key={act.node?.id || act.label}
            className="corkboard-column"
            style={{ borderTop: `3px solid ${act.color || '#ccee00'}` }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over'); }}
            onDrop={(e) => { e.currentTarget.classList.remove('drag-over'); handleDrop(e, act.node?.id); }}
        >
            <div className="act-header">
                <h3 className="act-title" style={{ color: act.color || '#ccee00', margin: 0 }}>
                    {act.label}
                </h3>
                <button
                    onClick={() => toggleCollapse(act.label)}
                    style={{ background: 'none', border: 'none', color: '#7c7c82', cursor: 'pointer', fontSize: '12px' }}
                >
                    {collapsedActs[act.label] ? 'Expandir' : 'Recolher'}
                </button>
            </div>
            {!collapsedActs[act.label] && (
                scenes.length === 0 ? (
                    <p style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                        Arraste cenas para este ato
                    </p>
                ) : (
                    scenes.map(scene => renderCard(scene))
                )
            )}
        </div>
    ))}
    {unlinkedScenes.length > 0 && (
        <div className="corkboard-column" style={{ borderTop: '3px solid #6b7280', opacity: 0.7 }}>
            <h3 className="act-title" style={{ color: '#6b7280' }}>Não Atribuídas</h3>
            {unlinkedScenes.map(scene => renderCard(scene))}
        </div>
    )}
</div>
```

### Step 8: Update the ribbon section — add node existence indicator

In the ribbon section (lines 138-179), each entity list section renders items. After the section icon/name, add a small colored dot for entities that have mind map nodes. Also add a "Ver no Mapa" button on entities with nodes.

Replace the `section.items.slice(0,5).map(...)` block with:
```jsx
{section.items.slice(0, 5).map(item => {
    const hasNode = nodes.some(n => n.entityId === item.id);
    return (
        <div key={item.id}
            onClick={() => setFichaModal({ item, type: section.type, mode: 'view' })}
            style={{
                padding: '6px 8px', borderRadius: '4px',
                background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                marginBottom: '4px', display: 'flex', alignItems: 'center',
                gap: '6px', fontSize: '11px', color: '#d1d1d6',
                transition: 'background 0.15s', opacity: hasNode ? 1 : 0.5
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
            <section.icon size={10} style={{ color: section.color, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {item.name || item.title || 'Sem nome'}
            </span>
            {hasNode && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ccee00', flexShrink: 0 }} />
            )}
            {hasNode ? (
                <button onClick={(e) => { e.stopPropagation(); navigateTo('mindmap', item.id); }}
                    style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px', fontSize: '9px', flexShrink: 0 }}
                    title="Ver no Mapa"
                >
                    <ExternalLink size={9} />
                </button>
            ) : (
                <span style={{ fontSize: '9px', color: '#6b7280', fontStyle: 'italic' }}>sem nó</span>
            )}
        </div>
    );
})}
```

Note: The ribbon data (characters, locations, etc.) still comes from `useEntities()` — only the scene/act structure comes from mind map.

### Step 9: Update collapsedActs toggle

The key for collapsing acts changes from `act.id` (entity id) to `act.label` (display label from mind map node). The `toggleCollapse` function stays the same.

### Step 10: Update the "Unlinked" column

The old `unassignedScenes` was an array of scene entities. Now it's an array of `{ node, display }` objects. The rendering is compatible because `renderCard` was updated to accept this shape.

## Verification

1. Read the modified `CorkboardTab.jsx` file
2. Verify no syntax errors or undefined variables
3. Confirm the file still exports the component correctly
4. Confirm the ribbon still reads from `useEntities()` for entity previews

## Commit

Commit all changes with message: `feat: CorkboardTab now reads from mind map data`
