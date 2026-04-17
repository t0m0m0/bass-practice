import { useState, useRef, useCallback, useEffect } from "react";
import type { TabPreset, TimingEvent, TabSessionPhase } from "../types/practice";
import type { AudioEngine } from "../lib/audio/AudioEngine";
import { OnsetDetector } from "../lib/audio/onsetDetector";
import {
  buildTimingTargets,
  evaluateOnset,
  generateMisses,
  computeStats,
} from "../lib/practice/timingEvaluator";
import type { TimingTarget } from "../lib/practice/timingEvaluator";
import { useMetronome } from "./useMetronome";

export function useTabPractice(preset: TabPreset, audioEngine: AudioEngine | null) {
  const metronome = useMetronome(
    preset.bpm,
    preset.timeSignature.beatsPerMeasure,
    preset.timeSignature.beatUnit,
  );

  const [phase, setPhase] = useState<TabSessionPhase>("idle");
  const [timingEvents, setTimingEvents] = useState<TimingEvent[]>([]);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [loop, setLoop] = useState(0);
  const [lastEvent, setLastEvent] = useState<TimingEvent | null>(null);

  const onsetDetectorRef = useRef(new OnsetDetector());
  const targetsRef = useRef<TimingTarget[]>([]);
  const hitBeatsRef = useRef(new Set<number>());
  const animFrameRef = useRef(0);
  const allEventsRef = useRef<TimingEvent[]>([]);
  const phaseRef = useRef<TabSessionPhase>("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const totalBeats = preset.timeSignature.beatsPerMeasure * preset.measures;

  // Ref holds the latest loop body so we can drive a single RAF chain without
  // re-closing over stale state. Effects update the ref; the RAF schedules
  // `() => processOnsetsRef.current()`.
  const processOnsetsRef = useRef<() => void>(() => {});

  useEffect(() => {
    processOnsetsRef.current = () => {
      if (!audioEngine?.isActive || phaseRef.current !== "playing") return;

      const timeMs = metronome.getCurrentTimeMs();
      if (timeMs === null) {
        animFrameRef.current = requestAnimationFrame(() =>
          processOnsetsRef.current(),
        );
        return;
      }

      const buffer = audioEngine.getTimeDomainData();
      const onset = onsetDetectorRef.current.process(buffer, timeMs);

      if (onset) {
        const event = evaluateOnset(
          onset.timeMs,
          targetsRef.current,
          hitBeatsRef.current,
        );
        if (event) {
          hitBeatsRef.current.add(event.targetBeat);
          allEventsRef.current = [...allEventsRef.current, event];
          setTimingEvents((prev) => [...prev, event]);
          setLastEvent(event);
        }
      }

      animFrameRef.current = requestAnimationFrame(() =>
        processOnsetsRef.current(),
      );
    };
  }, [audioEngine, metronome]);

  const handleBeat = useCallback(
    (beat: number, timeSec: number) => {
      // Use the scheduled click time (up to SCHEDULE_AHEAD_S in the future)
      // rather than AudioContext.currentTime so timing targets align with the
      // audible click instead of lagging by up to 100ms.
      const beatTimeMs = timeSec * 1000;
      const beatInPattern = beat % totalBeats;
      setCurrentBeat(beatInPattern);

      // Beat 0 fires at both the very first beat and the start of each loop.
      if (beatInPattern === 0) {
        if (beat > 0) {
          const misses = generateMisses(targetsRef.current, hitBeatsRef.current);
          if (misses.length > 0) {
            allEventsRef.current = [...allEventsRef.current, ...misses];
            setTimingEvents((prev) => [...prev, ...misses]);
          }
          setLoop((prev) => prev + 1);
        }
        hitBeatsRef.current = new Set();
        // Use the engine's (possibly clamped) BPM so targets and clicks agree.
        targetsRef.current = buildTimingTargets(
          preset.notes,
          metronome.bpm,
          beatTimeMs,
        );
      }
    },
    [totalBeats, metronome, preset],
  );

  useEffect(() => {
    metronome.onBeat(handleBeat);
  }, [metronome, handleBeat]);

  const startSession = useCallback(async () => {
    setTimingEvents([]);
    setCurrentBeat(-1);
    setLoop(0);
    setLastEvent(null);
    allEventsRef.current = [];
    hitBeatsRef.current = new Set();
    targetsRef.current = [];
    onsetDetectorRef.current.reset();

    setPhase("countdown");
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      await metronome.start();
    } catch (err) {
      setPhase("idle");
      throw err;
    }
    // targetsRef is populated by handleBeat on the first beat callback.
    setPhase("playing");
  }, [metronome]);

  const stopSession = useCallback(async () => {
    cancelAnimationFrame(animFrameRef.current);
    await metronome.stop();

    const misses = generateMisses(targetsRef.current, hitBeatsRef.current);
    const finalEvents = [...allEventsRef.current, ...misses];
    allEventsRef.current = finalEvents;
    setTimingEvents(finalEvents);

    setPhase("finished");
  }, [metronome]);

  // Sole RAF driver: starts when we enter "playing" and cancels on exit.
  useEffect(() => {
    if (phase !== "playing" || !audioEngine?.isActive) return;
    animFrameRef.current = requestAnimationFrame(() =>
      processOnsetsRef.current(),
    );
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, audioEngine]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      void metronome.stop();
    };
  }, [metronome]);

  const stats = computeStats(timingEvents);

  return {
    phase,
    currentBeat,
    loop,
    timingEvents,
    lastEvent,
    stats,
    metronome: {
      bpm: metronome.bpm,
      setBpm: metronome.setBpm,
      isPlaying: metronome.isPlaying,
    },
    startSession,
    stopSession,
  };
}
