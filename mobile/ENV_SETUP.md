# Environment Variables Setup

This document explains how to set up environment variables for the mobile app.

## Quick Start

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Fill in the required values (see sections below)

## Required Variables

### Backend API (Required)

**LAN Mode (default):**

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
EXPO_PUBLIC_WS_URL=ws://192.168.1.XXX:3000
```

Replace `XXX` with your local IP address. Find it with:

- **Linux/Mac**: `ifconfig | grep inet`
- **Windows**: `ipconfig`

**Tunnel Mode:**

```bash
# DO NOT set these manually!
# Run: make dev-tunnel
# The tunnel URL is auto-configured from backend
```

### Supabase (Required)

Get these from [Supabase Dashboard](https://supabase.com/dashboard):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find:**

1. Go to your Supabase project
2. Settings → API
3. Copy "Project URL" and "anon/public" key

### Google OAuth (Required for Google Sign-In)

Get these from [Google Cloud Console](https://console.cloud.google.com/):

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.your-ios-client-id
```

**How to get Google OAuth credentials:**

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one

2. **Enable Google Sign-In API:**
   - APIs & Services → Enable APIs
   - Search for "Google Sign-In API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials:**
   - APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"

4. **Create Web Client ID:**
   - Application type: **Web application**
   - Name: "Music Room Backend"
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
   - Click "Create"
   - **Copy the Client ID** → Use as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

5. **Create iOS Client ID:**
   - Application type: **iOS**
   - Name: "Music Room iOS"
   - Bundle ID: `com.musicroom.app` (or your app's bundle ID)
   - Click "Create"
   - **Copy the iOS URL scheme** → Use as `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`
   - Format: `com.googleusercontent.apps.[CLIENT_ID]`

6. **Create Android Client ID (optional):**
   - Application type: **Android**
   - Name: "Music Room Android"
   - Package name: `com.musicroom.app`
   - SHA-1 certificate fingerprint (get with `keytool`)
   - Click "Create"

**Important Notes:**

- The **Web Client ID** is used for both iOS and Android to verify ID tokens
- The **iOS URL Scheme** is only needed for iOS builds
- For development builds, you may need to add your development certificate SHA-1

### EAS Token (Required for Tunnel Mode)

Get this from [Expo Dashboard](https://expo.dev/):

```bash
EXPO_TOKEN=your-personal-access-token
```

**How to get:**

1. Go to [Expo Access Tokens](https://expo.dev/settings/access-tokens)
2. Click "Create Token"
3. Give it a name (e.g., "Music Room Dev")
4. Copy the token

## Optional Variables

### Spotify (Future - Not implemented yet)

```bash
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id
```

Will be used in Phase 6 for Spotify integration.

## Environment Files

- **`.env`** - Your local environment (NOT committed to git)
- **`.env.example`** - Template with placeholders (committed to git)
- **`.env.local`** - Optional local overrides (NOT committed to git)

## Troubleshooting

### Error: "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined"

Make sure you have:

1. Created a `.env` file (copy from `.env.example`)
2. Added the Google OAuth credentials
3. Restarted Expo dev server (`npm start`)

### Error: "Google Sign-In failed: DEVELOPER_ERROR"

This means your Google OAuth configuration is incorrect:

- Check that the Web Client ID is correct
- Make sure you created a **Web application** type credential
- Verify the SHA-1 certificate for Android if using physical device

### Backend can't verify Google token

Make sure the backend also has the Google credentials:

- Check `backend/.env` has `GOOGLE_CLIENT_ID` (same as Web Client ID)
- Restart backend server

### iOS URL scheme not working

Make sure:

1. You created an iOS OAuth client in Google Console
2. The iOS URL scheme matches the format: `com.googleusercontent.apps.[CLIENT_ID]`
3. The bundle ID in Google Console matches your app's bundle ID

## Security Notes

⚠️ **Never commit your `.env` file!**

The `.env` file contains sensitive credentials and should never be pushed to git. It is already in `.gitignore`.

If you accidentally commit secrets:

1. Revoke the compromised credentials immediately
2. Generate new credentials
3. Update your `.env` file
4. Use `git filter-branch` or BFG Repo-Cleaner to remove from history

## References

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native#environment-variables)
