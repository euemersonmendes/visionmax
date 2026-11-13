import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HlsVideoPlayer } from './HlsVideoPlayer';
import { useSecurity } from '../context/SecurityContext';
import { CameraDevice } from '../types/security';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../theme/tokens';

interface CameraFeedViewProps {
  camera: CameraDevice;
  compact?: boolean;
  fillContainer?: boolean;
  isFullScreen?: boolean;
  playbackRate?: number;
  paused?: boolean;
  onPressFeed?: () => void;
  onToggleMute?: () => void;
  onToggleSpotlight?: () => void;
  onTakeSnapshot?: () => void;
}

export const CameraFeedView: React.FC<CameraFeedViewProps> = ({
  camera,
  compact = false,
  fillContainer = false,
  isFullScreen = false,
  playbackRate = 1.0,
  paused = false,
  onPressFeed,
  onToggleMute,
  onToggleSpotlight,
  onTakeSnapshot,
}) => {
  const { cvSettings } = useSecurity();
  const [clockStr, setClockStr] = useState<string>('');
  const [pulseOn, setPulseOn] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timePart = now.toTimeString().split(' ')[0];
      setClockStr(timePart);
      setPulseOn((prev) => !prev);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setStreamError(false);
  }, [camera.streamUrl, camera.protocol]);

  const isIRMode = camera.nightVision === 'IR_ON';
  const isColorNight = camera.nightVision === 'COLOR_NIGHT';

  const isHlsStream =
    camera.protocol === 'HLS' &&
    (camera.streamUrl.startsWith('http://') || camera.streamUrl.startsWith('https://'));

  const isMjpegStream =
    camera.protocol === 'MJPEG' &&
    (camera.streamUrl.startsWith('http://') || camera.streamUrl.startsWith('https://'));

  const isUnsupportedInBrowser =
    camera.protocol === 'RTSP' ||
    camera.protocol === 'INTELBRAS_CLOUD' ||
    camera.protocol === 'ONVIF';

  const renderSimulatedScene = () => {
    const translateX = -camera.ptz.pan * (isFullScreen ? 1.2 : 0.6);
    const translateY = camera.ptz.tilt * (isFullScreen ? 0.9 : 0.45);
    const scale = camera.ptz.zoom;

    return (
      <View
        style={[
          styles.sceneViewport,
          {
            transform: [{ scale }, { translateX }, { translateY }],
          },
        ]}
      >
        {camera.sceneTheme === 'FRONT_GATE' && (
          <View
            style={[
              styles.sceneCanvas,
              { backgroundColor: isIRMode ? '#141B19' : '#111827' },
            ]}
          >
            <View
              style={[
                styles.skyBand,
                { backgroundColor: isIRMode ? '#1B2622' : '#0F172A' },
              ]}
            />
            <View style={styles.streetLampGlow} />
            <View style={styles.wallStructure}>
              <View style={styles.gatePillar} />
              <View style={styles.gateBarsContainer}>
                {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
                  <View key={bar} style={styles.gateBarVertical} />
                ))}
                <View style={styles.gateRailHorizontal} />
              </View>
              <View style={styles.gatePillar}>
                <View style={styles.intercomBox} />
              </View>
            </View>
            <View
              style={[
                styles.groundPlane,
                { backgroundColor: isIRMode ? '#1C2824' : '#1E293B' },
              ]}
            >
              <View style={styles.aiTripwireLine} />
            </View>
            <View style={styles.personSilhouetteContainer}>
              <View style={styles.personHead} />
              <View style={styles.personTorso} />
            </View>
          </View>
        )}

        {camera.sceneTheme === 'GARAGE' && (
          <View
            style={[
              styles.sceneCanvas,
              { backgroundColor: isIRMode ? '#141B19' : '#131C2B' },
            ]}
          >
            <View style={styles.garageCeiling}>
              <View style={styles.garageLightTube} />
              <View style={styles.garageLightTube} />
            </View>
            <View style={styles.garageDoorFrame}>
              {[0, 1, 2, 3].map((panel) => (
                <View key={panel} style={styles.garageDoorPanel} />
              ))}
            </View>
            <View
              style={[
                styles.groundPlane,
                { backgroundColor: isIRMode ? '#1D2925' : '#1E293B' },
              ]}
            >
              <View style={styles.carBody}>
                <View style={styles.carRoof} />
                <View style={styles.carWindshield} />
                <View style={styles.carHeadlightLeft} />
                <View style={styles.carHeadlightRight} />
              </View>
            </View>
          </View>
        )}

        {camera.sceneTheme === 'BACKYARD_POOL' && (
          <View
            style={[
              styles.sceneCanvas,
              { backgroundColor: isIRMode ? '#131B19' : '#0F1B26' },
            ]}
          >
            <View
              style={[
                styles.skyBand,
                { backgroundColor: isIRMode ? '#1B2521' : '#0D1824' },
              ]}
            />
            <View style={styles.patioWall} />
            <View
              style={[
                styles.groundPlane,
                { backgroundColor: isIRMode ? '#1C2623' : '#1B2938' },
              ]}
            >
              <View
                style={[
                  styles.poolSurface,
                  {
                    backgroundColor: isIRMode
                      ? '#253835'
                      : isColorNight
                      ? '#0EA5E9'
                      : '#0284C7',
                  },
                ]}
              >
                <View style={styles.poolRipple} />
              </View>
            </View>
          </View>
        )}

        {camera.sceneTheme === 'SIDE_CORRIDOR' && (
          <View
            style={[
              styles.sceneCanvas,
              { backgroundColor: isIRMode ? '#121917' : '#111827' },
            ]}
          >
            <View style={styles.corridorWallLeft} />
            <View style={styles.corridorWallRight} />
            <View
              style={[
                styles.corridorFloor,
                { backgroundColor: isIRMode ? '#1B2622' : '#1E293B' },
              ]}
            />
          </View>
        )}

        {/* Spotlight overlay */}
        {camera.spotlightOn && <View style={styles.spotlightOverlay} />}

        {/* Infrared subtle tint */}
        {isIRMode && <View style={styles.irTintOverlay} />}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.cardContainer,
        fillContainer && styles.cardFillContainer,
        isFullScreen && styles.cardFullScreen,
      ]}
    >
      <Pressable
        onPress={onPressFeed}
        style={[
          styles.videoViewport,
          compact && styles.videoViewportCompact,
          fillContainer && styles.videoViewportFill,
          isFullScreen && styles.videoViewportFull,
        ]}
      >
        {isHlsStream && !streamError ? (
          <HlsVideoPlayer
            uri={camera.streamUrl}
            muted={camera.audioMuted}
            playbackRate={playbackRate}
            paused={paused}
            onError={() => setStreamError(true)}
          />
        ) : isMjpegStream && !streamError ? (
          <Image
            source={{ uri: camera.streamUrl }}
            style={styles.videoPlayer}
            resizeMode="cover"
            onError={() => setStreamError(true)}
          />
        ) : (
          renderSimulatedScene()
        )}

        {/* PROTOCOL NOTICE WHEN CONFIGURED FOR RTSP / CLOUD IN WEB BROWSER */}
        {isUnsupportedInBrowser && !compact && (
          <View style={styles.protocolNoticeOverlay} pointerEvents="none">
            <View style={styles.protocolNoticeCard}>
              <Ionicons name="information-circle-outline" size={16} color="#FDE68A" />
              <Text style={styles.protocolNoticeText}>
                {camera.protocol === 'INTELBRAS_CLOUD'
                  ? 'Intelbras Cloud P2P configurado. Navegadores web exigem Gateway HLS ou MJPEG para vídeo ao vivo.'
                  : 'RTSP :554 configurado. Para exibir vídeo no navegador, use Gateway HLS (go2rtc / MediaMTX) ou MJPEG.'}
              </Text>
            </View>
          </View>
        )}

        {isUnsupportedInBrowser && compact && (
          <View style={styles.compactProtoBadge} pointerEvents="none">
            <Text style={styles.compactProtoText}>
              {camera.protocol === 'INTELBRAS_CLOUD' ? 'Cloud P2P' : camera.protocol} • Sem vídeo Web
            </Text>
          </View>
        )}

        {/* Virtual Intrusion Tripwire Overlay */}
        {camera.aiDetectionEnabled &&
          camera.aiBoundingBoxesVisible &&
          cvSettings.intrusionLineEnabled &&
          !compact && (
            <View style={styles.tripwireOverlay} pointerEvents="none">
              <View style={styles.tripwireLine} />
              <View style={styles.tripwireTag}>
                <Text style={styles.tripwireTagText}>LINHA VIRTUAL • PERÍMETRO</Text>
              </View>
            </View>
          )}

        {/* Privacy Mask Overlay */}
        {cvSettings.privacyMaskEnabled && (
          <View style={styles.privacyMaskZone} pointerEvents="none">
            <Text style={styles.privacyMaskLabel}>MÁSCARA DE PRIVACIDADE</Text>
          </View>
        )}

        {/* Professional Computer Vision Bounding Boxes */}
        {camera.aiDetectionEnabled &&
          camera.aiBoundingBoxesVisible &&
          camera.activeDetections
            .filter((det) => {
              if (det.confidence < cvSettings.confidenceThreshold) return false;
              if (det.type === 'PERSON' && !cvSettings.detectPersons) return false;
              if (det.type === 'VEHICLE' && !cvSettings.detectVehicles) return false;
              if (det.type === 'PET' && !cvSettings.detectPets) return false;
              return true;
            })
            .map((det) => {
              const boxColor =
                det.zoneStatus === 'TRIPWIRE_CROSSED'
                  ? '#F59E0B'
                  : det.type === 'VEHICLE'
                  ? '#14B8A6'
                  : '#38BDF8';
              return (
                <View
                  key={det.id}
                  style={[
                    styles.boundingBox,
                    {
                      left: `${det.x}%`,
                      top: `${det.y}%`,
                      width: `${det.width}%`,
                      height: `${det.height}%`,
                      borderColor: boxColor,
                    },
                  ]}
                  pointerEvents="none"
                >
                  <View style={[styles.cornerTL, { borderColor: boxColor }]} />
                  <View style={[styles.cornerTR, { borderColor: boxColor }]} />
                  <View style={[styles.cornerBL, { borderColor: boxColor }]} />
                  <View style={[styles.cornerBR, { borderColor: boxColor }]} />

                  {!compact && (
                    <View
                      style={[
                        styles.bboxLabelPill,
                        { backgroundColor: boxColor },
                      ]}
                    >
                      <Text style={styles.bboxLabelText}>
                        {det.trackId ? `${det.trackId} • ` : ''}
                        {det.label} {det.confidence}%
                        {det.dwellSec ? ` • ${det.dwellSec}s` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

        {/* TOP OSD: Channel + Live + Resolution */}
        <View style={styles.osdTopRow}>
          <View style={styles.osdPill}>
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor:
                    camera.status === 'CONNECTING'
                      ? '#F59E0B'
                      : camera.status === 'OFFLINE'
                      ? '#EF4444'
                      : pulseOn
                      ? '#10B981'
                      : '#34D399',
                },
              ]}
            />
            <Text style={styles.osdPillText}>CH 0{camera.channel}</Text>
            {!compact && <Text style={styles.osdDivider}>•</Text>}
            {!compact && <Text style={styles.osdSubText}>{camera.resolution}</Text>}
          </View>

          <View style={styles.osdRightGroup}>
            {camera.isRecording && (
              <View style={styles.recPill}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>REC</Text>
              </View>
            )}
            {!compact && clockStr ? (
              <View style={styles.osdPill}>
                <Text style={styles.osdSubText}>{clockStr}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* BOTTOM OSD: Alert or Stream Error */}
        {(camera.sirenActive || streamError) && (
          <View style={styles.osdBottomRow}>
            {camera.sirenActive && (
              <View style={styles.sirenBadge}>
                <MaterialCommunityIcons name="alarm-light" size={12} color="#FFF" />
                <Text style={styles.sirenBadgeText}>SIRENE ATIVA</Text>
              </View>
            )}
            {streamError && (
              <View style={styles.streamFallbackBadge}>
                <Text style={styles.streamFallbackText}>
                  Stream HTTP indisponível • Preview
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>

      {/* CLEAN LIGHT FOOTER (OMITTED IN FULLSCREEN MODAL) */}
      {!isFullScreen && (
        <View style={[styles.cardFooter, compact && styles.cardFooterCompact]}>
          <TouchableOpacity
            onPress={onPressFeed}
            style={styles.footerInfo}
            activeOpacity={0.7}
          >
            <Text style={[styles.cameraName, compact && styles.cameraNameCompact]} numberOfLines={1}>
              {camera.name}
            </Text>
            <Text style={styles.cameraZone} numberOfLines={1}>
              {camera.zone}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerActions}>
            {onToggleMute && (
              <TouchableOpacity
                onPress={onToggleMute}
                style={[
                  styles.iconActionBtn,
                  !camera.audioMuted && styles.iconActionBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={camera.audioMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                  size={15}
                  color={camera.audioMuted ? COLORS.textSecondary : COLORS.brandPrimaryDark}
                />
              </TouchableOpacity>
            )}

            {onToggleSpotlight && (
              <TouchableOpacity
                onPress={onToggleSpotlight}
                style={[
                  styles.iconActionBtn,
                  camera.spotlightOn && styles.iconActionBtnAmber,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={camera.spotlightOn ? 'flashlight' : 'flashlight-outline'}
                  size={15}
                  color={camera.spotlightOn ? COLORS.warningAmber : COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}

            {onTakeSnapshot && !compact && (
              <TouchableOpacity
                onPress={onTakeSnapshot}
                style={styles.iconActionBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={15} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardFullScreen: {
    borderRadius: RADIUS.lg,
    borderWidth: 0,
  },
  cardFillContainer: {
    flex: 1,
    height: '100%',
  },
  videoViewport: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.bgVideoFrame,
    position: 'relative',
    overflow: 'hidden',
  },
  videoViewportCompact: {
    aspectRatio: 16 / 9,
  },
  videoViewportFill: {
    flex: 1,
    aspectRatio: undefined,
    minHeight: 110,
  },
  videoViewportFull: {
    aspectRatio: 16 / 9,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoElementCover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  sceneViewport: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  sceneCanvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  skyBand: {
    height: '32%',
    width: '100%',
  },
  streetLampGlow: {
    position: 'absolute',
    top: '8%',
    right: '18%',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(253, 224, 71, 0.14)',
  },
  wallStructure: {
    position: 'absolute',
    top: '26%',
    left: '8%',
    right: '8%',
    height: '32%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gatePillar: {
    width: '12%',
    height: '100%',
    backgroundColor: '#334155',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intercomBox: {
    width: 8,
    height: 14,
    backgroundColor: '#0D9488',
    borderRadius: 2,
  },
  gateBarsContainer: {
    flex: 1,
    height: '88%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'stretch',
    position: 'relative',
  },
  gateBarVertical: {
    width: 3,
    height: '100%',
    backgroundColor: '#475569',
  },
  gateRailHorizontal: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#475569',
  },
  groundPlane: {
    flex: 1,
    position: 'relative',
  },
  aiTripwireLine: {
    position: 'absolute',
    top: '42%',
    left: '10%',
    right: '10%',
    height: 1.5,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.55)',
  },
  personSilhouetteContainer: {
    position: 'absolute',
    left: '38%',
    top: '40%',
    alignItems: 'center',
  },
  personHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#94A3B8',
  },
  personTorso: {
    width: 16,
    height: 26,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#64748B',
    marginTop: 2,
  },
  garageCeiling: {
    height: '20%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: '15%',
  },
  garageLightTube: {
    width: '28%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(226, 232, 240, 0.45)',
  },
  garageDoorFrame: {
    height: '38%',
    marginHorizontal: '14%',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 4,
    justifyContent: 'space-between',
  },
  garageDoorPanel: {
    height: '20%',
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  carBody: {
    position: 'absolute',
    left: '26%',
    top: '18%',
    width: '48%',
    height: '58%',
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
  },
  carRoof: {
    width: '68%',
    height: '44%',
    backgroundColor: '#475569',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: -6,
  },
  carWindshield: {
    width: '60%',
    height: '20%',
    backgroundColor: '#0F172A',
    marginTop: -12,
    borderRadius: 3,
  },
  carHeadlightLeft: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 10,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  carHeadlightRight: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 10,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  patioWall: {
    height: '18%',
    marginHorizontal: '8%',
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  poolSurface: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    top: '18%',
    bottom: '16%',
    borderRadius: 8,
    opacity: 0.72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poolRipple: {
    width: '60%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  corridorWallLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '24%',
    backgroundColor: '#1E293B',
  },
  corridorWallRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '24%',
    backgroundColor: '#1E293B',
  },
  corridorFloor: {
    flex: 1,
    marginHorizontal: '24%',
  },
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(254, 240, 138, 0.18)',
  },
  irTintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },
  cornerTL: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 10,
    height: 10,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  cornerTR: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 10,
    height: 10,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },
  tripwireOverlay: {
    position: 'absolute',
    top: '62%',
    left: '6%',
    right: '6%',
    alignItems: 'flex-end',
  },
  tripwireLine: {
    width: '100%',
    height: 1.5,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(20, 184, 166, 0.72)',
  },
  tripwireTag: {
    marginTop: 4,
    backgroundColor: 'rgba(13, 148, 136, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tripwireTagText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  privacyMaskZone: {
    position: 'absolute',
    top: '18%',
    right: '6%',
    width: '28%',
    height: '24%',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyMaskLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '700',
  },
  bboxLabelPill: {
    position: 'absolute',
    top: -18,
    left: -1,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  bboxLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  osdTopRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  osdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  osdPillText: {
    color: '#F8FAFC',
    fontSize: 10.5,
    fontWeight: '700',
  },
  osdDivider: {
    color: 'rgba(248, 250, 252, 0.45)',
    fontSize: 10,
  },
  osdSubText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  osdRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  recDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  recText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  osdBottomRow: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sirenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerRed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  sirenBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  streamFallbackBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  streamFallbackText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.bgSurface,
  },
  cardFooterCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  footerInfo: {
    flex: 1,
    marginRight: 8,
  },
  cameraName: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  cameraNameCompact: {
    fontSize: 12.5,
  },
  cameraZone: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionBtnActive: {
    backgroundColor: COLORS.brandPrimarySoft,
  },
  iconActionBtnAmber: {
    backgroundColor: COLORS.amberSoft,
  },
  protocolNoticeOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: 'center',
  },
  protocolNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.35)',
  },
  protocolNoticeText: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  compactProtoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  compactProtoText: {
    color: '#FDE68A',
    fontSize: 9.5,
    fontWeight: '700',
  },
});
