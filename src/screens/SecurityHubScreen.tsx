import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecurity } from '../context/SecurityContext';
import { SecurityMode } from '../types/security';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../theme/tokens';

const ARM_MODES: {
  id: SecurityMode;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  softBg: string;
}[] = [
  {
    id: 'HOME',
    title: 'Em Casa',
    desc: 'Perímetro externo ativo',
    icon: 'shield-checkmark-outline',
    color: COLORS.successGreen,
    softBg: COLORS.greenSoft,
  },
  {
    id: 'AWAY',
    title: 'Ausente',
    desc: 'Proteção total 100%',
    icon: 'shield-half-outline',
    color: COLORS.brandSecondary,
    softBg: COLORS.brandSecondarySoft,
  },
  {
    id: 'NIGHT',
    title: 'Modo Noturno',
    desc: 'IR + alertas silenciosos',
    icon: 'moon-outline',
    color: COLORS.warningAmber,
    softBg: COLORS.amberSoft,
  },
  {
    id: 'DISARMED',
    title: 'Desarmado',
    desc: 'Apenas gravação contínua',
    icon: 'lock-open-outline',
    color: COLORS.textSecondary,
    softBg: COLORS.bgSubtle,
  },
];

export const SecurityHubScreen: React.FC = () => {
  const {
    cameras,
    sensors,
    securityMode,
    globalPanicActive,
    snapshotsCount,
    setSecurityMode,
    toggleGlobalPanic,
    toggleSmartSensor,
    openFullScreenCamera,
  } = useSecurity();

  const totalStorageGb = cameras.reduce((acc, c) => acc + c.telemetry.storageUsedGb, 0);
  const storagePercent = Math.min(100, Math.round((totalStorageGb / 2000) * 100));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ARMING MODES GRID */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Modo de Operação da Central</Text>
        <View style={styles.modesGrid}>
          {ARM_MODES.map((m) => {
            const active = securityMode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setSecurityMode(m.id)}
                activeOpacity={0.75}
                style={[
                  styles.modeCard,
                  active && {
                    borderColor: m.color,
                    backgroundColor: m.softBg,
                  },
                ]}
              >
                <View
                  style={[
                    styles.modeIconBox,
                    { backgroundColor: active ? '#FFFFFF' : m.softBg },
                  ]}
                >
                  <Ionicons name={m.icon} size={20} color={m.color} />
                </View>
                <Text style={styles.modeTitle}>{m.title}</Text>
                <Text style={styles.modeDesc}>{m.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* EMERGENCY PANIC MASTER CARD */}
      <View
        style={[
          styles.panicCard,
          globalPanicActive && styles.panicCardActive,
        ]}
      >
        <View style={styles.panicInfoCol}>
          <View style={styles.panicTitleRow}>
            <MaterialCommunityIcons
              name="alarm-light-outline"
              size={22}
              color={globalPanicActive ? '#FFFFFF' : COLORS.dangerRed}
            />
            <Text
              style={[
                styles.panicTitle,
                globalPanicActive && { color: '#FFFFFF' },
              ]}
            >
              {globalPanicActive
                ? 'Sirene de Pânico Ativa'
                : 'Acionamento de Emergência'}
            </Text>
          </View>
          <Text
            style={[
              styles.panicDesc,
              globalPanicActive && { color: '#FEE2E2' },
            ]}
          >
            Dispara simultaneamente as sirenes e holofotes das 4 câmeras da residência.
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleGlobalPanic}
          activeOpacity={0.8}
          style={[
            styles.panicTriggerButton,
            globalPanicActive && styles.panicTriggerButtonActive,
          ]}
        >
          <Text
            style={[
              styles.panicTriggerText,
              globalPanicActive && { color: COLORS.dangerRed },
            ]}
          >
            {globalPanicActive ? 'DESATIVAR' : 'ATIVAR SOS'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SMART PERIMETER SENSORS & ACCESS */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Sensores & Controle de Acesso</Text>
          <Text style={styles.sectionSubTag}>{sensors.length} dispositivos</Text>
        </View>

        <View style={styles.sensorsGrid}>
          {sensors.map((sensor) => {
            const isSecure =
              sensor.state === 'LOCKED' ||
              sensor.state === 'CLOSED' ||
              sensor.state === 'ARMED';

            const iconName: keyof typeof MaterialCommunityIcons.glyphMap =
              sensor.type === 'LOCK'
                ? isSecure
                  ? 'lock-outline'
                  : 'lock-open-variant-outline'
                : sensor.type === 'GARAGE_DOOR'
                ? 'garage-variant'
                : sensor.type === 'PERIMETER_IR'
                ? 'motion-sensor'
                : 'window-closed-variant';

            return (
              <View key={sensor.id} style={styles.sensorCard}>
                <View style={styles.sensorTopRow}>
                  <View
                    style={[
                      styles.sensorIconBox,
                      {
                        backgroundColor: isSecure
                          ? COLORS.greenSoft
                          : COLORS.amberSoft,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={iconName}
                      size={20}
                      color={isSecure ? COLORS.successGreen : COLORS.warningAmber}
                    />
                  </View>

                  <View style={styles.batteryPill}>
                    <Ionicons
                      name="battery-charging-outline"
                      size={12}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.batteryText}>{sensor.batteryPercent}%</Text>
                  </View>
                </View>

                <Text style={styles.sensorName}>{sensor.name}</Text>
                <Text style={styles.sensorZone}>{sensor.zone}</Text>

                <View style={styles.sensorStatusRow}>
                  <View
                    style={[
                      styles.stateBadge,
                      {
                        backgroundColor: isSecure
                          ? COLORS.greenSoft
                          : COLORS.amberSoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stateBadgeText,
                        {
                          color: isSecure
                            ? COLORS.successGreen
                            : COLORS.warningAmber,
                        },
                      ]}
                    >
                      {sensor.state}
                    </Text>
                  </View>
                  <Text style={styles.sensorUpdated}>{sensor.lastUpdated}</Text>
                </View>

                <View style={styles.sensorActionsRow}>
                  <TouchableOpacity
                    onPress={() => toggleSmartSensor(sensor.id)}
                    style={styles.sensorActionBtn}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.sensorActionBtnText}>Alternar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openFullScreenCamera(sensor.linkedCameraId)}
                    style={styles.sensorCamBtn}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="videocam-outline"
                      size={15}
                      color={COLORS.brandPrimaryDark}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* NVR STORAGE & HEALTH */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <View style={styles.storageTitleWrap}>
            <MaterialCommunityIcons
              name="harddisk"
              size={20}
              color={COLORS.brandPrimary}
            />
            <Text style={styles.storageTitle}>Armazenamento NVR / HD</Text>
          </View>
          <Text style={styles.storageValue}>
            {totalStorageGb} GB / 2.000 GB
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${storagePercent}%` }]} />
        </View>

        <View style={styles.storageFooter}>
          <Text style={styles.storageMeta}>
            {storagePercent}% utilizado • Gravação cíclica ativa
          </Text>
          <Text style={styles.storageMeta}>{snapshotsCount} fotos salvas</Text>
        </View>
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
    gap: SPACING.lg,
  },
  sectionBlock: {
    gap: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubTag: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modeCard: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 6,
    ...SHADOWS.card,
  },
  modeIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  modeDesc: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
  },
  panicCard: {
    backgroundColor: COLORS.dangerSoft,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    gap: SPACING.md,
  },
  panicCardActive: {
    backgroundColor: COLORS.dangerRed,
    borderColor: COLORS.dangerRed,
  },
  panicInfoCol: {
    gap: 4,
  },
  panicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panicTitle: {
    color: COLORS.dangerRed,
    fontSize: 15,
    fontWeight: '800',
  },
  panicDesc: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  panicTriggerButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.dangerRed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  panicTriggerButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  panicTriggerText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  sensorCard: {
    width: '48%',
    minWidth: 155,
    flexGrow: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 6,
    ...SHADOWS.card,
  },
  sensorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sensorIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  batteryText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
  },
  sensorName: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 2,
  },
  sensorZone: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
  },
  sensorStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  stateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sensorUpdated: {
    color: COLORS.textMuted,
    fontSize: 10.5,
  },
  sensorActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  sensorActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgSubtle,
  },
  sensorActionBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  sensorCamBtn: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.brandPrimarySoft,
  },
  storageCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  storageValue: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.brandPrimary,
    borderRadius: 4,
  },
  storageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  storageMeta: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
  },
});
