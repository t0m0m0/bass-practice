import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AudioEngine } from "../lib/audio/AudioEngine";
import type { AudioInputState } from "../types/audio";

export function useAudioInput() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [state, setState] = useState<AudioInputState>({
    isPermissionGranted: false,
    isListening: false,
    selectedDeviceId: null,
    availableDevices: [],
    error: null,
    inputLevel: 0,
  });

  const levelAnimationRef = useRef<number>(0);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const startTokenRef = useRef<{ cancelled: boolean } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [clarityThreshold, setClarityThresholdState] = useState(0.85);

  const updateLevel = useCallback(() => {
    if (engineRef.current?.isActive) {
      const level = engineRef.current.getInputLevel();
      setState((prev) => ({ ...prev, inputLevel: level }));
      levelAnimationRef.current = requestAnimationFrame(updateLevel);
    }
  }, []);

  const start = useCallback(
    async (deviceId?: string) => {
      if (engineRef.current?.isActive) {
        setState((prev) => ({ ...prev, error: null }));
        return;
      }

      if (startPromiseRef.current) {
        return startPromiseRef.current;
      }

      const token = { cancelled: false };
      startTokenRef.current = token;

      const startPromise = (async () => {
        setIsStarting(true);
        try {
          const newEngine = new AudioEngine();
          await newEngine.start(deviceId);

          // If stop() was called while awaiting mic permission, discard this engine.
          if (token.cancelled) {
            await newEngine.stop();
            return;
          }
          engineRef.current = newEngine;
          setEngine(newEngine);

          const devices = await AudioEngine.enumerateDevices();
          if (token.cancelled) return;

          setState((prev) => ({
            ...prev,
            isPermissionGranted: true,
            isListening: true,
            selectedDeviceId: deviceId ?? null,
            availableDevices: devices,
            error: null,
          }));

          levelAnimationRef.current = requestAnimationFrame(updateLevel);
        } catch (err) {
          if (!token.cancelled) {
            setState((prev) => ({
              ...prev,
              error:
                err instanceof Error
                  ? err.message
                  : "Failed to access microphone",
            }));
          }
          throw err;
        } finally {
          startPromiseRef.current = null;
          if (startTokenRef.current === token) {
            startTokenRef.current = null;
          }
          setIsStarting(false);
        }
      })();

      startPromiseRef.current = startPromise;
      return startPromise;
    },
    [updateLevel],
  );

  const stop = useCallback(async () => {
    cancelAnimationFrame(levelAnimationRef.current);
    // Cancel any in-flight start() so it won't resurrect engine state.
    if (startTokenRef.current) {
      startTokenRef.current.cancelled = true;
      startTokenRef.current = null;
    }
    await engineRef.current?.stop();
    engineRef.current = null;
    startPromiseRef.current = null;
    setEngine(null);
    setIsStarting(false);
    setState((prev) => ({
      ...prev,
      isListening: false,
      inputLevel: 0,
    }));
  }, []);

  const switchDevice = useCallback(
    async (deviceId: string) => {
      await stop();
      await start(deviceId);
    },
    [start, stop],
  );

  useEffect(() => {
    return () => {
      cancelAnimationFrame(levelAnimationRef.current);
      if (startTokenRef.current) {
        startTokenRef.current.cancelled = true;
        startTokenRef.current = null;
      }
      startPromiseRef.current = null;
      engineRef.current?.stop();
      engineRef.current = null;
      setEngine(null);
    };
  }, []);

  const setClarityThreshold = useCallback((value: number) => {
    setClarityThresholdState(value);
    if (engineRef.current) {
      engineRef.current.clarityThreshold = value;
    }
  }, []);

  return useMemo(
    () => ({
      ...state,
      engine,
      isStarting,
      clarityThreshold,
      setClarityThreshold,
      start,
      stop,
      switchDevice,
    }),
    [
      state,
      engine,
      isStarting,
      clarityThreshold,
      setClarityThreshold,
      start,
      stop,
      switchDevice,
    ],
  );
}
