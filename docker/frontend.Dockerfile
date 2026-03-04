FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY angular.json ./
COPY jest.config.js ./
COPY ngsw-config.json ./
COPY package.json ./
COPY playwright.config.ts ./
COPY proxy.conf.json ./
COPY server.ts ./
COPY setup-jest.ts ./
COPY tsconfig*.json ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/llm-prompt-purify/browser /usr/share/nginx/html

EXPOSE 80
