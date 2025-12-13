# SoundCloud Integration Migration Plan

## Table of Contents
1. [Overview](#overview)
2. [Why SoundCloud?](#why-soundcloud)
3. [Architecture Overview](#architecture-overview)
4. [Backend Implementation](#backend-implementation)
5. [Mobile Implementation](#mobile-implementation)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Checklist](#deployment-checklist)

---

## Overview

This document outlines the complete migration plan from Spotify to SoundCloud for the Music Room application. The migration adopts a **simplified, public API approach** that does not require OAuth authentication, making it easier to implement and maintain.

### Key Changes from Spotify
- **No OAuth required**: Direct API access using client_id
- **Simpler architecture**: 1 search endpoint (vs 6 Spotify endpoints)
- **Real streaming**: Full track streaming (not just 30s previews)
- **No user connections**: Music discovery without account linking

### Migration Status
- ✅ **Spotify Removed**: All Spotify code, types, and database schema cleaned up
- ⏳ **SoundCloud Implementation**: Ready to implement (this document)

---

## Why SoundCloud?

### Advantages over Spotify

| Feature | Spotify | SoundCloud |
|---------|---------|------------|
| **Authentication** | OAuth 2.0 required | Public API (client_id only) |
| **Streaming** | 30s previews only | Full track streaming (where available) |
| **API Complexity** | 6 endpoints + OAuth flow | 1 search endpoint |
| **Architecture** | Complex (tokens, refresh, state management) | Simple (direct API calls) |
| **Track Availability** | Mainstream catalog | Indie + remixes + user uploads |
| **Playback Control** | Requires Spotify Premium + SDK | Direct stream URLs |

### SoundCloud API Capabilities

1. **Search**: Query tracks, users, playlists
2. **Streaming URLs**: Direct access to AAC HLS streams
3. **Track Metadata**: Title, artist, artwork, duration
4. **Public Access**: No user authentication needed
5. **Attribution**: Credit uploader automatically via API data

### Limitations to Consider

⚠️ **Not all tracks are streamable**:
- Some tracks are set to private by uploaders
- Geo-restrictions may apply
- Use `access: playable` filter to get streamable tracks only

⚠️ **Rate Limits**:
- Public API has rate limits
- Monitor usage and implement caching if needed

⚠️ **Legacy Format Deprecation**:
- MP3/Opus streams removed Dec 31, 2025
- Use AAC HLS only (`hls_aac_160_url`)

---

## Architecture Overview

### Data Flow

```
User Input (Search Query)
    ↓
Mobile App (SoundCloudSearchScreen)
    ↓
Mobile Store (soundcloudStore.ts)
    ↓
Backend API (/api/soundcloud/search)
    ↓
SoundCloud Service (soundcloud.service.ts)
    ↓
SoundCloud Public API (api.soundcloud.com)
    ↓
Return Results (Track metadata + stream URLs)
    ↓
Mobile Display + Playback
```

### Component Architecture

#### Backend
```
backend/src/features/soundcloud/
├── soundcloud.types.ts          # TypeScript types
├── soundcloud.validators.ts     # Zod schemas
├── soundcloud.service.ts        # SoundCloud API integration
├── soundcloud.controller.ts     # Express handlers
├── soundcloud.routes.ts         # API routes
└── index.ts                     # Exports
```

#### Mobile
```
mobile/src/
├── store/soundcloudStore.ts                       # Zustand state
├── screens/search/SoundCloudSearchScreen.tsx      # Search UI
├── screens/search/components/
│   ├── SoundCloudTrackItem.tsx                   # Track display
│   └── PlaylistSelectorModal.tsx                 # Add to playlist
└── types/index.ts                                # Type definitions
```

---

## Backend Implementation

### Step 1: Environment Configuration

**File**: `backend/.env`

```bash
# SoundCloud API
SOUNDCLOUD_CLIENT_ID=your-soundcloud-client-id
```

**Getting the Client ID**:
1. Go to https://soundcloud.com/you/apps
2. Register a new app
3. Copy the Client ID

**File**: `backend/src/shared/config/env.ts`

```typescript
const envSchema = z.object({
  // ... existing fields
  SOUNDCLOUD_CLIENT_ID: z.string().min(1, 'SoundCloud client ID is required'),
});
```

### Step 2: Create SoundCloud Types

**File**: `backend/src/features/soundcloud/soundcloud.types.ts`

```typescript
/**
 * SoundCloud Track from API
 */
export interface SoundCloudTrack {
  id: number;
  title: string;
  description: string | null;
  duration: number; // milliseconds
  genre: string | null;
  tag_list: string;
  artwork_url: string | null;
  stream_url: string;
  permalink_url: string;
  user: {
    id: number;
    username: string;
    avatar_url: string | null;
    permalink_url: string;
  };
  playback_count: number;
  likes_count: number;
  access: 'playable' | 'preview' | 'blocked';
  media: {
    transcodings: Array<{
      url: string;
      preset: string; // e.g., "hls_aac_160"
      format: {
        protocol: string; // e.g., "hls"
        mime_type: string; // e.g., "audio/aac"
      };
    }>;
  };
}

/**
 * SoundCloud Search Response
 */
export interface SoundCloudSearchResponse {
  collection: SoundCloudTrack[];
  total_results: number;
  next_href: string | null;
  query_urn: string | null;
}

/**
 * SoundCloud Search Query DTO
 */
export interface SoundCloudSearchQuery {
  q: string; // search query
  limit?: number; // results per page (default: 20)
  offset?: number; // pagination offset
  access?: 'playable' | 'preview' | 'blocked';
}

/**
 * Internal Track format (for adding to playlists)
 */
export interface TrackDTO {
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  durationMs: number;
  trackUri: string; // Will contain SoundCloud permalink instead
  previewUrl: string;
}
```

### Step 3: Create Validators

**File**: `backend/src/features/soundcloud/soundcloud.validators.ts`

```typescript
import { z } from 'zod';

export const soundcloudSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  limit: z.coerce.number().int().min(1).max(200).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  access: z.enum(['playable', 'preview', 'blocked']).optional(),
});

export type SoundCloudSearchInput = z.infer<typeof soundcloudSearchSchema>;
```

### Step 4: Create Service Layer

**File**: `backend/src/features/soundcloud/soundcloud.service.ts`

```typescript
import { env } from '@/shared/config/env.js';
import { logger } from '@/shared/utils/logger.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { SoundCloudSearchQuery, SoundCloudSearchResponse, TrackDTO } from './soundcloud.types.js';

const SOUNDCLOUD_API_BASE = 'https://api-v2.soundcloud.com';

export class SoundCloudService {
  /**
   * Search SoundCloud tracks
   */
  async searchTracks(query: SoundCloudSearchQuery): Promise<SoundCloudSearchResponse> {
    try {
      const params = new URLSearchParams({
        q: query.q,
        client_id: env.SOUNDCLOUD_CLIENT_ID,
        limit: (query.limit || 20).toString(),
        offset: (query.offset || 0).toString(),
      });

      if (query.access) {
        params.append('filter.access', query.access);
      }

      const url = `${SOUNDCLOUD_API_BASE}/search/tracks?${params.toString()}`;
      logger.info('Searching SoundCloud', { query: query.q, limit: query.limit });

      const response = await fetch(url);

      if (!response.ok) {
        throw new AppError(
          response.status,
          `SoundCloud API error: ${response.statusText}`,
          'SOUNDCLOUD_API_ERROR'
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('SoundCloud search failed', { error });
      throw new AppError(500, 'Failed to search SoundCloud', 'SOUNDCLOUD_ERROR');
    }
  }

  /**
   * Get stream URL for a track
   * Extracts the AAC HLS stream URL from track media
   */
  async getStreamUrl(trackId: number): Promise<string | null> {
    try {
      const url = `${SOUNDCLOUD_API_BASE}/tracks/${trackId}?client_id=${env.SOUNDCLOUD_CLIENT_ID}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new AppError(response.status, 'Failed to fetch track', 'SOUNDCLOUD_ERROR');
      }

      const track = await response.json();

      // Find AAC HLS stream (preferred format)
      const aacHls = track.media?.transcodings?.find(
        (t: any) => t.preset === 'hls_aac_160' || t.format?.protocol === 'hls'
      );

      if (!aacHls) {
        logger.warn('No stream URL available for track', { trackId });
        return null;
      }

      // Get the actual stream URL (requires additional request)
      const streamResponse = await fetch(`${aacHls.url}?client_id=${env.SOUNDCLOUD_CLIENT_ID}`);
      if (!streamResponse.ok) return null;

      const streamData = await streamResponse.json();
      return streamData.url || null;
    } catch (error) {
      logger.error('Failed to get stream URL', { error, trackId });
      return null;
    }
  }

  /**
   * Convert SoundCloud track to internal Track format
   */
  convertToTrackDTO(track: any): TrackDTO {
    return {
      title: track.title,
      artist: track.user.username,
      album: track.genre || 'Unknown',
      albumArt: track.artwork_url || track.user.avatar_url || '',
      durationMs: track.duration,
      trackUri: track.permalink_url, // Use permalink as identifier
      previewUrl: track.stream_url || '',
    };
  }
}
```

### Step 5: Create Controller

**File**: `backend/src/features/soundcloud/soundcloud.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { SoundCloudService } from './soundcloud.service.js';
import { soundcloudSearchSchema } from './soundcloud.validators.js';
import { logger } from '@/shared/utils/logger.js';

const soundcloudService = new SoundCloudService();

export class SoundCloudController {
  /**
   * Search tracks
   * GET /api/soundcloud/search?q=query&limit=20&offset=0
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = soundcloudSearchSchema.parse(req.query);
      const results = await soundcloudService.searchTracks(query);

      return res.json({
        success: true,
        data: results,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stream URL for a track
   * GET /api/soundcloud/stream/:trackId
   */
  async getStreamUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const trackId = parseInt(req.params.trackId, 10);
      if (isNaN(trackId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid track ID', code: 'INVALID_TRACK_ID' },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      const streamUrl = await soundcloudService.getStreamUrl(trackId);

      if (!streamUrl) {
        return res.status(404).json({
          success: false,
          error: { message: 'Stream URL not available', code: 'STREAM_NOT_FOUND' },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      return res.json({
        success: true,
        data: { streamUrl },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### Step 6: Create Routes

**File**: `backend/src/features/soundcloud/soundcloud.routes.ts`

```typescript
import { Router } from 'express';
import { SoundCloudController } from './soundcloud.controller.js';

const router = Router();
const controller = new SoundCloudController();

// Public routes (no authentication required)
router.get('/search', controller.search.bind(controller));
router.get('/stream/:trackId', controller.getStreamUrl.bind(controller));

export { router as soundcloudRoutes };
```

### Step 7: Create Index

**File**: `backend/src/features/soundcloud/index.ts`

```typescript
export { soundcloudRoutes } from './soundcloud.routes.js';
export * from './soundcloud.types.js';
export * from './soundcloud.validators.js';
export { SoundCloudService } from './soundcloud.service.js';
```

### Step 8: Register Routes

**File**: `backend/src/server.ts`

```typescript
// Add import
import { soundcloudRoutes } from './features/soundcloud/index.js';

// Add route
app.use('/api/soundcloud', soundcloudRoutes);

// Add to startup logs
logger.info(`🎵 SoundCloud API: http://localhost:${PORT}/api/soundcloud`);
```

---

## Mobile Implementation

### Step 1: Create Types

**File**: `mobile/src/types/index.ts`

Add these types:

```typescript
// SoundCloud Types
export interface SoundCloudTrack {
  id: number;
  title: string;
  duration: number;
  artwork_url: string | null;
  stream_url: string;
  permalink_url: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
  access: 'playable' | 'preview' | 'blocked';
}

export interface SoundCloudSearchResult {
  collection: SoundCloudTrack[];
  total_results: number;
  next_href: string | null;
}
```

### Step 2: Create Zustand Store

**File**: `mobile/src/store/soundcloudStore.ts`

```typescript
import { create } from 'zustand';
import type { SoundCloudSearchResult, SoundCloudTrack } from '@types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface SoundCloudState {
  searchResults: SoundCloudTrack[];
  isSearching: boolean;
  error: string | null;
  totalResults: number;
  nextHref: string | null;

  // Actions
  search: (query: string, limit?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
}

export const useSoundCloudStore = create<SoundCloudState>((set, get) => ({
  searchResults: [],
  isSearching: false,
  error: null,
  totalResults: 0,
  nextHref: null,

  search: async (query: string, limit = 20) => {
    if (!query.trim()) {
      set({ searchResults: [], totalResults: 0, nextHref: null });
      return;
    }

    set({ isSearching: true, error: null });

    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        access: 'playable', // Only get streamable tracks
      });

      const response = await fetch(`${API_URL}/api/soundcloud/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        set({
          searchResults: data.data.collection || [],
          totalResults: data.data.total_results || 0,
          nextHref: data.data.next_href,
          isSearching: false,
        });
      } else {
        throw new Error(data.error?.message || 'Search failed');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        isSearching: false,
        searchResults: [],
      });
    }
  },

  loadMore: async () => {
    const { nextHref, searchResults } = get();
    if (!nextHref || get().isSearching) return;

    set({ isSearching: true });

    try {
      const response = await fetch(nextHref);
      if (!response.ok) {
        throw new Error('Failed to load more results');
      }

      const data = await response.json();

      set({
        searchResults: [...searchResults, ...(data.collection || [])],
        nextHref: data.next_href,
        isSearching: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load more',
        isSearching: false,
      });
    }
  },

  clearSearch: () => {
    set({
      searchResults: [],
      totalResults: 0,
      nextHref: null,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
```

### Step 3: Create Search Screen

**File**: `mobile/src/screens/search/SoundCloudSearchScreen.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@contexts';
import { useSoundCloudStore } from '@/store/soundcloudStore';
import { SoundCloudTrackItem } from './components/SoundCloudTrackItem';
import { PlaylistSelectorModal } from './components/PlaylistSelectorModal';
import { LoadingSpinner } from '@components/common';
import debounce from 'lodash/debounce';

export function SoundCloudSearchScreen() {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const { searchResults, isSearching, error, search, loadMore, clearSearch, clearError } =
    useSoundCloudStore();

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      search(query);
    }, 500),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      debouncedSearch(text);
    } else {
      clearSearch();
    }
  };

  const handleAddToPlaylist = (track: any) => {
    setSelectedTrack(track);
    setShowPlaylistModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Search SoundCloud</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for tracks..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSearching && searchResults.length === 0 ? (
        <LoadingSpinner size="large" />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <SoundCloudTrackItem track={item} onAddToPlaylist={handleAddToPlaylist} />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptyText}>No tracks found</Text>
            ) : (
              <Text style={styles.emptyText}>Start searching for music</Text>
            )
          }
        />
      )}

      <PlaylistSelectorModal
        visible={showPlaylistModal}
        track={selectedTrack}
        onClose={() => setShowPlaylistModal(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '20',
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
    },
    dismissText: {
      color: theme.colors.error,
      fontWeight: theme.typography.weights.semibold,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xl,
      fontSize: 16,
    },
  });
```

### Step 4: Create Track Item Component

**File**: `mobile/src/screens/search/components/SoundCloudTrackItem.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@contexts';
import type { SoundCloudTrack } from '@types';

interface Props {
  track: SoundCloudTrack;
  onAddToPlaylist: (track: SoundCloudTrack) => void;
}

export function SoundCloudTrackItem({ track, onAddToPlaylist }: Props) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: track.artwork_url || track.user.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.artwork}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.user.username}
        </Text>
        <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => onAddToPlaylist(track)}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    artwork: {
      width: 50,
      height: 50,
      borderRadius: theme.borderRadius.sm,
      marginRight: theme.spacing.md,
    },
    info: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    artist: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    duration: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: 24,
      color: theme.colors.background,
      fontWeight: theme.typography.weights.bold,
    },
  });
```

### Step 5: Create Playlist Selector Modal

**File**: `mobile/src/screens/search/components/PlaylistSelectorModal.tsx`

```typescript
import React from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@contexts';
import { usePlaylistStore } from '@/store/playlistStore';
import type { SoundCloudTrack } from '@types';

interface Props {
  visible: boolean;
  track: SoundCloudTrack | null;
  onClose: () => void;
}

export function PlaylistSelectorModal({ visible, track, onClose }: Props) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { playlists, addTrack } = usePlaylistStore();

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!track) return;

    // Convert SoundCloud track to internal format
    const internalTrack = {
      title: track.title,
      artist: track.user.username,
      album: 'SoundCloud',
      albumArt: track.artwork_url || track.user.avatar_url || '',
      durationMs: track.duration,
      trackUri: track.permalink_url,
      previewUrl: track.stream_url,
    };

    await addTrack(playlistId, internalTrack);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add to Playlist</Text>
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.playlistItem} onPress={() => handleSelectPlaylist(item.id)}>
                <Text style={styles.playlistName}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No playlists available</Text>}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modal: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      maxHeight: '80%',
    },
    title: {
      fontSize: 20,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    playlistItem: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    playlistName: {
      fontSize: 16,
      color: theme.colors.text,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      marginVertical: theme.spacing.lg,
    },
    closeButton: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.semibold,
    },
  });
```

---

## Testing Strategy

### Backend Tests

1. **Environment Configuration**
   ```bash
   # Test that SOUNDCLOUD_CLIENT_ID is loaded
   cd backend
   echo $SOUNDCLOUD_CLIENT_ID
   ```

2. **Search Endpoint**
   ```bash
   # Test search
   curl "http://localhost:3000/api/soundcloud/search?q=lofi&limit=5"

   # Test with access filter
   curl "http://localhost:3000/api/soundcloud/search?q=jazz&limit=10&access=playable"
   ```

3. **Stream URL Endpoint**
   ```bash
   # Get stream URL for a track
   curl "http://localhost:3000/api/soundcloud/stream/123456789"
   ```

### Mobile Tests

1. **Search Functionality**
   - Type search query
   - Verify debounce works (500ms delay)
   - Verify results display correctly
   - Test "Load More" pagination

2. **Add to Playlist**
   - Search for track
   - Click "+" button
   - Select playlist from modal
   - Verify track added to playlist

3. **Error Handling**
   - Test with no network
   - Test with invalid search
   - Test with empty results

### Integration Tests

1. **End-to-End Flow**
   - Search "lofi hip hop"
   - Add track to "Chill Vibes" playlist
   - Navigate to PlaylistDetail
   - Verify track appears in list

---

## Deployment Checklist

### Prerequisites
- [ ] SoundCloud account created
- [ ] App registered at soundcloud.com/you/apps
- [ ] Client ID obtained

### Backend Deployment
- [ ] Add `SOUNDCLOUD_CLIENT_ID` to production `.env`
- [ ] Deploy backend with soundcloud feature
- [ ] Test `/api/soundcloud/search` endpoint in production
- [ ] Monitor rate limits and API usage

### Mobile Deployment
- [ ] Update `EXPO_PUBLIC_API_URL` to production backend
- [ ] Build and deploy mobile app
- [ ] Test search functionality on real devices
- [ ] Monitor error rates and performance

### Documentation
- [ ] Update `CLAUDE.md` with SoundCloud section
- [ ] Update `README.md` with SoundCloud info
- [ ] Update `backend/API_DOCUMENTATION.md`
- [ ] Remove all Spotify references from docs

### Post-Deployment
- [ ] Execute database migration `004_remove_spotify.sql`
- [ ] Verify no errors in production logs
- [ ] Test user workflows (search, add to playlist, playback)
- [ ] Gather user feedback

---

## Next Steps

After implementing SoundCloud:

1. **Audio Playback Enhancement**
   - Implement native audio player for HLS streams
   - Add play/pause/seek controls
   - Queue management

2. **Offline Support**
   - Cache search results
   - Save favorite tracks locally
   - Offline playlist playback

3. **Social Features**
   - Share tracks with friends
   - Collaborative playlists with SoundCloud tracks
   - Track recommendations

---

## Support & Resources

- **SoundCloud API Docs**: https://developers.soundcloud.com/docs
- **SoundCloud API Explorer**: https://developers.soundcloud.com/docs/api/explorer
- **Rate Limits**: Monitor usage at soundcloud.com/you/apps
- **Community**: SoundCloud Developers Forum

---

## Changelog

- **2025-12-13**: Initial migration plan created
- **2025-12-13**: Spotify removal completed
