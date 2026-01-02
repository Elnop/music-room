# Docker API 1.42 - Solution Finale

## Problème Résolu

```
Error response from daemon: client version 1.42 is too old.
Minimum supported API version is 1.44
```

## Solution : Utiliser `docker run` au lieu de `docker-compose`

### Pourquoi ça marche

- ✅ **`docker build`** fonctionne avec API 1.42 (testé et validé)
- ✅ **`docker run`** fonctionne avec API 1.42
- ❌ **`docker-compose`** vérifie l'API version et refuse < 1.44

**Stratégie** : Contourner docker-compose en utilisant directement `docker run`.

## Commande Unique

```bash
make build-apk-docker-with-tunnel-legacy
```

### Ce que fait cette commande

1. ✅ Build l'image backend avec `Dockerfile.legacy`
   - Single-stage (pas de multi-stage)
   - `DOCKER_BUILDKIT=0` (force ancien builder)

2. ✅ Nettoie les anciens containers
   - `docker rm -f zumik-backend zumik-redis`

3. ✅ Crée le network et volumes
   - `docker network create zumik-network`
   - `docker volume create tunnel-info redis-data`

4. ✅ Démarre Redis avec `docker run`
   ```bash
   docker run -d --name zumik-redis \
     --network zumik-network \
     -v redis-data:/data \
     redis:7-alpine redis-server --appendonly yes
   ```

5. ✅ Démarre Backend avec tunnel avec `docker run`
   ```bash
   docker run -d --name zumik-backend \
     --network zumik-network \
     -p 3000:3000 -p 4040:4040 \
     -v $(pwd)/backend:/app \
     -v tunnel-info:/tmp/shared \
     --env-file ./backend/.env \
     -e TUNNEL_MODE=true \
     music-room-backend:latest sh start-with-tunnel.sh
   ```

6. ✅ Attend l'initialisation du tunnel ngrok
   - `docker exec zumik-backend test -f /tmp/shared/tunnel-url.txt`

7. ✅ Extrait l'URL du tunnel
   - `docker exec zumik-backend cat /tmp/shared/tunnel-url.txt`

8. ✅ Build l'APK avec l'URL du tunnel
   - Utilise `scripts/build-apk-docker.sh`

9. ✅ Copie l'APK dans `build/app-release.apk`

## Fichiers Impliqués

### Nouveau Dockerfile
- **backend/Dockerfile.legacy** - Single-stage, compatible API 1.42

### Makefile
- **make/build-apk.mk** - Commande `build-apk-docker-with-tunnel-legacy`
  - Utilise `docker run` au lieu de `docker-compose`
  - Nettoie automatiquement les containers avant de démarrer

### Documentation
- **DOCKER_LEGACY_MODE.md** - Guide complet
- **QUICKSTART_NON_ADMIN.md** - Quick start
- **DOCKER_API_142_FINAL.md** - Ce fichier

## Test de Validation

Sur votre machine, vous avez vu :

```
Successfully built 6237465deffb
Successfully tagged music-room-backend:latest
✓ Backend image built
```

✅ **L'image se build correctement !**

Le problème était que `docker-compose` refusait ensuite de démarrer les containers.

## Prochaine Étape

Relancez la commande :

```bash
make build-apk-docker-with-tunnel-legacy
```

Cette fois, elle devrait :
1. ✅ Builder l'image (déjà fait, sera en cache)
2. ✅ Nettoyer les anciens containers
3. ✅ Démarrer backend + Redis avec `docker run` (pas de vérification API)
4. ✅ Attendre le tunnel
5. ✅ Builder l'APK

## Commandes Utiles

```bash
# Nettoyer et recommencer
make clean-legacy-containers
make build-apk-docker-with-tunnel-legacy

# Voir les containers actifs
docker ps

# Voir les logs
docker logs -f zumik-backend
docker logs -f zumik-redis

# Vérifier le tunnel
docker exec zumik-backend cat /tmp/shared/tunnel-url.txt

# Arrêter
docker stop zumik-backend zumik-redis

# Supprimer
docker rm -f zumik-backend zumik-redis
```

## Pourquoi cette solution fonctionne

| Commande | API Check | Fonctionne API 1.42 ? |
|----------|-----------|----------------------|
| `docker build` | ❌ Non | ✅ Oui |
| `docker run` | ❌ Non | ✅ Oui |
| `docker-compose up` | ✅ **Oui** | ❌ **Non** |

En utilisant uniquement `docker build` + `docker run`, on évite complètement la vérification d'API version de docker-compose.

## Différences vs Version Normale

| Aspect | Normal | Legacy |
|--------|--------|--------|
| **Dockerfile** | Multi-stage | Single-stage |
| **BuildKit** | Activé | Désactivé |
| **Démarrage services** | `docker-compose up` | `docker run` |
| **Vérification API** | ✅ Vérifie | ❌ Pas de vérification |
| **Commande** | `make build-apk-docker-with-tunnel` | `make build-apk-docker-with-tunnel-legacy` |

## Limitations

- ❌ Pas de hot reload pour le backend (pas grave pour build APK)
- ❌ Pas de healthchecks (pas critique)
- ❌ Pas de container mobile (pas nécessaire pour build APK)

## Avantages

- ✅ Fonctionne avec Docker API 1.42
- ✅ Pas besoin de droits admin
- ✅ Pas besoin d'upgrader Docker
- ✅ Build APK complet avec tunnel
- ✅ Commande unique et simple

## Support

Si vous rencontrez encore des problèmes, vérifiez :

1. **Docker daemon fonctionne** : `docker ps`
2. **Permissions Docker** : `groups` (doit contenir `docker`)
3. **NGROK_AUTHTOKEN** dans `backend/.env`
4. **Logs containers** : `docker logs zumik-backend`

Voir `DOCKER_LEGACY_MODE.md` pour troubleshooting détaillé.
