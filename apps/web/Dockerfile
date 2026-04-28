FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json apps/web/
RUN npm install --workspaces=false --prefix apps/web
COPY apps/web ./apps/web
RUN cd apps/web && npm run build

FROM node:20-alpine AS runtime
WORKDIR /app/apps/web
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.mjs ./
EXPOSE 3000
CMD ["npm", "start"]
