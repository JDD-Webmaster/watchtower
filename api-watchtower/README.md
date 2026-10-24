# api-watchtower

The API and reminder engine behind [WatchTower](https://watchtower.uselodger.com)
— log a renewal/compliance deadline once, get reminded by SMS and email on a
schedule, escalating once overdue, until someone marks it done.

This is the backend half of the WatchTower monorepo. The Next.js frontend
lives alongside it in [`web-watchtower/`](../web-watchtower), and the
`docker-compose.yml` that runs both is at the repo root.

## Stack

Laravel 13, MySQL, Redis (queue + cache), Sanctum (SPA cookie auth for the
frontend). SMS via [Kudi](https://kudisms.net) (Nigerian numbers) and
[Termii](https://termii.com) (rest of Africa), routed automatically by
recipient country.

## The reminder engine, in two files

- `app/Console/Commands/DispatchReminders.php` — scheduled hourly
  (`routes/console.php`), only acts on an organization during the hour
  that's currently 08:00 in *its own* timezone. Matches due dates against
  each item's reminder offsets (default 30/14/7/1 days before due), then
  escalates to a repeating overdue nudge.
- `app/Services/ReminderDispatchService.php` — sends the actual SMS/email
  to every owner on the account, logging the exact rendered content (not
  just "a reminder was sent") to `reminder_logs`.

`App\Models\DeadlineItem::markDone()` is the other half: marking a
recurring item done auto-advances `due_date` to the next cycle, anchored to
the *original* due date (not "today"), so handling a renewal a few days
late never drifts the schedule forward.

## Local development

From this directory:

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve

# separate terminals
php artisan queue:work
php artisan schedule:work
```

Or run the whole stack (API + web + MySQL + Redis) from the repo root with
`docker compose up --build`.

## Testing

```bash
php artisan test
```

Pest tests cover the reminder engine directly — offset matching,
duplicate-send prevention, overdue escalation cadence, recurrence math
(including month-end edge cases like Jan 31 → Feb 28), and the full
authorization layer (org membership, owner-only settings).

## Payments (Paystack)

Wallet funding runs through Paystack's REST API and inline checkout. The
controller never credits a wallet on its own — it only credits after Paystack
confirms the charge, either through `POST /api/webhooks/paystack` (signature
checked against `PAYSTACK_WEBHOOK_SECRET`) or through
`POST /api/organizations/{id}/wallet/verify` (which re-checks the transaction
with Paystack before crediting). Amount and currency must match the original
intent, so a replayed reference cannot credit a different amount.

Test vs live is decided **only** by the key prefix — `pk_test_`/`sk_test_`
versus `pk_live_`/`sk_live_`. Both point at the same host
(`https://api.paystack.co`), so switching modes is an env change, not a code
change:

1. Put the test keys and the test webhook secret in `.env`.
2. Register the webhook URL in the Paystack dashboard (Settings → API Keys &
   Webhooks): `https://api-watchtower.uselodger.com/api/webhooks/paystack`.
3. Run the whole flow end to end (fund → popup → credited), including a
   webhook delivery. The wallet page shows a `TEST MODE` badge while test
   keys are active.
4. When ready, replace **both** keys with the live keys, update
   `PAYSTACK_WEBHOOK_SECRET`, then re-cache config:
   `php artisan config:clear && php artisan config:cache`.

## Deployment

Production runs at `https://api-watchtower.uselodger.com`. The deploy
workflow (`.github/workflows/deploy.yml` at the repo root) builds this app
and the frontend from the same commit; see [RUNBOOK.md](../RUNBOOK.md) for
the container layout and the operational details.

The `scheduler` container is what actually fires reminders — nothing sends
without it running.

## License

MIT — see [LICENSE](../LICENSE).
