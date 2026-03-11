import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChannelCard } from '@/components/channel-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TVFocusGuideView } from '@/components/tv-focus-guide';
import { VideoCard } from '@/components/video-card';
import { useSettings } from '@/context/settings-context';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useTheme } from '@/hooks/use-theme';
import { searchChannels, searchVideos } from '@/services/invidious';
import type { Channel, Video } from '@/types/invidious';

type SearchType = 'video' | 'channel';

export default function SearchScreen() {
  const { apiClient, baseUrl } = useSettings();
  const { spacing, scale, width } = useScreenDimensions();
  const theme = useTheme();

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('video');
  const [results, setResults] = useState<Video[] | Channel[]>([]);
  const [loading, setLoading] = useState(false);

  const cardWidth = Math.min(width * 0.22, 280);
  const numColumns = Math.max(1, Math.floor((width - spacing.four * 2) / (cardWidth + 16)));

  const handleSearch = useCallback(async () => {
    if (!apiClient || !query.trim()) return;
    setLoading(true);
    try {
      const data =
        searchType === 'video'
          ? await searchVideos(apiClient, query.trim())
          : await searchChannels(apiClient, query.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient, query, searchType]);

  const handleSearchTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
    setResults([]);
  }, []);

  if (!baseUrl) {
    return (
      <SafeAreaView style={styles.center}>
        <ThemedText type="subtitle">Search</ThemedText>
        <ThemedText
          themeColor="textSecondary"
          style={{ marginTop: spacing.two, fontSize: 16 * scale }}
        >
          Configure your instance URL in Settings first
        </ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fill}>
      <TVFocusGuideView autoFocus style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.two,
            padding: spacing.four,
            paddingBottom: spacing.two,
          }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchType === 'video' ? 'Search videos...' : 'Search channels...'}
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

        <View
          style={{
            flexDirection: 'row',
            gap: spacing.two,
            paddingHorizontal: spacing.four,
            paddingBottom: spacing.two,
          }}
        >
          {(['video', 'channel'] as const).map((type) => {
            const active = searchType === type;
            return (
              <Pressable
                key={type}
                onPress={() => handleSearchTypeChange(type)}
                style={({ focused }) => ({
                  backgroundColor: active ? theme.tint : theme.backgroundElement,
                  borderRadius: 20 * scale,
                  paddingHorizontal: spacing.three,
                  paddingVertical: spacing.one,
                  borderWidth: 2 * scale,
                  borderColor: focused ? theme.tint : 'transparent',
                  transform: [{ scale: focused ? 1.05 : 1 }],
                })}
              >
                <ThemedText
                  style={{
                    color: active ? '#fff' : theme.text,
                    fontSize: 14 * scale,
                    fontWeight: '600',
                  }}
                >
                  {type === 'video' ? 'Videos' : 'Channels'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.tint} style={{ marginTop: spacing.four }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) =>
              'videoId' in item ? item.videoId : item.authorId
            }
            numColumns={numColumns}
            key={numColumns}
            renderItem={({ item }) => (
              <View style={{ margin: spacing.two }}>
                {'videoId' in item ? (
                  <VideoCard video={item} width={cardWidth} />
                ) : (
                  <ChannelCard channel={item} width={cardWidth} />
                )}
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: spacing.four, paddingBottom: spacing.six }}
          />
        )}
      </TVFocusGuideView>
    </SafeAreaView>
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
