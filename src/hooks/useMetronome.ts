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
    engineRef.current = engine;

    engine.onBeat((beat, time) => {
      setCurrentBeat(beat);
      externalCallbackRef.current?.(beat, time);
    });

    await engine.start();
    setIsPlaying(true);
  }, [bpm, beatsPerMeasure, beatUnit]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setIsPlaying(false);
    setCurrentBeat(0);
  }, []);

  const setBpm = useCallback((value: number) => {
    setBpmState(value);
    if (engineRef.current) {
      engineRef.current.bpm = value;
    }
  }, []);

  const onBeat = useCallback((callback: BeatCallback) => {
    externalCallbackRef.current = callback;
  }, []);

  const getCurrentTimeMs = useCallback((): number => {
    return engineRef.current?.getCurrentTimeMs() ?? 0;
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
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
