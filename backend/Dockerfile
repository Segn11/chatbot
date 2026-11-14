# Production Dockerfile for Backend
FROM node:20-alpine AS base

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY src/ ./src/

# Use non-root node user for security
USER node

# Environment defaults
ENV PORT=5000 \
    NODE_ENV=production

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "src/index.js"]

