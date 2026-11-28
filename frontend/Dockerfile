# Image produksi frontend Kodie (Next.js, output standalone) untuk Coolify.
# Coolify: Build pack = Dockerfile, Base Directory = /frontend, Dockerfile Location = /Dockerfile, Ports Exposes = 3000.

# ---------- 1. Dependensi ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2. Build ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabel NEXT_PUBLIC_* ditanam ke bundle saat build, jadi harus tersedia sebagai build arg.
# Di Coolify set setiap variabel ini dengan "Build time" = "Available during build".
ARG NEXT_PUBLIC_USE_MOCK=false
ARG NEXT_PUBLIC_FITUR_LANJUTAN=true
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_USE_MOCK=$NEXT_PUBLIC_USE_MOCK \
    NEXT_PUBLIC_FITUR_LANJUTAN=$NEXT_PUBLIC_FITUR_LANJUTAN \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------- 3. Runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# wget bawaan BusyBox Alpine; dipakai juga oleh healthcheck HTTP Coolify.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/sehat || exit 1

CMD ["node", "server.js"]
