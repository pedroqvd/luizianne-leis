FROM node:22-alpine AS builder
WORKDIR /app

# install all deps (including devDeps for the build)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace=@luizianne/api

COPY apps/api ./apps/api
COPY db ./db

RUN cd apps/api && npx nest build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules  ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist          ./apps/api/dist
COPY --from=builder /app/db                     ./db

# migration runner (ts-node not available in runtime, use compiled version)
COPY --from=builder /app/apps/api/src/infra/database/run-migrations.ts ./apps/api/src/infra/database/

# Entrypoint: migrate then start
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/apps/api
EXPOSE 8000
ENTRYPOINT ["/docker-entrypoint.sh"]
