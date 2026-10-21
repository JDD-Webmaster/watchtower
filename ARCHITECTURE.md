# Architecture

How the two halves of this repo fit together, and what to know before
changing either.

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  web-watchtower/        │         │  api-watchtower/         │
│  Next.js 16 (App Router)│         │  Laravel 13 + Sanctum    │
│                         │         │                          │
│  app/       routes      │  HTTPS  │  routes/api.php          │
│  components/ UI         │ ──────► │  Http/Controllers/Api    │
│  lib/api.ts fetch client │ cookie  │  Http/Resources          │
│  lib/auth.tsx session   │  auth   │  Policies/               │
└─────────────────────────┘         └───────────┬──────────────┘
                                                 │
                                                 ▼
                                   ┌──────────────────────────┐
                                   │  MySQL 8   (data)        │
                                   │  Redis    (queue+cache)  │
                                   └──────────────────────────┘
                                                 │
                                                 ▼
                                   ┌──────────────────────────┐
                                   │  queue + scheduler       │
                                   │  containers              │
                                   │                          │
                                   │  ReminderDispatchService │
                                   │  → SMS (Kudi/Termii)     │
                                   │  → email                 │
                                   │  → reminder_logs rows    │
                                   └──────────────────────────┘
```

## The two processes that matter

Three containers run the same API image, with different commands:

| Container | Command | What it does |
|---|---|---|
| `api` | `php-fpm` | Serves HTTP via the shared-host nginx |
| `queue` | `php artisan queue:work` | Sends the SMS/email jobs that were dispatched |
| `scheduler` | `php artisan schedule:run` (every 60s) | Fires `reminders:dispatch` hourly |

**The scheduler is the one that matters.** It runs
`App\Console\Commands\DispatchReminders` on an hourly schedule
(`api-watchtower/routes/console.php`), and that command only acts on an
organization during the hour that is currently 08:00 in *its own* timezone.
Without the scheduler running, nothing is ever sent — the app still works,
it just silently never reminds anyone.

`queue` is what actually talks to Kudi/Termii and the mail server. A
deployment that starts the scheduler but not the queue will fill
`reminder_logs` with nothing sent.

## The reminder engine, in two files

- `api-watchtower/app/Console/Commands/DispatchReminders.php` — matches due
  dates against each item's reminder offsets (default 30/14/7/1 days before
  due), then escalates to a repeating overdue nudge.
- `api-watchtower/app/Services/ReminderDispatchService.php` — sends the
  actual SMS/email to every owner on the account, logging the exact rendered
  content (not just "a reminder was sent") to `reminder_logs`.

`App\Models\DeadlineItem::markDone()` is the other half: marking a recurring
item done auto-advances `due_date` to the next cycle, anchored to the
*original* due date (not "today"), so handling a renewal a few days late
never drifts the schedule forward.

## Authentication

The browser talks to the API directly (no Next.js server-side proxy), using
Sanctum's **SPA cookie authentication**:

1. `web-watchtower/lib/auth.tsx` posts credentials to
   `POST /api/auth/login`.
2. Laravel authenticates and returns a `Set-Cookie` session cookie
   (`sanctum` guard, `SESSION_DRIVER=redis`).
3. Every subsequent call from `web-watchtower/lib/api.ts` sends the cookie
   with `credentials: 'include'`.

This is why the API's CORS config and `SANCTUM_STATEFUL_DOMAINS` must list the
frontend's exact origin — a mismatch shows up as "logged out immediately
after login", not as a CORS error you can read.

## Environment variables

| Variable | Lives in | Consumed by |
|---|---|---|
| `APP_KEY`, `DB_*`, `REDIS_*`, `MAIL_*` | `api-watchtower/.env` | Laravel |
| `FRONTEND_URL` | `api-watchtower/.env` | CORS allow-list + links in SMS/email |
| `SANCTUM_STATEFUL_DOMAINS` | `api-watchtower/.env` | Sanctum's cookie auth |
| `REMINDERS_ENABLED` | `api-watchtower/.env` | Kill switch for the whole engine |
| `KUDI_SMS_API_KEY`, `TERMII_API_KEY` | `api-watchtower/.env` | SMS providers |
| `NEXT_PUBLIC_API_URL` | `web-watchtower/.env.local` | The browser's API base URL |

`NEXT_PUBLIC_*` is **baked into the client bundle at build time** — it is a
Docker build arg, not a runtime environment variable. Changing it requires a
rebuild, not just a container restart.

## Build and deploy

- **CI** (`.github/workflows/ci.yml`) runs two independent jobs: `backend`
  (Pint + Pest) and `frontend` (ESLint + `next build`, which includes
  TypeScript checking). Neither depends on the other.
- **Deploy** (`.github/workflows/deploy.yml`) runs only after CI passes on
  `main`. It pulls the monorepo, builds all four images, swaps the API
  container, runs `migrate --force`, health-checks the public API URL, then
  swaps the queue, scheduler and frontend containers and health-checks the
  public web URL. If either health check fails, it resets the checkout to the
  previous commit and redeploys.

## Conventions

- **kebab-case** for directories and multi-word project names.
- **PascalCase** for PHP classes and React component files.
- **snake_case** for Eloquent table and column names; **camelCase** for
  TypeScript types and JSON payloads.
- `App\Http\Controllers\Api\*` — the API is versioned by being its own
  directory, not by a URL prefix.
- `App\Http\Resources\*` — every API response goes through a Resource
  class. Don't hand-roll response arrays in controllers.
- Authorization lives in `App\Policies\*` — controllers call
  `$this->authorize(...)` / `Gate::allows(...)`, never inline role checks.
