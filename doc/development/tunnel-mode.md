# Tunnel Mode - Cross-Network Development Guide

## Overview

Tunnel mode allows you to develop Zumik when your phone and computer are on **different WiFi networks** (e.g., phone on cellular data, PC on home WiFi, or working from a coffee shop).

## 🎯 Quick Facts

- ✅ **Multiple devices supported**: every phone with the debug build enters the same Metro tunnel host
- ✅ **One-command setup**: `make tunnel-setup` (automatic EAS login)
- ✅ **Works across networks**: Phone on cellular, PC on WiFi
- ⚠️ **Slower than LAN**: Adds 50-200ms latency

## Quick Start (Simplified)

### First Time Setup
```bash
# One-time automatic setup (uses credentials from mobile/.env)
make tunnel-setup

# Start tunnel mode
make dev-tunnel
```

### Connect Multiple Devices
The app runs only as the Zumik Dev debug build (`com.zumik.app.dev`); it does not start in Expo Go, which lacks its native modules.

1. Install the debug build once on each phone: `cd mobile && npx expo run:android --app-id com.zumik.app.dev --device --no-bundler` (phone over USB)
2. Run `make qr-tunnel` to show the Metro tunnel host (`xxxx-8081.exp.direct`)
3. On each phone: shake it, dev menu › **Change Bundle Location** › `<tunnel host>:80`, then **RELOAD**
4. All devices connect to same backend automatically

## When to Use Tunnel Mode

**Use Tunnel Mode When:**
- Your phone is on cellular data and PC is on WiFi
- You're on different WiFi networks (e.g., guest WiFi vs secured WiFi)
- Working remotely and need to test on a physical device
- Corporate/firewall restrictions prevent local network connections
- Testing from different physical locations
- **Testing with multiple devices simultaneously**

**Use LAN Mode When:**
- Phone and PC are on the same WiFi network
- You want faster development (lower latency)
- Local-only testing is sufficient

## How It Works

### LAN Mode (Normal)
```
┌─────────┐                    ┌──────────┐
│ Phone   │ ←──── WiFi ────→  │ Computer │
│ (WiFi A)│                    │ (WiFi A) │
└─────────┘                    └──────────┘
                                    │
                         ┌──────────┴──────────┐
                         │   Backend:3000      │
                         │   Expo:8081         │
                         └─────────────────────┘

Fast, low latency (<10ms), same network required
```

### Tunnel Mode (Cross-Network)
```
┌─────────┐                    ┌───────────────┐
│ Phone   │ ←── Internet ───→  │ ngrok Tunnels │
│(Cellular│                    │               │
│  Data)  │                    └───────┬───────┘
└─────────┘                            │
                                       ↓
                            ┌──────────────────┐
                            │ Computer (Docker)│
                            ├──────────────────┤
                            │ Backend ngrok    │
                            │ Expo tunnel      │
                            └──────────────────┘

Slower (+50-200ms latency), works across any network
```

### Architecture Components

1. **Expo Tunnel**: Managed automatically by Expo CLI using ngrok (`mobile/scripts/start-expo-tunnel.sh`, `npx expo start --host tunnel`)
   - Exposes Metro bundler (port 8081) via public tunnel
   - Requires EAS account (free tier is sufficient)

2. **Backend Tunnel**: Separate ngrok tunnel for API
   - Exposes backend API (port 3000) via public tunnel
   - Automatically configured CORS for tunnel URLs

3. **Supabase stays behind the backend** (#376)
   - The app talks only to the backend: login, OAuth, register, password reset, token refresh and logout all go through `/api/auth/*`
   - Only the backend tunnel is needed; the local Supabase stack (`SUPABASE_MODE=local`, the default) is reached by the backend alone, never by the phone

4. **Shared Volume**: Docker volume for URL communication
   - Backend writes the tunnel URL to `/tmp/shared/backend-tunnel-url.txt` (Docker volume `tunnel-info`, mounted at `/tmp/shared` in both containers)
   - `make dev-tunnel-build-apk` reads it to point the APK at the backend tunnel

## Quick Start

### Prerequisites

1. **EAS Account** (free):
   ```bash
   # Sign up at https://expo.dev, then either let make log in with EXPO_TOKEN:
   make tunnel-setup
   # or log in by hand in the running mobile container:
   docker exec -it zumik-mobile npx eas login
   ```

2. **Verify Prerequisites**:
   ```bash
   # Check that you have ngrok installed in containers
   make build
   ```

### Starting Tunnel Mode

```bash
# Start tunnel mode (builds and starts both tunnels)
make dev-tunnel

# Wait ~20 seconds for tunnels to initialize

# On the phone (debug build installed): dev menu › Change Bundle Location
# › the Metro tunnel host shown, followed by :80
```

### Common Commands

```bash
# Show the tunnel URLs and the Metro tunnel host
make qr-tunnel

# Display detailed tunnel info
make tunnel-info

# View logs
make logs

# Stop tunnel mode
make stop

# Switch back to LAN mode
make dev
```

## Detailed Usage

### Step-by-Step First Use

1. **Create EXPO_TOKEN** (one-time setup):
   - Go to https://expo.dev/settings/access-tokens
   - Log in with your Expo account
   - Click "Create Token"
   - Give it a name (e.g., "zumik-dev")
   - Copy the token (starts with `expo_`)
   - **Important**: Save it securely, it won't be shown again!

2. **Add Token to mobile/.env**:
   ```bash
   # Edit mobile/.env and add:
   EXPO_TOKEN=expo_your_copied_token_here
   ```

3. **Run Setup**:
   ```bash
   make tunnel-setup
   ```
   This will:
   - Verify your EXPO_TOKEN
   - Initialize the EAS project
   - No interactive prompts needed!

4. **Start Tunnel Mode**:
   ```bash
   make dev-tunnel
   ```
   This will:
   - Build Docker images with ngrok support
   - Start backend with ngrok tunnel
   - Start Expo with tunnel mode
   - Display the tunnel URLs and the Metro tunnel host

3. **Connect Your Phone** (Zumik debug build, not Expo Go: the app needs its native modules):
   - Install the debug build once: plug the phone over USB, `cd mobile && npx expo run:android --app-id com.zumik.app.dev --device --no-bundler`
   - Open Zumik, shake the phone to open the dev menu
   - Tap **Change Bundle Location**, enter the Metro tunnel host from `make qr-tunnel` followed by `:80` (e.g. `xxxx-8081.exp.direct:80`)
   - Tap **RELOAD**; "Unable to load script" means the host is wrong or the tunnel is not ready yet

4. **Verify Connection**:
   - App should load on your phone
   - Try login/register to test backend API calls
   - Check ngrok web interface: http://localhost:4040

### Monitoring Tunnel Traffic

Access ngrok web interface at **http://localhost:4040**:

- **Requests Tab**: See all HTTP requests to your backend
- **Replay**: Replay previous requests for debugging
- **Status**: Tunnel connection status and uptime
- **Inspect**: View request/response headers and bodies

### Troubleshooting

#### Tunnel Not Starting

```bash
# Check backend logs for ngrok errors
docker logs zumik-backend

# Look for ngrok initialization messages
# Should see: "Backend Tunnel: https://xxxxx.ngrok-free.app"
```

**Common Issues:**
- **ngrok account limit**: Free tier allows 1 active tunnel. Close other ngrok instances.
- **Internet connection**: Tunnel requires stable internet connection.
- **Firewall**: Some corporate firewalls block ngrok. Try different network.

#### Backend Tunnel URL Not Found

```bash
# Check if tunnel URL file exists
docker exec zumik-backend cat /tmp/shared/backend-tunnel-url.txt

# If not found, restart with more time
make stop
make dev-tunnel
# Wait 30 seconds instead of 20
```

#### Expo Tunnel Fails

```bash
# Verify EAS login
docker exec -it zumik-mobile npx eas whoami

# Re-login if needed
docker exec -it zumik-mobile npx eas login

# Check mobile logs
make logs-mobile
```

#### CORS Errors

The backend allows https ngrok subdomains in development, and the exact tunnel URL through `TUNNEL_URL` (see `backend/src/shared/config/cors.config.ts`). If you see CORS errors:

```bash
# Check backend logs for CORS messages
docker logs zumik-backend 2>&1 | grep CORS

# Verify the tunnel URL was added to the allowed origins
# (TUNNEL_URL is exported by scripts/start-with-tunnel.sh, not set on the container)
docker logs zumik-backend 2>&1 | grep "Tunnel CORS enabled"
```

#### App Loads But Can't Connect to Backend

```bash
# Check which backend URL Expo was started with: start-expo-tunnel.sh exports
# it to Expo and writes the same value to mobile/.env.development.local
# (docker exec printenv shows the container's environment, not the script's)
docker exec zumik-mobile cat .env.development.local

# Verify backend tunnel is accessible
curl "$(docker exec zumik-backend cat /tmp/shared/backend-tunnel-url.txt)/health"
```

#### App Can't Sign In (SUPABASE_MODE=local)

Sign-in goes through the backend, which needs the local stack running:

```bash
# The stack must be up (make supabase-up starts it)
make supabase-status

# Backend logs show the auth request and its error
docker logs zumik-backend 2>&1 | grep /api/auth
```

## Performance Considerations

### Latency Comparison

| Mode | Average Latency | Hot Reload Speed | Use Case |
|------|----------------|------------------|----------|
| LAN | 5-20ms | Very Fast | Same network |
| Tunnel | 50-200ms | Slower | Different networks |

### Optimizations

1. **Minimize Hot Reloads**: Save less frequently during active development
2. **Use LAN When Possible**: Switch to LAN mode when on same network
3. **Cache Aggressively**: Enable caching in Metro bundler
4. **ngrok Region**: Configure ngrok to use closest region (paid feature)

### ngrok Free Tier Limits

- **40 connections/minute**: Should be sufficient for development
- **URL changes on restart**: Tunnel URL is different each restart
- **No custom domains**: Use randomly generated URLs
- **1 active tunnel**: Free tier allows 1 ngrok tunnel (we use 2, so backend uses same ngrok instance)

## Configuration Details

### EAS Configuration (`mobile/eas.json`)

```json
{
  "cli": {
    "version": ">= 13.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  }
}
```

### How `make dev-tunnel` starts the containers

There is no compose file: `make dev-tunnel` calls `docker_up_tunnel` in `make/helpers/docker.mk`, which runs plain `docker run` commands on the `zumik-network` network (details in [containers.md](../security/containers.md)):

- In `SUPABASE_MODE=local` (default), `make supabase-up` runs first: the tunnel backend reads `backend/.env.supabase.local`; the mobile container gets no Supabase value.
- `zumik-redis`: same as LAN mode (`start_redis`).
- `zumik-backend` (`start_backend_tunnel`): runs `sh scripts/start-with-tunnel.sh` instead of `npm run dev`, publishes port 3000 and 4040 (ngrok web interface), and mounts the `tunnel-info` volume at `/tmp/shared`. In `SUPABASE_MODE=local` it gets the same dev-stack variables as `make dev-docker` (`--env-file backend/.env.supabase.local`, `SUPABASE_URL` and `SMTP_HOST` on `host.docker.internal`).
- `zumik-mobile` (`start_mobile_tunnel`, recreated on every `make dev-tunnel`): runs `sh scripts/start-expo-tunnel.sh`, which waits until the backend tunnel URL in `/tmp/shared` answers `/health` (the backend script deletes the previous run's file first), writes it to `mobile/.env.development.local` (`EXPO_PUBLIC_API_URL`, and `wss://` for `EXPO_PUBLIC_WS_URL`), then starts `npx expo start --host tunnel`. Unlike LAN mode it sets neither `REACT_NATIVE_PACKAGER_HOSTNAME` nor `EXPO_DEVTOOLS_LISTEN_ADDRESS`, which would replace the tunnel URL in the manifest.

Each container carries a `zumik.mode` label (`lan` or `tunnel`): `make dev-tunnel` recreates a backend or mobile container left running by `make dev-docker`, and the other way round. A tunnel backend started in the other Supabase mode (label `zumik.supabase`) is recreated too.

### Environment Variables

**Backend (Auto-set by script):**
- `TUNNEL_URL`: ngrok public URL (e.g., https://abc123.ngrok-free.app)

**Mobile (Auto-set by script):**
- `EXPO_PUBLIC_API_URL`: Backend tunnel URL
- `EXPO_PUBLIC_WS_URL`: Backend WebSocket tunnel URL (wss://)

## Security Considerations

### Development Only

Tunnel mode is for **development only**. Never use in production:

- ngrok tunnels are publicly accessible
- Free tier has no authentication
- Tunnel URLs can be discovered/brute-forced
- No rate limiting beyond ngrok's limits
- Only the backend is exposed: the local Supabase stack is never forwarded through the tunnel

### Best Practices

1. **Never commit secrets**: Don't include Supabase keys in tunnel-exposed code
2. **Use .env files**: Keep sensitive data in .env (gitignored)
3. **Close tunnels when done**: Run `make stop` when finished developing
4. **Monitor ngrok interface**: Watch for unexpected requests at localhost:4040
5. **Update dependencies**: Keep ngrok and Expo CLI updated

### CORS Configuration

The backend auto-allows ngrok domains **only in development**:

```typescript
// backend/src/server.ts
if (env.NODE_ENV === 'development' && origin.includes('ngrok')) {
  return callback(null, true)
}
```

**Production**: This is disabled. Use strict CORS allowlist.

## Advanced Usage

### Testing with Multiple Devices 📱📱📱

Tunnel mode supports **unlimited simultaneous connections**:

#### How It Works

```
┌─────────┐                    ┌───────────────┐
│ Phone 1 │ ←── Internet ───→  │               │
│(Cellular│                    │ ngrok Tunnel  │
└─────────┘                    │               │
                               │  (Public URL) │
┌─────────┐                    │               │
│ Phone 2 │ ←── Internet ───→  │               │
│ (WiFi A)│                    └───────┬───────┘
└─────────┘                            │
                                       ↓
┌─────────┐                  ┌──────────────────┐
│ Phone 3 │ ←── Internet ──→ │ Your Computer    │
│ (WiFi B)│                  │ (Any Network)    │
└─────────┘                  └──────────────────┘
```

#### Steps

```bash
# 1. Start tunnel mode (if not running)
make dev-tunnel

# 2. Show the Metro tunnel host
make qr-tunnel

# 3. Share with team
# - Share the Metro tunnel host (xxxx-8081.exp.direct)
# - Share ngrok URL: check `make tunnel-info`
# - Everyone enters it in the debug build: dev menu › Change Bundle Location › <host>:80

# 4. All devices connect to same backend
# No additional configuration needed!
```

#### Use Cases

- **Team Testing**: Share development build with teammates
- **Cross-Platform Testing**: Test on iOS + Android simultaneously
- **Remote Demo**: Show app to remote stakeholders
- **QA Testing**: Multiple testers on different devices/networks

#### Limitations (ngrok free tier)

- **40 connections/minute**: Sufficient for small teams
- **URL changes on restart**: Enter the new Metro tunnel host after a restart
- **Shared tunnel**: All devices see same backend state

#### Security Note

⚠️ Tunnel URLs are public. Don't share with untrusted users.

### Continuous Integration

Tunnel mode can be used in CI for E2E testing:

```yaml
# .github/workflows/e2e-test.yml
- name: Start tunnel mode
  run: make dev-tunnel

- name: Run E2E tests
  run: npm run test:e2e
  env:
    API_URL: ${{ steps.get-tunnel.outputs.url }}
```

### Custom ngrok Configuration

For advanced users, modify `backend/scripts/start-with-tunnel.sh`:

```bash
# Add custom ngrok flags
npx ngrok http 3000 \
  --log stdout \
  --log-level debug \
  --region us \  # Set region (requires paid plan)
  --subdomain myapp  # Custom subdomain (requires paid plan)
```

## Comparison: LAN vs Tunnel Mode

| Feature | LAN Mode | Tunnel Mode |
|---------|----------|-------------|
| **Network Requirement** | Same WiFi | Any network |
| **Setup Complexity** | Simple | Moderate |
| **Latency** | 5-20ms | 50-200ms |
| **Hot Reload Speed** | Very Fast | Slower |
| **EAS Account** | Not required | Required (free) |
| **Internet Dependency** | No | Yes |
| **Public Accessibility** | No | Yes (security risk) |
| **Multi-Device Testing** | Same network only | Any network |
| **Corporate Firewalls** | May block | Often works |
| **Cost** | Free | Free (with limits) |

## FAQ

### Q: Do I need a paid EAS account?

No, the free tier is sufficient for tunnel mode development.

### Q: Can I use tunnel mode for production?

No, tunnel mode is for development only. Use proper deployment (Railway, Render, AWS, etc.) for production.

### Q: Why is hot reload so slow in tunnel mode?

Each reload requires an internet round-trip through ngrok's servers. Use LAN mode when possible for faster reloads.

### Q: Can I use a custom domain instead of ngrok URLs?

Yes, but requires ngrok paid plan ($10-20/month) for custom subdomains.

### Q: What happens if I restart the backend?

The tunnel URL changes. Mobile app will need to restart to pick up new URL.

### Q: Can I run tunnel mode without Docker?

Yes, but you'll need to manually run the scripts:
```bash
# Backend
cd backend && npm run dev:tunnel

# Mobile (in separate terminal)
cd mobile && sh scripts/start-expo-tunnel.sh
```

### Q: How do I switch back to LAN mode?

```bash
make stop
make dev
```

## Resources

- [Expo Tunnel Documentation](https://docs.expo.dev/more/expo-cli/)
- [ngrok Documentation](https://ngrok.com/docs)
- [EAS Documentation](https://docs.expo.dev/eas/)
- [ngrok Package for Expo](https://www.npmjs.com/package/@expo/ngrok)

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] EAS account created and logged in (`npx eas whoami`)
- [ ] Internet connection is stable
- [ ] Firewall/VPN not blocking ngrok
- [ ] Backend tunnel URL exists (`make tunnel-info`)
- [ ] ngrok web interface accessible (http://localhost:4040)
- [ ] Backend logs show ngrok tunnel started (`docker logs zumik-backend`)
- [ ] The Zumik debug build is installed (not Expo Go) and its bundle location is the current tunnel host

## Advanced Troubleshooting

### Issue: `EXPO_TOKEN is invalid or expired`

**Problem**: EAS authentication failing during setup.

**Solution**: The script verification was looking for "@" in the output, but Expo returns a different format.

```bash
# Fixed in mobile/scripts/setup-eas-auto.sh:
# Changed from: grep -q "@"
# Changed to: grep -q "authenticated using EXPO_TOKEN"
```

**Resolution**:
1. Get a new token: https://expo.dev/settings/access-tokens
2. Update `mobile/.env`: `EXPO_TOKEN=your_token_here`
3. Run: `make tunnel-setup`

### Issue: `@expo/ngrok` installation prompt in non-interactive mode

**Problem**: Expo asks to install `@expo/ngrok` but Docker container is non-interactive, causing it to hang or crash.

**Solution**: Install `@expo/ngrok` as a local dependency instead of relying on global installation.

```bash
# Already fixed in mobile/package.json:
"devDependencies": {
  "@expo/ngrok": "^4.1.3",
  ...
}
```

**If you see this error**: Rebuild the mobile image and recreate the container:
```bash
docker rm -fv zumik-mobile
docker build --no-cache -t music-room-mobile:latest -f mobile/Dockerfile mobile
make dev-tunnel
```

### Issue: `EACCES: permission denied, open '/app/.expo/README.md'`

**Problem**: The `.expo` directory has incorrect permissions (owned by root instead of the `node` user, UID 1000 in `node:22-bookworm-slim`).

**Solution**: Create `.expo` directory with correct permissions in Dockerfile.

```bash
# Already fixed in mobile/Dockerfile:
USER root
RUN mkdir -p /app/.expo && chown -R node:node /app/.expo && chmod -R 755 /app/.expo
USER node
```

**If you still see this error**:
```bash
# Manually fix permissions:
docker run --rm -v "$(pwd)/mobile/.expo:/data" alpine chown -R 1000:1000 /data

# Then restart:
docker restart zumik-mobile
```

### Issue: `NGROK_AUTHTOKEN not set`

**Problem**: Backend tunnel fails because ngrok requires authentication.

**Solution**:
1. Sign up for ngrok: https://dashboard.ngrok.com/signup
2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Add to `backend/.env`:
   ```bash
   NGROK_AUTHTOKEN=your_authtoken_here
   ```
4. Restart: `make containers-restart`

### Issue: Expo starts in LAN mode instead of tunnel mode

**Problem**: `REACT_NATIVE_PACKAGER_HOSTNAME` or `EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0` make Expo advertise the LAN address even with `--host tunnel`.

**Solution**: `start_mobile_tunnel` sets neither (#225). If `docker logs zumik-mobile` still shows a LAN address instead of an `exp.direct` host, the mobile container was started in LAN mode: check `docker inspect -f '{{index .Config.Labels "zumik.mode"}}' zumik-mobile`, then `make dev-tunnel` recreates it.

### Issue: Docker volumes override package installations

**Problem**: The anonymous volume `/app/node_modules` was created before adding `@expo/ngrok`, so the package isn't available.

**Solution**: Remove the containers with their anonymous volumes (`-v`) and start again:
```bash
docker rm -fv zumik-backend zumik-mobile
make dev-tunnel
```

### Issue: Mobile `.env` not loaded in container

**Problem**: `EXPO_TOKEN` not available even though it's in `mobile/.env`.

**Solution**: already handled: `start_mobile` passes `--env-file mobile/.env` to `docker run`. If the variable is still missing, the container predates the change to `mobile/.env`: recreate it with `docker rm -f zumik-mobile && make dev-tunnel`.

## Getting Help

If tunnel mode isn't working:

1. Check logs: `make logs`
2. Check tunnel info: `make tunnel-info`
3. Visit ngrok interface: http://localhost:4040
4. Review this guide's Troubleshooting section above
5. Check Docker volumes: `docker volume ls`
6. Recreate containers: `docker rm -fv zumik-backend zumik-mobile && make dev-tunnel`
7. Open issue on GitHub with logs

---

**Happy cross-network developing! 🌐**
