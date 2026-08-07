# Use Node.js 20 Alpine for smaller image size
FROM node@sha256:c0602f06b4d3fbe2e9d2f211326c596ea67fb90956b6b3e944b7d159a224ba46

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown nodejs:nodejs /app

USER nodejs

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies (lock-aware)
RUN npm install && npm cache clean --force

# Copy source code
COPY --chown=nodejs:nodejs . .

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
