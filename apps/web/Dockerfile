# syntax=docker/dockerfile:1
# ---- build ----
FROM oven/bun:1-alpine AS build
WORKDIR /build

COPY apps/web/package.json ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY apps/web/index.html ./
COPY apps/web/vite.config.ts ./
COPY apps/web/tailwind.config.ts ./
COPY apps/web/postcss.config.js ./
COPY apps/web/tsconfig*.json ./
COPY apps/web/src ./src

RUN bun run build

# ---- serve ----
FROM nginx:1.27-alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
