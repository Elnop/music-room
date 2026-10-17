# #341 — inventory of English UI text (2026-10-17)

Read-only audit; paths under `mobile/src`. Counts are approximate.

## Screens
- screens/auth/LoginScreen.tsx (10): "Password", "Enter your password", "Sign In", "Forgot Password?", "OR", "Continue with Google/Facebook", "Don't have an account?", "Sign up"
- screens/auth/RegisterScreen.tsx (12): "Username", "Create a strong password", "Create Account", "Password must contain: • At least 8 characters…" (l.168-170), "Already have an account?", "Sign in"
- screens/auth/EmailVerificationScreen.tsx (9): "Verify Your Email", "We sent a 6-digit code to", "Please enter all 6 digits", `Resend in ${n}s`, "Sending...", "Resend Code", "Back to Login"
- screens/auth/ForgotPasswordScreen.tsx (9): "Forgot Password?", "Enter your email address and we'll send you…", "Email is required", "Please enter a valid email", "Send Reset Code", "Remember your password?", "Log In"
- screens/auth/ResetPasswordScreen.tsx (22): 7 setPasswordError/setCodeError messages (l.85-117), "New Password", "Re-enter new password", "Password must contain: • …" (l.237-249), "Resend Code"
- screens/auth/WelcomeScreen.tsx (2): "Get Started", "Login"
- screens/friends/UserProfileScreen.tsx (12): "Failed to load profile", "Loading profile...", "Profile not found", "Followers", "Following", "Follow", "Follows you", "Friends", "Private bio", "Visible only to friends", "Member since"
- screens/playlists/CreatePlaylistScreen.tsx (11): "Playlist name", "My awesome playlist", "Description (Optional)", "Private playlist", "Restricted editing", "Everyone can add/remove tracks", "Create playlist"
- screens/playlists/PlaylistSharingScreen.tsx (25): "Settings", "Visibility", "Edit mode", "Private - Only invited people can see", "Open playlist", title/subtitle pairs l.471-490 ("Access and editing", "Sharing"…), `People with access (n)`, `Guests (n)`, `Editors (n)`, "Results", "Search for a user...", "Loading..."
- screens/profile/ProfileScreen.tsx (15): "No user data available", "Followers", "Following", "Music preferences", "Edit", "Add your favorite genres", "Tap to select up to 5 genres", "Username", "Member since", "Theme", "Privacy", "Manage who can see your information", "Linked accounts", "Add or remove Google and Facebook sign-in"
- screens/profile/PrivacySettingsScreen.tsx (13): "Loading...", "Unable to load settings", "Privacy", "Control who can see your information", 4 labels + 4 descriptions ("Profile picture"/"Who can see your avatar"…), "Save"
- screens/profile/LinkedAccountsScreen.tsx (10): "Link"/"Unlink" (also in accessibilityLabel `${label} ${provider}`), "Linked · Primary", "Linked", "Not linked", "Unable to load linked accounts", "Linked accounts", "Choose how you sign in to Zumik", "Email & password", "Loading..."
- screens/profile/EditProfileScreen.tsx (10): zod "Name cannot be empty" (l.30), "Edit profile", "Update your information", "Display name", "Tell us about yourself...", "Note: You cannot change your username or email…", "Save", "Cancel"
- screens/profile/MusicPreferencesScreen.tsx (4): "Loading...", "Music preferences", "Tell us what genres you like! Select up to N genres.", "Save"
- screens/playlists/PlaylistDetailScreen.tsx: anglicism "track" ("Track supprimé", "Impossible de supprimer le track") → « titre »

## Components and types
- components/common/BackendUrlField.tsx (4): "Backend address", "Save", "Reset to default", "Current: …"
- components/common/ErrorBoundary.tsx (5): "Something went wrong", "Unknown error", "Try Again", "Stack Trace:", "Component Stack:" (dev only)
- components/common/SwipeableUserItem.tsx (1): "Viewer"
- components/player/PlayerModal.tsx (2): "NOW PLAYING", "Loading audio stream..."
- components/playlist/PlaylistCard.tsx (3): "Private", "track"/"tracks"
- components/profile/GenreSelector.tsx (4): "Music Preferences", "{n}/{max} selected", "Select up to … genres that define your music taste", "Maximum genres selected. Deselect one…"
- components/theme/ThemeSelector.tsx (2): "Royal Blue", "Christmas"
- types/user.types.ts (6): VISIBILITY_LABELS "Friends Only", "Private"; GENRE_INFO "Classical", "Electronic", "Latin", "Country"

## Navigation, validators, stores, services
- navigation/stacks/ProfileStack.tsx:69 "Linked accounts"; navigation/RootNavigator.tsx:130 "Loading..."; navigation/AuthNavigator.tsx:50/55/60 "Verify Email", "Forgot Password", "Reset Password"
- utils/validators.ts: 15 zod messages (login 2, register 10, playlist 3)
- store/authStore.ts: ~18 English fallbacks (l.119 "Login failed", "Registration failed", "Failed to resend code", "Failed to reset password", OAuth l.334-420, "Profile update failed" l.459, "Failed to link provider" l.578, "Failed to unlink provider" l.604); passes `ApiError.message` (backend English) into `error` for login, register, verify, resend, forgot, reset, link, unlink
- contexts/PlayerContext.tsx (5, shown by PlayerErrorToast): "Unable to load this track" (l.220, 515), "Loading too long - try again", "This track is no longer available (rights are expensive)", `Server error (${status}): ${message}` (l.413), raw err.message / "Loading error"
- store/playlistStore.ts: 8 "Failed to …" fallbacks in `error` state
- store/soundcloudStore.ts:53 "Search failed"
- store/queueStore.ts:292-293, 308 and hooks/useMusicControl.ts:150 (`controlErrorMessage` default) pass `error.message` through
- services/api.ts: "Session expired. Please login again.", "Unknown error occurred", "Invalid JSON response from server", "No data in response"
- services/oauth.ts: "No ID token received from Google Sign-In…" (×2), "No access token received from Facebook Login…" (reach the user via `Login failed: ${msg}`)
- services/backendUrl.ts:23 INVALID_BACKEND_URL_MESSAGE
- services/musicControlApi.ts:28 "No authentication token available"

## Backend codes to map in utils/apiErrorMessage.ts (CODE_MESSAGES)
INVALID_CREDENTIALS, EMAIL_ALREADY_EXISTS, USERNAME_TAKEN, INVALID_CODE, INVALID_RESET_CODE, RESET_CODE_EXPIRED, ALREADY_VERIFIED, EMAIL_NOT_VERIFIED, INVALID_TOKEN, INVALID_FACEBOOK_TOKEN, TOKEN_REVOKED, VALIDATION_ERROR, RATE_LIMIT_EXCEEDED, TOO_MANY_ATTEMPTS, AUTH_UNAVAILABLE, client-side SESSION_EXPIRED and NETWORK_ERROR. Check each against `backend/src/features/auth/` before adding.

## Tutoiement
components/player/MiniPlayer.tsx:220 and components/player/PlayerModal.tsx:303 "Choisis un son pour commencer" (tests: MiniPlayer.test.tsx:86, PlayerModal.test.tsx:153)

## Dates
ProfileScreen.tsx:249 and UserProfileScreen.tsx:305 `toLocaleDateString('en-US', …)`; utils/formatters.ts:11 `formatDate` 'en-US'; utils/formatters.ts:18-29 `formatRelativeTime` "Just now", "Nm ago"… (only used by its test)

## Duplicate titles (header title vs in-content big title)
PrivacySettings (PrivacySettingsScreen:141), LinkedAccounts (LinkedAccountsScreen:150), MyDevices (MyDevicesScreen:181), MusicPreferences (MusicPreferencesScreen:97, plus GenreSelector:28), EditProfile (EditProfileScreen:112), PlaylistSharing (PlaylistSharingScreen:527, partial)

## Tests asserting English text
LinkedAccountsScreen.test.tsx (~9), PrivacySettingsScreen.test.tsx (3), ErrorBoundary.test.tsx (4), UserProfileScreen.test.tsx (1), formatters.test.ts (4), authStore.test.ts:381-392, MiniPlayer.test.tsx, PlayerModal.test.tsx
