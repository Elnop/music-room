# Spotify OAuth Integration - Flow Explanation

## Overview

Music Room uses **backend-handled OAuth** for Spotify integration. This means the backend manages the OAuth flow and stores access/refresh tokens, while the mobile app simply triggers the authentication and receives the final result.

## Why Backend-Handled OAuth?

✅ **Security**: `SPOTIFY_CLIENT_SECRET` stays on the server, never exposed to mobile app
✅ **Token Storage**: Tokens stored securely in Supabase database
✅ **Token Refresh**: Backend automatically refreshes expired tokens
✅ **Multi-Device**: User authenticated across all devices once tokens are stored

## OAuth Flow Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Mobile    │         │   Backend   │         │   Spotify   │
│     App     │         │   Server    │         │     API     │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. User taps          │                       │
       │   "Connect Spotify"   │                       │
       │──────────────────────>│                       │
       │                       │                       │
       │ 2. GET /api/spotify/  │                       │
       │    auth/login         │                       │
       │                       │                       │
       │ 3. Returns OAuth URL  │                       │
       │<──────────────────────│                       │
       │   with state token    │                       │
       │                       │                       │
       │ 4. Opens OAuth URL    │                       │
       │   in browser          │                       │
       │───────────────────────┼──────────────────────>│
       │                       │                       │
       │                       │  5. User logs in      │
       │                       │     and authorizes    │
       │                       │                       │
       │                       │ 6. Redirects to       │
       │                       │    callback URL       │
       │                       │<──────────────────────│
       │                       │ /api/spotify/callback │
       │                       │ ?code=xxx&state=yyy   │
       │                       │                       │
       │                       │ 7. Exchange code      │
       │                       │    for tokens         │
       │                       │──────────────────────>│
       │                       │                       │
       │                       │ 8. Returns tokens     │
       │                       │<──────────────────────│
       │                       │ {access_token,        │
       │                       │  refresh_token}       │
       │                       │                       │
       │                       │ 9. Store tokens in    │
       │                       │    Supabase DB        │
       │                       │                       │
       │ 10. Mobile polls      │                       │
       │     /api/spotify/     │                       │
       │     status            │                       │
       │──────────────────────>│                       │
       │                       │                       │
       │ 11. Returns success   │                       │
       │<──────────────────────│                       │
       │   {connected: true}   │                       │
       │                       │                       │
       │ 12. Navigate to       │                       │
       │     main app          │                       │
       │                       │                       │
```

## Implementation Details

### Step 1-3: Initiate OAuth

**Mobile** (`src/screens/spotify/SpotifyAuthScreen.tsx`):
```typescript
const handleConnectSpotify = async () => {
  // Call backend to get OAuth URL
  const response = await fetch(`${API_URL}/api/spotify/auth/login`, {
    headers: {
      'Authorization': `Bearer ${userToken}` // User must be logged in
    }
  });

  const { authUrl, state } = await response.json();
  // authUrl = "https://accounts.spotify.com/authorize?client_id=...&redirect_uri=..."

  // Open OAuth URL in browser
  await WebBrowser.openAuthSessionAsync(authUrl);

  // Start polling for completion
  pollAuthStatus(state);
};
```

**Backend** (`backend/src/features/spotify/spotify.controller.ts`):
```typescript
export const initiateSpotifyAuth = async (req: Request, res: Response) => {
  const userId = req.user.id; // From JWT middleware

  // Generate random state token for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');

  // Store state in database with user ID and expiration (5 minutes)
  await storeAuthState(userId, state);

  // Build Spotify OAuth URL
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', process.env.SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', `${BACKEND_URL}/api/spotify/callback`);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'user-read-playback-state user-modify-playback-state');

  res.json({ authUrl: authUrl.toString(), state });
};
```

### Step 4-6: User Authorizes & Spotify Redirects

1. Mobile opens `authUrl` in browser (using `expo-web-browser`)
2. User logs into Spotify and grants permissions
3. Spotify redirects to: `https://your-tunnel.ngrok.io/api/spotify/callback?code=xxx&state=yyy`
4. This callback URL hits your **backend**, not the mobile app

### Step 7-9: Exchange Code for Tokens

**Backend** (`backend/src/features/spotify/spotify.controller.ts`):
```typescript
export const handleSpotifyCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query;

  // Verify state token (CSRF protection)
  const authState = await getAuthState(state);
  if (!authState || authState.expiresAt < Date.now()) {
    return res.status(400).send('Invalid or expired state');
  }

  const userId = authState.userId;

  // Exchange authorization code for access token
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${BACKEND_URL}/api/spotify/callback`
    })
  });

  const tokens = await tokenResponse.json();
  // tokens = { access_token, refresh_token, expires_in, ... }

  // Store tokens in Supabase database
  await supabase
    .from('spotify_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000
    });

  // Mark auth state as completed
  await markAuthStateCompleted(state);

  // Return success page (HTML)
  res.send(`
    <html>
      <body>
        <h1>✅ Spotify Connected!</h1>
        <p>You can close this window and return to Music Room.</p>
        <script>window.close();</script>
      </body>
    </html>
  `);
};
```

### Step 10-12: Mobile Detects Success

**Mobile** (polling approach):
```typescript
const pollAuthStatus = async (state: string) => {
  const maxAttempts = 60; // 60 seconds
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    // Check if auth completed
    const response = await fetch(
      `${API_URL}/api/spotify/auth/status?state=${state}`,
      {
        headers: { 'Authorization': `Bearer ${userToken}` }
      }
    );

    const { completed, error } = await response.json();

    if (completed) {
      clearInterval(interval);
      // Navigate to main app
      navigation.navigate('App');
    } else if (error || attempts >= maxAttempts) {
      clearInterval(interval);
      Alert.alert('Error', 'Spotify connection timed out');
    }
  }, 1000); // Poll every second
};
```

**Backend** (status endpoint):
```typescript
export const getAuthStatus = async (req: Request, res: Response) => {
  const { state } = req.query;
  const userId = req.user.id;

  const authState = await getAuthState(state);

  if (!authState) {
    return res.json({ completed: false, error: 'Invalid state' });
  }

  if (authState.userId !== userId) {
    return res.json({ completed: false, error: 'Unauthorized' });
  }

  res.json({
    completed: authState.completed,
    error: authState.error
  });
};
```

## Redirect URI Configuration

### Tunnel Mode (Development - Different WiFi)

When running `make dev-tunnel`, add this to Spotify Dashboard:

```
https://abc123.ngrok-free.app/api/spotify/callback
```

**⚠️ Important**: This URL changes each time you restart tunnel mode. Update it in:
1. Spotify Dashboard → Redirect URIs
2. Will be displayed automatically when running `make dev-tunnel`

### LAN Mode (Development - Same WiFi)

```
http://localhost:3000/api/spotify/callback
http://192.168.1.100:3000/api/spotify/callback  # Your local IP
```

### Production

```
https://api.musicroom.com/api/spotify/callback
```

## Security Considerations

### CSRF Protection with State Token

The `state` parameter prevents CSRF attacks:

1. Backend generates random state token
2. Stores it in database with user ID and expiration
3. Includes it in OAuth URL
4. Spotify returns it unchanged in callback
5. Backend verifies it matches stored value

Without this, an attacker could trick a user into authorizing their Spotify account.

### Token Storage

- **Access Token**: Valid for 1 hour, stored in database
- **Refresh Token**: Valid indefinitely (until revoked), used to get new access tokens
- Backend automatically refreshes expired access tokens before API calls

### Client Secret Protection

`SPOTIFY_CLIENT_SECRET` is **never** sent to mobile app or exposed in frontend code. It stays on the backend server only.

## Using Spotify API After Authentication

Once authenticated, the mobile app can call backend endpoints that use Spotify API:

```typescript
// Mobile: Request current playback
const response = await fetch(`${API_URL}/api/spotify/playback`, {
  headers: { 'Authorization': `Bearer ${userToken}` }
});

// Backend: Use stored Spotify tokens
export const getCurrentPlayback = async (req: Request, res: Response) => {
  const userId = req.user.id;

  // Get user's Spotify tokens from database
  const { access_token } = await getSpotifyTokens(userId);

  // Call Spotify API
  const playback = await fetch('https://api.spotify.com/v1/me/player', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });

  res.json(await playback.json());
};
```

## Testing the Flow

1. Start tunnel mode:
   ```bash
   make dev-tunnel
   ```

2. Copy the displayed callback URL and add it to Spotify Dashboard

3. In mobile app, tap "Connect Spotify"

4. You'll see:
   - Browser opens with Spotify login
   - User authorizes
   - Browser shows success page
   - Mobile app polls and detects success
   - Navigates to main app

5. Check ngrok web UI (http://localhost:4040) to see the callback request

## Common Issues

### "Invalid redirect URI" error

- The callback URL in Spotify Dashboard must **exactly match** the backend tunnel URL
- Check for trailing slashes, http vs https, etc.

### Mobile app doesn't detect success

- Check backend logs for callback errors
- Verify state token is being stored/retrieved correctly
- Ensure polling endpoint is working

### Tokens not working

- Check token expiration (1 hour for access token)
- Verify refresh token logic is implemented
- Check Spotify API scopes match what you're requesting

## Next Steps

After OAuth is working:

1. **Implement Token Refresh**: Automatic refresh of expired access tokens
2. **Add Spotify Endpoints**: `/api/spotify/search`, `/api/spotify/play`, etc.
3. **Real-time Sync**: Use Socket.io to sync playback across users in a room
4. **Error Handling**: Handle revoked tokens, API rate limits, etc.
