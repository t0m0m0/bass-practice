import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AudioSetup } from "./AudioSetup";

function makeDevice(deviceId: string, label: string): MediaDeviceInfo {
  return {
    deviceId,
    groupId: "group1",
    kind: "audioinput",
    label,
    toJSON: () => ({ deviceId, groupId: "group1", kind: "audioinput", label }),
  };
}

const defaultProps = {
  isListening: false,
  isPermissionGranted: false,
  inputLevel: 0,
  availableDevices: [],
  selectedDeviceId: null,
  error: null,
  onStart: vi.fn(),
  onStop: vi.fn(),
  onSwitchDevice: vi.fn(),
};

describe("AudioSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Start / Stop ボタン", () => {
    it("isListening=false のとき「Start Listening」ボタンを表示する", () => {
      render(<AudioSetup {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Start Listening" }),
      ).toBeInTheDocument();
    });

    it("isListening=true のとき「Stop」ボタンを表示する", () => {
      render(<AudioSetup {...defaultProps} isListening />);
      expect(
        screen.getByRole("button", { name: "Stop" }),
      ).toBeInTheDocument();
    });

    it("isListening=false のとき「Stop」ボタンを表示しない", () => {
      render(<AudioSetup {...defaultProps} />);
      expect(
        screen.queryByRole("button", { name: "Stop" }),
      ).not.toBeInTheDocument();
    });

    it("isListening=true のとき「Start Listening」ボタンを表示しない", () => {
      render(<AudioSetup {...defaultProps} isListening />);
      expect(
        screen.queryByRole("button", { name: "Start Listening" }),
      ).not.toBeInTheDocument();
    });

    it("「Start Listening」クリックで onStart() が呼ばれる", () => {
      const onStart = vi.fn();
      render(<AudioSetup {...defaultProps} onStart={onStart} />);
      fireEvent.click(screen.getByRole("button", { name: "Start Listening" }));
      expect(onStart).toHaveBeenCalledOnce();
    });

    it("「Stop」クリックで onStop() が呼ばれる", () => {
      const onStop = vi.fn();
      render(<AudioSetup {...defaultProps} isListening onStop={onStop} />);
      fireEvent.click(screen.getByRole("button", { name: "Stop" }));
      expect(onStop).toHaveBeenCalledOnce();
    });
  });

  describe("エラー表示", () => {
    it("error が null のときエラーメッセージを表示しない", () => {
      render(<AudioSetup {...defaultProps} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("error があるときメッセージを表示する", () => {
      render(
        <AudioSetup {...defaultProps} error="Permission denied" />,
      );
      expect(screen.getByText("Permission denied")).toBeInTheDocument();
    });
  });

  describe("デバイスセレクタ", () => {
    const devices = [
      makeDevice("mic1", "Built-in Mic"),
      makeDevice("mic2", "External Mic"),
    ];

    it("isPermissionGranted=false のときセレクタを表示しない", () => {
      render(
        <AudioSetup {...defaultProps} availableDevices={devices} />,
      );
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("availableDevices が空のときセレクタを表示しない", () => {
      render(
        <AudioSetup {...defaultProps} isPermissionGranted availableDevices={[]} />,
      );
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("isPermissionGranted=true かつ devices あり のときセレクタを表示する", () => {
      render(
        <AudioSetup
          {...defaultProps}
          isPermissionGranted
          availableDevices={devices}
        />,
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("デバイス名がオプションに列挙される", () => {
      render(
        <AudioSetup
          {...defaultProps}
          isPermissionGranted
          availableDevices={devices}
        />,
      );
      expect(screen.getByText("Built-in Mic")).toBeInTheDocument();
      expect(screen.getByText("External Mic")).toBeInTheDocument();
    });

    it("ラベルが空のデバイスは deviceId の先頭 8 文字で表示する", () => {
      const unlabeled = [makeDevice("abcdefghij", "")];
      render(
        <AudioSetup
          {...defaultProps}
          isPermissionGranted
          availableDevices={unlabeled}
        />,
      );
      expect(screen.getByText("Audio Input abcdefgh")).toBeInTheDocument();
    });

    it("selectedDeviceId がセレクタの value に反映される", () => {
      render(
        <AudioSetup
          {...defaultProps}
          isPermissionGranted
          availableDevices={devices}
          selectedDeviceId="mic2"
        />,
      );
      expect(screen.getByRole("combobox")).toHaveValue("mic2");
    });

    it("セレクタ変更で onSwitchDevice(deviceId) が呼ばれる", () => {
      const onSwitchDevice = vi.fn();
      render(
        <AudioSetup
          {...defaultProps}
          isPermissionGranted
          availableDevices={devices}
          onSwitchDevice={onSwitchDevice}
        />,
      );
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "mic2" },
      });
      expect(onSwitchDevice).toHaveBeenCalledWith("mic2");
    });
  });

  describe("AudioMeter の表示", () => {
    it("isListening=true のとき AudioMeter を表示する", () => {
      render(<AudioSetup {...defaultProps} isListening inputLevel={0.1} />);
      expect(screen.getByText("Input Level")).toBeInTheDocument();
    });

    it("isListening=false のとき AudioMeter を表示しない", () => {
      render(<AudioSetup {...defaultProps} />);
      expect(screen.queryByText("Input Level")).not.toBeInTheDocument();
    });
  });
});
