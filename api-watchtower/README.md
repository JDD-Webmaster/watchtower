# api.watchtower

The API and reminder engine behind [WatchTower](https://github.com/JDD-Webmaster/watchtower)
— log a renewal/compliance deadline once, get reminded by SMS and email on a
schedule, escalating once overdue, until someone marks it done.

This repo is backend-only. The web app lives at
[JDD-Webmaster/watchtower](https://github.com/JDD-Webmaster/watchtower), which
also hosts the combined `docker-compose.yml` for running both together.

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

## Testing

```bash
php artisan test
```

Pest tests cover the reminder engine directly — offset matching,
duplicate-send prevention, overdue escalation cadence, recurrence math
(including month-end edge cases like Jan 31 → Feb 28), and the full
authorization layer (org membership, owner-only settings).

## Deployment

Production runs at `https://api-watchtower.uselodger.com`. See the root
`docker-compose.yml` in the [watchtower](https://github.com/JDD-Webmaster/watchtower)
repo for the containers this needs (`api`, `queue`, `scheduler` all build
from this repo; `scheduler` is what actually fires reminders — nothing
sends without it running).

## License

MIT — see [LICENSE](LICENSE).
