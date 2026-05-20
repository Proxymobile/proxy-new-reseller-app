# HERMES-AGENT.md

> Integration plan for Nous Research Hermes Agent as root-level agentic controller.

## What is Hermes Agent

Self-improving AI agent by Nous Research with:
- 40+ built-in tools (file, shell, code execution)
- Skill creation from experience (procedural memory)
- Cross-session memory and user modeling
- MCP server support for extending capabilities
- 7 terminal backends (local, Docker, SSH, etc.)
- Multi-provider LLM support (OpenAI, Anthropic, Nous, OpenRouter, etc.)
- Gateway: Telegram, Discord, Slack, WhatsApp, Signal, Email
- Cron scheduler for autonomous tasks

## Integration Architecture

```
┌─────────────────────────────────────────────┐
│         Hetzner VPS (72.62.117.94)          │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  Hermes Agent (root-level)          │    │
│  │  - Full file system access          │    │
│  │  - Docker management                │    │
│  │  - Database access (read/write)     │    │
│  │  - Git operations                   │    │
│  │  - Cron scheduling                  │    │
│  │  - Monitoring & alerting            │    │
│  │                                     │    │
│  │  Guardrails:                        │    │
│  │  - Command allowlist                │    │
│  │  - No secrets in conversation       │    │
│  │  - Audit log all actions            │    │
│  │  - Approval required for:           │    │
│  │    * docker compose down            │    │
│  │    * rm -rf                         │    │
│  │    * .env modifications             │    │
│  │    * schema migrations              │    │
│  └──────────┬──────────────────────────┘    │
│             │ manages                        │
│  ┌──────────▼──────────────────────────┐    │
│  │  Docker Stack                       │    │
│  │  - deploy-app-1 (Next.js)           │    │
│  │  - deploy-db-1 (PostgreSQL)         │    │
│  │  - deploy-caddy-1 (reverse proxy)   │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Installation Plan

```bash
# On the Hetzner VPS
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.bashrc

# Configure
hermes setup          # Full wizard
hermes model          # Set LLM provider
hermes tools          # Enable file, shell, docker tools
```

## Guardrailed Freedom Model

### Always Allowed (no approval)
- Read any file in /opt/proxy-reseller/
- View Docker logs, status, stats
- Query database (SELECT only)
- Git status, log, diff
- Monitor resource usage (disk, RAM, CPU)
- Run build commands
- Read environment variables (masked secrets)

### Approval Required (command allowlist)
- Write/modify source files
- Docker compose operations (up, down, restart, build)
- Database mutations (INSERT, UPDATE, DELETE)
- .env file changes
- Git push, commit
- Package install/update
- Cron job creation
- Network configuration

### Never Allowed (hard blocklist)
- Delete .env or database volumes
- docker compose down without --confirm flag
- rm -rf /opt/proxy-reseller
- Expose psx_ API key in conversation
- Modify SSH authorized_keys
- Change firewall rules without approval

## Hermes Workspace Config

Create `/opt/proxy-reseller/.hermes/workspace.md`:
```markdown
# Proxy Reseller App Workspace

You manage a proxy reseller application on this server.

## Key paths
- App source: /opt/proxy-reseller/src/
- Database schema: /opt/proxy-reseller/db/schema.sql
- Docker compose: /opt/proxy-reseller/deploy/docker-compose.prod.yml
- Docs: /opt/proxy-reseller/docs/
- Env: /opt/proxy-reseller/.env (NEVER display contents)

## Stack
Next.js 15, PostgreSQL 17, Caddy, Docker

## Rules
1. Always read docs/INDEX.md first for context
2. After code changes: build → test → deploy
3. Log all actions to audit_log table
4. Never expose API keys or database passwords
5. Ask before destructive operations
```

## MCP Integration (Future)

Hermes supports MCP servers. We can expose app-specific tools:
- `proxy_reseller.list_customers` — safe read-only customer list
- `proxy_reseller.check_health` — app + db + caddy status
- `proxy_reseller.deploy` — build and restart app container
- `proxy_reseller.audit_tail` — recent audit log entries

## Messaging Gateway

Connect to Telegram/Discord for remote management:
```bash
hermes gateway setup    # Configure bot tokens
hermes gateway start    # Run as background service
```

This allows managing the server from mobile — check status, trigger deploys, view logs.

## Cron Tasks

```bash
# Health check every 5 minutes
hermes cron add "Check app health: curl localhost:3000 and report if down" --every 5m

# Daily backup
hermes cron add "Run pg_dump and save to /opt/backups/" --daily 03:00

# Weekly security scan
hermes cron add "Check for outdated packages and report" --weekly monday 09:00
```

## Implementation Phases

### Phase 1: Install + Read-Only (Now)
- Install Hermes on VPS
- Configure workspace instructions
- Enable read-only tools (file read, docker logs, db SELECT)
- Connect messaging gateway

### Phase 2: Managed Operations
- Enable write tools with approval
- Set up cron health checks
- Deploy automation via Hermes
- Database backup cron

### Phase 3: Full Agentic Control
- MCP server for app-specific tools
- Self-healing: auto-restart on failure
- Auto-scaling: monitor traffic, suggest upgrades
- Skill creation: learn deployment patterns
- Autonomous code fixes for common errors
