export interface MetronomeOptions {
  bpm: number;
  beatsPerMeasure: number;
  beatUnit: number;
}

type BeatCallback = (beat: number, time: number) => void;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;
const MIN_BPM = 20;
const MAX_BPM = 300;

function assertBeatsPerMeasure(value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(
      `beatsPerMeasure must be a positive integer, got ${value}`,
    );
  }
}

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private timerID: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private currentBeat = 0;
  private _bpm: number;
  private _beatsPerMeasure: number;
  private _beatUnit: number;
  private _isPlaying = false;
  private beatCallbacks: BeatCallback[] = [];

  constructor(options: MetronomeOptions) {
    assertBeatsPerMeasure(options.beatsPerMeasure);
    this._bpm = MetronomeEngine.clampBpm(options.bpm);
    this._beatsPerMeasure = options.beatsPerMeasure;
    this._beatUnit = options.beatUnit;
  }

  private static clampBpm(value: number): number {
    return Math.max(MIN_BPM, Math.min(MAX_BPM, value));
  }

  get bpm(): number {
    return this._bpm;
  }

  set bpm(value: number) {
    this._bpm = MetronomeEngine.clampBpm(value);
  }

  get beatsPerMeasure(): number {
    return this._beatsPerMeasure;
  }

  set beatsPerMeasure(value: number) {
    assertBeatsPerMeasure(value);
    this._beatsPerMeasure = value;
  }

  get beatUnit(): number {
    return this._beatUnit;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get context(): AudioContext | null {
    return this.audioContext;
  }

  /** Seconds per beat (quarter note equivalent) */
  private get secondsPerBeat(): number {
    return 60.0 / this._bpm;
  }

  onBeat(callback: BeatCallback): () => void {
    this.beatCallbacks.push(callback);
    return () => {
      this.beatCallbacks = this.beatCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Prepare the AudioContext synchronously within a user-gesture callback.
   * Browsers require AudioContext creation / resume to happen inside a
   * click handler's call-stack; any intervening setTimeout or await breaks
   * the gesture chain and leaves the context suspended.
   *
   * Call this *before* any async gap (e.g. countdown timer) and then call
   * `start()` when you're ready to begin playback.
   */
  initContext(): void {
    if (this.audioContext) return;
    const ctx = new AudioContext();
    // resume() returns a promise but the important thing is that the browser
    // *unlocks* the context synchronously when called inside a gesture handler.
    void ctx.resume();
    this.audioContext = ctx;
  }

  async start(): Promise<void> {
    if (this._isPlaying) return;

    if (!this.audioContext) {
      this.initContext();
    }
    const ctx = this.audioContext!;
    if (ctx.state === "suspended") {
      // Race against a timeout so we don't hang forever in environments
      // where the browser refuses to unlock the AudioContext.
      const resumed = ctx.resume();
      const timeout = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 2000));
      const result = await Promise.race([resumed.then(() => "ok" as const), timeout]);
      if (result === "timeout" && ctx.state === "suspended") {
        throw new Error("AudioContext could not be resumed. Try clicking the Start button again.");
      }
    }
    this._isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = ctx.currentTime + 0.05; // small initial delay

    this.timerID = setInterval(() => this.scheduler(), LOOKAHEAD_MS);
  }

  async stop(): Promise<void> {
    if (!this._isPlaying) return;

    this._isPlaying = false;
    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    const ctx = this.audioContext;
    this.audioContext = null;
    this.currentBeat = 0;
    if (ctx && ctx.state !== "closed") {
      await ctx.close();
    }
  }

  /** AudioContext currentTime in ms, or null if not playing */
  getCurrentTimeMs(): number | null {
    if (!this.audioContext) return null;
    return this.audioContext.currentTime * 1000;
  }

  private scheduler(): void {
    if (!this.audioContext || !this._isPlaying) return;

    while (
      this.nextNoteTime <
      this.audioContext.currentTime + SCHEDULE_AHEAD_S
    ) {
      this.scheduleClick(this.nextNoteTime, this.currentBeat);
      this.notifyCallbacks(this.currentBeat, this.nextNoteTime);
      this.advanceBeat();
    }
  }

  private scheduleClick(time: number, beat: number): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    const isAccent = beat % this._beatsPerMeasure === 0;
    osc.frequency.value = isAccent ? 1000 : 800;

    const peakGain = isAccent ? 1.0 : 0.6;
    // Hold at peak for a short attack, then decay
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  private advanceBeat(): void {
    this.nextNoteTime += this.secondsPerBeat;
    this.currentBeat++;
  }

  private notifyCallbacks(beat: number, time: number): void {
    for (const cb of this.beatCallbacks) {
      cb(beat, time);
    }
  }
}
