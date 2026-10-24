# Multi-stage Dockerfile for Zumik Backend
# Debian slim (glibc), like mobile/Dockerfile: @ast-grep/cli, a dev dependency,
# ships no musl binary, so npm install fails on Alpine.
FROM node:22-bookworm-slim AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage (for docker-compose dev mode)
FROM base AS development

# The image's npm 10 installs exactly the committed lockfile. The npm cache is
# cleaned in the same layer, so it stays out of the image (make builds without
# BuildKit, see make/config.mk: no cache mount).
RUN npm ci --include=dev && npm cache clean --force

# Copy source code (will be mounted as volume in dev mode)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Builder stage (for production build)
FROM base AS builder

RUN npm ci --include=dev && npm cache clean --force

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS production

WORKDIR /app

# Hides error `why`/`fix` from responses and silences debug logs
ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --no-create-home nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
