import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { ChannelRow } from '@/components/channel-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSettings } from '@/context/settings-context';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const { channels, apiClient, isLoaded, baseUrl } = useSettings();
  const { spacing, scale } = useScreenDimensions();
  const theme = useTheme();

  if (!isLoaded) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.tint} />
      </ThemedView>
    );
  }

  if (!baseUrl) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="subtitle">Welcome to InvidiousTV</ThemedText>
        <ThemedText
          themeColor="textSecondary"
          style={{ marginTop: spacing.two, fontSize: 16 * scale, textAlign: 'center' }}
        >
          Go to Settings to configure your Invidious instance URL
        </ThemedText>
      </ThemedView>
    );
  }

  if (channels.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="subtitle">No channels yet</ThemedText>
        <ThemedText
          themeColor="textSecondary"
          style={{ marginTop: spacing.two, fontSize: 16 * scale, textAlign: 'center' }}
        >
          Add channels in Settings to see their latest videos here
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
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
        contentContainerStyle={{ paddingTop: spacing.four, paddingBottom: spacing.six }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});
