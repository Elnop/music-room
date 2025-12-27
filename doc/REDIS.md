# Redis - Cache & Brute Force Protection

## Table of Contents

- [Overview](#overview)
- [Redis Role in Music Room](#redis-role-in-music-room)
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

Music Room uses Redis 7-alpine in a Docker container with automatic health checks and data persistence.

## Redis Role in Music Room

### 1. Rate Limiting

Prevents abuse by limiting the number of requests per time window:

| Endpoint | Limit | Window | Key Pattern |
|----------|-------|--------|-------------|
| Login | 5 attempts | 15 minutes | `rl:auth:login:{email}:{ip}` |
| Register | 3 registrations | 1 hour | `rl:auth:register:{ip}` |
| OAuth | 10 attempts | 15 minutes | `rl:auth:oauth:{provider}:{ip}` |
| Global Auth | 20 requests | 15 minutes | `rl:auth:global:{ip}` |

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
- **Container Name**: `music-room-redis`
- **Port**: 6379 (internal Docker network)
- **Volume**: `redis-data` (persistent storage)
- **Health Check**: `redis-cli PING` every 10 seconds

### Redis Keys Used

#### Rate Limiting Keys
```
rl:auth:login:{email}:{ip}       # Login attempt counter
rl:auth:register:{ip}            # Registration counter
rl:auth:oauth:{provider}:{ip}    # OAuth attempt counter
rl:auth:global:{ip}              # Global auth counter
```

#### Brute Force Protection Keys
```
failed_login:{email}:{ip}        # Failed login counter (TTL: 15min)
account_locked:{email}:{ip}      # Account lockout flag (TTL: dynamic)
ip_failed_logins:{ip}            # IP failure counter (TTL: 15min)
ip_blacklist:{ip}                # IP blacklist flag (TTL: 24h)
```

### Graceful Degradation

If Redis is unavailable:
- **Rate limiting** → Falls back to in-memory storage (express-rate-limit default)
- **Account lockout** → Automatically disabled (warning logged)
- **Backend** → Continues to function normally

Backend logs: `"Redis unavailable, using in-memory store"`

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

# Graceful Degradation
RATE_LIMIT_FALLBACK_MEMORY=true
```

### Adjust Thresholds for Testing

For easier testing in development:
```bash
# backend/.env
RATE_LIMIT_LOGIN_MAX=3              # Instead of 5
ACCOUNT_LOCKOUT_THRESHOLD=3         # Instead of 5
ACCOUNT_LOCKOUT_DURATION_SOFT=60    # 1 min instead of 15
```

⚠️ **Never commit these changes** - Keep production values.

### Temporarily Disable Redis (Development)

```bash
# backend/.env
RATE_LIMIT_ENABLED=false
ACCOUNT_LOCKOUT_ENABLED=false
```

Backend will run without rate limiting (avoid in production).

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

### Security

1. **Set a password:**
   ```yaml
   # docker-compose.yml
   redis:
     command: redis-server --requirepass your_strong_password
   ```

   ```bash
   # backend/.env
   REDIS_PASSWORD=your_strong_password
   ```

2. **Do not expose port publicly:**
   ```yaml
   # docker-compose.yml - REMOVE this line:
   # ports: ["6379:6379"]
   # Redis accessible only via Docker network
   ```

3. **Limit memory usage:**
   ```yaml
   # docker-compose.yml
   redis:
     command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
   ```

### Data Persistence

Redis automatically saves data using AOF (Append Only File):
```yaml
# docker-compose.yml
redis:
  command: redis-server --appendonly yes
  volumes:
    - redis-data:/data
```

### Backup and Restore

**Backup:**
```bash
# Create snapshot
docker exec music-room-redis redis-cli SAVE
# File saved to /data/dump.rdb

# Copy snapshot to host
docker cp music-room-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

**Restore:**
```bash
# Stop Redis
make redis-stop

# Copy backup to container
docker cp redis-backup-20231227.rdb music-room-redis:/data/dump.rdb

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

Access at http://localhost:8001 and connect to `music-room-redis:6379`.

## Resources

- **Official Redis Documentation**: https://redis.io/documentation
- **Redis CLI Commands**: https://redis.io/commands
- **express-rate-limit**: https://github.com/express-rate-limit/express-rate-limit
- **rate-limit-redis**: https://github.com/wyattjoh/rate-limit-redis
- **ioredis (Node.js client)**: https://github.com/redis/ioredis

## See Also

- [DOCKER.md](./DOCKER.md) - Complete Docker guide
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Getting started guide
- [SECURITY.md](./SECURITY.md) - Security guide
- Backend: `backend/src/shared/config/redis.ts` - Redis configuration
- Backend: `backend/src/features/auth/services/brute-force.service.ts` - Protection logic

---

**Redis Quick Reference:**
- 🚀 `make redis-start` to start
- 🔍 `make redis-shell` to inspect
- 📊 `make redis-info` for statistics
- 🗑️ `make redis-flush` to clean data (dev only)
- 🧹 `make redis-clean` to remove container + volume
