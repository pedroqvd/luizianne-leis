FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json apps/web/
RUN npm install --workspaces=false --prefix apps/web
COPY apps/web ./apps/web
RUN cd apps/web && npm run build

# FIX O2 (BAIXO): Multi-stage otimizado — usa Next.js standalone output.
# Copia apenas os arquivos necessários para runtime, reduzindo image size ~60%.
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Next.js standalone output (requer output: 'standalone' em next.config.mjs)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

# Standalone server não precisa de npm/node_modules
CMD ["node", "apps/web/server.js"]
