# Use Node.js 20 LTS slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Cloud Run uses PORT env var (defaults to 8080)
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "src/index.js"]
