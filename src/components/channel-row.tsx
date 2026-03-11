import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";
import { TVFocusGuideView } from "./tv-focus-guide";
import { VideoCard } from "./video-card";

import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import { useTheme } from "@/hooks/use-theme";
import { getChannelVideos } from "@/services/invidious";
import type { Video } from "@/types/invidious";

import type { KyInstance } from "ky";

type Props = {
  channelId: string;
  channelName: string;
  apiClient: KyInstance;
};

export function ChannelRow({ channelId, channelName, apiClient }: Props) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width, scale, spacing } = useScreenDimensions();
  const theme = useTheme();

  const cardWidth = Math.min(width * 0.25, 320);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getChannelVideos(apiClient, channelId)
      .then((data) => {
        if (!cancelled) setVideos(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, channelId]);

  return (
    <View style={[styles.container, { paddingVertical: spacing.three }]}>
      <ThemedText type="subtitle" style={{ paddingHorizontal: spacing.four }}>
        {channelName}
      </ThemedText>

      {loading ? (
        <ActivityIndicator
          color={theme.tint}
          style={{ marginVertical: spacing.four }}
        />
      ) : error ? (
        <ThemedText
          themeColor="textSecondary"
          style={{ paddingHorizontal: spacing.four, fontSize: 14 * scale }}
        >
          Error: {error}
        </ThemedText>
      ) : (
        <TVFocusGuideView autoFocus>
          <FlatList
            horizontal
            data={videos}
            keyExtractor={(item) => item.videoId}
            renderItem={({ item }) => (
              <VideoCard hideChannelName video={item} width={cardWidth} />
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing.four,
              paddingVertical: spacing.four,
            }}
            showsHorizontalScrollIndicator={false}
          />
        </TVFocusGuideView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
