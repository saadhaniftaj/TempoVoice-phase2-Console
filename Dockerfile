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

# Create data directory
RUN mkdir -p /app/data

# Create entrypoint script
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "🚀 Starting TempoVoice Dashboard..."' >> /app/entrypoint.sh && \
    echo 'echo "📊 Running database migration..."' >> /app/entrypoint.sh && \
    echo 'npx prisma db push --accept-data-loss --skip-generate 2>&1 || echo "⚠️ Migration failed"' >> /app/entrypoint.sh && \
    echo 'echo "👤 Creating admin user if needed..."' >> /app/entrypoint.sh && \
    echo 'node -e "const { PrismaClient } = require(\"./app/generated/prisma\"); const bcrypt = require(\"bcryptjs\"); (async () => { const p = new PrismaClient(); try { const e = await p.user.findFirst({ where: { email: \"admin@tempovoice.com\" } }); if (!e) { await p.user.create({ data: { email: \"admin@tempovoice.com\", passwordHash: await bcrypt.hash(\"admin123\", 10), role: \"ADMIN\", tenantId: \"default\" } }); console.log(\"✅ Admin created\"); } else { console.log(\"✅ Admin exists\"); } } catch (err) { console.log(\"⚠️ Admin setup failed:\", err.message); } finally { await p.\\$disconnect(); } })();" 2>&1 || echo "⚠️ Admin setup failed"' >> /app/entrypoint.sh && \
    echo 'echo "🎯 Starting Next.js..."' >> /app/entrypoint.sh && \
    echo 'exec npm run start' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
