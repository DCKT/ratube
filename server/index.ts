import { log, logError, getLogs } from "./lib/logger";
import { proxyStream } from "./lib/proxy";
import { getFormats } from "./lib/ytdlp";

const PORT = Number(process.env.PORT) || 3000;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Health check
    if (path === "/health") {
      return Response.json({ status: "ok" });
    }

    // Logs endpoint
    if (path === "/logs") {
      return Response.json(getLogs());
    }

    // Stream routes: /stream/:type/:videoId
    const match = path.match(/^\/stream\/(video|audio|muxed)\/([a-zA-Z0-9_-]+)$/);
    if (!match) {
      return new Response("Not Found", { status: 404 });
    }

    const [, type, videoId] = match;
    const range = req.headers.get("Range");
    const isRangeRequest = !!range;

    // Only log the initial request, not every range chunk
    if (!isRangeRequest) {
      log(`[server] ${type}/${videoId} — new stream request`);
    }

    try {
      const formats = await getFormats(videoId);

      if (type === "video") {
        if (!formats.video) {
          log(`[server] ${type}/${videoId} — no H.264 video stream found`);
          return new Response("No H.264 video stream found", { status: 404 });
        }
        if (!isRangeRequest) {
          log(`[server] ${type}/${videoId} — proxying ${formats.video.height}p video`);
        }
        return proxyStream(formats.video.url, req, "video/mp4");
      }

      if (type === "audio") {
        if (!formats.audio) {
          log(`[server] ${type}/${videoId} — no AAC audio stream found`);
          return new Response("No AAC audio stream found", { status: 404 });
        }
        if (!isRangeRequest) {
          log(`[server] ${type}/${videoId} — proxying audio ${formats.audio.abr ?? formats.audio.tbr ?? "?"}kbps`);
        }
        return proxyStream(formats.audio.url, req, "audio/mp4");
      }

      if (type === "muxed") {
        if (!formats.muxed) {
          log(`[server] ${type}/${videoId} — no muxed stream found`);
          return new Response("No muxed stream found", { status: 404 });
        }
        if (!isRangeRequest) {
          log(`[server] ${type}/${videoId} — proxying muxed ${formats.muxed.height}p`);
        }
        return proxyStream(formats.muxed.url, req, "video/mp4");
      }

      return new Response("Not Found", { status: 404 });
    } catch (err: any) {
      logError(`[server] Error handling ${path}:`, err.message);
      return new Response(err.message ?? "Internal error", { status: 500 });
    }
  },
});

log(`[server] Listening on http://0.0.0.0:${PORT}`);
