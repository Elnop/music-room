# Multi-stage Dockerfile for Zumik Backend
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage (for docker-compose dev mode)
FROM base AS development

# Install ALL dependencies (including devDependencies)
RUN npm install --include=dev

# Copy source code (will be mounted as volume in dev mode)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Builder stage (for production build)
FROM base AS builder

# Install ALL dependencies (including devDependencies for build)
RUN npm install --include=dev

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only what's needed
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
