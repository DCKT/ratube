import type { KyInstance } from 'ky';

import type { Channel, Video, VideoDetail } from '@/types/invidious';

type ChannelVideosResponse = {
  videos: Video[];
};

async function handleRequest<T>(label: string, request: Promise<T>): Promise<T> {
  try {
    const data = await request;
    console.log(`[API] ${label} — OK`);
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
    let body: string | undefined;
    try {
      body = await err?.response?.text();
    } catch {}
    console.error(`[API] ${label} — FAILED`, {
      status,
      message: err.message,
      body: body?.slice(0, 500),
    });
    throw new Error(
      status
        ? `HTTP ${status}: ${body?.slice(0, 200) || err.message}`
        : err.message || 'Network error',
    );
  }
}

export async function getChannelVideos(
  client: KyInstance,
  channelId: string,
): Promise<Video[]> {
  const data = await handleRequest(
    `getChannelVideos(${channelId})`,
    client
      .get(`api/v1/channels/${channelId}/videos`, {
        searchParams: { sort_by: 'newest' },
      })
      .json<ChannelVideosResponse>(),
  );
  return data.videos;
}

export async function getVideoDetails(
  client: KyInstance,
  videoId: string,
): Promise<VideoDetail> {
  return handleRequest(
    `getVideoDetails(${videoId})`,
    client
      .get(`api/v1/videos/${videoId}`, { searchParams: { local: true } })
      .json<VideoDetail>(),
  );
}

export async function searchVideos(
  client: KyInstance,
  query: string,
  page = 1,
): Promise<Video[]> {
  return handleRequest(
    `searchVideos(${query}, page=${page})`,
    client
      .get('api/v1/search', {
        searchParams: { q: query, type: 'video', page },
      })
      .json<Video[]>(),
  );
}

export async function searchChannels(
  client: KyInstance,
  query: string,
): Promise<Channel[]> {
  return handleRequest(
    `searchChannels(${query})`,
    client
      .get('api/v1/search', {
        searchParams: { q: query, type: 'channel' },
      })
      .json<Channel[]>(),
  );
}
