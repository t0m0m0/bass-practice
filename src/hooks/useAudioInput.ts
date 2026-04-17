import { useState, useRef, useCallback, useEffect } from "react";
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
      try {
        const newEngine = new AudioEngine();
        await newEngine.start(deviceId);
        engineRef.current = newEngine;
        setEngine(newEngine);

        const devices = await AudioEngine.enumerateDevices();

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
        setState((prev) => ({
          ...prev,
          error:
            err instanceof Error ? err.message : "Failed to access microphone",
        }));
      }
    },
    [updateLevel],
  );

  const stop = useCallback(async () => {
    cancelAnimationFrame(levelAnimationRef.current);
    await engineRef.current?.stop();
    engineRef.current = null;
    setEngine(null);
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

  return {
    ...state,
    engine,
    clarityThreshold,
    setClarityThreshold,
    start,
    stop,
    switchDevice,
  };
}
