# Multi-stage Dockerfile for Music Room Backend
# Stage 1: Development (with hot reload)
# Using Chainguard Node.js image - ZERO CVE vulnerabilities
FROM cgr.dev/chainguard/node:latest-dev AS development

# Switch to root to set up directories with correct permissions
USER root

# Install ngrok globally for tunnel mode (requires root)
RUN npm install -g @expo/ngrok

# Create shared directory for tunnel URL communication with correct permissions
# Must be done as root, but owned by node user (UID 65532)
RUN mkdir -p /tmp/shared && \
    chown -R node:node /tmp/shared && \
    chmod 755 /tmp/shared

WORKDIR /app

# Fix permissions for the node user (uid 65532 in Chainguard images)
RUN chown -R node:node /app

# Switch back to node user
USER node

# Install dependencies first (better caching)
COPY --chown=node:node package*.json ./
RUN npm install

# Copy source code
COPY --chown=node:node . .

# Copy tunnel startup script
COPY --chown=node:node start-with-tunnel.sh ./

# Expose backend port and ngrok web interface port
EXPOSE 3000
EXPOSE 4040

# Reset entrypoint to use shell instead of node
ENTRYPOINT []

# Development command with hot reload using tsx
CMD ["sh", "-c", "npm run dev"]


# Stage 2: Builder (compile TypeScript)
FROM cgr.dev/chainguard/node:latest-dev AS builder

# Switch to root to set up directories
USER root

WORKDIR /app

# Fix permissions
RUN chown -R node:node /app

# Switch back to node user
USER node

# Copy dependencies
COPY --chown=node:node package*.json ./
RUN npm install

# Copy source and build
COPY --chown=node:node . .
RUN npm run build


# Stage 3: Production (minimal distroless image - ZERO CVE)
FROM cgr.dev/chainguard/node:latest AS production

WORKDIR /app

# Copy package files and compiled code with correct ownership
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/node_modules ./node_modules

# Chainguard images already run as non-root user (uid 65532)
# No need to create user manually or install dependencies again

EXPOSE 3000

# Run the application (distroless already has proper init)
CMD ["dist/index.js"]
