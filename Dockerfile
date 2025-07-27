# Use official Node.js 18 image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose port (Railway will override this)
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 