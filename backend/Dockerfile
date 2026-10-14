FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN chmod +x docker-entrypoint.sh \
  && mkdir -p /app/public/uploads \
  && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
