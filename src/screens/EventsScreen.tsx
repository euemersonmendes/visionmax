import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecurity } from '../context/SecurityContext';
import { CameraFeedView } from '../components/CameraFeedView';
import { buildDvrPlaybackUrl } from '../utils/cameraUrlBuilder';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../theme/tokens';

const SPEED_STEPS = [0.25, 0.5, 1.0, 2.0, 4.0, 8.0];
const TIMELINE_SLOTS = ['08:00', '12:00', '16:00', '18:00', '19:00', '20:30', 'Agora'];

export const EventsScreen: React.FC = () => {
  const {
    intelbrasConfig,
    cameras,
    events,
    openFullScreenCamera,
    acknowledgeEvent,
    acknowledgeAllEvents,
  } = useSecurity();

  const [selectedCameraFilter, setSelectedCameraFilter] = useState<string>('ALL');
  const [playbackCameraId, setPlaybackCameraId] = useState<string>(cameras[0]?.id || 'cam-01');
  const [selectedDateMode, setSelectedDateMode] = useState<'TODAY' | 'YESTERDAY'>('TODAY');
  const [selectedHour, setSelectedHour] = useState<string>('19:00');
  const [minuteOffset, setMinuteOffset] = useState<number>(0);
  const [speedIndex, setSpeedIndex] = useState<number>(2); // 1.0x
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const playbackSpeed = SPEED_STEPS[speedIndex];
  const playbackCamera = cameras.find((c) => c.id === playbackCameraId) || cameras[0];

  const today = new Date();
  if (selectedDateMode === 'YESTERDAY') {
    today.setDate(today.getDate() - 1);
  }
  const dateIso = today.toISOString().split('T')[0];

  const displayTime = (() => {
    if (selectedHour === 'Agora') return 'Tempo Real';
    const [hh, mm] = selectedHour.split(':').map(Number);
    const totalMin = Math.max(0, Math.min(23 * 60 + 59, hh * 60 + mm + minuteOffset));
    const nh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const nm = String(totalMin % 60).padStart(2, '0');
    return `${nh}:${nm}`;
  })();

  const dvrPlaybackUri = buildDvrPlaybackUrl({
    ipAddress: intelbrasConfig.ipAddress || playbackCamera.ipAddress,
    rtspPort: intelbrasConfig.rtspPort || 554,
    username: intelbrasConfig.username || playbackCamera.username,
    password: intelbrasConfig.password || playbackCamera.password,
    channel: playbackCamera.dvrChannel || playbackCamera.channel,
    dateIso,
    timeStr: displayTime === 'Tempo Real' ? '21:00' : displayTime,
  });

  const filteredEvents = events.filter((evt) =>
    selectedCameraFilter === 'ALL' ? true : evt.cameraId === selectedCameraFilter
  );

  const unacknowledgedCount = events.filter((e) => !e.acknowledged).length;

  const adjustSpeed = (delta: number) => {
    setSpeedIndex((prev) => Math.max(0, Math.min(SPEED_STEPS.length - 1, prev + delta)));
  };

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'PERSON':
        return {
          name: 'person-outline' as const,
          color: COLORS.warningAmber,
          bg: COLORS.amberSoft,
        };
      case 'VEHICLE':
        return {
          name: 'car-outline' as const,
          color: COLORS.brandPrimary,
          bg: COLORS.brandPrimarySoft,
        };
      case 'ALARM':
        return {
          name: 'warning-outline' as const,
          color: COLORS.dangerRed,
          bg: COLORS.dangerSoft,
        };
      case 'AUDIO':
        return {
          name: 'mic-outline' as const,
          color: COLORS.purpleAccent,
          bg: COLORS.purpleSoft,
        };
      default:
        return {
          name: 'pulse-outline' as const,
          color: COLORS.successGreen,
          bg: COLORS.greenSoft,
        };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* DVR NVR PLAYBACK PLAYER */}
      <View style={styles.playbackCard}>
        <View style={styles.dvrHeaderRow}>
          <View style={styles.dvrTitleWrap}>
            <MaterialCommunityIcons
              name="history"
              size={19}
              color={COLORS.brandPrimary}
            />
            <Text style={styles.dvrTitle}>Gravações do DVR (Playback)</Text>
          </View>
          <View style={styles.dateSwitchRow}>
            <TouchableOpacity
              onPress={() => setSelectedDateMode('TODAY')}
              style={[
                styles.datePill,
                selectedDateMode === 'TODAY' && styles.datePillActive,
              ]}
            >
              <Text
                style={[
                  styles.datePillText,
                  selectedDateMode === 'TODAY' && styles.datePillTextActive,
                ]}
              >
                Hoje
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedDateMode('YESTERDAY')}
              style={[
                styles.datePill,
                selectedDateMode === 'YESTERDAY' && styles.datePillActive,
              ]}
            >
              <Text
                style={[
                  styles.datePillText,
                  selectedDateMode === 'YESTERDAY' && styles.datePillTextActive,
                ]}
              >
                Ontem
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CHANNEL SELECTOR */}
        <View style={styles.channelRow}>
          {cameras.map((cam) => {
            const active = cam.id === playbackCamera.id;
            return (
              <TouchableOpacity
                key={cam.id}
                onPress={() => setPlaybackCameraId(cam.id)}
                style={[styles.chPill, active && styles.chPillActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.chPillText, active && styles.chPillTextActive]}>
                  CH 0{cam.channel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PLAYBACK VIDEO VIEWPORT */}
        <CameraFeedView
          camera={playbackCamera}
          playbackRate={playbackSpeed}
          paused={isPaused}
          onPressFeed={() => openFullScreenCamera(playbackCamera.id)}
        />

        {/* TIMELINE SCRUBBER */}
        <View style={styles.scrubberTrack}>
          {TIMELINE_SLOTS.map((hour) => {
            const active = selectedHour === hour;
            const hasMotion = hour === '19:00' || hour === '16:00' || hour === '20:30';
            return (
              <TouchableOpacity
                key={hour}
                onPress={() => {
                  setSelectedHour(hour);
                  setMinuteOffset(0);
                }}
                style={[styles.scrubberSlot, active && styles.scrubberSlotActive]}
                activeOpacity={0.75}
              >
                <View style={styles.scrubberBarTrack}>
                  <View
                    style={[
                      styles.scrubberFill,
                      {
                        backgroundColor: hasMotion
                          ? COLORS.warningAmber
                          : COLORS.brandPrimary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.scrubberHourLabel,
                    active && styles.scrubberHourLabelActive,
                  ]}
                >
                  {hour}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TRANSPORT CONTROLS (SEEK + PLAY/PAUSE) */}
        <View style={styles.transportRow}>
          <TouchableOpacity
            onPress={() => setMinuteOffset((m) => m - 5)}
            style={styles.seekBtn}
          >
            <Ionicons name="play-back-outline" size={14} color={COLORS.textPrimary} />
            <Text style={styles.seekBtnText}>-5m</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMinuteOffset((m) => m - 1)}
            style={styles.seekBtn}
          >
            <Text style={styles.seekBtnText}>-1m</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsPaused((p) => !p)}
            style={styles.playPauseBtn}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.playPauseText}>
              {isPaused ? 'Retomar' : displayTime}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMinuteOffset((m) => m + 1)}
            style={styles.seekBtn}
          >
            <Text style={styles.seekBtnText}>+1m</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMinuteOffset((m) => m + 5)}
            style={styles.seekBtn}
          >
            <Text style={styles.seekBtnText}>+5m</Text>
            <Ionicons name="play-forward-outline" size={14} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* SPEED CONTROLS (ACELERAR / REDUZIR) */}
        <View style={styles.speedSection}>
          <View style={styles.speedHeader}>
            <Text style={styles.speedLabel}>Velocidade de Reprodução</Text>
            <View style={styles.speedStepperRow}>
              <TouchableOpacity
                onPress={() => adjustSpeed(-1)}
                disabled={speedIndex === 0}
                style={[styles.stepBtn, speedIndex === 0 && styles.stepBtnDisabled]}
              >
                <Ionicons name="remove" size={15} color={COLORS.textPrimary} />
                <Text style={styles.stepBtnText}>Reduzir</Text>
              </TouchableOpacity>

              <View style={styles.currentSpeedBadge}>
                <Text style={styles.currentSpeedText}>{playbackSpeed}×</Text>
              </View>

              <TouchableOpacity
                onPress={() => adjustSpeed(1)}
                disabled={speedIndex === SPEED_STEPS.length - 1}
                style={[
                  styles.stepBtn,
                  speedIndex === SPEED_STEPS.length - 1 && styles.stepBtnDisabled,
                ]}
              >
                <Text style={styles.stepBtnText}>Acelerar</Text>
                <Ionicons name="add" size={15} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.speedPillsRow}>
            {SPEED_STEPS.map((spd, idx) => {
              const active = idx === speedIndex;
              return (
                <TouchableOpacity
                  key={spd}
                  onPress={() => setSpeedIndex(idx)}
                  style={[styles.speedPill, active && styles.speedPillActive]}
                >
                  <Text
                    style={[
                      styles.speedPillText,
                      active && styles.speedPillTextActive,
                    ]}
                  >
                    {spd}×
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.playbackUriHint} numberOfLines={1}>
            DVR Playback RTSP: {dvrPlaybackUri}
          </Text>
        </View>
      </View>

      {/* FILTER HEADER */}
      <View style={styles.filterHeaderRow}>
        <Text style={styles.sectionTitle}>
          Eventos de IA ({filteredEvents.length})
        </Text>
        {unacknowledgedCount > 0 && (
          <TouchableOpacity
            onPress={acknowledgeAllEvents}
            style={styles.ackAllButton}
            activeOpacity={0.75}
          >
            <Ionicons name="checkmark-done" size={14} color={COLORS.brandPrimaryDark} />
            <Text style={styles.ackAllText}>
              Confirmar todos ({unacknowledgedCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CAMERA FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
      >
        <TouchableOpacity
          onPress={() => setSelectedCameraFilter('ALL')}
          style={[
            styles.filterChip,
            selectedCameraFilter === 'ALL' && styles.filterChipActive,
          ]}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedCameraFilter === 'ALL' && styles.filterChipTextActive,
            ]}
          >
            Todas as Câmeras
          </Text>
        </TouchableOpacity>

        {cameras.map((cam) => {
          const active = selectedCameraFilter === cam.id;
          return (
            <TouchableOpacity
              key={cam.id}
              onPress={() => setSelectedCameraFilter(cam.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                CH 0{cam.channel} • {cam.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* EVENTS LIST */}
      <View style={styles.eventsList}>
        {filteredEvents.map((evt) => {
          const iconMeta = getEventStyle(evt.type);
          return (
            <View
              key={evt.id}
              style={[
                styles.eventCard,
                !evt.acknowledged && styles.eventCardUnread,
              ]}
            >
              <View style={styles.eventTopRow}>
                <View style={[styles.eventIconBox, { backgroundColor: iconMeta.bg }]}>
                  <Ionicons name={iconMeta.name} size={18} color={iconMeta.color} />
                </View>

                <View style={styles.eventInfoCol}>
                  <View style={styles.eventTitleRow}>
                    <Text style={styles.eventTitle}>{evt.title}</Text>
                    {!evt.acknowledged && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.eventMeta}>
                    CH 0{evt.channel} • {evt.cameraName} • {evt.timeAgo}
                  </Text>
                </View>

                {evt.confidence !== undefined && (
                  <View style={styles.confidencePill}>
                    <Text style={styles.confidenceText}>{evt.confidence}% IA</Text>
                  </View>
                )}
              </View>

              <Text style={styles.eventDescription}>{evt.description}</Text>

              <View style={styles.eventFooterRow}>
                <Text style={styles.eventTimestamp}>
                  {evt.timestamp} • {evt.durationSec}s
                </Text>

                <View style={styles.eventActionsRow}>
                  {!evt.acknowledged && (
                    <TouchableOpacity
                      onPress={() => acknowledgeEvent(evt.id)}
                      style={styles.eventSecondaryBtn}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="checkmark" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.eventSecondaryBtnText}>Confirmar</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setPlaybackCameraId(evt.cameraId);
                      setSelectedHour(evt.timestamp.slice(0, 5));
                      setMinuteOffset(0);
                      setIsPaused(false);
                    }}
                    style={styles.eventPrimaryBtn}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="play-circle-outline"
                      size={15}
                      color={COLORS.brandPrimaryDark}
                    />
                    <Text style={styles.eventPrimaryBtnText}>Reproduzir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  playbackCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  dvrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dvrTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dvrTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  dateSwitchRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
    padding: 3,
    borderRadius: RADIUS.md,
    gap: 2,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  datePillActive: {
    backgroundColor: COLORS.bgSurface,
    ...SHADOWS.card,
  },
  datePillText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  datePillTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  channelRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSubtle,
  },
  chPillActive: {
    backgroundColor: COLORS.brandPrimary,
  },
  chPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  chPillTextActive: {
    color: '#FFFFFF',
  },
  scrubberTrack: {
    flexDirection: 'row',
    gap: 5,
  },
  scrubberSlot: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 3,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSubtle,
    gap: 5,
  },
  scrubberSlotActive: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderWidth: 1,
    borderColor: COLORS.brandPrimaryBorder,
  },
  scrubberBarTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderSubtle,
    overflow: 'hidden',
  },
  scrubberFill: {
    width: '100%',
    height: '100%',
  },
  scrubberHourLabel: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
  },
  scrubberHourLabelActive: {
    color: COLORS.brandPrimaryDark,
    fontWeight: '700',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  seekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  seekBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  playPauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandPrimary,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  playPauseText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  speedSection: {
    backgroundColor: COLORS.bgCanvas,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: SPACING.sm,
  },
  speedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedLabel: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  speedStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  currentSpeedBadge: {
    backgroundColor: COLORS.brandPrimarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  currentSpeedText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  speedPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  speedPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  speedPillActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },
  speedPillText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  speedPillTextActive: {
    color: '#FFFFFF',
  },
  playbackUriHint: {
    color: COLORS.textMuted,
    fontSize: 10.5,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  ackAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.brandPrimarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  ackAllText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterChipsRow: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  filterChipActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  eventsList: {
    gap: SPACING.md,
  },
  eventCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  eventCardUnread: {
    borderColor: COLORS.brandPrimaryBorder,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  eventIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfoCol: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.brandPrimary,
  },
  eventMeta: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
  },
  confidencePill: {
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  confidenceText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  eventDescription: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  eventFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  eventTimestamp: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '500',
  },
  eventActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  eventSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  eventSecondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  eventPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.brandPrimarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  eventPrimaryBtnText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 11.5,
    fontWeight: '700',
  },
});
