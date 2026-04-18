import { PitchAnalyzer } from "./pitchDetection";
import type { PitchResult } from "../../types/audio";

export type AudioEngineState =
  | { status: "idle" }
  | {
      status: "active";
      audioContext: AudioContext;
      analyserNode: AnalyserNode;
      sourceNode: MediaStreamAudioSourceNode;
      stream: MediaStream;
    };

export class AudioEngine {
  private state: AudioEngineState = { status: "idle" };
  private pitchAnalyzer = new PitchAnalyzer();
  private timeDomainBuffer: Float32Array<ArrayBuffer> | null = null;

  get sampleRate(): number {
    return this.state.status === "active"
      ? this.state.audioContext.sampleRate
      : 48000;
  }

  get clarityThreshold(): number {
    return this.pitchAnalyzer.clarityThreshold;
  }

  set clarityThreshold(value: number) {
    this.pitchAnalyzer.clarityThreshold = value;
  }

  get isActive(): boolean {
    return (
      this.state.status === "active" &&
      this.state.audioContext.state === "running"
    );
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

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const audioContext = new AudioContext();
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 8192;

    const sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyserNode);

    this.state = { status: "active", audioContext, analyserNode, sourceNode, stream };
  }

  async stop(): Promise<void> {
    if (this.state.status !== "active") return;

    const { stream, sourceNode, audioContext } = this.state;
    this.state = { status: "idle" };
    this.timeDomainBuffer = null;

    stream.getTracks().forEach((track) => track.stop());
    sourceNode.disconnect();
    await audioContext.close();
  }

  getTimeDomainData(): Float32Array {
    if (this.state.status !== "active") return new Float32Array(0);

    const { analyserNode } = this.state;
    if (!this.timeDomainBuffer || this.timeDomainBuffer.length !== analyserNode.fftSize) {
      this.timeDomainBuffer = new Float32Array(analyserNode.fftSize);
    }
    analyserNode.getFloatTimeDomainData(this.timeDomainBuffer);
    return this.timeDomainBuffer;
  }

  getInputLevel(): number {
    if (this.state.status !== "active") return 0;

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
