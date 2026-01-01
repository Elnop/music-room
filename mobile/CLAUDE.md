# Mobile Architecture - Zumik (AI Context)

This file provides mobile-specific architecture context for AI agents working on the Zumik mobile app.

## Component + Feature Architecture

```
mobile/src/
├── screens/              # Screens by feature
│   ├── auth/            # WelcomeScreen, LoginScreen, RegisterScreen
│   ├── playlists/       # PlaylistsScreen, CreatePlaylistScreen, PlaylistDetailScreen, PlaylistEditorScreen
│   ├── profile/         # ProfileScreen, EditProfileScreen
│   ├── friends/         # FriendsScreen (455 lines - tabs for friends list + search), UserProfileScreen
│   ├── settings/        # SettingsScreen
│   └── search/          # SoundCloudSearchScreen, SoundCloudTrackItem, PlaylistSelectorModal
├── components/
│   ├── common/          # Reusable UI (Button, Card, Input, LoadingSpinner, Avatar, etc.)
│   ├── playlist/        # Feature-specific (TrackItem, PlaylistCard, PlaylistHeader, AddTrackButton)
│   ├── player/          # MiniPlayer, PlayerModal (full player with controls, progress, artwork)
│   └── music-control/   # DeviceListeningCard (displays friends listening with control delegation)
├── navigation/
│   ├── RootNavigator.tsx    # Main navigator (switches Auth/App based on auth state)
│   ├── AuthNavigator.tsx    # Stack for unauthenticated users
│   ├── AppNavigator.tsx     # Bottom tabs for authenticated users
│   └── stacks/              # Feature-specific navigation stacks
│       ├── PlaylistsStack.tsx
│       ├── FriendsStack.tsx
│       ├── ProfileStack.tsx
│       └── SearchStack.tsx
├── contexts/             # React Context providers
│   ├── ThemeContext.tsx     # Theme state and colors (2705 lines)
│   └── PlayerContext.tsx    # Audio player lifecycle management (4058 lines)
├── store/               # Zustand state management
│   ├── authStore.ts         # Authentication state (user, tokens, login/logout)
│   ├── playlistStore.ts     # Playlist state with API integration
│   ├── soundcloudStore.ts   # SoundCloud search state
│   ├── playerStore.ts       # Audio player state (current track, play state, modal state)
│   └── socketStore.ts       # Socket.io connection management
├── hooks/               # Custom React hooks
│   ├── useSoundCloudPlayer.ts   # Audio playback hook (fetch stream, manage player)
│   ├── usePlayerController.ts   # Player controls (play, pause, seek, skip)
│   ├── usePlayerProgress.ts     # Progress tracking and slider
│   ├── usePlayerSync.ts         # Sync player state across components
│   ├── useMusicControl.ts       # Music control delegation (7849 lines!)
│   └── usePlaylistSocket.ts     # Real-time playlist updates
├── api/                 # API client layer
│   └── playlistApi.ts  # Playlist API calls
├── services/            # Service layer
│   ├── api.ts          # Base API configuration
│   ├── profileApi.ts   # Profile API calls
│   ├── friendsApi.ts   # Friends API calls (follow, unfollow, get friends)
│   ├── musicControlApi.ts  # Music control delegation API
│   ├── oauth.ts        # OAuth integration (Google, Facebook)
│   └── deviceService.ts    # Device registration and management
├── lib/                 # Third-party library configuration
│   └── supabase.ts     # Supabase client setup
├── types/              # TypeScript types aligned with backend
├── utils/              # Validators (Zod), formatters, helpers
├── constants/          # Theme colors, API URLs, spacing
└── mocks/              # Mock data for development (users, playlists, tracks)
```

## Key Mobile Patterns

- **Path aliases**: `@/*` (root), `@components`, `@screens`, `@store`, `@utils`, `@types`, `@constants`, `@mocks`, `@api`, `@services`, `@hooks`, `@contexts`
- **Zustand stores** for state management (auth, playlists, soundcloud, player, socket)
- **React Context** for cross-cutting concerns (ThemeContext, PlayerContext)
- **React Hook Form + Zod** for form validation
- **React Navigation 7** with stack-based organization and bottom tab navigators
- **Custom hooks** for complex logic (7 hooks for audio, music control, real-time)
- **Music-inspired dark theme** (Green #1DB954, Black #121212)
- **Authentication state** persisted to AsyncStorage, loaded on app start in RootNavigator
- **API layer** (`@api`, `@services`) for backend communication
- **Socket.io** for real-time updates (playlist changes, music control delegation)
- **expo-audio** for SoundCloud streaming playback

## State Management

### Zustand Stores

**authStore** (`store/authStore.ts`):
- User profile, tokens, authentication state
- `login()`, `logout()`, `register()`, `loginWithGoogle()`, `loginWithFacebook()`
- Persists to AsyncStorage

**playlistStore** (`store/playlistStore.ts`):
- Playlists array, current playlist
- `fetchPlaylists()`, `fetchPlaylist()`, `createPlaylist()`, `addTrack()`, `removeTrack()`
- Integrates with backend API

**soundcloudStore** (`store/soundcloudStore.ts`):
- Search results, loading state
- `search()`, `clearResults()`

**playerStore** (`store/playerStore.ts`):
- Current track, play state, modal visibility
- `playTrack()`, `togglePlayPause()`, `openPlayerModal()`, `closePlayerModal()`

**socketStore** (`store/socketStore.ts`):
- Socket.io connection, connection state
- `connect()`, `disconnect()`, `emit()`, `on()`

### React Context

**ThemeContext** (`contexts/ThemeContext.tsx`):
- Theme colors, dark/light mode state (2705 lines)
- Provides theme values to all components

**PlayerContext** (`contexts/PlayerContext.tsx`):
- Audio player lifecycle management (4058 lines)
- Handles player initialization, cleanup, background audio

## Custom Hooks

**Audio Playback**:
- `useSoundCloudPlayer(track)` - Fetch stream URL, manage expo-audio player
- `usePlayerController()` - Play, pause, seek, skip controls
- `usePlayerProgress()` - Progress tracking with slider
- `usePlayerSync()` - Sync player state across components

**Real-time**:
- `usePlaylistSocket(playlistId, callbacks)` - Subscribe to playlist updates
- `useMusicControl()` - Handle music control delegation (7849 lines!)

## Navigation Structure

**RootNavigator**:
- Switches between `AuthNavigator` and `AppNavigator` based on auth state
- Loads persisted auth state from AsyncStorage on mount

**AuthNavigator** (Stack):
- WelcomeScreen (initial)
- LoginScreen
- RegisterScreen

**AppNavigator** (Bottom Tabs):
- Playlists Tab → PlaylistsStack
- Search Tab → SearchStack
- Friends Tab → FriendsStack
- Profile Tab → ProfileStack

**Feature Stacks**:
- PlaylistsStack: PlaylistsScreen, PlaylistDetailScreen, PlaylistEditorScreen, CreatePlaylistScreen
- SearchStack: SoundCloudSearchScreen
- FriendsStack: FriendsScreen, UserProfileScreen
- ProfileStack: ProfileScreen, EditProfileScreen

## Audio Playback System

**Components**:
- **MiniPlayer**: Persistent player at bottom (above tab bar), shows current track
- **PlayerModal**: Full-screen player with controls, artwork, progress slider

**Flow**:
1. User taps play on track → `playerStore.playTrack(track)`
2. `useSoundCloudPlayer` fetches stream URL from backend
3. expo-audio loads and plays HLS AAC stream
4. MiniPlayer appears at bottom
5. User can expand to PlayerModal for full controls
6. Progress updates via `usePlayerProgress`
7. Player controls via `usePlayerController`

## Real-time Integration

**Socket Store** (`store/socketStore.ts`):
- Connects to backend WebSocket on login
- Auto-reconnection logic on disconnect
- Event subscription/unsubscription

**Usage Example**:
```typescript
// In PlaylistDetailScreen
const { socket, isConnected } = socketStore();

usePlaylistSocket(playlistId, {
  onTrackAdded: (track) => {
    // Refresh playlist when track added by another user
    playlistStore.fetchPlaylist(playlistId);
  },
  onTrackRemoved: (trackId) => {
    // Remove track from local state
    playlistStore.removeTrackLocally(playlistId, trackId);
  }
});
```

## OAuth Integration

**Google OAuth** (`services/oauth.ts`):
- `@react-native-google-signin/google-signin`
- `configureGoogleSignIn()` - One-time setup
- `signInWithGoogle()` - Triggers sign-in flow, returns ID token
- Backend verifies token via `google-auth-library`

**Facebook OAuth** (`services/oauth.ts`):
- `react-native-fbsdk-next`
- `initializeFacebookSDK()` - One-time setup
- `signInWithFacebook()` - Triggers sign-in flow, returns access token
- Platform-specific handling (iOS Limited Login vs Android)
- Backend verifies token via Facebook Graph API

**Auth Store Integration**:
```typescript
// In authStore
loginWithGoogle: async () => {
  const idToken = await signInWithGoogle();
  // Send to backend /api/auth/google
  // Save tokens and user profile
}

loginWithFacebook: async () => {
  const accessToken = await signInWithFacebook();
  // Send to backend /api/auth/facebook
  // Save tokens and user profile
}
```

## Music Control Delegation

**Hook**: `useMusicControl()` (7849 lines!)
- Manages complex music control delegation logic
- Grants/revokes playback control to friends
- Real-time updates via Socket.io

**Component**: `DeviceListeningCard`
- Displays friends listening to music
- Toggle switches for control permissions
- Integrates with `musicControlApi.ts`

**API**: `services/musicControlApi.ts`
- `grantControl(friendId)` - Grant control permission
- `revokeControl(friendId)` - Revoke control permission
- `getPermissions()` - Get who can control your music
- `checkIfUserCanControl(userId)` - Check if friend granted you control

## Development Notes

- **Hot Reload**: Works out of the box with Expo
- **Native Modules**: Require development builds (not Expo Go) for OAuth
- **Path Aliases**: Configured in tsconfig.json and babel.config.js
- **Type Safety**: All backend types mirrored in `mobile/src/types/`
- **Form Validation**: React Hook Form + Zod schemas
- **Error Handling**: Try/catch in stores, user-friendly error messages
- **Loading States**: Loading spinners in all async operations
