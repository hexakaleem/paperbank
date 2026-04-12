FROM node:20-alpine AS build

ARG VITE_API_URL=/api

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN VITE_API_URL=${VITE_API_URL} npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config (NOT inline echo — avoids shell variable issues)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
