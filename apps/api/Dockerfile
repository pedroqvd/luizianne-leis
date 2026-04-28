FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/
RUN npm install --workspaces=false --omit=dev=false --prefix apps/api
COPY apps/api ./apps/api
COPY db ./db
RUN cd apps/api && npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/db ./db
WORKDIR /app/apps/api
EXPOSE 8000
CMD ["node", "dist/main.js"]
