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

    // Stream routes: /stream/:type/:videoId
    const match = path.match(/^\/stream\/(video|audio|muxed)\/([a-zA-Z0-9_-]+)$/);
    if (!match) {
      return new Response("Not Found", { status: 404 });
    }

    const [, type, videoId] = match;

    try {
      const formats = await getFormats(videoId);

      if (type === "video") {
        if (!formats.video) {
          return new Response("No H.264 video stream found", { status: 404 });
        }
        return proxyStream(formats.video.url, req, "video/mp4");
      }

      if (type === "audio") {
        if (!formats.audio) {
          return new Response("No AAC audio stream found", { status: 404 });
        }
        return proxyStream(formats.audio.url, req, "audio/mp4");
      }

      if (type === "muxed") {
        if (!formats.muxed) {
          return new Response("No muxed stream found", { status: 404 });
        }
        return proxyStream(formats.muxed.url, req, "video/mp4");
      }

      return new Response("Not Found", { status: 404 });
    } catch (err: any) {
      console.error(`[server] Error handling ${path}:`, err.message);
      return new Response(err.message ?? "Internal error", { status: 500 });
    }
  },
});

console.log(`[server] Listening on http://0.0.0.0:${PORT}`);
