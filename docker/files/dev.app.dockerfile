FROM node:20-alpine AS base

WORKDIR /app

FROM base AS deps

RUN apk add --no-cache libc6-compat

COPY package*.json ./

RUN npm ci

FROM base AS builder

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3002

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http');const req=http.get('http://127.0.0.1:'+(process.env.PORT||3002),(res)=>{process.exit(res.statusCode&&res.statusCode<500?0:1)});req.on('error',()=>process.exit(1));" || exit 1

CMD ["node", "server.js"]