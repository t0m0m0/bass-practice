import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TabPracticePage } from "./TabPracticePage";
import { RhythmPracticePage } from "./RhythmPracticePage";

const audioState = {
  isListening: false,
  isStarting: false,
  isPermissionGranted: false,
  inputLevel: 0,
  availableDevices: [],
  selectedDeviceId: null,
  error: null as string | null,
  engine: null,
  clarityThreshold: 0.85,
  setClarityThreshold: vi.fn(),
  start: vi.fn<() => Promise<void>>(),
  stop: vi.fn(),
  switchDevice: vi.fn(),
};

const practiceState = {
  phase: "idle" as const,
  currentBeat: -1,
  loop: 0,
  timingEvents: [],
  currentLoopEvents: [],
  lastEvent: null,
  eventSeq: 0,
  combo: 0,
  maxCombo: 0,
  stats: {
    total: 0,
    hit: 0,
    perfect: 0,
    timingOnly: 0,
    miss: 0,
    early: 0,
    late: 0,
    accuracy: 0,
    pitchAccuracy: null,
  },
  metronome: {
    bpm: 120,
    isPlaying: false,
    setBpm: vi.fn(),
  },
  autoBpm: {
    config: { enabled: false, hitRateThreshold: 80, bpmIncrement: 5, maxBpm: 200 },
    startBpm: 120,
    levelUps: 0,
    notification: null,
    setEnabled: vi.fn(),
    setHitRateThreshold: vi.fn(),
    setBpmIncrement: vi.fn(),
    setMaxBpm: vi.fn(),
  },
  startSession: vi.fn<() => Promise<void>>(),
  stopSession: vi.fn(),
};

vi.mock("../hooks/useAudioInput", () => ({
  useAudioInput: () => audioState,
}));

vi.mock("../hooks/useTabPractice", () => ({
  useTabPractice: () => practiceState,
}));

vi.mock("../hooks/useCustomTabs", () => ({
  useCustomTabs: () => ({ tabs: [] }),
}));

vi.mock("../hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));

vi.mock("../components/practice/AsciiTabDisplay", () => ({
  AsciiTabDisplay: () => <div>AsciiTabDisplay</div>,
}));

vi.mock("../components/practice/AutoBpmControls", () => ({
  AutoBpmControls: () => <div>AutoBpmControls</div>,
}));

vi.mock("../components/practice/TimingFeedback", () => ({
  TimingFeedback: () => <div>TimingFeedback</div>,
}));

vi.mock("../components/practice/ComboDisplay", () => ({
  ComboDisplay: () => <div>ComboDisplay</div>,
}));

vi.mock("../components/practice/RhythmPatternDisplay", () => ({
  RhythmPatternDisplay: () => <div>RhythmPatternDisplay</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  audioState.isListening = false;
  audioState.isStarting = false;
  audioState.error = null;
  audioState.start.mockResolvedValue(undefined);
  practiceState.startSession.mockResolvedValue(undefined);
});

describe("practice start flow", () => {
  it("tab practice waits for microphone startup before starting the session", async () => {
    let resolveMic: (() => void) | undefined;
    audioState.start.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveMic = resolve;
        }),
    );

    render(
      <MemoryRouter initialEntries={["/practice/tab/c-major-scale"]}>
        <Routes>
          <Route path="/practice/tab/:presetId" element={<TabPracticePage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    await waitFor(() => expect(audioState.start).toHaveBeenCalledTimes(1));
    expect(practiceState.startSession).not.toHaveBeenCalled();

    resolveMic?.();

    await waitFor(() => expect(practiceState.startSession).toHaveBeenCalledTimes(1));
  });

  it("rhythm practice waits for microphone startup before starting the session", async () => {
    let resolveMic: (() => void) | undefined;
    audioState.start.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveMic = resolve;
        }),
    );

    render(
      <MemoryRouter initialEntries={["/practice/rhythm"]}>
        <Routes>
          <Route path="/practice/rhythm" element={<RhythmPracticePage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    await waitFor(() => expect(audioState.start).toHaveBeenCalledTimes(1));
    expect(practiceState.startSession).not.toHaveBeenCalled();

    resolveMic?.();

    await waitFor(() => expect(practiceState.startSession).toHaveBeenCalledTimes(1));
  });

  it("shows microphone startup errors instead of starting the session", async () => {
    audioState.start.mockRejectedValue(new Error("Permission denied"));

    render(
      <MemoryRouter initialEntries={["/practice/tab/c-major-scale"]}>
        <Routes>
          <Route path="/practice/tab/:presetId" element={<TabPracticePage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Permission denied");
    });
    expect(practiceState.startSession).not.toHaveBeenCalled();
  });
});
