import { useState, useRef, useEffect } from "react";
import type { AudioEngine } from "../lib/audio/AudioEngine";
import type { PitchResult } from "../types/audio";

const HOLD_DURATION_MS = 200;
const MIN_CENTS_CHANGE = 5;

export function usePitchDetection(
  engine: AudioEngine | null,
  isListening: boolean,
) {
  const [pitch, setPitch] = useState<PitchResult | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastValidRef = useRef<{ pitch: PitchResult; time: number } | null>(
    null,
  );

  useEffect(() => {
    if (!engine || !isListening) return;

    const update = () => {
      const result = engine.detectPitch();
      const now = Date.now();

      if (result.note) {
        lastValidRef.current = { pitch: result, time: now };
        setPitch((prev) => {
          if (
            prev?.note === result.note &&
            Math.abs(prev.cents - result.cents) < MIN_CENTS_CHANGE
          ) {
            return prev;
          }
          return result;
        });
      } else {
        const last = lastValidRef.current;
        if (last && now - last.time < HOLD_DURATION_MS) {
          // Keep showing last valid pitch briefly to avoid flicker
        } else {
          setPitch(null);
          lastValidRef.current = null;
        }
      }

      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      // engine が切れた・停止した際にピッチをリセット
      setPitch(null);
      lastValidRef.current = null;
    };
  }, [engine, isListening]);

  return { pitch };
}
