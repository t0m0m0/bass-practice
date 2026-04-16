import { PitchAnalyzer } from "./pitchDetection";
import type { PitchResult } from "../../types/audio";

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private pitchAnalyzer = new PitchAnalyzer();

  get sampleRate(): number {
    return this.audioContext?.sampleRate ?? 48000;
  }

  get isActive(): boolean {
    return this.audioContext !== null && this.audioContext.state === "running";
  }

  async start(deviceId?: string): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      },
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.audioContext = new AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 4096;

    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.sourceNode.connect(this.analyserNode);
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.sourceNode?.disconnect();
    this.audioContext?.close();
    this.stream = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.audioContext = null;
  }

  getTimeDomainData(): Float32Array {
    if (!this.analyserNode) {
      return new Float32Array(0);
    }
    const buffer = new Float32Array(this.analyserNode.fftSize);
    this.analyserNode.getFloatTimeDomainData(buffer);
    return buffer;
  }

  getInputLevel(): number {
    if (!this.analyserNode) return 0;
    const data = this.getTimeDomainData();
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  detectPitch(): PitchResult {
    const buffer = this.getTimeDomainData();
    return this.pitchAnalyzer.detectPitch(buffer, this.sampleRate);
  }

  static async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "audioinput");
  }
}
