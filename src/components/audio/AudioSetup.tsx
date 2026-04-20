import { AudioMeter } from "./AudioMeter";
import { Card, FilledButton, OutlinedButton } from "../md3";

interface AudioSetupProps {
  isListening: boolean;
  isPermissionGranted: boolean;
  inputLevel: number;
  availableDevices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  error: string | null;
  onStart: (deviceId?: string) => void;
  onStop: () => void;
  onSwitchDevice: (deviceId: string) => void;
}

export function AudioSetup({
  isListening,
  isPermissionGranted,
  inputLevel,
  availableDevices,
  selectedDeviceId,
  error,
  onStart,
  onStop,
  onSwitchDevice,
}: AudioSetupProps) {
  return (
    <Card style={{ padding: 20 }}>
      <div
        style={{
          font: "500 16px/1 Roboto, sans-serif",
          color: "var(--md-on-surface)",
          marginBottom: 16,
        }}
      >
        Audio Input
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: "#ef53501a",
            border: "1px solid #ef535066",
            color: "#ef5350",
            borderRadius: 8,
            padding: "10px 14px",
            font: "400 13px/1.5 Roboto, sans-serif",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {isPermissionGranted && availableDevices.length > 0 && (
        <select
          value={selectedDeviceId ?? ""}
          onChange={(e) => onSwitchDevice(e.target.value)}
          style={{
            width: "100%",
            background: "var(--md-surface-container)",
            border: "1px solid var(--md-outline-variant)",
            borderRadius: 8,
            padding: "12px 16px",
            font: "400 14px/1 Roboto, sans-serif",
            color: "var(--md-on-surface)",
            marginBottom: 16,
          }}
        >
          {availableDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Audio Input ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      )}

      {isListening && (
        <div style={{ marginBottom: 16 }}>
          <AudioMeter level={inputLevel} />
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        {!isListening ? (
          <FilledButton
            label="Start Listening"
            icon="🎤"
            onClick={() => onStart()}
            style={{ flex: 1, justifyContent: "center" }}
          />
        ) : (
          <OutlinedButton
            label="Stop"
            icon="⏹"
            onClick={onStop}
            style={{ flex: 1, justifyContent: "center" }}
          />
        )}
      </div>
    </Card>
  );
}
