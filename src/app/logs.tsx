import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TVFocusGuideView } from '@/components/tv-focus-guide';
import { useSettings } from '@/context/settings-context';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useTheme } from '@/hooks/use-theme';

type LogEntry = { timestamp: string; message: string };

export default function LogsScreen() {
  const { proxyUrl } = useSettings();
  const { spacing, scale } = useScreenDimensions();
  const theme = useTheme();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!proxyUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`${proxyUrl}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [proxyUrl]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <SafeAreaView style={styles.fill}>
      <TVFocusGuideView autoFocus style={styles.fill}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.four,
            paddingVertical: spacing.two,
          }}
        >
          <ThemedText type="subtitle">Proxy Logs</ThemedText>
          <View style={{ flexDirection: 'row', gap: spacing.two }}>
            <Pressable
              onPress={fetchLogs}
              style={({ focused }) => [
                styles.button,
                {
                  backgroundColor: theme.tint,
                  borderRadius: 8 * scale,
                  paddingHorizontal: spacing.three,
                  paddingVertical: spacing.one,
                  transform: [{ scale: focused ? 1.05 : 1 }],
                },
              ]}
            >
              <ThemedText style={{ color: '#fff', fontSize: 14 * scale, fontWeight: '600' }}>
                Refresh
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ focused }) => [
                styles.button,
                {
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 8 * scale,
                  paddingHorizontal: spacing.three,
                  paddingVertical: spacing.one,
                  transform: [{ scale: focused ? 1.05 : 1 }],
                },
              ]}
            >
              <ThemedText style={{ fontSize: 14 * scale, fontWeight: '600' }}>
                Close
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.tint} style={{ marginTop: spacing.four }} />
        ) : logs.length === 0 ? (
          <ThemedText
            themeColor="textSecondary"
            style={{ padding: spacing.four, fontSize: 14 * scale }}
          >
            No logs available
          </ThemedText>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingHorizontal: spacing.four, paddingBottom: spacing.four }}
            renderItem={({ item }) => (
              <View style={{ marginBottom: spacing.two }}>
                <ThemedText
                  themeColor="textSecondary"
                  style={{ fontSize: 10 * scale, fontFamily: 'monospace' }}
                >
                  {item.timestamp}
                </ThemedText>
                <ThemedText style={{ fontSize: 13 * scale, fontFamily: 'monospace' }}>
                  {item.message}
                </ThemedText>
              </View>
            )}
          />
        )}
      </TVFocusGuideView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
