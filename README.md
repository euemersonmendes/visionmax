# VISION MAX — Central Mobile de Segurança Residencial (4 Câmeras)

Aplicativo mobile nativo (**React Native + Expo + TypeScript**) projetado para o monitoramento em tempo real e gestão de segurança residencial com **4 câmeras**.

## Principais Funcionalidades

1. **Monitoramento Multi-Câmera (Quad-View 2x2, Foco + 3 e Lista HD)**
   - Visualização simultânea das 4 câmeras da residência:
     - **CAM 01:** Entrada Principal & Portão Social (`4K UHD`)
     - **CAM 02:** Garagem & Acesso de Veículos (`4K UHD`)
     - **CAM 03:** Quintal, Área Gourmet & Piscina (`2K QHD`)
     - **CAM 04:** Corredor Lateral & Serviço (`2K QHD`)
   - Telemetria em tempo real no OSD (Bitrate Mbps, FPS, Latência, Qualidade Wi-Fi, Status de Gravação `REC` e Caixas Delimitadoras de IA).

2. **Modo Tela Cheia Tático (PTZ 360°, Zoom 4x e Áudio Bidirecional)**
   - **Controle PTZ de 8 direções + Home Reset** e **Presets Memorizados** por câmera (ex.: *Portão Social*, *Calçada*, *Piscina*, *Portão Basculante*).
   - **Zoom Óptico/Digital** (`1.0x`, `1.5x`, `2.0x`, `3.0x`, `4.0x` e ajuste fino).
   - **Áudio Bidirecional (Push-To-Talk / Interfone IP)** com visualizador de espectro de voz em tempo real e controle de escuta ambiente.
   - **Comandos Táticos Instantâneos:** Captura de Foto 4K, Gravação NVR, Holofote LED, Comutador de Visão Noturna (`AUTO`, `IR_ON`, `COLOR_NIGHT`, `OFF`) e Sirene Local de 110dB.

3. **Arquitetura Híbrida de Vídeo (Simulação Realista + Streams Reais)**
   - **Modo Simulado IA:** Renderizador interativo de alta precisão pronto para uso imediato, com resposta física ao PTZ/Zoom, filtros de visão noturna infravermelha e rastreamento de IA.
   - **Modo Stream Real (`HLS`, `RTSP`, `MJPEG`, `ONVIF`):** Permite configurar o IP e a URL de stream de cada uma das 4 câmeras, incluindo templates automáticos para **Intelbras**, **Hikvision**, **TP-Link Tapo** e streams HTTP/HLS.

4. **Gestão de Segurança da Residência & Linha do Tempo NVR**
   - Modos de Arme (`Desarmado`, `Em Casa`, `Ausente`, `Modo Noturno`) e botão mestre de **Sirene de Pânico (SOS)**.
   - Integração com fechadura biométrica, portão basculante da garagem e sensores de barreira infravermelho vinculados às 4 câmeras.
   - Linha do tempo de 24 horas do NVR com filtro de eventos de IA por câmera.

## Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor Expo (iOS, Android via Expo Go ou Web)
npx expo start
```

