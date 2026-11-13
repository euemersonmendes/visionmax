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
import { SecurityMode, LayoutMode } from '../types/security';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../theme/tokens';

interface MonitorScreenProps {
  onOpenIntelbrasSetup?: () => void;
}

const SECURITY_MODES: {
  id: SecurityMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  softBg: string;
}[] = [
  {
    id: 'DISARMED',
    label: 'Desarmado',
    icon: 'lock-open-outline',
    color: COLORS.textSecondary,
    softBg: COLORS.bgSubtle,
  },
  {
    id: 'HOME',
    label: 'Em Casa',
    icon: 'shield-checkmark-outline',
    color: COLORS.successGreen,
    softBg: COLORS.greenSoft,
  },
  {
    id: 'AWAY',
    label: 'Ausente',
    icon: 'shield-half-outline',
    color: COLORS.brandSecondary,
    softBg: COLORS.brandSecondarySoft,
  },
  {
    id: 'NIGHT',
    label: 'Noturno',
    icon: 'moon-outline',
    color: COLORS.warningAmber,
    softBg: COLORS.amberSoft,
  },
];

export const MonitorScreen: React.FC<MonitorScreenProps> = ({ onOpenIntelbrasSetup }) => {
  const {
    intelbrasConfig,
    cameras,
    securityMode,
    layoutMode,
    focusedCameraId,
    allAudioMuted,
    setSecurityMode,
    setLayoutMode,
    setFocusedCameraId,
    openFullScreenCamera,
    toggleAllAudioMute,
    toggleCameraMute,
    toggleCameraSpotlight,
    takeSnapshot,
  } = useSecurity();

  const [bannerDismissed, setBannerDismissed] = useState(false);

  const onlineCount = cameras.filter((c) => c.status === 'ONLINE').length;
  const totalBitrateMbps = (
    cameras.reduce((acc, c) => acc + c.bitrateKbps, 0) / 1000
  ).toFixed(1);

  const focusedCam = cameras.find((c) => c.id === focusedCameraId) || cameras[0];
  const secondaryCams = cameras.filter((c) => c.id !== focusedCam.id);

  const topRowCams = cameras.slice(0, 2);
  const bottomRowCams = cameras.slice(2, 4);

  const renderTopControls = () => (
    <View style={styles.topControlsWrap}>
      {/* SETUP CALLOUT ONLY IF NOT CONFIGURED */}
      {!intelbrasConfig.isConfiguredByUser && !bannerDismissed && (
        <View style={styles.setupBanner}>
          <View style={styles.setupBannerLeft}>
            <MaterialCommunityIcons
              name="router-wireless"
              size={18}
              color={COLORS.brandPrimary}
            />
            <Text style={styles.setupTitle} numberOfLines={1}>
              Conecte seu DVR / NVR Intelbras
            </Text>
          </View>
          <View style={styles.setupActionsRow}>
            <TouchableOpacity
              onPress={onOpenIntelbrasSetup}
              style={styles.setupPrimaryBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.setupPrimaryBtnText}>Configurar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBannerDismissed(true)}
              style={styles.setupDismissBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* UNIFIED COMPACT CONTROL BAR */}
      <View style={styles.controlBar}>
        <View style={styles.telemetrySummary}>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>
              {onlineCount}/{cameras.length} Online
            </Text>
          </View>
          <Text style={styles.bitrateText}>{totalBitrateMbps} Mbps</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modesInlineRow}
        >
          {SECURITY_MODES.map((m) => {
            const active = securityMode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setSecurityMode(m.id)}
                activeOpacity={0.75}
                style={[
                  styles.modeChip,
                  active && {
                    backgroundColor: m.softBg,
                    borderColor: m.color,
                  },
                ]}
              >
                <Ionicons
                  name={m.icon}
                  size={13}
                  color={active ? m.color : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.modeChipText,
                    active && { color: m.color, fontWeight: '700' },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.rightControls}>
          <View style={styles.segmentedTrack}>
            {(
              [
                { id: 'QUAD_2X2', icon: 'grid-outline', label: '2×2' },
                { id: 'FOCUS_PIP', icon: 'albums-outline', label: 'Foco' },
                { id: 'LIST_1X4', icon: 'list-outline', label: 'Lista' },
              ] as { id: LayoutMode; icon: keyof typeof Ionicons.glyphMap; label: string }[]
            ).map((opt) => {
              const active = layoutMode === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setLayoutMode(opt.id)}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={opt.icon}
                    size={13}
                    color={active ? COLORS.textPrimary : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentLabel,
                      active && styles.segmentLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={toggleAllAudioMute}
            style={[
              styles.muteAllBtn,
              !allAudioMuted && styles.muteAllBtnActive,
            ]}
            activeOpacity={0.75}
          >
            <Ionicons
              name={allAudioMuted ? 'volume-mute-outline' : 'volume-high-outline'}
              size={16}
              color={allAudioMuted ? COLORS.textSecondary : COLORS.brandPrimaryDark}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // QUAD 2x2: FITS ALL 4 CAMERAS IN THE SAME WINDOW WITHOUT SCROLLING
  if (layoutMode === 'QUAD_2X2') {
    return (
      <View style={styles.quadWindowContainer}>
        {renderTopControls()}

        <View style={styles.quadRowsWrapper}>
          <View style={styles.quadRow}>
            {topRowCams.map((cam) => (
              <View key={cam.id} style={styles.quadFlexCell}>
                <CameraFeedView
                  camera={cam}
                  compact
                  fillContainer
                  onPressFeed={() => openFullScreenCamera(cam.id)}
                  onToggleMute={() => toggleCameraMute(cam.id)}
                  onToggleSpotlight={() => toggleCameraSpotlight(cam.id)}
                />
              </View>
            ))}
          </View>

          <View style={styles.quadRow}>
            {bottomRowCams.map((cam) => (
              <View key={cam.id} style={styles.quadFlexCell}>
                <CameraFeedView
                  camera={cam}
                  compact
                  fillContainer
                  onPressFeed={() => openFullScreenCamera(cam.id)}
                  onToggleMute={() => toggleCameraMute(cam.id)}
                  onToggleSpotlight={() => toggleCameraSpotlight(cam.id)}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {renderTopControls()}

      {layoutMode === 'FOCUS_PIP' ? (
        <View style={styles.focusLayoutContainer}>
          <View style={styles.focusPrimaryCell}>
            <CameraFeedView
              camera={focusedCam}
              onPressFeed={() => openFullScreenCamera(focusedCam.id)}
              onToggleMute={() => toggleCameraMute(focusedCam.id)}
              onToggleSpotlight={() => toggleCameraSpotlight(focusedCam.id)}
              onTakeSnapshot={() => takeSnapshot(focusedCam.id)}
            />
          </View>

          <View style={styles.focusThumbnailsRow}>
            {secondaryCams.map((cam) => (
              <View key={cam.id} style={styles.focusThumbCell}>
                <CameraFeedView
                  camera={cam}
                  compact
                  onPressFeed={() => setFocusedCameraId(cam.id)}
                  onToggleMute={() => toggleCameraMute(cam.id)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.listLayoutContainer}>
          {cameras.map((cam) => (
            <View key={cam.id} style={styles.listCardWrapper}>
              <View style={styles.listFeedHeight}>
                <CameraFeedView
                  camera={cam}
                  onPressFeed={() => openFullScreenCamera(cam.id)}
                  onToggleMute={() => toggleCameraMute(cam.id)}
                  onToggleSpotlight={() => toggleCameraSpotlight(cam.id)}
                  onTakeSnapshot={() => takeSnapshot(cam.id)}
                />
              </View>
              <View style={styles.listQuickFooter}>
                <View style={styles.listMetaGroup}>
                  <Text style={styles.listModelText}>{cam.model}</Text>
                  <Text style={styles.listIpText}>
                    {cam.ipAddress} • {cam.telemetry.latencyMs}ms • {cam.telemetry.tempCelsius}°C
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openFullScreenCamera(cam.id)}
                  style={styles.listExpandBtn}
                  activeOpacity={0.75}
                >
                  <Ionicons name="expand-outline" size={15} color={COLORS.brandPrimaryDark} />
                  <Text style={styles.listExpandText}>Controlar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  quadWindowContainer: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  topControlsWrap: {
    gap: SPACING.sm,
  },
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.brandPrimaryBorder,
    ...SHADOWS.card,
  },
  setupBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  setupTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  setupActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setupPrimaryBtn: {
    backgroundColor: COLORS.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  setupPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  setupDismissBtn: {
    padding: 4,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  telemetrySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.successGreen,
  },
  onlineText: {
    color: COLORS.successGreen,
    fontSize: 11.5,
    fontWeight: '700',
  },
  bitrateText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  modesInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  modeChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
    padding: 3,
    borderRadius: RADIUS.md,
    gap: 2,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.bgSurface,
    ...SHADOWS.card,
  },
  segmentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentLabelActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  muteAllBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteAllBtnActive: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimaryBorder,
  },
  quadRowsWrapper: {
    flex: 1,
    gap: SPACING.sm,
  },
  quadRow: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quadFlexCell: {
    flex: 1,
    height: '100%',
  },
  focusLayoutContainer: {
    gap: SPACING.md,
  },
  focusPrimaryCell: {
    width: '100%',
  },
  focusThumbnailsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  focusThumbCell: {
    flex: 1,
  },
  listLayoutContainer: {
    gap: SPACING.md,
  },
  listCardWrapper: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  listFeedHeight: {
    width: '100%',
  },
  listQuickFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  listMetaGroup: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  listModelText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  listIpText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  listExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.brandPrimarySoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  listExpandText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
});
