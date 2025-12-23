# Music Room API Documentation

Version: 1.0.0
Base URL: `http://localhost:3000`

---

## Table des matières

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Auth Endpoints](#auth-endpoints)
- [Profile Endpoints](#profile-endpoints)
- [Playlist Endpoints](#playlist-endpoints)
- [SoundCloud Endpoints](#soundcloud-endpoints)
- [Friends Endpoints](#friends-endpoints)
- [Music Control Endpoints](#music-control-endpoints)

---

## Authentication

L'API utilise **JWT (JSON Web Tokens)** pour l'authentification via Supabase Auth.

### Comment s'authentifier

Ajoutez le token dans le header `Authorization` :

```
Authorization: Bearer <your_access_token>
```

### Obtenir un token

Utilisez l'endpoint `/api/auth/login` ou `/api/auth/register` pour obtenir un `access_token`.

---

## Response Format

Toutes les réponses de l'API suivent ce format standard :

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error message here",
    "code": "ERROR_CODE",
    "details": {} // Optional
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Données de requête invalides |
| `USERNAME_TAKEN` | Username déjà utilisé |
| `INVALID_CREDENTIALS` | Email ou mot de passe incorrect |
| `INVALID_TOKEN` | Token JWT invalide ou expiré |
| `NO_AUTH_HEADER` | Header Authorization manquant |
| `INVALID_AUTH_FORMAT` | Format Authorization header invalide |
| `USER_NOT_FOUND` | Utilisateur introuvable |
| `PROFILE_NOT_FOUND` | Profil utilisateur introuvable |
| `INTERNAL_ERROR` | Erreur serveur interne |

---

## Auth Endpoints

### 1. Register User

Créer un nouveau compte utilisateur.

**Endpoint:** `POST /api/auth/register`
**Auth required:** Non

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "john_doe",
  "displayName": "John Doe" // Optional
}
```

#### Validation Rules

- **email**: Format email valide
- **password**:
  - Minimum 8 caractères
  - Maximum 100 caractères
  - Au moins 1 majuscule
  - Au moins 1 minuscule
  - Au moins 1 chiffre
- **username**:
  - 3 à 20 caractères
  - Lettres, chiffres et underscores uniquement
  - Doit être unique
- **displayName**: Maximum 50 caractères (optionnel)

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
      "email": "user@example.com",
      "username": "john_doe",
      "displayName": "John Doe",
      "avatarUrl": null,
      "bio": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "s3cr3t_r3fr3sh_t0k3n",
      "expiresIn": 3600,
      "expiresAt": 1678886400
    }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

**Username déjà pris (409 Conflict)**
```json
{
  "success": false,
  "error": {
    "message": "Username already taken",
    "code": "USERNAME_TAKEN"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

**Validation error (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": "password",
        "message": "Password must contain at least one uppercase letter"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "username": "john_doe",
    "displayName": "John Doe"
  }'
```

---

### 2. Login

Authentifier un utilisateur existant.

**Endpoint:** `POST /api/auth/login`
**Auth required:** Non

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
      "email": "user@example.com",
      "username": "john_doe",
      "displayName": "John Doe",
      "avatarUrl": null,
      "bio": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "s3cr3t_r3fr3sh_t0k3n",
      "expiresIn": 3600,
      "expiresAt": 1678886400
    }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Error Response

**Invalid credentials (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

---

### 3. Get Current User

Récupérer le profil de l'utilisateur authentifié.

**Endpoint:** `GET /api/auth/me`
**Auth required:** ✅ Oui (Bearer token)

#### Request Headers

```
Authorization: Bearer <access_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
      "email": "user@example.com",
      "username": "john_doe",
      "displayName": "John Doe",
      "avatarUrl": null,
      "bio": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

**No token provided (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "message": "No authorization header provided",
    "code": "NO_AUTH_HEADER"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

**Invalid token (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "INVALID_TOKEN"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### cURL Example

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. Logout

Déconnecter l'utilisateur (principalement côté client).

**Endpoint:** `POST /api/auth/logout`
**Auth required:** ✅ Oui (Bearer token)

#### Request Headers

```
Authorization: Bearer <access_token>
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### cURL Example

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Note:** Le logout est principalement géré côté client en supprimant le token. Cet endpoint sert à logger l'événement côté serveur.

---

## Health Check

Vérifier l'état du serveur.

**Endpoint:** `GET /health`
**Auth required:** Non

#### Success Response (200 OK)

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 12345.678,
  "environment": "development"
}
```

#### cURL Example

```bash
curl http://localhost:3000/health
```

---

## Postman Collection

### Variables d'environnement

Créez ces variables dans Postman :

```json
{
  "base_url": "http://localhost:3000",
  "access_token": ""
}
```

### Tests automatiques

Ajoutez ce script dans l'onglet "Tests" de la requête Login/Register pour sauvegarder automatiquement le token :

```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const response = pm.response.json();
    if (response.success && response.data.session) {
        pm.environment.set("access_token", response.data.session.accessToken);
        console.log("Token saved:", response.data.session.accessToken);
    }
}
```

---

## Rate Limiting

**Status:** À implémenter (Phase future)

Limites prévues :
- 100 requêtes / minute par IP
- 10 tentatives de login / heure par email

---

## Versioning

**Version actuelle:** v1
**Base path:** `/api`

Les versions futures utiliseront le pattern : `/api/v2`, `/api/v3`, etc.

---

## Support

Pour toute question ou bug :
- GitHub Issues : [Votre repo]
- Email : [Votre email]

---

## Profile Endpoints

### 1. Get Own Profile

Récupérer le profil de l'utilisateur authentifié.

**Endpoint:** `GET /api/profile/me`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
    "username": "john_doe",
    "displayName": "John Doe",
    "email": "user@example.com",
    "avatarUrl": "https://example.com/avatar.jpg",
    "bio": "Music enthusiast 🎵",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

#### cURL Example

```bash
curl http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer <token>"
```

---

### 2. Update Profile

Mettre à jour le profil de l'utilisateur authentifié.

**Endpoint:** `PUT /api/profile/me`
**Auth required:** ✅ Oui (Bearer token)

#### Request Body

```json
{
  "displayName": "John Doe Updated",
  "bio": "Music lover and playlist curator 🎧",
  "avatarUrl": "https://example.com/new-avatar.jpg"
}
```

Tous les champs sont optionnels.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
    "username": "john_doe",
    "displayName": "John Doe Updated",
    "email": "user@example.com",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "bio": "Music lover and playlist curator 🎧",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

#### cURL Example

```bash
curl -X PUT http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Doe Updated",
    "bio": "Music lover and playlist curator 🎧"
  }'
```

---

### 3. Get User Profile

Récupérer le profil public d'un autre utilisateur.

**Endpoint:** `GET /api/profile/:userId`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "f12g3h4i-2b3c-4d5e-6f7g-8h9i0j1k2l3m",
    "username": "jane_smith",
    "displayName": "Jane Smith",
    "avatarUrl": "https://example.com/jane-avatar.jpg",
    "bio": "Indie rock fan",
    "createdAt": "2025-01-10T08:20:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

**Note:** L'email n'est pas inclus dans les profils publics.

#### cURL Example

```bash
curl http://localhost:3000/api/profile/f12g3h4i-2b3c-4d5e-6f7g-8h9i0j1k2l3m \
  -H "Authorization: Bearer <token>"
```

---

## Playlist Endpoints

### 1. Get All Playlists

Récupérer toutes les playlists accessibles par l'utilisateur authentifié (owned, collaborated, or public).

**Endpoint:** `GET /api/playlists`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
      "name": "Chill Vibes",
      "description": "Relaxing music for studying",
      "coverUrl": "https://example.com/cover.jpg",
      "ownerId": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
      "visibility": "public",
      "editMode": "open",
      "trackCount": 15,
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

#### cURL Example

```bash
curl http://localhost:3000/api/playlists \
  -H "Authorization: Bearer <token>"
```

---

### 2. Get Playlist by ID

Récupérer les détails complets d'une playlist incluant les tracks.

**Endpoint:** `GET /api/playlists/:id`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "name": "Chill Vibes",
    "description": "Relaxing music for studying",
    "coverUrl": "https://example.com/cover.jpg",
    "ownerId": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
    "visibility": "public",
    "editMode": "open",
    "tracks": [
      {
        "id": "t1r2a3c4-k5i6-d7h8-e9r0-e1t2r3a4c5k6",
        "trackUri": "https://soundcloud.com/artist/song-name",
        "title": "Song Title",
        "artist": "Artist Name",
        "album": "Album Name",
        "albumArt": "https://example.com/artwork.jpg",
        "durationMs": 240000,
        "position": 0,
        "addedBy": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
        "addedAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "collaborators": ["user-id-1", "user-id-2"],
    "viewers": ["user-id-3"],
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 3. Create Playlist

Créer une nouvelle playlist.

**Endpoint:** `POST /api/playlists`
**Auth required:** ✅ Oui (Bearer token)

#### Request Body

```json
{
  "name": "My New Playlist",
  "description": "A collection of my favorite tracks",
  "visibility": "public",
  "editMode": "open",
  "coverUrl": "https://example.com/cover.jpg"
}
```

**Champs requis:** `name`
**Champs optionnels:** `description`, `coverUrl`, `visibility` (default: "public"), `editMode` (default: "open")
**Visibility values:** "public", "private"
**Edit mode values:** "open" (anyone can edit), "restricted" (only collaborators)

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "new-playlist-id",
    "name": "My New Playlist",
    "description": "A collection of my favorite tracks",
    "coverUrl": "https://example.com/cover.jpg",
    "ownerId": "e01f2f0b-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
    "visibility": "public",
    "editMode": "open",
    "collaborators": [],
    "viewers": [],
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 4. Update Playlist

Mettre à jour les métadonnées d'une playlist.

**Endpoint:** `PUT /api/playlists/:id`
**Auth required:** ✅ Oui (Bearer token, must be owner)

#### Request Body

```json
{
  "name": "Updated Playlist Name",
  "description": "Updated description",
  "visibility": "private",
  "editMode": "restricted",
  "coverUrl": "https://example.com/new-cover.jpg"
}
```

Tous les champs sont optionnels.

---

### 5. Delete Playlist

Supprimer une playlist.

**Endpoint:** `DELETE /api/playlists/:id`
**Auth required:** ✅ Oui (Bearer token, must be owner)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Playlist deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 6. Add Track to Playlist

Ajouter un track à une playlist.

**Endpoint:** `POST /api/playlists/:id/tracks`
**Auth required:** ✅ Oui (Bearer token)

#### Request Body

```json
{
  "trackUri": "https://soundcloud.com/artist/song-name",
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "albumArt": "https://example.com/artwork.jpg",
  "durationMs": 240000
}
```

**Champs requis:** `trackUri`, `title`, `artist`, `durationMs`
**Champs optionnels:** `album`, `albumArt`

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "trackId": "new-track-id",
    "position": 5
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

**Real-time:** Emits `playlist:track:added` Socket.io event to all connected clients.

---

### 7. Remove Track from Playlist

Retirer un track d'une playlist.

**Endpoint:** `DELETE /api/playlists/:id/tracks/:trackId`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Track removed successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

**Real-time:** Emits `playlist:track:removed` Socket.io event to all connected clients.

---

### 8. Reorder Track in Playlist

Changer la position d'un track dans une playlist.

**Endpoint:** `PATCH /api/playlists/:id/tracks/:trackId/position`
**Auth required:** ✅ Oui (Bearer token)

#### Request Body

```json
{
  "newPosition": 2
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Track position updated successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 9. Add Collaborator

Ajouter un collaborateur à une playlist.

**Endpoint:** `POST /api/playlists/:id/collaborators`
**Auth required:** ✅ Oui (Bearer token, must be owner)

#### Request Body

```json
{
  "userId": "collaborator-user-id"
}
```

---

### 10. Remove Collaborator

Retirer un collaborateur d'une playlist.

**Endpoint:** `DELETE /api/playlists/:id/collaborators/:userId`
**Auth required:** ✅ Oui (Bearer token, must be owner)

---

### 11. Get Collaborators

Lister les collaborateurs d'une playlist.

**Endpoint:** `GET /api/playlists/:id/collaborators`
**Auth required:** ✅ Oui (Bearer token)

---

### 12. Add Viewer

Ajouter un viewer à une playlist privée (permet de voir sans éditer).

**Endpoint:** `POST /api/playlists/:id/viewers`
**Auth required:** ✅ Oui (Bearer token, must be owner)

#### Request Body

```json
{
  "userId": "viewer-user-id"
}
```

---

### 13. Remove Viewer

Retirer un viewer d'une playlist.

**Endpoint:** `DELETE /api/playlists/:id/viewers/:userId`
**Auth required:** ✅ Oui (Bearer token, must be owner)

---

### 14. Get Viewers

Lister les viewers d'une playlist.

**Endpoint:** `GET /api/playlists/:id/viewers`
**Auth required:** ✅ Oui (Bearer token)

---

## SoundCloud Endpoints

Ces endpoints sont **publics** (pas d'authentification requise).

### 1. Search Tracks

Rechercher des tracks sur SoundCloud.

**Endpoint:** `GET /api/soundcloud/search`
**Auth required:** ❌ Non (Public)

#### Query Parameters

- `q` (required): Search query string
- `limit` (optional): Number of results (default: 20, max: 50)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "trackUri": "https://soundcloud.com/artist/song-name",
      "title": "Song Title",
      "artist": "Artist Name",
      "albumArt": "https://i1.sndcdn.com/artworks-xxx-large.jpg",
      "durationMs": 240000,
      "playCount": 1500000,
      "likes": 50000
    }
  ],
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z",
    "cached": false
  }
}
```

**Cache:** Results cached for 1 hour.

#### cURL Example

```bash
curl "http://localhost:3000/api/soundcloud/search?q=lofi+hip+hop&limit=10"
```

---

### 2. Get Track Details

Récupérer les détails d'un track SoundCloud.

**Endpoint:** `GET /api/soundcloud/track/:urlOrId`
**Auth required:** ❌ Non (Public)

**Parameter:** `:urlOrId` can be:
- Track ID: `123456789`
- Partial URL: `artist/song-name`
- Full URL: `https://soundcloud.com/artist/song-name`

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "trackUri": "https://soundcloud.com/artist/song-name",
    "title": "Song Title",
    "artist": "Artist Name",
    "albumArt": "https://i1.sndcdn.com/artworks-xxx-large.jpg",
    "durationMs": 240000,
    "description": "Track description",
    "genre": "Electronic",
    "playCount": 1500000,
    "likes": 50000
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 3. Get Stream URL

Obtenir l'URL de streaming pour un track SoundCloud.

**Endpoint:** `GET /api/soundcloud/stream/:trackUrl`
**Auth required:** ❌ Non (Public)

**Parameter:** `:trackUrl` - URL-encoded SoundCloud track URL

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "streamUrl": "https://cf-hls-media.sndcdn.com/playlist.m3u8?...",
    "protocol": "hls",
    "format": "aac",
    "expiresIn": 1800
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z",
    "cached": false
  }
}
```

**Cache:** Stream URLs cached for 30 minutes.

**Note:** Stream URLs expire after ~30 minutes. Fetch a new URL if playback fails.

#### cURL Example

```bash
# URL must be URL-encoded
curl "http://localhost:3000/api/soundcloud/stream/https%3A%2F%2Fsoundcloud.com%2Fartist%2Fsong"
```

---

## Friends Endpoints

### 1. Get Friends

Récupérer la liste des amis mutuels (mutual follows).

**Endpoint:** `GET /api/friends`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "friend-user-id",
      "username": "friend_username",
      "displayName": "Friend Name",
      "avatarUrl": "https://example.com/avatar.jpg",
      "canControlMusic": true,
      "followedAt": "2025-01-10T10:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

**Note:** Returns only mutual friends (users you follow who also follow you back).

---

### 2. Follow User

Suivre un utilisateur.

**Endpoint:** `POST /api/friends/follow/:userId`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "User followed successfully",
    "isMutual": false
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

**isMutual:** `true` if the user also follows you (becomes a mutual friend).

---

### 3. Unfollow User

Ne plus suivre un utilisateur.

**Endpoint:** `DELETE /api/friends/follow/:userId`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "User unfollowed successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 4. Check Follow Status

Vérifier si vous suivez un utilisateur et vice versa.

**Endpoint:** `GET /api/friends/status/:userId`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "isFollowing": true,
    "isFollowedBy": true,
    "isMutual": true,
    "canControlMusic": false
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

## Music Control Endpoints

### 1. Get My Permissions

Récupérer la liste des utilisateurs qui vous ont accordé le contrôle de leur musique.

**Endpoint:** `GET /api/music-control/permissions`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "userId": "user-id-1",
      "username": "friend1",
      "displayName": "Friend One",
      "avatarUrl": "https://example.com/avatar1.jpg",
      "grantedAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 2. Grant Control to User

Accorder le contrôle de votre musique à un utilisateur.

**Endpoint:** `POST /api/music-control/permissions/:userId`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Music control granted successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

**Real-time:** Emits `music-control:granted` Socket.io event to the target user.

**Requirement:** Must be mutual friends (both users follow each other).

---

### 3. Revoke Control from User

Retirer le contrôle de votre musique à un utilisateur.

**Endpoint:** `DELETE /api/music-control/permissions/:userId`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Music control revoked successfully"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

**Real-time:** Emits `music-control:revoked` Socket.io event to the target user.

---

### 4. Check if User Can Control My Music

Vérifier si un utilisateur spécifique vous a accordé le contrôle de sa musique.

**Endpoint:** `GET /api/music-control/can-control/:userId`
**Auth required:** ✅ Oui (Bearer token)

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "canControl": true,
    "grantedAt": "2025-01-15T10:00:00.000Z"
  },
  "meta": {
    "timestamp": "2025-01-15T12:00:00.000Z"
  }
}
```

---

## Socket.io Real-time Events

Music Room utilise Socket.io pour les mises à jour en temps réel.

**WebSocket URL:** `ws://localhost:3000` (ou `EXPO_PUBLIC_WS_URL`)

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'Bearer <access_token>'
  }
});
```

### Event Types

#### Playlist Events

- `playlist:track:added` - Track ajouté à une playlist
- `playlist:track:removed` - Track retiré d'une playlist
- `playlist:updated` - Métadonnées de playlist mises à jour

#### Music Control Events

- `music-control:granted` - Contrôle accordé
- `music-control:revoked` - Contrôle retiré

#### Device Events

- `device:register` - Enregistrement d'appareil
- `device:status` - Statut d'écoute mis à jour

### Event Payload Examples

```javascript
// playlist:track:added
{
  playlistId: "playlist-id",
  track: {
    id: "track-id",
    title: "Song Title",
    artist: "Artist Name",
    // ... track details
  },
  addedBy: "user-id"
}

// music-control:granted
{
  fromUserId: "user-id",
  fromUsername: "username",
  grantedAt: "2025-01-15T12:00:00.000Z"
}
```

---

**Dernière mise à jour:** 2025-01-23
