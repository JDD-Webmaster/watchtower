# WatchTower — monorepo

One repo, two apps:

| Path | Stack | Notes |
|---|---|---|
| `api-watchtower/` | Laravel 13, MySQL, Redis, Sanctum | The API and the reminder engine |
| `web-watchtower/` | Next.js 16 (App Router), React 19, Tailwind v4 | The frontend |

## Before you start

Read `ARCHITECTURE.md` for how the two halves talk to each other, and
`api-watchtower/README.md` for how the reminder engine works. The engine is
the part of this codebase with real subtlety — read
`api-watchtower/app/Console/Commands/DispatchReminders.php` and
`api-watchtower/app/Services/ReminderDispatchService.php` end to end before
changing either.

## Per-app agent instructions

Each app has its own `AGENTS.md` that applies to work inside it:

- `api-watchtower/AGENTS.md` (and `api-watchtower/CLAUDE.md`) — Laravel
  Boost setup and guidelines.
- `web-watchtower/AGENTS.md` — Next.js agent rules. **The `next` package is
  installed in `web-watchtower/node_modules`, not at the repo root** — read
  `web-watchtower/node_modules/next/dist/docs/` before writing Next.js code,
  since the installed version may differ from your training data.

## Commands

Run them from the app's own directory, not the repo root:

```bash
# API
cd api-watchtower
composer install
php artisan test              # Pest
vendor/bin/pint               # format (--test to check)

# Web
cd web-watchtower
npm ci
npm run lint
npm run build                 # includes TypeScript checking
```

## Conventions

- **kebab-case** directories, **PascalCase** PHP classes and React
  components, **snake_case** Eloquent columns, **camelCase** TypeScript
  types and JSON payloads.
- API responses go through `App\Http\Resources\*` — don't hand-roll response
  arrays in controllers.
- Authorization lives in `App\Policies\*` — use `$this->authorize(...)`, not
  inline role checks.
- The browser talks to the API directly via Sanctum SPA cookie auth. There is
  no Next.js server-side proxy layer.

## Gotchas

- `NEXT_PUBLIC_*` values are baked into the client bundle **at build time**.
  Changing one needs a rebuild, not a container restart.
- The `scheduler` container is what actually fires reminders. It fails
  silently — nothing is sent and no error is raised if it isn't running.
- `database/database.sqlite` is gitignored. Tests use an in-memory SQLite
  database (`phpunit.xml`), so they need no MySQL.
- Real `.env` files are never committed. `.env.example` / `.env.local.example`
  are the committed templates — copy them, don't edit them.
