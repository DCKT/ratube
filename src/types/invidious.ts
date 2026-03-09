export type Thumbnail = {
  url: string;
  width: number;
  height: number;
  quality: string;
};

export type Video = {
  videoId: string;
  title: string;
  author: string;
  authorId: string;
  lengthSeconds: number;
  videoThumbnails: Thumbnail[];
  publishedText: string;
  viewCount: number;
};

export type FormatStream = {
  url: string;
  itag: string;
  type: string;
  quality: string;
  qualityLabel: string;
  container: string;
  resolution: string;
  size: string;
};

export type VideoDetail = Video & {
  description: string;
  formatStreams: FormatStream[];
  adaptiveFormats: FormatStream[];
};

export type Channel = {
  authorId: string;
  author: string;
  authorThumbnails: Thumbnail[];
  subCount: number;
  videoCount: number;
};
