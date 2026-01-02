# Docker Legacy Mode - Pour Docker API 1.42

Ce guide explique comment utiliser Zumik sur des machines avec d'anciennes versions de Docker où vous n'avez pas les droits admin pour upgrader.

## Problème

```
Error response from daemon: client version 1.42 is too old.
Minimum supported API version is 1.44, please upgrade your client to a newer version
```

## Solution : Mode Legacy

Le projet inclut maintenant un **mode legacy** compatible avec Docker API 1.42 (Docker 20.10.x).

### Vérifier votre version Docker

```bash
docker version
```

Si vous voyez `API version: 1.42` ou moins, utilisez le mode legacy.

## Commandes Mode Legacy

### 1. Build APK avec Tunnel

```bash
make build-apk-docker-with-tunnel-legacy
```

Cette commande :
1. **Build l'image backend** avec `Dockerfile.legacy` (single-stage, compatible API 1.42)
2. Désactive BuildKit automatiquement (`DOCKER_BUILDKIT=0`)
3. **Utilise `docker run` au lieu de `docker-compose`** (contourne la vérification API)
4. Démarre backend + Redis + tunnel ngrok
5. Build l'APK avec l'URL du tunnel
6. Copie l'APK dans `build/app-release.apk`

**Si le build échoue avec "API version too old"**, forcez manuellement :

```bash
# Forcer l'ancien builder Docker
DOCKER_BUILDKIT=0 make build-apk-docker-with-tunnel-legacy

# Ou builder l'image manuellement d'abord
DOCKER_BUILDKIT=0 docker build -t music-room-backend:latest -f backend/Dockerfile.legacy backend/
make build-apk-docker-with-tunnel-legacy
```

### 2. Commandes Utiles

```bash
# Nettoyer les containers legacy
make clean-legacy-containers

# Voir les containers actifs
docker ps

# Voir les logs backend
docker logs -f zumik-backend

# Voir les logs Redis
docker logs -f zumik-redis

# Arrêter les containers
docker stop zumik-backend zumik-redis

# Supprimer les containers
docker rm -f zumik-backend zumik-redis
```

## Différences avec le Mode Normal

Le mode legacy utilise `docker run` directement au lieu de `docker-compose`.

### Changements pour compatibilité API 1.42 :

1. ✅ **Build image** - Utilise `Dockerfile.legacy` (single-stage)
2. ✅ **BuildKit désactivé** - Force `DOCKER_BUILDKIT=0`
3. ✅ **Pas de docker-compose** - Utilise `docker run` directement
4. ✅ **Backend + Redis** - Démarrés avec `docker run`
5. ✅ **Tunnel ngrok** - Fonctionne normalement
6. ✅ **Build APK** - Fonctionne normalement
7. ❌ **Container mobile** - Pas nécessaire pour build APK
8. ❌ **Healthchecks** - Pas critiques pour cette utilisation

### Comment ça fonctionne

Au lieu d'utiliser `docker-compose` qui vérifie l'API version, le mode legacy utilise directement `docker run` :

```bash
# Créer le network
docker network create zumik-network

# Démarrer Redis
docker run -d --name zumik-redis --network zumik-network redis:7-alpine

# Démarrer Backend avec tunnel
docker run -d --name zumik-backend --network zumik-network \
  -p 3000:3000 -p 4040:4040 \
  -v $(pwd)/backend:/app \
  -e TUNNEL_MODE=true \
  music-room-backend:latest sh start-with-tunnel.sh
```

Cette approche **contourne complètement** la vérification d'API version de docker-compose.

## Workflow Complet

### Sur le poste non-admin (Docker API 1.42)

```bash
# 1. Cloner le projet
git clone <repo>
cd music-room

# 2. Créer les .env
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env

# 3. Configurer NGROK_AUTHTOKEN dans backend/.env
nano backend/.env
# Ajouter: NGROK_AUTHTOKEN=votre_token_ngrok

# 4. Build APK avec tunnel (mode legacy)
make build-apk-docker-with-tunnel-legacy
```

**Temps de build : 15-25 minutes la première fois**

### Résultat

L'APK sera généré dans :
```
build/app-release.apk
```

Vous pouvez l'installer avec :
```bash
# Si device connecté via USB
adb install build/app-release.apk

# Ou transférer le fichier et installer manuellement
```

## Fichiers Legacy Créés

Le mode legacy utilise des fichiers docker-compose spécifiques :

```
music-room/
├── docker-compose.legacy.yml          # Base: backend + redis (sans healthchecks)
├── docker-compose.tunnel.legacy.yml   # Override: active le tunnel ngrok
└── mobile/Dockerfile.android-build    # Builder APK (déjà compatible API 1.42)
```

**Différences clés** :
- `docker-compose.legacy.yml` : Pas de service `mobile`, pas de healthchecks
- `docker-compose.tunnel.legacy.yml` : Seulement override pour `backend` (pas `mobile`)

## Vérification Docker API Version

### Commande rapide

```bash
docker version --format '{{.Client.APIVersion}}'
```

### Tableau de compatibilité

| Docker Version | API Version | Mode Zumik |
|----------------|-------------|------------|
| 20.10.x        | 1.41-1.42   | **Legacy** |
| 23.0.x         | 1.43        | **Legacy** (recommandé) |
| 24.0.x+        | 1.44+       | Normal     |

## Troubleshooting

### Erreur "client version too old"

**Symptôme** :
```
Error response from daemon: client version 1.42 is too old
```

**Solution** :
Utilisez les commandes `-legacy` :
- `make build-apk-docker-with-tunnel-legacy`
- `docker-compose -f docker-compose.legacy.yml ...`

### Backend ne démarre pas

**Vérification** :
```bash
docker-compose -f docker-compose.legacy.yml -f docker-compose.tunnel.yml ps
docker-compose -f docker-compose.legacy.yml -f docker-compose.tunnel.yml logs backend
```

**Causes communes** :
1. Port 3000 déjà utilisé
2. NGROK_AUTHTOKEN manquant ou invalide
3. Erreur dans backend/.env

### Tunnel ngrok ne se connecte pas

**Vérification** :
```bash
# Vérifier les logs ngrok
docker-compose -f docker-compose.legacy.yml -f docker-compose.tunnel.legacy.yml exec backend cat /tmp/ngrok.log
```

**Solution** :
1. Vérifier NGROK_AUTHTOKEN dans `backend/.env`
2. Vérifier la connexion internet
3. Redémarrer : `docker-compose -f docker-compose.legacy.yml -f docker-compose.tunnel.legacy.yml restart backend`

### Build APK bloqué longtemps

**C'est normal !** Le premier build prend 15-25 minutes :
- Téléchargement du NDK (~1-2 GB)
- Compilation des modules natifs
- Build Gradle

**Surveillance** :
```bash
# Voir les dernières lignes du build
docker logs --tail 50 <container_id>

# Voir l'utilisation CPU/RAM
docker stats
```

Si le CPU est > 0%, le build est actif.

## Migration vers Docker plus récent

Si vous obtenez les droits admin plus tard :

```bash
# Upgrader Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli

# Vérifier la nouvelle version
docker version

# Utiliser les commandes normales
make build-apk-docker-with-tunnel  # sans -legacy
```

## Fichiers Concernés

```
music-room/
├── backend/
│   └── Dockerfile.legacy              # ← Nouveau : Dockerfile simple (API 1.42)
├── docker-compose.legacy.yml          # ← Nouveau : Base compatible API 1.42
├── docker-compose.tunnel.legacy.yml   # ← Nouveau : Tunnel override pour legacy
├── make/build-apk.mk                  # build-apk-docker-with-tunnel-legacy
├── DOCKER_LEGACY_MODE.md             # ← Ce fichier
├── QUICKSTART_NON_ADMIN.md           # Quick start
└── SOLUTION_DOCKER_API_142.md        # Solution détaillée
```

## Support

Si vous rencontrez d'autres problèmes :
1. Vérifier les logs : `docker-compose -f docker-compose.legacy.yml logs`
2. Vérifier la version Docker : `docker version`
3. Consulter BUILD.md et DEVELOPMENT.md

## Limitations Connues

### Mode Legacy vs Normal

| Fonctionnalité | Normal | Legacy |
|----------------|--------|--------|
| Build APK | ✅ | ✅ |
| Backend + Redis | ✅ | ✅ |
| Tunnel ngrok | ✅ | ✅ |
| Healthchecks | ✅ | ❌ |
| Mobile Expo container | ✅ | ❌ |
| Hot reload mobile | ✅ | ❌ |

Le mode legacy est **optimisé pour le build APK**, pas pour le développement avec hot reload.

Si vous avez besoin de hot reload, utilisez un poste avec Docker récent ou demandez l'upgrade de Docker à votre admin système.
