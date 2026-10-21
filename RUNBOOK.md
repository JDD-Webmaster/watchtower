# Runbook

Production operations for WatchTower, plus the one-time server cutover from
the old two-repo layout to this monorepo.

- App: https://watchtower.uselodger.com
- API: https://api-watchtower.uselodger.com
- Server: `myserver` (see `~/.ssh/config`)
- App checkout: `/home/adewale/apps/watchtower`
- Compose file: `/home/adewale/docker/docker-compose.watchtower.yml`

---

## One-time server cutover (old layout → monorepo)

> **Done — 21 Oct 2026.** The server now runs the monorepo layout: one
> checkout at `/home/adewale/apps/watchtower` holding `api-watchtower/` and
> `web-watchtower/`, with the compose file building from those paths. The
> steps below are kept for reference — if the server is ever rebuilt from
> scratch, follow them in order.

The production server still has the pre-monorepo layout: two separate
checkouts, and a compose file that builds from both of them. This needs to
be done **by hand, once**, before the new deploy workflow can work. Everything
below is run on the server over SSH.

### 1. Clone the monorepo

```bash
ssh myserver
cd /home/adewale/apps
git clone https://github.com/JDD-Webmaster/watchtower.git watchtower
cd watchtower
git log --oneline -1
```

The `watchtower` directory must contain `api-watchtower/` and
`web-watchtower/`. If it doesn't, the monorepo commit hasn't been pushed yet
— push it locally first.

### 2. Move the API's `.env` across

The `.env` holds the real `APP_KEY`, SMS provider keys and mail credentials.
It is not in git, so it has to be carried over by hand:

```bash
cp /home/adewale/apps/api-watchtower/.env /home/adewale/apps/watchtower/api-watchtower/.env
chmod 600 /home/adewale/apps/watchtower/api-watchtower/.env
```

Then change the `FRONTEND_URL` and `SANCTUM_STATEFUL_DOMAINS` values in that
file to `watchtower.uselodger.com` (they were pointed at the old frontend
host), and set `APP_URL=https://api-watchtower.uselodger.com`.

### 3. Rewrite the server-side compose file

The service names, container names, resource limits and network must stay
exactly as they are — the shared-host nginx and the `web` external network
depend on those names. Only the **build contexts and bind mounts** change.

```bash
cp /home/adewale/docker/docker-compose.watchtower.yml \
   /home/adewale/docker/docker-compose.watchtower.yml.bak-monorepo
```

Then edit the file so that:

- `api-watchtower`, `queue-watchtower` and `scheduler-watchtower` build from
  `/home/adewale/apps/watchtower/api-watchtower` and bind-mount
  `/home/adewale/apps/watchtower/api-watchtower:/var/www/html` (plus that
  directory's `.env`).
- `nextjs-watchtower` builds from `/home/adewale/apps/watchtower/web-watchtower`
  with the same `NEXT_PUBLIC_API_URL: https://api-watchtower.uselodger.com`
  build arg.

Everything else — `container_name`, `mem_limit`, `cpus`, `working_dir`,
`networks: [web]`, the `PORT=3004` environment, the queue and scheduler
commands — is unchanged.

### 4. Cut over

```bash
cd /home/adewale/docker
docker compose -f docker-compose.watchtower.yml up -d --build \
  api-watchtower queue-watchtower scheduler-watchtower nextjs-watchtower
```

Watch for the containers to come up healthy:

```bash
docker compose -f docker-compose.watchtower.yml ps
docker logs --tail 50 api-watchtower
```

### 5. Verify before removing the old checkouts

```bash
curl -sf https://api-watchtower.uselodger.com/up && echo "API OK"
curl -sf https://watchtower.uselodger.com/api/health && echo "WEB OK"
```

Then check that reminders still fire — the scheduler is the piece most
easily lost in a cutover, and it fails *silently*:

```bash
docker logs --tail 50 scheduler-watchtower
docker exec api-watchtower php artisan schedule:list
```

Only once all three are confirmed:

```bash
rm -rf /home/adewale/apps/api-watchtower
rm -rf /home/adewale/apps/watchtower-nextjs
```

Keep the `.bak-monorepo` compose backup around until the next deploy has run
green.

---

## Routine operations

### Deploy

Pushes to `main` deploy automatically once CI passes. To deploy by hand:

```bash
ssh myserver
cd /home/adewale/apps/watchtower
git fetch origin main && git reset --hard origin/main
docker compose -f /home/adewale/docker/docker-compose.watchtower.yml up -d --build \
  api-watchtower queue-watchtower scheduler-watchtower nextjs-watchtower

# The container bind-mounts the checkout, so the image's vendor/ is invisible
# at runtime. This has to happen before any artisan command will run.
docker exec api-watchtower composer install --no-dev --optimize-autoloader --no-scripts
docker exec api-watchtower php artisan clear-compiled
docker exec api-watchtower composer dump-autoload --no-dev --optimize
docker exec api-watchtower php artisan package:discover
docker exec api-watchtower chown -R www-data:www-data /var/www/html/vendor /var/www/html/bootstrap/cache
docker exec api-watchtower php artisan migrate --force
docker exec api-watchtower php artisan config:cache
docker exec api-watchtower php artisan route:cache
docker exec api-watchtower php artisan view:cache
docker exec api-watchtower php artisan event:cache
```

### Check that reminders are actually going out

This is the failure mode that looks like "the app is fine" — so check it
explicitly after any change to the scheduler, the queue, or the engine.

```bash
# Is the scheduler alive and the command registered?
docker ps --filter name=scheduler-watchtower
docker exec api-watchtower php artisan schedule:list

# What did it actually send? (exact rendered content is stored)
docker exec api-watchtower php artisan tinker --execute='
  App\Models\ReminderLog::latest("sent_at")
    ->limit(10)
    ->get(["channel", "recipient", "status", "sent_at"])
    ->each(fn($l) => print($l . PHP_EOL));
'
```

### Kill switch

If the engine is misbehaving, turn it off without a deploy — set
`REMINDERS_ENABLED=false` in `api-watchtower/.env` on the server and restart
the scheduler and queue:

```bash
cd /home/adewale/apps/watchtower/api-watchtower
sed -i 's/^REMINDERS_ENABLED=.*/REMINDERS_ENABLED=false/' .env
docker compose -f /home/adewale/docker/docker-compose.watchtower.yml \
  up -d --force-recreate queue-watchtower scheduler-watchtower
```

Set it back to `true` when the issue is resolved.

### Logs

```bash
docker logs --tail 200 -f api-watchtower
docker logs --tail 200 -f queue-watchtower
docker logs --tail 200 -f scheduler-watchtower
docker logs --tail 200 -f nextjs-watchtower
```

Laravel's own log is inside the container at
`/var/www/html/storage/logs/laravel.log`.

---

## Troubleshooting

**Reminders stopped, no errors anywhere.** The scheduler isn't running, or
it's running but the queue is backed up. Check both:
`docker ps --filter name=scheduler-watchtower` and
`docker ps --filter name=queue-watchtower`.

**"Logged out" the instant you log in.** The API's CORS allow-list or
`SANCTUM_STATEFUL_DOMAINS` doesn't include the frontend's exact origin.
Check `FRONTEND_URL` and `SANCTUM_STATEFUL_DOMAINS` in
`api-watchtower/.env` on the server, then
`docker exec api-watchtower php artisan config:clear`.

**Frontend can't reach the API.** `NEXT_PUBLIC_API_URL` is baked in at build
time, not read at runtime — a changed value needs a rebuild, not a restart.
Rebuild `nextjs-watchtower` explicitly.

**Migrations fail mid-deploy.** The deploy workflow rolls back to the
previous commit automatically when a health check fails. If migrations
half-applied, check `docker exec api-watchtower php artisan migrate:status`
before re-running.
