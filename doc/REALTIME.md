# Architecture Realtime - Socket.io

Ce document décrit l'architecture temps réel de Music Room basée sur Socket.io.

## Vue d'ensemble

Music Room utilise Socket.io pour les communications temps réel entre le backend et les clients mobiles. L'architecture est conçue pour être **modulaire** et **scalable**.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │  Socket.io      │     │    Backend      │
│                 │◄───►│    Server       │◄────│    Services     │
│  socketStore    │     │                 │     │                 │
│  useXxxSocket   │     │  Rooms:         │     │  realtime.      │
│                 │     │  playlist:{id}  │     │  notifyXxx()    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Architecture Backend

### Fichiers

```
backend/src/
  realtime/
    index.ts          # Service principal RealtimeService
```

### RealtimeService

Le service `RealtimeService` est un **singleton** qui gère toutes les connexions Socket.io.

```typescript
// backend/src/realtime/index.ts
import { realtime } from "./realtime/index.js";

// Initialisation (dans server.ts)
realtime.initialize(httpServer);

// Émettre un événement
realtime.notifyPlaylistUpdate(playlistId, "track_added");
```

### Événements côté serveur

| Événement reçu | Description |
|----------------|-------------|
| `playlist:join` | Client rejoint une room playlist |
| `playlist:leave` | Client quitte une room playlist |

| Événement émis | Payload | Description |
|----------------|---------|-------------|
| `playlist:updated` | `{ playlistId, event }` | Playlist modifiée |

## Architecture Mobile

### Fichiers

```
mobile/src/
  store/
    socketStore.ts      # Store Zustand pour la connexion
  hooks/
    usePlaylistSocket.ts  # Hook pour les playlists
```

### SocketStore

Store Zustand qui gère la connexion Socket.io globale.

```typescript
import { useSocketStore } from '@store/socketStore';

// Connexion (automatique à l'auth)
const connect = useSocketStore(state => state.connect);
const disconnect = useSocketStore(state => state.disconnect);

// État
const socket = useSocketStore(state => state.socket);
const isConnected = useSocketStore(state => state.isConnected);
```

### Hooks disponibles

#### usePlaylistSocket

Écoute les modifications d'une playlist en temps réel.

```typescript
import { usePlaylistSocket } from '@hooks/usePlaylistSocket';

function PlaylistDetailScreen({ id }) {
  const { fetchPlaylistById } = usePlaylistStore();
  
  const handleUpdate = useCallback(() => {
    fetchPlaylistById(id);
  }, [id, fetchPlaylistById]);

  usePlaylistSocket(id, handleUpdate);
}
```

## Ajouter une nouvelle feature temps réel

### Étape 1: Backend - Ajouter les handlers

Dans `backend/src/realtime/index.ts` :

```typescript
class RealtimeService {
  // ...existant...

  // 1. Ajouter la méthode d'enregistrement des handlers
  private registerPlayerHandlers(socket: Socket) {
    socket.on("player:join", (roomId: string) => {
      socket.join(`player:${roomId}`);
      logger.debug(`[Socket] ${socket.id} joined player:${roomId}`);
    });

    socket.on("player:leave", (roomId: string) => {
      socket.leave(`player:${roomId}`);
    });

    socket.on("player:action", (data: { roomId: string; action: string }) => {
      // Broadcast aux autres membres de la room
      socket.to(`player:${data.roomId}`).emit("player:action", data);
    });
  }

  // 2. Ajouter dans initialize()
  initialize(httpServer: HTTPServer) {
    // ...existant...
    this.io.on("connection", (socket) => {
      this.registerPlaylistHandlers(socket);
      this.registerPlayerHandlers(socket);  // <-- Ajouter ici
    });
  }

  // 3. Ajouter une méthode d'émission publique
  notifyPlayerState(roomId: string, state: PlayerState) {
    this.io?.to(`player:${roomId}`).emit("player:state", { roomId, state });
  }
}
```

### Étape 2: Mobile - Créer le hook

Créer `mobile/src/hooks/usePlayerSocket.ts` :

```typescript
import { useEffect, useCallback } from 'react';
import { useSocketStore } from '@store/socketStore';

interface PlayerState {
  isPlaying: boolean;
  currentTrackId: string | null;
  position: number;
}

export function usePlayerSocket(roomId: string) {
  const socket = useSocketStore(state => state.socket);
  const isConnected = useSocketStore(state => state.isConnected);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('player:join', roomId);

    return () => {
      socket.emit('player:leave', roomId);
    };
  }, [socket, isConnected, roomId]);

  // Actions
  const play = useCallback(() => {
    socket?.emit('player:action', { roomId, action: 'play' });
  }, [socket, roomId]);

  const pause = useCallback(() => {
    socket?.emit('player:action', { roomId, action: 'pause' });
  }, [socket, roomId]);

  const skip = useCallback(() => {
    socket?.emit('player:action', { roomId, action: 'skip' });
  }, [socket, roomId]);

  // Listener pour l'état
  const onStateChange = useCallback((callback: (state: PlayerState) => void) => {
    if (!socket) return () => {};
    
    socket.on('player:state', callback);
    return () => socket.off('player:state', callback);
  }, [socket]);

  return { play, pause, skip, onStateChange };
}
```

### Étape 3: Utiliser le hook

```typescript
function PlayerScreen({ roomId }) {
  const { play, pause, skip, onStateChange } = usePlayerSocket(roomId);
  const [state, setState] = useState<PlayerState | null>(null);

  useEffect(() => {
    return onStateChange(setState);
  }, [onStateChange]);

  return (
    <View>
      <Button onPress={play} title="Play" />
      <Button onPress={pause} title="Pause" />
      <Button onPress={skip} title="Skip" />
    </View>
  );
}
```

## Conventions de nommage

### Événements

Format: `{feature}:{action}`

| Feature | Actions |
|---------|---------|
| `playlist` | `join`, `leave`, `updated` |
| `player` | `join`, `leave`, `action`, `state` |
| `presence` | `join`, `leave`, `sync` |

### Rooms

Format: `{feature}:{id}`

- `playlist:uuid-xxx` - Room d'une playlist
- `player:uuid-xxx` - Room d'un player partagé
- `user:uuid-xxx` - Room personnelle d'un user

## Bonnes pratiques

### 1. Toujours nettoyer les listeners

```typescript
useEffect(() => {
  const handler = (data) => { /* ... */ };
  socket.on('event', handler);
  
  return () => {
    socket.off('event', handler);  // Important !
  };
}, []);
```

### 2. Utiliser useCallback pour les handlers

```typescript
// ✅ Bon
const handleUpdate = useCallback(() => {
  fetchData();
}, [fetchData]);

usePlaylistSocket(id, handleUpdate);

// ❌ Mauvais - crée un nouveau handler à chaque render
usePlaylistSocket(id, () => fetchData());
```

### 3. Vérifier la connexion avant d'émettre

```typescript
if (socket && isConnected) {
  socket.emit('event', data);
}
```

### 4. Logger les événements en dev

Les événements sont loggés automatiquement côté backend et mobile pour faciliter le debugging.

## Debugging

### Backend

Les logs Socket.io sont préfixés par `[Socket]` :

```
[Socket] Connected: abc123
[Socket] abc123 joined playlist:xyz789
[Socket] Emitted playlist:updated (track_added) to playlist:xyz789
```

### Mobile

Les logs sont visibles dans la console Metro :

```
[Socket] Connected: abc123
[Socket] Joined playlist room: xyz789
[Socket] Playlist updated: track_added
```

## Ressources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Socket.io Rooms](https://socket.io/docs/v4/rooms/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)

