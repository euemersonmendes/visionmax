export type StreamProtocol = 'SIMULATED' | 'INTELBRAS_CLOUD' | 'RTSP' | 'HLS' | 'MJPEG' | 'ONVIF';

export type IntelbrasConnectionMode = 'LOCAL_IP' | 'CLOUD_P2P' | 'DDNS' | 'HLS_GATEWAY';

export type IntelbrasDeviceLine = 'MHDX_DVR' | 'NVD_NVR' | 'VIP_IP_CAM' | 'MIBO_SMART';

export interface IntelbrasSystemConfig {
  systemName: string;
  deviceLine: IntelbrasDeviceLine;
  connectionMode: IntelbrasConnectionMode;
  cloudSerial: string;
  ipAddress: string;
  ddnsHost: string;
  hlsGatewayUrl: string;
  servicePort: number;
  rtspPort: number;
  httpPort: number;
  username: string;
  password: string;
  totalChannels: 4 | 8 | 16;
  defaultSubtype: StreamSubtype;
  protocol: StreamProtocol;
  isConfiguredByUser: boolean;
  lastTestedAt?: string;
}

export type CameraBrand =
  | 'INTELBRAS'
  | 'HIKVISION'
  | 'TPLINK_TAPO'
  | 'DAHUA'
  | 'REOLINK'
  | 'POSITIVO_TUYA'
  | 'CUSTOM';

export type StreamSubtype = 'MAIN_HD' | 'SUB_SD';

export type NightVisionMode = 'AUTO' | 'IR_ON' | 'COLOR_NIGHT' | 'OFF';

export type CameraResolution = '4K UHD' | '2K QHD' | '1080p FHD';

export type SecurityMode = 'DISARMED' | 'HOME' | 'AWAY' | 'NIGHT';

export type LayoutMode = 'QUAD_2X2' | 'FOCUS_PIP' | 'LIST_1X4';

export interface PTZPreset {
  id: string;
  label: string;
  pan: number;  // -100 to 100
  tilt: number; // -100 to 100
  zoom: number; // 1.0 to 4.0
}

export interface BoundingBox {
  id: string;
  label: string;
  confidence: number;
  type: 'PERSON' | 'VEHICLE' | 'PET';
  x: number; // percentage 0..80
  y: number; // percentage 0..70
  width: number;
  height: number;
}

export interface CameraTelemetry {
  wifiSignalDbm: number;
  wifiQualityPercent: number;
  storageUsedGb: number;
  tempCelsius: number;
  latencyMs: number;
  uptimeHours: number;
}

export interface DiscoveredNetworkDevice {
  id: string;
  ipAddress: string;
  macAddress: string;
  cloudSerial?: string;
  brand: CameraBrand;
  modelName: string;
  servicePort: number;
  rtspPort: number;
  httpPort: number;
  onvifPort: number;
  protocol: StreamProtocol;
  latencyMs: number;
}

export interface CameraDevice {
  id: string;
  channel: number;
  name: string;
  zone: string;
  model: string;
  brand: CameraBrand;
  cloudSerial: string;
  ipAddress: string;
  servicePort: number;
  rtspPort: number;
  httpPort: number;
  onvifPort: number;
  dvrChannel: number;
  streamSubtype: StreamSubtype;
  username: string;
  password: string;
  protocol: StreamProtocol;
  streamUrl: string;
  mjpegUrl?: string;
  hlsFallbackUrl: string;
  status: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
  resolution: CameraResolution;
  fps: number;
  bitrateKbps: number;
  nightVision: NightVisionMode;
  aiDetectionEnabled: boolean;
  aiBoundingBoxesVisible: boolean;
  audioMuted: boolean;
  talkbackActive: boolean;
  spotlightOn: boolean;
  sirenActive: boolean;
  isRecording: boolean;
  motionDetected: boolean;
  personDetected: boolean;
  ptz: {
    pan: number;
    tilt: number;
    zoom: number;
  };
  presets: PTZPreset[];
  activeDetections: BoundingBox[];
  telemetry: CameraTelemetry;
  sceneTheme: 'FRONT_GATE' | 'GARAGE' | 'BACKYARD_POOL' | 'SIDE_CORRIDOR';
}

export interface SecurityEvent {
  id: string;
  cameraId: string;
  cameraName: string;
  channel: number;
  type: 'PERSON' | 'VEHICLE' | 'MOTION' | 'AUDIO' | 'ALARM' | 'SYSTEM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  durationSec: number;
  confidence?: number;
  acknowledged: boolean;
  sceneTheme: 'FRONT_GATE' | 'GARAGE' | 'BACKYARD_POOL' | 'SIDE_CORRIDOR';
}

export interface SmartDeviceSensor {
  id: string;
  name: string;
  zone: string;
  linkedCameraId: string;
  type: 'LOCK' | 'GARAGE_DOOR' | 'PERIMETER_IR' | 'WINDOW_SENSOR';
  state: 'LOCKED' | 'UNLOCKED' | 'CLOSED' | 'OPEN' | 'ARMED' | 'TRIGGERED';
  batteryPercent: number;
  lastUpdated: string;
}
