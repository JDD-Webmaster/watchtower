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

## Repos

This is the web app (Next.js). The API and reminder engine live in a
separate repo: [JDD-Webmaster/api.watchtower](https://github.com/JDD-Webmaster/api.watchtower)
— read that repo's README for how the actual reminder logic works.

## Running it

### Docker Compose (recommended)

Clone both repos as siblings first:

```bash
git clone https://github.com/JDD-Webmaster/watchtower
git clone https://github.com/JDD-Webmaster/api.watchtower

cd api.watchtower && cp .env.example .env   # fill in APP_KEY (php artisan key:generate --show), SMS keys if you have them
cd ../watchtower && cp .env.local.example .env.local

docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8000

The `scheduler` container is what actually fires reminders (hourly, honoring
each organization's own timezone) — without it, nothing gets sent, ever.

### Local development (without Docker)

```bash
# api.watchtower
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
# separate terminals: php artisan queue:work · php artisan schedule:work

# watchtower (this repo)
cp .env.local.example .env.local
npm install
npm run dev
```

## Configuration

| Env var (api.watchtower) | Purpose |
|---|---|
| `REMINDERS_ENABLED` | Platform-wide kill switch for the entire reminder engine (default `true`) |
| `KUDI_SMS_API_KEY` / `TERMII_API_KEY` | SMS providers — leave blank to run email-only |
| `FRONTEND_URL` | Used for CORS and for building real links inside reminder messages |

No SMS keys configured? Reminders still go out by email; SMS attempts log a
clear "not configured" warning instead of silently failing.

## Contributing

Issues and PRs welcome, on either repo. The reminder engine is intentionally
small — `api.watchtower`'s `app/Console/Commands/DispatchReminders.php` and
`app/Services/ReminderDispatchService.php` are the whole thing, worth
reading end to end before changing either.

## Roadmap (not yet built)

- A simple REST API for other apps to register/update deadlines
  programmatically (first integration target: [UseLodger](https://uselodger.com),
  for hosts tracking their own domain/hosting/levy deadlines alongside their
  property business)
- Auto-discovery of renewal dates from domain registrars/hosting providers
  (where their APIs allow it)
- Paid hosted tiers (the hosted instance is free for now)

## About

WatchTower is built and maintained by the team behind
[UseLodger](https://uselodger.com) — a property/hospitality management
platform for hotels, shortlets, landlords, and restaurants across Nigeria.
If you run a business and need the operations side (bookings, payments,
tenants, staff) rather than just renewal reminders, that's worth a look too.

## License

MIT — see [LICENSE](LICENSE).
