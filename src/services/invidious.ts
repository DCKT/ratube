import type { KyInstance } from 'ky';

import type { Channel, Video, VideoDetail } from '@/types/invidious';

type ChannelVideosResponse = {
  videos: Video[];
};

export async function getChannelVideos(
  client: KyInstance,
  channelId: string,
): Promise<Video[]> {
  const data = await client
    .get(`api/v1/channels/${channelId}/videos`, {
      searchParams: { sort_by: 'newest' },
    })
    .json<ChannelVideosResponse>();
  return data.videos;
}

export async function getVideoDetails(
  client: KyInstance,
  videoId: string,
): Promise<VideoDetail> {
  return client.get(`api/v1/videos/${videoId}`).json<VideoDetail>();
}

export async function searchVideos(
  client: KyInstance,
  query: string,
  page = 1,
): Promise<Video[]> {
  return client
    .get('api/v1/search', {
      searchParams: { q: query, type: 'video', page },
    })
    .json<Video[]>();
}

export async function searchChannels(
  client: KyInstance,
  query: string,
): Promise<Channel[]> {
  return client
    .get('api/v1/search', {
      searchParams: { q: query, type: 'channel' },
    })
    .json<Channel[]>();
}
