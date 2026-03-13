FROM oven/bun:1 AS base
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 ffmpeg && \
    bun install -g yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

COPY . .

EXPOSE 3000
CMD ["bun", "run", "index.ts"]
