# MindCare frontend: build with Node 20, serve the static files with nginx.

# ---------- 1. Build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first: this layer is cached until package*.json changes
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The API address is baked into the JavaScript at BUILD time (Vite reads it while building).
# It is the address the BROWSER uses, so it must be reachable from the user's machine
# (e.g. http://localhost:8000/api), not a Docker-internal name like http://backend:8000.
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- 2. Serve ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
