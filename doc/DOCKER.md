# Music Room - Docker Guide

This guide explains how to use Docker and Docker Compose to run the Music Room project in a containerized environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Makefile Commands](#makefile-commands)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Production Build](#production-build)

---

## Prerequisites

Before starting, ensure you have installed:

- **Docker** (v20.10+): [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+): Usually included with Docker Desktop
- **Git**: For cloning the repository

Verify your installation:

```bash
docker --version
docker-compose --version
```

---

## Quick Start

### 1. First-Time Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd Music_Room

# Install dependencies and setup environment files
make install
```

**Important:** After running `make install`, edit `backend/.env` to add your Supabase credentials:

```bash
# Edit backend environment
nano backend/.env  # or use your preferred editor

# Add your Supabase URL and keys
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

### 2. Start Development Environment

```bash
# Build and start all services
make dev
```

This will:
- Build Docker images for backend and mobile
- Start both containers in the background
- Enable hot reload for development

### 3. Access Services

Once started, you can access:

- **Backend API**: http://localhost:3000
- **Expo DevTools**: http://localhost:19000
- **Metro Bundler**: http://localhost:8081

### 4. View Logs

```bash
# View all logs
make logs

# View specific service logs
make logs-backend
make logs-mobile
```

### 5. Stop Services

```bash
# Stop containers (data is preserved)
make stop

# Or completely remove containers
make down
```

---

## Architecture

The project consists of two main services:

```
┌─────────────────────────────────────────────────┐
│           Docker Compose Network                │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Backend Container                       │  │
│  │  - Node.js 18 Alpine                     │  │
│  │  - Express + Socket.io                   │  │
│  │  - Port 3000                             │  │
│  │  - Hot reload enabled                    │  │
│  │  - Volume: ./backend → /app              │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Mobile Container                        │  │
│  │  - Node.js 18 Alpine + Expo CLI          │  │
│  │  - React Native / Expo                   │  │
│  │  - Ports: 8081, 19000-19002              │  │
│  │  - Hot reload enabled                    │  │
│  │  - Volume: ./mobile → /app               │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
                      │
                      │ API Connection
                      ▼
            ┌─────────────────┐
            │ Supabase Cloud  │
            │ (PostgreSQL +   │
            │  Auth)          │
            └─────────────────┘
```

### Key Features

- **Hot Reload**: Source code is mounted as volumes, changes are reflected immediately
- **Network Isolation**: Services communicate via Docker network
- **Port Mapping**: All necessary ports exposed to host machine
- **Persistent Data**: node_modules are preserved in Docker volumes

---

## Makefile Commands

### Essential Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands with descriptions |
| `make install` | First-time setup: install dependencies and create .env files |
| `make dev` | Show development mode menu (choose your workflow) |
| `make dev-docker` | Start all services in Docker development mode |
| `make stop` | Stop all running containers |
| `make logs` | View logs from all services |
| `make ps` | Show status of all containers |

### Development Commands

| Command | Description |
|---------|-------------|
| `make start` | Start existing containers (without rebuild) |
| `make restart` | Restart all services |
| `make down` | Stop and remove all containers |
| `make logs-backend` | View backend logs only |
| `make logs-mobile` | View mobile logs only |

### Build Commands

| Command | Description |
|---------|-------------|
| `make build` | Build all Docker images |
| `make build-backend` | Build backend image only |
| `make build-mobile` | Build mobile image only |
| `make deploy-build` | Build production-ready images |

### Testing & Quality Commands

| Command | Description |
|---------|-------------|
| `make test` | Run all tests |
| `make test-backend` | Run backend tests |
| `make lint` | Run linters on all code |
| `make format` | Format all code with Prettier |

### Utility Commands

| Command | Description |
|---------|-------------|
| `make shell-backend` | Open shell in backend container |
| `make shell-mobile` | Open shell in mobile container |
| `make health` | Check health status of all services |
| `make clean` | Remove all containers, images, and dependencies |
| `make prune` | Clean up unused Docker resources |
| `make info` | Show system information |

---

## Development Workflow

### Daily Development

```bash
# Morning: Start your environment
make dev

# View logs if needed
make logs

# Make changes to code (hot reload is active)
# Edit files in backend/ or mobile/

# Afternoon: Check everything is running
make ps
make health

# Evening: Stop services
make stop
```

### Rebuilding After Dependency Changes

If you add new npm packages:

```bash
# Stop services
make stop

# Rebuild images
make build

# Restart services
make dev
```

### Running Commands Inside Containers

```bash
# Backend shell
make shell-backend
# Now you're inside the container
npm run type-check
exit

# Mobile shell
make shell-mobile
# Now you're inside the container
npx expo install some-package
exit
```

### Testing Mobile App on Physical Device

1. Ensure your computer and mobile device are on the **same network**

2. Start services:
   ```bash
   make dev
   ```

3. Find your computer's local IP address:
   ```bash
   # On Linux/Mac
   ifconfig | grep "inet "

   # On Windows
   ipconfig
   ```

4. On your mobile device:
   - Install **Expo Go** app from Play Store / App Store
   - Open Expo Go
   - Scan the QR code from http://localhost:19000
   - Or manually enter: `exp://YOUR_LOCAL_IP:8081`

---

## Troubleshooting

### Issue: Containers won't start

**Solution:**
```bash
# Check if ports are already in use
lsof -i :3000  # Backend
lsof -i :8081  # Mobile

# Force remove old containers
make down
docker system prune -f

# Rebuild and start
make build
make dev
```

### Issue: "Cannot connect to Supabase"

**Solution:**
```bash
# Check if .env file exists and has correct values
cat backend/.env

# Verify Supabase credentials are correct
# Check backend logs
make logs-backend
```

### Issue: Mobile app can't connect to backend

**Solution:**

1. Check containers are running:
   ```bash
   make ps
   ```

2. Check backend health:
   ```bash
   make health
   ```

3. If testing on physical device, ensure:
   - Device and computer on same WiFi network
   - Backend URL in mobile app points to your local IP (not localhost)

### Issue: Hot reload not working

**Solution:**
```bash
# Restart services
make restart

# If still not working, rebuild
make down
make build
make dev
```

### Issue: "Out of memory" or slow performance

**Solution:**
```bash
# Check Docker resource usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Recommended: 4GB+ RAM

# Clean up unused resources
make prune
```

### Issue: Permission errors

**Solution:**
```bash
# Fix ownership (Linux only)
sudo chown -R $USER:$USER backend/node_modules mobile/node_modules

# Or rebuild containers
make clean
make install
make dev
```

---

## Production Build

### Building Production Images

```bash
# Build optimized production image
make deploy-build
```

This creates a multi-stage production image:
- Smaller size (no dev dependencies)
- Compiled TypeScript code
- Non-root user for security
- Optimized for deployment

### Deploying to Cloud

The production image can be deployed to:

- **AWS**: ECS, Fargate, EC2
- **Google Cloud**: Cloud Run, GKE
- **Azure**: Container Instances, AKS
- **DigitalOcean**: App Platform
- **Heroku**: Container Registry

Example deployment (AWS ECR):

```bash
# Tag image for ECR
docker tag music-room-backend:latest \
  your-account.dkr.ecr.us-east-1.amazonaws.com/music-room-backend:latest

# Push to ECR
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/music-room-backend:latest
```

---

## Environment Variables

### Backend (.env)

Required variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

### Mobile (.env)

Optional variables:

```bash
# Backend API URL (inside Docker network)
API_URL=http://backend:3000

# For physical device testing, use your local IP:
# API_URL=http://192.168.1.X:3000
```

---

## Best Practices

1. **Always run `make install` after cloning**
   - Sets up environment files
   - Installs dependencies

2. **Check logs regularly**
   - Use `make logs` to monitor services
   - Identify issues early

3. **Rebuild after dependency changes**
   - Run `make build` after `npm install`

4. **Keep .env files secure**
   - Never commit .env files
   - Use .env.example as template

5. **Clean up periodically**
   - Run `make prune` to free disk space
   - Docker images can accumulate over time

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Expo Docker Guide](https://docs.expo.dev/guides/using-expo-with-docker/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs: `make logs`
3. Check service health: `make health`
4. Try rebuilding: `make clean && make install && make dev-docker`

For project-specific help, refer to the main [README.md](./README.md).
