# Solution Complète Docker API 1.42

Ce document explique la solution finale pour build l'APK sur une machine avec Docker API 1.42 (sans droits admin).

## Résumé du Problème

```
Error response from daemon: client version 1.42 is too old.
Minimum supported API version is 1.44
```

## Solution Implémentée

### 1. Fichiers Créés

```
music-room/
├── backend/
│   └── Dockerfile.legacy              # Dockerfile single-stage (compatible API 1.42)
├── docker-compose.legacy.yml          # Base compose sans healthchecks
├── docker-compose.tunnel.legacy.yml   # Tunnel override pour legacy
├── DOCKER_LEGACY_MODE.md              # Documentation complète
├── QUICKSTART_NON_ADMIN.md            # Quick start
└── SOLUTION_DOCKER_API_142.md         # Ce fichier
```

### 2. Modifications

- **make/build-apk.mk** : Nouvelle commande `build-apk-docker-with-tunnel-legacy`
  - Build avec `Dockerfile.legacy` (fallback sur `Dockerfile` standard)
  - Force `DOCKER_BUILDKIT=0` pour compatibilité
  - Utilise `docker-compose.legacy.yml` + `docker-compose.tunnel.legacy.yml`

- **docker-compose.legacy.yml** :
  - Pas de service `mobile` (pas nécessaire pour APK build)
  - Pas de healthchecks (nécessitent API 1.43+)
  - Utilise image pré-construite `music-room-backend:latest`

- **backend/Dockerfile.legacy** :
  - Single-stage (pas de multi-stage qui peut poser problème)
  - Pas de `--target` (évite complexité)
  - Compatible Docker API 1.42

## Utilisation sur Machine Docker API 1.42

### Commande Simple

```bash
make build-apk-docker-with-tunnel-legacy
```

### Si erreur "API version too old" persiste

```bash
# Forcer l'ancien builder Docker
DOCKER_BUILDKIT=0 make build-apk-docker-with-tunnel-legacy
```

### Build manuel de l'image (debug)

```bash
# Tester le build de l'image backend
DOCKER_BUILDKIT=0 docker build -t music-room-backend:latest -f backend/Dockerfile.legacy backend/

# Vérifier que l'image existe
docker images | grep music-room-backend

# Puis lancer le build APK
make build-apk-docker-with-tunnel-legacy
```

## Workflow Complet

### Prérequis

1. **NGROK_AUTHTOKEN** dans `backend/.env`
2. **Docker daemon démarré** : `sudo systemctl start docker` (si possible)
3. **Permissions Docker** : `sudo usermod -aG docker $USER` (si possible, puis reboot)

### Étapes

```bash
# 1. Cloner et setup
git clone <repo>
cd music-room
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env

# 2. Configurer ngrok
nano backend/.env
# Ajouter: NGROK_AUTHTOKEN=votre_token

# 3. Build APK
make build-apk-docker-with-tunnel-legacy
# Ou si erreur API:
DOCKER_BUILDKIT=0 make build-apk-docker-with-tunnel-legacy

# 4. Attendre 15-25 minutes (premier build)

# 5. Récupérer l'APK
ls -lh build/app-release.apk

# 6. Installer sur device
adb install build/app-release.apk
```

## Différences Docker Legacy vs Normal

| Aspect | Normal (API 1.44+) | Legacy (API 1.42) |
|--------|-------------------|-------------------|
| **Dockerfile** | Multi-stage avec `--target` | Single-stage simple |
| **BuildKit** | Activé par défaut | `DOCKER_BUILDKIT=0` |
| **Healthchecks** | ✅ Dans compose | ❌ Retirés |
| **Service mobile** | ✅ Dans compose | ❌ Retiré (pas nécessaire pour APK) |
| **Commande** | `make build-apk-docker-with-tunnel` | `make build-apk-docker-with-tunnel-legacy` |

## Troubleshooting

### Erreur : "cannot connect to Docker daemon"

```bash
# Démarrer Docker (si possible sans admin)
docker ps

# Si pas de permission
ls -l /var/run/docker.sock
# Si vous n'êtes pas dans le groupe docker, demandez l'admin d'ajouter:
# sudo usermod -aG docker votre_user
```

### Erreur : "API version 1.42 too old" même en legacy

```bash
# Solution 1: Forcer l'ancien builder
DOCKER_BUILDKIT=0 make build-apk-docker-with-tunnel-legacy

# Solution 2: Vérifier que Dockerfile.legacy existe
ls -l backend/Dockerfile.legacy

# Solution 3: Builder manuellement
DOCKER_BUILDKIT=0 docker build -t music-room-backend:latest -f backend/Dockerfile.legacy backend/
```

### Erreur : "service 'mobile' has neither image nor build"

Vous utilisez le mauvais fichier compose. Assurez-vous d'utiliser :
- `docker-compose.legacy.yml` (base)
- `docker-compose.tunnel.legacy.yml` (tunnel override)

**PAS** `docker-compose.tunnel.yml` (nécessite service mobile).

### Build bloqué longtemps

Normal ! Vérifiez l'activité :

```bash
# Voir les containers actifs
docker ps

# Voir l'utilisation CPU/RAM du builder APK
docker stats

# Voir les logs du build
docker logs --tail 50 <container_id>
```

Si CPU > 0%, le build est actif (pas bloqué).

## Documentation Complète

- **Quick Start** : `QUICKSTART_NON_ADMIN.md`
- **Guide Complet** : `DOCKER_LEGACY_MODE.md`
- **Build General** : `BUILD.md`
- **Dev Guide** : `DEVELOPMENT.md`

## Vérification Version Docker

```bash
# Version Docker
docker version

# API Version du client
docker version --format '{{.Client.APIVersion}}'

# API Version du daemon
docker version --format '{{.Server.APIVersion}}'
```

### Tableau Compatibilité

| Docker Version | Client API | Daemon API | Mode |
|----------------|------------|------------|------|
| 20.10.x | 1.41-1.42 | 1.41+ | **Legacy Required** |
| 23.0.x | 1.43 | 1.43+ | **Legacy Recommended** |
| 24.0.x+ | 1.44+ | 1.44+ | Normal |

## Fichiers Impliqués

### Build APK

1. **make/build-apk.mk** : Commande Makefile
2. **backend/Dockerfile.legacy** : Build de l'image backend
3. **docker-compose.legacy.yml** : Définition des services
4. **docker-compose.tunnel.legacy.yml** : Override tunnel
5. **mobile/Dockerfile.android-build** : Build de l'APK
6. **scripts/build-apk-docker.sh** : Script de build APK

### Configuration

- **backend/.env** : NGROK_AUTHTOKEN, SUPABASE_URL, etc.
- **mobile/.env** : EXPO_PUBLIC_API_URL (auto-configuré par le Makefile)

## Support

Si problèmes persistent :

1. Vérifier Docker daemon : `docker info`
2. Vérifier permissions : `groups` (doit contenir `docker`)
3. Tester build simple : `DOCKER_BUILDKIT=0 docker build -t test backend/`
4. Consulter logs : `docker logs <container_id>`

Consulter `DOCKER_LEGACY_MODE.md` pour plus de détails et troubleshooting.
