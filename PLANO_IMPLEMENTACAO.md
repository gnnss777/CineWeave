# PLANO DE IMPLEMENTAÇÃO — CineWeave

**Versão:** 1.0
**Base:** `D:\CineWeave`
**Stack:** React 19 + Vite + localStorage + Supabase

---

## REGRA ABSOLUTA

**NUNCA modificar / remover:**
- `/* BEAT: ... END_BEAT */` — bloco de metadados do Beat
- `REVISION_GENERATIONS` — sistema de 8 níveis de revisão
- `revisionMode`, `revisionGeneration`, `revisions[]`
- `NovelMode`
- Plugin engine (linter, Bechdel, cleaner)
- `[[beat categoria:detalhe]]` markers no texto
- Gêneros, cores, marcadores de revisão

---

# FASE 0 — FUNDAÇÃO: `project.entities`

## 0.1 — Schema de Entidades Central

### Arquivo: `src/context/EntitiesSchema.js` (NOVO)

```js
// Estrutura canônica de cada tipo de entidade

export const ENTITY_TYPES = {
  characters: {
    id: 'char-{id}',
    name: '',
    role: 'Coadjuvante',       // Protagonista, Antagonista, Aliado, Mentor, Coadjuvante
    description: '',
    traits: [],                 // array de strings
    backstory: '',
    avatar: 'amber',            // cor do avatar
    notes: '',
    relationships: [],          // [{ targetId: 'char-2', type: 'aliado', intensity: 5 }]
    createdAt: 0,
    updatedAt: 0,
  },
  locations: {
    id: 'loc-{id}',
    name: '',
    type: 'INT.',               // INT., EXT., INT./EXT.
    description: '',
    timeOfDay: 'DIA',
    mood: '',
    group: '',
    createdAt: 0,
    updatedAt: 0,
  },
  objects: {
    id: 'obj-{id}',
    name: '',
    description: '',
    significance: '',
    group: '',
    createdAt: 0,
    updatedAt: 0,
  },
  scenes: {
    id: 'scene-{id}',
    title: '',
    synopsis: '',
    actId: null,                // ref para entities.acts[].id
    characterIds: [],           // refs para entities.characters[].id
    order: 0,                   // posição na timeline
    status: 'draft',            // draft, written, revised, final
    createdAt: 0,
    updatedAt: 0,
  },
  plot_points: {
    id: 'plot-{id}',
    title: '',
    description: '',
    actId: null,
    tags: [],
    createdAt: 0,
    updatedAt: 0,
  },
  themes: {
    id: 'theme-{id}',
    statement: '',
    evidence: '',
    relevance: 'Central',       // Central, Secundário, Menor
    createdAt: 0,
    updatedAt: 0,
  },
  acts: {
    id: 'act-{id}',
    name: '',
    order: 0,
    description: '',
    color: '#ccee00',
    createdAt: 0,
    updatedAt: 0,
  },
};
```

## 0.2 — Adaptador de Compatibilidade em ProjectContext

### Arquivo: `src/context/ProjectContext.jsx`

**O QUE FAZER:**

1. **Adicionar função de migração** no carregamento do `initialProjects` e no `useState` de projetos:

```js
// Antes do useState de projects, adicionar:
const ensureEntities = (proj) => {
  if (proj.entities) return proj; // já migrado

  const bd = proj.brainstormData || {};
  const scenes = [
    ...(bd.scenes || []).map((s, i) => ({
      id: `scene-${proj.id}-${i}`,
      title: s.title || '',
      synopsis: s.description || '',
      actId: null, // será mapeado depois
      characterIds: [],
      order: i,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })),
    // Se existirem scenes no mindMapNodes, mergear
    ...(proj.mindMapNodes || [])
      .filter(n => n.type === 'scene')
      .filter(n => !bd.scenes?.some(s => s.title === n.label))
      .map((n, i) => ({
        id: `scene-${proj.id}-mm-${i}`,
        title: n.label || '',
        synopsis: n.details || '',
        actId: null,
        characterIds: [],
        order: i + (bd.scenes?.length || 0),
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
  ];

  const plot_points = (bd.plot_points || []).map((p, i) => ({
    id: `plot-${proj.id}-${i}`,
    title: p.title || '',
    description: p.description || '',
    actId: null,
    tags: p.tags || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  const themes = (bd.themes || []).map((t, i) => ({
    id: `theme-${proj.id}-${i}`,
    statement: t.statement || '',
    evidence: t.evidence || '',
    relevance: t.relevance || 'Central',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  // Extrair acts do mindMapNodes
  const actNodes = (proj.mindMapNodes || []).filter(n => n.type === 'act');
  const acts = actNodes.map((n, i) => ({
    id: n.id.replace(/^n-/, 'act-'), // preserva link
    name: n.label || `ATO ${['I','II','III','IV','V'][i] || i+1}`,
    order: i,
    description: n.details || '',
    color: '#ccee00',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  // Mapear actId nas scenes e plot_points baseado nos atos do mindmap
  actNodes.forEach((actNode, actIdx) => {
    // Encontrar scenes linkadas a este act no mindMapLinks
    const linkedScenes = (proj.mindMapLinks || [])
      .filter(l => l.source === actNode.id)
      .map(l => l.target);
    const linkedPlotPoints = (proj.mindMapLinks || [])
      .filter(l => l.source === actNode.id)
      .map(l => l.target);

    scenes.forEach(s => {
      const mmNode = (proj.mindMapNodes || []).find(n => 
        n.type === 'scene' && n.label === s.title
      );
      if (mmNode && linkedScenes.includes(mmNode.id)) {
        s.actId = `act-${proj.id}-${actIdx}`;
      }
    });
    plot_points.forEach(pp => {
      const ppAct = bd.plot_points?.find(bp => bp.title === pp.title);
      if (ppAct && ppAct.act) {
        const romanIdx = ['I','II','III','IV','V'].indexOf(ppAct.act.toUpperCase());
        if (romanIdx >= 0) pp.actId = `act-${proj.id}-${romanIdx}`;
      }
    });
  });

  return {
    ...proj,
    entities: {
      characters: proj.characters || [],
      locations: proj.locations || [],
      objects: proj.objects || [],
      scenes,
      plot_points,
      themes,
      acts,
    },
  };
};
```

2. **Aplicar no carregamento:**
   - No `useState(initialProjects)`, mapear cada projeto com `ensureEntities`
   - No merge com saved/supabase, aplicar `ensureEntities` também

3. **Obsoleter arrays antigos** (mas manter para compat):
   - `project.characters` → getter lê `project.entities.characters`
   - `project.brainstormData` → mantido mas ignorado após migração
   - Ao salvar, escrever em ambos (entities + legado) até Fase 0.3

## 0.3 — Getters de Compatibilidade

### Arquivo: `src/context/ProjectContext.jsx`

No provider, adicionar derived state:

```js
// Dentro do CineWeaveShell ou como hook separado
const getEntities = (proj) => proj.entities || ensureEntities(proj);

// Getters para não quebrar componentes existentes:
const characters = currentProject.entities?.characters || currentProject.characters || [];
const locations = currentProject.entities?.locations || currentProject.locations || [];
const objects = currentProject.entities?.objects || currentProject.objects || [];
```

**NÃO** remover `brainstormData` ainda — componentes como BrainstormTab ainda lêem dele. Remover só na Fase 1 quando a BrainstormTab for refatorada.

### Dependências quebradas (precisa atualizar):

| Componente | Lê de | Novo local |
|-----------|-------|-----------|
| BrainstormTab | `brainstormData.*` | `entities.*` |
| EnciclopédiaTab | `project.characters/locations/objects` | `entities.characters/locations/objects` |
| MindMapTab | `mindMapNodes[].label/details` | `entities.*` + layout puro |
| ScreenplayTab | `project.characters[]` | `entities.characters` |
| SharedSidebar | `project.*` | `entities.*` |

---

# FASE 1 — ENCICLOPÉDIA MULTI-ABAS

## 1.1 — Novas Abas

### Arquivo: `src/components/EncyclopediaTab.jsx`

**O QUE FAZER:**

1. **Adicionar abas novas** ao `activeTab` state:
```js
const [activeTab, setActiveTab] = useState('characters');
// NOVAS: scenes, plot_points, themes, acts
```

2. **Renderização condicional por aba**, mesma estrutura de cards das abas existentes (Personagens/Locações/Objetos).

3. **Card padrão para cada tipo novo:**

**Cena card:**
```jsx
<div className="ficha-card">
  <h3>{scene.title}</h3>
  <p className="text-xs text-gray-400">{scene.synopsis}</p>
  <div className="flex gap-1 mt-1">
    <span className="tag">{scene.actId ? acts.find(a => a.id === scene.actId)?.name : 'Sem ato'}</span>
    <span className="tag">{scene.characterIds.length} personagens</span>
  </div>
</div>
```

**Plot Point card:**
```jsx
<div className="ficha-card">
  <h3>{pp.title}</h3>
  <p className="text-xs text-gray-400">{pp.description}</p>
  <div className="flex gap-1 mt-1">
    {pp.tags.map(t => <span key={t} className="tag">{t}</span>)}
  </div>
</div>
```

**Tema card:**
```jsx
<div className="ficha-card">
  <h3>Tema</h3>
  <p className="text-sm italic">"{theme.statement}"</p>
  <p className="text-xs text-gray-400 mt-1">{theme.evidence}</p>
  <span className="tag">{theme.relevance}</span>
</div>
```

**Ato card:**
```jsx
<div className="ficha-card">
  <h3>{act.name}</h3>
  <p className="text-xs text-gray-400">{act.description}</p>
  <p className="text-xs text-gray-500">Ordem: {act.order + 1}</p>
</div>
```

4. **Formulário de edição/criação** para cada novo tipo (seguir padrão dos forms existentes de Character/Location/Object).

## 1.2 — Navegação Cruzada

No `ProjectContext`, as funções `navigateTo(tab, targetId)` já existem. Garantir que:

- Clicar num card de Cena na Enciclopédia → navega pra aba Roteiro com `entityId` scroll
- Clicar num card de Personagem → navega pra aba Roteiro com `entityId` scroll (já existe)
- Clicar num card de Plot Point → navega pro mind map com o nó em foco

Implementar via `useNavigate`:

```js
// No card de cena
<button onClick={() => navigateTo('screenplay', scene.id)}>
  Ver no Roteiro
</button>
```

---

# FASE 2 — SCREENPLAY LINKADO

## 2.1 — entityId nos Elementos do Screenplay

### Arquivo: `src/components/ScreenplayTab.jsx`

**O QUE FAZER:**

1. **Scene-heading ganha `entityId`** ao detectar matching com Entities:

```js
// Na função saveScreenplay, ao processar scene-headings:
const updatedWithEntities = updatedElements.map(el => {
  if (el.type === 'scene-heading' && !el.entityId) {
    const text = el.text.toUpperCase();
    // Tenta matching com entities.scenes pelo título
    const matchingScene = currentProject.entities?.scenes?.find(s =>
      s.title.toUpperCase() === text
    );
    if (matchingScene) {
      return { ...el, entityId: matchingScene.id };
    }
    // Tenta matching com entities.locations
    const locName = text.replace(/^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s*/, '').replace(/ - (DIA|NOITE|TARDE|MADRU|ENTARDECER).*$/, '').trim();
    const matchingLoc = currentProject.entities?.locations?.find(l =>
      l.name.toUpperCase() === locName
    );
    if (matchingLoc) {
      // Se não tem cena pra este heading, criar uma
      const newScene = {
        id: `scene-auto-${Date.now()}`,
        title: text,
        synopsis: '',
        actId: null,
        characterIds: [],
        order: currentProject.entities.scenes.length,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // Adicionar a entities
      return { ...el, entityId: newScene.id };
    }
  }
  if (el.type === 'character' && !el.entityId) {
    const matchingChar = currentProject.entities?.characters?.find(c =>
      c.name.toUpperCase() === el.text.trim().toUpperCase()
    );
    if (matchingChar) {
      return { ...el, entityId: matchingChar.id };
    }
  }
  return el;
});
```

2. **Autocomplete avançado:**
   - Usar `entities.characters` (já faz, mas fonte muda)
   - Usar `entities.locations` (já faz)
   - Usar `entities.scenes` como fallback pra scene-heading

## 2.2 — Detecção de Personagens por Cena

Ao salvar o roteiro, percorrer blocos e classificar:

```js
// Depois de salvar screenplay, mapear quais personagens aparecem em cada cena:
const updateSceneCharacters = (screenplay, entities) => {
  let currentSceneId = null;
  const sceneCharacters = {};

  screenplay.forEach(el => {
    if (el.type === 'scene-heading') {
      currentSceneId = el.entityId;
      if (!sceneCharacters[currentSceneId]) sceneCharacters[currentSceneId] = new Set();
    }
    if (el.type === 'character' && el.entityId && currentSceneId) {
      sceneCharacters[currentSceneId].add(el.entityId);
    }
  });

  // Atualizar entities.scenes[].characterIds
  const updatedScenes = entities.scenes.map(s => ({
    ...s,
    characterIds: sceneCharacters[s.id] ? Array.from(sceneCharacters[s.id]) : s.characterIds,
  }));

  return { ...entities, scenes: updatedScenes };
};
```

---

# FASE 3 — MIND MAP COMO VIEW PURA

## 3.1 — Schema de Nó Simplificado

### Arquivo: `src/components/MindMapTab.jsx`

**O QUE FAZER:**

1. **Novo formato de nó:**
```js
// Antes:
{ id: 'snc-char-1', label: 'Fumaça', type: 'character', x:150, y:280, details: '...' }

// Depois:
{ entityId: 'char-1', x:150, y:280 }
```

2. **Renderização busca dados de `entities`:**
```js
const renderNode = (node) => {
  const entity = findEntity(node.entityId);
  if (!entity) return null;

  const type = getEntityType(node.entityId); // 'characters', 'locations', etc.
  const label = entity.name || entity.title || entity.statement?.substring(0, 30);
  const details = entity.description || entity.synopsis || entity.evidence || '';
  const color = getColorForType(type);

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <rect fill={color} ... />
      <text>{label}</text>
      <text className="details">{details}</text>
    </g>
  );
};
```

3. **Função auxiliar de lookup:**
```js
const findEntity = (entityId) => {
  if (!entityId || !currentProject.entities) return null;
  for (const [type, list] of Object.entries(currentProject.entities)) {
    const found = list.find(e => e.id === entityId);
    if (found) return found;
  }
  return null;
};
```

4. **Ao criar nó novo** (ex: arrastar do sidebar), criar entidade primeiro, depois nó com `entityId`.

## 3.2 — Atos como Faixas, Não Nós

Em vez de nós do tipo 'act', o mind map pode mostrar **faixas coloridas verticais** representando cada ato:

```jsx
// Renderizar faixas de atos no fundo
{entities.acts?.map(act => (
  <rect
    key={act.id}
    x={actX(act.order)}
    y={0}
    width={actWidth}
    height={canvasHeight}
    fill={act.color}
    opacity={0.05}
  />
  <text x={actX(act.order) + 10} y={20} fill={act.color} opacity={0.5}>
    {act.name}
  </text>
))}
```

Os nós de cena/plot point referenciam `actId`, então a posição X pode ser calculada automaticamente (não precisa mais de x fixo no nó).

---

# FASE 4 — EXPORTAÇÃO E IMPORTAÇÃO

## 4.1 — Export Fountain

### Arquivo: `src/lib/fountainExport.js` (NOVO)

```js
export function exportFountain(project) {
  const lines = [];
  const screenplay = project.screenplay || [];

  lines.push(`Title: ${project.title}`);
  lines.push(`Author: ${project.author || ''}`);
  lines.push(`Draft date: ${new Date().toLocaleDateString('pt-BR')}`);
  lines.push('===');
  lines.push('');

  screenplay.forEach(el => {
    switch (el.type) {
      case 'scene-heading':
        lines.push('');
        lines.push(el.text);
        lines.push('');
        break;
      case 'action':
        lines.push(el.text);
        lines.push('');
        break;
      case 'character':
        lines.push(el.text.toUpperCase());
        break;
      case 'parenthetical':
        lines.push(el.text);
        break;
      case 'dialogue':
        lines.push(el.text);
        lines.push('');
        break;
      case 'transition':
        lines.push(el.text);
        lines.push('');
        break;
    }
  });

  return lines.join('\n');
}

export function downloadFountain(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.fountain`;
  a.click();
  URL.revokeObjectURL(url);
}
```

## 4.2 — Export PDF Formatado

### Arquivo: `src/lib/pdfExport.js` (NOVO)

Usar `pdfjs-dist` já no package.json.

```js
import { jsPDF } from 'jspdf'; // ADD: npm install jspdf

export function exportScreenplayPDF(project) {
  const doc = new jsPDF({ unit: 'in', format: 'letter' });
  const screenplay = project.screenplay || [];
  const pageWidth = 8.5;
  const pageHeight = 11;
  const marginLeft = 1.5;  // margem Hollywood
  const marginRight = 1;
  const marginTop = 1;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = marginTop;
  let page = 1;

  const addPage = () => {
    doc.addPage();
    y = marginTop;
    page++;
    // Page number
    doc.setFontSize(10);
    doc.text(`${project.title} - ${page}`, pageWidth / 2, 0.5, { align: 'center' });
    y = marginTop;
  };

  const writeLine = (text, indent = 0, fontSize = 12, bold = false) => {
    const x = marginLeft + indent;
    if (y > pageHeight - 1) addPage();
    doc.setFontSize(fontSize);
    if (bold) doc.setFont('Courier', 'bold');
    else doc.setFont('Courier', 'normal');
    doc.text(text, x, y);
    y += fontSize * 0.08;
  };

  screenplay.forEach(el => {
    switch (el.type) {
      case 'scene-heading':
        writeLine(el.text.toUpperCase(), 0, 12, true);
        y += 0.05;
        break;
      case 'action':
        writeLine(el.text, 0, 12);
        y += 0.05;
        break;
      case 'character':
        writeLine(el.text.toUpperCase(), 2.5, 12, true); // centered-ish
        break;
      case 'parenthetical':
        writeLine(el.text, 2, 11);
        break;
      case 'dialogue':
        writeLine(el.text, 1.5, 12);
        y += 0.05;
        break;
      case 'transition':
        writeLine(el.text, 3.5, 12, true);
        y += 0.05;
        break;
    }
  });

  doc.save(`${project.title}-roteiro.pdf`);
}
```

**DEPENDÊNCIA:** `npm install jspdf`

## 4.3 — Import Fountain

### Arquivo: `src/lib/fountainImport.js` (NOVO)

```js
const FOUNTAIN_PATTERNS = {
  sceneHeading: /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)/i,
  character: /^[A-Z\s\.\'\-]+$/,
  parenthetical: /^\(/,
  transition: /^TO:$/i,
  dualDialogue: /^\^/,
  centered: /^>/,
  pageBreak: /^===/,
  section: /^#/,
  synopsis: /^=/,
  forceScene: /^\./,
  forceAction: /^!/,
  comment: /^\/\*/,
  blank: /^$/,
};

export function parseFountain(text) {
  const elements = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    // Skip metadata (before first ===)
    if (trimmed === '===') { i++; continue; }
    if (elements.length === 0 && !trimmed.match(FOUNTAIN_PATTERNS.sceneHeading)) continue;

    // Scene heading
    if (FOUNTAIN_PATTERNS.sceneHeading.test(trimmed)) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'scene-heading',
        text: trimmed,
      });
      continue;
    }

    // Character (all-caps, preceded by blank, followed by non-blank)
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    if (
      trimmed.length >= 2 &&
      trimmed === trimmed.toUpperCase() &&
      trimmed === trimmed.replace(/[\(\)]/g, '').trim() &&
      FOUNTAIN_PATTERNS.blank.test(prevLine) &&
      !FOUNTAIN_PATTERNS.blank.test(nextLine) &&
      !FOUNTAIN_PATTERNS.blank.test(trimmed) &&
      !trimmed.startsWith('@')
    ) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'character',
        text: trimmed.replace(/^@/, ''),
      });
      continue;
    }

    // Parenthetical
    if (trimmed.startsWith('(')) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'parenthetical',
        text: trimmed,
      });
      continue;
    }

    // Transition
    if (trimmed.endsWith('TO:') || trimmed.startsWith('>')) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'transition',
        text: trimmed.replace(/^>/, ''),
      });
      continue;
    }

    // Action (default)
    if (!FOUNTAIN_PATTERNS.blank.test(trimmed)) {
      elements.push({
        id: `sc-import-${i}`,
        type: 'action',
        text: trimmed,
      });
    }
  }

  return elements;
}
```

### UI de Importação

### Arquivo: `src/components/ScreenplayTab.jsx`

Adicionar botão "Importar Fountain" no toolbar:

```jsx
<input
  type="file"
  accept=".fountain,.txt"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const fountainText = ev.target.result;
      const imported = parseFountain(fountainText);
      saveScreenplay(imported);
    };
    reader.readAsText(file);
  }}
  style={{ display: 'none' }}
  ref={fountainInputRef}
/>
<button onClick={() => fountainInputRef.current.click()}>
  Importar .fountain
</button>
```

---

# FASE 4.4 — NAVEGADOR DE ROTEIROS LOCAIS

### Arquivo: `src/components/ScriptBrowser.jsx` (NOVO)

**Contexto:** `D:\CineWeave\ROTEIROS\` tem 70 scripts PDF clássicos (2001, Fight Club, Inception, Breaking Bad, etc.). Servir como biblioteca de referência dentro do app.

```jsx
import React, { useState, useEffect } from 'react';
import { parseFile } from '../lib/fileParser';

// NOTA: O browser não consegue listar arquivos do sistema
// Solução: criar um arquivo index.json gerado manualmente ou via script

export default function ScriptBrowser() {
  const [scripts, setScripts] = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Carregar índice de scripts
    fetch('/roteiros/index.json')
      .then(r => r.json())
      .then(setScripts)
      .catch(() => {
        // Fallback: lista hardcoded para demonstração
        setScripts([
          { name: '2001_A_SPACE_ODYSSEY_-_Pink_Revision.pdf', title: '2001: A Space Odyssey', pages: 120 },
          { name: 'Inception.pdf', title: 'Inception', pages: 148 },
          { name: 'Fight_Club_Full_Script.pdf', title: 'Fight Club', pages: 135 },
          // ... mais viriam do index.json
        ]);
      });
  }, []);

  const loadScript = async (filename) => {
    setLoading(true);
    try {
      // Fetch o PDF da pasta public/roteiros
      const resp = await fetch(`/roteiros/${filename}`);
      const blob = await resp.blob();
      const file = new File([blob], filename, { type: 'application/pdf' });
      const text = await parseFile(file);
      setContent(text);
    } catch (err) {
      setContent(`Erro ao carregar: ${err.message}`);
    }
    setLoading(false);
  };

  const filtered = scripts.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="script-browser">
      <div className="sidebar">
        <h2>Roteiros de Referência ({filtered.length})</h2>
        <input
          type="text"
          placeholder="Buscar roteiro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="script-list">
          {filtered.map(s => (
            <div
              key={s.name}
              className={`script-item ${selectedScript === s.name ? 'active' : ''}`}
              onClick={() => {
                setSelectedScript(s.name);
                loadScript(s.name);
              }}
            >
              <span className="script-title">{s.title}</span>
              <span className="script-pages">{s.pages}p</span>
            </div>
          ))}
        </div>
      </div>
      <div className="script-viewer">
        {loading && <p>Carregando...</p>}
        {content && <pre className="script-text">{content}</pre>}
        {!loading && !content && (
          <p className="text-gray-400">Selecione um roteiro para visualizar</p>
        )}
      </div>
    </div>
  );
}
```

### Setup necessário:

1. **Copiar PDFs para `public/roteiros/`** (ou criar symlink):
   ```bash
   # No terminal dentro de D:\CineWeave
   mkdir -p public/roteiros
   # Copiar os PDFs ou criar um atalho
   ```

2. **Gerar `public/roteiros/index.json`** com metadados dos PDFs:
   ```json
   [
     { "name": "Inception.pdf", "title": "Inception", "pages": 148 },
     { "name": "Fight_Club_Full_Script.pdf", "title": "Fight Club", "pages": 135 }
   ]
   ```

3. **Consideração**: PDFs grandes (~5-10MB cada) — carregar 70 de uma vez pode ser pesado. Ideal é carregar sob demanda (já implementado no `loadScript` acima).

---

# FASE 5 — CORKBOARD

## 5.1 — Componente Corkboard

### Arquivo: `src/components/CorkboardTab.jsx` (NOVO)

```jsx
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';

export default function CorkboardTab() {
  const { currentProject, navigateTo } = useProject();
  const entities = currentProject.entities;
  const scenes = entities?.scenes || [];
  const acts = entities?.acts || [];

  // Ordenar cenas por ato
  const scenesByAct = acts.map(act => ({
    act,
    scenes: scenes.filter(s => s.actId === act.id).sort((a, b) => a.order - b.order),
  }));

  const handleDragStart = (e, sceneId) => {
    e.dataTransfer.setData('text/plain', sceneId);
  };

  const handleDrop = (e, targetActId) => {
    e.preventDefault();
    const sceneId = e.dataTransfer.getData('text/plain');
    if (!sceneId) return;
    // Atualizar actId da cena
    const updatedScenes = scenes.map(s =>
      s.id === sceneId ? { ...s, actId: targetActId } : s
    );
    // Salvar
    currentProject.entities.scenes = updatedScenes;
    // (precisa de uma função saveEntities no ProjectContext)
  };

  return (
    <div className="corkboard-container">
      {scenesByAct.map(({ act, scenes: actScenes }) => (
        <div key={act.id} className="corkboard-column"
          style={{ borderTop: `3px solid ${act.color}` }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, act.id)}
        >
          <h3 className="act-title">{act.name}</h3>
          {actScenes.map(scene => (
            <div
              key={scene.id}
              className="corkboard-card"
              draggable
              onDragStart={(e) => handleDragStart(e, scene.id)}
              onClick={() => navigateTo('screenplay', scene.id)}
            >
              <div className="card-headline">{scene.title}</div>
              <div className="card-synopsis">{scene.synopsis}</div>
              <div className="card-meta">
                {scene.characterIds.length} personagens
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## 5.2 — Navegação

Adicionar Corkboard como aba opcional no `CineWeaveShell` (App.jsx) ou como sub-aba dentro do MindMap/Screenplay.

---

# FASE 6 — COMPARAÇÃO DE REVISÕES

## 6.1 — Diff Engine

### Arquivo: `src/lib/diffUtils.js` (NOVO)

```js
// Diff simples entre dois arrays de elementos de screenplay
export function diffScreenplay(oldElements, newElements) {
  const changes = [];

  const maxLen = Math.max(oldElements.length, newElements.length);
  for (let i = 0; i < maxLen; i++) {
    const oldEl = oldElements[i];
    const newEl = newElements[i];

    if (!oldEl && newEl) {
      changes.push({ type: 'added', index: i, element: newEl });
    } else if (oldEl && !newEl) {
      changes.push({ type: 'removed', index: i, element: oldEl });
    } else if (oldEl.text !== newEl.text || oldEl.type !== newEl.type) {
      changes.push({ type: 'modified', index: i, old: oldEl, new: newEl });
    }
  }

  return changes;
}

// Agrupar mudanças consecutivas em blocos
export function groupChanges(changes) {
  const groups = [];
  let currentGroup = null;

  changes.forEach((change, i) => {
    if (!currentGroup || change.index !== changes[i - 1]?.index + 1) {
      currentGroup = { startIndex: change.index, changes: [] };
      groups.push(currentGroup);
    }
    currentGroup.changes.push(change);
  });

  return groups;
}
```

## 6.2 — UI de Diff

### Arquivo: `src/components/RevisionDiffModal.jsx` (NOVO)

```jsx
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { diffScreenplay } from '../lib/diffUtils';

export default function RevisionDiffModal({ isOpen, onClose }) {
  const { currentProject } = useProject();
  const history = currentProject.history || [];
  const [versionA, setVersionA] = useState(history[0]?.id || '');
  const [versionB, setVersionB] = useState(history[1]?.id || '');
  const [diffs, setDiffs] = useState([]);

  const compare = () => {
    const vA = history.find(v => v.id === versionA);
    const vB = history.find(v => v.id === versionB);
    if (!vA || !vB) return;
    const changes = diffScreenplay(vA.screenplay, vB.screenplay);
    setDiffs(changes);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto' }}
      >
        <h2>Comparar Revisões</h2>

        <div className="diff-selectors">
          <select value={versionA} onChange={e => setVersionA(e.target.value)}>
            {history.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <span>vs</span>
          <select value={versionB} onChange={e => setVersionB(e.target.value)}>
            {history.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button onClick={compare}>Comparar</button>
        </div>

        <div className="diff-results">
          {diffs.map((d, i) => (
            <div key={i} className={`diff-line diff-${d.type}`}
              style={{
                background: d.type === 'added' ? 'rgba(16,185,129,0.1)' :
                           d.type === 'removed' ? 'rgba(239,68,68,0.1)' :
                           'rgba(245,158,11,0.1)',
                borderLeft: `3px solid ${
                  d.type === 'added' ? '#10b981' :
                  d.type === 'removed' ? '#ef4444' : '#f59e0b'
                }`,
                padding: '4px 8px', margin: '2px 0',
              }}
            >
              <span className="diff-badge" style={{ fontSize: '10px', color: '#888' }}>
                {d.type === 'added' ? '+ ' : d.type === 'removed' ? '- ' : '~ '}
                [{d.element?.type || d.new?.type}] Ln {d.index + 1}
              </span>
              <div className="diff-text" style={{ fontFamily: 'Courier', fontSize: '13px' }}>
                {d.element?.text || d.new?.text}
                {d.old && <span className="text-red-400 line-through ml-2">{d.old.text}</span>}
              </div>
            </div>
          ))}
          {diffs.length === 0 && <p className="text-gray-400">Nenhuma diferença encontrada.</p>}
        </div>
      </div>
    </div>
  );
}
```

---

# FASE 7 — AI FEEDBACK + REESCRITA

## 7.1 — Feedback de Roteiro

### Arquivo: `src/lib/aiFeedback.js` (NOVO)

Usar a NVIDIA API já integrada em `src/lib/llm.js`:

```js
import { getLLMApiKey } from './llm';

const NVIDIA_PROXY_URL = '/api/nvidia';

export async function analyzeScreenplay(screenplayElements) {
  const apiKey = getLLMApiKey();
  if (!apiKey) throw new Error('Configure sua chave NVIDIA AI nas configurações.');

  const text = screenplayElements
    .map(el => `[${el.type}] ${el.text}`)
    .join('\n');

  const prompt = `Analise o seguinte roteiro e forneça feedback em JSON seguindo padrões da indústria (ANALISE_ROTEIROS_CLASSICOS.md):
{
  "pacing": "Rápido / Moderado / Lento / Irregular",
  "dialogueQuality": "Natural / Expositivo / Robótico / Dramático",
  "tone": "Descrição do tom predominante",
  "issues": [
    { "type": "pacing|dialogue|plotHole|character", "line": número aproximado, "description": "..." }
  ],
  "suggestions": ["...", "..."],
  "score": 0-10
}

ROTEIRO:
${text.substring(0, 8000)}`; // limite de 8k chars

  const resp = await fetch(NVIDIA_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(content);
  } catch {
    return { error: 'Resposta mal formatada', raw: content };
  }
}
```

## 7.2 — Reescrita Contextual

```js
export async function rewriteDialogue(text, tone = 'dramatico') {
  const apiKey = getLLMApiKey();
  const toneMap = {
    dramatico: 'mais dramático e impactante',
    comico: 'mais cômico e leve',
    terso: 'mais curto e direto',
    poetico: 'mais poético e metafórico',
    natural: 'mais natural e coloquial',
  };

  const prompt = `Reescreva o seguinte diálogo de roteiro para ser ${toneMap[tone] || toneMap.dramatico}. Mantenha o formato de roteiro (personagem em CAIXA ALTA, diálogo normal). Responda APENAS com o texto reescrito.

${text}`;

  const resp = await fetch(NVIDIA_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || text;
}
```

---

# FASE 8 — AVANÇADAS

## 8.1 — Mapa de Relacionamentos

### Arquivo: `src/components/RelationshipGraph.jsx`

Grafo dedicado personagem↔personagem:
- Nós = personagens (com avatar e nome)
- Arestas = interações no roteiro (quantas falas trocam)
- Grossura da aresta = intensidade
- Cor = positiva/negativa/neutra

```js
// Calcular interações entre personagens
const calculateRelationships = (screenplay, characters) => {
  const rels = {};
  let lastChar = null;

  screenplay.forEach(el => {
    if (el.type === 'character') {
      if (lastChar && lastChar !== el.text) {
        const key = [lastChar, el.text].sort().join('|');
        rels[key] = (rels[key] || 0) + 1;
      }
      lastChar = el.text;
    }
  });

  return Object.entries(rels).map(([key, count]) => {
    const [a, b] = key.split('|');
    return { source: a, target: b, weight: count };
  });
};
```

## 8.2 — Script Breakdown

### Arquivo: `src/components/BreakdownTab.jsx`

Por cena:
- Personagens presentes
- Figurino, adereços
- Locação, período
- Checkbox "breakdown feito"

## 8.3 — Metas Diárias

### Arquivo: `src/lib/wordCounter.js`

```js
export function countWords(screenplay) {
  return screenplay
    .filter(el => el.type === 'action' || el.type === 'dialogue')
    .reduce((sum, el) => sum + el.text.split(/\s+/).filter(w => w.length > 0).length, 0);
}

export function getDailyStats(projectId) {
  const key = `cineweave_stats_${projectId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : { wordsToday: 0, streak: 0, lastDate: null };
}

export function updateDailyStats(projectId, wordCount) {
  const stats = getDailyStats(projectId);
  const today = new Date().toISOString().split('T')[0];

  if (stats.lastDate === today) {
    stats.wordsToday = wordCount;
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (stats.lastDate === yesterday && wordCount > 0) {
      stats.streak++;
    } else if (stats.lastDate !== today) {
      stats.streak = wordCount > 0 ? 1 : 0;
    }
    stats.wordsToday = wordCount;
    stats.lastDate = today;
  }

  localStorage.setItem(`cineweave_stats_${projectId}`, JSON.stringify(stats));
  return stats;
}
```

---

# FASE 9 — SCRIPT COVERAGE AUTOMÁTICO (ANÁLISE PROFISSIONAL)

**Base:** Pesquisa em `ANALISE_ROTEIROS_CLASSICOS.md` (seção PESQUISA + REPOS)

### 9.1 — Sistema de Rating Grid

Implementar o grid de avaliação profissional:

```jsx
const RATING_CRITERIA = [
  { key: 'plot', label: 'Plot', weight: 5, description: 'Estrutura, originalidade, lógica' },
  { key: 'character', label: 'Personagens', weight: 5, description: 'Profundidade, arco, motivação' },
  { key: 'dialogue', label: 'Diálogo', weight: 4, description: 'Naturalidade, subtexto, voz única' },
  { key: 'structure', label: 'Estrutura', weight: 4, description: 'Atos, beats, pacing' },
  { key: 'commercial', label: 'Potencial Comercial', weight: 3, description: 'Mercado, público-alvo' },
  { key: 'format', label: 'Formatação', weight: 2, description: 'Formato correto, erros' },
];

// Score de 1-10 com média ponderada
// Recommendation: Pass (<4), Consider (4-7), Recommend (>7)
```

### 9.2 — Beat Sheet Analyzer

Comparar estrutura do roteiro contra os 15 beats do Save the Cat:

```js
const SAVE_THE_CAT_BEATS = [
  { name: 'Opening Image', pct: 1 },
  { name: 'Theme Stated', pct: 5 },
  { name: 'Set-Up', pct: 1 },
  { name: 'Catalyst', pct: 10 },
  { name: 'Debate', pct: 10 },
  { name: 'Break into Two', pct: 20 },
  { name: 'B Story', pct: 22 },
  { name: 'Fun & Games', pct: 20 },
  { name: 'Midpoint', pct: 55 },
  { name: 'Bad Guys Close In', pct: 55 },
  { name: 'All Is Lost', pct: 75 },
  { name: 'Dark Night of the Soul', pct: 75 },
  { name: 'Break into Three', pct: 85 },
  { name: 'Finale', pct: 85 },
  { name: 'Final Image', pct: 99 },
];

export function analyzeBeatStructure(screenplay, entities) {
  const totalLines = screenplay.length;
  // Para cada beat, detectar onde ele ocorre baseado em mudanças narrativas
  // Usar análise de sentimento + densidade de ação/diálogo para identificar
  return beats.map(beat => ({
    ...beat,
    expectedLine: Math.floor(totalLines * beat.pct / 100),
    actualLine: detectBeat(screenplay, beat.name),
    score: beat.name === 'Midpoint' ? '✅' : '⚠️',
  }));
}
```

### 9.3 — Grafo de Personagens (Character Network)

Baseado no **Script-Analyzer** (PCJohn) e **Film_Script_Analysis** (AdeboyeML):

```js
export function buildCharacterGraph(screenplay, characters) {
  const graph = {};
  let lastSpeaker = null;

  screenplay.forEach(el => {
    if (el.type === 'character') {
      const charId = el.entityId || el.text;
      if (lastSpeaker && lastSpeaker !== charId) {
        const key = [lastSpeaker, charId].sort().join('::');
        graph[key] = (graph[key] || 0) + 1;
      }
      lastSpeaker = charId;
    }
  });

  // Calcular centralidade (quem mais conecta a trama)
  const centrality = {};
  Object.entries(graph).forEach(([key, weight]) => {
    const [a, b] = key.split('::');
    centrality[a] = (centrality[a] || 0) + weight;
    centrality[b] = (centrality[b] || 0) + weight;
  });

  return { graph, centrality };
}
```

Renderizar como grafo SVG interativo no mind map (Fase 8.1).

### 9.4 — Análise de Sentimento por Personagem

```js
// Usar análise de sentimento básica (positive/negative word lists)
// ou chamar NVIDIA API para análise semântica

export function analyzeSentiment(screenplay, characters) {
  const charSentiment = {};
  let currentChar = null;

  screenplay.forEach(el => {
    if (el.type === 'character') {
      currentChar = el.entityId || el.text;
    }
    if (el.type === 'dialogue' && currentChar) {
      const words = el.text.split(/\s+/);
      const sentiment = simpleSentiment(words); // -1 a +1
      if (!charSentiment[currentChar]) charSentiment[currentChar] = [];
      charSentiment[currentChar].push({
        line: el.id,
        sentiment,
        text: el.text.substring(0, 50),
      });
    }
  });

  return charSentiment;
}
```

### 9.5 — Pontuação de Cenas (TF-IDF style)

Adaptado do Scene-Extractor do Script-Analyzer:

```js
export function scoreScenes(screenplay) {
  // Agrupar elementos por cena (entre scene-headings)
  const scenes = [];
  let currentScene = null;

  screenplay.forEach(el => {
    if (el.type === 'scene-heading') {
      currentScene = { heading: el.text, elements: [], id: el.entityId };
      scenes.push(currentScene);
    } else if (currentScene) {
      currentScene.elements.push(el);
    }
  });

  // Pontuar cada cena: densidade de palavras-chave únicas
  const allWords = scenes.flatMap(s =>
    s.elements.flatMap(e => e.text.toLowerCase().split(/\s+/))
  );
  const wordFreq = {};
  allWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });

  return scenes.map(scene => {
    const sceneWords = scene.elements.flatMap(e => e.text.toLowerCase().split(/\s+/));
    const uniqueScore = sceneWords.reduce((sum, w) => sum + 1 / Math.log(wordFreq[w] + 1), 0);
    return { ...scene, score: uniqueScore / sceneWords.length };
  }).sort((a, b) => b.score - a.score);
}
```

### 9.6 — Script Coverage Report (UI)

```jsx
<CoverageReport
  header={{ title: 'Smoke Ninja Cat', author: 'WAID', pages: 28, genre: 'Animação/Aventura' }}
  logline="Uma gata ninja deve proteger seu território de pássaros cyberpunk."
  synopsis="Em 4 atos, Fumaça..."
  ratings={{ plot: 7, character: 8, dialogue: 6, structure: 7, commercial: 5 }}
  recommendation="Consider"
  beatAnalysis={[
    { name: 'Catalyst', expected: 3, actual: 4, score: '✅' },
    { name: 'Midpoint', expected: 15, actual: 18, score: '⚠️' },
  ]}
  characterGraph={/* SVG */}
  sentimentArc={/* chart */}
/>
```

---

# FASE 10 — COMPARADOR COM BENCHMARK DA INDÚSTRIA

**Base:** `ROTEIROS/benchmark_data.json` (56 roteiros analisados)

### 10.1 — Comparação Automática

```js
import benchmark from './ROTEIROS/benchmark_data.json';

export function compareToIndustry(screenplay, entities, genre = 'feature_film') {
  const userMetrics = extractMetrics(screenplay, entities);
  const industry = benchmark[genre === 'feature' ? 'feature_film' : 'tv_episode'];

  return {
    ratio_ad: {
      user: userMetrics.ratio_ad,
      benchmark: industry.avg_ratio_ad,
      score: scoreRatio(userMetrics.ratio_ad, industry.avg_ratio_ad),
      suggestion: userMetrics.ratio_ad > industry.avg_ratio_ad * 1.5
        ? 'Muita ação para o gênero. Adicione mais diálogo.'
        : userMetrics.ratio_ad < industry.avg_ratio_ad * 0.5
        ? 'Muito diálogo para o gênero. Adicione mais ação.'
        : 'Equilibrado. ✅',
    },
    dialogue_length: { ... },
    action_length: { ... },
    pct_int: { ... },
  };
}
```

### 10.2 — UI de Comparação

Exibir lado a lado: métricas do usuário vs benchmark da indústria com score visual (barra verde/amarela/vermelha).

## 8.1 — Mapa de Relacionamentos

### Arquivo: `src/components/RelationshipGraph.jsx`

Grafo dedicado personagem↔personagem:
- Nós = personagens (com avatar e nome)
- Arestas = interações no roteiro (quantas falas trocam)
- Grossura da aresta = intensidade
- Cor = positiva/negativa/neutra

```js
// Calcular interações entre personagens
const calculateRelationships = (screenplay, characters) => {
  const rels = {};
  let lastChar = null;

  screenplay.forEach(el => {
    if (el.type === 'character') {
      if (lastChar && lastChar !== el.text) {
        const key = [lastChar, el.text].sort().join('|');
        rels[key] = (rels[key] || 0) + 1;
      }
      lastChar = el.text;
    }
  });

  return Object.entries(rels).map(([key, count]) => {
    const [a, b] = key.split('|');
    return { source: a, target: b, weight: count };
  });
};
```

## 8.2 — Script Breakdown

### Arquivo: `src/components/BreakdownTab.jsx`

Por cena:
- Personagens presentes
- Figurino, adereços
- Locação, período
- Checkbox "breakdown feito"

## 8.3 — Metas Diárias

### Arquivo: `src/lib/wordCounter.js`

```js
export function countWords(screenplay) {
  return screenplay
    .filter(el => el.type === 'action' || el.type === 'dialogue')
    .reduce((sum, el) => sum + el.text.split(/\s+/).filter(w => w.length > 0).length, 0);
}

export function getDailyStats(projectId) {
  const key = `cineweave_stats_${projectId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : { wordsToday: 0, streak: 0, lastDate: null };
}

export function updateDailyStats(projectId, wordCount) {
  const stats = getDailyStats(projectId);
  const today = new Date().toISOString().split('T')[0];

  if (stats.lastDate === today) {
    stats.wordsToday = wordCount;
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (stats.lastDate === yesterday && wordCount > 0) {
      stats.streak++;
    } else if (stats.lastDate !== today) {
      stats.streak = wordCount > 0 ? 1 : 0;
    }
    stats.wordsToday = wordCount;
    stats.lastDate = today;
  }

  localStorage.setItem(`cineweave_stats_${projectId}`, JSON.stringify(stats));
  return stats;
}
```

---

# CRONOGRAMA SUGERIDO (por complexidade)

| Fase | Esforço | Depende de | Entrega visível |
|------|---------|-----------|----------------|
| **0** (entities) | 2-3h | Nada | Nenhuma (infra) |
| **1** (Enciclopédia) | 2-3h | Fase 0 | Abas novas: Cenas, Plot, Temas, Atos |
| **2** (Screenplay linkado) | 2h | Fase 0 | entityId nos blocos |
| **3** (Mind map) | 3-4h | Fase 0 | Mind map lê de entities |
| **4** (Export/Import) | 2h | Nada | Botões de Download/Upload |
| **5** (Corkboard) | 2h | Fase 0 + 3 | Grid de cards arrastáveis |
| **6** (Diff) | 1-2h | Nada | Modal de comparação |
| **7** (AI) | 2h | Nada | Botão "Análisar" / "Reescrever" |
| **8** (Avançadas) | 4-6h | Fase 0 + 2 | Grafo, Breakdown, Streak |

---

# ORDEM RECOMENDADA PARA O OPENCODE

```
Ordem de execução:

1. FASE 0.1 — Criar src/context/EntitiesSchema.js
2. FASE 0.2 — Modificar ProjectContext.jsx (ensureEntities + merge)
3. FASE 0.3 — Getters de compatibilidade (não quebrar nada)
4. FASE 1.1  — Modificar EncyclopediaTab.jsx (novas abas)
5. FASE 2.1  — Modificar ScreenplayTab.jsx (entityId)
6. FASE 3.1  — Modificar MindMapTab.jsx (layout puro)
7. FASE 4.1+4.2+4.3 — Export/Import (independente)
8. FASE 5    — CorkboardTab.jsx
9. FASE 6    — diffUtils.js + RevisionDiffModal.jsx
10. FASE 7   — aiFeedback.js
11. FASE 8   — RelationshipGraph.jsx + BreakdownTab.jsx + wordCounter.js
```

---

### 🚨 CHECKLIST ANTES DE CADA COMMIT

- [ ] `/* BEAT: */` intacto no screenplay
- [ ] `REVISION_GENERATIONS` intacto
- [ ] `revisionMode`, `NovelMode` funcionando
- [ ] Projetos existentes carregam sem erro (testar com F5)
- [ ] Nenhum `console.log` de debug foi commitado
- [ ] Dados migrados × dados novos estão ambos presentes
