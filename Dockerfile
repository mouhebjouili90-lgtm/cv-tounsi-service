# ── Multi-stage Dockerfile for CV Tounsi SaaS ──
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile || npm install

# Build client and server
COPY . .
RUN npm run build

# ── Production Image ──
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json ./
RUN npm install -g pnpm && pnpm install --prod || npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env* ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
