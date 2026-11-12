import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SecurityProvider, useSecurity } from './src/context/SecurityContext';
import { MonitorScreen } from './src/screens/MonitorScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { SecurityHubScreen } from './src/screens/SecurityHubScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { FullScreenCameraModal } from './src/components/FullScreenCameraModal';
import { COLORS } from './src/theme/colors';
import { RADIUS, SHADOWS, SPACING } from './src/theme/tokens';

type TabKey = 'MONITOR' | 'EVENTS' | 'SECURITY' | 'SETTINGS';

const MainShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('MONITOR');
  const {
    intelbrasConfig,
    events,
    securityMode,
    globalPanicActive,
    lastToastMessage,
    toggleGlobalPanic,
    clearToast,
  } = useSecurity();

  const unreadEventsCount = events.filter((e) => !e.acknowledged).length;

  const getModeBadgeMeta = () => {
    switch (securityMode) {
      case 'AWAY':
        return {
          label: 'Ausente',
          color: COLORS.brandSecondary,
          bg: COLORS.brandSecondarySoft,
          border: 'rgba(37, 99, 235, 0.22)',
        };
      case 'NIGHT':
        return {
          label: 'Noturno',
          color: COLORS.warningAmber,
          bg: COLORS.amberSoft,
          border: COLORS.amberBorder,
        };
      case 'DISARMED':
        return {
          label: 'Desarmado',
          color: COLORS.textSecondary,
          bg: COLORS.bgSubtle,
          border: COLORS.borderSubtle,
        };
      default:
        return {
          label: 'Em Casa',
          color: COLORS.successGreen,
          bg: COLORS.greenSoft,
          border: COLORS.greenBorder,
        };
    }
  };

  const modeMeta = getModeBadgeMeta();

  const connectionSubtitle = intelbrasConfig.isConfiguredByUser
    ? `${intelbrasConfig.systemName} • Intelbras ${
        intelbrasConfig.connectionMode === 'CLOUD_P2P'
          ? 'Cloud'
          : intelbrasConfig.connectionMode === 'DDNS'
          ? 'DDNS'
          : intelbrasConfig.connectionMode === 'HLS_GATEWAY'
          ? 'HLS'
          : 'LAN'
      }`
    : `${intelbrasConfig.systemName} • Modo Demo`;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" />

      {/* CLEAN LIGHT HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <MaterialCommunityIcons name="shield-home" size={20} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.titleLine}>
              <Text style={styles.brandTitle}>VISION MAX</Text>
              <View style={styles.brandPill}>
                <Text style={styles.brandPillText}>INTELBRAS</Text>
              </View>
            </View>
            <Text style={styles.brandSub} numberOfLines={1}>
              {connectionSubtitle}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            onPress={() => setActiveTab('SECURITY')}
            activeOpacity={0.75}
            style={[
              styles.armedStatusBadge,
              { backgroundColor: modeMeta.bg, borderColor: modeMeta.border },
            ]}
          >
            <View style={[styles.armedStatusDot, { backgroundColor: modeMeta.color }]} />
            <Text style={[styles.armedStatusText, { color: modeMeta.color }]}>
              {modeMeta.label}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleGlobalPanic}
            activeOpacity={0.8}
            style={[styles.sosButton, globalPanicActive && styles.sosButtonActive]}
          >
            <MaterialCommunityIcons
              name="alarm-light-outline"
              size={15}
              color={globalPanicActive ? '#FFFFFF' : COLORS.dangerRed}
            />
            <Text
              style={[
                styles.sosButtonText,
                globalPanicActive && { color: '#FFFFFF' },
              ]}
            >
              {globalPanicActive ? 'PARAR' : 'SOS'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FLOATING TOAST FEEDBACK */}
      {lastToastMessage && (
        <View style={styles.toastWrapper} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={clearToast}
            style={styles.toastBanner}
          >
            <View style={styles.toastIconWrap}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.brandPrimary} />
            </View>
            <Text style={styles.toastText} numberOfLines={2}>
              {lastToastMessage}
            </Text>
            <Ionicons name="close" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN SCREEN CONTENT */}
      <View style={styles.mainContent}>
        {activeTab === 'MONITOR' && (
          <MonitorScreen onOpenIntelbrasSetup={() => setActiveTab('SETTINGS')} />
        )}
        {activeTab === 'EVENTS' && <EventsScreen />}
        {activeTab === 'SECURITY' && <SecurityHubScreen />}
        {activeTab === 'SETTINGS' && <SettingsScreen />}
      </View>

      {/* FULL SCREEN CAMERA MODAL */}
      <FullScreenCameraModal />

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('MONITOR')}
          style={[styles.tabItem, activeTab === 'MONITOR' && styles.tabItemActive]}
          activeOpacity={0.75}
        >
          <Ionicons
            name={activeTab === 'MONITOR' ? 'videocam' : 'videocam-outline'}
            size={21}
            color={activeTab === 'MONITOR' ? COLORS.brandPrimary : COLORS.textSecondary}
          />
          <Text
            style={[styles.tabLabel, activeTab === 'MONITOR' && styles.tabLabelActive]}
          >
            Ao Vivo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('EVENTS')}
          style={[styles.tabItem, activeTab === 'EVENTS' && styles.tabItemActive]}
          activeOpacity={0.75}
        >
          <View style={styles.tabIconWrap}>
            <Ionicons
              name={activeTab === 'EVENTS' ? 'notifications' : 'notifications-outline'}
              size={21}
              color={activeTab === 'EVENTS' ? COLORS.brandPrimary : COLORS.textSecondary}
            />
            {unreadEventsCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {unreadEventsCount > 9 ? '9+' : unreadEventsCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.tabLabel, activeTab === 'EVENTS' && styles.tabLabelActive]}
          >
            Eventos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('SECURITY')}
          style={[styles.tabItem, activeTab === 'SECURITY' && styles.tabItemActive]}
          activeOpacity={0.75}
        >
          <Ionicons
            name={activeTab === 'SECURITY' ? 'shield-checkmark' : 'shield-checkmark-outline'}
            size={21}
            color={activeTab === 'SECURITY' ? COLORS.brandPrimary : COLORS.textSecondary}
          />
          <Text
            style={[styles.tabLabel, activeTab === 'SECURITY' && styles.tabLabelActive]}
          >
            Segurança
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('SETTINGS')}
          style={[styles.tabItem, activeTab === 'SETTINGS' && styles.tabItemActive]}
          activeOpacity={0.75}
        >
          <View style={styles.tabIconWrap}>
            <Ionicons
              name={activeTab === 'SETTINGS' ? 'settings' : 'settings-outline'}
              size={21}
              color={activeTab === 'SETTINGS' ? COLORS.brandPrimary : COLORS.textSecondary}
            />
            {!intelbrasConfig.isConfiguredByUser && <View style={styles.setupDot} />}
          </View>
          <Text
            style={[styles.tabLabel, activeTab === 'SETTINGS' && styles.tabLabelActive]}
          >
            Intelbras
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SecurityProvider>
      <MainShell />
    </SecurityProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: SPACING.sm,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandPill: {
    backgroundColor: COLORS.brandPrimarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  brandPillText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  brandSub: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  armedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  armedStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  armedStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  sosButtonActive: {
    backgroundColor: COLORS.dangerRed,
    borderColor: COLORS.dangerRed,
  },
  sosButtonText: {
    color: COLORS.dangerRed,
    fontSize: 11,
    fontWeight: '800',
  },
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 104 : 68,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 40,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgSurface,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    ...SHADOWS.floating,
  },
  toastIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.brandPrimarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  mainContent: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 6 : 10,
    paddingHorizontal: SPACING.sm,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    minWidth: 70,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: COLORS.brandPrimarySoft,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.dangerRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.bgSurface,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  setupDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warningAmber,
    borderWidth: 1.5,
    borderColor: COLORS.bgSurface,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.brandPrimaryDark,
    fontWeight: '700',
  },
});
