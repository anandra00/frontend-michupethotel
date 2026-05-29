# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set Build Arguments for Vite env variables
ARG VITE_API_URL
ARG VITE_MIDTRANS_CLIENT_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MIDTRANS_CLIENT_KEY=$VITE_MIDTRANS_CLIENT_KEY

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
