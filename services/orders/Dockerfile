
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root and workspace package metadata so npm can install workspaces
COPY package*.json ./
COPY services/orders/package*.json ./services/orders/
COPY libs/logger/package*.json ./libs/logger/
COPY libs/metrics/package*.json ./libs/metrics/

# Install all dependencies (workspace-aware)
RUN npm install --no-audit --no-fund

# Copy only service source and shared libs after install
COPY services/orders ./services/orders
COPY libs ./libs

# Build libs first then the orders service
RUN npm run build --workspace=@kafka/logger
RUN npm run build --workspace=@kafka/metrics
RUN npm run build --workspace=orders-service

FROM node:18-alpine AS runner
WORKDIR /app/services/orders

ENV NODE_ENV=production

# Copy built service and node_modules from the builder stage
COPY --from=builder /app/services/orders/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001 9101

CMD ["node", "dist/main.js"]
