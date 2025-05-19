# Use official Node.js image to build the app
FROM node:20 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Production image - Serve the build with nginx
FROM nginx:stable-alpine

# Copy the React build from previous step
COPY --from=build /app/build /usr/share/nginx/html


COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
