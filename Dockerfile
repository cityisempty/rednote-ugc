# ============ Stage 1: Build Client ============
FROM node:20-alpine AS client-build
WORKDIR /app

COPY package.json ./
COPY shared/ shared/
COPY client/ client/

# package-lock.json is generated on macOS and locks darwin-specific
# optional deps (rollup native binaries). Drop it so npm resolves
# the correct linux-musl variants fresh.
RUN npm install --workspace=client --workspace=shared --include-workspace-root
ENV VITE_API_URL=/api
RUN npm run build --workspace=client


# ============ Stage 2: Build Server ============
FROM node:20-alpine AS server-build
WORKDIR /app

COPY package.json ./
COPY shared/ shared/
COPY server/ server/

RUN npm install --workspace=server --workspace=shared --include-workspace-root
RUN npx --workspace=server prisma generate
RUN npm run build --workspace=server


# ============ Stage 3: Production ============
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache nginx openssl

# Install tsx globally for prisma seed at startup
RUN npm install -g tsx

# Copy server compiled output (tsc outputs to dist/server/src/ due to shared include)
COPY --from=server-build /app/server/dist/ server/dist/
COPY --from=server-build /app/server/package.json server/package.json

# Copy ALL node_modules from root (npm workspaces hoists deps here)
COPY --from=server-build /app/node_modules/ node_modules/

# Prisma schema + migrations + seed
COPY --from=server-build /app/server/prisma/ server/prisma/

# Prompt files (runtime fallback) - placed relative to compiled services
COPY server/src/prompts/ server/dist/server/src/prompts/
# Also copy to server/src/prompts/ for seed.ts which reads from source path
COPY server/src/prompts/ server/src/prompts/

# Shared types (seed.ts imports from shared)
COPY shared/ shared/

# Built client
COPY --from=client-build /app/client/dist/ client/dist/

# Nginx config
COPY deploy/nginx.conf /etc/nginx/http.d/default.conf

# Startup script
COPY deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Persistent uploads
RUN mkdir -p /app/server/uploads

EXPOSE 80

CMD ["/app/start.sh"]
