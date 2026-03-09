import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TVFocusGuideView } from '@/components/tv-focus-guide';
import { VideoCard } from '@/components/video-card';
import { useSettings } from '@/context/settings-context';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useTheme } from '@/hooks/use-theme';
import { searchVideos } from '@/services/invidious';
import type { Video } from '@/types/invidious';

export default function SearchScreen() {
  const { apiClient, baseUrl } = useSettings();
  const { spacing, scale, width } = useScreenDimensions();
  const theme = useTheme();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const cardWidth = Math.min(width * 0.22, 280);
  const numColumns = Math.max(1, Math.floor((width - spacing.four * 2) / (cardWidth + 16)));

  const handleSearch = useCallback(async () => {
    if (!apiClient || !query.trim()) return;
    setLoading(true);
    try {
      const data = await searchVideos(apiClient, query.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient, query]);

  if (!baseUrl) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="subtitle">Search</ThemedText>
        <ThemedText
          themeColor="textSecondary"
          style={{ marginTop: spacing.two, fontSize: 16 * scale }}
        >
          Configure your instance URL in Settings first
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <TVFocusGuideView autoFocus style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.two,
            padding: spacing.four,
          }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search videos..."
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderRadius: 8 * scale,
              padding: spacing.two,
              fontSize: 16 * scale,
              borderWidth: 2,
              borderColor: 'transparent',
            }}
            onSubmitEditing={handleSearch}
          />
          <Pressable
            onPress={handleSearch}
            style={({ focused }) => ({
              backgroundColor: theme.tint,
              borderRadius: 8 * scale,
              paddingHorizontal: spacing.three,
              paddingVertical: spacing.two,
              justifyContent: 'center',
              transform: [{ scale: focused ? 1.05 : 1 }],
            })}
          >
            <ThemedText style={{ color: '#fff', fontSize: 16 * scale, fontWeight: '600' }}>
              Search
            </ThemedText>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.tint} style={{ marginTop: spacing.four }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.videoId}
            numColumns={numColumns}
            key={numColumns}
            renderItem={({ item }) => (
              <View style={{ margin: spacing.two }}>
                <VideoCard video={item} width={cardWidth} />
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: spacing.four, paddingBottom: spacing.six }}
          />
        )}
      </TVFocusGuideView>
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
