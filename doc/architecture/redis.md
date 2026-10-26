# Redis - Cache & Brute Force Protection

## Table of Contents

- [Overview](#overview)
- [Redis Role in Zumik](#redis-role-in-zumik)
- [Makefile Commands](#makefile-commands)
- [Technical Architecture](#technical-architecture)
- [Daily Usage](#daily-usage)
- [Debugging and Inspection](#debugging-and-inspection)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)
- [Useful Redis CLI Commands](#useful-redis-cli-commands)
- [Redis in Production](#redis-in-production)
- [Resources](#resources)

## Overview

Redis is used as a distributed cache system for:
- **Rate limiting** (request throttling)
- **Brute force protection** (account lockout after failed login attempts)
- **IP reputation tracking** (suspicious IP monitoring and blacklisting)
- **Token revocation** (logout denylist, `features/auth/services/token-revocation.service.ts`)

All the anti-abuse code lives in one backend module, `backend/src/shared/security/`, and reaches Redis through one API, `counter.ts` (see [The anti-abuse module](#the-anti-abuse-module)).

Zumik uses Redis 7-alpine in a Docker container with automatic health checks and data persistence.

## Redis Role in Zumik

### 1. Rate Limiting

Prevents abuse by limiting the number of requests per time window:

| Endpoint | Limit | Window | Key Pattern |
|----------|-------|--------|-------------|
| Login (failed attempts only) | 5 attempts | 15 minutes | `rl:auth:login:login:{email}:{ip}` |
| Register, resend verification | 3 requests | 1 hour | `rl:auth:register:register:{ip}` |
| OAuth | 10 attempts | 15 minutes | `rl:auth:oauth:oauth:{provider}:{ip}` |
| Global Auth (every `/api/auth/*`) | 20 requests | 15 minutes | `rl:auth:global:auth:global:{ip}` |
| SoundCloud, per user | 120 requests | 1 minute | `rl:soundcloud:soundcloud:{userId}` |
| Avatar, per user | 10 changes | 1 hour | `rl:profile:avatar:avatar:{userId}` |
| Plan switch, per user | 20 switches | 1 hour | `rl:subscription:subscription:{userId}` |
| Failed token verifications | 20 failures | 15 minutes | `rl:auth:token:{ip}` |

The key is the limiter's store prefix (`rl:<store>:`) followed by its own key, hence the repeated segment (`login:login`). Past the limit: 429 `RATE_LIMIT_EXCEEDED` with `details.retryAfter`, and the `RateLimit-*` and `Retry-After` headers for the express-rate-limit limiters.

Attempt counters on codes and resends (429 past the limit):

| Action | Limit | Window | Key Pattern |
|--------|-------|--------|-------------|
| Email verification code | `maxAttempts` (mail config) | code lifetime | `email_verify_attempts:{userId}:{ip}` |
| Verification resend cooldown / count | 1 / `maxResends` | cooldown / 1 hour | `email_resend:{userId}:{ip}`, `email_resend_count:{userId}:{ip}` |
| Password reset code | 5 attempts | 15 minutes | `password_reset_attempts:{email}:{ip}` |
| Forgot-password requests / cooldown | 3 / 1 | 1 hour / 60 s | `password_reset_request:{email}:{ip}`, `password_reset_resend:{email}:{ip}` |

### 2. Account Lockout (Brute Force Protection)

Progressive lockout after failed login attempts:

| Tier | Failed Attempts | Lockout Duration |
|------|----------------|------------------|
| Soft Lock | 5-7 attempts | 15 minutes |
| Hard Lock | 8-10 attempts | 1 hour |
| Severe Lock | 10+ attempts | 24 hours |

### 3. IP Reputation System

Tracks suspicious IP addresses and applies progressive restrictions:

| Threshold | Behavior | Duration |
|-----------|----------|----------|
| 10 failures | Throttle to 2 req/min | 1 hour |
| 20 failures | Block auth endpoints | 4 hours |
| 50+ failures | Complete blacklist | 24 hours |

## Makefile Commands

### Core Commands

```bash
# Start Redis (independent Docker container)
make redis-start

# Stop Redis container
make redis-stop

# Restart Redis container
make redis-restart
```

### Monitoring

```bash
# View live Redis logs (Ctrl+C to exit)
make redis-logs

# Check Redis health status (PING test)
make redis-health
# Output: ✓ Redis is healthy (PONG received)

# Quick status check (container + health)
make redis-status
# Output: ✓ Redis: Running and healthy
```

### Management and Debugging

```bash
# Open Redis CLI shell (interactive)
make redis-shell

# Display Redis server information (memory, connections, keys)
make redis-info

# Flush all Redis data (with confirmation prompt)
make redis-flush
# Warning: This deletes ALL data (rate limits, locks, blacklists)

# Show all available Redis commands
make redis-help
```

### Cleanup

```bash
# Remove Redis container and volume (complete cleanup)
make redis-clean
# Warning: This removes container AND persistent data volume
```

## Technical Architecture

### Docker Container

- **Image**: `redis:7-alpine`
- **Container Name**: `zumik-redis`
- **Port**: 6379 (internal Docker network)
- **Volume**: `redis-data` (persistent storage)
- **Health Check**: `redis-cli PING` every 10 seconds

### The anti-abuse module

`backend/src/shared/security/`, one module of functions:

| File | Role |
|------|------|
| `counter.ts` | The only Redis path of the limiters: `hit` (one hit in a fixed window, atomic Lua script: a key without expiry starts a new window), `peek`, `release` (decrement only while the key exists), `clear`, `setFlag` / `readFlag` (locks, blacklist) |
| `http-rate-limit.ts`, `rate-limit-store.ts` | The express-rate-limit middlewares and their store on `counter.ts` |
| `attempt-limit.ts`, `password-reset-limit.ts` | Attempt counters (codes, resends, forgot-password) |
| `account-lockout.ts`, `ip-reputation.ts`, `account-lockout.middleware.ts`, `fail-open.ts` | Account lockout and IP blacklist, and their middlewares (`checkAccountLockout`, `checkIPBlacklist`) |
| `token-verify-limit.ts` | Failed token verifications per IP (HTTP auth and socket handshake) |
| `socket-event-limit.ts` | Per-socket, per-event limit: in memory by design, the counters belong to one connection on one instance (not a fallback) |
| `request-ip.ts` | The client IP the limiters see (`req.ip`, which follows `TRUST_PROXY`) |

The limits come from `backend/src/shared/config/rate-limit.config.ts` (environment variables below). Only the token revocation denylist (`token-revocation.service.ts`) talks to `redisClient` outside this module.

### Redis Keys Used

#### Rate Limiting Keys
```
rl:auth:login:login:{email}:{ip}       # Login attempt counter
rl:auth:register:register:{ip}         # Registration counter
rl:auth:oauth:oauth:{provider}:{ip}    # OAuth attempt counter
rl:auth:global:auth:global:{ip}        # Global auth counter
rl:soundcloud:soundcloud:{userId}      # SoundCloud requests
rl:profile:avatar:avatar:{userId}      # Profile photo changes
rl:subscription:subscription:{userId}  # Plan switches
rl:auth:token:{ip}                     # Failed token verifications
```

#### Brute Force Protection Keys
```
failed_login:{email}:{ip}        # Failed login counter (TTL: 15min)
account_locked:{email}:{ip}      # Account lockout flag (TTL: dynamic)
ip_failed_logins:{ip}            # IP failure counter (TTL: 15min)
ip_blacklist:{ip}                # IP blacklist flag (TTL: 24h)
```

### Architecture Decision: No In-Memory Fallback

**Rate limiting** (`RATE_LIMIT_ENABLED=true`, the default):
- Each express-rate-limit limiter has its own store (`shared/security/rate-limit-store.ts`) on the shared counter; it sends nothing before the first request, so the startup order does not matter
- No command is sent while Redis is not ready
- Redis unavailable → fail closed: the request answers 503 `RATE_LIMIT_UNAVAILABLE`; it is never counted in memory and never let through unlimited
- Redis back → limiting resumes on Redis, without restarting the backend

**Attempt counters** (`attempt-limit.ts`) with Redis unavailable: 503 `REDIS_UNAVAILABLE` (fail closed).

**Token verification limit** (`token-verify-limit.ts`) with Redis unavailable: neither blocks nor counts; authentication itself answers 503 `REVOCATION_UNAVAILABLE`.

**Account lockout and IP blacklist** with Redis unavailable: disabled (logged), fail open (`fail-open.ts`).

**Development mode** (Redis optional for these protections):
- Set `RATE_LIMIT_ENABLED=false` and `ACCOUNT_LOCKOUT_ENABLED=false`
- Rate limiting is skipped entirely (no store used); lockout is bypassed

**Why no fallback?**
In-memory fallback creates security vulnerabilities in multi-instance deployments (load balancers) because each instance has separate state. Redis-only ensures consistent protection across all instances.

Backend logs:
- Disabled mode, at startup: `"Rate limiting disabled (RATE_LIMIT_ENABLED=false)"` (INFO)
- Redis command error during limiting: `"Rate limiting failed: Redis command error"` (ERROR)
- Redis not ready during a request: the 503 `Rate limiting is unavailable` is logged by the error handler (`"Error occurred"`, ERROR)
- Decrement skipped after a response while Redis is down: `"Rate limit decrement skipped: Redis unavailable"` (WARN)

## Daily Usage

### Docker Mode (Recommended)

```bash
# Redis starts automatically with backend + mobile
make dev-docker
```

Redis is included automatically - no manual action required.

### Local Mode

```bash
# 1. Start Redis first
make redis-start

# 2. Start backend locally
make backend-local

# 3. Redis connects automatically
# Backend logs: "Redis connected successfully"
```

### Verify Connection

```bash
# Option 1: Check backend logs
make logs-backend | grep -i redis
# Look for: "Redis connected successfully"

# Option 2: Health check
make redis-health
# Output: ✓ Redis is healthy (PONG received)

# Option 3: Status check
make redis-status
# Output: ✓ Redis: Running and healthy
```

## Debugging and Inspection

### Inspect Rate Limiting Data

```bash
make redis-shell

# List all keys
127.0.0.1:6379> KEYS *

# View rate limiting keys
127.0.0.1:6379> KEYS rl:*

# Check specific counter
127.0.0.1:6379> GET rl:auth:login:test@example.com:127.0.0.1

# Check TTL (time remaining in seconds)
127.0.0.1:6379> TTL rl:auth:login:test@example.com:127.0.0.1
```

### Inspect Account Locks

```bash
make redis-shell

# View all locked accounts
127.0.0.1:6379> KEYS account_locked:*

# Check if account is locked
127.0.0.1:6379> EXISTS account_locked:test@example.com:192.168.1.100
# Returns: 1 = locked, 0 = not locked

# Check lock expiration
127.0.0.1:6379> TTL account_locked:test@example.com:192.168.1.100
# Returns: seconds remaining before unlock
```

### Inspect Blacklisted IPs

```bash
make redis-shell

# List all blacklisted IPs
127.0.0.1:6379> KEYS ip_blacklist:*

# Check specific IP
127.0.0.1:6379> EXISTS ip_blacklist:192.168.1.100
# Returns: 1 = blacklisted, 0 = not blacklisted
```

### Manually Unlock Account (Development Only)

```bash
make redis-shell

# Remove account lock
127.0.0.1:6379> DEL account_locked:user@example.com:192.168.1.100

# Reset failure counter
127.0.0.1:6379> DEL failed_login:user@example.com:192.168.1.100

# Verify deletion
127.0.0.1:6379> KEYS *user@example.com*
# Should return empty or only non-lock keys
```

### Clear All Data (Testing)

```bash
make redis-flush
# Confirmation prompt: Are you sure? This will delete all rate limit data (y/N): y
```

⚠️ **Warning**: This deletes ALL Redis data (rate limits, locks, blacklists).

### View Redis Statistics

```bash
# Full server info
make redis-info

# Memory usage only
make redis-info | grep -A 10 "# Memory"

# Key count
make redis-info | grep "db0"
```

## Advanced Configuration

### Environment Variables (backend/.env)

```bash
# Redis Connection
REDIS_HOST=redis          # "redis" (Docker) or "localhost" (local)
REDIS_PORT=6379
REDIS_PASSWORD=           # Optional (empty by default)
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REGISTER_WINDOW_MS=3600000 # 1 hour
RATE_LIMIT_REGISTER_MAX=3
RATE_LIMIT_OAUTH_WINDOW_MS=900000
RATE_LIMIT_OAUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=20

# Account Lockout
ACCOUNT_LOCKOUT_ENABLED=true
ACCOUNT_LOCKOUT_THRESHOLD=5
ACCOUNT_LOCKOUT_DURATION_SOFT=900     # 15 min (seconds)
ACCOUNT_LOCKOUT_DURATION_HARD=3600    # 1 hour
ACCOUNT_LOCKOUT_DURATION_SEVERE=86400 # 24 hours

# IP Reputation
IP_THROTTLE_THRESHOLD=10
IP_BLOCK_THRESHOLD=20
IP_BLACKLIST_THRESHOLD=50

# Whitelist IPs (comma-separated)
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1
```

**Note**: `RATE_LIMIT_FALLBACK_MEMORY` removed in favor of explicit dev/prod modes. See "Temporarily Disable Redis (Development)" below.

### Adjust Thresholds for Testing

For easier testing in development:
```bash
# backend/.env
RATE_LIMIT_LOGIN_MAX=3              # Instead of 5
ACCOUNT_LOCKOUT_THRESHOLD=3         # Instead of 5
ACCOUNT_LOCKOUT_DURATION_SOFT=60    # 1 min instead of 15
```

⚠️ **Never commit these changes** - Keep production values.

### Development Mode Without Redis

To develop without running Redis:

```bash
# backend/.env
RATE_LIMIT_ENABLED=false
ACCOUNT_LOCKOUT_ENABLED=false
```

This **completely disables** all security protections:
- ✅ No Redis connection required
- ✅ Fast local iteration
- ❌ No rate limiting
- ❌ No brute force protection
- ❌ No IP tracking

**Production**: MUST use `RATE_LIMIT_ENABLED=true` with Redis running.

## Useful Redis CLI Commands

### Basic Commands
```bash
PING                # Test connection (returns PONG)
INFO                # Full server statistics
DBSIZE              # Number of keys in database
KEYS pattern        # List keys (dev only, slow in production)
SCAN 0 MATCH rl:*   # Scan keys (better than KEYS in production)
```

### Key Manipulation
```bash
GET key             # Read value
SET key value       # Write value
DEL key             # Delete key
EXISTS key          # Check if key exists
TTL key             # Time to live (seconds remaining)
EXPIRE key 60       # Set TTL (60 seconds)
PERSIST key         # Remove TTL (key never expires)
```

### Database Management
```bash
FLUSHDB             # Clear current database
FLUSHALL            # Clear all databases
```

### Monitoring
```bash
MONITOR             # Watch all commands in real-time
SLOWLOG GET 10      # Show 10 slowest commands
CLIENT LIST         # List connected clients
```

## Redis in Production

There is no compose file: in development, `start_redis` (`make/helpers/docker.mk`) runs Redis with `docker run`, published on `127.0.0.1` only and without a password (see [containers.md](../security/containers.md)). For a deployed instance, start from the same command:

```bash
docker run -d --name zumik-redis \
  --network zumik-network \
  -v redis-data:/data \
  --restart unless-stopped \
  redis:7-alpine redis-server \
    --appendonly yes \
    --requirepass "$REDIS_PASSWORD" \
    --maxmemory 256mb --maxmemory-policy noeviction
```

### Security

1. **Set a password**: `--requirepass` above, and the same value in `backend/.env`:
   ```bash
   REDIS_PASSWORD=your_strong_password
   ```

2. **Do not publish the port**: leave out `-p` (as above) so Redis is reachable only from containers on `zumik-network`, which reach it as `zumik-redis` (`REDIS_HOST`). If the host itself needs it, publish on loopback only: `-p 127.0.0.1:6379:6379`.

3. **Limit memory usage**: `--maxmemory 256mb`. Use `--maxmemory-policy noeviction`: Redis holds rate-limit counters, account lockouts, the IP blacklist and the token revocation list, all with a TTL, so an LRU policy would evict security state first. With `noeviction` a full Redis refuses writes instead: the rate limiters and logout (revocation) answer 503 (fail closed), while lockouts and the IP blacklist stop counting new failures (`shared/security/fail-open.ts`, an accepted risk in [threat-model.md](../security/threat-model.md)); existing entries stay enforced. Watch memory (`INFO memory`) rather than relying on eviction.

### Data Persistence

Redis saves data with AOF (Append Only File): `--appendonly yes` with the `redis-data` volume mounted at `/data`, as in the command above and in `start_redis`.

### Backup and Restore

**Backup:**
```bash
# Create snapshot
docker exec zumik-redis redis-cli SAVE
# File saved to /data/dump.rdb

# Copy snapshot to host
docker cp zumik-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

**Restore:**
```bash
# Stop Redis
make redis-stop

# Copy backup to container
docker cp redis-backup-20231227.rdb zumik-redis:/data/dump.rdb

# Restart Redis
make redis-start
```

### Production Monitoring

Use RedisInsight (official GUI):
```bash
docker run -d \
  --name redisinsight \
  -p 8001:8001 \
  redislabs/redisinsight:latest
```

Access at http://localhost:8001 and connect to `zumik-redis:6379`.

## Resources

- **Official Redis Documentation**: https://redis.io/documentation
- **Redis CLI Commands**: https://redis.io/commands
- **express-rate-limit**: https://github.com/express-rate-limit/express-rate-limit
- **ioredis (Node.js client)**: https://github.com/redis/ioredis

## See Also

- [containers.md](../security/containers.md) - Containers, including Redis
- [threat-model.md](../security/threat-model.md) - What the anti-abuse counters protect against
- Backend: `backend/src/shared/config/redis.ts` - Redis configuration
- Backend: `backend/src/shared/security/` - Anti-abuse module (rate limiting, lockout, IP reputation)

---

**Redis Quick Reference:**
- 🚀 `make redis-start` to start
- 🔍 `make redis-shell` to inspect
- 📊 `make redis-info` for statistics
- 🗑️ `make redis-flush` to clean data (dev only)
- 🧹 `make redis-clean` to remove container + volume
