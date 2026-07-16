# PLANO DE UNIFICAÇÃO TOTAL — CineWeave

**Data:** 15/07/2026
**Base:** `D:\CineWeave`
**Objetivo:** Unificar brainstormData, entities, screenplay e mindMap num só sistema, eliminar redundâncias, navegação cruzada entre abas, consolidar 8 abas em 4.

---

## 📊 DIAGNÓSTICO

**Dados duplicados em 3 lugares:**

| Dado | Brainstorm | Enciclopédia | Roteiro/Mapa |
|------|-----------|-------------|-------------|
| Plot points | `brainstormData.plot_points[]` | `entities.plot_points[]` | — |
| Cenas | `brainstormData.scenes[]` | `entities.scenes[]` | `screenplay[]` (só heading) |
| Diálogos | `brainstormData.dialogues[]` | — | `screenplay[]` (blocos) |
| Temas | `brainstormData.themes[]` | `entities.themes[]` | — |
| World elements | `brainstormData.world_elements[]` | parcial em objects | — |
| Personagens | — | `entities.characters[]` | `screenplay[]` (bloco character) |
| Locações | — | `entities.locations[]` | `screenplay[]` (scene-heading) |
| Atos | — | `entities.acts[]` | `mindMapNodes[]` |

**O que já existe (não refazer):**
- ✅ `EntitiesSchema.js` — schema canônico
- ✅ `migration.js` — ensureEntities, getEntity, updateEntity, deleteEntity
- ✅ `entityExtractor.js` — extrai entities do screenplay
- ✅ `useEntities.js` — hook com getScenesByAct, navigateToEntity
- ✅ `mindMapUtils.js` — resolveNodeDisplay, createNodeWithEntity
- ✅ `diffEngine/` — blockDiff, wordDiff, sceneDiff, mergeUtils
- ✅ `scriptCoverage.js` — benchmark contra indústria
- ✅ `fileParser.js` — parser PDF/DOCX/TXT/MD

---

## 🏗️ ARQUITETURA DESTINO

```
project.entities  ← ÚNICA FONTE DA VERDADE
├── characters    ← fichas completas
├── locations     ← fichas completas
├── objects       ← fichas completas
├── scenes        ← (synopsis, actId, characterIds, order, status)
├── plot_points   ← fichas
├── themes        ← fichas
├── acts          ← fichas (name, order, description, color)
├── dialogues     ← 🆕 (speaker, line, context, tags, sceneId)
└── world_elements ← 🆕 (name, type, description, tags)

project.screenplay[]   ← blocos SEMPRE com entityId
project.mindMapNodes[] ← só layout (entityId + x,y)
project.ideas[]        ← notas soltas criativas
project.recordings[]   ← áudio gravado
project.mediaUploads[] ← concept art, referências

🗑️ ELIMINADO:
- project.brainstormData
- project.characters (legado)
- project.locations (legado)
- project.objects (legado)
```

## 🗂️ PONTOS ADICIONAIS DE UNIFICAÇÃO

### Ponto A — MindMapLinks inferidos de entities, não armazenados

Hoje `mindMapLinks[]` guarda conexões manuais tipo `{source: 'snc-char-1', target: 'snc-loc-1'}`. Mas essas conexões **já existem** nos dados:
- `scene.characterIds[]` → personagem X aparece na cena Y
- `scene.actId` → cena X pertence ao ato Y
- `characters[i].relationships[]` → relacionamentos diretos entre personagens

**Solução:** O MindMap renderiza LINKS INFERIDOS automaticamente. `mindMapLinks[]` só guarda **links extras** que o usuário adiciona manualmente no grafo. Os links padrão são calculados na renderização.

### Ponto B — Beat metadata consulta entities em tempo real

Linha ~501 do ScreenplayTab:
```js
'CharacterGenders': (currentProject.characters || []).reduce(...)
```
Isso gera snapshot no `/* BEAT: ... */` que NÃO atualiza quando edita ficha.

**Solução:** O bloco Beat metadata não guarda CharacterGenders. Em vez disso, os componentes Beat consultam `entities.characters` direto. Apenas metadados de revisão (Revision Level, BlockRevisions) ficam no bloco.

### Ponto C — ideas[] ganham entityId opcional

`project.ideas[]` têm `category: 'character' | 'plot' | 'theme' | 'world'` mas são texto solto.

**Solução:** Adicionar campo opcional `entityId` em cada ideia. Ao criar ideia sobre personagem, linkar `entityId` ao personagem. Exibir "Ver ficha" se linkado.

### Ponto D — Unificar mediaUploads + brainstormDocuments em attachments[]

Ambos são arquivos anexados. Podem virar um array único:

```js
project.attachments[] = [
  { id, name, type: 'image' | 'document' | 'audio', url, content, date, processed }
]
```

Manter compatibilidade com dados antigos no `ensureEntities`.

### Ponto E — FichaModal centralizado no ProjectContext

Hoje FichaModal é instanciado em 4 componentes (Brainstorm, Encyclopedia, MindMap, Corkboard). Cada um com estado próprio.

**Solução:** ProjectContext expõe:
```js
const { fichaModal, openFicha, closeFicha } = useProject();
```

Qualquer aba abre a mesma instância. Estado persiste entre abas.

### Ponto F — entityId linking em função única

ScreenplayTab tem lógica de entityId linking DUPLICADA (~linha 472 e ~linha 1351).

**Solução:** Extrair pra `entityExtractor.js` como:
```js
export function linkScreenplayToEntities(elements, entities) {
  // retorna elements com entityId
}
```

### Ponto G — Corkboard e MindMap como views sincronizadas

Corkboard (mural por ato) e MindMap (grafo) são visualizações do **mesmo dado**: `entities.scenes[]` organizadas por `entities.acts[]`.

**Regra de sincronização:**

| Ação no Corkboard | Reflexo no MindMap |
|-------------------|-------------------|
| Arrastar cena para outro ato | Atualiza `scene.actId` → nó muda de faixa |
| Adicionar cena | Cria entity → nó aparece |
| Remover cena | Remove entity → nó some |
| Mudar ordem das cenas | Atualiza `scene.order` → grafo reordena |

| Ação no MindMap | Reflexo no Corkboard |
|-----------------|-------------------|
| Criar nó de cena | Cria entity → card aparece no ato |
| Linkar cena a ato | Atualiza `scene.actId` → card move de coluna |
| Deletar nó | Remove entity → card some |

**Ambos leem de `useEntities()` — sempre o mesmo dado.**

### Passo 1.1 — Adicionar dialogues + world_elements ao schema

**Arquivo:** `src/context/EntitiesSchema.js`

Adicionar ao final de `ENTITY_DEFAULTS`:

```js
dialogues: {
  id: '', speaker: '', line: '', context: '', tags: [],
  sceneId: null, createdAt: 0, updatedAt: 0,
},
world_elements: {
  id: '', name: '', type: 'setting', description: '', tags: [],
  createdAt: 0, updatedAt: 0,
},
```

Adicionar validação no `createEntity`: `dialogues` → speaker obrigatório, `world_elements` → name obrigatório.

### Passo 1.2 — Migrar brainstormData → entities no load

**Arquivo:** `src/lib/migration.js` — função `ensureEntities`

Adicionar migração de:
- `brainstormData.dialogues[]` → `entities.dialogues[]`
- `brainstormData.world_elements[]` → type='location' vira `entities.locations[]`, resto vira `entities.world_elements[]`
- `brainstormData.scenes[]` → `entities.scenes[]` (se não existirem)
- `brainstormData.plot_points[]` → `entities.plot_points[]` (se não existirem)
- `brainstormData.themes[]` → `entities.themes[]` (se não existirem)

Regra: só migrar se a entity ainda não existir (evitar duplicação).

### Passo 1.3 — BrainstormTab ler de entities

**Arquivo:** `src/components/BrainstormTab.jsx`

Substituir:
```js
const bd = currentProject?.brainstormData || {};
const plotPoints = bd.plot_points || [];
const brainstormScenes = bd.scenes || [];
```
Por:
```js
const { plotPoints, scenes, dialogues, themes } = useEntities();
```

Remover toda escrita em brainstormData. Toda escrita vai pra `saveEntity()`.

### Passo 1.4 — Atualizar ProjectContext

**Arquivo:** `src/context/ProjectContext.jsx`

Remover:
- `brainstormData` do merge de dados (~linha 201-232)
- Qualquer escrita em brainstormData
- `processLLMToProject` se ainda escrever em brainstormData

### ✅ Verificação FASE 1
- App carrega sem erro
- BrainstormTab mostra dados corretos
- EncyclopediaTab mostra os mesmos dados
- Nenhuma referência a `brainstormData` no código (exceto migration.js)

---

## 🟢 FASE 2 — entityId BIDIRECIONAL NO SCREENPLAY

### Passo 2.1 — entityId no parse do screenplay

**Arquivo:** `src/lib/entityExtractor.js`

Garantir que:
- Todo `scene-heading` → `entityId` linkado a `entities.scenes[]`
- Todo `character` → `entityId` linkado a `entities.characters[]`
- Função retorna `{ screenplay: [...], newEntities: {...} }`

### Passo 2.2 — Ao salvar screenplay, atualizar entities

**Arquivo:** `src/components/ScreenplayTab.jsx` — `saveScreenplay()`

Depois de linkar entityId:
- Atualizar `entities.scenes[]` com títulos de cena que mudaram
- Atualizar `entities.characters[]` com nomes que mudaram
- Criar locação nova em `entities.locations[]` se scene-heading tiver local novo

### Passo 2.3 — Navegação entity → screenplay

**Arquivo:** `src/components/FichaModal.jsx`

Botão "Ver no Roteiro" em cada ficha:
- `navigateTo('screenplay', entityId)`
- ScreenplayTab.scrollToEntityId() → scrolla até o bloco

### ✅ Verificação FASE 2
- Editar personagem na ficha → nome atualiza no roteiro
- Editar scene-heading no roteiro → título atualiza na ficha da cena
- "Ver no Roteiro" → scrolla pro bloco certo

---

## 🟢 FASE 3 — MIND MAP COMO VIEW PURA DE entities

### Passo 3.1 — Criar nó = criar entity primeiro

**Arquivo:** `src/components/MindMapTab.jsx`

Ao adicionar nó:
1. Cria entity em `entities[type]` com `createEntity()`
2. Cria nó com `entityId` apontando pra entity
3. Nó só guarda: `{ id, entityId, x, y }`

### Passo 3.2 — Clean nodes

```js
const cleanNodes = nodes.map(n => ({
  id: n.id, entityId: n.entityId, x: n.x, y: n.y,
}));
```

Dados (label, details) vêm de `resolveNodeDisplay()`.

### ✅ Verificação FASE 3
- Criar nó → entity aparece na Enciclopédia
- Editar entity → nó reflete
- Remover entity → nó some

---

## 🟡 FASE 4 — ELIMINAR ARRAYS LEGADOS

### Passo 4.1 — Remover arrays paralelos

**Arquivo:** `src/context/ProjectContext.jsx`

Remover:
- `project.characters` → só entities.characters
- `project.locations` → só entities.locations
- `project.objects` → só entities.objects
- `project.brainstormData` → já migrado Fase 1

### Passo 4.2 — Limpar migration.js

`ensureEntities` vira só validação. Remove sync com arrays legados.

### ✅ Verificação FASE 4
- App carrega sem erro
- Tudo em entities
- Nenhum array legado no localStorage

---

## 🟡 FASE 5 — NAVEGAÇÃO CRUZADA ENTRE ABAS

### Passo 5.1 — Conexões por entidade

| Entity | Conexões |
|--------|----------|
| character | "Ver falas no roteiro" | "Ver no mapa" |
| scene | "Ir para o roteiro" | "Ver personagens" |
| location | "Ver cenas onde aparece" |
| plot_point | "Ver cenas relacionadas" (por actId) |
| dialogue | "Ver no roteiro" (scroll pro bloco) |

### Passo 5.2 — SharedSidebar

Expandir `SharedSidebar.jsx` para mostrar:
- Entidades relacionadas à aba atual
- Links "Ver em..." (roteiro, mapa, ficha)

### ✅ Verificação FASE 5
- Clicar em personagem → "Ver no roteiro" → scrolla pra fala
- Clicar em cena mind map → "Ver na enciclopédia" → abre ficha

---

## 🔴 FASE 6 — CONSOLIDAR 8 ABAS EM 4

### Passo 6.1 — Nova nav

```
Header: [Roteiro]  [Enciclopédia]  [Mapa Mental]  [Ideias]
```

| Antes | Depois | Localização |
|-------|--------|-------------|
| ScreenplayTab | **Roteiro** | Aba principal |
| VersioningTab | ↳ Painel lateral | `VersionPanel.jsx` (recolhível) |
| CoverageReport | ↳ Modal | `CoverageModal.jsx` |
| ScriptBrowser | ↳ Modal "Importar" | `ImportModal.jsx` |
| EncyclopediaTab | **Enciclopédia** | Com toggle Lista/Corkboard |
| CorkboardTab | ↳ Toggle | Botão "Mural" na Encyclopedia |
| MindMapTab | **Mapa Mental** | Aba principal |
| BrainstormTab | **Ideias** | Só áudio, upload, notas |

### Passo 6.2 — VersionPanel.jsx

Extrair de VersioningTab. Renderizar como painel recolhível (igual StylePanel).

### Passo 6.3 — CoverageModal.jsx

Botão "Análise" no Screenplay. Abre modal com métricas + benchmark.

### Passo 6.4 — ImportModal.jsx

Botão "Importar" no Screenplay. Lista roteiros clássicos, importa com parse.

### Passo 6.5 — Enciclopédia com toggle Corkboard

Botão no header: `📋 Lista / 📌 Mural`
Modo corkboard = layout drag-and-drop por ato.

### Passo 6.6 — Brainstorm vira "Ideias"

Remover categorias estruturadas (personagem, enredo, etc.). Manter só:
- Gravação de áudio + transcrição
- Upload de mídia (concept art, referências)
- Notas soltas / rascunhos
- Extração por IA

Tudo estruturado → link pra Enciclopédia.

### ✅ Verificação FASE 6
- 4 abas na nav
- Versions é painel no Screenplay
- Coverage é modal
- ScriptBrowser é modal de import
- Corkboard é toggle na Enciclopédia
- Ideas = só áudio/upload/notas
- Tudo funcional preservado

---

## 📋 ORDEM DE EXECUÇÃO

```
PONTO A → MindMapLinks inferidos (Fase 3)
PONTO F → Função única de entityId linking (Fase 2)
PONTO E → FichaModal centralizado (Fase 1)
FASE 1 → Eliminar brainstormData, unificar em entities
  ├ PONTO D → Unificar mediaUploads + brainstormDocuments em attachments[]
  ├ PONTO C → ideas[] ganham entityId
FASE 2 → entityId bidirecional screenplay ↔ entities
  └ PONTO F já aplicado
FASE 3 → Mind map como view pura
  ├ PONTO A → Links inferidos
  └ PONTO G → Corkboard + MindMap sincronizados
FASE 4 → Limpar arrays legados
FASE 5 → Navegação cruzada entre abas
  └ PONTO B → Beat metadata consulta entities em tempo real
FASE 6 → Consolidar 8 abas em 4
```

**Regra:** Não pular fases. Cada fase depende da anterior.
**Verificar:** `npm run build` sem erro após cada fase.