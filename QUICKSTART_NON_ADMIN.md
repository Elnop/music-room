# Quick Start - Poste Non-Admin (Docker API 1.42)

**Problème** : `Error response from daemon: client version 1.42 is too old`

**Solution** : Utilisez le mode legacy.

## Installation Rapide

```bash
# 1. Cloner le projet
git clone <repo_url>
cd music-room

# 2. Créer les fichiers .env
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env

# 3. Configurer ngrok
nano backend/.env
# Ajouter votre token ngrok :
# NGROK_AUTHTOKEN=votre_token_ici

# 4. Build APK avec tunnel (MODE LEGACY)
make build-apk-docker-with-tunnel-legacy
```

## Temps de Build

⏰ **Premier build : 15-25 minutes** (téléchargement NDK + compilation)
⏰ Builds suivants : 3-5 minutes

## Résultat

L'APK sera dans : `build/app-release.apk`

## Installation sur Device

```bash
# USB
adb install build/app-release.apk

# Ou transférer le fichier manuellement
```

## Documentation Complète

👉 Voir [DOCKER_LEGACY_MODE.md](./DOCKER_LEGACY_MODE.md) pour les détails complets

## Troubleshooting

### Build bloqué longtemps ?

C'est normal ! Vérifiez :

```bash
# Voir l'activité
docker stats

# Voir les logs
docker logs --tail 50 $(docker ps -q --filter "ancestor=zumik-apk-builder")
```

Si CPU > 0%, le build est actif.

### Erreur "tunnel URL not found" ?

```bash
# Vérifier le backend
docker-compose -f docker-compose.legacy.yml -f docker-compose.tunnel.yml logs backend

# Redémarrer
docker-compose -f docker-compose.legacy.yml -f docker-compose.tunnel.yml restart backend
```

### Backend ne démarre pas ?

Vérifier NGROK_AUTHTOKEN dans `backend/.env`

## Commandes Utiles

```bash
# Status des containers
docker-compose -f docker-compose.legacy.yml ps

# Logs backend
docker-compose -f docker-compose.legacy.yml logs backend

# Arrêter
docker-compose -f docker-compose.legacy.yml down

# Nettoyer
docker-compose -f docker-compose.legacy.yml down -v
```

## Pourquoi "Legacy" ?

Votre Docker API 1.42 est trop ancien pour certaines fonctionnalités récentes (healthchecks).

Le mode legacy retire ces fonctionnalités non-essentielles pour garder la compatibilité avec Docker 20.10.x.

**✅ Tout fonctionne** : backend, Redis, tunnel, build APK

**❌ Non disponible** : hot reload mobile (pas nécessaire pour build APK)
