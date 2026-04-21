import { useState, useCallback, useRef, useMemo } from "react";
import type { TimingEvent } from "../types/practice";
import { computeStats } from "../lib/practice/timingEvaluator";

export interface AutoBpmConfig {
  enabled: boolean;
  hitRateThreshold: number; // 0-1, default 0.9
  bpmIncrement: number; // default 5
  maxBpm: number; // default 200
}

export interface AutoBpmState {
  config: AutoBpmConfig;
  /** The BPM we started from (before any auto-ups) */
  startBpm: number;
  /** Number of times BPM was auto-increased this session */
  levelUps: number;
  /** The notification message shown briefly when BPM increases */
  notification: string | null;
}

const DEFAULT_CONFIG: AutoBpmConfig = {
  enabled: false,
  hitRateThreshold: 0.9,
  bpmIncrement: 5,
  maxBpm: 200,
};

export function useAutoBpm(currentBpm: number, setBpm: (bpm: number) => void) {
  const [config, setConfig] = useState<AutoBpmConfig>(DEFAULT_CONFIG);
  const [levelUps, setLevelUps] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [startBpm, setStartBpm] = useState(currentBpm);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setEnabled = useCallback((enabled: boolean) => {
    setConfig((prev) => ({ ...prev, enabled }));
  }, []);

  const setHitRateThreshold = useCallback((hitRateThreshold: number) => {
    setConfig((prev) => ({ ...prev, hitRateThreshold }));
  }, []);

  const setBpmIncrement = useCallback((bpmIncrement: number) => {
    setConfig((prev) => ({ ...prev, bpmIncrement }));
  }, []);

  const setMaxBpm = useCallback((maxBpm: number) => {
    setConfig((prev) => ({ ...prev, maxBpm }));
  }, []);

  /**
   * Called at the end of each loop with that loop's timing events.
   * Returns the new BPM if it was increased, or null.
   */
  const evaluateLoop = useCallback(
    (loopEvents: TimingEvent[]): number | null => {
      if (!config.enabled || loopEvents.length === 0) return null;

      const stats = computeStats(loopEvents);
      if (stats.hitRate < config.hitRateThreshold) return null;

      const newBpm = Math.min(
        currentBpm + config.bpmIncrement,
        config.maxBpm,
      );
      if (newBpm <= currentBpm) return null; // already at max

      setBpm(newBpm);
      setLevelUps((prev) => prev + 1);

      const msg = `🎯 BPM UP! ${currentBpm} → ${newBpm}`;
      setNotification(msg);
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
      }, 2500);

      return newBpm;
    },
    [config, currentBpm, setBpm],
  );

  const resetSession = useCallback((bpm: number) => {
    setStartBpm(bpm);
    setLevelUps(0);
    setNotification(null);
    clearTimeout(notificationTimerRef.current);
  }, []);

  return useMemo(
    () => ({
      config,
      startBpm,
      levelUps,
      notification,
      setEnabled,
      setHitRateThreshold,
      setBpmIncrement,
      setMaxBpm,
      evaluateLoop,
      resetSession,
    }),
    [
      config,
      startBpm,
      levelUps,
      notification,
      setEnabled,
      setHitRateThreshold,
      setBpmIncrement,
      setMaxBpm,
      evaluateLoop,
      resetSession,
    ],
  );
}
