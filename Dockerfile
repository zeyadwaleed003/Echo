# 1- Base
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

# 2- Development
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD npm run m:r:dev && npm run start:dev

# 3- Build
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production
FROM base AS production
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD npm run m:r:prod && npm run start:prod