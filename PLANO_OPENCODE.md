# PLANO MESTRE — CineWeave (para Opencode)

**Ordem absoluta de execução.** Não pular fases. Cada fase depende da anterior.

---

## 🟢 FASE 0 — FUNDAÇÃO: project.entities

### Passo 0.1: Schema de Entidades

**Arquivo:** `src/context/EntitiesSchema.js` (CRIAR)

```js
export const ENTITY_DEFAULTS = {
  characters: {
    id: '', name: '', role: 'Coadjuvante',
    description: '', traits: [], backstory: '',
    avatar: 'amber', notes: '',
    relationships: [],
    createdAt: 0, updatedAt: 0,
  },
  locations: {
    id: '', name: '', type: 'INT.',
    description: '', timeOfDay: 'DIA', mood: '', group: '',
    createdAt: 0, updatedAt: 0,
  },
  objects: {
    id: '', name: '', description: '', significance: '', group: '',
    createdAt: 0, updatedAt: 0,
  },
  scenes: {
    id: '', title: '', synopsis: '', actId: null,
    characterIds: [], order: 0, status: 'draft',
    createdAt: 0, updatedAt: 0,
  },
  plot_points: {
    id: '', title: '', description: '', actId: null, tags: [],
    createdAt: 0, updatedAt: 0,
  },
  themes: {
    id: '', statement: '', evidence: '', relevance: 'Central',
    createdAt: 0, updatedAt: 0,
  },
  acts: {
    id: '', name: '', order: 0, description: '', color: '#ccee00',
    createdAt: 0, updatedAt: 0,
  },
};
export const ENTITY_TYPES = Object.keys(ENTITY_DEFAULTS);
export function createEntity(type, overrides = {}) {
  const defaults = ENTITY_DEFAULTS[type];
  const now = Date.now();
  return { ...defaults, ...overrides, id: overrides.id || `${type.slice(0,-1)}-${now}`, createdAt: now, updatedAt: now };
}
```

### Passo 0.2: Migração de Dados Legados

**Arquivo:** `src/lib/migration.js` (CRIAR)

```js
export function ensureEntities(proj) {
  if (!proj || proj.entities) return proj;
  const bd = proj.brainstormData || {};

  // Scenes do brainstormData + mindMapNodes
  const brainstormScenes = (bd.scenes || []).map((s, i) => ({
    id: s.id || `scene-${proj.id}-${i}`, title: s.title || '',
    synopsis: s.description || '', actId: null, characterIds: [],
    order: i, status: 'draft', createdAt: Date.now(), updatedAt: Date.now(),
  }));
  const scenes = [...brainstormScenes];

  // Plot points
  const plot_points = (bd.plot_points || []).map((p, i) => ({
    id: p.id || `plot-${proj.id}-${i}`, title: p.title || '',
    description: p.description || '',
    actId: p.act ? `act-${proj.id}-${['I','II','III','IV','V'].indexOf(p.act.toUpperCase())}` : null,
    tags: p.tags || [], createdAt: Date.now(), updatedAt: Date.now(),
  }));

  // Themes
  const themes = (bd.themes || []).map((t, i) => ({
    id: t.id || `theme-${proj.id}-${i}`, statement: t.statement || '',
    evidence: t.evidence || '', relevance: t.relevance || 'Central',
    createdAt: Date.now(), updatedAt: Date.now(),
  }));

  // Acts do mindMap ou fallback
  const actNodes = (proj.mindMapNodes || []).filter(n => n.type === 'act');
  const acts = actNodes.length > 0
    ? actNodes.map((n, i) => ({
        id: n.id.replace(/^n-/, 'act-'), name: n.label || `ATO ${['I','II','III','IV'][i]||i+1}`,
        order: i, description: n.details || '', color: n.color || '#ccee00',
        createdAt: Date.now(), updatedAt: Date.now(),
      }))
    : ['I','II','III','IV'].map((r,i) => ({
        id: `act-${proj.id}-${i}`, name: `ATO ${r}`, order: i,
        description: '', color: '#ccee00',
        createdAt: Date.now(), updatedAt: Date.now(),
      }));

  // Link acts
  actNodes.forEach((n, ai) => {
    const links = (proj.mindMapLinks||[]).filter(l => l.source === n.id).map(l => l.target);
    scenes.forEach(s => {
      const mn = (proj.mindMapNodes||[]).find(m => m.type==='scene' && m.label===s.title);
      if (mn && links.includes(mn.id)) s.actId = acts[ai]?.id;
    });
  });
  plot_points.forEach(pp => {
    const pa = bd.plot_points?.find(b => b.title === pp.title);
    if (pa?.act) {
      const ri = ['I','II','III','IV','V'].indexOf(pa.act.toUpperCase());
      if (ri>=0) pp.actId = acts[ri]?.id;
    }
  });

  return { ...proj, entities: {
    characters: proj.characters || [], locations: proj.locations || [],
    objects: proj.objects || [], scenes, plot_points, themes, acts,
  }};
}

export function getEntity(proj, entityId) {
  if (!proj?.entities) return null;
  for (const t of Object.keys(proj.entities)) {
    const f = proj.entities[t].find(e => e.id === entityId);
    if (f) return { ...f, _type: t };
  }
  return null;
}

export function updateEntity(proj, type, entity) {
  if (!proj.entities) proj = ensureEntities(proj);
  const now = Date.now();
  const upd = { ...entity, updatedAt: now };
  if (entity.id && (proj.entities[type]||[]).find(e => e.id === entity.id)) {
    proj.entities[type] = proj.entities[type].map(e => e.id === entity.id ? upd : e);
  } else {
    proj.entities[type] = [...(proj.entities[type]||[]), { ...upd, id: upd.id||`${type.slice(0,-1)}-${Date.now()}`, createdAt: now }];
  }
  // Sync legado
  if (type==='characters') { const i = (proj.characters||[]).findIndex(c=>c.id===upd.id); i>=0 ? proj.characters[i]=upd : proj.characters?.push(upd); }
  if (type==='locations') { const i = (proj.locations||[]).findIndex(l=>l.id===upd.id); i>=0 ? proj.locations[i]=upd : proj.locations?.push(upd); }
  if (type==='objects') { const i = (proj.objects||[]).findIndex(o=>o.id===upd.id); i>=0 ? proj.objects[i]=upd : proj.objects?.push(upd); }
  return proj;
}

export function deleteEntity(proj, type, id) {
  if (!proj.entities) proj = ensureEntities(proj);
  proj.entities[type] = (proj.entities[type]||[]).filter(e => e.id !== id);
  if (type==='characters' && proj.characters) proj.characters = proj.characters.filter(c=>c.id!==id);
  if (type==='locations' && proj.locations) proj.locations = proj.locations.filter(l=>l.id!==id);
  if (type==='objects' && proj.objects) proj.objects = proj.objects.filter(o=>o.id!==id);
  return proj;
}
```

### Passo 0.3: Integrar no ProjectContext

**Arquivo:** `src/context/ProjectContext.jsx` (EDITAR)

**Linha 3:** Adicionar import:
```js
import { ensureEntities, updateEntity as updateEntityInProj, deleteEntity as deleteEntityFromProj } from '../lib/migration';
```

**No useState de projects:** Substituir `if (!saved) return initialProjects;` por `if (!saved) return initialProjects.map(ensureEntities);`

No merge, aplicar `ensureEntities` em cada projeto.

**Adicionar no Provider value:**
```js
updateEntity: (type, entity) => {
  const proj = { ...currentProject };
  const updated = updateEntityInProj(proj, type, entity);
  updateProject(updated);
},
deleteEntity: (type, id) => {
  const proj = { ...currentProject };
  const updated = deleteEntityFromProj(proj, type, id);
  updateProject(updated);
},
getEntity: (entityId) => getEntity(currentProject, entityId),
entities: currentProject.entities || ensureEntities(currentProject).entities,
```

### ✅ VERIFICAÇÃO FASE 0

```bash
cd D:/CineWeave
npm run build
```
Se build passar sem erros, Fase 0 OK. Abrir no navegador, verificar se Smoke Ninja Cat carrega normalmente.

---

## 🟢 FASE 1 — ENCICLOPÉDIA MULTI-ABAS

### Passo 1.1: 4 Novas Abas na EncyclopediaTab

**Arquivo:** `src/components/EncyclopediaTab.jsx` (EDITAR)

**Adicionar abas ao state:**
```js
const tabs = [
  { key: 'characters', label: 'Personagens', icon: '👤' },
  { key: 'locations', label: 'Locações', icon: '📍' },
  { key: 'objects', label: 'Objetos', icon: '📦' },
  { key: 'scenes', label: 'Cenas', icon: '🎬' },
  { key: 'plot_points', label: 'Plot Points', icon: '🎯' },
  { key: 'themes', label: 'Temas', icon: '💭' },
  { key: 'acts', label: 'Atos', icon: '📊' },
];
```

**Renderização condicional:** Após o switch de abas existente, adicionar cases para `scenes`, `plot_points`, `themes`, `acts`.

**Card de Cena:**
```jsx
<div className="ficha-card">
  <h3>{scene.title}</h3>
  <p className="text-xs text-gray-400">{scene.synopsis}</p>
  <div className="flex gap-1 mt-1">
    <span className="tag">{acts.find(a=>a.id===scene.actId)?.name || 'Sem ato'}</span>
    <span className="tag">{scene.characterIds.length} personagens</span>
  </div>
</div>
```

**Card de Plot Point:**
```jsx
<div className="ficha-card">
  <h3>{pp.title}</h3>
  <p className="text-xs text-gray-400">{pp.description}</p>
  <div className="flex gap-1 mt-1">
    {pp.tags.map(t => <span key={t} className="tag">{t}</span>)}
  </div>
</div>
```

**Card de Tema:**
```jsx
<div className="ficha-card">
  <h3>Tema</h3>
  <p className="text-sm italic">"{theme.statement}"</p>
  <p className="text-xs text-gray-400 mt-1">{theme.evidence}</p>
  <span className="tag">{theme.relevance}</span>
</div>
```

**Card de Ato:**
```jsx
<div className="ficha-card" style={{borderLeft: `4px solid ${act.color}`}}>
  <h3>{act.name}</h3>
  <p className="text-xs text-gray-400">{act.description}</p>
  <p className="text-xs text-gray-500">Ordem: {act.order + 1}</p>
</div>
```

### ✅ VERIFICAÇÃO FASE 1

Abrir o app, clicar em "Fichas". Devem aparecer 7 abas. Clicar em cada uma — dados devem aparecer.

---

## 🟢 FASE 2 — SCREENPLAY LINKADO

### Passo 2.1: entityId nos Elementos do Screenplay

**Arquivo:** `src/components/ScreenplayTab.jsx` (EDITAR)

Na função `saveScreenplay`, adicionar mapping de entityId:

```js
// ANTES de salvar, processar entityIds
const updatedWithEntities = updatedElements.map(el => {
  if (el.type === 'scene-heading' && !el.entityId) {
    const text = el.text.toUpperCase();
    const ents = currentProject.entities;
    // Match com scenes
    const sc = ents?.scenes?.find(s => s.title.toUpperCase() === text);
    if (sc) return { ...el, entityId: sc.id };
    // Match com locations e criar scene
    const locName = text.replace(/^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s*/,'').replace(/ - (DIA|NOITE|TARDE|MADRU|ENTARDECER).*$/,'').trim();
    const loc = ents?.locations?.find(l => l.name.toUpperCase() === locName);
    if (loc) {
      const newScene = { id: `scene-auto-${Date.now()}`, title: text, synopsis: '', actId: null, characterIds: [], order: ents.scenes.length, status: 'draft', createdAt: Date.now(), updatedAt: Date.now() };
      ents.scenes = [...ents.scenes, newScene];
      return { ...el, entityId: newScene.id };
    }
  }
  if (el.type === 'character' && !el.entityId) {
    const ent = currentProject.entities?.characters?.find(c => c.name.toUpperCase() === el.text.trim().toUpperCase());
    if (ent) return { ...el, entityId: ent.id };
  }
  return el;
});
```

**Passo 2.2: Detecção de Personagens por Cena**

Após salvar screenplay, rodar:
```js
const updateSceneCharacters = (screenplay, entities) => {
  let currentSceneId = null;
  const scChars = {};
  screenplay.forEach(el => {
    if (el.type === 'scene-heading') { currentSceneId = el.entityId; if (!scChars[currentSceneId]) scChars[currentSceneId] = new Set(); }
    if (el.type === 'character' && el.entityId && currentSceneId) scChars[currentSceneId].add(el.entityId);
  });
  return { ...entities, scenes: entities.scenes.map(s => ({ ...s, characterIds: scChars[s.id] ? [...scChars[s.id]] : s.characterIds })) };
};
```

---

## 🟢 FASE 3 — MIND MAP COMO VIEW

### Passo 3.1: Schema de Nó Simplificado

**Arquivo:** `src/components/MindMapTab.jsx` (EDITAR)

Substituir renderização de nós:
```js
const entityForNode = (node) => {
  if (!node.entityId || !currentProject.entities) return null;
  for (const [type, list] of Object.entries(currentProject.entities)) {
    const found = list.find(e => e.id === node.entityId);
    if (found) return { ...found, entityType: type };
  }
  return null;
};

// No renderNode:
const entity = entityForNode(node);
const label = entity?.name || entity?.title || entity?.statement?.substring(0,30) || '?';
const details = entity?.description || entity?.synopsis || entity?.evidence || '';
const entityType = entity?.entityType || 'unknown';
```

Ao criar nó novo (ex: arrastar do sidebar), criar entidade primeiro via `updateEntity`, depois criar nó com `entityId`.

### Passo 3.2: Atos como Faixas

Em vez de nós act, renderizar faixas verticais no fundo:
```jsx
{entities.acts?.map(act => (
  <rect key={act.id} x={80 + act.order * 250} y={0} width={240} height={canvasHeight}
    fill={act.color} opacity={0.04} rx={8}
  />
))}
```

---

## 🟡 FASE 4 — EXPORTAÇÃO / IMPORTAÇÃO

### Passo 4.1: Export Fountain

**Arquivo:** `src/lib/fountainExport.js` (CRIAR)

```js
export function exportFountain(project) {
  const lines = [`Title: ${project.title}`, `Author: ${project.author || ''}`, `Draft date: ${new Date().toLocaleDateString('pt-BR')}`, '===', ''];
  (project.screenplay || []).forEach(el => {
    switch (el.type) {
      case 'scene-heading': lines.push('', el.text, ''); break;
      case 'action': lines.push(el.text, ''); break;
      case 'character': lines.push(el.text.toUpperCase()); break;
      case 'parenthetical': lines.push(el.text); break;
      case 'dialogue': lines.push(el.text, ''); break;
      case 'transition': lines.push(el.text, ''); break;
    }
  });
  return lines.join('\n');
}
export function downloadFountain(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.fountain`;
  a.click(); URL.revokeObjectURL(url);
}
```

### Passo 4.2: Export PDF

**Arquivo:** `src/lib/pdfExport.js` (CRIAR)

```bash
npm install jspdf
```

```js
import { jsPDF } from 'jspdf';
export function exportScreenplayPDF(project) {
  const doc = new jsPDF({ unit: 'in', format: 'letter' });
  const els = project.screenplay || [];
  let y = 1, page = 1;
  const addPage = () => { doc.addPage(); y = 1; page++; };
  const wr = (text, indent=0, fs=12, bold=false) => {
    if (y > 10) addPage();
    doc.setFontSize(fs); doc.setFont('Courier', bold?'bold':'normal');
    doc.text(text, 1.5 + indent, y); y += fs * 0.08;
  };
  els.forEach(el => {
    switch (el.type) {
      case 'scene-heading': wr(el.text.toUpperCase(), 0, 12, true); y+=0.05; break;
      case 'action': wr(el.text, 0, 12); y+=0.05; break;
      case 'character': wr(el.text.toUpperCase(), 2.5, 12, true); break;
      case 'parenthetical': wr(el.text, 2, 11); break;
      case 'dialogue': wr(el.text, 1.5, 12); y+=0.05; break;
      case 'transition': wr(el.text, 3.5, 12, true); y+=0.05; break;
    }
  });
  doc.save(`${project.title}-roteiro.pdf`);
}
```

### Passo 4.3: Import Fountain

**Arquivo:** `src/lib/fountainImport.js` (CRIAR)

```js
export function parseFountain(text) {
  const elements = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    const next = i+1 < lines.length ? lines[i+1].trim() : '';
    const prev = i > 0 ? lines[i-1].trim() : '';
    if (l === '===') continue;
    if (elements.length === 0 && !l.match(/^(INT|EXT)/i)) continue;
    if (l.match(/^(INT|EXT|INT\/EXT|I\/E)/i)) { elements.push({ id: `sc-import-${i}`, type: 'scene-heading', text: l }); continue; }
    if (l === l.toUpperCase() && l.length >= 2 && !prev && next && !l.match(/^(INT|EXT)/i) && !l.startsWith('@')) { elements.push({ id: `sc-import-${i}`, type: 'character', text: l.replace(/^@/,'') }); continue; }
    if (l.startsWith('(')) { elements.push({ id: `sc-import-${i}`, type: 'parenthetical', text: l }); continue; }
    if (l.endsWith('TO:') || l.startsWith('>')) { elements.push({ id: `sc-import-${i}`, type: 'transition', text: l.replace(/^>/,'') }); continue; }
    if (l) elements.push({ id: `sc-import-${i}`, type: 'action', text: l });
  }
  return elements;
}
```

### Passo 4.4: Navegador de Roteiros Locais

**Arquivo:** `src/components/ScriptBrowser.jsx` (CRIAR)

**Setup:** Copiar PDFs de `D:\CineWeave\ROTEIROS\` para `D:\CineWeave\public\roteiros\` e gerar `index.json`.

```jsx
import React, { useState, useEffect } from 'react';
import { parseFile } from '../lib/fileParser';
export default function ScriptBrowser() {
  const [scripts, setScripts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => { fetch('/roteiros/index.json').then(r=>r.json()).then(setScripts).catch(()=>{}); }, []);
  const loadScript = async (name) => {
    setLoading(true);
    try {
      const resp = await fetch(`/roteiros/${name}`);
      const blob = await resp.blob();
      const file = new File([blob], name, { type: 'application/pdf' });
      setContent(await parseFile(file));
    } catch(e) { setContent(`Erro: ${e.message}`); }
    setLoading(false);
  };
  const filtered = scripts.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-gray-800 p-4 overflow-auto">
        <h2 className="text-sm font-bold text-yellow-500 mb-2">Roteiros ({filtered.length})</h2>
        <input type="text" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}
          className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-white text-xs mb-2" />
        {filtered.map(s => (
          <div key={s.name} className={`p-2 cursor-pointer rounded text-xs ${selected===s.name?'bg-yellow-900/30':'hover:bg-gray-800'}`}
            onClick={()=>{setSelected(s.name);loadScript(s.name);}}>
            <div className="font-bold text-white">{s.title}</div>
            <div className="text-gray-500">{s.pages}p</div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {loading && <p className="text-gray-400">Carregando...</p>}
        {content && <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{content}</pre>}
        {!loading && !content && <p className="text-gray-500">Selecione um roteiro</p>}
      </div>
    </div>
  );
}
```

**Gerar index.json:**
```bash
cd D:/CineWeave/ROTEIROS
python -c "
import os, json
files = [f for f in os.listdir('.') if f.endswith('.pdf')]
index = [{'name': f, 'title': f.replace('.pdf','').replace('_',' ').replace('-',' ').title(), 'pages': 0} for f in files]
# Copy to public
import shutil
os.makedirs('../public/roteiros', exist_ok=True)
with open('../public/roteiros/index.json','w') as fp: json.dump(index, fp, indent=2)
for f in files:
    shutil.copy2(f, f'../public/roteiros/{f}')
print(f'Copied {len(files)} files + index.json')
"
```

---

## 🟡 FASE 5 — CORKBOARD

**Arquivo:** `src/components/CorkboardTab.jsx` (CRIAR)

```jsx
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';

export default function CorkboardTab() {
  const { currentProject, navigateTo } = useProject();
  const entities = currentProject.entities || {};
  const scenes = entities.scenes || [];
  const acts = entities.acts || [];

  const scenesByAct = acts.map(act => ({
    act, scenes: scenes.filter(s => s.actId === act.id).sort((a,b) => a.order - b.order),
  }));

  return (
    <div className="flex gap-4 p-4 overflow-auto h-full">
      {scenesByAct.map(({ act, scenes: actScenes }) => (
        <div key={act.id} className="flex-shrink-0 w-64">
          <h3 className="text-sm font-bold mb-2 px-2 py-1 rounded"
            style={{ background: act.color+'22', borderLeft: `3px solid ${act.color}`, color: act.color }}>
            {act.name}
          </h3>
          <div className="flex flex-col gap-2"
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault(); /* TODO: update actId */}}>
            {actScenes.map(scene => (
              <div key={scene.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3 cursor-pointer hover:border-yellow-600"
                draggable onClick={() => navigateTo('screenplay', scene.id)}>
                <div className="font-bold text-sm text-white">{scene.title}</div>
                <div className="text-xs text-gray-400 mt-1">{scene.synopsis}</div>
                <div className="text-xs text-gray-600 mt-1">{scene.characterIds.length} personagens</div>
              </div>
            ))}
            {actScenes.length === 0 && <div className="text-xs text-gray-600 p-4 text-center border border-dashed border-gray-700 rounded">Arraste cenas aqui</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
```

Adicionar no App.jsx como 5ª aba:
```jsx
case 'corkboard': return <CorkboardTab />;
```

---

## 🟡 FASE 6 — COMPARAÇÃO DE REVISÕES

### Passo 6.1: Diff Engine

**Arquivo:** `src/lib/diffUtils.js` (CRIAR)

```js
export function diffScreenplay(oldEls, newEls) {
  const changes = [];
  const maxLen = Math.max(oldEls.length, newEls.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldEls[i], n = newEls[i];
    if (!o && n) changes.push({ type: 'added', index: i, element: n });
    else if (o && !n) changes.push({ type: 'removed', index: i, element: o });
    else if (o.text !== n.text || o.type !== n.type) changes.push({ type: 'modified', index: i, old: o, new: n });
  }
  return changes;
}
```

### Passo 6.2: UI de Diff

**Arquivo:** `src/components/RevisionDiffModal.jsx` (CRIAR)

```jsx
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { diffScreenplay } from '../lib/diffUtils';

export default function RevisionDiffModal({ isOpen, onClose }) {
  const { currentProject } = useProject();
  const history = currentProject.history || [];
  const [vA, setVA] = useState(history[0]?.id||'');
  const [vB, setVB] = useState(history[1]?.id||'');
  const [diffs, setDiffs] = useState([]);
  const compare = () => {
    const a = history.find(v=>v.id===vA), b = history.find(v=>v.id===vB);
    if (!a||!b) return;
    setDiffs(diffScreenplay(a.screenplay, b.screenplay));
  };
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-[90vw] max-h-[80vh] overflow-auto" onClick={e=>e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Comparar Revisões</h2>
        <div className="flex gap-2 mb-4">
          <select value={vA} onChange={e=>setVA(e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-1 text-xs">
            {history.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <span className="text-gray-400">vs</span>
          <select value={vB} onChange={e=>setVB(e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-1 text-xs">
            {history.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button onClick={compare} className="btn-primary py-1 px-3 text-xs">Comparar</button>
        </div>
        {diffs.map((d,i) => (
          <div key={i} className={`p-2 mb-1 rounded text-xs font-mono ${
            d.type==='added'?'bg-green-900/20 border-l-2 border-green-500':
            d.type==='removed'?'bg-red-900/20 border-l-2 border-red-500':
            'bg-yellow-900/20 border-l-2 border-yellow-500'
          }`}>
            <span className="text-gray-500">[{d.type}] Ln {d.index+1}</span>
            <div className="text-white">{d.element?.text || d.new?.text}</div>
            {d.old && <div className="text-red-400 line-through">{d.old.text}</div>}
          </div>
        ))}
        {diffs.length===0 && <p className="text-gray-500">Nenhuma diferença.</p>}
      </div>
    </div>
  );
}
```

---

## 🟠 FASE 7 — AI FEEDBACK + REESCRITA

### Passo 7.1: Feedback de Qualidade

**Arquivo:** `src/lib/aiFeedback.js` (CRIAR)

```js
import { getLLMApiKey } from './llm';
const NVIDIA_URL = '/api/nvidia';

export async function analyzeScreenplay(screenplayElements) {
  const key = getLLMApiKey();
  if (!key) throw new Error('Configure a chave NVIDIA AI.');
  const text = screenplayElements.map(e => `[${e.type}] ${e.text}`).join('\n');
  const prompt = `Analise o roteiro em JSON seguindo padrões Hollywood:
{
  "pacing": "Rápido|Moderado|Lento",
  "dialogueQuality": "Natural|Expositivo|Robótico|Dramático",
  "tone": "string",
  "issues": [{"type":"pacing|dialogue|plotHole|character","line":0,"description":"string"}],
  "suggestions": ["string"],
  "score": 0-10
}
ROTEIRO:\n${text.substring(0,8000)}`;
  const resp = await fetch(NVIDIA_URL, {
    method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
    body: JSON.stringify({ model:'meta/llama-3.1-70b-instruct', messages:[{role:'user',content:prompt}], temperature:0.3, max_tokens:2000 }),
  });
  const data = await resp.json();
  const c = data.choices?.[0]?.message?.content || '';
  try { return JSON.parse(c); } catch { return { error: 'Formato inválido', raw: c }; }
}
```

### Passo 7.2: Reescrita Contextual

```js
export async function rewriteDialogue(text, tone = 'dramatico') {
  const key = getLLMApiKey();
  const toneMap = { dramatico: 'mais dramático', comico: 'mais cômico', terso: 'mais curto e direto', poetico: 'mais poético' };
  const prompt = `Reescreva o diálogo para ser ${toneMap[tone]||toneMap.dramatico}. Mantenha formato de roteiro. APENAS texto reescrito.\n\n${text}`;
  const resp = await fetch(NVIDIA_URL, {
    method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
    body: JSON.stringify({ model:'meta/llama-3.1-70b-instruct', messages:[{role:'user',content:prompt}], temperature:0.7, max_tokens:2000 }),
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || text;
}
```

---

## 🔴 FASE 8 — AVANÇADAS

### Passo 8.1: Script Breakdown

**Arquivo:** `src/components/BreakdownTab.jsx` (CRIAR)

Lista cenas com checkboxes para:
- Personagens presentes
- Figurino
- Adereços
- Locação
- Período

Cada cena vira linha de planilha de produção.

### Passo 8.2: Metas Diárias

**Arquivo:** `src/lib/wordCounter.js` (CRIAR)

```js
export function countWords(screenplay) {
  return (screenplay||[]).filter(e => ['action','dialogue'].includes(e.type))
    .reduce((s, e) => s + e.text.split(/\s+/).filter(w => w.length > 0).length, 0);
}
export function getDailyStats(projectId) {
  const raw = localStorage.getItem(`cineweave_stats_${projectId}`);
  return raw ? JSON.parse(raw) : { wordsToday: 0, streak: 0, lastDate: null };
}
export function updateDailyStats(projectId, wordCount) {
  const stats = getDailyStats(projectId);
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastDate === today) stats.wordsToday = wordCount;
  else {
    const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
    if (stats.lastDate === yesterday && wordCount > 0) stats.streak++;
    else if (stats.lastDate !== today) stats.streak = wordCount > 0 ? 1 : 0;
    stats.wordsToday = wordCount; stats.lastDate = today;
  }
  localStorage.setItem(`cineweave_stats_${projectId}`, JSON.stringify(stats));
  return stats;
}
```

---

## 🔴 FASE 9 — SCRIPT COVERAGE AUTOMÁTICO

### Passo 9.1: Sistema de Rating Grid

**Arquivo:** `src/lib/scriptCoverage.js` (CRIAR)

```js
const CRITERIA = [
  { key:'plot', label:'Plot', weight:5, desc:'Estrutura, originalidade, lógica' },
  { key:'character', label:'Personagens', weight:5, desc:'Profundidade, arco, motivação' },
  { key:'dialogue', label:'Diálogo', weight:4, desc:'Naturalidade, subtexto, voz única' },
  { key:'structure', label:'Estrutura', weight:4, desc:'Atos, beats, pacing' },
  { key:'commercial', label:'Potencial Comercial', weight:3, desc:'Mercado, público-alvo' },
  { key:'format', label:'Formatação', weight:2, desc:'Formato correto, erros' },
];

export function calculateScore(ratings) {
  const totalWeight = CRITERIA.reduce((s, c) => s + c.weight, 0);
  const weighted = CRITERIA.reduce((s, c) => s + (ratings[c.key]||5) * c.weight, 0);
  const final = weighted / totalWeight;
  return {
    scores: ratings,
    weightedAverage: Math.round(final * 10) / 10,
    recommendation: final < 4 ? 'Pass' : final < 7 ? 'Consider' : 'Recommend',
  };
}
```

### Passo 9.2: Beat Sheet Analyzer

```js
const SAVE_THE_CAT = [
  { name:'Opening Image', pct:1 }, { name:'Theme Stated', pct:5 },
  { name:'Catalyst', pct:10 }, { name:'Debate', pct:10 },
  { name:'Break into Two', pct:20 }, { name:'B Story', pct:22 },
  { name:'Fun & Games', pct:20 }, { name:'Midpoint', pct:55 },
  { name:'Bad Guys Close In', pct:55 }, { name:'All Is Lost', pct:75 },
  { name:'Dark Night of the Soul', pct:75 }, { name:'Break into Three', pct:85 },
  { name:'Finale', pct:85 }, { name:'Final Image', pct:99 },
];

export function analyzeBeats(screenplay) {
  const total = screenplay.length;
  return SAVE_THE_CAT.map(beat => ({
    ...beat,
    expectedLine: Math.floor(total * beat.pct / 100),
  }));
}
```

### Passo 9.3: Grafo de Personagens

```js
export function buildCharacterGraph(screenplay) {
  const edges = {};
  let last = null;
  screenplay.forEach(el => {
    if (el.type === 'character') {
      if (last && last !== (el.entityId || el.text)) {
        const k = [last, el.entityId||el.text].sort().join('::');
        edges[k] = (edges[k]||0) + 1;
      }
      last = el.entityId || el.text;
    }
  });
  const centrality = {};
  Object.entries(edges).forEach(([k,w]) => { const [a,b]=k.split('::'); centrality[a]=(centrality[a]||0)+w; centrality[b]=(centrality[b]||0)+w; });
  return { edges: Object.entries(edges).map(([k,w]) => { const [s,t]=k.split('::'); return {source:s,target:t,weight:w}; }), centrality };
}
```

### Passo 9.4: Script Coverage Report

**Arquivo:** `src/components/CoverageReport.jsx` (CRIAR)

Renderizar:
- Header (título, autor, páginas, gênero)
- Logline
- Synopsis
- Rating grid (barras visuais)
- Recommendation (Pass/Consider/Recommend com cor)
- Beat Analysis
- Character Graph (SVG simples)

---

## 🔴 FASE 10 — COMPARADOR COM BENCHMARK

**Arquivo:** `src/lib/benchmarkCompare.js` (CRIAR)

```js
import benchmark from '../../ROTEIROS/benchmark_data.json';

export function compareToIndustry(metrics, genre = 'feature_film') {
  const ind = benchmark[genre === 'feature' ? 'feature_film' : 'tv_episode'];
  if (!ind) return null;
  return {
    ratio_ad: compareMetric(metrics.ratio_ad, ind.avg_ratio_ad, 1.5, 0.5, 'Ratio Ação:Diálogo'),
    dialogue_words: compareMetric(metrics.avg_dialogue_words, ind.avg_dialogue_words, 1.3, 0.7, 'Palavras por fala'),
    action_words: compareMetric(metrics.avg_action_words, ind.avg_action_words, 1.3, 0.7, 'Palavras por ação'),
    pct_int: compareMetric(metrics.pct_int, ind.avg_pct_int, 1.2, 0.8, '% INT'),
  };
}

function compareMetric(user, benchmark, highRatio, lowRatio, label) {
  const ratio = user / benchmark;
  let status = '✅', suggestion = '';
  if (ratio > highRatio) { status = '⚠️'; suggestion = `Muito alto (${user.toFixed(1)} vs ${benchmark} benchmark).`; }
  else if (ratio < lowRatio) { status = '⚠️'; suggestion = `Muito baixo (${user.toFixed(1)} vs ${benchmark} benchmark).`; }
  else suggestion = 'Dentro do padrão.';
  return { label, user, benchmark, ratio: ratio.toFixed(2), status, suggestion };
}
```

---

## 📋 ORDEM DE EXECUÇÃO (linha a linha)

```
1.  npm install jspdf           (dependência PDF)
2.  Criar src/context/EntitiesSchema.js
3.  Criar src/lib/migration.js
4.  Editar src/context/ProjectContext.jsx (import + migration + provider)
5.  npm run build               (verificar se compila)
6.  Editar src/components/EncyclopediaTab.jsx (7 abas)
7.  npm run build               (verificar)
8.  Editar src/components/ScreenplayTab.jsx (entityId)
9.  npm run build               (verificar)
10. Editar src/components/MindMapTab.jsx (entity lookup + faixas)
11. npm run build               (verificar)
12. Criar src/lib/fountainExport.js + fountainImport.js
13. Criar src/lib/pdfExport.js
14. Copiar ROTEIROS/ → public/roteiros/ + index.json
15. Criar src/components/ScriptBrowser.jsx
16. Criar src/components/CorkboardTab.jsx
17. Editar src/App.jsx (adicionar aba corkboard)
18. Criar src/lib/diffUtils.js + src/components/RevisionDiffModal.jsx
19. Criar src/lib/aiFeedback.js
20. npm run build               (verificar tudo)
21. Criar src/lib/wordCounter.js
22. Criar src/lib/scriptCoverage.js
23. Criar src/components/CoverageReport.jsx
24. Criar src/lib/benchmarkCompare.js
25. npm run build               (verificação final)
```

---

## ✅ CHECKLIST PRÉ-BUILD

A cada passo, verificar:
- [ ] Nenhum `/* BEAT: */` foi removido
- [ ] `REVISION_GENERATIONS` intacto
- [ ] `revisionMode`, `NovelMode` funcionam
- [ ] Smoke Ninja Cat carrega sem crash
- [ ] localStorage não corrompido
