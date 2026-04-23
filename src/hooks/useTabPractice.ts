import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type {
  TabPreset,
  TimingEvent,
  TabSessionPhase,
  HitTimingEvent,
} from "../types/practice";
import type { AudioEngine } from "../lib/audio/AudioEngine";
import { OnsetDetector } from "../lib/audio/onsetDetector";
import {
  buildTimingTargets,
  evaluateOnset,
  generateMisses,
  computeStats,
} from "../lib/practice/timingEvaluator";
import type { TimingTarget } from "../lib/practice/timingEvaluator";
import { judgePitch } from "../lib/practice/pitchEvaluator";
import { useMetronome } from "./useMetronome";
import { useAutoBpm } from "./useAutoBpm";

export interface PitchJudgeConfig {
  enabled: boolean;
  toleranceCents: number;
}

/** Window after an onset during which we keep sampling pitch for its best estimate. */
const PITCH_SAMPLE_WINDOW_MS = 120;
/** Ignore initial ms of the onset's attack where pitch detection is unstable. */
const PITCH_ATTACK_SKIP_MS = 20;

interface PendingPitchSample {
  event: HitTimingEvent;
  onsetTimeMs: number;
  bestFrequency: number | null;
  bestClarity: number;
}

export function useTabPractice(
  preset: TabPreset,
  audioEngine: AudioEngine | null,
  pitchJudge: PitchJudgeConfig = { enabled: true, toleranceCents: 50 },
) {
  const metronome = useMetronome(
    preset.bpm,
    preset.timeSignature.beatsPerMeasure,
    preset.timeSignature.beatUnit,
  );

  const autoBpm = useAutoBpm(metronome.bpm, metronome.setBpm);
  const autoBpmRef = useRef(autoBpm);
  useEffect(() => {
    autoBpmRef.current = autoBpm;
  }, [autoBpm]);

  // Ref keeps the latest metronome value so callbacks/effects can access it
  // without depending on the metronome object identity (which triggers
  // cleanup effects and causes AudioContext to be destroyed mid-session).
  const metronomeRef = useRef(metronome);
  useEffect(() => {
    metronomeRef.current = metronome;
  }, [metronome]);

  const [phase, setPhase] = useState<TabSessionPhase>("idle");
  const [timingEvents, setTimingEvents] = useState<TimingEvent[]>([]);
  // Events observed within the current loop only. Consumers that want a
  // per-loop visualisation (scatter, per-step highlight) should use this
  // instead of `timingEvents`, which accumulates across all loops.
  const [currentLoopEvents, setCurrentLoopEvents] = useState<TimingEvent[]>([]);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [loop, setLoop] = useState(0);
  const [lastEvent, setLastEvent] = useState<TimingEvent | null>(null);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  // Monotonic counter bumped on every judged event. Consumers (animations,
  // combo popups) can key on this to retrigger effects even when the same
  // judgment repeats in a row.
  const [eventSeq, setEventSeq] = useState(0);

  const onsetDetectorRef = useRef(new OnsetDetector());
  // Ref-mirrored combo counters so we can update them synchronously
  // inside the RAF onset loop without relying on state updater side
  // effects (which can double-fire under StrictMode).
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const targetsRef = useRef<TimingTarget[]>([]);
  const hitBeatsRef = useRef(new Set<number>());
  const animFrameRef = useRef(0);
  const allEventsRef = useRef<TimingEvent[]>([]);
  const loopEventsRef = useRef<TimingEvent[]>([]);
  const phaseRef = useRef<TabSessionPhase>("idle");
  const pendingPitchRef = useRef<PendingPitchSample[]>([]);
  const pitchJudgeRef = useRef(pitchJudge);

  // Replace a pending hit event with one that now carries pitch info.
  // Stored in a ref so the RAF loop always invokes the latest closure
  // (accessing up-to-date state setters) without extra dependencies.
  const finalizePitchSampleRef = useRef<(s: PendingPitchSample) => void>(
    () => {},
  );
  useEffect(() => {
    finalizePitchSampleRef.current = (sample: PendingPitchSample) => {
      const cfg = pitchJudgeRef.current;
      const result = judgePitch(
        sample.bestFrequency,
        sample.event.expectedFrequency,
        cfg.toleranceCents,
      );

      // If original already escalated to early/late, keep that judgment;
      // only "hit" (on-time) is split into perfect / timing-only.
      const updated: HitTimingEvent = { ...sample.event };
      updated.detectedFrequency = sample.bestFrequency;
      updated.pitchCents = result?.pitchCents ?? null;
      if (sample.event.judgment === "hit" && result != null) {
        updated.judgment = result.correct ? "perfect" : "timing-only";
      }

      const replace = (e: TimingEvent) => (e === sample.event ? updated : e);
      allEventsRef.current = allEventsRef.current.map(replace);
      loopEventsRef.current = loopEventsRef.current.map(replace);
      setTimingEvents((prev) => prev.map(replace));
      setCurrentLoopEvents((prev) => prev.map(replace));
      setLastEvent((prev) => (prev === sample.event ? updated : prev));
    };
  });
  useEffect(() => {
    pitchJudgeRef.current = pitchJudge;
  }, [pitchJudge]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const totalBeats = preset.timeSignature.beatsPerMeasure * preset.measures;

  // --- Onset detection RAF loop ---
  // Ref holds the latest loop body so we can drive a single RAF chain
  // without re-closing over stale state.
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
          loopEventsRef.current = [...loopEventsRef.current, event];
          setTimingEvents((prev) => [...prev, event]);
          setCurrentLoopEvents((prev) => [...prev, event]);
          setLastEvent(event);
          setEventSeq((n) => n + 1);
          // Combo: on-time hits extend the streak (the initial judgment is
          // always "hit" here; pitch finalize may later upgrade it to
          // "perfect" or downgrade to "timing-only" — both keep the streak).
          // Early / late break it immediately. Miss is handled at the loop
          // boundary flush below.
          if (event.judgment === "hit") {
            const next = comboRef.current + 1;
            comboRef.current = next;
            setCombo(next);
            if (next > maxComboRef.current) {
              maxComboRef.current = next;
              setMaxCombo(next);
            }
          } else {
            comboRef.current = 0;
            setCombo(0);
          }

          // Queue for post-onset pitch sampling. Pitch right at the attack
          // is noisy, so we skip the first few ms and keep the highest-clarity
          // result across the sampling window.
          // Only "hit" (on-time) is eligible for pitch evaluation; early/late
          // are excluded so pitchAccuracy stats stay consistent with the
          // "成功判定の中での音程精度" semantics (see PR #52 comment).
          if (
            pitchJudgeRef.current.enabled &&
            event.expectedFrequency != null &&
            event.judgment === "hit"
          ) {
            pendingPitchRef.current = [
              ...pendingPitchRef.current,
              {
                event,
                onsetTimeMs: timeMs,
                bestFrequency: null,
                bestClarity: 0,
              },
            ];
          }
        }
      }

      // Process pending pitch samples: update best candidate and finalize
      // when the sampling window has elapsed.
      if (pendingPitchRef.current.length > 0) {
        const remaining: PendingPitchSample[] = [];
        for (const sample of pendingPitchRef.current) {
          const elapsed = timeMs - sample.onsetTimeMs;
          if (elapsed >= PITCH_ATTACK_SKIP_MS && elapsed < PITCH_SAMPLE_WINDOW_MS) {
            const p = audioEngine.detectPitch();
            if (p.detected && p.clarity > sample.bestClarity) {
              sample.bestClarity = p.clarity;
              sample.bestFrequency = p.frequency;
            }
          }
          if (elapsed >= PITCH_SAMPLE_WINDOW_MS) {
            finalizePitchSampleRef.current(sample);
          } else {
            remaining.push(sample);
          }
        }
        pendingPitchRef.current = remaining;
      }

      animFrameRef.current = requestAnimationFrame(() =>
        processOnsetsRef.current(),
      );
    };
  }, [audioEngine]);

  // Start / stop the RAF loop based on phase.
  useEffect(() => {
    if (phase !== "playing" || !audioEngine?.isActive) return;
    animFrameRef.current = requestAnimationFrame(() =>
      processOnsetsRef.current(),
    );
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, audioEngine]);

  // --- Beat handling ---
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
            loopEventsRef.current = [...loopEventsRef.current, ...misses];
            setTimingEvents((prev) => [...prev, ...misses]);
            setCurrentLoopEvents((prev) => [...prev, ...misses]);
            // Surface the latest miss so the tab overlay can render a
            // red fade-out on the missed beat (AsciiTabDisplay keys its
            // miss-fade on lastEvent.judgment === "miss").
            setLastEvent(misses[misses.length - 1]);
            comboRef.current = 0;
            setCombo(0);
            setEventSeq((n) => n + misses.length);
          }

          // Evaluate auto-BPM at loop boundary. Pass the freshly-observed
          // BPM from the ref, not a closed-over state value, so consecutive
          // BPM UPs compound correctly across loops.
          autoBpmRef.current.evaluateLoop(
            loopEventsRef.current,
            metronomeRef.current.bpm,
          );
          loopEventsRef.current = [];

          setLoop((prev) => prev + 1);
          // Reset per-loop events so the next loop starts with a blank
          // visualisation (no stale hit/miss colours from the previous pass).
          setCurrentLoopEvents([]);
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
  }, [metronome, handleBeat]);

  // --- Session lifecycle ---
  const startSession = useCallback(async () => {
    setTimingEvents([]);
    setCurrentLoopEvents([]);
    setCurrentBeat(-1);
    setLoop(0);
    setLastEvent(null);
    comboRef.current = 0;
    maxComboRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    setEventSeq(0);
    allEventsRef.current = [];
    loopEventsRef.current = [];
    hitBeatsRef.current = new Set();
    targetsRef.current = [];
    pendingPitchRef.current = [];
    onsetDetectorRef.current.reset();
    autoBpmRef.current.resetSession(metronomeRef.current.bpm);

    // Prepare AudioContext synchronously inside the click handler's
    // call-stack so the browser unlocks audio output before the async gap.
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

  // Unmount-only cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      void metronomeRef.current.stop();
    };
  }, []);

  const stats = useMemo(() => computeStats(timingEvents), [timingEvents]);

  const metronomeSlice = useMemo(
    () => ({
      bpm: metronome.bpm,
      setBpm: metronome.setBpm,
      isPlaying: metronome.isPlaying,
    }),
    [metronome.bpm, metronome.setBpm, metronome.isPlaying],
  );

  return useMemo(
    () => ({
      phase,
      currentBeat,
      loop,
      timingEvents,
      currentLoopEvents,
      lastEvent,
      eventSeq,
      combo,
      maxCombo,
      stats,
      metronome: metronomeSlice,
      autoBpm,
      startSession,
      stopSession,
    }),
    [phase, currentBeat, loop, timingEvents, currentLoopEvents, lastEvent, eventSeq, combo, maxCombo, stats, metronomeSlice, autoBpm, startSession, stopSession],
  );
}
