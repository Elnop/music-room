# Dockerfile for Zumik Mobile (Expo/React Native): Metro for make dev-docker and dev-tunnel
# Node 22 (LTS), same major as backend/Dockerfile, Dockerfile.android-build and .nvmrc.
# Chainguard only publishes unpinned tags (latest, latest-dev) for free, so the
# official Debian slim image is used to pin the Node version.
# No global CLI: start-expo.sh runs the project's own expo, and @expo/ngrok is a
# dependency of mobile/package.json.
FROM node:22-bookworm-slim

# /tmp/shared: tunnel URL written by the backend container (shared volume)
RUN mkdir -p /tmp/shared /app/.expo && chown -R node:node /tmp/shared /app

WORKDIR /app
USER node

# Exactly the committed lockfile. The npm cache is cleaned in the same layer, so
# it stays out of the image (make builds without BuildKit: no cache mount).
COPY --chown=node:node package*.json ./
RUN npm ci && npm cache clean --force

COPY --chown=node:node . .

# 8081: Metro bundler; 19000-19002: Expo DevTools
EXPOSE 8081 19000 19001 19002

# EXPO_DEVTOOLS_LISTEN_ADDRESS allows DevTools to be accessible from outside the container
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
# REACT_NATIVE_PACKAGER_HOSTNAME sets the IP address that devices will connect to
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Reset entrypoint to use shell instead of node
ENTRYPOINT []

CMD ["sh", "scripts/start-expo.sh"]
