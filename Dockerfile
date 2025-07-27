# Use official Node.js 20 image (latest LTS with newer npm)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Update npm and install dependencies
RUN npm install -g npm@latest && \
    npm ci --omit=dev

# Copy application code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose port (Railway will override this)
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 