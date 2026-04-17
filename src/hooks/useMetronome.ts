import { useState, useRef, useCallback, useEffect } from "react";
import { MetronomeEngine } from "../lib/audio/MetronomeEngine";

type BeatCallback = (beat: number, time: number) => void;

export function useMetronome(initialBpm: number, beatsPerMeasure: number, beatUnit: number) {
  const engineRef = useRef<MetronomeEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [bpm, setBpmState] = useState(initialBpm);
  const externalCallbackRef = useRef<BeatCallback | null>(null);

  const start = useCallback(async () => {
    if (engineRef.current?.isPlaying) return;

    const engine = new MetronomeEngine({ bpm, beatsPerMeasure, beatUnit });

    engine.onBeat((beat, time) => {
      setCurrentBeat(beat);
      externalCallbackRef.current?.(beat, time);
    });

    try {
      await engine.start();
    } catch (err) {
      // Make sure we don't leak a half-initialized AudioContext.
      await engine.stop().catch(() => {});
      throw err;
    }

    engineRef.current = engine;
    // Surface the engine's (possibly clamped) BPM so downstream consumers agree
    // with the actual click interval.
    setBpmState(engine.bpm);
    setIsPlaying(true);
  }, [bpm, beatsPerMeasure, beatUnit]);

  const stop = useCallback(async () => {
    const engine = engineRef.current;
    engineRef.current = null;
    setIsPlaying(false);
    setCurrentBeat(0);
    await engine?.stop();
  }, []);

  const setBpm = useCallback((value: number) => {
    if (engineRef.current) {
      engineRef.current.bpm = value;
      setBpmState(engineRef.current.bpm);
    } else {
      setBpmState(value);
    }
  }, []);

  const onBeat = useCallback((callback: BeatCallback) => {
    externalCallbackRef.current = callback;
  }, []);

  const getCurrentTimeMs = useCallback((): number | null => {
    return engineRef.current?.getCurrentTimeMs() ?? null;
  }, []);

  useEffect(() => {
    return () => {
      // Unmount cleanup; fire and forget is fine since the ref is cleared.
      void engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  return {
    isPlaying,
    currentBeat,
    bpm,
    setBpm,
    start,
    stop,
    onBeat,
    getCurrentTimeMs,
  };
}
