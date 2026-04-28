# ── Stage 1: Build React client ────────────────────────────────────────
FROM node:20-alpine AS client-builder

WORKDIR /app

# Copy logo asset FIRST so Vite can resolve @assets alias
COPY assets/ ./assets/

# Install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy client source
COPY client/ ./client/

# Copy logos.png into public/assets so Vite can find it during build
RUN mkdir -p ./client/public/assets && \
    cp ./assets/logos.png ./client/public/assets/logos.png

# Build React app
RUN cd client && npm run build

# ── Stage 2: Production server ──────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install only production server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server source
COPY server/ ./server/

# Copy built React app from stage 1
COPY --from=client-builder /app/client/dist ./client/dist

# Cloud Run sets PORT env var automatically
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/server.js"]
