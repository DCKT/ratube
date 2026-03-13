export type YtDlpFormat = {
  format_id: string;
  url: string;
  ext: string;
  vcodec: string;
  acodec: string;
  height?: number;
  width?: number;
  tbr?: number;
  abr?: number;
  fps?: number;
  filesize?: number;
  filesize_approx?: number;
  format_note?: string;
};

export type ResolvedFormats = {
  video: YtDlpFormat | null;
  audio: YtDlpFormat | null;
  muxed: YtDlpFormat | null;
};

/** Pick best H.264/MP4 video-only stream (highest resolution). */
function pickBestVideo(formats: YtDlpFormat[]): YtDlpFormat | null {
  const videos = formats.filter(
    (f) =>
      f.vcodec !== "none" &&
      f.acodec === "none" &&
      f.ext === "mp4" &&
      f.vcodec.startsWith("avc1")
  );
  if (videos.length === 0) return null;
  videos.sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  return videos[0];
}

/** Pick best AAC/M4A audio-only stream (highest bitrate). */
function pickBestAudio(formats: YtDlpFormat[]): YtDlpFormat | null {
  const audios = formats.filter(
    (f) =>
      f.acodec !== "none" &&
      f.vcodec === "none" &&
      (f.ext === "m4a" || f.ext === "mp4") &&
      f.acodec.startsWith("mp4a")
  );
  if (audios.length === 0) return null;
  audios.sort((a, b) => (b.abr ?? b.tbr ?? 0) - (a.abr ?? a.tbr ?? 0));
  return audios[0];
}

/** Pick best muxed/progressive stream. */
function pickBestMuxed(formats: YtDlpFormat[]): YtDlpFormat | null {
  const muxed = formats.filter(
    (f) => f.vcodec !== "none" && f.acodec !== "none" && f.ext === "mp4"
  );
  if (muxed.length === 0) return null;
  muxed.sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  return muxed[0];
}

export function pickFormats(formats: YtDlpFormat[]): ResolvedFormats {
  return {
    video: pickBestVideo(formats),
    audio: pickBestAudio(formats),
    muxed: pickBestMuxed(formats),
  };
}
