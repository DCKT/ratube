import { useAudioPlayer } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useSettings } from '@/context/settings-context';
import { useTheme } from '@/hooks/use-theme';
import { getVideoDetails } from '@/services/invidious';
import type { FormatStream, VideoDetail } from '@/types/invidious';

/** Pick the best progressive (muxed) stream as fallback. */
function pickProgressiveStream(detail: VideoDetail): FormatStream | undefined {
  const progressive = detail.formatStreams ?? [];
  const mp4s = progressive.filter((s) => s.container === 'mp4');
  if (mp4s.length > 0) {
    mp4s.sort((a, b) => {
      const aH = parseInt(a.qualityLabel) || 0;
      const bH = parseInt(b.qualityLabel) || 0;
      return bH - aH;
    });
    return mp4s[0];
  }
  return progressive[0];
}

/** Pick the best adaptive video-only stream (MP4/H.264, highest resolution). */
function pickAdaptiveVideo(detail: VideoDetail): FormatStream | undefined {
  const adaptive = detail.adaptiveFormats ?? [];
  const videos = adaptive.filter(
    (s) => s.type.startsWith('video/mp4') && s.type.includes('avc1')
  );
  if (videos.length === 0) return undefined;
  videos.sort((a, b) => {
    const aH = parseInt(a.qualityLabel) || 0;
    const bH = parseInt(b.qualityLabel) || 0;
    return bH - aH;
  });
  return videos[0];
}

/** Pick the best adaptive audio-only stream (MP4/AAC). */
function pickAdaptiveAudio(detail: VideoDetail): FormatStream | undefined {
  const adaptive = detail.adaptiveFormats ?? [];
  const audios = adaptive.filter(
    (s) => s.type.startsWith('audio/mp4') && s.type.includes('mp4a')
  );
  if (audios.length === 0) return undefined;
  // Pick highest bitrate — last in the list is usually highest
  return audios[audios.length - 1];
}

function resolveUrl(rawUrl: string, baseUrl: string): string {
  return rawUrl.startsWith('/') ? `${baseUrl}${rawUrl}` : rawUrl;
}

export default function PlayerScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { apiClient, baseUrl } = useSettings();
  const theme = useTheme();

  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioSyncedRef = useRef(false);

  useEffect(() => {
    if (!apiClient || !videoId) return;
    let cancelled = false;
    console.log(`[Player] Fetching video details for ${videoId}`);
    getVideoDetails(apiClient, videoId)
      .then((data) => {
        if (cancelled) return;
        console.log(`[Player] Got video: "${data.title}"`);
        console.log(
          `[Player] formatStreams: ${data.formatStreams?.length ?? 0}`,
          data.formatStreams?.map((s) => `${s.qualityLabel} ${s.container}`)
        );
        console.log(
          `[Player] adaptive video: ${data.adaptiveFormats?.filter((s) => s.type.startsWith('video/')).length ?? 0}`,
          data.adaptiveFormats
            ?.filter((s) => s.type.startsWith('video/'))
            .map((s) => `${s.qualityLabel} ${s.type.slice(0, 40)} [${s.container}]`)
        );
        console.log(
          `[Player] adaptive audio: ${data.adaptiveFormats?.filter((s) => s.type.startsWith('audio/')).length ?? 0}`,
          data.adaptiveFormats
            ?.filter((s) => s.type.startsWith('audio/'))
            .map((s) => `${s.type.slice(0, 40)} [${s.container}]`)
        );
        setDetail(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[Player] Error fetching video:`, err.message);
        setError(err.message ?? 'Failed to load video');
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, videoId]);

  // Determine streams
  const adaptiveVideo = detail ? pickAdaptiveVideo(detail) : undefined;
  const adaptiveAudio = detail ? pickAdaptiveAudio(detail) : undefined;
  const useDualStream = !!(adaptiveVideo && adaptiveAudio);
  const progressiveStream = detail ? pickProgressiveStream(detail) : undefined;

  const videoUrl = useDualStream
    ? resolveUrl(adaptiveVideo!.url, baseUrl)
    : progressiveStream
      ? resolveUrl(progressiveStream.url, baseUrl)
      : null;

  const audioUrl = useDualStream ? resolveUrl(adaptiveAudio!.url, baseUrl) : null;

  if (detail && useDualStream) {
    console.log(
      `[Player] Dual-stream: video=${adaptiveVideo!.qualityLabel} (${adaptiveVideo!.type.slice(0, 30)}), audio=${adaptiveAudio!.type.slice(0, 30)}`
    );
  } else if (detail && progressiveStream) {
    console.log(
      `[Player] Progressive fallback: ${progressiveStream.qualityLabel} ${progressiveStream.container}`
    );
  }

  // Video player — muted when using dual-stream
  const player = useVideoPlayer(videoUrl, (p) => {
    if (useDualStream) {
      p.volume = 0;
    }
    p.play();
  });

  // Audio player for dual-stream mode
  const audioPlayer = useAudioPlayer(audioUrl);

  // Sync audio with video playback
  useEffect(() => {
    if (!useDualStream || !audioPlayer) return;
    audioSyncedRef.current = false;

    const subscription = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay' && !audioSyncedRef.current) {
        audioSyncedRef.current = true;
        console.log('[Player] Video ready — starting audio');
        audioPlayer.play();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [useDualStream, player, audioPlayer]);

  // Sync pause/resume
  useEffect(() => {
    if (!useDualStream || !audioPlayer) return;

    const subscription = player.addListener('playingChange', (payload) => {
      if (payload.isPlaying) {
        console.log('[Player] Video resumed — resuming audio');
        audioPlayer.play();
      } else {
        console.log('[Player] Video paused — pausing audio');
        audioPlayer.pause();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [useDualStream, player, audioPlayer]);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: '#000', padding: 40 }]}>
        <ThemedText
          style={{ color: '#ff6b6b', fontSize: 24, fontWeight: '600', marginBottom: 16 }}
        >
          Failed to load video
        </ThemedText>
        <ThemedText style={{ color: '#ccc', fontSize: 16, textAlign: 'center' }}>{error}</ThemedText>
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

  if (!videoUrl) {
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
