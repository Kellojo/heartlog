FROM node:24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ py3-setuptools

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle

RUN mkdir -p /data/uploads/originals /data/uploads/thumbnails

ENV DATABASE_URL=/data/app.db
ENV UPLOADS_DIR=/data/uploads
ENV ORIGIN=http://localhost:3000
ENV BETTER_AUTH_SECRET=
ENV PORT=3000
ENV BODY_SIZE_LIMIT=25M

EXPOSE 3000

CMD ["node", "build/index.js"]