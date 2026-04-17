export interface MetronomeOptions {
  bpm: number;
  beatsPerMeasure: number;
  beatUnit: number;
}

type BeatCallback = (beat: number, time: number) => void;

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

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
    this._bpm = options.bpm;
    this._beatsPerMeasure = options.beatsPerMeasure;
    this._beatUnit = options.beatUnit;
  }

  get bpm(): number {
    return this._bpm;
  }

  set bpm(value: number) {
    this._bpm = Math.max(20, Math.min(300, value));
  }

  get beatsPerMeasure(): number {
    return this._beatsPerMeasure;
  }

  set beatsPerMeasure(value: number) {
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

  async start(): Promise<void> {
    if (this._isPlaying) return;

    this.audioContext = new AudioContext();
    this._isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05; // small initial delay

    this.timerID = setInterval(() => this.scheduler(), LOOKAHEAD_MS);
  }

  stop(): void {
    if (!this._isPlaying) return;

    this._isPlaying = false;
    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    this.audioContext?.close();
    this.audioContext = null;
    this.currentBeat = 0;
  }

  /** Get the AudioContext currentTime in ms (for onset comparison) */
  getCurrentTimeMs(): number {
    if (!this.audioContext) return 0;
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
    gain.gain.value = isAccent ? 0.8 : 0.4;

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
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
