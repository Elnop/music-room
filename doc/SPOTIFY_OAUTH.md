# Spotify OAuth Integration - Implementation Guide

## Overview

Music Room uses **backend-handled OAuth with deep linking** for Spotify integration. The backend manages the OAuth flow and stores tokens, while the mobile app uses `expo-web-browser` and deep linking for a seamless user experience.

## Why Backend-Handled OAuth?

✅ **Security**: `SPOTIFY_CLIENT_SECRET` stays on the server, never exposed to mobile app
✅ **Token Storage**: Tokens stored securely in Supabase database (`user_profiles` table)
✅ **Token Refresh**: Backend automatically refreshes expired tokens (5 min before expiry)
✅ **Multi-Device**: User authenticated across all devices once tokens are stored
✅ **Deep Linking**: Seamless return to app after authorization

---

## OAuth Flow Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Mobile    │         │   Backend   │         │   Spotify   │
│     App     │         │   Server    │         │     API     │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. Tap "Connect       │                       │
       │    Spotify"           │                       │
       │                       │                       │
       │ 2. GET /api/spotify/  │                       │
       │    auth/initiate      │                       │
       │──────────────────────>│                       │
       │                       │                       │
       │                       │ 3. Generate state     │
       │                       │    (CSRF protection)  │
       │                       │                       │
       │ 4. Returns authUrl    │                       │
       │    + state            │                       │
       │<──────────────────────│                       │
       │                       │                       │
       │ 5. Open authUrl in    │                       │
       │    expo-web-browser   │                       │
       │───────────────────────┼──────────────────────>│
       │                       │                       │
       │                       │ 6. User authorizes    │
       │                       │                       │
       │                       │ 7. Redirect to        │
       │                       │    callback URL       │
       │                       │<──────────────────────│
       │                       │ GET /api/spotify/     │
       │                       │ auth/callback?        │
       │                       │ code=xxx&state=yyy    │
       │                       │                       │
       │                       │ 8. Verify state       │
       │                       │                       │
       │                       │ 9. Exchange code      │
       │                       │    for tokens         │
       │                       │──────────────────────>│
       │                       │                       │
       │                       │ 10. Returns tokens    │
       │                       │<──────────────────────│
       │                       │                       │
       │                       │ 11. Get Spotify       │
       │                       │     user profile      │
       │                       │──────────────────────>│
       │                       │                       │
       │                       │ 12. Returns profile   │
       │                       │<──────────────────────│
       │                       │                       │
       │                       │ 13. Save tokens +     │
       │                       │     profile to DB     │
       │                       │                       │
       │ 14. Redirect to       │                       │
       │     deep link         │                       │
       │<──────────────────────│                       │
       │ musicroom://auth/     │                       │
       │ spotify/callback?     │                       │
       │ success=true&         │                       │
       │ spotifyUserId=xxx     │                       │
       │                       │                       │
       │ 15. Parse deep link   │                       │
       │     Close browser     │                       │
       │     Update UI         │                       │
       │     Navigate back     │                       │
       │                       │                       │
```

---

## Implementation Details

### Backend Structure

```
backend/src/features/spotify/
├── spotify.types.ts          # TypeScript types (DTOs, Spotify API responses)
├── spotify.validators.ts     # Zod validation schemas
├── spotify.service.ts        # OAuth logic, token management, Spotify API wrapper
├── spotify.controller.ts     # Express request handlers
├── spotify.routes.ts         # API routes
└── index.ts                  # Public exports
```

### API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/spotify/auth/initiate` | Yes | Start OAuth flow, returns authUrl + state |
| GET | `/api/spotify/auth/callback` | No | OAuth callback from Spotify, redirects to deep link |
| POST | `/api/spotify/auth/exchange` | No | Alternative endpoint for mobile code exchange |
| GET | `/api/spotify/auth/status` | Yes | Get current connection status |
| POST | `/api/spotify/auth/disconnect` | Yes | Disconnect Spotify account |
| GET | `/api/spotify/search` | Yes | Search Spotify catalog |

---

## Step-by-Step Implementation

### Step 1: User Initiates Connection

**Mobile** (`spotifyStore.ts` - `initiateConnection()`):

```typescript
async initiateConnection() {
  set({ isConnecting: true, error: null });

  const { accessToken } = useAuthStore.getState();

  // Call backend to get OAuth URL
  const { authUrl, state } = await spotifyApi.initiateAuth(accessToken);

  // Open Spotify auth in browser
  const result = await WebBrowser.openAuthSessionAsync(
    authUrl,
    Linking.createURL('auth/spotify/callback')
  );

  if (result.type === 'success') {
    // Browser closed, deep link caught
    // Parse callback URL
    const url = Linking.parse(result.url);
    const success = url.queryParams?.success === 'true';

    if (success) {
      // Update UI
      const currentUser = useAuthStore.getState().user;
      useAuthStore.setState({
        user: { ...currentUser, spotifyConnected: true }
      });

      // Fetch fresh status from backend
      await checkStatus();
    }
  }

  set({ isConnecting: false });
}
```

**Backend** (`spotify.service.ts` - `initiateAuth()`):

```typescript
async initiateAuth(userId: string): Promise<SpotifyAuthResponse> {
  // Generate random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Store state in memory (10 min expiration)
  oauthStates.set(state, { userId, createdAt: Date.now() });

  // Build Spotify OAuth URL
  const params = new URLSearchParams({
    client_id: this.clientId,
    response_type: 'code',
    redirect_uri: this.redirectUri, // Backend callback URL
    state,
    scope: this.scopes.join(' '), // user-read-email, playlist-*, etc.
    show_dialog: 'false',
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params}`;

  return { authUrl, state };
}
```

### Step 2: User Authorizes on Spotify

User sees Spotify login/authorization page in `expo-web-browser`.
User grants permissions → Spotify redirects to backend callback URL.

### Step 3: Backend Receives Callback

**Backend** (`spotify.controller.ts` - `handleCallback()`):

```typescript
async handleCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    // Validate and process OAuth
    const result = await spotifyService.handleCallback({ code, state });

    // Redirect to mobile deep link with success
    const deepLink = `musicroom://auth/spotify/callback?success=true&spotifyUserId=${result.spotifyUserId}`;
    res.redirect(deepLink);
  } catch (error) {
    // Redirect to deep link with error
    const deepLink = `musicroom://auth/spotify/callback?success=false&error=${encodeURIComponent(error.message)}`;
    res.redirect(deepLink);
  }
}
```

**Backend** (`spotify.service.ts` - `handleCallback()`):

```typescript
async handleCallback(data: SpotifyAuthCallbackDTO): Promise<SpotifyConnectionStatus> {
  // 1. Verify state (CSRF protection)
  const stateData = oauthStates.get(data.state);
  if (!stateData) {
    throw new AppError(400, 'Invalid or expired state');
  }

  const userId = stateData.userId;
  oauthStates.delete(data.state); // Consume state

  // 2. Exchange code for tokens
  const tokenResponse = await this.exchangeCodeForTokens(data.code);
  // tokenResponse = { access_token, refresh_token, expires_in, scope }

  // 3. Get Spotify user profile
  const spotifyUser = await this.getSpotifyUserProfile(tokenResponse.access_token);

  // 4. Calculate expiration
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  // 5. Save to database
  await supabase
    .from('user_profiles')
    .update({
      spotify_connected: true,
      spotify_user_id: spotifyUser.id,
      spotify_access_token: tokenResponse.access_token,
      spotify_refresh_token: tokenResponse.refresh_token,
      spotify_token_expires_at: expiresAt.toISOString(),
      spotify_scopes: tokenResponse.scope.split(' '),
    })
    .eq('id', userId);

  return {
    connected: true,
    spotifyUserId: spotifyUser.id,
    scopes: tokenResponse.scope.split(' '),
    expiresAt: expiresAt.toISOString(),
  };
}
```

### Step 4: Mobile Catches Deep Link

**Mobile** - `expo-web-browser` automatically handles the deep link:
- Browser closes
- `WebBrowser.openAuthSessionAsync()` returns with `result.type === 'success'`
- `result.url` contains the deep link with parameters
- Mobile parses success status and updates UI

---

## Database Schema

Migration `002_spotify_oauth.sql` adds to `user_profiles`:

```sql
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
  ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS spotify_scopes TEXT[];

-- Function to clear all Spotify data atomically
CREATE OR REPLACE FUNCTION public.clear_spotify_connection(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    spotify_connected = FALSE,
    spotify_user_id = NULL,
    spotify_access_token = NULL,
    spotify_refresh_token = NULL,
    spotify_token_expires_at = NULL,
    spotify_scopes = NULL,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Token Refresh

**Automatic Refresh** (in `spotify.service.ts`):

```typescript
private async getValidAccessToken(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at, spotify_connected')
    .eq('id', userId)
    .single();

  if (!profile.spotify_connected || !profile.spotify_access_token) {
    throw new AppError(401, 'Spotify not connected');
  }

  const expiresAt = new Date(profile.spotify_token_expires_at);
  const now = new Date();

  // Refresh if expired or expires in next 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    return await this.refreshAccessToken(userId, profile.spotify_refresh_token);
  }

  return profile.spotify_access_token;
}

private async refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const tokenData = await response.json();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  // Update database with new token
  await supabase
    .from('user_profiles')
    .update({
      spotify_access_token: tokenData.access_token,
      spotify_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', userId);

  return tokenData.access_token;
}
```

---

## Mobile UI Components

### SpotifyConnectScreen

Located at `mobile/src/screens/spotify/SpotifyConnectScreen.tsx`

**Features**:
- Spotify icon (🎵)
- Title "Connect to Spotify"
- Feature list with checkmarks (search, add tracks, sync library, etc.)
- "Connect Spotify" button (primary)
- "Skip for now" button (ghost, shown after 2 seconds)
- Error handling with retry

**Navigation**:
- Accessed from Profile screen by tapping Spotify row
- Returns to Profile on success or skip

### SpotifySettingsScreen

Located at `mobile/src/screens/spotify/SpotifySettingsScreen.tsx`

**Features**:
- Connection status badge (Connected/Not Connected)
- Spotify User ID (if connected)
- Scopes count
- Info section explaining benefits
- "Disconnect Spotify" button with confirmation alert

---

## Configuration

### Backend `.env`

```bash
# Spotify API credentials from https://developer.spotify.com/dashboard
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Callback URL (changes with tunnel URL)
SPOTIFY_REDIRECT_URI=https://abc123.ngrok-free.app/api/spotify/auth/callback
```

### Mobile `.env`

```bash
# Deep link callback (fixed)
EXPO_PUBLIC_SPOTIFY_REDIRECT_URI=musicroom://auth/spotify/callback
```

### Spotify Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Create or select your app
3. Add Redirect URI: `https://your-tunnel-url.ngrok-free.app/api/spotify/auth/callback`
4. Copy Client ID and Client Secret to backend `.env`

**Note**: Tunnel URL changes on each `make dev-tunnel` restart. Update Spotify Dashboard each time.

### app.json (Deep Linking)

```json
{
  "expo": {
    "scheme": "musicroom",
    "ios": {
      "associatedDomains": ["applinks:musicroom.app"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "musicroom", "host": "auth" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

---

## Testing the Integration

### Step 1: Start Tunnel Mode

```bash
make dev-tunnel
```

Copy the displayed Spotify callback URL (e.g., `https://abc123.ngrok-free.app/api/spotify/auth/callback`)

### Step 2: Update Spotify Dashboard

Add the callback URL to Spotify Dashboard → App Settings → Redirect URIs

### Step 3: Execute Database Migration

In Supabase Dashboard → SQL Editor, execute:
```sql
-- Content from backend/migrations/002_spotify_oauth.sql
```

### Step 4: Test Flow

1. Open mobile app (Expo Go)
2. Login with test account
3. Navigate to Profile
4. Tap "Spotify" row → opens SpotifyConnectScreen
5. Tap "Connect Spotify" → opens browser
6. Authorize on Spotify
7. Browser closes automatically
8. Verify "Connected" status in Profile
9. Tap "Spotify" row again → opens SpotifySettingsScreen
10. Test disconnect

---

## Security Features

✅ **CSRF Protection**: State parameter with 10-minute expiration
✅ **Client Secret**: Never exposed to mobile, stays on backend
✅ **Token Storage**: Stored in Supabase with Row Level Security
✅ **Token Refresh**: Automatic refresh before expiration (no user interruption)
✅ **Scope Limiting**: Only requests necessary permissions
✅ **Deep Link Validation**: Mobile validates callback origin

---

## Troubleshooting

### "Invalid redirect URI" Error

- Ensure callback URL in Spotify Dashboard exactly matches `SPOTIFY_REDIRECT_URI` in backend `.env`
- No trailing slashes, correct protocol (https for tunnel)

### Mobile Doesn't Return After Authorization

- Check deep linking configuration in `app.json`
- Verify scheme is `musicroom://`
- Test deep link manually: `npx uri-scheme open musicroom://auth/spotify/callback?success=true --ios`

### Tokens Not Working

- Check token expiration (1 hour for access token)
- Verify refresh token logic in backend
- Check Spotify scopes match requested permissions

### Callback URL Changes Every Restart

- Use ngrok paid plan for fixed domain
- Or manually update Spotify Dashboard after each `make dev-tunnel`
- Consider using `make dev` (LAN mode) for development, tunnel only for testing

---

## Next Steps

Now that OAuth is working:

1. **Implement Playlist Integration** - Add Spotify tracks to Music Room playlists
2. **Search UI** - Create search screen with Spotify API
3. **Playback Control** - Integrate Spotify SDK for playback
4. **Real-time Sync** - Use Socket.io to sync playback across users

---

## Files Modified

### Backend
- `backend/migrations/002_spotify_oauth.sql` (new)
- `backend/src/shared/config/env.ts` (updated)
- `backend/src/features/spotify/` (new directory, 6 files)
- `backend/src/server.ts` (updated)

### Mobile
- `mobile/src/types/index.ts` (updated)
- `mobile/src/services/api.ts` (updated)
- `mobile/src/store/spotifyStore.ts` (new)
- `mobile/src/screens/spotify/` (new directory, 3 files)
- `mobile/src/navigation/AppNavigator.tsx` (updated)
- `mobile/src/screens/profile/ProfileScreen.tsx` (updated)
- `mobile/app.json` (updated)
