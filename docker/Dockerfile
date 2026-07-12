FROM node:24.18.0-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY . .
ARG APP=@platform/go-learning
RUN pnpm --filter ${APP} build

FROM node:24.18.0-alpine AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
ARG APP_DIR=go-learning
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP_DIR}/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/${APP_DIR}/.next/static ./apps/${APP_DIR}/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/go-learning/server.js"]
