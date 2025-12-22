FROM oven/bun:alpine AS builder
WORKDIR /home/bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts --production

FROM oven/bun:alpine
WORKDIR /home/bun

COPY --from=builder /home/bun/node_modules node_modules
COPY package.json .
COPY src src

CMD ["bun", "run", "src/index.ts"]
