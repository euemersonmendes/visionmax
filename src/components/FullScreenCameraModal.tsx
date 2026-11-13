import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecurity } from '../context/SecurityContext';
import { CameraFeedView } from './CameraFeedView';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../theme/tokens';

const ZOOM_STEPS = [1.0, 1.5, 2.0, 3.0, 4.0];

export const FullScreenCameraModal: React.FC = () => {
  const {
    cameras,
    cvSettings,
    fullScreenCameraId,
    openFullScreenCamera,
    closeFullScreenCamera,
    moveCameraPTZ,
    setCameraZoom,
    applyPTZPreset,
    resetCameraPTZ,
    toggleCameraMute,
    setCameraTalkback,
    toggleCameraSpotlight,
    toggleCameraSiren,
    toggleCameraRecording,
    toggleCameraAiBoxes,
    updateCvSettings,
    cycleNightVision,
    takeSnapshot,
  } = useSecurity();

  const [audioBars, setAudioBars] = useState<number[]>([
    25, 40, 30, 65, 50, 80, 45, 35, 60, 40, 30, 20,
  ]);

  const activeCamera = cameras.find((c) => c.id === fullScreenCameraId);

  useEffect(() => {
    if (!activeCamera) return;
    if (!activeCamera.talkbackActive && activeCamera.audioMuted) return;

    const timer = setInterval(() => {
      setAudioBars(
        Array.from({ length: 12 }, () =>
          activeCamera.talkbackActive
            ? Math.floor(Math.random() * 75) + 25
            : Math.floor(Math.random() * 35) + 10
        )
      );
    }, 180);

    return () => clearInterval(timer);
  }, [activeCamera]);

  if (!activeCamera) return null;

  const nightVisionLabel =
    activeCamera.nightVision === 'AUTO'
      ? 'Auto'
      : activeCamera.nightVision === 'IR_ON'
      ? 'IR P&B'
      : activeCamera.nightVision === 'COLOR_NIGHT'
      ? 'Colorida'
      : 'Desligada';

  return (
    <Modal
      visible={Boolean(fullScreenCameraId)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeFullScreenCamera}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* TOP HEADER & CHANNEL SWITCHER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={closeFullScreenCamera}
            style={styles.backButton}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-down" size={20} color={COLORS.textPrimary} />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cameraSelectorTabs}
          >
            {cameras.map((cam) => {
              const isSelected = cam.id === activeCamera.id;
              return (
                <TouchableOpacity
                  key={cam.id}
                  onPress={() => openFullScreenCamera(cam.id)}
                  style={[styles.camTab, isSelected && styles.camTabSelected]}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.camTabDot,
                      {
                        backgroundColor: cam.sirenActive
                          ? COLORS.dangerRed
                          : cam.personDetected
                          ? COLORS.warningAmber
                          : COLORS.successGreen,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.camTabText,
                      isSelected && styles.camTabTextSelected,
                    ]}
                  >
                    CH 0{cam.channel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO VIDEO VIEWPORT */}
          <View style={styles.videoCard}>
            <CameraFeedView camera={activeCamera} isFullScreen />
            <View style={styles.videoMetaBar}>
              <View style={styles.videoTitleCol}>
                <Text style={styles.videoCamName}>{activeCamera.name}</Text>
                <Text style={styles.videoCamModel}>{activeCamera.model}</Text>
              </View>
              <View style={styles.telemetryChips}>
                <View style={styles.teleChip}>
                  <Text style={styles.teleChipText}>{activeCamera.fps} FPS</Text>
                </View>
                <View style={styles.teleChip}>
                  <Text style={styles.teleChipText}>
                    {(activeCamera.bitrateKbps / 1000).toFixed(1)} Mbps
                  </Text>
                </View>
                <View style={styles.teleChip}>
                  <Text style={styles.teleChipText}>
                    {activeCamera.telemetry.latencyMs} ms
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ZOOM & NIGHT VISION */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Zoom Digital & Visão Noturna</Text>
              <Text style={styles.cardBadge}>{activeCamera.ptz.zoom.toFixed(1)}×</Text>
            </View>
            <View style={styles.zoomTrack}>
              {ZOOM_STEPS.map((z) => {
                const active = Math.abs(activeCamera.ptz.zoom - z) < 0.15;
                return (
                  <TouchableOpacity
                    key={z}
                    onPress={() => setCameraZoom(activeCamera.id, z)}
                    style={[styles.zoomStepBtn, active && styles.zoomStepBtnActive]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.zoomStepText,
                        active && styles.zoomStepTextActive,
                      ]}
                    >
                      {z.toFixed(1)}×
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* PTZ D-PAD & PRESETS */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Controle PTZ & Presets</Text>
              <Text style={styles.cardSubInfo}>
                Pan {activeCamera.ptz.pan}° • Tilt {activeCamera.ptz.tilt}°
              </Text>
            </View>

            <View style={styles.ptzContainer}>
              <View style={styles.dpadGrid}>
                <View style={styles.dpadRow}>
                  <View style={styles.dpadSpacer} />
                  <TouchableOpacity
                    onPress={() => moveCameraPTZ(activeCamera.id, 0, 12)}
                    style={styles.dpadBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-up" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <View style={styles.dpadSpacer} />
                </View>

                <View style={styles.dpadRow}>
                  <TouchableOpacity
                    onPress={() => moveCameraPTZ(activeCamera.id, -15, 0)}
                    style={styles.dpadBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => resetCameraPTZ(activeCamera.id)}
                    style={[styles.dpadBtn, styles.dpadHomeBtn]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="home-outline" size={18} color={COLORS.brandPrimaryDark} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveCameraPTZ(activeCamera.id, 15, 0)}
                    style={styles.dpadBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dpadRow}>
                  <View style={styles.dpadSpacer} />
                  <TouchableOpacity
                    onPress={() => moveCameraPTZ(activeCamera.id, 0, -12)}
                    style={styles.dpadBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-down" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <View style={styles.dpadSpacer} />
                </View>
              </View>

              <View style={styles.presetsColumn}>
                <Text style={styles.presetsLabel}>Pontos Memorizados</Text>
                {activeCamera.presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => applyPTZPreset(activeCamera.id, preset.id)}
                    style={styles.presetChip}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="locate-outline" size={14} color={COLORS.brandPrimary} />
                    <Text style={styles.presetChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* TWO-WAY AUDIO */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Áudio Bidirecional (Interfone)</Text>
              <View style={styles.audioBarsRow}>
                {audioBars.map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.audioBar,
                      {
                        height: activeCamera.talkbackActive || !activeCamera.audioMuted ? h * 0.25 : 4,
                        backgroundColor: activeCamera.talkbackActive
                          ? COLORS.brandPrimary
                          : !activeCamera.audioMuted
                          ? COLORS.brandSecondary
                          : COLORS.borderStrong,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.audioActionsRow}>
              <TouchableOpacity
                onPress={() => toggleCameraMute(activeCamera.id)}
                style={[
                  styles.audioBtn,
                  !activeCamera.audioMuted && styles.audioBtnActive,
                ]}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={activeCamera.audioMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                  size={18}
                  color={!activeCamera.audioMuted ? COLORS.brandPrimaryDark : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.audioBtnText,
                    !activeCamera.audioMuted && styles.audioBtnTextActive,
                  ]}
                >
                  {activeCamera.audioMuted ? 'Ouvir Ambiente' : 'Áudio Ativo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setCameraTalkback(activeCamera.id, !activeCamera.talkbackActive)
                }
                style={[
                  styles.audioBtn,
                  styles.pttBtn,
                  activeCamera.talkbackActive && styles.pttBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={activeCamera.talkbackActive ? 'mic' : 'mic-outline'}
                  size={18}
                  color={activeCamera.talkbackActive ? '#FFFFFF' : COLORS.brandPrimaryDark}
                />
                <Text
                  style={[
                    styles.pttBtnText,
                    activeCamera.talkbackActive && { color: '#FFFFFF' },
                  ]}
                >
                  {activeCamera.talkbackActive ? 'Falando...' : 'Falar (PTT)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TACTICAL QUICK ACTIONS */}
          <View style={styles.sectionCard}>
            <Text style={[styles.cardTitle, { marginBottom: SPACING.md }]}>
              Ações da Câmera
            </Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                onPress={() => takeSnapshot(activeCamera.id)}
                style={styles.actionTile}
                activeOpacity={0.75}
              >
                <Ionicons name="camera-outline" size={20} color={COLORS.textPrimary} />
                <Text style={styles.actionTileLabel}>Foto HD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleCameraRecording(activeCamera.id)}
                style={[
                  styles.actionTile,
                  activeCamera.isRecording && styles.actionTileDangerSoft,
                ]}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="radio-button-on"
                  size={20}
                  color={activeCamera.isRecording ? COLORS.dangerRed : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.actionTileLabel,
                    activeCamera.isRecording && { color: COLORS.dangerRed },
                  ]}
                >
                  {activeCamera.isRecording ? 'Gravando' : 'Gravar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleCameraSpotlight(activeCamera.id)}
                style={[
                  styles.actionTile,
                  activeCamera.spotlightOn && styles.actionTileAmberSoft,
                ]}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={activeCamera.spotlightOn ? 'flashlight' : 'flashlight-outline'}
                  size={20}
                  color={activeCamera.spotlightOn ? COLORS.warningAmber : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.actionTileLabel,
                    activeCamera.spotlightOn && { color: COLORS.warningAmber },
                  ]}
                >
                  Holofote
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => cycleNightVision(activeCamera.id)}
                style={styles.actionTile}
                activeOpacity={0.75}
              >
                <Ionicons name="moon-outline" size={20} color={COLORS.brandSecondary} />
                <Text style={styles.actionTileLabel}>Visão: {nightVisionLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleCameraAiBoxes(activeCamera.id)}
                style={[
                  styles.actionTile,
                  activeCamera.aiBoundingBoxesVisible && styles.actionTileBrandSoft,
                ]}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="vector-square"
                  size={20}
                  color={
                    activeCamera.aiBoundingBoxesVisible
                      ? COLORS.brandPrimaryDark
                      : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.actionTileLabel,
                    activeCamera.aiBoundingBoxesVisible && {
                      color: COLORS.brandPrimaryDark,
                    },
                  ]}
                >
                  Detecção IA
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleCameraSiren(activeCamera.id)}
                style={[
                  styles.actionTile,
                  activeCamera.sirenActive && styles.actionTileDangerSolid,
                ]}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="alarm-light-outline"
                  size={20}
                  color={activeCamera.sirenActive ? '#FFFFFF' : COLORS.dangerRed}
                />
                <Text
                  style={[
                    styles.actionTileLabel,
                    { color: activeCamera.sirenActive ? '#FFFFFF' : COLORS.dangerRed },
                  ]}
                >
                  {activeCamera.sirenActive ? 'Parar Sirene' : 'Sirene'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* COMPUTER VISION & EDGE ANALYTICS PANEL */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Visão Computacional (Analytics IA)</Text>
              <Text style={styles.cardBadge}>
                Confiança ≥ {cvSettings.confidenceThreshold}%
              </Text>
            </View>

            <View style={styles.cvChipsRow}>
              {[
                {
                  label: 'Pessoas',
                  active: cvSettings.detectPersons,
                  onPress: () => updateCvSettings({ detectPersons: !cvSettings.detectPersons }),
                },
                {
                  label: 'Veículos',
                  active: cvSettings.detectVehicles,
                  onPress: () =>
                    updateCvSettings({ detectVehicles: !cvSettings.detectVehicles }),
                },
                {
                  label: 'Pets',
                  active: cvSettings.detectPets,
                  onPress: () => updateCvSettings({ detectPets: !cvSettings.detectPets }),
                },
                {
                  label: 'Linha Virtual',
                  active: cvSettings.intrusionLineEnabled,
                  onPress: () =>
                    updateCvSettings({
                      intrusionLineEnabled: !cvSettings.intrusionLineEnabled,
                    }),
                },
                {
                  label: 'Máscara Priv.',
                  active: cvSettings.privacyMaskEnabled,
                  onPress: () =>
                    updateCvSettings({
                      privacyMaskEnabled: !cvSettings.privacyMaskEnabled,
                    }),
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  style={[styles.cvChip, item.active && styles.cvChipActive]}
                >
                  <Text
                    style={[
                      styles.cvChipText,
                      item.active && styles.cvChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.zoomTrack}>
              {[60, 75, 85, 95].map((thr) => {
                const active = cvSettings.confidenceThreshold === thr;
                return (
                  <TouchableOpacity
                    key={thr}
                    onPress={() => updateCvSettings({ confidenceThreshold: thr })}
                    style={[styles.zoomStepBtn, active && styles.zoomStepBtnActive]}
                  >
                    <Text
                      style={[
                        styles.zoomStepText,
                        active && styles.zoomStepTextActive,
                      ]}
                    >
                      {thr}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeCamera.activeDetections.length > 0 && (
              <View style={styles.tracksList}>
                {activeCamera.activeDetections.map((det) => (
                  <View key={det.id} style={styles.trackRow}>
                    <Text style={styles.trackId}>
                      {det.trackId || 'TRK'} • {det.label}
                    </Text>
                    <Text style={styles.trackMeta}>
                      {det.confidence}%{det.dwellSec ? ` • ${det.dwellSec}s na zona` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    gap: SPACING.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSubtle,
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  cameraSelectorTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  camTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgSubtle,
  },
  camTabSelected: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderWidth: 1,
    borderColor: COLORS.brandPrimaryBorder,
  },
  camTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  camTabText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  camTabTextSelected: {
    color: COLORS.brandPrimaryDark,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  videoCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  videoMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  videoTitleCol: {
    flex: 1,
    minWidth: 150,
  },
  videoCamName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  videoCamModel: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
  },
  telemetryChips: {
    flexDirection: 'row',
    gap: 6,
  },
  teleChip: {
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  teleChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    ...SHADOWS.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardBadge: {
    color: COLORS.brandPrimaryDark,
    backgroundColor: COLORS.brandPrimarySoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    fontSize: 12,
    fontWeight: '700',
  },
  cardSubInfo: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  zoomTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
    padding: 4,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  zoomStepBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  zoomStepBtnActive: {
    backgroundColor: COLORS.bgSurface,
    ...SHADOWS.card,
  },
  zoomStepText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  zoomStepTextActive: {
    color: COLORS.brandPrimaryDark,
    fontWeight: '800',
  },
  ptzContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  dpadGrid: {
    gap: 6,
  },
  dpadRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dpadSpacer: {
    width: 44,
    height: 44,
  },
  dpadBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  dpadHomeBtn: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimaryBorder,
  },
  presetsColumn: {
    flex: 1,
    gap: 6,
  },
  presetsLabel: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  presetChipText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  audioBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 22,
  },
  audioBar: {
    width: 3,
    borderRadius: 2,
  },
  audioActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  audioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  audioBtnActive: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimaryBorder,
  },
  audioBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  audioBtnTextActive: {
    color: COLORS.brandPrimaryDark,
  },
  pttBtn: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimaryBorder,
  },
  pttBtnActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },
  pttBtnText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionTile: {
    width: '31.5%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  actionTileBrandSoft: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimaryBorder,
  },
  actionTileAmberSoft: {
    backgroundColor: COLORS.amberSoft,
    borderColor: COLORS.amberBorder,
  },
  actionTileDangerSoft: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: COLORS.dangerBorder,
  },
  actionTileDangerSolid: {
    backgroundColor: COLORS.dangerRed,
    borderColor: COLORS.dangerRed,
  },
  actionTileLabel: {
    color: COLORS.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  cvChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  cvChip: {
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cvChipActive: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimaryBorder,
  },
  cvChipText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  cvChipTextActive: {
    color: COLORS.brandPrimaryDark,
    fontWeight: '700',
  },
  tracksList: {
    marginTop: SPACING.md,
    gap: 6,
  },
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCanvas,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  trackId: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  trackMeta: {
    color: COLORS.brandPrimaryDark,
    fontSize: 11.5,
    fontWeight: '600',
  },
});
