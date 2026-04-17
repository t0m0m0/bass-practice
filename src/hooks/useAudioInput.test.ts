import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioInput } from "./useAudioInput";
import { AudioEngine } from "../lib/audio/AudioEngine";

// AudioEngine モジュールをまるごとモック化
const mocks = vi.hoisted(() => ({
  engineStart: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  engineStop: vi.fn(),
  engineGetInputLevel: vi.fn().mockReturnValue(0),
  engineIsActive: false,
  enumerateDevices: vi.fn<() => Promise<MediaDeviceInfo[]>>().mockResolvedValue(
    [],
  ),
}));

// new AudioEngine() として呼ばれるため、arrow function ではなく function を使う
vi.mock("../lib/audio/AudioEngine", () => ({
  AudioEngine: Object.assign(
    vi.fn(function () {
      return {
        start: mocks.engineStart,
        stop: mocks.engineStop,
        getInputLevel: mocks.engineGetInputLevel,
        get isActive() {
          return mocks.engineIsActive;
        },
      };
    }),
    { enumerateDevices: mocks.enumerateDevices },
  ),
}));

describe("useAudioInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.engineStart.mockResolvedValue(undefined);
    mocks.engineIsActive = false;
    mocks.enumerateDevices.mockResolvedValue([]);
  });

  describe("初期状態", () => {
    it("isListening は false", () => {
      const { result } = renderHook(() => useAudioInput());
      expect(result.current.isListening).toBe(false);
    });

    it("isPermissionGranted は false", () => {
      const { result } = renderHook(() => useAudioInput());
      expect(result.current.isPermissionGranted).toBe(false);
    });

    it("error は null", () => {
      const { result } = renderHook(() => useAudioInput());
      expect(result.current.error).toBeNull();
    });

    it("inputLevel は 0", () => {
      const { result } = renderHook(() => useAudioInput());
      expect(result.current.inputLevel).toBe(0);
    });

    it("availableDevices は空配列", () => {
      const { result } = renderHook(() => useAudioInput());
      expect(result.current.availableDevices).toEqual([]);
    });

    it("engine は null", () => {
      const { result } = renderHook(() => useAudioInput());
      expect(result.current.engine).toBeNull();
    });
  });

  describe("start()", () => {
    it("start() 後は isListening が true になる", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      expect(result.current.isListening).toBe(true);
    });

    it("start() 後は isPermissionGranted が true になる", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      expect(result.current.isPermissionGranted).toBe(true);
    });

    it("start() 後は error が null のまま", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      expect(result.current.error).toBeNull();
    });

    it("deviceId を指定すると AudioEngine.start() に渡される", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start("device-xyz");
      });
      expect(mocks.engineStart).toHaveBeenCalledWith("device-xyz");
    });

    it("enumerateDevices() の結果が availableDevices に反映される", async () => {
      const mockDevices = [
        {
          kind: "audioinput",
          deviceId: "mic1",
          label: "Mic 1",
          groupId: "",
          toJSON: () => ({}),
        },
      ] as MediaDeviceInfo[];
      mocks.enumerateDevices.mockResolvedValue(mockDevices);

      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      expect(result.current.availableDevices).toEqual(mockDevices);
    });

    it("AudioEngine が例外を投げると error にセットされる", async () => {
      mocks.engineStart.mockRejectedValue(new Error("Permission denied"));
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      expect(result.current.error).toBe("Permission denied");
      expect(result.current.isListening).toBe(false);
    });

    it("Error 以外の例外はフォールバックメッセージを使う", async () => {
      mocks.engineStart.mockRejectedValue("unexpected");
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      expect(result.current.error).toBe("Failed to access microphone");
    });

    it("start() 後は engine が非 null になる（state として再レンダリングをトリガーする）", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      expect(result.current.engine).not.toBeNull();
    });
  });

  describe("stop()", () => {
    it("stop() 後は isListening が false になる", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      act(() => {
        result.current.stop();
      });
      expect(result.current.isListening).toBe(false);
    });

    it("stop() 後は inputLevel が 0 にリセットされる", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      act(() => {
        result.current.stop();
      });
      expect(result.current.inputLevel).toBe(0);
    });

    it("stop() で AudioEngine.stop() が呼ばれる", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      act(() => {
        result.current.stop();
      });
      expect(mocks.engineStop).toHaveBeenCalled();
    });

    it("stop() 後は engine が null になる", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      act(() => {
        result.current.stop();
      });
      expect(result.current.engine).toBeNull();
    });
  });

  describe("switchDevice()", () => {
    it("現在の engine を停止してから新しい deviceId で再起動する", async () => {
      const { result } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      await act(async () => {
        await result.current.switchDevice("device-new");
      });
      expect(mocks.engineStop).toHaveBeenCalled();
      expect(mocks.engineStart).toHaveBeenLastCalledWith("device-new");
      expect(result.current.isListening).toBe(true);
    });
  });

  describe("アンマウント時のクリーンアップ", () => {
    it("アンマウント時に AudioEngine.stop() が呼ばれる", async () => {
      const { result, unmount } = renderHook(() => useAudioInput());
      await act(async () => {
        await result.current.start();
      });
      unmount();
      expect(mocks.engineStop).toHaveBeenCalled();
    });

  });

  // AudioEngine がモックされていることの確認（型チェック用）
  it("AudioEngine コンストラクタが呼ばれる", async () => {
    const { result } = renderHook(() => useAudioInput());
    await act(async () => {
      await result.current.start();
    });
    expect(AudioEngine).toHaveBeenCalled();
  });
});
