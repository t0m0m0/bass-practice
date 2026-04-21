import { useState, useCallback, useRef, useMemo, useEffect } from "react";
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

const NOTIFICATION_DURATION_MS = 2500;

export function useAutoBpm(initialBpm: number, setBpm: (bpm: number) => void) {
  const [config, setConfig] = useState<AutoBpmConfig>(DEFAULT_CONFIG);
  const [levelUps, setLevelUps] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [startBpm, setStartBpm] = useState(initialBpm);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Mirror config + setBpm into refs so `evaluateLoop` stays referentially
  // stable across renders. This avoids cascading effect re-runs in the
  // caller (useTabPractice wraps the hook's return in an autoBpmRef).
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  const setBpmRef = useRef(setBpm);
  useEffect(() => {
    setBpmRef.current = setBpm;
  }, [setBpm]);

  // Clean up pending notification timer on unmount to avoid setting state
  // on an unmounted component (e.g. navigating away right after a BPM UP).
  useEffect(() => {
    return () => {
      clearTimeout(notificationTimerRef.current);
    };
  }, []);

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
   * Called at the end of each loop with that loop's timing events and the
   * freshly-observed BPM. The caller MUST pass `currentBpm` from a ref so
   * consecutive loop boundaries always see the latest value (state updates
   * from a previous BPM UP may not have propagated through the hook yet).
   * Returns the new BPM if it was increased, or null.
   */
  const evaluateLoop = useCallback(
    (loopEvents: TimingEvent[], currentBpm: number): number | null => {
      const cfg = configRef.current;
      if (!cfg.enabled || loopEvents.length === 0) return null;

      const stats = computeStats(loopEvents);
      if (stats.hitRate < cfg.hitRateThreshold) return null;

      const newBpm = Math.min(currentBpm + cfg.bpmIncrement, cfg.maxBpm);
      if (newBpm <= currentBpm) return null; // already at max

      setBpmRef.current(newBpm);
      setLevelUps((prev) => prev + 1);

      setNotification(`🎯 BPM UP! ${currentBpm} → ${newBpm}`);
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
      }, NOTIFICATION_DURATION_MS);

      return newBpm;
    },
    [],
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
