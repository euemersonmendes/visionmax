import { CameraBrand, StreamProtocol, StreamSubtype } from '../types/security';

export interface CameraConnectionParams {
  brand: CameraBrand;
  cloudSerial?: string;
  ipAddress: string;
  hlsGatewayBaseUrl?: string;
  servicePort?: number;
  rtspPort: number;
  httpPort: number;
  onvifPort: number;
  username: string;
  password: string;
  dvrChannel: number;
  streamSubtype: StreamSubtype;
  protocol: StreamProtocol;
}

export const BRAND_CATALOG: {
  id: CameraBrand;
  label: string;
  subtitle: string;
  defaultServicePort: number;
  defaultRtspPort: number;
  defaultHttpPort: number;
  defaultOnvifPort: number;
  defaultUser: string;
  notes: string;
}[] = [
  {
    id: 'INTELBRAS',
    label: 'Intelbras (Cloud P2P / MHDX / NVR / VIP / Mibo)',
    subtitle: 'Porta Serviço 37777 • Serial Cloud P2P • RTSP 554',
    defaultServicePort: 37777,
    defaultRtspPort: 554,
    defaultHttpPort: 80,
    defaultOnvifPort: 80,
    defaultUser: 'admin',
    notes: 'Configurado com Serial Intelbras Cloud (U5EM1601209MZ), Porta 37777 e login admin.',
  },
  {
    id: 'HIKVISION',
    label: 'Hikvision / HiLook / Ezviz',
    subtitle: 'Padrão ISAPI /Streaming/Channels',
    defaultServicePort: 8000,
    defaultRtspPort: 554,
    defaultHttpPort: 80,
    defaultOnvifPort: 8000,
    defaultUser: 'admin',
    notes: 'Canal 101 = Câmera 1 Principal (HD/4K) | Canal 102 = Sub-stream leve.',
  },
  {
    id: 'TPLINK_TAPO',
    label: 'TP-Link Tapo (C200 / C210 / C310 / C500)',
    subtitle: 'Padrão /stream1 (HD) e /stream2 (SD)',
    defaultServicePort: 2020,
    defaultRtspPort: 554,
    defaultHttpPort: 80,
    defaultOnvifPort: 2020,
    defaultUser: 'admin',
    notes: 'Crie a conta da câmera no app Tapo (Configurações Avançadas > Conta da Câmera).',
  },
  {
    id: 'DAHUA',
    label: 'Dahua Technology / OEM',
    subtitle: 'Porta TCP 37777 • /cam/realmonitor?channel=X',
    defaultServicePort: 37777,
    defaultRtspPort: 554,
    defaultHttpPort: 80,
    defaultOnvifPort: 37777,
    defaultUser: 'admin',
    notes: 'Compatível com DVRs, NVRs e câmeras IP PoE Dahua.',
  },
  {
    id: 'REOLINK',
    label: 'Reolink (RLC / E1 Outdoor / NVR)',
    subtitle: 'Padrão /h264Preview_01_main',
    defaultServicePort: 9000,
    defaultRtspPort: 554,
    defaultHttpPort: 80,
    defaultOnvifPort: 8000,
    defaultUser: 'admin',
    notes: 'Habilite RTSP e ONVIF nas configurações de rede da câmera Reolink.',
  },
  {
    id: 'POSITIVO_TUYA',
    label: 'Positivo Casa Inteligente / Ekaza / Tuya',
    subtitle: 'Padrão ONVIF /live/ch0 ou /onvif1',
    defaultServicePort: 8899,
    defaultRtspPort: 554,
    defaultHttpPort: 8080,
    defaultOnvifPort: 8899,
    defaultUser: 'admin',
    notes: 'Ative a opção "ONVIF" nas configurações da câmera no app Positivo/SmartLife.',
  },
  {
    id: 'CUSTOM',
    label: 'URL Personalizada (HLS / MJPEG / WebRTC / RTSP)',
    subtitle: 'Digite qualquer URL direta da sua câmera ou gateway',
    defaultServicePort: 37777,
    defaultRtspPort: 554,
    defaultHttpPort: 8080,
    defaultOnvifPort: 8000,
    defaultUser: 'admin',
    notes: 'Ideal para MediaMTX, go2rtc, Frigate, Home Assistant ou câmera IP genérica.',
  },
];

export function buildCameraStreamUrl(params: CameraConnectionParams): {
  cloudUrl: string;
  rtspUrl: string;
  mjpegUrl: string;
  hlsGatewayUrl: string;
  recommendedUrl: string;
} {
  const host = (params.ipAddress || '10.0.2.100').trim();
  const serial = (params.cloudSerial || 'U5EM1601209MZ').trim();
  const user = encodeURIComponent((params.username || 'admin').trim());
  const pass = encodeURIComponent(params.password || '');
  const authPart = user ? (pass ? `${user}:${pass}@` : `${user}@`) : '';
  const sPort = params.servicePort || 37777;
  const rPort = params.rtspPort || 554;
  const hPort = params.httpPort || 80;
  const ch = params.dvrChannel || 1;
  const isSub = params.streamSubtype === 'SUB_SD';
  const subtype = isSub ? 1 : 0;

  const cloudUrl = `intelbras-cloud://${authPart}${serial}:${sPort}/cam/realmonitor?channel=${ch}&subtype=${subtype}`;
  let rtspUrl = '';
  let mjpegUrl = '';

  switch (params.brand) {
    case 'INTELBRAS':
    case 'DAHUA': {
      rtspUrl = `rtsp://${authPart}${host}:${rPort}/cam/realmonitor?channel=${ch}&subtype=${subtype}`;
      mjpegUrl = `http://${authPart}${host}:${hPort}/cgi-bin/mjpg/video.cgi?channel=${ch}&subtype=${subtype}`;
      break;
    }
    case 'HIKVISION': {
      const streamCode = `${ch}0${isSub ? 2 : 1}`;
      rtspUrl = `rtsp://${authPart}${host}:${rPort}/Streaming/Channels/${streamCode}`;
      mjpegUrl = `http://${authPart}${host}:${hPort}/ISAPI/Streaming/channels/${streamCode}/httpPreview`;
      break;
    }
    case 'TPLINK_TAPO': {
      const streamPath = isSub ? 'stream2' : 'stream1';
      rtspUrl = `rtsp://${authPart}${host}:${rPort}/${streamPath}`;
      mjpegUrl = `http://${host}:${hPort}/stream`;
      break;
    }
    case 'REOLINK': {
      const chPad = String(ch).padStart(2, '0');
      const profile = isSub ? 'sub' : 'main';
      rtspUrl = `rtsp://${authPart}${host}:${rPort}/h264Preview_${chPad}_${profile}`;
      mjpegUrl = `http://${host}:${hPort}/cgi-bin/api.cgi?cmd=Snap&channel=${ch - 1}&user=${user}&password=${pass}`;
      break;
    }
    case 'POSITIVO_TUYA': {
      const path = isSub ? 'live/ch1' : 'live/ch0';
      rtspUrl = `rtsp://${authPart}${host}:${rPort}/${path}`;
      mjpegUrl = `http://${host}:${hPort}/video.mjpg`;
      break;
    }
    default: {
      rtspUrl = `rtsp://${authPart}${host}:${rPort}/stream1`;
      mjpegUrl = `http://${host}:${hPort}/video.mjpg`;
      break;
    }
  }

  const cleanGatewayBase = params.hlsGatewayBaseUrl?.trim().replace(/\/+$/, '');
  const hlsGatewayUrl = cleanGatewayBase
    ? `${cleanGatewayBase}/cam${String(ch).padStart(2, '0')}/index.m3u8`
    : `http://${host}:8888/cam${String(ch).padStart(2, '0')}/index.m3u8`;

  let recommendedUrl = rtspUrl;
  if (params.protocol === 'INTELBRAS_CLOUD') {
    recommendedUrl = cloudUrl;
  } else if (params.protocol === 'MJPEG') {
    recommendedUrl = mjpegUrl;
  } else if (params.protocol === 'HLS') {
    recommendedUrl = hlsGatewayUrl;
  }

  return {
    cloudUrl,
    rtspUrl,
    mjpegUrl,
    hlsGatewayUrl,
    recommendedUrl,
  };
}

export function buildDvrPlaybackUrl(params: {
  ipAddress: string;
  rtspPort: number;
  username: string;
  password: string;
  channel: number;
  dateIso: string; // YYYY-MM-DD
  timeStr: string; // HH:MM
}): string {
  const host = (params.ipAddress || '192.168.3.9').trim();
  const rPort = params.rtspPort || 554;
  const user = encodeURIComponent((params.username || 'admin').trim());
  const pass = encodeURIComponent(params.password || '');
  const authPart = user ? (pass ? `${user}:${pass}@` : `${user}@`) : '';
  const dateCompact = params.dateIso.replace(/-/g, '_');
  const timeCompact = `${params.timeStr.replace(':', '_')}_00`;
  return `rtsp://${authPart}${host}:${rPort}/cam/playback?channel=${params.channel}&starttime=${dateCompact}_${timeCompact}`;
}
