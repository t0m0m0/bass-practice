import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { MetronomeEngine } from "../lib/audio/MetronomeEngine";

type BeatCallback = (beat: number, time: number) => void;

export function useMetronome(initialBpm: number, beatsPerMeasure: number, beatUnit: number) {
  const engineRef = useRef<MetronomeEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState(initialBpm);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const externalCallbackRef = useRef<BeatCallback | null>(null);

  /** Create a MetronomeEngine and wire up the beat callback. */
  const ensureEngine = useCallback(() => {
    if (engineRef.current) return engineRef.current;

    const engine = new MetronomeEngine({ bpm: bpmRef.current, beatsPerMeasure, beatUnit });
    engine.onBeat((beat, time) => {
      externalCallbackRef.current?.(beat, time);
    });
    engineRef.current = engine;
    setBpmState(engine.bpm);
    return engine;
  }, [beatsPerMeasure, beatUnit]);

  /**
   * Prepare the AudioContext synchronously inside a user-gesture handler.
   * Call this before any async gap (e.g. countdown delay) so the browser
   * unlocks audio output.  `start()` will reuse the prepared context.
   */
  const initContext = useCallback(() => {
    const engine = ensureEngine();
    engine.initContext();
  }, [ensureEngine]);

  const start = useCallback(async () => {
    if (engineRef.current?.isPlaying) return;

    const engine = ensureEngine();
    try {
      await engine.start();
    } catch (err) {
      await engine.stop().catch(() => {});
      engineRef.current = null;
      throw err;
    }
    setIsPlaying(true);
  }, [ensureEngine]);

  const stop = useCallback(async () => {
    const engine = engineRef.current;
    engineRef.current = null;
    setIsPlaying(false);
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
      void engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  return useMemo(() => ({
    isPlaying,
    bpm,
    setBpm,
    initContext,
    start,
    stop,
    onBeat,
    getCurrentTimeMs,
  }), [isPlaying, bpm, setBpm, initContext, start, stop, onBeat, getCurrentTimeMs]);
}
