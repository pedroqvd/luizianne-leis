FROM node:22-alpine AS builder
WORKDIR /app

# Install all deps (including devDeps for the build).
# We copy the root package.json + lockfile so npm workspaces resolve correctly.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace=@luizianne/api --include=dev

COPY apps/api ./apps/api
COPY db ./db

RUN cd apps/api && npx nest build

# Drop devDependencies to slim runtime layer.
RUN cd apps/api && npm prune --omit=dev

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/package.json   ./apps/api/
COPY --from=builder /app/apps/api/node_modules   ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist           ./apps/api/dist
COPY --from=builder /app/apps/api/scripts        ./apps/api/scripts
COPY --from=builder /app/db                      ./db

# Entrypoint: migrate then start.
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/apps/api
EXPOSE 8000
ENTRYPOINT ["/docker-entrypoint.sh"]
