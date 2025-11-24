# Music Room API Documentation

Version: 1.0.0
Base URL: `http://localhost:3000`

---

## Table des matières

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Auth Endpoints](#auth-endpoints)

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
      "spotifyConnected": false,
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
      "spotifyConnected": false,
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
      "spotifyConnected": false,
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

**Dernière mise à jour:** 2025-01-15
