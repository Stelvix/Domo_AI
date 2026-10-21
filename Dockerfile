# -----------------------------------------------------------------------------
# Stage 1: Build the Vue 3 PWA Frontend
# -----------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Copy monorepo manifests
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies with frozen lockfile
RUN npm ci

# Copy frontend code and compile PWA
COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# -----------------------------------------------------------------------------
# Stage 2: Prepare Backend Dependencies & Prisma Client
# -----------------------------------------------------------------------------
FROM node:22-alpine AS backend-builder
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/office.db"

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY backend/prisma ./backend/prisma
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# -----------------------------------------------------------------------------
# Stage 3: Minimal Production Runner
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/office.db"
ENV OLLAMA_BASE_URL="http://host.docker.internal:11434"
ENV SERVE_STATIC=true

# Security: Install dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache dumb-init

# Prepare persistent volume directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app

# Copy production node_modules and root package manifest
COPY --chown=node:node --from=backend-builder /app/node_modules ./node_modules
COPY --chown=node:node --from=backend-builder /app/package.json ./package.json

# Copy backend source code & Prisma schema
COPY --chown=node:node backend/ ./backend

# Copy compiled frontend PWA assets
COPY --chown=node:node --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy entrypoint script
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Run as unprivileged node user
USER node

EXPOSE 3001

VOLUME ["/app/data"]

ENTRYPOINT ["/usr/bin/dumb-init", "--", "./docker-entrypoint.sh"]
