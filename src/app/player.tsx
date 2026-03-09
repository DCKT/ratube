import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/context/settings-context';
import { useTheme } from '@/hooks/use-theme';
import { getVideoDetails } from '@/services/invidious';
import type { FormatStream, VideoDetail } from '@/types/invidious';

function pickStream(detail: VideoDetail): FormatStream | undefined {
  const progressive = detail.formatStreams ?? [];
  // Prefer 720p MP4
  const mp4_720 = progressive.find(
    (s) => s.qualityLabel === '720p' && s.container === 'mp4',
  );
  if (mp4_720) return mp4_720;
  // Fallback to any MP4
  const anyMp4 = progressive.find((s) => s.container === 'mp4');
  if (anyMp4) return anyMp4;
  // Fallback to first available
  return progressive[0];
}

export default function PlayerScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { apiClient, baseUrl } = useSettings();
  const theme = useTheme();

  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiClient || !videoId) return;
    let cancelled = false;
    console.log(`[Player] Fetching video details for ${videoId}`);
    getVideoDetails(apiClient, videoId)
      .then((data) => {
        if (cancelled) return;
        console.log(`[Player] Got video: "${data.title}"`);
        console.log(`[Player] formatStreams: ${data.formatStreams?.length ?? 0}`,
          data.formatStreams?.map((s) => `${s.qualityLabel} ${s.container}`));
        setDetail(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[Player] Error fetching video:`, err.message);
        setError(err.message ?? 'Failed to load video');
      });
    return () => { cancelled = true; };
  }, [apiClient, videoId]);

  const stream = detail ? pickStream(detail) : undefined;
  const rawUrl = stream?.url ?? null;
  const streamUrl = rawUrl?.startsWith('/') ? `${baseUrl}${rawUrl}` : rawUrl;

  if (stream) {
    console.log(`[Player] Selected stream: ${stream.qualityLabel} ${stream.container}`);
  }

  const player = useVideoPlayer(streamUrl, (p) => {
    p.play();
  });

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: '#000', padding: 40 }]}>
        <ThemedText style={{ color: '#ff6b6b', fontSize: 24, fontWeight: '600', marginBottom: 16 }}>
          Failed to load video
        </ThemedText>
        <ThemedText style={{ color: '#ccc', fontSize: 16, textAlign: 'center' }}>
          {error}
        </ThemedText>
        <ThemedText style={{ color: '#888', fontSize: 14, marginTop: 12 }}>
          Video ID: {videoId}
        </ThemedText>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <ActivityIndicator color={theme.tint} size="large" />
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <ThemedText style={{ color: '#fff' }}>No playable stream found</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
