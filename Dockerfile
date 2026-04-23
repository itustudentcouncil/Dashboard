# Use the official Node.js20 image as a base
FROM node:20

# Expose the port the website runs on (3500 as 3000 is taken by studentcouncil.dk)
EXPOSE 3500
# Set environment variable so NextJS runs on port 8000
ENV PORT=3500

# Set the working directory in the container to /app
WORKDIR /app
# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./


# Install dependencies
RUN npm install
# Install typescript
RUN npm install typescript

# Copy the rest of the application code
# This is done after installing dependencies to improve performance with Docker cache
COPY . .


# Build the Next.js server
RUN npm run build

# Start the Next.js server
CMD ["npm", "run", "start"]