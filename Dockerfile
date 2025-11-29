FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . ./

WORKDIR /app/apps/backend

CMD ["bun", "run", "start"]
