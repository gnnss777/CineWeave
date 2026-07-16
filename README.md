# CineWeave

Aplicação de roteirismo colaborativo com unificação de dados entre Brainstorm, Enciclopédia, Roteiro e Mapa Mental.

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

project.screenplay[]   ← blocos SEMPRE com entityId
project.mindMapNodes[] ← só layout (entityId + x,y)
project.ideas[]        ← notas soltas criativas
project.recordings[]   ← áudio gravado
project.mediaUploads[] ← concept art, referências
```

## Status de Implementação

- ✅ **Fase 1**: Eliminação de `brainstormData`, unificação em `entities`
- ✅ **Fase 2**: Linkagem bidirecional `screenplay ↔ entities`
- ⏳ **Fase 3**: Mind Map como view pura de `entities`
- ⏳ **Fase 4**: Limpeza de arrays legados
- ⏳ **Fase 5**: Navegação cruzada entre abas
- ⏳ **Fase 6**: Consolidar 8 abas em 4

## Navegação Cruzada

- Botão "Ver no Roteiro" em cada ficha (`FichaModal`) navega para o bloco correspondente no roteiro.
- Edições no roteiro atualizam automaticamente as entidades relacionadas (`saveScreenplay` em `ScreenplayTab`).

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

## Backend

O aplicativo usa Supabase para sincronização de dados. Consulte `supabase/migration.sql` para o esquema.
