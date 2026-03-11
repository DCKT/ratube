import React from "react";
import { ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChannelRow } from "@/components/channel-row";
import { ThemedText } from "@/components/themed-text";
import { useSettings } from "@/context/settings-context";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import { useTheme } from "@/hooks/use-theme";

export default function ChannelsScreen() {
  const { channels, apiClient, isLoaded, baseUrl } = useSettings();
  const { spacing, scale } = useScreenDimensions();
  const theme = useTheme();

  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={theme.tint} />
      </SafeAreaView>
    );
  }

  if (!baseUrl) {
    return (
      <SafeAreaView style={styles.center}>
        <ThemedText type="subtitle">Welcome to InvidiousTV</ThemedText>
        <ThemedText
          themeColor="textSecondary"
          style={{
            marginTop: spacing.two,
            fontSize: 16 * scale,
            textAlign: "center",
          }}
        >
          Go to Settings to configure your Invidious instance URL
        </ThemedText>
      </SafeAreaView>
    );
  }

  if (channels.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <ThemedText type="subtitle">No channels yet</ThemedText>
        <ThemedText
          themeColor="textSecondary"
          style={{
            marginTop: spacing.two,
            fontSize: 16 * scale,
            textAlign: "center",
          }}
        >
          Add channels in Settings to see their latest videos here
        </ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fill}>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChannelRow
            channelId={item.id}
            channelName={item.name}
            apiClient={apiClient!}
          />
        )}
        contentContainerStyle={{
          paddingTop: spacing.four,
          paddingBottom: spacing.six,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
});
