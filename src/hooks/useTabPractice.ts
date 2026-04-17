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
  const startTimeMsRef = useRef(0);
  const animFrameRef = useRef(0);
  const allEventsRef = useRef<TimingEvent[]>([]);
  const phaseRef = useRef<TabSessionPhase>("idle");

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Total beats in the preset
  const totalBeats = preset.timeSignature.beatsPerMeasure * preset.measures;

  // Use a ref for the RAF loop to avoid circular dependency
  const processOnsetsRef = useRef<() => void>(() => {});

  useEffect(() => {
    processOnsetsRef.current = () => {
      if (!audioEngine?.isActive || phaseRef.current !== "playing") return;

      const buffer = audioEngine.getTimeDomainData();
      const timeMs = metronome.getCurrentTimeMs();
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

      animFrameRef.current = requestAnimationFrame(() => processOnsetsRef.current());
    };
  }, [audioEngine, metronome]);

  const handleBeat = useCallback(
    (beat: number) => {
      const beatInPattern = beat % totalBeats;
      setCurrentBeat(beatInPattern);

      // Loop boundary: when we wrap around to beat 0 again
      if (beat > 0 && beatInPattern === 0) {
        // Generate misses for previous loop
        const misses = generateMisses(targetsRef.current, hitBeatsRef.current);
        if (misses.length > 0) {
          allEventsRef.current = [...allEventsRef.current, ...misses];
          setTimingEvents((prev) => [...prev, ...misses]);
        }

        // Reset for next loop
        hitBeatsRef.current = new Set();
        const newStartMs = metronome.getCurrentTimeMs();
        startTimeMsRef.current = newStartMs;
        targetsRef.current = buildTimingTargets(
          preset.notes,
          preset.bpm,
          newStartMs,
        );
        setLoop((prev) => prev + 1);
      }
    },
    [totalBeats, metronome, preset],
  );

  // Register beat callback
  useEffect(() => {
    metronome.onBeat((beat) => handleBeat(beat));
  }, [metronome, handleBeat]);

  const startSession = useCallback(async () => {
    if (!audioEngine) return;

    // Reset state
    setTimingEvents([]);
    setCurrentBeat(-1);
    setLoop(0);
    setLastEvent(null);
    allEventsRef.current = [];
    hitBeatsRef.current = new Set();
    onsetDetectorRef.current.reset();

    setPhase("countdown");

    // Brief countdown then start
    await new Promise((resolve) => setTimeout(resolve, 500));

    setPhase("playing");

    // Start metronome first, then capture time
    await metronome.start();
    const startMs = metronome.getCurrentTimeMs();
    startTimeMsRef.current = startMs;
    targetsRef.current = buildTimingTargets(preset.notes, preset.bpm, startMs);

    // Start onset detection loop
    animFrameRef.current = requestAnimationFrame(() => processOnsetsRef.current());
  }, [audioEngine, metronome, preset]);

  const stopSession = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    metronome.stop();

    // Generate final misses
    const misses = generateMisses(targetsRef.current, hitBeatsRef.current);
    const finalEvents = [...allEventsRef.current, ...misses];
    allEventsRef.current = finalEvents;
    setTimingEvents(finalEvents);

    setPhase("finished");
  }, [metronome]);

  // Restart onset processing when phase changes to playing
  useEffect(() => {
    if (phase === "playing" && audioEngine?.isActive) {
      animFrameRef.current = requestAnimationFrame(() => processOnsetsRef.current());
    }
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, audioEngine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      metronome.stop();
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
