# syntax=docker/dockerfile:1
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install deps (all, not --production, so drizzle-kit is available for generate if needed)
COPY apps/api/package.json ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# Copy migration files and source
COPY apps/api/drizzle ./drizzle
COPY apps/api/drizzle.config.ts ./drizzle.config.ts
COPY apps/api/src ./src

EXPOSE 3001
CMD ["bun", "src/index.ts"]
