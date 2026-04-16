import { PitchDetector } from "pitchy";
import { Midi } from "tonal";
import type { PitchResult } from "../../types/audio";

const MIN_FREQUENCY = 30;
const MAX_FREQUENCY = 500;

export class PitchAnalyzer {
  private detector: PitchDetector<Float32Array> | null = null;
  private detectorInputLength = 0;

  clarityThreshold = 0.9;

  detectPitch(buffer: Float32Array, sampleRate: number): PitchResult {
    const now = Date.now();

    if (buffer.length === 0) {
      return nullResult(now);
    }

    if (!this.detector || buffer.length !== this.detectorInputLength) {
      this.detector = PitchDetector.forFloat32Array(buffer.length);
      this.detectorInputLength = buffer.length;
    }

    const [frequency, clarity] = this.detector.findPitch(buffer, sampleRate);

    if (
      clarity < this.clarityThreshold ||
      frequency < MIN_FREQUENCY ||
      frequency > MAX_FREQUENCY
    ) {
      return nullResult(now);
    }

    const midiFloat = Midi.freqToMidi(frequency);
    const midiRounded = Math.round(midiFloat);
    const noteName = Midi.midiToNoteName(midiRounded, { sharps: true });
    const cents = Math.round((midiFloat - midiRounded) * 100);
    const pitchClass = noteName.replace(/[0-9]/g, "");

    return {
      frequency,
      clarity,
      note: noteName,
      pitchClass,
      cents,
      timestamp: now,
    };
  }
}

function nullResult(timestamp: number): PitchResult {
  return {
    frequency: 0,
    clarity: 0,
    note: null,
    pitchClass: null,
    cents: 0,
    timestamp,
  };
}
