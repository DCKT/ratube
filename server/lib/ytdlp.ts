import { type ResolvedFormats, type YtDlpFormat, pickFormats } from "./formats";
import { log, logError } from "./logger";

type CacheEntry = {
  formats: ResolvedFormats;
  expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<ResolvedFormats>>();

function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt < now) cache.delete(key);
  }
}

async function runYtDlp(videoId: string): Promise<ResolvedFormats> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  log(`[yt-dlp] Resolving formats for ${videoId}`);

  const proc = Bun.spawn(["yt-dlp", "-j", "--no-warnings", url], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    logError(`[yt-dlp] Failed for ${videoId}: ${stderr.trim()}`);
    throw new Error(`yt-dlp failed (exit ${exitCode}): ${stderr.trim().slice(0, 200)}`);
  }

  const info = JSON.parse(stdout);
  const formats: YtDlpFormat[] = info.formats ?? [];
  const resolved = pickFormats(formats);

  log(
    `[yt-dlp] Resolved ${videoId}: video=${resolved.video?.height ?? "none"}p, audio=${resolved.audio?.abr ?? resolved.audio?.tbr ?? "none"}kbps, muxed=${resolved.muxed?.height ?? "none"}p`
  );

  return resolved;
}

export async function getFormats(videoId: string): Promise<ResolvedFormats> {
  // Check cache
  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.formats;
  }

  // Deduplicate concurrent requests for the same video
  const existing = inflight.get(videoId);
  if (existing) {
    log(`[yt-dlp] Dedup — waiting for in-flight request for ${videoId}`);
    return existing;
  }

  const promise = runYtDlp(videoId)
    .then((formats) => {
      cache.set(videoId, { formats, expiresAt: Date.now() + CACHE_TTL_MS });
      inflight.delete(videoId);
      return formats;
    })
    .catch((err) => {
      inflight.delete(videoId);
      throw err;
    });

  inflight.set(videoId, promise);

  // Periodic cleanup
  if (cache.size > 50) cleanExpired();

  return promise;
}
