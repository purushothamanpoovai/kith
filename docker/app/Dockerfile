FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://kith:kith@localhost:5432/kith"
ENV AUTH_SECRET="build-time-placeholder"
ENV MEDIA_ROOT="/tmp/media"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL="postgresql://kith:kith@localhost:5432/kith"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates gosu fonts-noto-core fonts-noto-ui-core \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY docker/app/docker-entrypoint.sh /app/docker-entrypoint.sh

RUN npm install --omit=dev prisma@7.10.0 tsx @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg bcryptjs dotenv \
  && npx prisma generate \
  && chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /data/media \
  && chown -R nextjs:nodejs /data/media

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=8 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
