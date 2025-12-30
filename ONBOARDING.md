# 🎵 Zumik - Onboarding

Guide de setup pour lancer l'app en 30 minutes.

## 📋 Table des matières

- [🎵 Zumik - Onboarding](#-zumik---onboarding)
	- [📋 Table des matières](#-table-des-matières)
	- [🔧 Prérequis](#-prérequis)
		- [Configuration Android](#configuration-android)
	- [🚀 Premier setup](#-premier-setup)
	- [💻 Workflow quotidien](#-workflow-quotidien)
	- [🛠 Commandes utiles](#-commandes-utiles)

---

## 🔧 Prérequis

- **Android Studio** ([télécharger](https://developer.android.com/studio)) - SDK Android + émulateur
- **Node.js 18+** ([télécharger](https://nodejs.org))
- **Git**

### Configuration Android

```bash
# 1. Créer un AVD dans Android Studio : Tools > Device Manager > Create Device

# 2. Ajouter à ~/.zshrc ou ~/.bashrc :
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# 3. Recharger
source ~/.zshrc
```

---

## 🚀 Premier setup

```bash
# 1. Cloner
git clone https://github.com/Elnop/zumik
cd zumik

# 2. Vérifier l'environnement
make check-setup
# → Objectif: "✓ Environment is ready!"

# 3. Installer les dépendances
make install

# 4. Configurer backend/.env
# Demander à l'équipe: Supabase (URL, KEYS), Google OAuth (CLIENT_ID, SECRET)

# 5. Configurer mobile/.env
make set-backend-url
# Ajouter aussi: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (demander à l'équipe)

# 6. Vérifier final
make check-setup
```

---

## 💻 Workflow quotidien

```bash
# 1. Démarrer le backend en local
make backend-local
# Le backend tourne sur http://localhost:3000

# 2. Lancer l'émulateur (~30 sec)
make start-emulator

# 3. Build et installer l'app
make dev-build-local
# Premier build: ~5-10 min | Suivants: ~2-3 min
# Hot reload activé! Pas besoin de rebuild pour chaque modif

# Autres commandes utiles
make clean-native      # Nettoyer si problème
```

**Rebuild nécessaire uniquement si**:
- Nouvelle dépendance native
- Modification `app.json`/`app.config.js`
- Plugin Expo ajouté/modifié


## 🛠 Commandes utiles

```bash
make help                 # Liste toutes les commandes
make check-setup          # Vérifier l'environnement
make check-devices        # Voir devices Android
make backend-local        # Démarrer backend (mode local)
make start-emulator       # Lancer émulateur
make kill-emulator        # Arrêter émulateur
make dev-build-local      # Build et installer app
make clean-native         # Nettoyer builds natifs
make lint                 # Linter
make format               # Formatter
```

### Gestion des émulateurs Android

Zumik fournit plusieurs commandes pour gérer les émulateurs Android :

**Lister les émulateurs disponibles :**
```bash
make list-emulators
```

Affiche tous les Android Virtual Devices (AVDs) configurés dans Android Studio.

**Ouvrir un émulateur spécifique (interactif) :**
```bash
make open-emulator
```

Cette commande :
1. Liste tous les AVDs disponibles
2. Demande de sélectionner un émulateur
3. Lance l'émulateur sélectionné en arrière-plan

**Ouvrir un émulateur spécifique (direct) :**
```bash
make open-emulator AVD=Pixel_6_API_34
```

Lance un émulateur spécifique par son nom sans menu interactif.

**Démarrer le premier émulateur (automatique) :**
```bash
make start-emulator
```

Lance automatiquement le premier AVD disponible avec rendu logiciel (idéal pour Linux).

**Arrêter tous les émulateurs :**
```bash
make kill-emulator
```

**Vérifier les devices connectés :**
```bash
make check-devices
```

**Documentation complète** : [`CLAUDE.md`](./CLAUDE.md)
