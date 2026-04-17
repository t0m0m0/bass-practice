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

  // Keep a ref to the latest metronome so effects/callbacks can access
  // stable function references without re-firing cleanup.
  const metronomeRef = useRef(metronome);
  metronomeRef.current = metronome;

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

      const timeMs = metronomeRef.current.getCurrentTimeMs();
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
  }, [audioEngine]);

  const handleBeat = useCallback(
    (beat: number, timeSec: number) => {
      const beatTimeMs = timeSec * 1000;
      const beatInPattern = beat % totalBeats;
      setCurrentBeat(beatInPattern);

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
        targetsRef.current = buildTimingTargets(
          preset.notes,
          metronomeRef.current.bpm,
          beatTimeMs,
        );
      }
    },
    [totalBeats, preset],
  );

  useEffect(() => {
    metronome.onBeat(handleBeat);
  }, [metronome.onBeat, handleBeat]);

  const startSession = useCallback(async () => {
    setTimingEvents([]);
    setCurrentBeat(-1);
    setLoop(0);
    setLastEvent(null);
    allEventsRef.current = [];
    hitBeatsRef.current = new Set();
    targetsRef.current = [];
    onsetDetectorRef.current.reset();

    // Prepare AudioContext synchronously inside the click handler's call-stack
    // so the browser unlocks audio output before the async countdown gap.
    metronomeRef.current.initContext();

    setPhase("countdown");
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      await metronomeRef.current.start();
    } catch (err) {
      setPhase("idle");
      throw err;
    }
    setPhase("playing");
  }, []);

  const stopSession = useCallback(async () => {
    cancelAnimationFrame(animFrameRef.current);
    await metronomeRef.current.stop();

    const misses = generateMisses(targetsRef.current, hitBeatsRef.current);
    const finalEvents = [...allEventsRef.current, ...misses];
    allEventsRef.current = finalEvents;
    setTimingEvents(finalEvents);

    setPhase("finished");
  }, []);

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

  // Unmount-only cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      void metronomeRef.current.stop();
    };
  }, []);

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
