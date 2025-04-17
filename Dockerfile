# -------------------------------------------------------
# Base build stage
FROM node:22.2.0 AS build

LABEL maintainer="Ankit Thapar <athapar4@myseneca.ca>"
LABEL description="Fragments Node.js microservice"

# Set working directory
WORKDIR /app

# Install only production dependencies first for caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# -------------------------------------------------------
# Production stage
FROM node:22.2.0-alpine AS production

# Environment variables
ENV PORT=${PORT:-8080}
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Working directory inside container
WORKDIR /app

# Copy from build stage
COPY --from=build /app /app

# Expose port (based on $PORT)
EXPOSE ${PORT}

# Health check to verify container is working
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/v1/fragments || exit 1

# Start the app using node directly
CMD ["node", "src/index.js"]
