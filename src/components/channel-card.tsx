import { Image } from "expo-image";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";

import { useSettings } from "@/context/settings-context";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import { useTheme } from "@/hooks/use-theme";
import { Spacing } from "@/constants/theme";
import type { Channel } from "@/types/invidious";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

type Props = {
  channel: Channel;
  width: number;
};

export function ChannelCard({ channel, width }: Props) {
  const theme = useTheme();
  const { baseUrl, addChannel, removeChannel, channels } = useSettings();
  const isSaved = channels.some((c) => c.id === channel.authorId);
  const { scale } = useScreenDimensions();
  const [focused, setFocused] = useState(false);

  const thumbnailSize = Math.min(width * 0.4, 120);

  const thumbnail = channel.authorThumbnails?.length
    ? channel.authorThumbnails.sort((a, b) => b.height - a.height)[0]
    : null;
  const thumbnailUrl = thumbnail
    ? thumbnail.url.startsWith("//")
      ? `https:${thumbnail.url}`
      : thumbnail.url.startsWith("/")
        ? `${baseUrl}${thumbnail.url}`
        : thumbnail.url
    : "";

  return (
    <Pressable
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() =>
        isSaved
          ? removeChannel(channel.authorId)
          : addChannel({ id: channel.authorId, name: channel.author })
      }
      style={[
        styles.container,
        {
          width,
          transform: [{ scale: focused ? 1.05 : 1 }],
          borderColor: focused ? theme.tint : "transparent",
          borderWidth: 2 * scale,
          borderRadius: 8 * scale,
          padding: Spacing.two,
          alignItems: "center",
        },
      ]}
    >
      <View
        style={{
          width: thumbnailSize,
          height: thumbnailSize,
          borderRadius: thumbnailSize / 2,
          overflow: "hidden",
          backgroundColor: theme.backgroundElement,
        }}
      >
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : null}
      </View>
      <ThemedText
        numberOfLines={2}
        style={{
          fontSize: 14 * scale,
          marginTop: 8 * scale,
          fontWeight: "500",
          textAlign: "center",
        }}
      >
        {channel.author}
      </ThemedText>
      <ThemedText
        themeColor="textSecondary"
        numberOfLines={1}
        style={{ fontSize: 12 * scale, marginTop: 2 * scale }}
      >
        {formatCount(channel.subCount)} subs
      </ThemedText>
      {isSaved && (
        <View
          style={{
            backgroundColor: theme.tint,
            borderRadius: 12 * scale,
            paddingHorizontal: 8 * scale,
            paddingVertical: 0.2 * scale,
            marginTop: 1 * scale,
          }}
        >
          <ThemedText
            style={{
              color: "#fff",
              fontSize: 10 * scale,
              fontWeight: "600",
            }}
          >
            Added
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
});
