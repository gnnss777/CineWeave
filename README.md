# CineWeave

Aplicação de roteirismo colaborativo com unificação de dados entre Brainstorm, Enciclopédia, Roteiro, Análise Técnica, Visualizações, Storyboard, Configuração e **Plugin System**.

> See [CHANGELOG.md](./CHANGELOG.md) for release history and [ARCHITECTURE.md](./ARCHITECTURE.md) for the system overview.

## 🆕 Sistema de Revisões

Sistema completo de revisão de roteiro com **8 níveis de revisão** e persistência de cores:

- **Nível 0**: Branco (Azul)
- **Nível 1**: Rosa
- **Nível 2**: Amarelo
- **Nível 3**: Verde
- **Nível 4**: Dourado
- **Nível 5**: Creme
- **Nível 6**: Salmão
- **Nível 7**: Cereja

### Como Funciona

1. **Versão Ativa**: Dropdown para selecionar qual cor será usada em NOVAS edições
2. **Persistência**: Cada revisão mantém sua cor original, independente da versão ativa
3. **Filtro de Revisões**: Mostrar apenas revisões, ocultar revisões ou ver tudo
4. **Painel de Revisões**: Visualização de todas as revisões com filtros por cena
5. **Storage**: Cores são salvas no BEAT metadata no formato `BlockRevisions: { "blocoId": "nivel" }`

### Exemplo de Uso

```javascript
// Criar revisão Rosa
1. Selecione "Rosa" no dropdown "Versão ativa"
2. Edite um bloco (ou use o painel de revisões)
3. A revisão fica Rosa e NUNCA muda de cor

// Mudar versão ativa
1. Mude "Versão ativa" para "Dourado"
2. Edite novos blocos → ficam Dourados
3. Revisões antigas (Rosa, Verde etc) continuam com suas cores originais
```

## Arquitetura de Dados Unificada

O sistema utiliza `project.entities` como **úNICA fonte da verdade**:

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

project.screenplay[]   ← blocos SEMPRE com entityId + metadata de revisão
project.mindMapNodes[] ← só layout (entityId + x,y)
project.ideas[]        ← notas soltas criativas
project.recordings[]   ← áudio gravado
project.mediaUploads[] ← concept art, referências
```

## Status de Implementação

- ✅ **Fase 1**: Eliminação de `brainstormData`, unificação em `entities`
- ✅ **Fase 2**: Linkagem bidirecional `screenplay ↔ entities`
- ✅ **Fase 3**: Mind Map como view pura de `entities`
- ✅ **Fase 4**: Limpeza de arrays legados
- ✅ **Fase 5**: Navegação cruzada entre abas (basic cross-tab navigation)
- ✅ **Fase 6**: Sistema de Revisões com persistência de cores
- ✅ **Fase 7**: Tabs adicionais (Análise, Visualizações, Configuração, Storyboard, Plugins)
- ⏳ **Fase 8**: Navegação cruzada entre abas (deep linking: abrir ficha direto no roteiro, etc.)

> **Note on Fase 5 vs Fase 8**: both are about cross-tab navigation. Fase 5
> delivered the basic mechanism (the `tabNavigation` redirect in
> `CineWeaveShell`). Fase 8 covers the deeper work (entity→block deep
> links, two-way state sync) and is still pending.

## Navegação Cruzada

- Botão "Ver no Roteiro" em cada ficha (`FichaModal`) navega para o bloco correspondente no roteiro.
- Edições no roteiro atualizam automaticamente as entidades relacionadas (`saveScreenplay` em `ScreenplayTab`).

## Desenvolvimento

```bash
npm install
npm run dev      # Vite dev server (default port 5173)
npm run build    # Production build
npm run lint     # oxlint
npm run format   # oxlint --fix
npm run test:e2e # Playwright
```

## Plugin System

CineWeave ships a BeatPlugins-style plugin system. Built-in plugins:
- **Slugline Linter** — normalizes scene headings to UPPERCASE
- **Diversity Analyzer (Bechdel Test)** — heuristic Bechdel-Wallace check
- **Markup Cleaner** — removes empty blocks, hidden notes, stray tags

> ⚠️ **Known issue (#5):** the plugins are implemented but not yet wired at
> app boot — the Plugin Store currently shows "Nenhum plugin instalado".
> See `src/lib/pluginSystem/` for the API.

## Backend

O aplicativo usa Supabase para sincronização de dados. Consulte `supabase/migration.sql` para o esquema. O LLM proxy para a NVIDIA API vive em `api/nvidia/[...path].js` (Web Handler signature).
