# Development Build Setup - Google OAuth

## Pourquoi un Development Build ?

Le package `@react-native-google-signin/google-signin` nécessite du **code natif** qui n'est pas disponible dans Expo Go.

Un **development build** est une version custom de votre app qui:
- ✅ Inclut Google Sign-In (code natif)
- ✅ Garde le hot reload
- ✅ Garde le fast refresh
- ✅ Fonctionne avec tunnel mode (différents réseaux WiFi)
- ✅ Se comporte exactement comme Expo Go

**Vous n'avez qu'à le builder UNE FOIS** (ou quand les dépendances natives changent).

---

## Setup Initial (Une Seule Fois)

### Étape 1: Obtenir un Token Expo

1. Allez sur: https://expo.dev/
2. Créez un compte (ou login)
3. Allez dans **Settings → Access Tokens**
4. Créez un nouveau token avec **"Read and write"** access
5. Copiez le token

### Étape 2: Ajouter le Token dans mobile/.env

Ouvrez `mobile/.env` et ajoutez:

```bash
EXPO_TOKEN=votre-token-ici
```

### Étape 3: Setup EAS

```bash
make dev-build-setup
```

Cette commande:
- Installe EAS CLI globalement
- Login avec votre token Expo
- Configure le projet EAS

**Sortie attendue:**
```
✓ EAS CLI installed
✓ EXPO_TOKEN found in mobile/.env
✓ Logged in as: votre-username
✓ Development Build Setup Complete!
```

---

## Builder l'APK de Développement

### Option A: Cloud Build (Recommandé - Pas besoin d'Android Studio)

```bash
make dev-build
```

**Ce qui se passe:**
- Votre code est uploadé sur les serveurs EAS
- Un APK de développement est build dans le cloud (~15-20 minutes)
- Vous recevez un lien de téléchargement

**Sortie:**
```
✓ EAS ready
→ Starting cloud build...

⏳ This will take ~15-20 minutes
   You can close this terminal - build continues in the cloud
   Check status: https://expo.dev/accounts/[username]/projects/music-room/builds

Build finished!
Download: https://expo.dev/artifacts/[build-id]
```

### Option B: Build Local (Plus rapide - Nécessite Android Studio)

Si vous avez Android Studio configuré:

```bash
make dev-build-local
```

**Prérequis:**
- Android Studio installé
- Android SDK configuré
- Variable `ANDROID_HOME` configurée
- Téléphone connecté en USB avec USB debugging activé

---

## Installer l'APK sur Votre Téléphone

### Méthode 1: Lien Direct (Cloud Build)

1. Après le build, vous recevez un lien: `https://expo.dev/artifacts/[build-id]`
2. Ouvrez le lien **sur votre téléphone**
3. Téléchargez l'APK
4. Autorisez "Installation depuis sources inconnues" si demandé
5. Installez l'APK

### Méthode 2: Transfert Manuel

1. Téléchargez l'APK depuis le lien sur votre PC
2. Transférez l'APK sur votre téléphone (USB, email, cloud, etc.)
3. Ouvrez l'APK sur le téléphone
4. Installez

### Méthode 3: USB (Build Local)

Si vous avez fait `make dev-build-local`, l'APK est automatiquement installé via USB.

---

## Développement Quotidien

### Une fois l'APK installé:

```bash
# Démarrer le serveur de développement
make dev-tunnel
```

**Sur votre téléphone:**
1. Ouvrez l'app "Music Room" (PAS Expo Go!)
2. Scannez le QR code affiché
3. L'app se connecte au serveur de dev
4. ✨ Hot reload fonctionne!

### Workflow Quotidien

```bash
# Jour 1: Setup
make dev-build-setup  # Une seule fois
make dev-build        # Build l'APK (~20 min)
# Installer APK sur téléphone

# Jours suivants: Développement normal
make dev-tunnel       # Démarrer le serveur
# Ouvrir app Music Room sur téléphone
# Coder normalement - hot reload fonctionne!
```

---

## Quand Rebuilder?

### ❌ Pas besoin de rebuild pour:
- Changements de code TypeScript/JavaScript
- Modifications de screens, components, stores
- Changements de styles
- → Hot reload gère tout ça!

### ✅ Rebuild nécessaire quand:
- Vous ajoutez une nouvelle dépendance native (ex: `expo install nouveau-package`)
- Vous modifiez `app.json` (ex: permissions, plugins)
- Vous changez la configuration Google Sign-In
- Nouvelle version majeure d'Expo

---

## Commandes Disponibles

```bash
# Setup (une fois)
make dev-build-setup        # Configure EAS

# Build
make dev-build              # Cloud build (recommandé)
make dev-build-local        # Build local (nécessite Android Studio)

# Développement
make dev-tunnel             # Démarrer serveur tunnel mode
make qr-tunnel              # Afficher QR code
make logs                   # Voir les logs

# Aide
make help                   # Toutes les commandes disponibles
```

---

## Troubleshooting

### "EAS CLI not installed"
```bash
make dev-build-setup
```

### "Not logged into EAS"
Vérifiez que `EXPO_TOKEN` est dans `mobile/.env`:
```bash
grep EXPO_TOKEN mobile/.env
```

### "Build failed"
Vérifiez les logs sur: https://expo.dev/accounts/[username]/projects/music-room/builds

### "App ne se connecte pas au serveur"
1. Vérifiez que `make dev-tunnel` est en cours
2. Vérifiez que le QR code est bien scanné
3. Essayez `make qr-tunnel` pour réafficher le QR

### "Hot reload ne fonctionne pas"
1. Secouez le téléphone → "Reload"
2. Redémarrez `make dev-tunnel`
3. Réinstallez l'APK si problème persiste

---

## FAQ

**Q: Puis-je utiliser Expo Go?**
Non, Expo Go ne supporte pas Google Sign-In (code natif requis).

**Q: Combien de fois dois-je builder?**
Une fois, puis seulement quand les dépendances natives changent.

**Q: Ça prend combien de temps?**
- Cloud build: ~15-20 minutes
- Build local: ~5-10 minutes (avec Android Studio)

**Q: Hot reload fonctionne-t-il?**
Oui! Le development build se comporte exactement comme Expo Go.

**Q: Tunnel mode fonctionne-t-il?**
Oui! Parfait pour téléphone et PC sur différents réseaux WiFi.

**Q: Dois-je installer Android Studio?**
Non si vous utilisez cloud build (`make dev-build`).
Oui si vous utilisez build local (`make dev-build-local`).

**Q: Mes collègues doivent-ils builder?**
Oui, chacun doit:
1. `make dev-build-setup` (une fois)
2. `make dev-build` (une fois)
3. Installer l'APK sur son téléphone
4. Puis utiliser `make dev-tunnel` normalement

---

## Résumé pour Nouveaux Développeurs

```bash
# 1. Setup initial (une fois)
# Ajouter EXPO_TOKEN dans mobile/.env
make dev-build-setup

# 2. Builder l'APK (une fois)
make dev-build
# Attendre 15-20 minutes
# Télécharger et installer APK sur téléphone

# 3. Développement quotidien
make dev-tunnel
# Ouvrir app Music Room sur téléphone
# Scanner QR code
# Coder! ✨
```

---

## Support

Si problème, demandez à l'équipe sur Slack ou vérifiez:
- https://docs.expo.dev/develop/development-builds/introduction/
- https://docs.expo.dev/build/introduction/
