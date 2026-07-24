# PLANO APP COMPLETO — CineWeave

> **Data:** 2026-07-23
> **Referência:** Análise Técnica "Irmãs Benedetti" (Movie Magic Scheduling export)
> **Stack:** React 19 + Vite 8 + Supabase + jspdf + html2canvas
> **Design:** Dark glassmorphism, `#ccee00` lime-gold (DESIGN.md)

---

## VISÃO GERAL

O CineWeave hoje é um app de roteiro com 5 tabs (Roteiro, Enciclopédia, Storyboard, Mapa Mental, Ideias). O objetivo deste plano é expandir para **8 módulos** cobrindo todo o workflow de pré-produção cinematográfica:

| # | Módulo | Tab Key | Novo? |
|---|--------|---------|-------|
| 1 | Roteiro | `screenplay` | Evolução |
| 2 | Análise Técnica | `tech_analysis` | **NOVO** |
| 3 | Mapa Mental | `mindmap` | Evolução |
| 4 | Corkboard | `corkboard` | **Reativado + Evolução** |
| 5 | Timeline | `timeline` | **NOVO** |
| 6 | Storyboard | `storyboard` | Evolução |
| 7 | Configuração do Projeto | `project_config` | **NOVO** |
| 8 | Ideias | `brainstorm` | Evolução |

---

## PARTE 1: ROTEIRO (`screenplay`)

### 1.1 Estado Atual

- **ScreenplayTab.jsx** (137KB) — editor Fountain completo
- Suporta: edição, revisões (8 níveis), importação (Fountain/PDF/DOCX/FDX), versionamento
- Entidades ligadas via `BEAT ... END_BEAT` no texto
- Cobertura estrutural via `CoverageReport.jsx`

### 1.2 O que precisa

| Item | Descrição | Prioridade |
|------|-----------|------------|
| Refatorar tamanho | 137KB monolítico → quebrar em subcomponentes | Alta |
| Beat metadata | Garantir que `BEAT` no Fountain extraia automaticamente para `project.entities.scenes` | Alta |
| Link bidirecional cena↔roteiro | Clicar em cena na Análise Técnica vai para a cena no roteiro e vice-versa | Alta |
| Scene heading parsing | INT/EXT, local, horário (Dia/Noite/Entardec/Amanhec) → dados estruturados | Média |
| Página estimada | Calcular páginas por cena (1 página ≈ 1 minuto) para a Análise Técnica | Média |
| Fountain → Análise Técnica | Botão "Gerar Análise Técnica" que cria breakdown sheets a partir das cenas do roteiro | Alta |

### 1.3 Decisões

- **Não** adicionar React Router. Continuar com tabs via `useState`.
- Scene headings já são parseados em `ScreenplayTab.jsx` (regex para `INT./EXT.`). Reutilizar essa lógica.
- A contagem de páginas pode usar a regra padrão: 1 página Fountain = ~1 minuto de tela.

---

## PARTE 2: ANÁLISE TÉCNICA (`tech_analysis`) — NOVO

### 2.1 Referência: Modelo Movie Magic Scheduling

Analisado o PDF `AT_Benedetti_V1.pdf` (14 páginas, ~30 cenas do curta "Irmãs Benedetti"). Cada cena é uma **Breakdown Sheet** com:

**Header da cena:**
```
CENA #  INT/EXT   LOCAL   HORÁRIO   PÁGINAS   DESCRIÇÃO
```

**Categorias (aparecem quando a cena tem itens daquela categoria):**

| # | Categoria | Campos por item | Exemplo do PDF |
|---|-----------|-----------------|----------------|
| 1 | Elenco | `{personagemId}. {nome}` | `1. MARIA`, `2. DUDA` |
| 2 | Figuração | `{figId}. {descrição} {qtd}` | `5. 40 FIGURANTES FESTA` |
| 3 | Stunts | `{stuntId}. {descrição}` | `3. Stunt Driver - Gol Branco` |
| 4 | Figurino | `{figId}. {descrição}` | `16. 02. Calça jeans clara` |
| 5 | Maquiagem/Cabelo | `{id}. {descrição}` | `10. 02. Cabelo solto` |
| 6 | Props | `{id}. {descrição}` | `49. Rádio popular de carro` |
| 7 | Cenografia | `{id}. {descrição}` | `2. Cozinha com muita informação...` |
| 8 | Veículos de Cena | `{id}. {descrição}` | `1. VW GOL 96 BRANCO` |
| 9 | Música | `{id}. {descrição}` | `2. ABBA na Viola Caipira - SOS` |
| 10 | Som | `{id}. {descrição}` | `9. SFX carro na terra`, `13. Som direto`, `14. Tiktok celular` |
| 11 | Câmera & Acessórios | `{id}. {descrição}` | `2. Drone`, `1. Hydra Car Grip` |
| 12 | Produção | `{id}. {descrição}` | `2. Direitos Autorais ABBA` |
| 13 | Mood | `{id}. {descrição}` | `2. Momento iluminado da Duda` |
| 14 | Continuidade | `{id}. {descrição}` | `2. Duda usando óculos de sol` |
| 15 | Direção | texto livre | `Cena intensa, muito blocking` |
| 16 | Notas | texto livre | `Possibilidade de DJ Petroski` |
| 17 | Conteúdo Celular | `{id}. {descrição}` | `Video curiosidade história de Arnon de Mello` |
| 18 | Efeitos Práticos | `{id}. {descrição}` | `Sangue cabeça da Duda` |

**Numeração global:** Cada item tem um número único que se mantém entre cenas (ex: "13. Som direto" aparece em múltiplas cenas sempre como #13).

### 2.2 Modelo de Dados

#### 2.2.1 Novos tipos de entidade em `EntitiesSchema.js`

```js
// breakdown_sheets — uma por cena
breakdown_sheets: {
  id, sceneId,              // FK para entities.scenes
  pageNumber,              // página estimada (ex: "2/8" = página 2 de 8)
  notes: '',               // notas gerais da cena
  direction: '',           // direção (texto livre)
  createdAt, updatedAt
}

// breakdown_items — itens dentro de cada categoria de cada breakdown
breakdown_items: {
  id,
  sheetId,                 // FK para breakdown_sheets
  globalNumber,            // numeração global persistente (ex: 13)
  category,                // enum: ver lista abaixo
  characterId: null,       // FK opcional para entities.characters
  description,             // texto descritivo do item
  isScriptSupplied: false, // vem do roteiro ou foi adicionado manualmente?
  createdAt, updatedAt
}
```

#### 2.2.2 Categorias (enum)

```js
const BREAKDOWN_CATEGORIES = [
  'elenco',              // Elenco
  'figuracao',           // Figuração
  'stunts',              // Stunts / Dublês
  'figurino',            // Figurino / Guarda-roupa
  'maquiagem_cabelo',    // Maquiagem/Cabelo
  'props',               // Props / Adereços
  'cenografia',          // Cenografia / Decoração
  'veiculos',            // Veículos de Cena
  'musica',              // Música
  'som',                 // Som (SFX, direto, O.S.)
  'camera',              // Câmera & Acessórios
  'producao',            // Produção (direitos, autorizações)
  'mood',                // Mood / Tom visual
  'continuidade',        // Continuidade
  'direcao',             // Notas de Direção
  'notas',               // Notas gerais
  'conteudo_celular',    // Conteúdo de tela celular
  'efeitos_praticos',    // Efeitos Práticos / Próteses
]
```

#### 2.2.3 Projeto — campos novos

```js
project.breakdownGlobalCounter = 0;  // auto-increment para globalNumber
```

### 2.3 Interface — `AnalysisTab.jsx`

**Layout principal:** Lista de breakdown sheets (cenas) à esquerda, detalhe à direita.

```
┌─────────────────────────────────────────────────────┐
│ ANÁLISE TÉCNICA          [Gerar do Roteiro] [Exportar]│
├──────────────┬──────────────────────────────────────┤
│ LISTA CENAS  │  BREAKDOWN SHEET — Cena #2           │
│              │  ┌──────────────────────────────────┐ │
│ ☑ 1. EXT...  │  │ INT  COZINHA  Dia  2/8          │ │
│ ☑ 2. INT...  │  │ Duda chega em casa...            │ │
│ ☑ 3. INT...  │  └──────────────────────────────────┘ │
│ ☑ 4. INT...  │                                      │
│              │  ┌─ Elenco ─────────────────────────┐ │
│              │  │ 1. MARIA    2. DUDA              │ │
│              │  └──────────────────────────────────┘ │
│              │  ┌─ Figurino ───────────────────────┐ │
│              │  │ 16. 02. Calça jeans clara        │ │
│              │  │ 19. 02. Moletom de terceirão     │ │
│              │  └──────────────────────────────────┘ │
│              │  ┌─ Props ──────────────────────────┐ │
│              │  │ 3. 02. iPhone 8 Plus             │ │
│              │  │ 42. Nota de 50 Reais             │ │
│              │  │ [+ Adicionar item]               │ │
│              │  └──────────────────────────────────┘ │
│              │  ┌─ Som ────────────────────────────┐ │
│              │  │ 1. 01. Lapela                    │ │
│              │  │ 13. Som direto                   │ │
│              │  └──────────────────────────────────┘ │
│              │                                      │
│              │  ┌─ Direção ────────────────────────┐ │
│              │  │ [textarea livre]                  │ │
│              │  └──────────────────────────────────┘ │
│              │  ┌─ Notas ──────────────────────────┐ │
│              │  │ [textarea livre]                  │ │
│              │  └──────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────┘
```

**Funcionalidades:**

| Funcionalidade | Descrição |
|---------------|-----------|
| Gerar do Roteiro | Cria breakdown sheets automaticamente a partir das scene headings do roteiro. Preenche INT/EXT, local, horário. Cria sheet vazio por cena. |
| Adicionar item | Dentro de qualquer categoria, clicar "+" para adicionar item. Auto-atribui `globalNumber`. |
| Vincular personagem | Ao adicionar item de "Elenco", dropdown com personagens da enciclopédia. Preenche `characterId`. |
| Arrastar entre categorias | Item pode ser movido entre categorias (drag & drop). |
| Numeração global | Auto-increment no `project.breakdownGlobalCounter`. Nunca reusar número. |
| Filtro por categoria | Na lista lateral, filtrar cenas que têm itens de determinada categoria. |
| Busca global | Buscar item por descrição em todas as cenas (ex: "drone" aparece nas cenas 1, 27, 28). |
| Resumo por categoria | Aba resumo: lista todos os itens únicos por categoria (ex: todos os veículos, todos os figurinos). |

### 2.4 Integração com Roteiro

- Scene headings do Fountain (`INT. COZINHA - Dia`) → criação automática de `breakdown_sheets`
- Campo `description` do sheet → sinopse da cena (do roteiro ou digitada)
- Clicar no número da cena → navega para o roteiro naquela cena

### 2.5 Componentes a criar

| Arquivo | Responsabilidade |
|---------|-----------------|
| `AnalysisTab.jsx` | Tab principal, layout split painel |
| `AnalysisTab.css` | Estilos |
| `BreakdownSheet.jsx` | Detalhe de uma cena (header + categorias + itens) |
| `BreakdownItem.jsx` | Linha de item dentro de uma categoria |
| `BreakdownCategory.jsx` | Seção colapsável de uma categoria |
| `BreakdownSidebar.jsx` | Lista de cenas + filtros |
| `BreakdownSummary.jsx` | Resumo consolidado por categoria |
| `lib/breakdownUtils.js` | Funções: gerar do roteiro, buscar, exportar dados |

---

## PARTE 3: VISUALIZAÇÕES

### 3.1 Mapa Mental (`mindmap`) — Evolução

**Estado atual:** `MindMapTab.jsx` (51.8KB), visualização de grafo com nós e links.

**Evoluções necessárias:**

| Item | Descrição |
|------|-----------|
| Nós de cena breakdown | Tipo de nó "scene_breakdown" que abre a breakdown sheet ao clicar |
| Cores por categoria | Nó de Elenco = amber, Local = green, Cena = purple (já existe no DESIGN.md) |
| Filtro por tipo | Botões para mostrar/esconder tipos de nó |
| Layout automático melhorado | Force-directed já existe; adicionar opções: hierárquico, circular |
| Link para Análise Técnica | Duplo-clique em nó de cena → abre breakdown sheet |

### 3.2 Corkboard (`corkboard`) — Reativado + Evolução

**Estado atual:** `CorkboardTab.jsx` (14.9KB) existe mas **não está nos tabs ativos**. Layout de cartões.

**Evolução para Corkboard Completo:**

**Tipos de cartão:**
| Tipo | Conteúdo | Cor |
|------|----------|-----|
| Cena | Número + local + sinopse + thumbnail storyboard | `#8b5cf6` (scene) |
| Personagem | Nome + avatar + traços + cenas em que aparece | `#f59e0b` (character) |
| Locação | Nome + INT/EXT + descrição + cenas | `#10b981` (location) |
| Props | Nome + descrição + cenas | `#ef4444` (object) |

**Funcionalidades:**

| Funcionalidade | Descrição |
|---------------|-----------|
| Drag & drop | Rearranjar cartões livremente na board |
| Agrupar por | Ato, locação, personagem |
| Filtros | Mostrar/esconder tipos de cartão |
| Zoom | Zoom in/out da board |
| Link para detalhe | Clicar no cartão → abre ficha (FichaModal) ou breakdown sheet |
| Busca | Buscar cartões por texto |
| Colunas opcionais | Vista kanban: Rascunho → Escrito → Revisado → Final |

**Componentes:**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `CorkboardTab.jsx` | Refatorar existente (14.9KB) para novo layout |
| `CorkboardCard.jsx` | Cartão genérico com variantes por tipo |
| `CorkboardColumn.jsx` | Coluna kanban opcional |
| `CorkboardFilters.jsx` | Barra de filtros e busca |

### 3.3 Timeline (`timeline`) — NOVO

**Conceito:** Linha do tempo horizontal/vertical das cenas do roteiro, com marcações visuais.

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ TIMELINE                     [Horizontal ▼] [Filtrar]       │
├─────────────────────────────────────────────────────────────┤
│ ATO 1 ───────────────────────────────────────────────────── │
│ ├─ C1: EXT ESTRADA (Dia) ──●─────────────────────── 1/8   │
│ ├─ C2: INT COZINHA (Dia) ────●────────────────────── 2/8   │
│ ├─ C3: INT COZINHA (Dia) ──────●──────────────────── 3/8   │
│ └─ C4: INT QUARTO MARIA (Dia) ────●───────────────── 4/8   │
│                                                             │
│ ATO 2 ───────────────────────────────────────────────────── │
│ ├─ C5: INT QUARTO MARIA (Noite) ──●──────────────── 1/8    │
│ ├─ C6: INT QUARTO CLARA (Noite) ───●──────────────── 1/8    │
│ ├─ C10: INT QUARTO DUDA (Noite) ────●─────────────── 1/8    │
│ └─ C11: EXT FRENTE CASA (Noite) ────●─────────────── 4/8    │
│                                                             │
│ ATO 3 ───────────────────────────────────────────────────── │
│ ├─ C24: EXT FRENTE CASA (Noite) ────●─────────────── 3/8    │
│ ├─ C27: EXT ESTRADA (Noite) ────────●─────────────── 3/8    │
│ └─ C29: INT HOSPITAL (Amanhec) ──────●────────────── 2/8    │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**

| Funcionalidade | Descrição |
|---------------|-----------|
| Vista horizontal/vertical | Toggle entre os dois layouts |
| Agrupamento por ato | Seções colapsáveis por ato |
| Cor por INT/EXT | INT = azul escuro, EXT = verde |
| Cor por horário | Dia = amarelo, Noite = azul, Entardec = laranja, Amanhec = rosa |
| Duração visual | Largura proporcional a páginas da cena |
| Marcadores | Ícones para: elenco, veículos, stunts, música |
| Clicar na cena | Abre a cena no roteiro ou breakdown sheet |
| Filtro por local | Destacar cenas do mesmo local |
| Filtro por personagem | Destacar cenas com determinado personagem |
| Estimativa de tempo | Total: "X páginas ≈ Y minutos" |

**Componentes:**

| Arquivo | Responsabilidade |
|---------|-----------------|
| `TimelineTab.jsx` | Tab principal |
| `TimelineTab.css` | Estilos |
| `TimelineAct.jsx` | Seção de um ato |
| `TimelineScene.jsx` | Bloco de uma cena na timeline |
| `TimelineFilters.jsx` | Filtros e toggles |
| `lib/timelineUtils.js` | Cálculos de posição, agrupamento |

---

## PARTE 4: CONFIGURAÇÃO DO PROJETO + EXPORTAÇÃO

### 4.1 Configuração do Projeto (`project_config`) — NOVO

**Conceito:** Aba central para metadados do projeto, moodboards, imagens de referência, textos argumentativos, e hub de exportação.

**Sub-seções (tabs internas ou accordion):**

#### 4.1.1 Dados do Projeto
| Campo | Tipo | Exemplo |
|-------|------|---------|
| Título | text | "Irmãs Benedetti" |
| Tagline | text | "Três mulheres, um segredo, uma estrada" |
| Gênero | select | Drama |
| Sinopse | textarea | "No interior do RS..." |
| Logline | text | "Uma mãe descobre..." |
| Formato | select | Curta-metragem / Longa / Série / Web |
| Duração estimada | text | "~30 min" |
| Público-alvo | text | "Jovens adultos" |
| Tags | TagSelector | drama, família, interior |

> **Nota:** Título, tagline, gênero, logline, tags já existem no `project`. Reutilizar.

#### 4.1.2 Moodboard

**Conceito:** Board visual com imagens de referência organizadas por tema.

```
┌────────────────────────────────────────────┐
│ MOODBOARD           [+ Upload Imagem]      │
├────────────────────────────────────────────┤
│ ┌─ Paleta de Cores ──────────────────────┐ │
│ │ [■] [■] [■] [■] [■] [+ add]          │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Referências Visuais ──────────────────┐ │
│ │ [img1] [img2] [img3]                   │ │
│ │ [img4] [img5] [img6]                   │ │
│ │ [+ Upload]                              │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Referências de Cenário ───────────────┐ │
│ │ [img] [img] [img]                      │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Referências de Figurino ──────────────┐ │
│ │ [img] [img]                            │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**Funcionalidades:**
- Upload de imagens (arrastar ou clique)
- Imagens armazenadas no Supabase Storage
- Organização por seções (paleta, visual, cenário, figurino, iluminação)
- Drag & drop para reorganizar
- Clicar para ver em tela cheia
- Adicionar legenda/nota a cada imagem
- Exportar moodboard como página PDF

**Modelo de dados:**
```js
// project.moodboardSections
moodboardSections: [
  {
    id, name,           // "Referências Visuais"
    images: [
      { id, url, thumbnailUrl, caption, order, width, height }
    ]
  }
]

// project.colorPalette
colorPalette: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#ccee00']
```

#### 4.1.3 Imagens de Referência

Similar ao moodboard mas sem organização por seções. Lista plana de todas as imagens do projeto (storyboard frames, moodboard, uploads avulsos). View tipo galeria com busca e filtros.

#### 4.1.4 Textos Argumentativos

| Campo | Descrição |
|-------|-----------|
| Argumento | Texto longo do argumento/sinopse expandida |
| Defesa artística | Por que esse filme precisa existir |
| Pitch deck text | Texto para apresentação (sinopse curta + público + referências) |
| Notas de direção | Visão do diretor |
| Notas de produção | Considerações de produção |

**Modelo:**
```js
project.arguments = {
  synopsis: '',           // argumento
  artisticDefense: '',    // defesa artística
  pitchText: '',          // texto de pitch
  directorNotes: '',      // notas de direção
  productionNotes: '',    // notas de produção
  updatedAt: null
}
```

### 4.2 Exportação de Documentos — Client-side PDF

**Tecnologia:** `jspdf` + `html2canvas` (já nas dependências).

#### 4.2.1 Tipos de Documento Exportáveis

| # | Documento | Conteúdo | Formato |
|---|-----------|----------|---------|
| 1 | **Roteiro** | Roteiro formatado Fountain → PDF (layout screenplay padrão) | A4, Courier Prime |
| 2 | **Análise Técnica** | Todas as breakdown sheets do projeto | A4 landscape, por cena |
| 3 | **Roteiro + Análise Técnica** | Roteiro com breakdown sheet de cada cena intercalado | A4 |
| 4 | **Moodboard** | Paleta de cores + imagens organizadas por seção + legendas | A3 ou A4 |
| 5 | **Análise Técnica + Moodboard** | Breakdown sheets com imagens de referência de cada seção | A4 |
| 6 | **Pitch Document** | Título, logline, sinopse, argumento, moodboard, ficha técnica | A4 profissional |
| 7 | **Storyboard + Roteiro** | Frames do storyboard com texto das cenas correspondentes | A4 landscape |
| 8 | **Pacote Completo** | Todos os documentos acima em um PDF único (com separadores de seção) | A4 |

#### 4.2.2 Arquitetura de Exportação

```
src/lib/export/
├── pdfEngine.js          // Engine base: config jspdf, page setup, headers/footers
├── pdfScreenplay.js      // #1: Roteiro formatado
├── pdfBreakdown.js       // #2: Análise técnica (breakdown sheets)
├── pdfScreenplayAnalysis.js  // #3: Roteiro + AT intercalado
├── pdfMoodboard.js       // #4: Moodboard
├── pdfAnalysisMoodboard.js   // #5: AT + Moodboard
├── pdfPitch.js           // #6: Pitch document
├── pdfStoryboardScript.js    // #7: Storyboard + Roteiro
├── pdfFullPack.js        // #8: Pacote completo
├── pdfTemplates.js       // Templates: header, footer, cover page, separators
└── pdfStyles.js          // Estilos reutilizáveis: fontes, cores, margins
```

#### 4.2.3 Interface de Exportação

Acessível a partir de:
- Botão "Exportar" no header da AnalysisTab
- Botão "Exportar" no header da ConfigTab
- Menu "Exportar" no header global do app

```
┌─────────────────────────────────────┐
│ EXPORTAR DOCUMENTO                  │
│                                     │
│ Tipo: [Dropdown com 8 opções]       │
│                                     │
│ Opções:                             │
│ ☐ Incluir capa                       │
│ ☐ Incluir sumário                    │
│ ☐ Numeração de páginas               │
│ ☐ Marca d'água                      │
│                                     │
│ Formato: A4 ▼  Orientação: Retrato ▼│
│                                     │
│         [Exportar PDF]  [Cancelar]   │
└─────────────────────────────────────┘
```

#### 4.2.4 Estilo dos PDFs

| Elemento | Estilo |
|----------|--------|
| Capa | Título do projeto em Outfit Bold 24pt, fundo `#050505`, acento `#ccee00` |
| Cabeçalho | Nome do projeto (esquerda), tipo de doc (direita), linha `#ccee00` |
| Rodapé | Página X de Y, data |
| Corpo | Outfit 11pt, Courier Prime para roteiro |
| Tabelas | Bordas `#333`, header `#ccee00` com fundo `#1a1a1a` |
| Categorias breakdown | Negrito + cor da categoria (reutilizar entity colors) |

---

## ARQUITETURA GERAL

### Novos arquivos por módulo

```
src/
├── components/
│   ├── AnalysisTab.jsx          // NOVO — ~15KB
│   ├── AnalysisTab.css          // NOVO — ~8KB
│   ├── BreakdownSheet.jsx       // NOVO — ~8KB
│   ├── BreakdownItem.jsx        // NOVO — ~3KB
│   ├── BreakdownCategory.jsx    // NOVO — ~4KB
│   ├── BreakdownSidebar.jsx     // NOVO — ~5KB
│   ├── BreakdownSummary.jsx     // NOVO — ~4KB
│   ├── TimelineTab.jsx          // NOVO — ~10KB
│   ├── TimelineTab.css          // NOVO — ~5KB
│   ├── TimelineAct.jsx          // NOVO — ~3KB
│   ├── TimelineScene.jsx        // NOVO — ~4KB
│   ├── TimelineFilters.jsx      // NOVO — ~3KB
│   ├── ConfigTab.jsx            // NOVO — ~12KB
│   ├── ConfigTab.css            // NOVO — ~6KB
│   ├── MoodboardBoard.jsx       // NOVO — ~8KB
│   ├── MoodboardSection.jsx     // NOVO — ~5KB
│   ├── PitchEditor.jsx          // NOVO — ~6KB
│   ├── ExportModal.jsx          // NOVO — ~5KB
│   ├── CorkboardCard.jsx        // NOVO — ~4KB
│   ├── CorkboardColumn.jsx      // NOVO — ~3KB
│   └── CorkboardFilters.jsx     // NOVO — ~3KB
├── context/
│   ├── EntitiesSchema.js        // EDITAR — adicionar breakdown_sheets, breakdown_items
│   └── ProjectContext.jsx       // EDITAR — adicionar funções CRUD para breakdown + moodboard
├── lib/
│   ├── breakdownUtils.js        // NOVO
│   ├── timelineUtils.js         // NOVO
│   ├── moodboardUtils.js        // NOVO
│   └── export/                  // NOVO — 11 arquivos (ver 4.2.2)
│       ├── pdfEngine.js
│       ├── pdfScreenplay.js
│       ├── pdfBreakdown.js
│       ├── pdfScreenplayAnalysis.js
│       ├── pdfMoodboard.js
│       ├── pdfAnalysisMoodboard.js
│       ├── pdfPitch.js
│       ├── pdfStoryboardScript.js
│       ├── pdfFullPack.js
│       ├── pdfTemplates.js
│       └── pdfStyles.js
```

### Alterações em arquivos existentes

| Arquivo | Alteração |
|---------|-----------|
| `App.jsx` | Adicionar tabs: `tech_analysis`, `corkboard`, `timeline`, `project_config`. Atualizar `renderTabContent()`, navegação desktop e mobile |
| `EntitiesSchema.js` | Adicionar `breakdown_sheets` e `breakdown_items` |
| `ProjectContext.jsx` | CRUD para breakdown sheets/items, moodboard, arguments, exportação |
| `useEntities.js` | Adicionar helpers para breakdown |
| `CorkboardTab.jsx` | Refatorar para novo layout com múltiplos tipos de cartão |
| `MindMapTab.jsx` | Adicionar nó de cena_breakdown, filtro por tipo |
| `index.css` | Estilos base para novos componentes (usar CSS custom properties) |

### Navegação final (8 tabs)

| Ordem | Tab | Label | Ícone (lucide) |
|-------|-----|-------|----------------|
| 1 | `screenplay` | Roteiro | `FileText` |
| 2 | `tech_analysis` | Análise Técnica | `ClipboardList` |
| 3 | `mindmap` | Mapa Mental | `Compass` |
| 4 | `corkboard` | Corkboard | `LayoutGrid` |
| 5 | `timeline` | Timeline | `Clock` |
| 6 | `storyboard` | Storyboard | `Image` |
| 7 | `project_config` | Configuração | `Settings` |
| 8 | `brainstorm` | Ideias | `Sparkles` |

> Mobile: mostrar apenas 5 (Roteiro, Análise Técnica, Corkboard, Storyboard, Ideias) com menu "Mais" para as outras.

---

## FASES DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Análise Técnica)
1. Estender `EntitiesSchema.js` com `breakdown_sheets` e `breakdown_items`
2. Criar `lib/breakdownUtils.js` (gerar do roteiro, CRUD helpers)
3. Estender `ProjectContext.jsx` com funções de breakdown
4. Criar `AnalysisTab.jsx` + componentes filhos
5. Implementar "Gerar do Roteiro" (parser de scene headings → breakdown sheets)

### Fase 2: Visualizações
6. Criar `TimelineTab.jsx` + componentes
7. Refatorar `CorkboardTab.jsx` para múltiplos tipos de cartão
8. Evoluir `MindMapTab.jsx` com nós de breakdown

### Fase 3: Configuração + Moodboard
9. Criar `ConfigTab.jsx` com sub-seções
10. Criar `MoodboardBoard.jsx` + upload de imagens (Supabase Storage)
11. Criar `PitchEditor.jsx` para textos argumentativos
12. Estender `ProjectContext.jsx` com moodboard + arguments

### Fase 4: Exportação PDF
13. Criar `lib/export/pdfEngine.js` + `pdfStyles.js` + `pdfTemplates.js`
14. Implementar cada tipo de documento (#1 a #7)
15. Criar `ExportModal.jsx` + integração com todas as tabs
16. Implementar `pdfFullPack.js` (#8 pacote completo)

### Fase 5: Navegação + Polish
17. Atualizar `App.jsx` com 8 tabs
18. Navegação mobile (5 + "Mais")
19. Atalhos e links bidirecionais entre módulos
20. Testes E2E (Playwright)

---

## REGRAS

1. **Design system:** Seguir `DESIGN.md` rigorosamente. Cores apenas via CSS custom properties. Dark theme sempre.
2. **PT-BR:** Toda a interface em português brasileiro.
3. **Offline-first:** Tudo funciona sem internet (localStorage). Supabase é sync, não requirement.
4. **Client-side PDF:** jspdf + html2canvas, zero dependência de servidor.
5. **Numeração global de breakdown:** Uma vez atribuído, o número nunca muda nem é reusado.
6. **Link bidirecional:** Cena no roteiro ↔ breakdown sheet ↔ corkboard ↔ timeline. Clicar em qualquer um navega pros outros.
7. **Sem React Router:** Continuar com tabs via `useState`.
8. **Componentes pequenos:** Máx ~15KB por componente. Se passar, quebrar.