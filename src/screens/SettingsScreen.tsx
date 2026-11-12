import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSecurity } from '../context/SecurityContext';
import { CameraFeedView } from '../components/CameraFeedView';
import {
  IntelbrasConnectionMode,
  IntelbrasDeviceLine,
  IntelbrasSystemConfig,
  NightVisionMode,
  StreamProtocol,
  StreamSubtype,
} from '../types/security';
import { buildCameraStreamUrl } from '../utils/cameraUrlBuilder';
import { COLORS } from '../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../theme/tokens';

type SettingsTab = 'SYSTEM' | 'CHANNELS' | 'NETWORK';

const DEVICE_LINES: { id: IntelbrasDeviceLine; label: string; desc: string }[] = [
  { id: 'MHDX_DVR', label: 'MHDX / iMHDX', desc: 'DVR Multi-HD' },
  { id: 'NVD_NVR', label: 'NVD', desc: 'Gravador IP (NVR)' },
  { id: 'VIP_IP_CAM', label: 'Linha VIP', desc: 'Câmera IP PoE' },
  { id: 'MIBO_SMART', label: 'Mibo Smart', desc: 'Wi-Fi / Residencial' },
];

const CONNECTION_MODES: {
  id: IntelbrasConnectionMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'LOCAL_IP', label: 'IP Local', icon: 'wifi-outline' },
  { id: 'CLOUD_P2P', label: 'Cloud P2P', icon: 'cloud-outline' },
  { id: 'DDNS', label: 'DDNS', icon: 'globe-outline' },
  { id: 'HLS_GATEWAY', label: 'Gateway HLS', icon: 'swap-horizontal-outline' },
];

const PROTOCOLS: { id: StreamProtocol; label: string }[] = [
  { id: 'RTSP', label: 'RTSP :554' },
  { id: 'INTELBRAS_CLOUD', label: 'Cloud P2P' },
  { id: 'MJPEG', label: 'MJPEG HTTP' },
  { id: 'HLS', label: 'HLS (.m3u8)' },
  { id: 'SIMULATED', label: 'Demo Simulado' },
];

export const SettingsScreen: React.FC = () => {
  const {
    intelbrasConfig,
    cameras,
    discoveredDevices,
    isScanningNetwork,
    applyIntelbrasSystemConfig,
    resetToDemoMode,
    updateCameraConfig,
    scanLocalNetworkCameras,
    testCameraStreamConnection,
  } = useSecurity();

  const [activeTab, setActiveTab] = useState<SettingsTab>('SYSTEM');

  // Central Intelbras system form state
  const [form, setForm] = useState<IntelbrasSystemConfig>(intelbrasConfig);
  const [showSystemPass, setShowSystemPass] = useState(false);

  // Individual channel form state
  const [selectedCamId, setSelectedCamId] = useState<string>(cameras[0]?.id || 'cam-01');
  const selectedCamera = cameras.find((c) => c.id === selectedCamId) || cameras[0];

  const [camName, setCamName] = useState(selectedCamera.name);
  const [camZone, setCamZone] = useState(selectedCamera.zone);
  const [camDvrChannel, setCamDvrChannel] = useState(selectedCamera.dvrChannel);
  const [camSubtype, setCamSubtype] = useState<StreamSubtype>(selectedCamera.streamSubtype);
  const [camNightVision, setCamNightVision] = useState<NightVisionMode>(
    selectedCamera.nightVision
  );
  const [camProtocol, setCamProtocol] = useState<StreamProtocol>(selectedCamera.protocol);
  const [camIp, setCamIp] = useState(selectedCamera.ipAddress);
  const [camUrl, setCamUrl] = useState(selectedCamera.streamUrl);

  useEffect(() => {
    setForm(intelbrasConfig);
  }, [intelbrasConfig]);

  useEffect(() => {
    setCamName(selectedCamera.name);
    setCamZone(selectedCamera.zone);
    setCamDvrChannel(selectedCamera.dvrChannel);
    setCamSubtype(selectedCamera.streamSubtype);
    setCamNightVision(selectedCamera.nightVision);
    setCamProtocol(selectedCamera.protocol);
    setCamIp(selectedCamera.ipAddress);
    setCamUrl(selectedCamera.streamUrl);
  }, [selectedCamera]);

  const previewBuilt = buildCameraStreamUrl({
    brand: 'INTELBRAS',
    cloudSerial: form.cloudSerial,
    ipAddress:
      form.connectionMode === 'DDNS'
        ? form.ddnsHost || form.ipAddress
        : form.ipAddress,
    hlsGatewayBaseUrl: form.hlsGatewayUrl,
    servicePort: form.servicePort,
    rtspPort: form.rtspPort,
    httpPort: form.httpPort,
    onvifPort: form.servicePort,
    username: form.username,
    password: form.password,
    dvrChannel: 1,
    streamSubtype: form.defaultSubtype,
    protocol: form.protocol === 'SIMULATED' ? 'RTSP' : form.protocol,
  });

  const handleSaveSystem = () => {
    applyIntelbrasSystemConfig(form);
  };

  const handleRegenerateChannelUrl = () => {
    const built = buildCameraStreamUrl({
      brand: 'INTELBRAS',
      cloudSerial: form.cloudSerial,
      ipAddress: camIp || form.ipAddress,
      hlsGatewayBaseUrl: form.hlsGatewayUrl,
      servicePort: form.servicePort,
      rtspPort: form.rtspPort,
      httpPort: form.httpPort,
      onvifPort: form.servicePort,
      username: form.username,
      password: form.password,
      dvrChannel: camDvrChannel,
      streamSubtype: camSubtype,
      protocol: camProtocol === 'SIMULATED' ? 'RTSP' : camProtocol,
    });
    setCamUrl(built.recommendedUrl);
  };

  const handleSaveChannel = () => {
    updateCameraConfig(selectedCamera.id, {
      name: camName.trim() || selectedCamera.name,
      zone: camZone.trim() || selectedCamera.zone,
      dvrChannel: camDvrChannel,
      streamSubtype: camSubtype,
      nightVision: camNightVision,
      protocol: camProtocol,
      ipAddress: camIp.trim() || selectedCamera.ipAddress,
      streamUrl: camUrl.trim() || selectedCamera.streamUrl,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* SEGMENTED SUB-NAVIGATION */}
      <View style={styles.segmentedTrack}>
        {(
          [
            { id: 'SYSTEM', label: 'Sistema Intelbras' },
            { id: 'CHANNELS', label: 'Canais (1–4)' },
            { id: 'NETWORK', label: 'Rede & Guia' },
          ] as { id: SettingsTab; label: string }[]
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              activeOpacity={0.75}
            >
              <Text
                style={[styles.segmentText, active && styles.segmentTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TAB 1: CENTRAL INTELBRAS SYSTEM CONFIG */}
      {activeTab === 'SYSTEM' && (
        <View style={styles.tabStack}>
          {/* STATUS SUMMARY CARD */}
          <View style={styles.statusBannerCard}>
            <View style={styles.statusBannerLeft}>
              <View
                style={[
                  styles.statusIconWrap,
                  {
                    backgroundColor: intelbrasConfig.isConfiguredByUser
                      ? COLORS.greenSoft
                      : COLORS.amberSoft,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    intelbrasConfig.isConfiguredByUser
                      ? 'check-decagram'
                      : 'tune-variant'
                  }
                  size={20}
                  color={
                    intelbrasConfig.isConfiguredByUser
                      ? COLORS.successGreen
                      : COLORS.warningAmber
                  }
                />
              </View>
              <View style={styles.statusTextCol}>
                <Text style={styles.statusTitle}>
                  {intelbrasConfig.isConfiguredByUser
                    ? `${intelbrasConfig.systemName} • Conectado`
                    : 'Sistema em Modo Demonstração'}
                </Text>
                <Text style={styles.statusSub}>
                  {intelbrasConfig.isConfiguredByUser
                    ? `Protocolo ${intelbrasConfig.protocol} • Última aplicação ${
                        intelbrasConfig.lastTestedAt || 'agora'
                      }`
                    : 'Preencha os dados do seu DVR/NVR Intelbras abaixo para personalizar.'}
                </Text>
              </View>
            </View>
          </View>

          {/* 1. IDENTIFICAÇÃO & LINHA */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Identificação do Sistema</Text>

            <Text style={styles.fieldLabel}>Nome do Local / Projeto</Text>
            <TextInput
              value={form.systemName}
              onChangeText={(v) => setForm((p) => ({ ...p, systemName: v }))}
              placeholder="Ex: Minha Residência, Escritório..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
            />

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>
              Equipamento Intelbras
            </Text>
            <View style={styles.gridTwoCol}>
              {DEVICE_LINES.map((line) => {
                const active = form.deviceLine === line.id;
                return (
                  <TouchableOpacity
                    key={line.id}
                    onPress={() => setForm((p) => ({ ...p, deviceLine: line.id }))}
                    style={[styles.choiceCard, active && styles.choiceCardActive]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.choiceTitle,
                        active && styles.choiceTitleActive,
                      ]}
                    >
                      {line.label}
                    </Text>
                    <Text style={styles.choiceSub}>{line.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. MODO DE CONEXÃO & ENDEREÇO */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Endereço & Modo de Acesso</Text>

            <View style={styles.pillGrid}>
              {CONNECTION_MODES.map((mode) => {
                const active = form.connectionMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => {
                      const nextProto: StreamProtocol =
                        mode.id === 'CLOUD_P2P'
                          ? 'INTELBRAS_CLOUD'
                          : mode.id === 'HLS_GATEWAY'
                          ? 'HLS'
                          : form.protocol === 'SIMULATED'
                          ? 'RTSP'
                          : form.protocol;
                      setForm((p) => ({
                        ...p,
                        connectionMode: mode.id,
                        protocol: nextProto,
                      }));
                    }}
                    style={[styles.modePill, active && styles.modePillActive]}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={mode.icon}
                      size={15}
                      color={active ? COLORS.brandPrimaryDark : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.modePillText,
                        active && styles.modePillTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {form.connectionMode === 'CLOUD_P2P' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Serial / NS Intelbras Cloud</Text>
                <TextInput
                  value={form.cloudSerial}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, cloudSerial: v.toUpperCase() }))
                  }
                  autoCapitalize="characters"
                  placeholder="Ex: PE1234567890A (etiqueta do DVR)"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
              </View>
            )}

            {(form.connectionMode === 'LOCAL_IP' ||
              form.connectionMode === 'HLS_GATEWAY') && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>IP do DVR / NVR na Rede Local</Text>
                <TextInput
                  value={form.ipAddress}
                  onChangeText={(v) => setForm((p) => ({ ...p, ipAddress: v }))}
                  keyboardType="numbers-and-punctuation"
                  placeholder="Ex: 192.168.1.108"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
              </View>
            )}

            {form.connectionMode === 'DDNS' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Endereço Intelbras DDNS</Text>
                <TextInput
                  value={form.ddnsHost}
                  onChangeText={(v) => setForm((p) => ({ ...p, ddnsHost: v }))}
                  autoCapitalize="none"
                  placeholder="Ex: minhacasa.ddns-intelbras.com.br"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
              </View>
            )}

            {form.connectionMode === 'HLS_GATEWAY' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  URL do Gateway HLS (MediaMTX / go2rtc)
                </Text>
                <TextInput
                  value={form.hlsGatewayUrl}
                  onChangeText={(v) => setForm((p) => ({ ...p, hlsGatewayUrl: v }))}
                  autoCapitalize="none"
                  placeholder="Ex: http://192.168.1.50:8888"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
              </View>
            )}

            {/* PORTAS */}
            <View style={styles.portsRow}>
              <View style={styles.portCol}>
                <Text style={styles.fieldLabel}>Porta Serviço</Text>
                <TextInput
                  value={String(form.servicePort)}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, servicePort: Number(v) || 37777 }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.portCol}>
                <Text style={styles.fieldLabel}>Porta RTSP</Text>
                <TextInput
                  value={String(form.rtspPort)}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, rtspPort: Number(v) || 554 }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={styles.portCol}>
                <Text style={styles.fieldLabel}>Porta HTTP</Text>
                <TextInput
                  value={String(form.httpPort)}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, httpPort: Number(v) || 80 }))
                  }
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          {/* 3. CREDENCIAIS & STREAM */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Credenciais & Qualidade</Text>

            <View style={styles.twoColInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Usuário</Text>
                <TextInput
                  value={form.username}
                  onChangeText={(v) => setForm((p) => ({ ...p, username: v }))}
                  autoCapitalize="none"
                  placeholder="admin"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Senha do DVR</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={form.password}
                    onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                    secureTextEntry={!showSystemPass}
                    autoCapitalize="none"
                    placeholder="Sua senha"
                    placeholderTextColor={COLORS.textMuted}
                    style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowSystemPass((s) => !s)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showSystemPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>
              Perfil de Stream
            </Text>
            <View style={styles.subtypeRow}>
              <TouchableOpacity
                onPress={() => setForm((p) => ({ ...p, defaultSubtype: 'MAIN_HD' }))}
                style={[
                  styles.subtypeBtn,
                  form.defaultSubtype === 'MAIN_HD' && styles.subtypeBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.subtypeText,
                    form.defaultSubtype === 'MAIN_HD' && styles.subtypeTextActive,
                  ]}
                >
                  Principal (HD/4K • subtype=0)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setForm((p) => ({ ...p, defaultSubtype: 'SUB_SD' }))}
                style={[
                  styles.subtypeBtn,
                  form.defaultSubtype === 'SUB_SD' && styles.subtypeBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.subtypeText,
                    form.defaultSubtype === 'SUB_SD' && styles.subtypeTextActive,
                  ]}
                >
                  Extra (Leve • subtype=1)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>
              Protocolo de Transmissão
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.protoScroll}
            >
              {PROTOCOLS.map((proto) => {
                const active = form.protocol === proto.id;
                return (
                  <TouchableOpacity
                    key={proto.id}
                    onPress={() => setForm((p) => ({ ...p, protocol: proto.id }))}
                    style={[styles.protoChip, active && styles.protoChipActive]}
                  >
                    <Text
                      style={[
                        styles.protoChipText,
                        active && styles.protoChipTextActive,
                      ]}
                    >
                      {proto.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* GENERATED URL PREVIEW */}
            <View style={styles.urlPreviewBox}>
              <Text style={styles.urlPreviewLabel}>Prévia da URL (Canal 01)</Text>
              <Text style={styles.urlPreviewText} selectable>
                {form.protocol === 'SIMULATED'
                  ? 'Modo Demonstração (Simulação Interativa)'
                  : previewBuilt.recommendedUrl}
              </Text>
            </View>

            {/* SAVE & RESET */}
            <View style={styles.actionsColumn}>
              <TouchableOpacity
                onPress={handleSaveSystem}
                style={styles.primarySaveBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primarySaveBtnText}>
                  Salvar e Aplicar nos 4 Canais
                </Text>
              </TouchableOpacity>

              {intelbrasConfig.isConfiguredByUser && (
                <TouchableOpacity
                  onPress={resetToDemoMode}
                  style={styles.secondaryResetBtn}
                  activeOpacity={0.75}
                >
                  <Text style={styles.secondaryResetBtnText}>
                    Restaurar Modo Demonstração
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* TAB 2: INDIVIDUAL CHANNELS (1-4) */}
      {activeTab === 'CHANNELS' && (
        <View style={styles.tabStack}>
          {/* CHANNEL PICKER */}
          <View style={styles.channelPickerRow}>
            {cameras.map((cam) => {
              const active = cam.id === selectedCamera.id;
              return (
                <TouchableOpacity
                  key={cam.id}
                  onPress={() => setSelectedCamId(cam.id)}
                  style={[styles.channelPill, active && styles.channelPillActive]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.channelPillText,
                      active && styles.channelPillTextActive,
                    ]}
                  >
                    CAM 0{cam.channel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* LIVE COMPACT PREVIEW */}
          <CameraFeedView camera={selectedCamera} compact />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Ajustes da Câmera 0{selectedCamera.channel}
            </Text>

            <Text style={styles.fieldLabel}>Nome de Exibição</Text>
            <TextInput
              value={camName}
              onChangeText={setCamName}
              style={styles.input}
            />

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>
              Zona / Ambiente
            </Text>
            <TextInput
              value={camZone}
              onChangeText={setCamZone}
              style={styles.input}
            />

            <View style={[styles.twoColInputs, { marginTop: SPACING.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Canal no DVR (CH)</Text>
                <TextInput
                  value={String(camDvrChannel)}
                  onChangeText={(v) => setCamDvrChannel(Math.max(1, Number(v) || 1))}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>IP Específico (opcional)</Text>
                <TextInput
                  value={camIp}
                  onChangeText={setCamIp}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>
              Visão Noturna
            </Text>
            <View style={styles.protoScroll}>
              {(
                [
                  { id: 'AUTO', label: 'Auto' },
                  { id: 'IR_ON', label: 'IR P&B' },
                  { id: 'COLOR_NIGHT', label: 'Colorida' },
                  { id: 'OFF', label: 'Desligada' },
                ] as { id: NightVisionMode; label: string }[]
              ).map((nv) => {
                const active = camNightVision === nv.id;
                return (
                  <TouchableOpacity
                    key={nv.id}
                    onPress={() => setCamNightVision(nv.id)}
                    style={[styles.protoChip, active && styles.protoChipActive]}
                  >
                    <Text
                      style={[
                        styles.protoChipText,
                        active && styles.protoChipTextActive,
                      ]}
                    >
                      {nv.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.urlHeaderRow}>
              <Text style={styles.fieldLabel}>URL do Stream</Text>
              <TouchableOpacity onPress={handleRegenerateChannelUrl}>
                <Text style={styles.regenLink}>Gerar padrão Intelbras</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={camUrl}
              onChangeText={setCamUrl}
              autoCapitalize="none"
              style={[styles.input, { fontSize: 12 }]}
            />

            <View style={styles.channelBtnsRow}>
              <TouchableOpacity
                onPress={() => testCameraStreamConnection(selectedCamera.id)}
                style={styles.testBtn}
                activeOpacity={0.75}
              >
                <Ionicons name="pulse-outline" size={16} color={COLORS.brandPrimaryDark} />
                <Text style={styles.testBtnText}>Testar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveChannel}
                style={[styles.primarySaveBtn, { flex: 1 }]}
                activeOpacity={0.85}
              >
                <Text style={styles.primarySaveBtnText}>Salvar Canal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* TAB 3: NETWORK SCANNER & INTELBRAS GUIDE */}
      {activeTab === 'NETWORK' && (
        <View style={styles.tabStack}>
          <View style={styles.card}>
            <View style={styles.scannerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Scanner de Rede Local (LAN)</Text>
                <Text style={styles.choiceSub}>
                  Localize seu DVR MHDX, NVD ou câmera VIP na rede Wi-Fi.
                </Text>
              </View>
              <TouchableOpacity
                onPress={scanLocalNetworkCameras}
                style={styles.scanBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={15} color="#FFFFFF" />
                <Text style={styles.scanBtnText}>
                  {isScanningNetwork ? 'Buscando...' : 'Buscar'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.devicesList}>
              {discoveredDevices.map((dev) => (
                <View key={dev.id} style={styles.deviceItem}>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{dev.modelName}</Text>
                    <Text style={styles.deviceMeta}>
                      IP: {dev.ipAddress} • Porta {dev.servicePort} • {dev.latencyMs}ms
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setForm((p) => ({
                        ...p,
                        ipAddress: dev.ipAddress,
                        cloudSerial: dev.cloudSerial || p.cloudSerial,
                        servicePort: dev.servicePort,
                        rtspPort: dev.rtspPort,
                        httpPort: dev.httpPort,
                      }));
                      setActiveTab('SYSTEM');
                    }}
                    style={styles.useDeviceBtn}
                  >
                    <Text style={styles.useDeviceText}>Usar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Guia Rápido Intelbras</Text>
            <View style={styles.guideItem}>
              <Text style={styles.guideHeading}>1. Formato RTSP Padrão</Text>
              <Text style={styles.guideBody}>
                rtsp://usuario:senha@IP:554/cam/realmonitor?channel=1&subtype=0
              </Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideHeading}>2. Main Stream vs Sub Stream</Text>
              <Text style={styles.guideBody}>
                Use subtype=0 para qualidade máxima (HD/4K) na rede local e subtype=1 para visualização leve fora de casa.
              </Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideHeading}>3. Visualização no Navegador (Web)</Text>
              <Text style={styles.guideBody}>
                Navegadores não reproduzem RTSP diretamente. Para vídeo ao vivo no navegador, aponte um gateway leve (como go2rtc ou MediaMTX) na opção "Gateway HLS".
              </Text>
            </View>
          </View>
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
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSubtle,
    padding: 4,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.bgSurface,
    ...SHADOWS.card,
  },
  segmentText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  tabStack: {
    gap: SPACING.md,
  },
  statusBannerCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    ...SHADOWS.card,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextCol: {
    flex: 1,
  },
  statusTitle: {
    color: COLORS.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  statusSub: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    ...SHADOWS.card,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldGroup: {
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.bgCanvas,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 13.5,
  },
  gridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  choiceCard: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: COLORS.bgCanvas,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  choiceCardActive: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimary,
  },
  choiceTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  choiceTitleActive: {
    color: COLORS.brandPrimaryDark,
  },
  choiceSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modePillActive: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimaryBorder,
  },
  modePillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  modePillTextActive: {
    color: COLORS.brandPrimaryDark,
    fontWeight: '700',
  },
  portsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  portCol: {
    flex: 1,
  },
  twoColInputs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCanvas,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
  },
  eyeBtn: {
    paddingHorizontal: 10,
  },
  subtypeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  subtypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subtypeBtnActive: {
    backgroundColor: COLORS.brandPrimarySoft,
    borderColor: COLORS.brandPrimaryBorder,
  },
  subtypeText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtypeTextActive: {
    color: COLORS.brandPrimaryDark,
    fontWeight: '700',
  },
  protoScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  protoChip: {
    backgroundColor: COLORS.bgSubtle,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  protoChipActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },
  protoChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  protoChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  urlPreviewBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.bgCanvas,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  urlPreviewLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  urlPreviewText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 11.5,
    fontWeight: '600',
  },
  actionsColumn: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  primarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brandPrimary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  primarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryResetBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryResetBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  channelPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  channelPillActive: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },
  channelPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  channelPillTextActive: {
    color: '#FFFFFF',
  },
  urlHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  regenLink: {
    color: COLORS.brandPrimaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  channelBtnsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brandPrimarySoft,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  testBtnText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brandPrimary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  devicesList: {
    gap: SPACING.sm,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCanvas,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  deviceInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  deviceName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  deviceMeta: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
  },
  useDeviceBtn: {
    backgroundColor: COLORS.brandPrimarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  useDeviceText: {
    color: COLORS.brandPrimaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  guideItem: {
    marginBottom: SPACING.md,
  },
  guideHeading: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  guideBody: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
