# Plan d'Initialisation Mobile - Music Room (Révisé avec Context7)

## Contexte

**Projet**: Music Room - Application mobile collaborative de musique
**État actuel**: Backend existant (Node.js + Express + Supabase + Socket.io), dossier mobile à créer
**Stack Mobile**: React Native 0.73+ avec Expo, TypeScript
**Backend existant**: Supabase v2.50.0, Express 4.21.2, Socket.io 4.8.1, Zod 3.24.1

## Objectif

Initialisation complète de l'application mobile React Native avec:
- Configuration TypeScript stricte avec path aliases
- Dépendances à jour basées sur la documentation officielle Context7
- Structure clean architecture professionnelle
- Compatibilité totale avec le backend existant
- Configuration Expo optimisée pour Android

## Documentation Sources (Context7)

Les recommandations suivantes sont basées sur la documentation officielle la plus récente:
- **Expo**: `/expo/expo` - 3805 code snippets, Benchmark 91.4
- **React Navigation**: `/websites/reactnavigation` - 2857 code snippets, Benchmark 72
- **Zustand**: `/pmndrs/zustand` - 434 code snippets, Benchmark 81.8
- **Supabase JS**: `/supabase/supabase-js` - 275 code snippets, Benchmark 81.5

---

## Phase 1: Initialisation Projet Expo

### 1.1 Créer le projet avec template TypeScript

```bash
cd /home/bwolf/music-room
npx create-expo-app@latest mobile --template expo-template-blank-typescript
cd mobile
```

**Résultat attendu**: Structure Expo de base avec TypeScript configuré

### 1.2 Vérification initiale

```bash
ls -la
# Vérifier la présence de: package.json, tsconfig.json, App.tsx, app.json
```

---

## Phase 2: Installation des Dépendances

### 2.1 Navigation (basé sur React Navigation docs)

```bash
# Core navigation packages
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs

# Dependencies for Expo managed workflow (documentation officielle)
npx expo install react-native-screens react-native-safe-area-context
```

**Source**: React Navigation recommande `npx expo install` pour Expo managed projects

### 2.2 State Management (Zustand)

```bash
npm install zustand
```

**Note**: Zustand 5.x utilise une API curried pour TypeScript. Voir configuration TypeScript plus bas.

### 2.3 HTTP & API Client

```bash
npm install axios
npm install @supabase/supabase-js@^2.50.0
npx expo install @react-native-async-storage/async-storage
```

**Important**: Version Supabase JS alignée avec le backend (2.50.0)

### 2.4 Realtime WebSocket

```bash
npm install socket.io-client@^4.8.1
```

**Important**: Version alignée avec backend Socket.io 4.8.1

### 2.5 Forms & Validation

```bash
npm install react-hook-form
npm install zod@^3.24.1
```

**Important**: Version Zod alignée avec backend (3.24.1)

### 2.6 UI & Animations

```bash
npm install react-native-gesture-handler react-native-reanimated
npx expo install expo-linear-gradient
```

### 2.7 Secure Storage

```bash
npx expo install expo-secure-store
```

### 2.8 Dev Dependencies

```bash
npm install --save-dev @types/react @types/react-native
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
npm install --save-dev babel-plugin-module-resolver
```

---

## Phase 3: Configuration TypeScript

### 3.1 tsconfig.json (basé sur Expo + Zustand docs)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "jsx": "react-native",
    "lib": ["esnext"],
    "types": ["react-native", "jest"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@store/*": ["src/store/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@constants/*": ["src/constants/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules"]
}
```

**Source**: Combinaison Expo docs + Zustand TypeScript best practices

---

## Phase 4: Configuration ESLint & Prettier

### 4.1 .eslintrc.js

```javascript
module.exports = {
  root: true,
  extends: [
    'expo',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  rules: {
    'prettier/prettier': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
```

### 4.2 .prettierrc

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 4.3 .eslintignore

```
node_modules/
.expo/
.expo-shared/
dist/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
```

---

## Phase 5: Structure des Dossiers

### 5.1 Créer l'arborescence

```bash
mkdir -p src/{screens,components,navigation,services,store,hooks,types,constants,utils}
mkdir -p src/screens/{auth,friends,playlists,devices,spotify}
mkdir -p src/components/{common,playlist,player,friends}
mkdir -p assets/{images,fonts,icons}
```

### 5.2 Arborescence finale

```
mobile/
├── src/
│   ├── screens/          # Écrans par feature
│   │   ├── auth/
│   │   ├── friends/
│   │   ├── playlists/
│   │   ├── devices/
│   │   └── spotify/
│   ├── components/       # Composants réutilisables
│   │   ├── common/
│   │   ├── playlist/
│   │   ├── player/
│   │   └── friends/
│   ├── navigation/       # Configuration navigation
│   ├── services/         # API clients & services
│   ├── store/            # Zustand stores
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript types
│   ├── constants/        # Constants & config
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, icons
├── .env.example
├── app.json
├── babel.config.js
└── tsconfig.json
```

---

## Phase 6: Fichiers de Base

### 6.1 src/constants/index.ts

```typescript
// API Configuration (backend: http://localhost:3000)
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000',
  TIMEOUT: 10000,
} as const;

// Supabase Configuration (backend: @supabase/supabase-js@2.50.0)
export const SUPABASE_CONFIG = {
  URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

// Spotify Configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Music Room',
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
} as const;

// Theme Colors (Spotify-inspired dark theme)
export const COLORS = {
  primary: '#1DB954',      // Spotify Green
  secondary: '#191414',    // Near Black
  background: '#121212',   // Pure Black
  surface: '#282828',      // Dark Gray
  text: '#FFFFFF',         // White
  textSecondary: '#B3B3B3', // Light Gray
  error: '#E63946',        // Red
  success: '#06D6A0',      // Teal
  warning: '#FFB703',      // Amber
} as const;

// Spacing System
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Typography
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
```

### 6.2 src/types/index.ts

```typescript
// User Types (aligned with backend)
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserProfile extends User {
  bio?: string;
  favorite_genres?: string[];
  privacy: {
    public: Record<string, unknown>;
    friends: Record<string, unknown>;
    private: Record<string, unknown>;
  };
}

// Auth Types (Supabase Auth v2.50.0)
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

// Playlist Types
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  spotify_id: string;
  name: string;
  artist: string;
  album: string;
  duration_ms: number;
  album_art_url?: string;
  spotify_uri: string;
}

// Device Types
export interface Device {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
```

### 6.3 src/utils/validators.ts (Zod 3.24.1)

```typescript
import { z } from 'zod';

// Auth Validators (aligned with backend Zod schemas)
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

### 6.4 src/utils/formatters.ts

```typescript
// Time Formatters
export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
};

// String Formatters
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
```

---

## Phase 7: Configuration Environnement

### 7.1 .env.example

```env
# API Configuration (Backend: http://localhost:3000)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000

# Supabase Configuration (Backend uses @supabase/supabase-js@2.50.0)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Spotify Configuration (Backend: Phase 6)
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id-here
```

### 7.2 .env (local development)

```env
# Copy from .env.example and fill with actual values
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=
```

### 7.3 .gitignore (ajouter)

```
# Environment
.env
.env.local
.env.*.local

# Expo
.expo/
.expo-shared/
dist/
web-build/

# Native
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*

# macOS
.DS_Store

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
```

---

## Phase 8: Configuration app.json (Expo docs)

```json
{
  "expo": {
    "name": "Music Room",
    "slug": "music-room",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#121212"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.musicroom.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#121212"
      },
      "package": "com.musicroom.app",
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "buildToolsVersion": "34.0.0"
          }
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

**Note**: SDK 34 pour Android (plus récent que le plan précédent qui utilisait 33)

---

## Phase 9: Configuration Babel

### 9.1 babel.config.js (avec module-resolver pour path aliases)

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@constants': './src/constants',
          },
        },
      ],
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
```

---

## Phase 10: App.tsx de Base

```typescript
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from './src/constants';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Music Room</Text>
      <Text style={styles.subtitle}>Mobile App Initialized ✅</Text>
      <Text style={styles.info}>Backend: localhost:3000</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  info: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
```

---

## Phase 11: Scripts package.json

Ajouter dans `package.json` section `"scripts"`:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf node_modules && rm -rf .expo && npm install"
  }
}
```

---

## Phase 12: README.md Mobile

```markdown
# Music Room - Mobile App

Application mobile React Native pour Music Room.

## Stack Technique

- **Framework**: React Native 0.73+ avec Expo
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation v6
- **State Management**: Zustand v5
- **HTTP Client**: Axios
- **Auth**: Supabase Auth v2.50.0
- **Realtime**: Socket.io-client v4.8.1
- **Validation**: Zod v3.24.1

## Prérequis

- Node.js 18+
- Backend Music Room running sur `http://localhost:3000`
- Compte Supabase configuré
- Expo CLI: `npm install -g expo-cli`

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

1. Copier `.env.example` vers `.env`
2. Remplir les variables d'environnement avec les valeurs du backend
3. Vérifier que le backend est lancé sur port 3000

## Démarrage

\`\`\`bash
# Démarrer Expo
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios
\`\`\`

## Scripts

- `npm run lint` - Linter le code
- `npm run lint:fix` - Corriger automatiquement
- `npm run format` - Formater avec Prettier
- `npm run type-check` - Vérifier les types TypeScript
- `npm run clean` - Nettoyer et réinstaller

## Architecture

Voir [../PLAN.md](../PLAN.md) pour l'architecture complète du projet.
```

---

## Phase 13: Checklist de Vérification

Avant de committer, vérifier:

- [ ] `npm run type-check` - Pas d'erreurs TypeScript
- [ ] `npm run lint` - Pas d'erreurs ESLint
- [ ] `npm start` - Expo démarre sans erreurs
- [ ] App affiche "Music Room - Mobile App Initialized ✅"
- [ ] `.env` créé avec les bonnes valeurs du backend
- [ ] Path aliases fonctionnent (`@/`, `@components/`, etc.)
- [ ] Toutes les dépendances installées
- [ ] Structure des dossiers créée

---

## Phase 14: Commit Initial

```bash
cd /home/bwolf/music-room

git add mobile/

git commit -m "feat(mobile): Initialize React Native app with Expo and TypeScript

- Create Expo project with TypeScript template
- Install dependencies aligned with backend versions:
  * Supabase JS v2.50.0
  * Socket.io-client v4.8.1
  * Zod v3.24.1
- Setup TypeScript with strict mode and path aliases
- Configure ESLint + Prettier
- Create clean architecture folder structure
- Add constants, types, utils with backend alignment
- Configure app.json for Android (SDK 34)
- Setup Babel with module-resolver
- Create .env.example with backend configuration
- Add base App.tsx with theme
- Configure npm scripts
- Add mobile README.md

Documentation sources (Context7):
- Expo docs (91.4 benchmark)
- React Navigation docs (72 benchmark)
- Zustand docs (81.8 benchmark)
- Supabase JS docs (81.5 benchmark)"
```

---

## Prochaines Étapes

Après ce setup initial:

1. **Phase 2**: Configuration Supabase Client (v2.50.0)
2. **Phase 3**: Configuration Socket.io Client (v4.8.1)
3. **Phase 4**: Navigation (Auth Stack + App Stack + Tabs)
4. **Phase 5**: Zustand Stores (auth, playlists, playback)
5. **Phase 6**: Services API & Auth

---

## Points Clés de ce Plan Révisé

### ✅ Améliorations vs Plan Précédent

1. **Versions alignées avec backend**:
   - Supabase JS: v2.50.0 (backend utilise cette version)
   - Socket.io-client: v4.8.1 (compatible avec backend 4.8.1)
   - Zod: v3.24.1 (même version que backend)

2. **Documentation à jour (Context7)**:
   - Expo: Template TypeScript recommandé, SDK 34 pour Android
   - React Navigation: `npx expo install` pour dépendances
   - Zustand: API curried pour TypeScript strict
   - Supabase: Configuration client moderne

3. **Configuration TypeScript améliorée**:
   - `moduleResolution: "bundler"` (recommandation Expo latest)
   - Path aliases complets
   - Strict mode activé

4. **Structure optimisée**:
   - Clean architecture par feature
   - Séparation claire services/store/hooks
   - Types alignés avec backend

5. **Environment variables**:
   - Préfixe `EXPO_PUBLIC_` pour accès client-side
   - Valeurs par défaut alignées avec backend (localhost:3000)

### 🎯 Différences Clés

| Aspect | Plan Précédent | Plan Révisé (Context7) |
|--------|----------------|------------------------|
| **Supabase JS** | Latest (non spécifié) | v2.50.0 (aligné backend) |
| **Socket.io** | v4.6+ | v4.8.1 (aligné backend) |
| **Zod** | Latest | v3.24.1 (aligné backend) |
| **Android SDK** | 33 | 34 (plus récent) |
| **TypeScript** | Module resolution: node | bundler (Expo recommandé) |
| **Documentation** | Générique | Context7 sources officielles |

---

## Temps Estimé

**30-45 minutes** pour l'exécution complète du plan

## Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI (optionnel, `npx` fonctionne)
- Backend Music Room accessible sur `http://localhost:3000`
