FROM node:22-alpine

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create data directory for sqlite volume
RUN mkdir -p /data

# Set environment to production
ENV NODE_ENV=production
ENV DB_PATH=/data/deals.db

# Start the bot
CMD ["node", "index.js"]
