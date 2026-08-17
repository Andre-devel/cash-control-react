# Stage 1: Build
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL
# Embedded into import.meta.env at build time (Vite auto-exposes any VITE_-prefixed
# var) so the UI can show which build is actually deployed.
ARG VITE_GIT_COMMIT=unknown
ARG VITE_BUILD_TIME=unknown
RUN pnpm build

# Stage 2: Runtime (Nginx)
FROM nginx:1.27-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
