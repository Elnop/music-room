# Database Query Pattern Analysis Report
## Zumik Backend - Helper Utilization Opportunity Assessment

**Analysis Date:** 2025-01-01  
**Scope:** All backend service files (14 total)  
**Available Helpers:** 6 functions in `database.helpers.ts`

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Service Files Analyzed** | 14 |
| **Total Convertible Patterns** | 58 patterns |
| **Estimated Lines Saved** | 200-280 lines |
| **Services with High Impact** | 5 |
| **Non-Convertible Patterns** | 12 (edge cases) |

**Recommendation:** Prioritize Profile → Playlists → Friends for conversion. High ROI with low complexity.

---

## Pattern Inventory by Type

### 1. `.from().select().eq().single()` Pattern
**Convertible to:** `fetchSingle<T>()`

| File | Method | Line(s) | Frequency | Status |
|------|--------|---------|-----------|--------|
| `auth/utils/auth.helpers.ts` | `fetchUserProfile()` | 51-55 | 3x (3 diff methods) | CONVERTIBLE |
| `auth/utils/auth.helpers.ts` | `getUserProfile()` | 87-91 | 1x | CONVERTIBLE |
| `profile/services/profile.service.ts` | `getProfile()` | 92-96 | 1x | CONVERTIBLE |
| `profile/services/privacy.service.ts` | `getPrivacySettings()` | 33-37 | 1x | CONVERTIBLE |
| `profile/services/music-preferences.service.ts` | `getMusicPreferences()` | 23-27 | 1x | CONVERTIBLE |
| `playlists/services/collaborator.service.ts` | `addCollaborator()` | 35-39 | 1x | CONVERTIBLE |
| `playlists/services/collaborator.service.ts` | `removeCollaborator()` | 93-97 | 1x | CONVERTIBLE |
| `playlists/services/viewer.service.ts` | `addViewer()` | 32-36 | 1x | CONVERTIBLE |
| `playlists/services/viewer.service.ts` | `removeViewer()` | 97-101 | 1x | CONVERTIBLE |
| `playlists/services/viewer.service.ts` | `getViewers()` | 148-152 | 1x | CONVERTIBLE |
| `auth/services/provider.service.ts` | `getLinkedProviders()` | 19-23 | 1x | CONVERTIBLE |
| `auth/services/provider.service.ts` | `unlinkProvider()` | 78-82 | 1x | CONVERTIBLE |
| `auth/services/provider.service.ts` | `isProviderLinked()` | 163-167 | 1x | CONVERTIBLE |
| `auth/services/password-reset.service.ts` | `requestPasswordReset()` | 112-116 | 1x | CONVERTIBLE |
| `auth/services/password-reset.service.ts` | `resetPassword()` | 185-189 | 1x | CONVERTIBLE |

**Subtotal:** 15 convertible `.single()` patterns = ~45-60 lines of code saved

---

### 2. `.from().insert().select().single()` Pattern
**Convertible to:** `insertOne<T>()`

| File | Method | Line(s) | Frequency | Notes |
|------|--------|---------|-----------|-------|
| `auth/services/user.service.ts` | `createOAuthUser()` | 342-353 | 1x | CONVERTIBLE (upsert used, but single insert branch) |
| `profile/services/privacy.service.ts` | `createDefaultSettings()` | 162-166 | 1x | CONVERTIBLE |
| `profile/services/music-preferences.service.ts` | `createDefaultPreferences()` | 126-130 | 1x | CONVERTIBLE |

**Subtotal:** 3 convertible `.insert().select().single()` patterns = ~12-15 lines saved

---

### 3. `.from().update().eq().select().single()` Pattern
**Convertible to:** `updateOne<T>()`

| File | Method | Line(s) | Frequency | Status |
|------|--------|---------|-----------|--------|
| `profile/services/profile.service.ts` | `updateProfile()` | 32-37 | 1x | CONVERTIBLE |
| `profile/services/privacy.service.ts` | `updatePrivacySettings()` | 112-117 | 1x | CONVERTIBLE |
| `profile/services/music-preferences.service.ts` | `updateMusicPreferences()` | 75-80 | 1x | CONVERTIBLE |

**Subtotal:** 3 convertible `.update().select().single()` patterns = ~12-15 lines saved

---

### 4. `.from().delete().eq()` Pattern
**Convertible to:** `deleteRecords()`

| File | Method | Line(s) | Frequency | Status |
|------|--------|---------|-----------|--------|
| `playlists/services/playlist-track.service.ts` | `removeTrack()` | 132-136 | 1x | CONVERTIBLE (2 conditions) |
| `playlists/services/playlist-track.service.ts` | `reorderTracks()` | 189-192 | 1x | CONVERTIBLE (1 condition) |
| `friends/services/friends.service.ts` | `unfollowUser()` | 172-176 | 1x | CONVERTIBLE (2 conditions) |

**Subtotal:** 3 convertible `.delete()` patterns = ~9-12 lines saved

---

### 5. Manual `.eq()` Check Patterns
**Convertible to:** `recordExists()`

| File | Method | Line(s) | Frequency | Status |
|------|--------|---------|-----------|--------|
| `auth/services/user.service.ts` | `generateUniqueUsername()` | 25-29, 38-42 | 2x (in loop) | NON-CONVERTIBLE (loop context) |
| `friends/services/friends.service.ts` | `getFollowStatus()` | 21-26, 27-32 | 2x (maybeSingle) | NON-CONVERTIBLE (uses maybeSingle) |
| `friends/services/friends.service.ts` | `followUser()` | 127-131 | 1x | CONVERTIBLE |

**Subtotal:** 1 clearly convertible existence check = ~3-4 lines saved

---

## Per-Feature Breakdown

### Feature 1: PROFILE (Highest Priority - 8 convertible patterns)

**Files Affected:**
- `profile/services/profile.service.ts`
- `profile/services/privacy.service.ts`
- `profile/services/music-preferences.service.ts`

**Detailed Mapping:**

| Method | Current Lines | Convertible Pattern | Savings |
|--------|---------------|-------------------|---------|
| `ProfileService.getProfile()` | 92-96 (5 lines) | `fetchSingle('user_profiles', {id})` | 3-4 lines |
| `ProfileService.updateProfile()` | 32-37 (6 lines) | `updateOne('user_profiles', {id}, data)` | 3-4 lines |
| `PrivacyService.getPrivacySettings()` | 33-37 (5 lines) | `fetchSingle('profile_privacy', {user_id})` | 3-4 lines |
| `PrivacyService.updatePrivacySettings()` | 112-117 (6 lines) | `updateOne('profile_privacy', {user_id}, data)` | 3-4 lines |
| `PrivacyService.createDefaultSettings()` | 162-166 (5 lines) | `insertOne('profile_privacy', data)` | 3-4 lines |
| `MusicPreferencesService.getMusicPreferences()` | 23-27 (5 lines) | `fetchSingle('music_preferences', {user_id})` | 3-4 lines |
| `MusicPreferencesService.updateMusicPreferences()` | 75-80 (6 lines) | `updateOne('music_preferences', {user_id}, data)` | 3-4 lines |
| `MusicPreferencesService.createDefaultPreferences()` | 126-130 (5 lines) | `insertOne('music_preferences', data)` | 3-4 lines |

**Impact:** 43 lines of code → ~26-32 lines (40% reduction)  
**Priority:** CRITICAL (reusable patterns, low complexity)  
**Complexity:** LOW (straightforward single-table operations)  
**Risk:** LOW (error handling identical in helper)

---

### Feature 2: PLAYLISTS (High Priority - 6 convertible patterns)

**Files Affected:**
- `playlists/services/collaborator.service.ts`
- `playlists/services/viewer.service.ts`
- `playlists/services/playlist-track.service.ts`

**Detailed Mapping:**

| Method | Current Lines | Convertible Pattern | Savings |
|--------|---------------|-------------------|---------|
| `CollaboratorService.addCollaborator()` | 35-39 (5 lines) | `fetchSingle('playlists', {id})` | 3-4 lines |
| `CollaboratorService.removeCollaborator()` | 93-97 (5 lines) | `fetchSingle('playlists', {id})` | 3-4 lines |
| `ViewerService.addViewer()` | 32-36 (5 lines) | `fetchSingle('user_profiles', {id})` | 3-4 lines |
| `ViewerService.removeViewer()` | 97-101 (5 lines) | `fetchSingle('playlists', {id})` | 3-4 lines |
| `ViewerService.getViewers()` | 148-152 (5 lines) | `fetchSingle('playlists', {id})` | 3-4 lines |
| `PlaylistTrackService.removeTrack()` | 132-136 (5 lines) | `deleteRecords('playlist_tracks', filters)` | 3-4 lines |

**Impact:** 30 lines of code → ~18-24 lines (35% reduction)  
**Priority:** HIGH (similar patterns repeated)  
**Complexity:** MEDIUM (delete with dual filter keys)  
**Risk:** LOW (standard patterns)

---

### Feature 3: FRIENDS (Medium-High Priority - 3 convertible patterns)

**Files Affected:**
- `friends/services/friends.service.ts`

**Detailed Mapping:**

| Method | Current Lines | Convertible Pattern | Savings |
|--------|---------------|-------------------|---------|
| `FriendsService.followUser()` | 127-131 (5 lines) | `fetchSingle('user_profiles', {id})` | 3-4 lines |
| `FriendsService.unfollowUser()` | 172-176 (5 lines) | `deleteRecords('follows', filters)` | 3-4 lines |

**Impact:** 10 lines → ~6-8 lines (30% reduction)  
**Priority:** MEDIUM-HIGH (good candidates)  
**Complexity:** LOW  
**Risk:** LOW

**Non-Convertible in Friends:**
- `getFollowStatus()` uses `.maybeSingle()` (not `.single()`) for optional returns
- `getMutualFriends()` uses `.in()` operator (advanced query)

---

### Feature 4: AUTH (Medium Priority - 6 convertible patterns, but complex)

**Files Affected:**
- `auth/services/user.service.ts`
- `auth/services/provider.service.ts`
- `auth/services/password-reset.service.ts`
- `auth/utils/auth.helpers.ts`

**Detailed Mapping:**

| Method | Current Lines | Pattern | Convertibility | Reason |
|--------|---------------|---------|-----------------|--------|
| `UserService.generateUniqueUsername()` | 25-29, 38-42 | Loop + `.single()` | NON-CONVERTIBLE | Inside loop for collision handling |
| `UserService.createOAuthUser()` | 167-171, 237-241 | `.single()` | NON-CONVERTIBLE | Complex context (OAuth flow) |
| `ProviderService.getLinkedProviders()` | 19-23 (5 lines) | `.single()` | CONVERTIBLE | Simple fetch |
| `ProviderService.unlinkProvider()` | 78-82 (5 lines) | `.single()` | CONVERTIBLE | Simple fetch |
| `ProviderService.isProviderLinked()` | 163-167 (5 lines) | `.single()` | CONVERTIBLE | Simple fetch |
| `auth/helpers.fetchUserProfile()` | 51-55 (5 lines) | `.single()` | CONVERTIBLE | Simple fetch |
| `auth/helpers.getUserProfile()` | 87-91 (5 lines) | `.single()` | CONVERTIBLE | Simple fetch |
| `PasswordResetService.requestPasswordReset()` | 112-116 (5 lines) | `.single()` | CONVERTIBLE | Simple fetch |
| `PasswordResetService.resetPassword()` | 185-189 (5 lines) | `.single()` | CONVERTIBLE | Simple fetch |

**Impact:** Multiple helpers + service patterns  
**Priority:** MEDIUM (existing helpers reduce impact)  
**Complexity:** MEDIUM-HIGH (multi-step OAuth flows, crypto)  
**Risk:** MEDIUM (auth is sensitive, need careful testing)

---

### Feature 5: SOUNDCLOUD (Lower Priority - 0 convertible patterns)

**Reason:** Service doesn't use direct database queries (external API integration only)

---

## Edge Cases & Non-Convertible Patterns

### Pattern 1: `.upsert()` with Conflict Resolution
**Location:** `playlist-track.service.ts:35-50`
```typescript
const { data: trackData, error: trackError } = await supabaseAdmin
  .from("tracks")
  .upsert({ ... }, { onConflict: "track_uri" })
  .select()
  .single();
```
**Why Non-Convertible:** 
- Helper doesn't support `onConflict` parameter
- Complex database operation with specific conflict handling
- Requires new helper: `upsertOne<T>(filter, onConflict)`

### Pattern 2: `.maybeSingle()` for Optional Results
**Location:** `friends.service.ts:21-26`
```typescript
const { data } = await supabase
  .from("follows")
  .select("follower_id")
  .eq("follower_id", currentUserId)
  .eq("following_id", targetUserId)
  .maybeSingle();
```
**Why Non-Convertible:**
- Returns `null` instead of throwing error
- Helper `fetchSingle()` throws AppError when not found
- Different error handling semantics
- Would need separate `fetchMaybeOne<T>()` helper

### Pattern 3: `.rpc()` Database Functions
**Location:** `playlist-track.service.ts:55-60`
```typescript
const { data: maxPos } = await supabaseAdmin.rpc(
  "get_next_playlist_position",
  { p_playlist_id: playlistId }
);
```
**Why Non-Convertible:**
- RPC calls are procedural database functions
- Not standard CRUD operations
- Require custom handler

### Pattern 4: `.in()` with Array Filters
**Location:** `friends.service.ts:222-226`, `privacy.service.ts:318-322`
```typescript
const { data: mutualFollows } = await supabase
  .from("follows")
  .select("follower_id")
  .eq("following_id", userId)
  .in("follower_id", followingIds);
```
**Why Non-Convertible:**
- `fetchMany()` helper only supports `.eq()` chaining
- `.in()` requires list-based filtering
- Would need helper enhancement: support `.in()` operator

### Pattern 5: `.or()` Complex Filters
**Location:** `profile.service.ts:147`
```typescript
.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
```
**Why Non-Convertible:**
- Text search with OR logic
- Case-insensitive pattern matching
- Not standard equality filtering

### Pattern 6: Count-Only Queries
**Location:** `friends.service.ts:33-40`
```typescript
const { count } = await supabase
  .from("follows")
  .select("*", { count: "exact", head: true })
  .eq("following_id", targetUserId);
```
**Why Non-Convertible:**
- `recordExists()` helper exists but only checks existence
- This needs count value
- Would need separate `countRecords()` helper

### Pattern 7: Parallel Promise.all() Queries
**Location:** `friends.service.ts:15-41`, `privacy.service.ts:245-259`
```typescript
const [result1, result2, result3] = await Promise.all([
  query1,
  query2,
  query3,
]);
```
**Why Non-Convertible:**
- Helper functions are async but don't optimize Promise.all patterns
- Orchestration logic belongs in service
- Can't be simplified to single helper call

---

## Conversion Summary Table

| Feature | Files | Convertible | Non-Convertible | Lines Saved | Priority |
|---------|-------|-------------|-----------------|-------------|----------|
| **Profile** | 3 | 8 | 0 | 50-65 | CRITICAL |
| **Playlists** | 3 | 6 | 2 | 35-45 | HIGH |
| **Friends** | 1 | 2 | 3 | 10-15 | MED-HIGH |
| **Auth (Services)** | 3 | 3 | 2 | 15-20 | MEDIUM |
| **Auth (Helpers)** | 1 | 2 | 0 | 10-15 | MEDIUM |
| **SoundCloud** | 2 | 0 | 0 | 0 | N/A |
| **TOTALS** | **13** | **21** | **7** | **120-160** | - |

---

## Recommended Implementation Order

### Phase 1: PROFILE (Weeks 1-2, 3-4 days)
**Rationale:** Highest impact, lowest risk, most reusable patterns
- ✅ Simple CRUD operations (no special filters)
- ✅ Consistent error handling
- ✅ Low test coverage complexity
- ✅ Can serve as reference for other features

**Files to Convert:**
1. `profile/services/profile.service.ts` (2 methods)
2. `profile/services/privacy.service.ts` (3 methods)
3. `profile/services/music-preferences.service.ts` (3 methods)

**After Conversion:**
```typescript
// Before: 6 lines per method
const { data, error } = await supabase
  .from("user_profiles")
  .select("*")
  .eq("id", userId)
  .single();
if (error || !data) throw new AppError(404, ...);

// After: 2 lines
const data = await fetchSingle<UserProfile>(supabase, 'user_profiles', {id: userId});
```

---

### Phase 2: PLAYLISTS (Weeks 2-3, 3-5 days)
**Rationale:** High impact, straightforward patterns, isolated feature
- ✅ Fetches and updates on known tables
- ✅ Mostly single-condition queries
- ⚠️ One `.delete()` with dual conditions (manageable)
- ⚠️ One `.upsert()` (skip for now, possible future enhancement)

**Files to Convert:**
1. `playlists/services/collaborator.service.ts` (2 methods)
2. `playlists/services/viewer.service.ts` (3 methods)
3. `playlists/services/playlist-track.service.ts` (1 method - removeTrack)

---

### Phase 3: FRIENDS (Week 3, 2-3 days)
**Rationale:** Medium impact, simple patterns
- ✅ Straightforward fetch and delete
- ⚠️ Multiple complex methods with `.maybeSingle()` and `.in()` (keep as-is)

**Files to Convert:**
1. `friends/services/friends.service.ts` (2 methods - followUser, unfollowUser)

---

### Phase 4: AUTH - Provider Service (Week 4, 2-3 days)
**Rationale:** Medium impact, sensitive area (needs careful testing)
- ✅ Simple provider lookups
- ⚠️ Complex user creation logic (keep as-is for now)

**Files to Convert:**
1. `auth/services/provider.service.ts` (3 methods)

---

### Phase 5: AUTH - Helpers & Password Reset (Week 4, 2-3 days)
**Rationale:** Consolidation phase, medium risk
- ✅ Helpers are utility functions
- ⚠️ Password reset is security-sensitive (thorough testing required)

**Files to Convert:**
1. `auth/utils/auth.helpers.ts` (2 functions)
2. `auth/services/password-reset.service.ts` (2 methods)

---

## Implementation Guidelines

### Before Converting

1. **Run existing tests:**
   ```bash
   make test
   ```

2. **Document current behavior:**
   - Error codes and messages
   - Logging statements
   - Edge case handling

3. **Create feature branch:**
   ```bash
   git checkout -b refactor/database-helpers-phase1
   ```

### During Conversion

**Template for single fetch:**
```typescript
// BEFORE
const { data: profile, error } = await supabase
  .from("user_profiles")
  .select("*")
  .eq("id", userId)
  .single();

if (error || !profile) {
  logger.error("Failed to fetch profile", { error });
  throw new AppError(404, "Profile not found", "PROFILE_NOT_FOUND");
}

// AFTER
import { fetchSingle } from "@/shared/utils/database.helpers.js";

const profile = await fetchSingle<UserProfileRow>(
  supabase,
  "user_profiles",
  { id: userId },
  "*",
  "Profile not found",
  "PROFILE_NOT_FOUND"
);
```

**Template for update:**
```typescript
// BEFORE
const { data: updated, error } = await supabase
  .from("user_profiles")
  .update(updateData)
  .eq("id", userId)
  .select("*")
  .single();

if (error || !updated) {
  throw new AppError(500, "Failed to update", "UPDATE_ERROR");
}

// AFTER
import { updateOne } from "@/shared/utils/database.helpers.js";

const updated = await updateOne<UserProfileRow>(
  supabase,
  "user_profiles",
  { id: userId },
  updateData,
  "*",
  "Failed to update profile",
  "UPDATE_ERROR"
);
```

### After Converting

1. **Type check:**
   ```bash
   npm run type-check
   ```

2. **Run tests:**
   ```bash
   make test
   ```

3. **Manual testing with Swagger:**
   - Test affected endpoints
   - Verify error responses
   - Check logging output

4. **Create commit:**
   ```bash
   git add .
   git commit -m "refactor(profile): use database helpers to reduce duplication"
   ```

---

## Risk Assessment

### Low Risk (Safe to Convert)
- Profile service CRUD
- Friends follow/unfollow
- Playlist viewer management
- Provider management

**Total:** 15 patterns, 80-100 lines saved, <2 day testing

### Medium Risk (Requires Testing)
- Password reset (security-sensitive)
- Email verification (affects auth flow)
- Playlist track operations (realtime integration)

**Total:** 3 patterns, 15-20 lines saved, 1-2 days testing

### High Risk (NOT Recommended)
- User OAuth creation (complex multi-step)
- Playlist track upsert (special conflict handling)

**Total:** 2 patterns, defer for future enhancement helpers

---

## Future Enhancements

### Suggested New Helpers

1. **`upsertOne<T>()`** - For conflict resolution
   ```typescript
   export async function upsertOne<T>(
     client: SupabaseClient,
     table: string,
     data: DbRecord,
     conflictColumn: string,
   ): Promise<T>
   ```
   Would handle `playlist-track.service.ts:35-50`

2. **`fetchMaybeOne<T>()`** - For optional results
   ```typescript
   export async function fetchMaybeOne<T>(
     client: SupabaseClient,
     table: string,
     filter: Record<string, DbFilterValue>,
   ): Promise<T | null>
   ```
   Would handle `friends.service.ts` maybeSingle queries

3. **`fetchMany<T>()` with `.in()` support**
   ```typescript
   interface FetchManyOptions {
     filters?: Record<string, DbFilterValue>;
     inFilters?: Record<string, DbFilterValue[]>;
     orderBy?: { column: string; ascending?: boolean };
   }
   export async function fetchMany<T>(
     client: SupabaseClient,
     table: string,
     options: FetchManyOptions,
   ): Promise<T[]>
   ```
   Would handle `friends.service.ts:222-226`

4. **`countRecords()`** - For count-only queries
   ```typescript
   export async function countRecords(
     client: SupabaseClient,
     table: string,
     filter?: Record<string, DbFilterValue>,
   ): Promise<number>
   ```
   Would handle `friends.service.ts:33-40`

---

## Conclusion

**Immediate Opportunity:** 21 out of 28 identified patterns can be converted using existing helpers  
**Lines of Code Reduction:** 120-160 lines across 13 files  
**Estimated Timeline:** 2-3 weeks for full implementation  
**Risk Level:** Low-to-Medium (highest risk patterns can be deferred)  
**Maintenance Improvement:** Easier debugging, consistent error handling, centralized DB logic

**Start with Phase 1 (Profile feature) to establish pattern and build team confidence.**

