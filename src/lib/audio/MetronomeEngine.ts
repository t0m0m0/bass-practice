import { assertSupportedBeatUnit } from "../practice/timeSignature";

export interface MetronomeOptions {
  bpm: number;
  beatsPerMeasure: number;
  /**
   * Note value of a beat (denominator of the time signature).
   *
   * Currently only quarter-note beats (`4`) are supported: the scheduler
   * treats tempo as quarter-note BPM via `60 / bpm` seconds per beat.
   * Values other than 4 throw so mismatches between UI labels and actual
   * playback can't slip in unnoticed. See `SUPPORTED_BEAT_UNITS`.
   */
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

export type MetronomeState =
  | { status: "idle" }
  | { status: "ready"; audioContext: AudioContext }
  | { status: "playing"; audioContext: AudioContext; timerID: ReturnType<typeof setInterval> };

export class MetronomeEngine {
  private state: MetronomeState = { status: "idle" };
  private nextNoteTime = 0;
  private currentBeat = 0;
  private _bpm: number;
  private _beatsPerMeasure: number;
  private _beatUnit: number;
  private beatCallbacks: BeatCallback[] = [];

  constructor(options: MetronomeOptions) {
    assertBeatsPerMeasure(options.beatsPerMeasure);
    assertSupportedBeatUnit(options.beatUnit);
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
    return this.state.status === "playing";
  }

  get context(): AudioContext | null {
    return this.state.status === "idle" ? null : this.state.audioContext;
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
    if (this.state.status !== "idle") return;
    const ctx = new AudioContext();
    // resume() returns a promise but the important thing is that the browser
    // *unlocks* the context synchronously when called inside a gesture handler.
    void ctx.resume();
    this.state = { status: "ready", audioContext: ctx };
  }

  /**
   * Play a single count-in click immediately. Used to give an audible pulse
   * during a pre-session countdown so the player can lock into the tempo
   * before playback actually starts. Requires `initContext()` to have been
   * called inside the user-gesture handler.
   *
   * `accent=true` plays the higher-pitched downbeat tone; set it on the
   * final "go" click to signal session start.
   */
  playCountInClick(accent = false): void {
    if (this.state.status === "idle") return;
    const ctx = this.state.audioContext;
    // Guard against closed contexts (e.g. stop() raced with a pending tick).
    if (ctx.state === "closed") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1000 : 800;
    const peakGain = accent ? 1.0 : 0.6;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  async start(): Promise<void> {
    if (this.state.status === "playing") return;

    if (this.state.status === "idle") {
      this.initContext();
    }
    // After initContext, state is guaranteed to be "ready"
    const { audioContext: ctx } = this.state as MetronomeState & { status: "ready" };

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

    this.currentBeat = 0;
    this.nextNoteTime = ctx.currentTime + 0.05; // small initial delay

    const timerID = setInterval(() => this.scheduler(), LOOKAHEAD_MS);
    this.state = { status: "playing", audioContext: ctx, timerID };
  }

  async stop(): Promise<void> {
    if (this.state.status !== "playing") return;

    const { audioContext: ctx, timerID } = this.state;
    this.state = { status: "idle" };
    this.currentBeat = 0;

    clearInterval(timerID);
    if (ctx.state !== "closed") {
      await ctx.close();
    }
  }

  /** AudioContext currentTime in ms, or null if not playing */
  getCurrentTimeMs(): number | null {
    if (this.state.status === "idle") return null;
    return this.state.audioContext.currentTime * 1000;
  }

  private scheduler(): void {
    if (this.state.status !== "playing") return;

    const { audioContext: ctx } = this.state;
    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      this.scheduleClick(ctx, this.nextNoteTime, this.currentBeat);
      this.notifyCallbacks(this.currentBeat, this.nextNoteTime);
      this.advanceBeat();
    }
  }

  private scheduleClick(ctx: AudioContext, time: number, beat: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const isAccent = beat % this._beatsPerMeasure === 0;
    osc.frequency.value = isAccent ? 1000 : 800;

    const peakGain = isAccent ? 1.0 : 0.6;
    // Hold at peak for a short attack, then decay
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

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
