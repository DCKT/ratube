import { useAudioPlayer } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useSettings } from "@/context/settings-context";
import type { VideoDetail } from "@/types/invidious";
import { getVideoDetails } from "@/services/invidious";

export default function PlayerScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { apiClient, proxyUrl } = useSettings();

  const [detail, setDetail] = useState<VideoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useMuxedFallback, setUseMuxedFallback] = useState(false);
  const useMuxedFallbackRef = useRef(false);
  const audioSyncedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Loading stream...");

  // Fetch metadata from Invidious (title, etc.)
  useEffect(() => {
    if (!apiClient || !videoId) return;
    let cancelled = false;
    console.log(`[Player] Fetching video details for ${videoId}`);
    getVideoDetails(apiClient, videoId)
      .then((data) => {
        if (cancelled) return;
        console.log(`[Player] Got video: "${data.title}"`);
        setDetail(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[Player] Error fetching metadata:`, err.message);
        // Metadata failure is non-fatal — we can still play via proxy
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, videoId]);

  // Build proxy stream URLs
  const videoUrl = useMuxedFallback
    ? `${proxyUrl}/stream/muxed/${videoId}`
    : `${proxyUrl}/stream/video/${videoId}`;

  const audioUrl = useMuxedFallback
    ? null
    : `${proxyUrl}/stream/audio/${videoId}`;
  const useDualStream = !useMuxedFallback;

  console.log(
    `[Player] Mode: ${useDualStream ? "dual-stream (video+audio)" : "muxed fallback"}`,
  );

  // Video player — muted when using dual-stream
  const player = useVideoPlayer(videoUrl, (p) => {
    if (useDualStream) {
      p.volume = 0;
    }
    p.play();
  });

  // Audio player for dual-stream mode
  const audioPlayer = useAudioPlayer(audioUrl);

  // Eagerly stop players on unmount to avoid delay when leaving the screen
  useEffect(() => {
    return () => {
      try {
        player.pause();
        player.replace(null);
      } catch {}
      try {
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer.replace(null);
        }
      } catch {}
    };
  }, [player, audioPlayer]);

  // Track player status for buffering indicator and error handling
  useEffect(() => {
    const subscription = player.addListener("statusChange", (payload) => {
      console.log(`[Player] Status: ${payload.status}`, payload.error?.message);
      switch (payload.status) {
        case "loading":
          setBuffering(true);
          setStatusMessage("Loading stream...");
          break;
        case "readyToPlay":
          setBuffering(false);
          break;
        case "error": {
          const msg = payload.error?.message ?? "Unknown error";
          if (!useMuxedFallbackRef.current) {
            console.log(
              "[Player] Adaptive stream failed — falling back to muxed",
            );
            setStatusMessage("Retrying with muxed stream...");
            useMuxedFallbackRef.current = true;
            setUseMuxedFallback(true);
          } else {
            setBuffering(false);
            setError(msg);
          }
          break;
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  // Sync audio with video playback
  useEffect(() => {
    if (!useDualStream || !audioPlayer) return;
    audioSyncedRef.current = false;

    const subscription = player.addListener("statusChange", (payload) => {
      if (payload.status === "readyToPlay" && !audioSyncedRef.current) {
        audioSyncedRef.current = true;
        console.log("[Player] Video ready — starting audio");
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

    const subscription = player.addListener("playingChange", (payload) => {
      setIsPlaying(payload.isPlaying);
      if (payload.isPlaying) {
        const videoTime = player.currentTime;
        console.log(
          `[Player] Video resumed at ${videoTime}s — syncing and resuming audio`,
        );
        audioPlayer.seekTo(videoTime);
        audioPlayer.play();
      } else {
        console.log("[Player] Video paused — pausing audio");
        audioPlayer.pause();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [useDualStream, player, audioPlayer]);

  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: "#000", padding: 40 }]}
      >
        <ThemedText
          style={{
            color: "#ff6b6b",
            fontSize: 24,
            fontWeight: "600",
            marginBottom: 16,
          }}
        >
          Failed to load video
        </ThemedText>
        <ThemedText
          style={{ color: "#ccc", fontSize: 16, textAlign: "center" }}
        >
          {error}
        </ThemedText>
        <ThemedText style={{ color: "#888", fontSize: 14, marginTop: 12 }}>
          Video ID: {videoId}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls
        contentFit="contain"
      />
      {buffering ? (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <ThemedText style={styles.bufferingText}>{statusMessage}</ThemedText>
        </View>
      ) : null}
      {detail && !isPlaying ? (
        <View style={styles.titleOverlay} pointerEvents="none">
          <ThemedText style={styles.titleText}>{detail.title}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: 600,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    marginTop: 20,
  },
  bufferingText: {
    color: "#ccc",
    fontSize: 18,
    marginTop: 36,
  },
});
