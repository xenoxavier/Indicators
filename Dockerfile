FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# Change to non-root user
USER mcp

# Expose port (optional, mainly for documentation)
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["node", "dist/index.js"]