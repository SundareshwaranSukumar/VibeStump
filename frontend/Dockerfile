FROM node:20-slim AS builder
WORKDIR /app
COPY package.json ./
# Install deps; then explicitly add the glibc Linux oxide binary needed for Tailwind v4 in Docker
RUN npm install && npm install @tailwindcss/oxide-linux-x64-gnu --no-save
COPY . .
RUN npm run build

FROM node:20-slim
RUN apt-get update && apt-get install -y curl --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
