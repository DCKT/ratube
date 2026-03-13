import { Image } from 'expo-image';
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TVFocusGuideView } from '@/components/tv-focus-guide';
import { useSettings } from '@/context/settings-context';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useTheme } from '@/hooks/use-theme';
import { searchChannels } from '@/services/invidious';
import type { Channel } from '@/types/invidious';

export default function SettingsScreen() {
  const { baseUrl, setBaseUrl, proxyUrl, setProxyUrl, channels, addChannel, removeChannel, apiClient } =
    useSettings();
  const { spacing, scale } = useScreenDimensions();
  const theme = useTheme();

  const [urlInput, setUrlInput] = useState(baseUrl);
  const [proxyUrlInput, setProxyUrlInput] = useState(proxyUrl);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSaveUrl = useCallback(() => {
    setBaseUrl(urlInput);
  }, [urlInput, setBaseUrl]);

  const handleSaveProxyUrl = useCallback(() => {
    setProxyUrl(proxyUrlInput);
  }, [proxyUrlInput, setProxyUrl]);

  const handleSearch = useCallback(async () => {
    if (!apiClient || !searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchChannels(apiClient, searchQuery.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [apiClient, searchQuery]);

  const inputStyle = {
    color: theme.text,
    backgroundColor: theme.backgroundElement,
    borderRadius: 8 * scale,
    padding: spacing.two,
    fontSize: 16 * scale,
    borderWidth: 2,
    borderColor: 'transparent',
  };

  return (
    <SafeAreaView style={styles.fill}>
      <FlatList
        data={[]}
        renderItem={null}
        contentContainerStyle={{ padding: spacing.four }}
        ListHeaderComponent={
          <TVFocusGuideView autoFocus>
            {/* Base URL */}
            <ThemedText type="subtitle" style={{ marginBottom: spacing.two }}>
              Instance URL
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: spacing.two, marginBottom: spacing.four }}>
              <TextInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://invidious.example.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                style={[inputStyle, { flex: 1 }]}
                onSubmitEditing={handleSaveUrl}
              />
              <Pressable
                onPress={handleSaveUrl}
                style={({ focused }) => [
                  styles.button,
                  {
                    backgroundColor: theme.tint,
                    borderRadius: 8 * scale,
                    paddingHorizontal: spacing.three,
                    paddingVertical: spacing.two,
                    transform: [{ scale: focused ? 1.05 : 1 }],
                  },
                ]}
              >
                <ThemedText style={{ color: '#fff', fontSize: 16 * scale, fontWeight: '600' }}>
                  Save
                </ThemedText>
              </Pressable>
            </View>

            {/* Stream Proxy URL */}
            <ThemedText type="subtitle" style={{ marginBottom: spacing.two }}>
              Stream Proxy URL
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: spacing.two, marginBottom: spacing.four }}>
              <TextInput
                value={proxyUrlInput}
                onChangeText={setProxyUrlInput}
                placeholder="http://192.168.1.73:3000"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                style={[inputStyle, { flex: 1 }]}
                onSubmitEditing={handleSaveProxyUrl}
              />
              <Pressable
                onPress={handleSaveProxyUrl}
                style={({ focused }) => [
                  styles.button,
                  {
                    backgroundColor: theme.tint,
                    borderRadius: 8 * scale,
                    paddingHorizontal: spacing.three,
                    paddingVertical: spacing.two,
                    transform: [{ scale: focused ? 1.05 : 1 }],
                  },
                ]}
              >
                <ThemedText style={{ color: '#fff', fontSize: 16 * scale, fontWeight: '600' }}>
                  Save
                </ThemedText>
              </Pressable>
            </View>

            {/* Subscribed Channels */}
            <ThemedText type="subtitle" style={{ marginBottom: spacing.two }}>
              Channels ({channels.length})
            </ThemedText>
            {channels.map((ch) => (
              <View
                key={ch.id}
                style={[
                  styles.channelItem,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderRadius: 8 * scale,
                    padding: spacing.two,
                    marginBottom: spacing.two,
                  },
                ]}
              >
                <ThemedText style={{ flex: 1, fontSize: 16 * scale }}>
                  {ch.name}
                </ThemedText>
                <Pressable
                  onPress={() => removeChannel(ch.id)}
                  style={({ focused }) => [
                    styles.button,
                    {
                      backgroundColor: focused ? '#ff4444' : theme.backgroundSelected,
                      borderRadius: 6 * scale,
                      paddingHorizontal: spacing.two,
                      paddingVertical: spacing.one,
                      transform: [{ scale: focused ? 1.05 : 1 }],
                    },
                  ]}
                >
                  <ThemedText style={{ fontSize: 14 * scale }}>Remove</ThemedText>
                </Pressable>
              </View>
            ))}

            {/* Search Channels */}
            {baseUrl ? (
              <>
                <ThemedText
                  type="subtitle"
                  style={{ marginTop: spacing.four, marginBottom: spacing.two }}
                >
                  Add Channel
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: spacing.two, marginBottom: spacing.three }}>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search channels..."
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[inputStyle, { flex: 1 }]}
                    onSubmitEditing={handleSearch}
                  />
                  <Pressable
                    onPress={handleSearch}
                    style={({ focused }) => [
                      styles.button,
                      {
                        backgroundColor: theme.tint,
                        borderRadius: 8 * scale,
                        paddingHorizontal: spacing.three,
                        paddingVertical: spacing.two,
                        transform: [{ scale: focused ? 1.05 : 1 }],
                      },
                    ]}
                  >
                    <ThemedText style={{ color: '#fff', fontSize: 16 * scale, fontWeight: '600' }}>
                      Search
                    </ThemedText>
                  </Pressable>
                </View>

                {searching ? (
                  <ActivityIndicator color={theme.tint} />
                ) : (
                  searchResults.map((ch) => {
                    const alreadyAdded = channels.some((c) => c.id === ch.authorId);
                    return (
                      <View
                        key={ch.authorId}
                        style={[
                          styles.channelItem,
                          {
                            backgroundColor: theme.backgroundElement,
                            borderRadius: 8 * scale,
                            padding: spacing.two,
                            marginBottom: spacing.two,
                          },
                        ]}
                      >
                        {ch.authorThumbnails?.length > 0 && (
                          <Image
                            source={{ uri: ch.authorThumbnails[0].url.startsWith('/') ? `${baseUrl}${ch.authorThumbnails[0].url}` : ch.authorThumbnails[0].url }}
                            style={{
                              width: 48 * scale,
                              height: 48 * scale,
                              borderRadius: 24 * scale,
                              marginRight: spacing.two,
                            }}
                          />
                        )}
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontSize: 16 * scale }}>
                            {ch.author}
                          </ThemedText>
                          <ThemedText
                            themeColor="textSecondary"
                            style={{ fontSize: 12 * scale }}
                          >
                            {ch.subCount?.toLocaleString() ?? '?'} subscribers
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() =>
                            addChannel({ id: ch.authorId, name: ch.author })
                          }
                          disabled={alreadyAdded}
                          style={({ focused }) => [
                            styles.button,
                            {
                              backgroundColor: alreadyAdded
                                ? theme.backgroundSelected
                                : focused
                                  ? theme.tint
                                  : theme.backgroundSelected,
                              borderRadius: 6 * scale,
                              paddingHorizontal: spacing.two,
                              paddingVertical: spacing.one,
                              opacity: alreadyAdded ? 0.5 : 1,
                              transform: [{ scale: focused ? 1.05 : 1 }],
                            },
                          ]}
                        >
                          <ThemedText style={{ fontSize: 14 * scale }}>
                            {alreadyAdded ? 'Added' : 'Add'}
                          </ThemedText>
                        </Pressable>
                      </View>
                    );
                  })
                )}
              </>
            ) : null}
          </TVFocusGuideView>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
