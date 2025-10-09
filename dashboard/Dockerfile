# Multi-stage build for TempoVoice Dashboard

# ====== Dependencies ======
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# ====== Build ======
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate && npm run build

# ====== Runtime ======
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
EXPOSE 3000

# Copy necessary files
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma
COPY --from=builder /app/prisma ./prisma

# Create data directory for SQLite (fallback)
RUN mkdir -p /app/data

CMD ["npm", "run", "start"]
