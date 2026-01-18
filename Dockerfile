# Use official Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
# (change if your app uses a different port)
EXPOSE 5005

# Start the application
CMD ["node", "index.js"]
