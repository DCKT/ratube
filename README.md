# ratube

A YouTube client for TV platforms (AppleTV, Android TV) using the Invidious API for privacy-focused video browsing and a custom stream proxy for playback.

## Features

- Browse and search YouTube videos and channels
- Subscribe to channels and watch their latest videos
- Adaptive streaming with separate video/audio tracks and muxed fallback
- TV-optimized UI with focus navigation
- Configurable Invidious instance and stream proxy

## Tech Stack

**Frontend:** Expo (with TV support), React Native, Expo Router, Expo Video/Audio, TypeScript

**Server:** Bun, yt-dlp, FFmpeg, Docker

## Getting Started

### Frontend

```bash
npm install
npm run start       # Start Expo dev server
npm run ios         # Run on AppleTV (EXPO_TV=1)
npm run android     # Run on Android TV
npm run web         # Run web version
```

### Server

The stream proxy extracts YouTube formats via yt-dlp and proxies video/audio streams with range request support.

```bash
cd server
bun install
bun run index.ts        # Start server on port 3000
bun --watch index.ts    # Development mode with hot reload
```

Or with Docker:

```bash
docker build -f server/Dockerfile -t ratube-server .
docker run -p 3000:3000 ratube-server
```

### Configuration

In the app settings, configure:

- **Invidious instance URL** — the Invidious API endpoint for video metadata
- **Stream proxy URL** — the ratube server endpoint for video playback
