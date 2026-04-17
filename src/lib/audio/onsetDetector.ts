export interface OnsetDetectorOptions {
  rmsThreshold?: number;
  releaseRatio?: number; // hysteresis: must drop below threshold * releaseRatio before re-triggering
  minIntervalMs?: number;
}

export interface OnsetEvent {
  timeMs: number;
  rms: number;
}

export class OnsetDetector {
  private rmsThreshold: number;
  private releaseRatio: number;
  private minIntervalMs: number;
  private isAboveThreshold = false;
  private lastOnsetTimeMs = -Infinity;

  constructor(options: OnsetDetectorOptions = {}) {
    this.rmsThreshold = options.rmsThreshold ?? 0.02;
    this.releaseRatio = options.releaseRatio ?? 0.5;
    this.minIntervalMs = options.minIntervalMs ?? 80;
  }

  /**
   * Process a frame of audio data and return an onset event if detected.
   * @param buffer - Time-domain audio samples
   * @param timeMs - Current time in ms (from AudioContext)
   */
  process(buffer: Float32Array, timeMs: number): OnsetEvent | null {
    const rms = this.computeRms(buffer);

    if (rms >= this.rmsThreshold) {
      if (
        !this.isAboveThreshold &&
        timeMs - this.lastOnsetTimeMs >= this.minIntervalMs
      ) {
        this.isAboveThreshold = true;
        this.lastOnsetTimeMs = timeMs;
        return { timeMs, rms };
      }
    } else if (rms < this.rmsThreshold * this.releaseRatio) {
      this.isAboveThreshold = false;
    }

    return null;
  }

  reset(): void {
    this.isAboveThreshold = false;
    this.lastOnsetTimeMs = -Infinity;
  }

  setThreshold(value: number): void {
    this.rmsThreshold = value;
  }

  private computeRms(buffer: Float32Array): number {
    if (buffer.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }
}
