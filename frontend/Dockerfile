FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_APP_URL=https://sahraaaaaaaaaaa.shop
ARG NEXT_PUBLIC_API_URL=https://api.sahraaaaaaaaaaa.shop
ARG NEXT_PUBLIC_APP_NAME=SAHRAA
# EasyPanel: Environment Variables are passed here as build-args. No Build Arguments UI.
ARG NEXT_PUBLIC_META_PIXEL_ID
ARG NEXT_PUBLIC_TIKTOK_PIXEL_ID
ARG NEXT_PUBLIC_SNAP_PIXEL_ID
ARG META_PIXEL_ID
ARG TIKTOK_PIXEL_ID
ARG SNAP_PIXEL_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID
ENV NEXT_PUBLIC_TIKTOK_PIXEL_ID=$NEXT_PUBLIC_TIKTOK_PIXEL_ID
ENV NEXT_PUBLIC_SNAP_PIXEL_ID=$NEXT_PUBLIC_SNAP_PIXEL_ID
ENV META_PIXEL_ID=$META_PIXEL_ID
ENV TIKTOK_PIXEL_ID=$TIKTOK_PIXEL_ID
ENV SNAP_PIXEL_ID=$SNAP_PIXEL_ID
ENV NEXT_TELEMETRY_DISABLED=1
RUN if [ -n "${NEXT_PUBLIC_META_PIXEL_ID:-$META_PIXEL_ID}" ]; then \
      echo "sahraa: meta pixel available for next build"; \
    else \
      echo "sahraa: meta pixel missing at next build"; \
    fi \
 && NEXT_PUBLIC_META_PIXEL_ID="${NEXT_PUBLIC_META_PIXEL_ID:-$META_PIXEL_ID}" \
    NEXT_PUBLIC_TIKTOK_PIXEL_ID="${NEXT_PUBLIC_TIKTOK_PIXEL_ID:-$TIKTOK_PIXEL_ID}" \
    NEXT_PUBLIC_SNAP_PIXEL_ID="${NEXT_PUBLIC_SNAP_PIXEL_ID:-$SNAP_PIXEL_ID}" \
    npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
