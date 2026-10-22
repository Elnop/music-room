# Security Testing Guide (IV.6)

This guide covers how to test the security requirements from the Zumik subject (section IV.6 Securing).

## Table of Contents

1. [Introduction](#introduction)
2. [Testing User Data Isolation](#testing-user-data-isolation)
3. [Testing Brute Force Protection](#testing-brute-force-protection)
4. [Testing Session Security](#testing-session-security)
5. [Testing API Rate Limiting](#testing-api-rate-limiting)
6. [Testing Backend Logging](#testing-backend-logging)
7. [Security Test Automation](#security-test-automation)
8. [Common Security Issues](#common-security-issues)
9. [Tools and Resources](#tools-and-resources)

## Introduction

### Security Requirements Summary

Zumik implements multiple security layers to meet the IV.6 Securing requirements:

- **Data Isolation**: Users can only access their own data
- **Brute Force Protection**: Account lockout after failed login attempts
- **Rate Limiting**: API request throttling to prevent abuse
- **Session Security**: JWT token-based authentication
- **Backend Logging**: All mobile actions logged with platform/device/version

### Testing Environment

Requirements for security testing:

- **Backend running**: `make dev-docker` or `make backend-local`
- **Redis running**: `make redis-start` (required for rate limiting and brute force protection)
- **Test accounts created**: Multiple accounts for isolation testing
- **Tools**: curl, Postman, jq, or automated test scripts

### Subject Requirements (IV.6 Securing)

From `doc/en.subject.pdf`:

1. **Protection des données utilisateurs**: "An authenticated user on your solution must have access to their data, but not to other users' data."

2. **Prévention des comportements malicieux**: "You must plan malicious behaviors (bruteforce of your API, session theft, etc.)"

3. **Mécanismes de protection**: "You must implement mechanisms to protect your users"

4. **Logging backend**: "Any action on the mobile application must generate logs on the back-end."
   - Platform (Android, iOS, etc.)
   - Device (iPhone 6G, iPad Air, Samsung Edge, etc.)
   - Application Version

## Testing User Data Isolation

**Requirement**: "An authenticated user must have access to their data, but not to other users' data."

### Use Case 1: User Cannot Access Other Users' Profiles

**Setup:**

1. Create two test accounts:
   - User A: `alice@test.com` / `Test1234`
   - User B: `bob@test.com` / `Test1234`

**Test Steps:**

```bash
# 1. Login as Alice
ALICE_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"Test1234"}' \
  | jq -r '.data.token')

# 2. Login as Bob to get his user ID
BOB_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@test.com","password":"Test1234"}')
BOB_ID=$(echo $BOB_RESPONSE | jq -r '.data.user.id')

# 3. Try to access Bob's profile using Alice's token (SHOULD FAIL)
curl -X GET http://localhost:3000/api/profile/$BOB_ID \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -v
```

**Expected Result:**

- Status: `403 Forbidden` or `404 Not Found`
- Error message: "You do not have permission to access this resource"

**Actual Implementation:**

- Profile endpoint checks if `req.user.id === userId`
- Returns error if IDs don't match
- File: `backend/src/features/profile/profile.controller.ts`

### Use Case 2: User Cannot Modify Other Users' Playlists

**Test Steps:**

```bash
# 1. Bob creates a private playlist
BOB_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@test.com","password":"Test1234"}' \
  | jq -r '.data.token')

PLAYLIST_ID=$(curl -s -X POST http://localhost:3000/api/playlists \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Private Playlist","visibility":"private"}' \
  | jq -r '.data.id')

# 2. Alice tries to delete Bob's playlist (SHOULD FAIL)
curl -X DELETE http://localhost:3000/api/playlists/$PLAYLIST_ID \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -v

# 3. Alice tries to add tracks to Bob's playlist (SHOULD FAIL)
curl -X POST http://localhost:3000/api/playlists/$PLAYLIST_ID/tracks \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trackUri":"https://soundcloud.com/test/track"}' \
  -v
```

**Expected Result:**

- Status: `403 Forbidden`
- Error: "You do not have permission to modify this playlist"

**Actual Implementation:**

- Playlist services verify ownership via `checkOwnership`
- Edit permissions checked via `checkEditPermission` (owner, collaborators, and anyone who can view in open mode)
- Files:
  - `backend/src/features/playlists/permissions/playlist.permissions.ts` (`checkOwnership`, `checkEditPermission`)
  - `backend/src/features/playlists/services/`: `playlist-update.service.ts`, `collaborator.service.ts`, `viewer.service.ts` and `viewer-list.service.ts` call `checkOwnership`; `playlist-track.service.ts` calls `checkEditPermission`

### Use Case 3: User Cannot See Private Profiles

**Test Steps:**

```bash
# 1. Bob sets his profile to private
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"visibility":"private"}'

# 2. Alice tries to view Bob's profile (SHOULD FAIL or show limited data)
curl -X GET http://localhost:3000/api/profile/$BOB_ID \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Expected Result:**

- Only public information visible
- Private fields (email, phone, etc.) hidden or access denied

**Note**: Profile visibility enforcement depends on implementation in `profile.service.ts`.

## Testing Brute Force Protection

**Requirement**: "You must plan malicious behaviors (bruteforce of your API...)"

### Use Case 1: Account Lockout After Failed Login Attempts

**Configuration (backend/.env):**

```bash
ACCOUNT_LOCKOUT_ENABLED=true
ACCOUNT_LOCKOUT_THRESHOLD=5          # Lock after 5 failed attempts
ACCOUNT_LOCKOUT_DURATION_SOFT=900    # 15 minutes lockout
```

**Test Steps:**

```bash
# 1. Attempt 5 failed logins
for i in {1..5}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"WrongPassword"}' \
    | jq '.error'
  sleep 1
done

# 2. Try 6th attempt (SHOULD BE LOCKED)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"WrongPassword"}' \
  -v
```

**Expected Result:**

- Attempts 1-5: `401 Unauthorized` - "Invalid credentials"
- Attempt 6: `403 Forbidden` - "Account temporarily locked. Try again in 15 minutes."

**Verification in Redis:**

```bash
make redis-shell

# Check failed login counter
127.0.0.1:6379> GET failed_login:test@test.com:127.0.0.1
# Output: "5"

# Check account lock status
127.0.0.1:6379> EXISTS account_locked:test@test.com:127.0.0.1
# Output: 1 (locked)

# Check TTL (time remaining)
127.0.0.1:6379> TTL account_locked:test@test.com:127.0.0.1
# Output: 895 (seconds remaining, ~15 minutes)
```

**Implementation:**

- Service: `backend/src/shared/security/account-lockout.ts`
- Progressive lockout:
  - Soft Lock (5-7 attempts): 15 minutes
  - Hard Lock (8-10 attempts): 1 hour
  - Severe Lock (10+ attempts): 24 hours

### Use Case 2: IP-Based Rate Limiting

**Configuration:**

```bash
RATE_LIMIT_AUTH_MAX=20               # Max 20 auth requests
RATE_LIMIT_AUTH_WINDOW_MS=900000     # 15 minutes window
```

**Test Steps:**

```bash
# Attempt rapid login requests from same IP
for i in {1..25}; do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user'$i'@test.com","password":"wrong"}' \
    -w "\nHTTP Status: %{http_code}\n"
  sleep 0.1
done
```

**Expected Result:**

- First 20 requests: `401 Unauthorized` (rate limit not hit)
- Requests 21+: `429 Too Many Requests` - "Too many auth requests from this IP"

**Verification in Redis:**

```bash
make redis-shell

# Check global auth rate limit counter
127.0.0.1:6379> GET rl:auth:global:127.0.0.1
# Output: "20" (max reached)

# Check TTL
127.0.0.1:6379> TTL rl:auth:global:127.0.0.1
# Output: 850 (seconds remaining)
```

**Implementation:**

- Config: `backend/src/shared/config/rate-limit.config.ts`
- Middleware: `backend/src/shared/security/http-rate-limit.ts`
- Uses `express-rate-limit` with a Redis store on the shared counter (`backend/src/shared/security/rate-limit-store.ts`)

### Use Case 3: IP Blacklist After Persistent Attacks

**Configuration:**

```bash
IP_BLACKLIST_THRESHOLD=50  # Blacklist after 50 failed attempts
```

**Test Steps:**

```bash
# Simulate aggressive attack (50+ failed logins)
for i in {1..55}; do
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"victim@test.com","password":"wrong"}' \
    > /dev/null
done

# Try any auth endpoint (SHOULD BE BLOCKED)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"Test1234","username":"newuser"}' \
  -v
```

**Expected Result:**

- Status: `403 Forbidden`
- Error: "IP address temporarily blocked due to suspicious activity"

**Verification in Redis:**

```bash
make redis-shell

127.0.0.1:6379> EXISTS ip_blacklist:127.0.0.1
# Output: 1 (blacklisted)

127.0.0.1:6379> TTL ip_blacklist:127.0.0.1
# Output: 86390 (24 hours = 86400 seconds)
```

**Implementation:**

- IP reputation tracking in `backend/src/shared/security/ip-reputation.ts`
- Thresholds:
  - 10 failures: Throttle to 2 req/min (1 hour)
  - 20 failures: Block auth endpoints (4 hours)
  - 50+ failures: Complete blacklist (24 hours)

## Testing Session Security

**Requirement**: "You must plan malicious behaviors (...session theft, etc.)"

### Use Case 1: Token Expiration

**Test Steps:**

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}' \
  | jq -r '.data.token')

# 2. Use token immediately (SHOULD WORK)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Wait for token to expire (default: 7 days)
# For testing, configure shorter expiration in backend:
# JWT_EXPIRES_IN=5m

# 4. Use expired token (SHOULD FAIL)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

**Expected Result:**

- Status: `401 Unauthorized`
- Error: "Token has expired"

**Configuration:**

- JWT expiration in `backend/.env`: `JWT_EXPIRES_IN=7d` (default)
- For testing: Set to `JWT_EXPIRES_IN=5m` (5 minutes)

### Use Case 2: Token Tampering Detection

**Test Steps:**

```bash
# 1. Get valid token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}' \
  | jq -r '.data.token')

# 2. Tamper with token (change one character)
TAMPERED_TOKEN="${TOKEN:0:-5}XXXXX"

# 3. Try to use tampered token (SHOULD FAIL)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TAMPERED_TOKEN" \
  -v
```

**Expected Result:**

- Status: `401 Unauthorized`
- Error: "Invalid token signature"

**Implementation:**

- JWT verification in `backend/src/features/auth/auth.middleware.ts`
- Supabase verifies JWT signature using secret key
- Any tampering invalidates signature

### Use Case 3: Stolen Token Protection (Logout)

**Test Steps:**

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}' \
  | jq -r '.data.token')

# 2. Use token (WORKS)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. User logs out
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 4. Try to use same token after logout (behavior depends on implementation)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

**Expected Result (if token blacklisting implemented):**

- Status: `401 Unauthorized`
- Error: "Token has been revoked"

**Note**: Basic JWT implementation doesn't support revocation by default. Token remains valid until expiration. For true revocation, implement:

- Token blacklist in Redis (store revoked token IDs until expiration)
- Check blacklist in `auth.middleware.ts` on each request
- Alternative: Use refresh token rotation

## Testing API Rate Limiting

### Use Case 1: Login Endpoint Rate Limiting

**Configuration:**

```bash
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000  # 15 minutes
```

**Test Steps:**

```bash
# Attempt 6 logins for same email+IP combination
for i in {1..6}; do
  echo "Login attempt $i:"
  curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test1234"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

**Expected Result:**

- Attempts 1-5: `200 OK` or `401 Unauthorized` (depending on password)
- Attempt 6: `429 Too Many Requests`
- Headers:
  ```
  X-RateLimit-Limit: 5
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1704067200
  Retry-After: 900
  ```

**Verification in Redis:**

```bash
make redis-shell

# Check login rate limit key
127.0.0.1:6379> KEYS rl:auth:login:*
127.0.0.1:6379> GET rl:auth:login:test@test.com:127.0.0.1
127.0.0.1:6379> TTL rl:auth:login:test@test.com:127.0.0.1
```

### Use Case 2: Registration Endpoint Rate Limiting

**Configuration:**

```bash
RATE_LIMIT_REGISTER_MAX=3
RATE_LIMIT_REGISTER_WINDOW_MS=3600000  # 1 hour
```

**Test Steps:**

```bash
# Attempt 4 registrations from same IP
for i in {1..4}; do
  echo "Registration attempt $i:"
  curl -s -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@test.com\",\"password\":\"Test1234\",\"username\":\"user$i\"}" \
    -w "\nHTTP Status: %{http_code}\n\n"
done
```

**Expected Result:**

- Attempts 1-3: `201 Created`
- Attempt 4: `429 Too Many Requests` - "Too many registration attempts"

**Rationale**: Prevents mass account creation from single IP.

### Use Case 3: OAuth Endpoint Rate Limiting

**Configuration:**

```bash
RATE_LIMIT_OAUTH_MAX=10
RATE_LIMIT_OAUTH_WINDOW_MS=900000  # 15 minutes
```

**Test Steps:**

```bash
# Attempt 11 Google OAuth requests
for i in {1..11}; do
  echo "OAuth attempt $i:"
  curl -s -X POST http://localhost:3000/api/auth/google \
    -H "Content-Type: application/json" \
    -d '{"idToken":"fake_token_'$i'"}' \
    -w "\nHTTP Status: %{http_code}\n"
done
```

**Expected Result:**

- Attempts 1-10: `401 Unauthorized` (invalid token)
- Attempt 11: `429 Too Many Requests` - "Too many OAuth requests"

**Implementation:**

All rate limits configured in `backend/src/shared/config/rate-limit.config.ts`:

| Endpoint | Limit | Window | Key Pattern |
|----------|-------|--------|-------------|
| Login | 5 attempts | 15 min | `rl:auth:login:{email}:{ip}` |
| Register | 3 registrations | 1 hour | `rl:auth:register:{ip}` |
| OAuth | 10 attempts | 15 min | `rl:auth:oauth:{provider}:{ip}` |
| Global Auth | 20 requests | 15 min | `rl:auth:global:{ip}` |

## Testing Backend Logging

**Requirement**: "Any action on the mobile application must generate logs on the back-end." (Platform, Device, Application Version)

### Use Case 1: Mobile Login Logs Platform/Device/Version

**Test Steps:**

```bash
# Simulate mobile app login with headers
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Zumik/1.0.0 (Android 13; Samsung Galaxy S22)" \
  -H "X-Platform: Android" \
  -H "X-Device-Model: Samsung Galaxy S22" \
  -H "X-App-Version: 1.0.0" \
  -d '{"email":"test@test.com","password":"Test1234"}'
```

**Expected Backend Logs:**

```
[INFO] Auth - Login attempt {
  email: 'test@test.com',
  platform: 'Android',
  device: 'Samsung Galaxy S22',
  appVersion: '1.0.0',
  ip: '127.0.0.1'
}
[INFO] Auth - Login successful {
  userId: 'abc123',
  platform: 'Android',
  device: 'Samsung Galaxy S22',
  appVersion: '1.0.0'
}
```

**Verification:**

```bash
# Check backend logs
make logs-backend | grep "platform"
# or
tail -f backend/logs/app.log | grep "platform"
```

**Implementation:**

- Logger: `backend/src/shared/utils/logger.ts`
- Request metadata extraction in controllers
- Headers expected from mobile app:
  - `X-Platform`: "Android" | "iOS"
  - `X-Device-Model`: Device name (e.g., "iPhone 14 Pro", "Samsung Galaxy S22")
  - `X-App-Version`: App version (e.g., "1.0.0")

### Use Case 2: Playlist Actions Logged

**Test Steps:**

```bash
# 1. Create playlist with mobile headers
TOKEN="your_token_here"

curl -X POST http://localhost:3000/api/playlists \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Platform: iOS" \
  -H "X-Device-Model: iPhone 14 Pro" \
  -H "X-App-Version: 1.0.2" \
  -d '{"name":"Test Playlist","visibility":"public"}'

# 2. Add track to playlist
curl -X POST http://localhost:3000/api/playlists/PLAYLIST_ID/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Platform: iOS" \
  -H "X-Device-Model: iPhone 14 Pro" \
  -H "X-App-Version: 1.0.2" \
  -d '{"trackUri":"https://soundcloud.com/track"}'
```

**Expected Backend Logs:**

```
[INFO] Playlist - Create {
  userId: 'abc123',
  playlistName: 'Test Playlist',
  platform: 'iOS',
  device: 'iPhone 14 Pro',
  appVersion: '1.0.2'
}
[INFO] Playlist - Add track {
  playlistId: 'xyz789',
  trackUri: 'https://soundcloud.com/track',
  platform: 'iOS',
  device: 'iPhone 14 Pro',
  appVersion: '1.0.2'
}
```

**Implementation:**

- All playlist actions logged in the playlist services (`backend/src/features/playlists/services/`)
- Includes user ID, action type, and mobile metadata

### Use Case 3: Security Events Logged

**Test Steps:**

```bash
# Trigger failed login attempts
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Platform: Android" \
    -H "X-Device-Model: Unknown Device" \
    -H "X-App-Version: 1.0.0" \
    -d '{"email":"victim@test.com","password":"wrong"}'
done
```

**Expected Backend Logs:**

```
[WARN] Security - Failed login attempt {
  email: 'victim@test.com',
  ip: '127.0.0.1',
  attempts: 1,
  platform: 'Android',
  device: 'Unknown Device'
}
[WARN] Security - Failed login attempt { attempts: 2 }
...
[WARN] Security - Account locked {
  email: 'victim@test.com',
  ip: '127.0.0.1',
  lockDuration: '900s',
  platform: 'Android'
}
```

**Security Events Logged:**

- Failed login attempts
- Account lockouts (soft/hard/severe)
- Rate limit violations
- IP blacklisting events
- Token verification failures
- Unauthorized access attempts

**Implementation:**

- Security logging in `account-lockout.ts`, `ip-reputation.ts` and `auth.middleware.ts`
- Log levels: WARN (security events), ERROR (critical failures)

## Security Test Automation

### Automated Test Script

Create `tests/security/brute-force.test.sh`:

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="security-test@test.com"
TEST_PASSWORD="Test1234"

echo "=== Zumik Security Test Suite ==="
echo ""
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Test 1: Account Lockout
echo "${YELLOW}Test 1: Account Lockout After 5 Failed Attempts${NC}"
echo "---------------------------------------------------"
for i in {1..6}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword\"}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)

  if [ $i -lt 6 ]; then
    if [ "$HTTP_CODE" = "401" ]; then
      echo -e "${GREEN}✓${NC} Attempt $i: Correctly rejected with 401"
    else
      echo -e "${RED}✗${NC} Attempt $i: Expected 401, got $HTTP_CODE"
    fi
  else
    if [ "$HTTP_CODE" = "403" ]; then
      echo -e "${GREEN}✓${NC} Attempt $i: Account locked with 403"
    else
      echo -e "${RED}✗${NC} Attempt $i: Expected 403 (locked), got $HTTP_CODE"
    fi
  fi
done

echo ""

# Test 2: Rate Limiting
echo "${YELLOW}Test 2: Rate Limiting (21 Auth Requests)${NC}"
echo "---------------------------------------------------"
RATE_LIMITED=false

for i in {1..21}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null -X POST $API_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@test.com\",\"password\":\"wrong\"}")

  if [ "$HTTP_CODE" = "429" ]; then
    RATE_LIMITED=true
    echo -e "${GREEN}✓${NC} Rate limiting triggered at request $i (HTTP 429)"
    break
  fi
done

if [ "$RATE_LIMITED" = false ]; then
  echo -e "${RED}✗${NC} Rate limiting not triggered after 21 requests"
fi

echo ""

# Test 3: Token Tampering
echo "${YELLOW}Test 3: Token Tampering Detection${NC}"
echo "---------------------------------------------------"

# Get valid token
TOKEN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}✗${NC} Failed to get valid token (account may be locked from Test 1)"
else
  # Tamper with token
  TAMPERED_TOKEN="${TOKEN:0:-5}XXXXX"

  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null -X GET $API_URL/api/auth/me \
    -H "Authorization: Bearer $TAMPERED_TOKEN")

  if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓${NC} Tampered token correctly rejected with 401"
  else
    echo -e "${RED}✗${NC} Expected 401, got $HTTP_CODE"
  fi
fi

echo ""
echo "=== Test Suite Complete ==="
```

**Usage:**

```bash
chmod +x tests/security/brute-force.test.sh
./tests/security/brute-force.test.sh
```

**Optional: Run against different environment:**

```bash
API_URL=http://production-server.com ./tests/security/brute-force.test.sh
```

### Postman Collection for Security Tests

Create `tests/security/Security_Tests.postman_collection.json`:

```json
{
  "info": {
    "name": "Zumik - Security Tests (IV.6)",
    "description": "Automated security test cases for IV.6 Securing requirements",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Brute Force Protection",
      "item": [
        {
          "name": "Failed Login Attempt 1",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"}
            ],
            "url": "{{base_url}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@test.com\",\"password\":\"wrong\"}"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Should return 401 Unauthorized\", function () {",
                  "    pm.response.to.have.status(401);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "2. Data Isolation",
      "item": [
        {
          "name": "Login as Alice",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": "{{base_url}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"alice@test.com\",\"password\":\"Test1234\"}"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Login successful\", function () {",
                  "    pm.response.to.have.status(200);",
                  "    var jsonData = pm.response.json();",
                  "    pm.environment.set(\"alice_token\", jsonData.data.token);",
                  "});"
                ]
              }
            }
          ]
        },
        {
          "name": "Try to access Bob's profile",
          "request": {
            "method": "GET",
            "header": [
              {"key": "Authorization", "value": "Bearer {{alice_token}}"}
            ],
            "url": "{{base_url}}/api/profile/{{bob_user_id}}"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Should return 403 Forbidden\", function () {",
                  "    pm.response.to.have.status(403);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "3. Session Security",
      "item": [
        {
          "name": "Use tampered token",
          "request": {
            "method": "GET",
            "header": [
              {"key": "Authorization", "value": "Bearer invalid_token_XXXXX"}
            ],
            "url": "{{base_url}}/api/auth/me"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Should return 401 Unauthorized\", function () {",
                  "    pm.response.to.have.status(401);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    }
  ]
}
```

**Usage:**

1. Import collection into Postman
2. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `bob_user_id`: Bob's user ID from Supabase
3. Run collection using Collection Runner
4. View test results and assertions

## Common Security Issues

### Issue 1: Missing Authorization Checks

**Problem**: Endpoint doesn't verify user ownership before allowing action.

**Example vulnerable code:**

```typescript
// ❌ BAD: No ownership check
async deletePlaylist(req: Request, res: Response) {
  const { playlistId } = req.params;
  await db.delete('playlists').where('id', playlistId);
  return res.json({ message: 'Deleted' });
}
```

**Fixed code:**

```typescript
// ✅ GOOD: Verify ownership
async deletePlaylist(req: Request, res: Response) {
  const { playlistId } = req.params;
  const playlist = await db.select('*').from('playlists').where('id', playlistId).first();

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  if (playlist.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not own this playlist' });
  }

  await db.delete('playlists').where('id', playlistId);
  return res.json({ message: 'Deleted' });
}
```

**Prevention:**

- Always check `req.user.id` matches resource owner
- Use middleware for common authorization patterns
- Example: `checkPlaylistOwnership` in playlist routes

### Issue 2: Weak Rate Limiting

**Problem**: Rate limits too high or no rate limiting on sensitive endpoints.

**Bad Configuration:**

```bash
RATE_LIMIT_LOGIN_MAX=1000  # Too high!
RATE_LIMIT_REGISTER_MAX=100  # Allows mass account creation
```

**Good Configuration:**

```bash
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REGISTER_MAX=3
RATE_LIMIT_AUTH_MAX=20
```

**Solution**: Implement strict rate limits on authentication endpoints (see `backend/src/shared/config/rate-limit.config.ts`).

### Issue 3: No Brute Force Protection

**Problem**: Unlimited login attempts allowed.

**Solution**: Implement account lockout after failed attempts:

- Use Redis to track failed login attempts per email+IP
- Lock account after threshold (5 attempts)
- Progressive lockout durations (15min → 1h → 24h)
- Implementation: `backend/src/shared/security/account-lockout.ts` and `ip-reputation.ts`

### Issue 4: Missing Request Logging

**Problem**: No audit trail for security events.

**Solution**: Log all auth attempts with platform/device/version:

```typescript
logger.info('Login attempt', {
  email: req.body.email,
  ip: req.ip,
  platform: req.headers['x-platform'],
  device: req.headers['x-device-model'],
  appVersion: req.headers['x-app-version']
});
```

Implementation: `backend/src/shared/utils/logger.ts`

### Issue 5: Insecure JWT Configuration

**Problem**: JWT tokens with no expiration or weak secrets.

**Bad Configuration:**

```bash
JWT_SECRET=secret123  # Weak secret!
JWT_EXPIRES_IN=30d    # Too long
```

**Good Configuration:**

```bash
JWT_SECRET=<strong-random-string-64-chars>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**Additional Security:**

- Use refresh token rotation
- Implement token blacklisting for logout
- Store revoked tokens in Redis until expiration

## Tools and Resources

### Testing Tools

**1. curl - Command-line HTTP client**

```bash
# Basic request
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# With verbose output (see headers)
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'

# Save response to variable (with jq)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}' \
  | jq -r '.data.token')
```

**2. jq - JSON processor**

```bash
# Pretty print JSON response
curl -s http://localhost:3000/api/auth/me | jq '.'

# Extract specific field
curl -s http://localhost:3000/api/auth/login -d '...' | jq -r '.data.token'
```

**3. Postman - GUI for API testing**

- Import collection: `tests/security/Security_Tests.postman_collection.json`
- Use Collection Runner for automated test execution
- Environment variables for different environments (local, staging, production)

**4. Apache Benchmark (AB) - Load testing**

```bash
# Test login endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 -p login.json -T application/json \
  http://localhost:3000/api/auth/login

# Create login.json:
# {"email":"test@test.com","password":"Test1234"}
```

**5. OWASP ZAP - Security scanner**

- Download: https://www.zaproxy.org/download/
- Run automated security scan against API
- Detects common vulnerabilities (SQL injection, XSS, etc.)

**6. Siege - Load testing and benchmarking**

```bash
# Stress test with 25 concurrent users for 30 seconds
siege -c25 -t30s http://localhost:3000/api/auth/login
```

### Redis Inspection

Check security-related data in Redis:

```bash
# Open Redis CLI
make redis-shell

# View all rate limit keys
127.0.0.1:6379> KEYS rl:*

# View all account locks
127.0.0.1:6379> KEYS account_locked:*

# View all failed login counters
127.0.0.1:6379> KEYS failed_login:*

# View IP blacklist
127.0.0.1:6379> KEYS ip_blacklist:*

# Check specific counter
127.0.0.1:6379> GET rl:auth:login:test@test.com:127.0.0.1

# Check TTL (time remaining)
127.0.0.1:6379> TTL account_locked:test@test.com:127.0.0.1

# Clear specific key
127.0.0.1:6379> DEL account_locked:test@test.com:127.0.0.1

# Clear all data (DANGER - development only)
127.0.0.1:6379> FLUSHALL
```

### Documentation References

- **[REDIS.md](./REDIS.md)** - Complete Redis configuration, commands, and troubleshooting
- **[SECURITY.md](./SECURITY.md)** - General security guide and best practices
- **[backend/API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md)** - Complete API endpoint reference
- **[doc/en.subject.pdf](./en.subject.pdf)** - Original project requirements (section IV.6)

### Implementation References

Backend files implementing security features:

- **Rate Limiting**:
  - `backend/src/shared/config/rate-limit.config.ts` - Rate limit configuration
  - `backend/src/shared/security/http-rate-limit.ts` - Rate limit middlewares

- **Brute Force Protection**:
  - `backend/src/shared/security/account-lockout.ts` and `ip-reputation.ts` - Account lockout and IP tracking

- **Authentication**:
  - `backend/src/features/auth/auth.middleware.ts` - JWT verification
  - `backend/src/features/auth/services/login.service.ts`, `registration.service.ts` - Login/register logic
  - `backend/src/features/auth/services/session.service.ts` - Session management

- **Authorization**:
  - `backend/src/features/playlists/permissions/playlist.permissions.ts` - Playlist permissions
  - `backend/src/features/profile/profile.controller.ts` - Profile access control

- **Logging**:
  - `backend/src/shared/utils/logger.ts` - Centralized logging utility

- **Redis Configuration**:
  - `backend/src/shared/config/redis.ts` - Redis connection and client

### Subject Requirements

Refer to `doc/en.subject.pdf` section **IV.6 Securing** for full security requirements:

1. User data isolation and protection
2. Malicious behavior prevention (bruteforce, session theft)
3. Protection mechanisms implementation
4. Backend logging with platform/device/version

---

## Quick Reference

### Common Test Commands

```bash
# Test brute force protection (6 failed logins)
for i in {1..6}; do curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  -w "\nStatus: %{http_code}\n"; done

# Test rate limiting (21 requests)
for i in {1..21}; do curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user$i@test.com\",\"password\":\"wrong\"}" \
  -w "%{http_code}\n" -o /dev/null; done

# Check Redis account lock
make redis-shell
> KEYS account_locked:*
> TTL account_locked:test@test.com:127.0.0.1

# Check Redis rate limits
> KEYS rl:*
> GET rl:auth:login:test@test.com:127.0.0.1

# View backend logs
make logs-backend | grep "platform"
```

### Test Checklist

Before marking IV.6 Securing as complete, verify:

- [ ] **Data Isolation**: Users cannot access other users' data (3 use cases tested)
- [ ] **Brute Force Protection**: Account lockout after 5 failed attempts (verified in Redis)
- [ ] **IP Rate Limiting**: 20 auth requests per IP per 15 minutes (tested)
- [ ] **IP Blacklisting**: 50+ failures result in 24h block (tested)
- [ ] **Session Security**: JWT expiration and tampering detection (tested)
- [ ] **API Rate Limiting**: Login (5), Register (3), OAuth (10) limits enforced
- [ ] **Backend Logging**: All mobile actions log platform/device/version (verified in logs)
- [ ] **Redis Integration**: All security features use Redis for state (verified)

### Quick Start

```bash
# 1. Start Redis
make redis-start

# 2. Start backend (local mode)
make backend-local

# 3. Run automated security tests
./tests/security/brute-force.test.sh

# 4. Check results in Redis
make redis-shell
```

---

**Last Updated**: 2025-01-XX (Updated after implementing security features)

**Maintainers**: Zumik Development Team
