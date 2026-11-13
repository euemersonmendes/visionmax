import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Hls from 'hls.js';

interface HlsVideoPlayerProps {
  uri: string;
  muted: boolean;
  playbackRate?: number;
  paused?: boolean;
  onError: () => void;
}

export const HlsVideoPlayer: React.FC<HlsVideoPlayerProps> = ({
  uri,
  muted,
  playbackRate = 1.0,
  paused = false,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.playbackRate = playbackRate;
    if (paused) {
      videoEl.pause();
    } else {
      videoEl.play().catch(() => {});
    }
  }, [playbackRate, paused]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const HlsClass: any = (Hls as any)?.default || Hls;
    let hls: any = null;

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = uri;
      videoEl.play().catch(() => {});
    } else if (HlsClass && typeof HlsClass.isSupported === 'function' && HlsClass.isSupported()) {
      hls = new HlsClass({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        manifestLoadingMaxRetry: 6,
        manifestLoadingRetryDelay: 1000,
      });
      hls.loadSource(uri);
      hls.attachMedia(videoEl);
      hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
        videoEl.play().catch(() => {});
      });
      hls.on(HlsClass.Events.ERROR, (_event: any, data: any) => {
        if (data?.fatal) {
          onErrorRef.current();
        }
      });
    } else {
      onErrorRef.current();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [uri]);

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
      />
    );
  }

  return (
    <Video
      source={{ uri }}
      style={styles.nativeVideo}
      resizeMode={ResizeMode.COVER}
      shouldPlay={!paused}
      rate={playbackRate}
      shouldCorrectPitch
      isLooping
      isMuted={muted}
      onError={() => onErrorRef.current()}
    />
  );
};

const styles = StyleSheet.create({
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
});
