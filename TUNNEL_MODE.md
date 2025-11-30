# Tunnel Mode - Cross-Network Development Guide

## Overview

Tunnel mode allows you to develop Music Room when your phone and computer are on **different WiFi networks** (e.g., phone on cellular data, PC on home WiFi, or working from a coffee shop).

## 🎯 Quick Facts

- ✅ **Multiple devices supported**: Scan the same QR code on unlimited phones
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
1. Run `make qr-tunnel` to show QR code
2. Each person scans QR code with Expo Go app
3. All devices connect to same backend automatically

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

1. **Expo Tunnel**: Managed automatically by Expo CLI using ngrok
   - Exposes Metro bundler (port 8081) via public tunnel
   - Requires EAS account (free tier is sufficient)

2. **Backend Tunnel**: Separate ngrok tunnel for API
   - Exposes backend API (port 3000) via public tunnel
   - Automatically configured CORS for tunnel URLs

3. **Shared Volume**: Docker volume for URL communication
   - Backend writes tunnel URL to `/tmp/backend-tunnel-url.txt`
   - Mobile container reads it to configure API endpoint

## Quick Start

### Prerequisites

1. **EAS Account** (free):
   ```bash
   # Sign up at https://expo.dev
   # Then login in your mobile container:
   docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml exec mobile npx eas login
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

# Scan the QR code displayed with Expo Go app
```

### Common Commands

```bash
# Show QR code and tunnel URLs
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

1. **Login to EAS** (one-time setup):
   ```bash
   # Start mobile container
   docker-compose up mobile -d

   # Login to EAS
   docker-compose exec mobile npx eas login

   # Initialize project (updates app.json with project ID)
   docker-compose exec mobile npx eas init

   # Stop container
   make stop
   ```

2. **Start Tunnel Mode**:
   ```bash
   make dev-tunnel
   ```
   This will:
   - Build Docker images with ngrok support
   - Start backend with ngrok tunnel
   - Start Expo with tunnel mode
   - Display QR code and tunnel URLs

3. **Connect Your Phone**:
   - Install [Expo Go](https://expo.dev/go) on your phone
   - Open Expo Go app
   - Tap "Scan QR Code"
   - Scan the QR code from terminal

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
make logs-backend

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
docker-compose exec backend cat /tmp/backend-tunnel-url.txt

# If not found, restart with more time
make stop
make dev-tunnel
# Wait 30 seconds instead of 20
```

#### Expo Tunnel Fails

```bash
# Verify EAS login
docker-compose exec mobile npx eas whoami

# Re-login if needed
docker-compose exec mobile npx eas login

# Check mobile logs
make logs-mobile
```

#### CORS Errors

The backend is configured to auto-allow ngrok domains in development. If you see CORS errors:

```bash
# Check backend logs for CORS messages
make logs-backend | grep CORS

# Verify tunnel URL is in allowed origins
docker-compose exec backend printenv TUNNEL_URL
```

#### App Loads But Can't Connect to Backend

```bash
# Check mobile app is using correct backend URL
make logs-mobile | grep EXPO_PUBLIC_API_URL

# Verify backend tunnel is accessible
curl $(docker-compose exec -T backend cat /tmp/backend-tunnel-url.txt)/health
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

### Docker Compose Override (`docker-compose.tunnel.yml`)

The tunnel mode uses Docker Compose's override feature:

```bash
# Equivalent to:
docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml up
```

**Key Differences:**
- Backend uses `start-with-tunnel.sh` instead of `npm run dev`
- Mobile uses `start-expo-tunnel.sh` instead of `start-expo.sh`
- Shared volume `tunnel-data` for URL communication
- Exposes port 4040 for ngrok web interface

### Environment Variables

**Backend (Auto-set by script):**
- `TUNNEL_URL`: ngrok public URL (e.g., https://abc123.ngrok-free.app)
- `TUNNEL_MODE=true`: Indicates tunnel mode is active

**Mobile (Auto-set by script):**
- `EXPO_PUBLIC_API_URL`: Backend tunnel URL
- `EXPO_PUBLIC_WS_URL`: Backend WebSocket tunnel URL (wss://)
- `TUNNEL_MODE=true`: Indicates tunnel mode is active

## Security Considerations

### Development Only

Tunnel mode is for **development only**. Never use in production:

- ngrok tunnels are publicly accessible
- Free tier has no authentication
- Tunnel URLs can be discovered/brute-forced
- No rate limiting beyond ngrok's limits

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

# 2. Show QR code
make qr-tunnel

# 3. Share with team
# - Share QR code screenshot
# - Share ngrok URL: check `make tunnel-info`
# - Everyone scans with their Expo Go app

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
- **URL changes on restart**: Need to rescan QR after restart
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

For advanced users, modify `backend/start-with-tunnel.sh`:

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
cd mobile && sh start-expo-tunnel.sh
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
- [ ] Mobile logs show Expo tunnel started (`make logs-mobile`)
- [ ] Backend logs show ngrok tunnel started (`make logs-backend`)
- [ ] Expo Go app is updated to latest version

## Getting Help

If tunnel mode isn't working:

1. Check logs: `make logs`
2. Check tunnel info: `make tunnel-info`
3. Visit ngrok interface: http://localhost:4040
4. Review this guide's Troubleshooting section
5. Open issue on GitHub with logs

---

**Happy cross-network developing! 🌐**
