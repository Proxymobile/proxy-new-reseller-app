# RUNBOOK.md

> Common ops tasks, troubleshooting, logs.

## Quick Commands

```bash
SSH="ssh -i ~/.ssh/proxy_reseller_deploy root@72.62.117.94"

# Status
$SSH "cd /opt/proxy-reseller/deploy && docker compose -f docker-compose.prod.yml ps"

# App logs (last 100 lines)
$SSH "cd /opt/proxy-reseller/deploy && docker compose -f docker-compose.prod.yml logs --tail 100 app"

# DB shell
$SSH "docker exec -it deploy-db-1 psql -U proxy_reseller"

# Restart app
$SSH "cd /opt/proxy-reseller/deploy && docker compose -f docker-compose.prod.yml restart app"
```

## Troubleshooting

### App returns 502
1. Check if app container is running: `docker ps`
2. Check app logs: `docker logs deploy-app-1 --tail 50`
3. Common cause: missing env var → check `.env`
4. Restart: `docker compose restart app`

### Database connection errors
1. Check db container: `docker ps | grep db`
2. Check db logs: `docker logs deploy-db-1 --tail 20`
3. Verify DATABASE_URL in .env matches compose config
4. Check disk space: `df -h /`

### Registration fails
1. Check app logs for error
2. Verify database is accessible: `docker exec deploy-db-1 pg_isready`
3. Check if users table exists: `docker exec deploy-db-1 psql -U proxy_reseller -c '\dt'`

### Stripe webhooks not processing
1. Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
2. Check webhook_events table for duplicates
3. Check audit_log for purchase_completed entries
4. Test: `curl -s http://localhost:3000/api/stripe/webhook` (should return 400 missing signature)

## Database Queries

```sql
-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Recent registrations
SELECT email, hashcode, role, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- Active customers with keys
SELECT u.email, c.pak_key_id, c.traffic_cap_gb, c.traffic_used_gb, c.enabled
FROM customers c JOIN users u ON u.id = c.user_id
WHERE c.pak_key_id IS NOT NULL;

-- Revenue
SELECT SUM(price_usd) as total, COUNT(*) as count FROM purchases WHERE status = 'completed';

-- Recent audit events
SELECT u.email, a.action, a.target_type, a.created_at
FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id
ORDER BY a.created_at DESC LIMIT 20;
```

## Backup

```bash
# Manual backup
$SSH "docker exec deploy-db-1 pg_dump -U proxy_reseller proxy_reseller > /opt/backups/backup-$(date +%Y%m%d).sql"

# Restore
$SSH "cat backup.sql | docker exec -i deploy-db-1 psql -U proxy_reseller"
```
