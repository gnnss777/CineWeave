# Contributing to CineWeave

Thanks for your interest in contributing! This guide covers the basics.

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- (Optional) Supabase account for cloud sync features

## Setup

```bash
git clone https://github.com/<org>/CineWeave.git
cd CineWeave
npm install
cp .env.example .env.local   # configure Supabase + API keys
npm run dev
```

## Development Workflow

1. Create a branch from `master`:
   ```bash
   git checkout -b feat/your-feature
   ```

2. Make your changes, following the design system (see `DESIGN.md`).

3. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(screenplay): add dual-dialogue formatting
   fix(sync): resolve race condition on entity save
   ```

4. Push and open a PR against `master`.

## Commit Convention

Commits are validated by commitlint. Format:

```
<type>(<scope>): <description>

<body>
```

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`

## Linting

We use [oxlint](https://oxc.rs/docs/guide/usage/linter). Pre-commit hook runs `lint-staged` automatically.

```bash
npm run lint      # check
npm run format    # auto-fix
```

## Design System

See `DESIGN.md` for the full token reference. Key rules:

- Use CSS custom properties (`--primary-gold`, `--color-scene`, etc.) — never hardcode hex values
- Use spacing tokens (`--spacing-sm`, `--spacing-md`, etc.) — no magic numbers
- Follow the dark glassmorphism pattern: `rgba(20,20,20,0.75)` cards, gold accents

## Testing

E2E tests use Playwright:

```bash
npx playwright install   # first time only
npm run test:e2e
```

## Supabase Migrations

New entity types need:
1. SQL migration in `supabase/migrations/`
2. CRUD functions in `src/lib/db.js`
3. Sync integration in `src/lib/sync.js`
4. Entity schema in `src/context/EntitiesSchema.js`

## Questions?

Open an issue or reach out to the team.
