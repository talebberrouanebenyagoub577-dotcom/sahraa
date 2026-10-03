# SAHRAA — Production Deployment Guide

Complete deployment guide for **SAHRAA** on a **Hostinger VPS** running **Ubuntu 24.04**.

Designed for thousands of daily visitors with Docker, Nginx, PostgreSQL, Redis, automatic migrations, SSL, backups, and health monitoring.

---

## Architecture

```
                    Internet
                        │
                   ┌────▼────┐
                   │  Nginx  │  :80 / :443 (SSL, rate limiting, caching)
                   └────┬────┘
                        │
              ┌─────────▼─────────┐
              │   Next.js App     │  :3000 (standalone, cluster-ready)
              └─────────┬─────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐
    │ Postgres│   │   Redis   │  │ Certbot │
    │   :5432 │   │   :6379   │  │  (SSL)  │
    └─────────┘   └───────────┘  └─────────┘

    Background: db-backup (daily) · health-monitor (60s)
```

| Service | Purpose |
|---------|---------|
| `postgres` | Primary database (Prisma ORM) |
| `redis` | Sessions, caching, rate limiting |
| `migrate` | Runs `prisma migrate deploy` on startup |
| `app` | Next.js 15 production server |
| `nginx` | Reverse proxy, SSL termination, gzip, rate limits |
| `certbot` | Let's Encrypt certificate auto-renewal |
| `db-backup` | Daily PostgreSQL dumps to `./backups/` |
| `health-monitor` | Logs app health every 60 seconds |

---

## Prerequisites

- Hostinger VPS with Ubuntu 24.04 (2+ GB RAM recommended)
- Domain pointed to your VPS IP (A record)
- SSH access as root or sudo user
- Ports **80** and **443** open in Hostinger firewall

---

## 1. VPS Preparation

SSH into your VPS:

```bash
ssh root@YOUR_VPS_IP
```

Run the automated setup script (installs Docker, UFW, fail2ban, system tuning):

```bash
# After cloning the repo (step 2), or download script first:
sudo bash scripts/setup-vps.sh
```

**Manual steps** (if not using the script):

```bash
# Update system
apt update && apt upgrade -y

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Create app directory
mkdir -p /opt/sahraa
```

Log out and back in so Docker group membership applies:

```bash
exit
ssh youruser@YOUR_VPS_IP
```

---

## 2. Installing Docker

The `setup-vps.sh` script installs Docker automatically. To verify:

```bash
docker --version
# Docker version 27.x

docker compose version
# Docker Compose version v2.x
```

**Manual Docker install** (Ubuntu 24.04):

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

---

## 3. Installing Docker Compose

Docker Compose V2 is included with the Docker plugin (`docker compose`, not `docker-compose`).

```bash
docker compose version
```

No separate install needed when using the setup script.

---

## 4. Clone & Configure the Application

```bash
cd /opt/sahraa
git clone https://github.com/YOUR_ORG/sahraa.git .
# Or upload via SFTP/scp

cp .env.example .env
nano .env
```

### Required `.env` values

| Variable | Example | Notes |
|----------|---------|-------|
| `POSTGRES_PASSWORD` | `Kx9#mP2vL...` | Strong random password |
| `JWT_SECRET` | `openssl rand -base64 48` | Min 32 characters |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` | Different from JWT_SECRET |
| `NEXT_PUBLIC_APP_URL` | `http://YOUR_VPS_IP` | Use IP first, then domain after SSL |
| `SEED_DATABASE` | `true` | **First deploy only** — creates demo accounts |
| `DOMAIN` | `sahraa.com` | Your production domain |

Generate secrets:

```bash
openssl rand -base64 48   # JWT_SECRET
openssl rand -base64 48   # JWT_REFRESH_SECRET
openssl rand -base64 32   # POSTGRES_PASSWORD
```

Create required directories:

```bash
mkdir -p backups certbot/conf certbot/www logs
```

---

## 5. Configuring Nginx

Nginx runs inside Docker and is pre-configured in `nginx/`.

**First deployment** uses HTTP-only config (`nginx/conf.d/sahraa-http-only.conf`):
- Serves the app on port 80
- Exposes `/.well-known/acme-challenge/` for Let's Encrypt
- Includes security headers, gzip, rate limiting, static asset caching

**After SSL** is enabled, `scripts/setup-ssl.sh` switches to HTTPS config with:
- HTTP → HTTPS redirect
- TLS 1.2/1.3 with strong ciphers
- HSTS header
- API rate limiting (60 req/s burst)

No manual Nginx editing is required for standard deployments.

---

## 6. Deploying the Application

### Single-command deploy

```bash
docker compose up -d
```

This starts all services in order:
1. PostgreSQL + Redis (health checks)
2. `migrate` — runs `prisma migrate deploy` (+ seed if `SEED_DATABASE=true`)
3. `app` — Next.js production server
4. `nginx` — reverse proxy on ports 80/443
5. `certbot`, `db-backup`, `health-monitor`

### First deploy with demo data

```bash
# Set in .env:
SEED_DATABASE=true

docker compose up -d --build
```

After successful deploy, set `SEED_DATABASE=false` in `.env` for subsequent restarts.

### Verify deployment

```bash
docker compose ps
curl http://YOUR_VPS_IP/api/health
curl http://YOUR_VPS_IP/health
```

Expected health response:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "sahraa",
    "checks": { "api": "ok", "database": "ok", "redis": "ok" }
  }
}
```

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sahraa.com | Sahraa@2026 |
| Seller | seller@sahraa.com | Sahraa@2026 |
| Customer | customer@sahraa.com | Sahraa@2026 |

### View logs

```bash
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f migrate
tail -f logs/health.log
```

---

## 7. Connecting the Domain

### DNS configuration (Hostinger panel)

Add these DNS records for your domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_VPS_IP` | 3600 |
| A | `www` | `YOUR_VPS_IP` | 3600 |

Wait for DNS propagation (5–30 minutes). Verify:

```bash
dig +short sahraa.com
dig +short www.sahraa.com
```

Update `.env`:

```env
DOMAIN=sahraa.com
NEXT_PUBLIC_APP_URL=http://sahraa.com
```

Rebuild app with the new URL:

```bash
docker compose up -d --build app
```

Test HTTP access: `http://sahraa.com`

---

## 8. Configuring SSL (Let's Encrypt)

Run **after** the domain resolves to your VPS and HTTP works:

```bash
chmod +x scripts/*.sh
./scripts/setup-ssl.sh sahraa.com admin@sahraa.com
```

This script:
1. Obtains certificates for `sahraa.com` and `www.sahraa.com`
2. Enables HTTPS Nginx config
3. Disables HTTP-only config
4. Reloads Nginx
5. Updates `NEXT_PUBLIC_APP_URL` to `https://sahraa.com`

The `certbot` container auto-renews certificates every 12 hours.

### Manual certificate renewal

```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

### Verify HTTPS

```bash
curl -I https://sahraa.com
```

---

## 9. Database Backup and Restore

### Automatic backups

The `db-backup` service runs daily and stores compressed dumps in `./backups/`:

```
backups/sahraa_20250609_030000.sql.gz
```

Retention is controlled by `BACKUP_RETENTION_DAYS` (default: 14 days).

### Manual backup

```bash
npm run backup
# or
docker compose exec db-backup sh /backup-db.sh
```

### Restore from backup

```bash
./scripts/restore-db.sh backups/sahraa_20250609_030000.sql.gz
```

This stops the app, recreates the database, restores data, and restarts the app.

### Download backups off-server

```bash
scp youruser@YOUR_VPS_IP:/opt/sahraa/backups/sahraa_*.sql.gz ./local-backups/
```

---

## 10. Updating the Application

```bash
cd /opt/sahraa
./scripts/update.sh
```

Or manually:

```bash
git pull
docker compose build app
docker compose run --rm migrate
docker compose up -d --no-deps app
docker image prune -f
```

### Zero-downtime notes

- Nginx keeps serving while the new app container starts
- Migrations run before the app restarts
- Failed health checks leave the old container running until fixed

---

## PM2 Alternative (without Docker)

For running Node.js directly on the VPS (Nginx still recommended as reverse proxy):

```bash
npm ci --legacy-peer-deps
npm run build
npx prisma migrate deploy
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

PM2 runs Next.js in cluster mode (`instances: max`) for multi-core utilization.

---

## Security Hardening

| Layer | Protection |
|-------|------------|
| UFW firewall | Only SSH, 80, 443 open |
| fail2ban | Brute-force SSH protection |
| Nginx | Rate limiting, connection limits, security headers |
| JWT | Short-lived access tokens + refresh tokens |
| Docker | Database/Redis not exposed to host |
| HTTPS | TLS 1.2+, HSTS, auto-renewal |
| Env secrets | Never committed; validated at startup |

### Additional recommendations

```bash
# Disable root SSH login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Monitoring & Troubleshooting

### Health endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Full check (DB + Redis), returns 503 if unhealthy |
| `GET /health` | Nginx liveness (always 200) |

### Common issues

**App won't start — migration failed**
```bash
docker compose logs migrate
docker compose run --rm migrate
```

**502 Bad Gateway**
```bash
docker compose ps app
docker compose logs app --tail 100
# App may still be starting (wait 90s for healthcheck)
```

**SSL certificate failed**
```bash
# Ensure DNS points to VPS and port 80 is open
curl http://sahraa.com/.well-known/acme-challenge/test
docker compose logs certbot
```

**Out of memory**
```bash
free -h
docker stats
# Upgrade VPS to 4GB RAM for high traffic
```

### Resource limits (docker-compose.yml)

| Service | Memory limit |
|---------|-------------|
| postgres | 1 GB |
| redis | 512 MB |
| app | 2 GB |

---

## Quick Reference

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Rebuild and restart app
docker compose up -d --build app

# Run migrations only
docker compose run --rm migrate

# View all service status
docker compose ps

# Follow app logs
docker compose logs -f app

# Enable SSL
./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com

# Backup database
npm run backup

# Update application
./scripts/update.sh
```

---

## File Structure (Deployment)

```
sahraa/
├── docker-compose.yml      # Full production stack
├── Dockerfile              # Multi-stage Next.js build
├── docker/entrypoint.sh    # App container entrypoint
├── nginx/
│   ├── nginx.conf          # Global Nginx config
│   └── conf.d/
│       ├── sahraa-http-only.conf      # Initial HTTP config
│       ├── sahraa-ssl.conf.disabled   # HTTPS template
│       └── proxy_params.conf
├── scripts/
│   ├── setup-vps.sh        # VPS preparation
│   ├── setup-ssl.sh        # Let's Encrypt setup
│   ├── deploy.sh           # Full deploy script
│   ├── update.sh           # Application updates
│   ├── backup-db.sh        # PostgreSQL backup
│   ├── restore-db.sh       # PostgreSQL restore
│   └── health-check.sh     # Health monitor loop
├── ecosystem.config.js     # PM2 cluster config
├── .env.example            # Environment template
├── backups/                # Database dumps
├── certbot/conf/           # SSL certificates
├── certbot/www/            # ACME challenge files
└── logs/                   # Health monitor logs
```

---

**SAHRAA** — Production-ready GCC marketplace. Deploy with `docker compose up -d`.
