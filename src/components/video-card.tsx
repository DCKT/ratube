import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useTheme } from '@/hooks/use-theme';
import type { Video } from '@/types/invidious';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getThumbnailUrl(video: Video): string {
  const medium = video.videoThumbnails.find((t) => t.quality === 'medium');
  return medium?.url ?? video.videoThumbnails[0]?.url ?? '';
}

type Props = {
  video: Video;
  width: number;
};

export function VideoCard({ video, width }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { scale } = useScreenDimensions();
  const [focused, setFocused] = useState(false);

  const thumbnailHeight = (width * 9) / 16;

  return (
    <Pressable
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => router.push(`/player?videoId=${video.videoId}`)}
      style={[
        styles.container,
        {
          width,
          transform: [{ scale: focused ? 1.05 : 1 }],
          borderColor: focused ? theme.tint : 'transparent',
          borderWidth: 2 * scale,
          borderRadius: 8 * scale,
        },
      ]}
    >
      <View style={{ width: '100%', height: thumbnailHeight, borderRadius: 6 * scale, overflow: 'hidden' }}>
        <Image
          source={{ uri: getThumbnailUrl(video) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={[styles.badge, { padding: 4 * scale, borderRadius: 4 * scale }]}>
          <ThemedText style={{ fontSize: 11 * scale, color: '#fff', fontWeight: '600' }}>
            {formatDuration(video.lengthSeconds)}
          </ThemedText>
        </View>
      </View>
      <ThemedText
        numberOfLines={2}
        style={{ fontSize: 14 * scale, marginTop: 6 * scale, fontWeight: '500' }}
      >
        {video.title}
      </ThemedText>
      <ThemedText
        themeColor="textSecondary"
        numberOfLines={1}
        style={{ fontSize: 12 * scale, marginTop: 2 * scale }}
      >
        {video.author}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
});
