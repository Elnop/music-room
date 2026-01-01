# Build Guide - Zumik

This guide covers building Zumik components for development, testing, and production deployment.

## Table of Contents

- [Overview](#overview)
- [Backend Builds](#backend-builds)
- [Mobile Production Builds](#mobile-production-builds)
- [Build Verification](#build-verification)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

Zumik provides build commands for two main components:

1. **Backend**: TypeScript compilation for validation and production Docker images
2. **Mobile**: Production Android app (AAB) for Google Play Store deployment

**Important**: Normal development does **not** require builds - use `make dev-docker` or `make dev-local` for hot reload during development.

## Backend Builds

### Local TypeScript Compilation

Build backend TypeScript to JavaScript for validation before commits:

```bash
make compile-backend    # TypeScript compilation + type checking
```

**Output**: `backend/dist/` directory with compiled JavaScript

**When to use**:
- Before committing code (validate TypeScript compiles)
- CI/CD pipelines for validation
- Pre-deployment checks

### Production Docker Image

Build production backend Docker image (distroless, 0 CVE):

```bash
make compile-backend-docker
```

**Output**: Docker image `zumik-backend:latest`

**Features**:
- Chainguard distroless base (minimal attack surface)
- Multi-stage build (builder + production)
- Optimized for production deployment

**Deployment workflow**:
```bash
# Build production image
make compile-backend-docker

# Tag for registry
docker tag zumik-backend:latest registry.example.com/zumik:v1.0.0

# Push to registry
docker push registry.example.com/zumik:v1.0.0
```

### Build Verification

Check that backend build artifacts exist:

```bash
make verify-backend
```

Verifies:
- `backend/dist/server.js` exists
- `backend/dist/features/` directory exists

### Clean Build Artifacts

Remove backend build artifacts:

```bash
make build-clean
```

Removes:
- `backend/dist/` directory
- `backend/*.tsbuildinfo` files

## Mobile Production Builds

### Prerequisites

**For EAS Cloud Builds** (recommended):
1. EAS CLI installed: `npm install -g eas-cli`
2. Expo account created: https://expo.dev
3. Logged in: `cd mobile && eas login`

**For Local Builds**:
- Android Studio installed
- Android SDK configured (`ANDROID_HOME` set)
- Java JDK 11 or 17

### Production AAB Build (EAS Cloud)

Build production Android App Bundle for Google Play Store:

```bash
make prod-build
```

**Details**:
- **Format**: AAB (Android App Bundle) - required by Google Play
- **Profile**: production (from `mobile/eas.json`)
- **Duration**: ~15-25 minutes
- **Auto-increment**: versionCode automatically increments
- **Output**: AAB file available on EAS dashboard (https://expo.dev)

**What happens**:
1. Checks EAS CLI is installed and logged in
2. Triggers cloud build on EAS servers
3. Builds optimized AAB for all device architectures
4. Provides download link when complete

### Local Production Build

Build AAB locally (faster, requires Android SDK):

```bash
make prod-build-local
```

**Requirements**:
- Android SDK installed
- `ANDROID_HOME` environment variable set
- `adb` command available

**Advantages**:
- No queue time (faster than cloud)
- Full control over build environment
- Works offline

### Manual Gradle Build

Build AAB manually with Gradle (no EAS):

```bash
make prod-build-manual
```

**Steps**:
1. Runs `expo prebuild` to generate native code
2. Builds AAB with Gradle: `./gradlew bundleRelease`
3. Outputs AAB to `mobile/android/app/build/outputs/bundle/release/`

**Requirements**:
- Production keystore configured (run `make prod-keystore-setup` first)
- Signing configuration in `mobile/android/gradle.properties`

### Version Management

#### Bump Version Interactively

Update app version and versionCode:

```bash
make prod-version-bump
```

**Interactive prompts**:
- New version (e.g., 1.0.1)
- New versionCode (e.g., 2)

**Updates**: `mobile/app.json`

#### Auto-Increment versionCode

Automatically increment versionCode (keeps version same):

```bash
make prod-version-auto
```

**Example**: versionCode 1 → 2

**Note**: With `autoIncrement: true` in `eas.json`, EAS cloud builds automatically increment versionCode. Manual increment is only needed for local builds.

### Keystore Setup

Generate production keystore for app signing (manual builds only):

```bash
make prod-keystore-setup
```

**Interactive prompts**:
- Keystore filename (e.g., `zumik.keystore`)
- Key alias (e.g., `zumik-key`)
- Keystore password
- Key password

**Output**: Keystore file in `mobile/` directory

**Security**:
- ⚠️ **Never commit keystore to git** (already in `.gitignore`)
- Backup keystore to secure location
- Losing keystore = unable to update app on Play Store

**Configuration**: Add credentials to `mobile/android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=zumik.keystore
MYAPP_UPLOAD_KEY_ALIAS=zumik-key
MYAPP_UPLOAD_STORE_PASSWORD=your_password
MYAPP_UPLOAD_KEY_PASSWORD=your_password
```

### Submit to Google Play Store

Submit AAB to Google Play Store via EAS:

```bash
make prod-submit
```

**Requirements**:
- Successful `prod-build` completed
- Google Play Console account configured
- Service account JSON key uploaded to EAS

**What happens**:
1. Downloads latest AAB from EAS
2. Uploads to Google Play Console
3. Creates new release in configured track (internal/beta/production)

**First-time setup**:
1. Create app in Google Play Console
2. Configure app signing (use Play App Signing)
3. Upload service account JSON to EAS: `eas credentials`

### Build Information

Display current production build configuration:

```bash
make prod-info
```

**Shows**:
- App name, package, version, versionCode
- Target SDK version
- EAS project ID
- Build type (AAB)
- Auto-increment setting

## Build Verification

### Check Backend Artifacts

```bash
make verify-backend
```

Ensures `backend/dist/` exists with compiled code.

### Production Release Checklist

Before submitting to Play Store:

- [ ] Version bumped: `make prod-version-bump`
- [ ] AAB built successfully: `make prod-build`
- [ ] App tested on physical device
- [ ] OAuth credentials updated for production signing certificate
- [ ] Privacy policy URL configured
- [ ] App store listing complete (screenshots, description)
- [ ] Content rating questionnaire filled

## CI/CD Integration

### GitHub Actions Example

#### Backend Build Workflow

```yaml
name: Backend Build

on:
  pull_request:
    paths:
      - 'backend/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Build TypeScript
        run: make build

      - name: Verify build artifacts
        run: make verify-backend
```

#### Mobile Production Release

```yaml
name: Production Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: cd mobile && npm ci

      - name: Build production AAB
        run: cd mobile && eas build --platform android --profile production --non-interactive

      - name: Submit to Play Store
        run: cd mobile && eas submit --platform android --latest
```

**Required Secrets**:
- `EXPO_TOKEN`: Personal access token from https://expo.dev/settings/access-tokens

### GitLab CI Example

```yaml
backend-build:
  stage: build
  image: node:20
  script:
    - cd backend
    - npm ci
    - npm run build
    - npm run type-check
  artifacts:
    paths:
      - backend/dist/
  only:
    - merge_requests
    - main

production-release:
  stage: deploy
  image: node:20
  before_script:
    - npm install -g eas-cli
  script:
    - cd mobile
    - eas build --platform android --profile production --non-interactive --no-wait
  only:
    - tags
```

## Troubleshooting

### Backend Build Fails

**Error**: TypeScript compilation errors

**Solution**:
```bash
cd backend
npm run type-check  # See type errors
# Fix errors in source code
npm run build       # Try again
```

**Error**: `backend/dist/server.js not found` after build

**Solution**:
```bash
make build-clean    # Clean old artifacts
make build          # Rebuild
```

### Mobile Build Fails

**Error**: `EAS CLI not installed`

**Solution**:
```bash
npm install -g eas-cli
```

**Error**: `Not logged into EAS`

**Solution**:
```bash
cd mobile
eas login
# Enter Expo credentials
```

**Error**: `Android SDK not found` (local builds)

**Solution**:
```bash
# Install Android Studio
# Set environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Error**: `Missing signing configuration` (manual builds)

**Solution**:
```bash
make prod-keystore-setup
# Follow prompts to generate keystore
# Configure gradle.properties as instructed
```

### Version Issues

**Error**: Google Play rejects APK - "Version code X has already been used"

**Solution**:
```bash
# Option 1: Auto-increment
make prod-version-auto

# Option 2: Manual bump
make prod-version-bump
# Enter versionCode higher than last submission

# Rebuild
make prod-build
```

**Note**: With EAS autoIncrement enabled, this should not happen for cloud builds.

### EAS Build Queued Forever

**Symptom**: Build stuck in queue for >30 minutes

**Solution**:
1. Check EAS status: https://status.expo.dev
2. Try local build: `make prod-build-local`
3. Contact Expo support if persistent

### Play Store Submission Fails

**Error**: "App not available in any country"

**Solution**: Configure countries in Google Play Console → Production → Countries/regions

**Error**: "Missing privacy policy URL"

**Solution**: Add privacy policy URL in Play Console → App content → Privacy policy

**Error**: "Target SDK version too low"

**Solution**: Already fixed - `targetSdkVersion` set to 35 in `app.json`

## Best Practices

### Development Workflow

1. **Daily development**: Use `make dev-docker` (no builds needed)
2. **Before commits**: Run `make build` to validate backend compiles
3. **Pull request checks**: CI runs `make build` automatically
4. **Production releases**: Use `make prod-build` for mobile apps

### Version Numbering

Follow semantic versioning:
- **Major** (1.0.0 → 2.0.0): Breaking changes, major features
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes only

**versionCode**: Always increments sequentially (1, 2, 3, ...). Required by Google Play.

### Security

1. **Never commit**:
   - `*.keystore` files
   - `gradle.properties` with signing credentials
   - Production `.env` files

2. **Keystore backup**: Store in secure location (password manager, encrypted drive)

3. **Use Play App Signing**: Let Google manage your app signing key (can reset upload key if lost)

### Build Performance

**Backend**:
- TypeScript compilation: ~5-10 seconds
- Docker production image: ~2-3 minutes

**Mobile**:
- EAS cloud build: ~15-25 minutes
- EAS local build: ~5-15 minutes
- Manual Gradle build: ~5-10 minutes

**Tip**: Use EAS local builds for faster iteration, cloud builds for CI/CD.

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [Android App Bundle Overview](https://developer.android.com/guide/app-bundle)
- [Makefile Command Reference](./README.md#development-commands)

## Support

- GitHub Issues: https://github.com/Elnop/zumik/issues
- Expo Forums: https://forums.expo.dev
- Google Play Support: https://support.google.com/googleplay/android-developer
