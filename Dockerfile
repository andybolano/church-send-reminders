# Use official Node.js 20 image (latest LTS)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production --no-package-lock

# Copy application code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose port (Railway will override this)
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 