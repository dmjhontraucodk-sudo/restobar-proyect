# Backend Dockerfile - Restobar Project
# Multi-stage build para producción optimizada

# ==================== STAGE 1: BUILD ====================
FROM node:20-slim AS builder

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluyendo devDependencies para build)
RUN npm ci

# Variable dummy para prisma generate (no se usa realmente)
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"

# Generar cliente Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ==================== STAGE 2: PRODUCTION ====================
FROM node:20-slim AS production

# Instalar solo openssl (necesario para Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar Prisma schema y cliente generado
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copiar código compilado
COPY --from=builder /app/dist ./dist

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/server.js"]
