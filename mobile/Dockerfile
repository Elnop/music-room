# Dockerfile for Music Room Mobile (Expo/React Native)
# Using Chainguard Node.js image - ZERO CVE vulnerabilities
FROM cgr.dev/chainguard/node:latest-dev

# Switch to root for global installations and setup
USER root

# Install Expo CLI globally
RUN npm install -g expo-cli @expo/ngrok

# Create shared directory for tunnel URL communication
# Mobile container needs read access to files written by backend
RUN mkdir -p /tmp/shared && \
    chown -R node:node /tmp/shared && \
    chmod 755 /tmp/shared

WORKDIR /app

# Fix permissions for the node user
RUN chown -R node:node /app

# Switch back to node user
USER node

# Install dependencies first (better caching)
COPY --chown=node:node package*.json ./
RUN npm install

# Copy source code
COPY --chown=node:node . .

# Switch to root to ensure .expo directory has correct permissions
USER root
RUN mkdir -p /app/.expo && chown -R node:node /app/.expo && chmod -R 755 /app/.expo

# Switch back to node user
USER node

# Make scripts executable
RUN chmod +x setup-eas-auto.sh start-expo.sh start-expo-tunnel.sh 2>/dev/null || true

# Expose Expo ports
# 8081: Metro bundler
# 19000: Expo DevTools
# 19001: Expo DevTools (secure)
# 19002: Expo DevTools (legacy)
EXPOSE 8081 19000 19001 19002

# Set environment variables for Expo
# EXPO_DEVTOOLS_LISTEN_ADDRESS allows DevTools to be accessible from outside the container
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
# REACT_NATIVE_PACKAGER_HOSTNAME sets the IP address that devices will connect to
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Reset entrypoint to use shell instead of node
ENTRYPOINT []

# Start Expo development server using the startup script
CMD ["sh", "start-expo.sh"]
