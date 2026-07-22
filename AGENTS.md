# Project Instructions for AI Agents

<!-- DESIGN_SYSTEM_START -->
## Design System

- **Name:** CineWeave Design System
- **Primary Color:** `#ccee00` (lime-gold)
- **Typography:** Outfit for UI, Courier Prime for screenplay
- **Spacing Scale:** 16px-based, with xs(4px) to xxl(32px)
- **Corner Radius:** 16px (cards), 10px (buttons), 8px (inputs)
- **UI Pattern:** Dark glassmorphism with gold accents
- **Component patterns:** Glass cards, ghost secondary buttons, gold primary buttons, dark inputs with gold focus glow
- **Full tokens:** See [DESIGN.md](./DESIGN.md)

AI agents: always apply this design system when generating UI. Do not invent new colors or spacing; refer to `DESIGN.md`.
<!-- DESIGN_SYSTEM_END -->

<!-- BEGIN:skills -->
CAVEMAN_MODE_ACTIVE: true

## Skills Instaladas

Skills específicas (`.agents/skills/`): `supabase`, `emil-design-eng`, `playwright-best-practices`, `extract-design-system`

Skills globais (`~/.agents/skills/`): `vercel-react-best-practices`, `web-design-guidelines`, `vercel-composition-patterns`, `frontend-design`, `tdd`, `writing-plans`, `executing-plans`, `implement`, `code-review`, `qa`, `caveman`, `caveman-commit`, `systematic-debugging`, `subagent-driven-development`, `finishing-a-development-branch`, `using-git-worktrees`, `git-commit`, `find-skills`

## Regras de Sugestão Automática

Sempre sugerir a skill certa no momento certo. Perguntar antes de ativar ("Quer que eu use X?").

| Contexto | Sugerir | Como perguntar |
|----------|---------|----------------|
| Usuário descreveu feature vaga ou complexa | `writing-plans` | "Quer que eu use writing-plans pra estruturar?" |
| Existe plano/spec pronto pra implementar | `implement` | "Quer que eu use implement pra codar?" |
| Código foi escrito/alterado | `code-review` | "Quer code-review no que fiz?" |
| Antes de dar tarefa como concluída | `qa` | "Quer qa pra validar?" |
| Branch/PR pronto pra fechar | `finishing-a-development-branch` | "Quer finalizar a branch com PR?" |
| Bug/erro acontecendo | `systematic-debugging` | Ativar direto sem perguntar |
| Tarefa grande que dá pra dividir | `subagent-driven-development` | "Quer dividir em sub-agentes?" |
| Vai commitar | `caveman-commit` | Ativar direto sem perguntar |
| Modo caveman ativo | `caveman` | Já ativo — não repetir |

## Regras Fixas
- `caveman-commit`: usar em **todo commit**, sem avisar
- `systematic-debugging`: ativar **automaticamente** em bugs, sem avisar
- `caveman`: já ativo. Usuário desativa com "normal mode" ou "stop caveman"
- Demais: **sempre perguntar** "Quer que eu use [skill]?" antes de ativar
- Skills de tecnologia (supabase, react, fastapi etc): carregam automático pelo contexto, sem sugestão

## Workflow Padrão
```
feature → writing-plans → implement → code-review → qa → finishing-a-development-branch
```
<!-- END:skills -->

<!-- BEGIN:memory -->
## GNNSS Memory System

This workspace is part of the GNNSS project ecosystem.
An Obsidian vault stores all project context across sessions.
**Always read context before, write after.**

### Pre-Session (read in order)
1. `C:\Users\gnnss\OneDrive\Documents\GNNSS_VAULT\hot.md`
2. `C:\Users\gnnss\OneDrive\Documents\GNNSS_VAULT\Diário de Sessão.md` (last 15 lines)
3. `C:\Users\gnnss\OneDrive\Documents\GNNSS_VAULT\GNNSS Vault.md`

### Post-Session (write these)
1. Append to `Diário de Sessão.md`:
   ```
   ## YYYY-MM-DD — Title
   
   ### ✅ Feito
   - item
   
   ### 🧠 Aprendizados
   - lesson
   
   ### 🔧 Pendentes
   - [ ] pending
   ```
2. Overwrite `hot.md` with latest context
3. Update `CineWeave.md` note if project state changed

### Mid-Session Triggers
- Decision → append to `Decisões Técnicas.md`
- Solution → append to `Dicas & Truques.md`
- Idea → append to `Ideias Criativas.md`
<!-- END:memory -->
