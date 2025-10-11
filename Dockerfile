# Multi-stage build for TempoVoice Dashboard

# ====== Dependencies ======
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install

# ====== Build ======
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure public directory exists
RUN mkdir -p ./public

# Generate Prisma client and build Next.js
RUN npx prisma generate && npm run build

# ====== Runtime ======
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Don't set PORT here - let Railway set it
EXPOSE 8080

# Copy necessary files
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./start.sh

# Create data directory for SQLite (fallback)
RUN mkdir -p /app/data

# Make startup script executable
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
