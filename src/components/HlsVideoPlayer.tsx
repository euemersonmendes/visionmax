import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Hls from 'hls.js';

interface HlsVideoPlayerProps {
  uri: string;
  muted: boolean;
  onError: () => void;
}

export const HlsVideoPlayer: React.FC<HlsVideoPlayerProps> = ({
  uri,
  muted,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    let hls: Hls | null = null;

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = uri;
      videoEl.play().catch(() => {});
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
      });
      hls.loadSource(uri);
      hls.attachMedia(videoEl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoEl.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          onError();
        }
      });
    } else {
      onError();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [uri, onError]);

  if (Platform.OS === 'web') {
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          backgroundColor: '#0F172A',
        }}
        onError={onError}
      />
    );
  }

  return (
    <Video
      source={{ uri }}
      style={styles.nativeVideo}
      resizeMode={ResizeMode.COVER}
      shouldPlay
      isLooping
      isMuted={muted}
      onError={onError}
    />
  );
};

const styles = StyleSheet.create({
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
});
