# Stage 1: Build TypeScript source
FROM node:20-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-bullseye-slim AS runner

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "dist/server.js"]
