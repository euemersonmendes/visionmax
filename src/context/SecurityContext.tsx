import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CameraDevice,
  SecurityEvent,
  SecurityMode,
  SmartDeviceSensor,
  LayoutMode,
  StreamProtocol,
  NightVisionMode,
  CameraResolution,
  CameraBrand,
  StreamSubtype,
  DiscoveredNetworkDevice,
  IntelbrasSystemConfig,
} from '../types/security';
import { buildCameraStreamUrl } from '../utils/cameraUrlBuilder';
import { loadStorageItem, saveStorageItem, removeStorageItem } from '../utils/storage';

const STORAGE_CONFIG_KEY = 'visionmax_intelbras_config_v3';
const STORAGE_CAMERAS_KEY = 'visionmax_cameras_v3';

export const DEFAULT_INTELBRAS_CONFIG: IntelbrasSystemConfig = {
  systemName: 'Minha Residência',
  deviceLine: 'MHDX_DVR',
  connectionMode: 'HLS_GATEWAY',
  cloudSerial: '',
  ipAddress: '192.168.3.9',
  ddnsHost: '',
  hlsGatewayUrl: 'http://localhost:8888',
  servicePort: 37777,
  rtspPort: 554,
  httpPort: 80,
  username: 'admin',
  password: 'Dell@1304',
  totalChannels: 4,
  defaultSubtype: 'MAIN_HD',
  protocol: 'HLS',
  isConfiguredByUser: true,
};

export interface UpdateCameraConfigPayload {
  name?: string;
  zone?: string;
  brand?: CameraBrand;
  cloudSerial?: string;
  ipAddress?: string;
  servicePort?: number;
  rtspPort?: number;
  httpPort?: number;
  onvifPort?: number;
  dvrChannel?: number;
  streamSubtype?: StreamSubtype;
  username?: string;
  password?: string;
  protocol?: StreamProtocol;
  streamUrl?: string;
  mjpegUrl?: string;
  resolution?: CameraResolution;
  nightVision?: NightVisionMode;
  aiDetectionEnabled?: boolean;
}

interface SecurityContextType {
  intelbrasConfig: IntelbrasSystemConfig;
  cameras: CameraDevice[];
  events: SecurityEvent[];
  sensors: SmartDeviceSensor[];
  discoveredDevices: DiscoveredNetworkDevice[];
  isScanningNetwork: boolean;
  securityMode: SecurityMode;
  layoutMode: LayoutMode;
  focusedCameraId: string;
  fullScreenCameraId: string | null;
  globalPanicActive: boolean;
  allAudioMuted: boolean;
  snapshotsCount: number;
  lastToastMessage: string | null;
  setSecurityMode: (mode: SecurityMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setFocusedCameraId: (id: string) => void;
  openFullScreenCamera: (id: string) => void;
  closeFullScreenCamera: () => void;
  toggleGlobalPanic: () => void;
  toggleAllAudioMute: () => void;
  toggleCameraMute: (id: string) => void;
  setCameraTalkback: (id: string, active: boolean) => void;
  toggleCameraSpotlight: (id: string) => void;
  toggleCameraSiren: (id: string) => void;
  toggleCameraRecording: (id: string) => void;
  toggleCameraAiBoxes: (id: string) => void;
  cycleNightVision: (id: string) => void;
  moveCameraPTZ: (id: string, deltaPan: number, deltaTilt: number, deltaZoom?: number) => void;
  setCameraZoom: (id: string, zoom: number) => void;
  applyPTZPreset: (cameraId: string, presetId: string) => void;
  resetCameraPTZ: (id: string) => void;
  takeSnapshot: (id: string) => void;
  updateCameraConfig: (id: string, config: UpdateCameraConfigPayload) => void;
  applyIntelbrasSystemConfig: (config: IntelbrasSystemConfig) => void;
  resetToDemoMode: () => void;
  applyGlobalDvrCredentials: (params: {
    brand: CameraBrand;
    cloudSerial: string;
    ipAddress: string;
    servicePort: number;
    rtspPort: number;
    httpPort: number;
    username: string;
    password: string;
    protocol: StreamProtocol;
  }) => void;
  scanLocalNetworkCameras: () => void;
  testCameraStreamConnection: (id: string) => void;
  acknowledgeEvent: (eventId: string) => void;
  acknowledgeAllEvents: () => void;
  toggleSmartSensor: (sensorId: string) => void;
  clearToast: () => void;
}

const INITIAL_CAMERAS: CameraDevice[] = [
  {
    id: 'cam-01',
    channel: 1,
    name: 'Entrada Principal & Portão',
    zone: 'Fachada Frontal • CH 01',
    model: 'Intelbras MHDX (192.168.3.9 • CH1)',
    brand: 'INTELBRAS',
    cloudSerial: '',
    ipAddress: '192.168.3.9',
    servicePort: 37777,
    rtspPort: 554,
    httpPort: 80,
    onvifPort: 37777,
    dvrChannel: 1,
    streamSubtype: 'MAIN_HD',
    username: 'admin',
    password: 'Dell@1304',
    protocol: 'HLS',
    streamUrl: 'http://localhost:8888/cam01/index.m3u8',
    mjpegUrl: 'http://admin:Dell%401304@192.168.3.9:80/cgi-bin/mjpg/video.cgi?channel=1&subtype=1',
    hlsFallbackUrl: 'http://localhost:8888/cam01/index.m3u8',
    status: 'ONLINE',
    resolution: '4K UHD',
    fps: 30,
    bitrateKbps: 6420,
    nightVision: 'AUTO',
    aiDetectionEnabled: true,
    aiBoundingBoxesVisible: true,
    audioMuted: true,
    talkbackActive: false,
    spotlightOn: false,
    sirenActive: false,
    isRecording: true,
    motionDetected: true,
    personDetected: true,
    ptz: { pan: 0, tilt: 0, zoom: 1.0 },
    presets: [
      { id: 'p1-1', label: 'Portão Social', pan: 0, tilt: 0, zoom: 1.0 },
      { id: 'p1-2', label: 'Calçada / Rua', pan: -35, tilt: 15, zoom: 1.8 },
      { id: 'p1-3', label: 'Interfone / Caixa', pan: 40, tilt: -20, zoom: 2.2 },
    ],
    activeDetections: [
      {
        id: 'det-1',
        label: 'Pessoa (Entregador)',
        confidence: 98,
        type: 'PERSON',
        x: 34,
        y: 32,
        width: 18,
        height: 44,
      },
    ],
    telemetry: {
      wifiSignalDbm: -40,
      wifiQualityPercent: 98,
      storageUsedGb: 412,
      tempCelsius: 38.0,
      latencyMs: 16,
      uptimeHours: 742,
    },
    sceneTheme: 'FRONT_GATE',
  },
  {
    id: 'cam-02',
    channel: 2,
    name: 'Garagem & Acesso Veículos',
    zone: 'Garagem Coberta • CH 02',
    model: 'Intelbras MHDX (192.168.3.9 • CH2)',
    brand: 'INTELBRAS',
    cloudSerial: '',
    ipAddress: '192.168.3.9',
    servicePort: 37777,
    rtspPort: 554,
    httpPort: 80,
    onvifPort: 37777,
    dvrChannel: 2,
    streamSubtype: 'MAIN_HD',
    username: 'admin',
    password: 'Dell@1304',
    protocol: 'HLS',
    streamUrl: 'http://localhost:8888/cam02/index.m3u8',
    mjpegUrl: 'http://admin:Dell%401304@192.168.3.9:80/cgi-bin/mjpg/video.cgi?channel=2&subtype=1',
    hlsFallbackUrl: 'http://localhost:8888/cam02/index.m3u8',
    status: 'ONLINE',
    resolution: '4K UHD',
    fps: 30,
    bitrateKbps: 5890,
    nightVision: 'COLOR_NIGHT',
    aiDetectionEnabled: true,
    aiBoundingBoxesVisible: true,
    audioMuted: true,
    talkbackActive: false,
    spotlightOn: true,
    sirenActive: false,
    isRecording: true,
    motionDetected: false,
    personDetected: false,
    ptz: { pan: 0, tilt: 0, zoom: 1.0 },
    presets: [
      { id: 'p2-1', label: 'Visão Geral Vagas', pan: 0, tilt: 0, zoom: 1.0 },
      { id: 'p2-2', label: 'Portão Basculante', pan: 0, tilt: 25, zoom: 1.6 },
      { id: 'p2-3', label: 'Porta Interna', pan: -45, tilt: -15, zoom: 2.0 },
    ],
    activeDetections: [
      {
        id: 'det-2',
        label: 'Veículo Estacionado (SUV)',
        confidence: 99,
        type: 'VEHICLE',
        x: 22,
        y: 38,
        width: 54,
        height: 42,
      },
    ],
    telemetry: {
      wifiSignalDbm: -42,
      wifiQualityPercent: 96,
      storageUsedGb: 389,
      tempCelsius: 36.1,
      latencyMs: 17,
      uptimeHours: 742,
    },
    sceneTheme: 'GARAGE',
  },
  {
    id: 'cam-03',
    channel: 3,
    name: 'Quintal, Gourmet & Piscina',
    zone: 'Área Externa Fundos • CH 03',
    model: 'Intelbras MHDX (192.168.3.9 • CH3)',
    brand: 'INTELBRAS',
    cloudSerial: '',
    ipAddress: '192.168.3.9',
    servicePort: 37777,
    rtspPort: 554,
    httpPort: 80,
    onvifPort: 37777,
    dvrChannel: 3,
    streamSubtype: 'MAIN_HD',
    username: 'admin',
    password: 'Dell@1304',
    protocol: 'HLS',
    streamUrl: 'http://localhost:8888/cam03/index.m3u8',
    mjpegUrl: 'http://admin:Dell%401304@192.168.3.9:80/cgi-bin/mjpg/video.cgi?channel=3&subtype=1',
    hlsFallbackUrl: 'http://localhost:8888/cam03/index.m3u8',
    status: 'ONLINE',
    resolution: '2K QHD',
    fps: 25,
    bitrateKbps: 4320,
    nightVision: 'COLOR_NIGHT',
    aiDetectionEnabled: true,
    aiBoundingBoxesVisible: true,
    audioMuted: true,
    talkbackActive: false,
    spotlightOn: false,
    sirenActive: false,
    isRecording: true,
    motionDetected: true,
    personDetected: false,
    ptz: { pan: 10, tilt: -5, zoom: 1.0 },
    presets: [
      { id: 'p3-1', label: 'Piscina & Deck', pan: 10, tilt: -5, zoom: 1.0 },
      { id: 'p3-2', label: 'Área Gourmet', pan: -50, tilt: 0, zoom: 1.5 },
      { id: 'p3-3', label: 'Muro Perímetro', pan: 45, tilt: 30, zoom: 2.5 },
    ],
    activeDetections: [
      {
        id: 'det-3',
        label: 'Pet / Movimento Leve',
        confidence: 91,
        type: 'PET',
        x: 58,
        y: 56,
        width: 14,
        height: 18,
      },
    ],
    telemetry: {
      wifiSignalDbm: -45,
      wifiQualityPercent: 94,
      storageUsedGb: 295,
      tempCelsius: 37.4,
      latencyMs: 18,
      uptimeHours: 742,
    },
    sceneTheme: 'BACKYARD_POOL',
  },
  {
    id: 'cam-04',
    channel: 4,
    name: 'Corredor Lateral & Serviço',
    zone: 'Perímetro Lateral • CH 04',
    model: 'Intelbras MHDX (192.168.3.9 • CH4)',
    brand: 'INTELBRAS',
    cloudSerial: '',
    ipAddress: '192.168.3.9',
    servicePort: 37777,
    rtspPort: 554,
    httpPort: 80,
    onvifPort: 37777,
    dvrChannel: 4,
    streamSubtype: 'MAIN_HD',
    username: 'admin',
    password: 'Dell@1304',
    protocol: 'HLS',
    streamUrl: 'http://localhost:8888/cam04/index.m3u8',
    mjpegUrl: 'http://admin:Dell%401304@192.168.3.9:80/cgi-bin/mjpg/video.cgi?channel=4&subtype=1',
    hlsFallbackUrl: 'http://localhost:8888/cam04/index.m3u8',
    status: 'ONLINE',
    resolution: '2K QHD',
    fps: 25,
    bitrateKbps: 3980,
    nightVision: 'IR_ON',
    aiDetectionEnabled: true,
    aiBoundingBoxesVisible: true,
    audioMuted: true,
    talkbackActive: false,
    spotlightOn: false,
    sirenActive: false,
    isRecording: true,
    motionDetected: false,
    personDetected: false,
    ptz: { pan: 0, tilt: 0, zoom: 1.0 },
    presets: [
      { id: 'p4-1', label: 'Corredor Inteiro', pan: 0, tilt: 0, zoom: 1.0 },
      { id: 'p4-2', label: 'Portão Lateral', pan: 0, tilt: 20, zoom: 2.0 },
      { id: 'p4-3', label: 'Janela Serviço', pan: -30, tilt: -10, zoom: 1.7 },
    ],
    activeDetections: [],
    telemetry: {
      wifiSignalDbm: -43,
      wifiQualityPercent: 95,
      storageUsedGb: 264,
      tempCelsius: 35.2,
      latencyMs: 16,
      uptimeHours: 742,
    },
    sceneTheme: 'SIDE_CORRIDOR',
  },
];

const INITIAL_DISCOVERED: DiscoveredNetworkDevice[] = [
  {
    id: 'disc-intelbras-1',
    ipAddress: '10.0.2.100',
    macAddress: '3C:EF:8C:5E:20:9M',
    cloudSerial: 'U5EM1601209MZ',
    brand: 'INTELBRAS',
    modelName: 'DVR Intelbras Cloud P2P (U5EM1601209MZ) • Canal 01',
    servicePort: 37777,
    rtspPort: 554,
    httpPort: 80,
    onvifPort: 37777,
    protocol: 'INTELBRAS_CLOUD',
    latencyMs: 15,
  },
  {
    id: 'disc-intelbras-2',
    ipAddress: '10.0.2.100',
    macAddress: '3C:EF:8C:5E:20:9M',
    cloudSerial: 'U5EM1601209MZ',
    brand: 'INTELBRAS',
    modelName: 'DVR Intelbras Cloud P2P (U5EM1601209MZ) • Canal 02',
    servicePort: 37777,
    rtspPort: 554,
    httpPort: 80,
    onvifPort: 37777,
    protocol: 'INTELBRAS_CLOUD',
    latencyMs: 16,
  },
  {
    id: 'disc-intelbras-3',
    ipAddress: '10.0.2.100',
    macAddress: '3C:EF:8C:5E:20:9M',
    cloudSerial: 'U5EM1601209MZ',
    brand: 'INTELBRAS',
    modelName: 'DVR Intelbras Cloud P2P (U5EM1601209MZ) • Canal 03',
    servicePort: 37777,
    rtspPort: 554,
    httpPort: 80,
    onvifPort: 37777,
    protocol: 'INTELBRAS_CLOUD',
    latencyMs: 16,
  },
  {
    id: 'disc-intelbras-4',
    ipAddress: '10.0.2.100',
    macAddress: '3C:EF:8C:5E:20:9M',
    cloudSerial: 'U5EM1601209MZ',
    brand: 'INTELBRAS',
    modelName: 'DVR Intelbras Cloud P2P (U5EM1601209MZ) • Canal 04',
    servicePort: 37777,
    rtspPort: 554,
    httpPort: 80,
    onvifPort: 37777,
    protocol: 'INTELBRAS_CLOUD',
    latencyMs: 17,
  },
];

const INITIAL_EVENTS: SecurityEvent[] = [
  {
    id: 'evt-100',
    cameraId: 'cam-01',
    cameraName: 'CAM 01 • Intelbras U5EM1601209MZ',
    channel: 1,
    type: 'SYSTEM',
    severity: 'INFO',
    title: 'Intelbras Cloud P2P Conectado (U5EM1601209MZ)',
    description: 'Autenticado como admin na porta 37777 • 4 Canais sincronizados com sucesso.',
    timestamp: 'Agora mesmo',
    timeAgo: 'online',
    durationSec: 10,
    confidence: 100,
    acknowledged: false,
    sceneTheme: 'FRONT_GATE',
  },
  {
    id: 'evt-101',
    cameraId: 'cam-01',
    cameraName: 'CAM 01 • Entrada Principal',
    channel: 1,
    type: 'PERSON',
    severity: 'WARNING',
    title: 'Pessoa Detectada no Portão Social',
    description: 'IA Vision identificou uma pessoa parada próxima ao interfone por 14 segundos.',
    timestamp: 'Hoje, 19:08:42',
    timeAgo: 'há 2 min',
    durationSec: 18,
    confidence: 98,
    acknowledged: false,
    sceneTheme: 'FRONT_GATE',
  },
  {
    id: 'evt-102',
    cameraId: 'cam-03',
    cameraName: 'CAM 03 • Quintal & Piscina',
    channel: 3,
    type: 'MOTION',
    severity: 'INFO',
    title: 'Movimento no Deck da Piscina',
    description: 'Classificado como Pet / Movimento seguro pela análise neural (91% confiança).',
    timestamp: 'Hoje, 18:54:10',
    timeAgo: 'há 16 min',
    durationSec: 12,
    confidence: 91,
    acknowledged: false,
    sceneTheme: 'BACKYARD_POOL',
  },
  {
    id: 'evt-103',
    cameraId: 'cam-02',
    cameraName: 'CAM 02 • Garagem Coberta',
    channel: 2,
    type: 'VEHICLE',
    severity: 'INFO',
    title: 'Veículo Residencial Estacionado',
    description: 'Entrada autorizada registrada via tag veicular. Portão fechado automaticamente.',
    timestamp: 'Hoje, 18:20:05',
    timeAgo: 'há 50 min',
    durationSec: 34,
    confidence: 99,
    acknowledged: true,
    sceneTheme: 'GARAGE',
  },
];

const INITIAL_SENSORS: SmartDeviceSensor[] = [
  {
    id: 'sens-1',
    name: 'Fechadura Biométrica Social',
    zone: 'Fachada Frontal (CAM 01)',
    linkedCameraId: 'cam-01',
    type: 'LOCK',
    state: 'LOCKED',
    batteryPercent: 92,
    lastUpdated: 'Trancada às 18:22',
  },
  {
    id: 'sens-2',
    name: 'Portão Basculante Motorizado',
    zone: 'Garagem Coberta (CAM 02)',
    linkedCameraId: 'cam-02',
    type: 'GARAGE_DOOR',
    state: 'CLOSED',
    batteryPercent: 100,
    lastUpdated: 'Fechado às 18:21',
  },
  {
    id: 'sens-3',
    name: 'Barreira IVA Infravermelho Muro',
    zone: 'Quintal & Piscina (CAM 03)',
    linkedCameraId: 'cam-03',
    type: 'PERIMETER_IR',
    state: 'ARMED',
    batteryPercent: 98,
    lastUpdated: 'Feixe duplo ativo',
  },
  {
    id: 'sens-4',
    name: 'Sensor Magnético Portão Lateral',
    zone: 'Corredor Lateral (CAM 04)',
    linkedCameraId: 'cam-04',
    type: 'WINDOW_SENSOR',
    state: 'CLOSED',
    batteryPercent: 87,
    lastUpdated: 'Integridade OK',
  },
];

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [intelbrasConfig, setIntelbrasConfig] = useState<IntelbrasSystemConfig>(() => {
    const raw = loadStorageItem(STORAGE_CONFIG_KEY);
    if (raw) {
      try {
        return { ...DEFAULT_INTELBRAS_CONFIG, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_INTELBRAS_CONFIG;
      }
    }
    return DEFAULT_INTELBRAS_CONFIG;
  });

  const [cameras, setCameras] = useState<CameraDevice[]>(() => {
    const raw = loadStorageItem(STORAGE_CAMERAS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback to initial cameras
      }
    }
    return INITIAL_CAMERAS;
  });
  const [events, setEvents] = useState<SecurityEvent[]>(INITIAL_EVENTS);
  const [sensors, setSensors] = useState<SmartDeviceSensor[]>(INITIAL_SENSORS);
  const [discoveredDevices, setDiscoveredDevices] =
    useState<DiscoveredNetworkDevice[]>(INITIAL_DISCOVERED);
  const [isScanningNetwork, setIsScanningNetwork] = useState<boolean>(false);
  const [securityMode, setSecurityModeState] = useState<SecurityMode>('HOME');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('QUAD_2X2');
  const [focusedCameraId, setFocusedCameraId] = useState<string>('cam-01');
  const [fullScreenCameraId, setFullScreenCameraId] = useState<string | null>(null);
  const [globalPanicActive, setGlobalPanicActive] = useState<boolean>(false);
  const [allAudioMuted, setAllAudioMuted] = useState<boolean>(true);
  const [snapshotsCount, setSnapshotsCount] = useState<number>(14);
  const [lastToastMessage, setLastToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setLastToastMessage(msg);
  }, []);

  const clearToast = useCallback(() => {
    setLastToastMessage(null);
  }, []);

  useEffect(() => {
    if (!lastToastMessage) return;
    const timer = setTimeout(() => {
      setLastToastMessage(null);
    }, 4200);
    return () => clearTimeout(timer);
  }, [lastToastMessage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCameras((prev) =>
        prev.map((cam, idx) => {
          const jitter = Math.floor(Math.random() * 240) - 120;
          const nextBitrate = Math.max(2800, Math.min(8200, cam.bitrateKbps + jitter));
          const nextLatency = Math.max(
            12,
            Math.min(48, cam.telemetry.latencyMs + (Math.random() > 0.5 ? 1 : -1))
          );

          const updatedDetections = cam.activeDetections.map((det) => {
            if (det.type === 'VEHICLE') return det;
            const dx = Math.sin(Date.now() / 1400 + idx) * 1.4;
            const dy = Math.cos(Date.now() / 1800 + idx) * 0.7;
            const nextX = Math.max(12, Math.min(68, det.x + dx));
            const nextY = Math.max(18, Math.min(62, det.y + dy));
            return {
              ...det,
              x: Number(nextX.toFixed(1)),
              y: Number(nextY.toFixed(1)),
            };
          });

          return {
            ...cam,
            bitrateKbps: nextBitrate,
            activeDetections: updatedDetections,
            telemetry: {
              ...cam.telemetry,
              latencyMs: nextLatency,
            },
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const addNewSystemEvent = useCallback(
    (
      cameraId: string,
      type: SecurityEvent['type'],
      severity: SecurityEvent['severity'],
      title: string,
      description: string
    ) => {
      const targetCam = cameras.find((c) => c.id === cameraId) || cameras[0];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newEvt: SecurityEvent = {
        id: `evt-${Date.now()}`,
        cameraId: targetCam.id,
        cameraName: `CAM 0${targetCam.channel} • ${targetCam.name.split('&')[0].trim()}`,
        channel: targetCam.channel,
        type,
        severity,
        title,
        description,
        timestamp: `Hoje, ${timeStr}`,
        timeAgo: 'agora mesmo',
        durationSec: 10,
        confidence: 99,
        acknowledged: false,
        sceneTheme: targetCam.sceneTheme,
      };
      setEvents((prev) => [newEvt, ...prev]);
    },
    [cameras]
  );

  const setSecurityMode = useCallback(
    (mode: SecurityMode) => {
      setSecurityModeState(mode);
      const modeNames: Record<SecurityMode, string> = {
        DISARMED: 'Desarmado',
        HOME: 'Em Casa (Perímetro Ativo)',
        AWAY: 'Ausente (Proteção Total 4 Câmeras)',
        NIGHT: 'Modo Noturno (IR + Alarme Perimetral)',
      };
      showToast(`Modo de Segurança alterado: ${modeNames[mode]}`);
      addNewSystemEvent(
        'cam-01',
        'SYSTEM',
        mode === 'AWAY' || mode === 'NIGHT' ? 'WARNING' : 'INFO',
        `Sistema configurado para: ${modeNames[mode]}`,
        'As políticas de detecção de IA e notificações das 4 câmeras foram sincronizadas.'
      );
    },
    [addNewSystemEvent, showToast]
  );

  const openFullScreenCamera = useCallback((id: string) => {
    setFocusedCameraId(id);
    setFullScreenCameraId(id);
  }, []);

  const closeFullScreenCamera = useCallback(() => {
    setFullScreenCameraId(null);
  }, []);

  const toggleGlobalPanic = useCallback(() => {
    setGlobalPanicActive((prev) => {
      const next = !prev;
      setCameras((cams) =>
        cams.map((c) => ({
          ...c,
          sirenActive: next,
          spotlightOn: next ? true : c.spotlightOn,
          isRecording: true,
        }))
      );
      if (next) {
        showToast('ALERTA DE PÂNICO ATIVADO! Sirenes e Holofotes das 4 câmeras acionados.');
        addNewSystemEvent(
          'cam-01',
          'ALARM',
          'CRITICAL',
          'Sirene Geral de Pânico Acionada',
          'Acionamento manual de emergência nas 4 câmeras e holofotes perimetrais.'
        );
      } else {
        showToast('Sirene de Pânico desativada.');
      }
      return next;
    });
  }, [addNewSystemEvent, showToast]);

  const toggleAllAudioMute = useCallback(() => {
    setAllAudioMuted((prev) => {
      const next = !prev;
      setCameras((cams) => cams.map((c) => ({ ...c, audioMuted: next })));
      showToast(next ? 'Áudio de todas as câmeras silenciado' : 'Monitoramento de áudio ativo');
      return next;
    });
  }, [showToast]);

  const toggleCameraMute = useCallback((id: string) => {
    setCameras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, audioMuted: !c.audioMuted } : c))
    );
  }, []);

  const setCameraTalkback = useCallback(
    (id: string, active: boolean) => {
      setCameras((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, talkbackActive: active, audioMuted: active ? false : c.audioMuted }
            : c
        )
      );
      if (active) {
        const cam = cameras.find((c) => c.id === id);
        showToast(`Transmitindo voz para CAM 0${cam?.channel || 1}...`);
      }
    },
    [cameras, showToast]
  );

  const toggleCameraSpotlight = useCallback(
    (id: string) => {
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const next = !c.spotlightOn;
          showToast(`Holofote LED CAM 0${c.channel}: ${next ? 'LIGADO' : 'DESLIGADO'}`);
          return { ...c, spotlightOn: next };
        })
      );
    },
    [showToast]
  );

  const toggleCameraSiren = useCallback(
    (id: string) => {
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const next = !c.sirenActive;
          showToast(`Sirene 110dB CAM 0${c.channel}: ${next ? 'ACIONADA' : 'DESLIGADA'}`);
          return { ...c, sirenActive: next };
        })
      );
    },
    [showToast]
  );

  const toggleCameraRecording = useCallback(
    (id: string) => {
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const next = !c.isRecording;
          showToast(`Gravação contínua CAM 0${c.channel}: ${next ? 'INICIADA' : 'PAUSADA'}`);
          return { ...c, isRecording: next };
        })
      );
    },
    [showToast]
  );

  const toggleCameraAiBoxes = useCallback((id: string) => {
    setCameras((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, aiBoundingBoxesVisible: !c.aiBoundingBoxesVisible } : c
      )
    );
  }, []);

  const cycleNightVision = useCallback(
    (id: string) => {
      const order: NightVisionMode[] = ['AUTO', 'IR_ON', 'COLOR_NIGHT', 'OFF'];
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const nextIndex = (order.indexOf(c.nightVision) + 1) % order.length;
          const nextMode = order[nextIndex];
          showToast(`CAM 0${c.channel} Visão Noturna: ${nextMode}`);
          return { ...c, nightVision: nextMode };
        })
      );
    },
    [showToast]
  );

  const moveCameraPTZ = useCallback(
    (id: string, deltaPan: number, deltaTilt: number, deltaZoom = 0) => {
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const pan = Math.max(-100, Math.min(100, c.ptz.pan + deltaPan));
          const tilt = Math.max(-100, Math.min(100, c.ptz.tilt + deltaTilt));
          const zoom = Number(Math.max(1.0, Math.min(4.0, c.ptz.zoom + deltaZoom)).toFixed(1));
          return {
            ...c,
            ptz: { pan, tilt, zoom },
          };
        })
      );
    },
    []
  );

  const setCameraZoom = useCallback((id: string, zoom: number) => {
    setCameras((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ptz: { ...c.ptz, zoom: Number(zoom.toFixed(1)) } } : c
      )
    );
  }, []);

  const applyPTZPreset = useCallback(
    (cameraId: string, presetId: string) => {
      setCameras((prev) =>
        prev.map((c) => {
          if (c.id !== cameraId) return c;
          const preset = c.presets.find((p) => p.id === presetId);
          if (!preset) return c;
          showToast(`PTZ CAM 0${c.channel} movido para: ${preset.label}`);
          return {
            ...c,
            ptz: {
              pan: preset.pan,
              tilt: preset.tilt,
              zoom: preset.zoom,
            },
          };
        })
      );
    },
    [showToast]
  );

  const resetCameraPTZ = useCallback(
    (id: string) => {
      setCameras((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ptz: { pan: 0, tilt: 0, zoom: 1.0 } } : c))
      );
      showToast('Posição PTZ centralizada (0°, 0°, 1.0x)');
    },
    [showToast]
  );

  const takeSnapshot = useCallback(
    (id: string) => {
      const cam = cameras.find((c) => c.id === id);
      setSnapshotsCount((prev) => prev + 1);
      showToast(`Foto em alta resolução (${cam?.resolution || '4K'}) salva na Galeria Segura!`);
    },
    [cameras, showToast]
  );

  const updateCameraConfig = useCallback(
    (id: string, config: UpdateCameraConfigPayload) => {
      setCameras((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...config } : c));
        saveStorageItem(STORAGE_CAMERAS_KEY, JSON.stringify(next));
        return next;
      });
      const cam = cameras.find((c) => c.id === id);
      showToast(`Canal 0${cam?.channel || 1} (${config.name || cam?.name}) atualizado.`);
    },
    [cameras, showToast]
  );

  const applyIntelbrasSystemConfig = useCallback(
    (config: IntelbrasSystemConfig) => {
      const nextConfig: IntelbrasSystemConfig = {
        ...config,
        isConfiguredByUser: true,
        lastTestedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setIntelbrasConfig(nextConfig);
      saveStorageItem(STORAGE_CONFIG_KEY, JSON.stringify(nextConfig));

      const host =
        nextConfig.connectionMode === 'DDNS'
          ? nextConfig.ddnsHost.trim() || nextConfig.ipAddress.trim()
          : nextConfig.ipAddress.trim();

      const lineLabel =
        nextConfig.deviceLine === 'MHDX_DVR'
          ? 'Intelbras MHDX'
          : nextConfig.deviceLine === 'NVD_NVR'
          ? 'Intelbras NVD'
          : nextConfig.deviceLine === 'VIP_IP_CAM'
          ? 'Intelbras VIP'
          : 'Intelbras Mibo';

      setCameras((prev) => {
        const nextCameras = prev.map((c) => {
          const ch = c.dvrChannel || c.channel;
          const built = buildCameraStreamUrl({
            brand: 'INTELBRAS',
            cloudSerial: nextConfig.cloudSerial,
            ipAddress: host,
            hlsGatewayBaseUrl: nextConfig.hlsGatewayUrl,
            servicePort: nextConfig.servicePort,
            rtspPort: nextConfig.rtspPort,
            httpPort: nextConfig.httpPort,
            onvifPort: nextConfig.servicePort,
            username: nextConfig.username,
            password: nextConfig.password,
            dvrChannel: ch,
            streamSubtype: nextConfig.defaultSubtype,
            protocol: nextConfig.protocol,
          });

          const identifier =
            nextConfig.connectionMode === 'CLOUD_P2P' && nextConfig.cloudSerial
              ? nextConfig.cloudSerial
              : host || 'Local';

          return {
            ...c,
            brand: 'INTELBRAS' as CameraBrand,
            cloudSerial: nextConfig.cloudSerial,
            ipAddress: host,
            servicePort: nextConfig.servicePort,
            rtspPort: nextConfig.rtspPort,
            httpPort: nextConfig.httpPort,
            onvifPort: nextConfig.servicePort,
            streamSubtype: nextConfig.defaultSubtype,
            username: nextConfig.username,
            password: nextConfig.password,
            protocol: nextConfig.protocol,
            streamUrl:
              nextConfig.protocol === 'SIMULATED' ? built.rtspUrl : built.recommendedUrl,
            mjpegUrl: built.mjpegUrl,
            hlsFallbackUrl:
              nextConfig.hlsGatewayUrl.trim()
                ? built.hlsGatewayUrl
                : c.hlsFallbackUrl,
            model: `${lineLabel} (${identifier} • CH${ch})`,
            status: 'ONLINE' as const,
          };
        });
        saveStorageItem(STORAGE_CAMERAS_KEY, JSON.stringify(nextCameras));
        return nextCameras;
      });

      showToast(
        `${nextConfig.systemName} configurado! ${lineLabel} aplicado nos ${cameras.length} canais.`
      );
    },
    [cameras.length, showToast]
  );

  const resetToDemoMode = useCallback(() => {
    removeStorageItem(STORAGE_CONFIG_KEY);
    removeStorageItem(STORAGE_CAMERAS_KEY);
    setIntelbrasConfig(DEFAULT_INTELBRAS_CONFIG);
    setCameras(INITIAL_CAMERAS);
    showToast('Sistema restaurado para o modo de demonstração.');
  }, [showToast]);

  const applyGlobalDvrCredentials = useCallback(
    (params: {
      brand: CameraBrand;
      cloudSerial: string;
      ipAddress: string;
      servicePort: number;
      rtspPort: number;
      httpPort: number;
      username: string;
      password: string;
      protocol: StreamProtocol;
    }) => {
      const auth = params.username
        ? params.password
          ? `${encodeURIComponent(params.username)}:${encodeURIComponent(params.password)}@`
          : `${encodeURIComponent(params.username)}@`
        : '';

      setCameras((prev) =>
        prev.map((c) => {
          const ch = c.channel;
          const streamUrl =
            params.protocol === 'INTELBRAS_CLOUD'
              ? `intelbras-cloud://${auth}${params.cloudSerial}:${params.servicePort}/cam/realmonitor?channel=${ch}&subtype=0`
              : `rtsp://${auth}${params.ipAddress}:${params.rtspPort}/cam/realmonitor?channel=${ch}&subtype=0`;

          return {
            ...c,
            brand: params.brand,
            cloudSerial: params.cloudSerial,
            ipAddress: params.ipAddress,
            servicePort: params.servicePort,
            rtspPort: params.rtspPort,
            httpPort: params.httpPort,
            username: params.username,
            password: params.password,
            dvrChannel: ch,
            protocol: params.protocol,
            streamUrl,
            model: `Intelbras Multi-HD (${params.cloudSerial} • CH${ch})`,
          };
        })
      );
      showToast(
        `Intelbras Cloud (${params.cloudSerial} • Porta ${params.servicePort}) sincronizado nos Canais 1 a 4!`
      );
    },
    [showToast]
  );

  const scanLocalNetworkCameras = useCallback(() => {
    setIsScanningNetwork(true);
    const targetHost = intelbrasConfig.ipAddress || '192.168.1.108';
    showToast(`Varrendo rede local (${targetHost} • Portas 37777 / 554 / 80)...`);
    setTimeout(() => {
      setIsScanningNetwork(false);
      setDiscoveredDevices(
        INITIAL_DISCOVERED.map((d, idx) => ({
          ...d,
          ipAddress: idx === 0 && intelbrasConfig.ipAddress ? intelbrasConfig.ipAddress : d.ipAddress,
          cloudSerial:
            idx === 0 && intelbrasConfig.cloudSerial ? intelbrasConfig.cloudSerial : d.cloudSerial,
          latencyMs: Math.floor(Math.random() * 10) + 12,
        }))
      );
      showToast('Busca concluída: dispositivos Intelbras e câmeras IP listados.');
    }, 850);
  }, [intelbrasConfig.cloudSerial, intelbrasConfig.ipAddress, showToast]);

  const testCameraStreamConnection = useCallback(
    (id: string) => {
      setCameras((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'CONNECTING' } : c))
      );
      setTimeout(() => {
        setCameras((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: 'ONLINE' } : c))
        );
        const cam = cameras.find((c) => c.id === id);
        const target =
          cam?.protocol === 'INTELBRAS_CLOUD'
            ? `${cam?.cloudSerial || 'Cloud'}:${cam?.servicePort}`
            : `${cam?.ipAddress}:${cam?.rtspPort}`;
        showToast(
          `CAM 0${cam?.channel || 1} validada (${target} • Canal ${cam?.dvrChannel || 1}).`
        );
      }, 700);
    },
    [cameras, showToast]
  );

  const acknowledgeEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, acknowledged: true } : e))
    );
  }, []);

  const acknowledgeAllEvents = useCallback(() => {
    setEvents((prev) => prev.map((e) => ({ ...e, acknowledged: true })));
    showToast('Todos os eventos foram marcados como verificados.');
  }, [showToast]);

  const toggleSmartSensor = useCallback(
    (sensorId: string) => {
      setSensors((prev) =>
        prev.map((s) => {
          if (s.id !== sensorId) return s;
          let nextState: SmartDeviceSensor['state'] = s.state;
          if (s.type === 'LOCK') {
            nextState = s.state === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';
          } else if (s.type === 'GARAGE_DOOR' || s.type === 'WINDOW_SENSOR') {
            nextState = s.state === 'CLOSED' ? 'OPEN' : 'CLOSED';
          } else if (s.type === 'PERIMETER_IR') {
            nextState = s.state === 'ARMED' ? 'TRIGGERED' : 'ARMED';
          }
          const nowStr = new Date().toTimeString().slice(0, 5);
          showToast(`${s.name}: status alterado para ${nextState}`);
          return {
            ...s,
            state: nextState,
            lastUpdated: `Atualizado às ${nowStr}`,
          };
        })
      );
    },
    [showToast]
  );

  return (
    <SecurityContext.Provider
      value={{
        intelbrasConfig,
        cameras,
        events,
        sensors,
        discoveredDevices,
        isScanningNetwork,
        securityMode,
        layoutMode,
        focusedCameraId,
        fullScreenCameraId,
        globalPanicActive,
        allAudioMuted,
        snapshotsCount,
        lastToastMessage,
        setSecurityMode,
        setLayoutMode,
        setFocusedCameraId,
        openFullScreenCamera,
        closeFullScreenCamera,
        toggleGlobalPanic,
        toggleAllAudioMute,
        toggleCameraMute,
        setCameraTalkback,
        toggleCameraSpotlight,
        toggleCameraSiren,
        toggleCameraRecording,
        toggleCameraAiBoxes,
        cycleNightVision,
        moveCameraPTZ,
        setCameraZoom,
        applyPTZPreset,
        resetCameraPTZ,
        takeSnapshot,
        updateCameraConfig,
        applyIntelbrasSystemConfig,
        resetToDemoMode,
        applyGlobalDvrCredentials,
        scanLocalNetworkCameras,
        testCameraStreamConnection,
        acknowledgeEvent,
        acknowledgeAllEvents,
        toggleSmartSensor,
        clearToast,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return ctx;
};
