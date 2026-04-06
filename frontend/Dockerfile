# Use official Node.js image with Alpine for slimness
FROM node:18-alpine as build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything else
COPY . .

# Build the frontend App
RUN npm run build

# Stage 2: Serve output with Nginx
FROM nginx:alpine

# Copy the build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom Nginx config to replace the default
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Internal inside Docker)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
