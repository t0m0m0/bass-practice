import { useState, useRef, useCallback, useEffect } from "react";
import { MetronomeEngine } from "../lib/audio/MetronomeEngine";

type BeatCallback = (beat: number, time: number) => void;

export function useMetronome(initialBpm: number, beatsPerMeasure: number, beatUnit: number) {
  const engineRef = useRef<MetronomeEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [bpm, setBpmState] = useState(initialBpm);
  const externalCallbackRef = useRef<BeatCallback | null>(null);

  /**
   * Prepare the AudioContext synchronously inside a user-gesture handler.
   * Call this before any async gap (e.g. countdown delay) so the browser
   * unlocks audio output.  `start()` will reuse the prepared context.
   */
  const initContext = useCallback(() => {
    if (engineRef.current) return;
    const engine = new MetronomeEngine({ bpm, beatsPerMeasure, beatUnit });
    engine.onBeat((beat, time) => {
      setCurrentBeat(beat);
      externalCallbackRef.current?.(beat, time);
    });
    engine.initContext();
    engineRef.current = engine;
    setBpmState(engine.bpm);
  }, [bpm, beatsPerMeasure, beatUnit]);

  const start = useCallback(async () => {
    if (engineRef.current?.isPlaying) return;

    // If initContext wasn't called beforehand, create the engine now.
    if (!engineRef.current) {
      const engine = new MetronomeEngine({ bpm, beatsPerMeasure, beatUnit });
      engine.onBeat((beat, time) => {
        setCurrentBeat(beat);
        externalCallbackRef.current?.(beat, time);
      });
      engineRef.current = engine;
      setBpmState(engine.bpm);
    }

    try {
      await engineRef.current.start();
    } catch (err) {
      // Make sure we don't leak a half-initialized AudioContext.
      await engineRef.current.stop().catch(() => {});
      engineRef.current = null;
      throw err;
    }

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
    initContext,
    start,
    stop,
    onBeat,
    getCurrentTimeMs,
  };
}
