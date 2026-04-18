# Use an official lightweight Node.js image
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package files first for efficient caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Run the server
CMD ["npm", "start"]
