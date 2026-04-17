export interface OnsetDetectorOptions {
  rmsThreshold?: number;
  releaseRatio?: number; // hysteresis: must drop below threshold * releaseRatio before re-triggering
  minIntervalMs?: number;
  releaseTimeoutMs?: number; // fallback re-arm when signal decays slowly but stays in the mid-range
}

export interface OnsetEvent {
  timeMs: number;
  rms: number;
}

export class OnsetDetector {
  private rmsThreshold: number;
  private releaseRatio: number;
  private minIntervalMs: number;
  private releaseTimeoutMs: number;
  private isAboveThreshold = false;
  private lastOnsetTimeMs = -Infinity;

  constructor(options: OnsetDetectorOptions = {}) {
    this.rmsThreshold = options.rmsThreshold ?? 0.02;
    this.releaseRatio = options.releaseRatio ?? 0.5;
    this.minIntervalMs = options.minIntervalMs ?? 80;
    this.releaseTimeoutMs = options.releaseTimeoutMs ?? 200;
  }

  /**
   * Process a frame of audio data and return an onset event if detected.
   * @param buffer - Time-domain audio samples
   * @param timeMs - Current time in ms (from AudioContext)
   */
  process(buffer: Float32Array, timeMs: number): OnsetEvent | null {
    const rms = this.computeRms(buffer);
    if (!Number.isFinite(rms)) return null;

    // Time-based re-arm: decaying bass notes can linger in the mid-range
    // (between release floor and threshold) without ever crossing the release
    // hysteresis, which would block subsequent onsets. If enough time has passed
    // and the signal is no longer strongly above threshold, re-arm.
    if (
      this.isAboveThreshold &&
      rms < this.rmsThreshold &&
      timeMs - this.lastOnsetTimeMs >= this.releaseTimeoutMs
    ) {
      this.isAboveThreshold = false;
    }

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
