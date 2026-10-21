# WatchTower

**Never miss a renewal again.** Domains, hosting, API/payment subscriptions,
government levies — log the deadline once. WatchTower remembers forever, and
nags by SMS and email — escalating once something's overdue — until a human
marks it done.

Built because businesses lose track of recurring obligations not for lack of
a calendar, but because nobody *owns* remembering, and humans get busy. The
fix isn't a smarter calendar — it's a system that doesn't forget and doesn't
get busy.

🔗 Live at **[watchtower.uselodger.com](https://watchtower.uselodger.com)** —
free to use, no credit card.

## How it works

- **Log it once.** Name, category, due date, how often it repeats.
- **It reminds on a schedule** — 30/14/7/1 days before due by default
  (configurable per organization or per item), then every few days once
  overdue, until someone marks it done.
- **Every reminder goes out on SMS *and* email**, to every owner on the
  account — not just whoever happened to set it up.
- **Recurring items auto-advance.** Mark a monthly/yearly/custom-interval
  deadline done and it's rescheduled for the next cycle automatically,
  anchored to the real due date — no re-entering it by hand.
- **Full audit trail.** Every reminder's exact sent content (not just "an
  email was sent") is logged and viewable per deadline.

## Repository layout

One repo, two apps — the backend and the frontend live side by side:

```
watchtower/
├── api-watchtower/     Laravel 13 API + the reminder engine
│   ├── app/            Models, Controllers, Policies, Services, Console\Commands
│   ├── config/         Includes config/reminders.php — the engine's knobs
│   ├── database/       Migrations, factories, seeders
│   ├── routes/         api.php, console.php (the hourly schedule), web.php
│   ├── tests/          Pest — Feature + Unit
│   └── Dockerfile      PHP-FPM behind nginx
│
├── web-watchtower/     Next.js 16 frontend (App Router)
│   ├── app/            Route segments: /, /login, /register, /dashboard
│   ├── components/     Shared React components
│   ├── lib/            api.ts (fetch client), auth.tsx (session), types.ts
│   └── Dockerfile      Next.js standalone output
│
├── docker-compose.yml  Runs both apps + MySQL + Redis
├── .github/workflows/  ci.yml (backend + frontend jobs), deploy.yml
├── ARCHITECTURE.md     How the two halves talk to each other
└── RUNBOOK.md          Production operations + the server cutover steps
```

Per-app detail:
[`api-watchtower/README.md`](api-watchtower/README.md) ·
[`web-watchtower/README.md`](web-watchtower/README.md)

## Running it

### Docker Compose (recommended)

```bash
git clone https://github.com/JDD-Webmaster/watchtower.git
cd watchtower

# API env — fill in APP_KEY (php artisan key:generate --show), SMS keys if you have them
cp api-watchtower/.env.example api-watchtower/.env

# Web env
cp web-watchtower/.env.local.example web-watchtower/.env.local

docker compose up --build
docker compose exec api php artisan migrate --force   # first boot only
```

- Web: http://localhost:3000
- API: http://localhost:8000

The `scheduler` container is what actually fires reminders (hourly, honoring
each organization's own timezone) — without it, nothing gets sent, ever.

### Local development (without Docker)

```bash
# api-watchtower/
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
# separate terminals: php artisan queue:work · php artisan schedule:work

# web-watchtower/
cp .env.local.example .env.local
npm install
npm run dev
```

## Testing

```bash
cd api-watchtower && php artisan test   # Pest
cd web-watchtower && npm run lint && npm run build
```

The API's Pest suite covers the reminder engine directly — offset matching,
duplicate-send prevention, overdue escalation cadence, recurrence math
(including month-end edge cases like Jan 31 → Feb 28), and the full
authorization layer (org membership, owner-only settings).

## Configuration

| Env var | Where | Purpose |
|---|---|---|
| `REMINDERS_ENABLED` | `api-watchtower/.env` | Platform-wide kill switch for the entire reminder engine (default `true`) |
| `KUDI_SMS_API_KEY` / `TERMII_API_KEY` | `api-watchtower/.env` | SMS providers — leave blank to run email-only |
| `FRONTEND_URL` | `api-watchtower/.env` | Used for CORS and for building real links inside reminder messages |
| `NEXT_PUBLIC_API_URL` | `web-watchtower/.env.local` | Where the browser sends API requests |

No SMS keys configured? Reminders still go out by email; SMS attempts log a
clear "not configured" warning instead of silently failing.

## Contributing

Issues and PRs welcome. The reminder engine is intentionally small —
`api-watchtower/app/Console/Commands/DispatchReminders.php` and
`api-watchtower/app/Services/ReminderDispatchService.php` are the whole thing,
worth reading end to end before changing either.

## About

WatchTower is built and maintained by the team behind
[UseLodger](https://uselodger.com) — a property/hospitality management
platform for hotels, shortlets, landlords, and restaurants across Nigeria.
If you run a business and need the operations side (bookings, payments,
tenants, staff) rather than just renewal reminders, that's worth a look too.

## License

MIT — see [LICENSE](LICENSE).
