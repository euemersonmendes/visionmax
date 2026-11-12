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
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../theme/tokens';

export const EventsScreen: React.FC = () => {
  const {
    cameras,
    events,
    openFullScreenCamera,
    acknowledgeEvent,
    acknowledgeAllEvents,
  } = useSecurity();

  const [selectedCameraFilter, setSelectedCameraFilter] = useState<string>('ALL');
  const [selectedScrubberHour, setSelectedScrubberHour] = useState<string>('19:00');

  const filteredEvents = events.filter((evt) =>
    selectedCameraFilter === 'ALL' ? true : evt.cameraId === selectedCameraFilter
  );

  const unacknowledgedCount = events.filter((e) => !e.acknowledged).length;

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
      {/* 24H NVR TIMELINE CARD */}
      <View style={styles.dvrScrubberCard}>
        <View style={styles.dvrHeaderRow}>
          <View style={styles.dvrTitleWrap}>
            <MaterialCommunityIcons
              name="history"
              size={18}
              color={COLORS.brandPrimary}
            />
            <Text style={styles.dvrTitle}>Linha do Tempo NVR 24h</Text>
          </View>
          <View style={styles.dvrStatusChip}>
            <View style={styles.dvrLiveDot} />
            <Text style={styles.dvrStatusText}>Gravação 4 Canais</Text>
          </View>
        </View>

        <View style={styles.scrubberTrack}>
          {['15:00', '16:00', '17:00', '18:00', '19:00', 'Agora'].map((hour) => {
            const active = selectedScrubberHour === hour;
            const hasMotion = hour === '19:00' || hour === '16:00';
            return (
              <TouchableOpacity
                key={hour}
                onPress={() => setSelectedScrubberHour(hour)}
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

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.brandPrimary }]} />
            <Text style={styles.legendText}>Gravação Contínua</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.warningAmber }]} />
            <Text style={styles.legendText}>Detecção IA</Text>
          </View>
        </View>
      </View>

      {/* FILTER HEADER */}
      <View style={styles.filterHeaderRow}>
        <Text style={styles.sectionTitle}>
          Eventos Recentes ({filteredEvents.length})
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
                    onPress={() => openFullScreenCamera(evt.cameraId)}
                    style={styles.eventPrimaryBtn}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="videocam-outline"
                      size={14}
                      color={COLORS.brandPrimaryDark}
                    />
                    <Text style={styles.eventPrimaryBtnText}>Ver Câmera</Text>
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
  dvrScrubberCard: {
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
    flexWrap: 'wrap',
    gap: 8,
  },
  dvrTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dvrTitle: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
  },
  dvrStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  dvrLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.successGreen,
  },
  dvrStatusText: {
    color: COLORS.successGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  scrubberTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  scrubberSlot: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSubtle,
    gap: 6,
  },
  scrubberSlotActive: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderWidth: 1,
    borderColor: COLORS.brandPrimaryBorder,
  },
  scrubberBarTrack: {
    width: '100%',
    height: 6,
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
    fontSize: 11,
    fontWeight: '600',
  },
  scrubberHourLabelActive: {
    color: COLORS.brandPrimaryDark,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
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
