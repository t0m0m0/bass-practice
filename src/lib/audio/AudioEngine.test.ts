import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioEngine } from "./AudioEngine";

describe("AudioEngine", () => {
  // 各テストで参照できるようにスコープ外で宣言
  let mockAnalyser: {
    fftSize: number;
    getFloatTimeDomainData: ReturnType<typeof vi.fn>;
  };
  let mockTrackStop: ReturnType<typeof vi.fn>;
  let mockContextClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrackStop = vi.fn();
    mockContextClose = vi.fn();
    mockAnalyser = { fftSize: 0, getFloatTimeDomainData: vi.fn() };

    // new AudioContext() として呼ばれるため、arrow function ではなく function を使う
    vi.stubGlobal(
      "AudioContext",
      vi.fn(function () {
        return {
          sampleRate: 44100,
          state: "running",
          createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
          createMediaStreamSource: vi
            .fn()
            .mockReturnValue({ connect: vi.fn(), disconnect: vi.fn() }),
          close: mockContextClose,
        };
      }),
    );

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi
          .fn()
          .mockResolvedValue({
            getTracks: vi
              .fn()
              .mockReturnValue([{ stop: mockTrackStop }]),
          }),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      writable: true,
      configurable: true,
    });
  });

  describe("初期状態", () => {
    it("start() 前の sampleRate はデフォルト 48000 を返す", () => {
      const engine = new AudioEngine();
      expect(engine.sampleRate).toBe(48000);
    });

    it("start() 前は isActive が false", () => {
      const engine = new AudioEngine();
      expect(engine.isActive).toBe(false);
    });

    it("start() 前の getTimeDomainData は空の Float32Array を返す", () => {
      const engine = new AudioEngine();
      const data = engine.getTimeDomainData();
      expect(data).toBeInstanceOf(Float32Array);
      expect(data.length).toBe(0);
    });

    it("start() 前の getInputLevel は 0 を返す", () => {
      const engine = new AudioEngine();
      expect(engine.getInputLevel()).toBe(0);
    });
  });

  describe("start()", () => {
    it("getUserMedia をエコーキャンセル等 OFF で呼び出す", async () => {
      const engine = new AudioEngine();
      await engine.start();
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    });

    it("deviceId を指定すると constraints に含まれる", async () => {
      const engine = new AudioEngine();
      await engine.start("device-abc");
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          deviceId: { exact: "device-abc" },
        },
      });
    });

    it("start() 後は isActive が true", async () => {
      const engine = new AudioEngine();
      await engine.start();
      expect(engine.isActive).toBe(true);
    });

    it("start() 後の sampleRate は AudioContext の値を返す", async () => {
      const engine = new AudioEngine();
      await engine.start();
      expect(engine.sampleRate).toBe(44100);
    });

    it("AnalyserNode の fftSize を 4096 に設定する", async () => {
      const engine = new AudioEngine();
      await engine.start();
      expect(mockAnalyser.fftSize).toBe(4096);
    });
  });

  describe("stop()", () => {
    it("stop() 後は isActive が false", async () => {
      const engine = new AudioEngine();
      await engine.start();
      await engine.stop();
      expect(engine.isActive).toBe(false);
    });

    it("stop() でストリームのトラックを停止する", async () => {
      const engine = new AudioEngine();
      await engine.start();
      await engine.stop();
      expect(mockTrackStop).toHaveBeenCalled();
    });

    it("stop() で AudioContext を閉じる", async () => {
      const engine = new AudioEngine();
      await engine.start();
      await engine.stop();
      expect(mockContextClose).toHaveBeenCalled();
    });

    it("stop() 後の getTimeDomainData は空を返す", async () => {
      const engine = new AudioEngine();
      await engine.start();
      await engine.stop();
      expect(engine.getTimeDomainData().length).toBe(0);
    });
  });

  describe("getInputLevel()", () => {
    it("バッファがゼロ値のとき RMS は 0", async () => {
      // getFloatTimeDomainData は何もしない（デフォルト mock）→ バッファは全 0
      const engine = new AudioEngine();
      await engine.start();
      expect(engine.getInputLevel()).toBe(0);
    });

    it("バッファが全て 0.5 のとき RMS ≈ 0.5", async () => {
      mockAnalyser.getFloatTimeDomainData.mockImplementation(
        (buf: Float32Array) => buf.fill(0.5),
      );
      const engine = new AudioEngine();
      await engine.start();
      expect(engine.getInputLevel()).toBeCloseTo(0.5);
    });
  });

  describe("enumerateDevices()", () => {
    it("audioinput デバイスのみを返す", async () => {
      navigator.mediaDevices.enumerateDevices = vi.fn().mockResolvedValue([
        { kind: "audioinput", deviceId: "mic1", label: "Mic 1", groupId: "" },
        { kind: "videoinput", deviceId: "cam1", label: "Cam 1", groupId: "" },
        { kind: "audiooutput", deviceId: "spk1", label: "Spk 1", groupId: "" },
        { kind: "audioinput", deviceId: "mic2", label: "Mic 2", groupId: "" },
      ] as MediaDeviceInfo[]);

      const devices = await AudioEngine.enumerateDevices();
      expect(devices).toHaveLength(2);
      expect(devices.every((d) => d.kind === "audioinput")).toBe(true);
    });

    it("audioinput がない場合は空配列を返す", async () => {
      navigator.mediaDevices.enumerateDevices = vi.fn().mockResolvedValue([
        { kind: "videoinput", deviceId: "cam1", label: "Cam 1", groupId: "" },
      ] as MediaDeviceInfo[]);

      const devices = await AudioEngine.enumerateDevices();
      expect(devices).toHaveLength(0);
    });
  });
});
