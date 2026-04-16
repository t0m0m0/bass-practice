import { AudioMeter } from "./AudioMeter";

interface AudioSetupProps {
  isListening: boolean;
  isPermissionGranted: boolean;
  inputLevel: number;
  availableDevices: MediaDeviceInfo[];
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
  error,
  onStart,
  onStop,
  onSwitchDevice,
}: AudioSetupProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-200">Audio Input</h2>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isListening ? (
          <button
            onClick={() => onStart()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium"
          >
            Start Listening
          </button>
        ) : (
          <button
            onClick={onStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
          >
            Stop
          </button>
        )}

        {isPermissionGranted && availableDevices.length > 0 && (
          <select
            onChange={(e) => onSwitchDevice(e.target.value)}
            className="bg-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm border border-slate-600 flex-1"
          >
            {availableDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Audio Input ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {isListening && <AudioMeter level={inputLevel} />}
    </div>
  );
}
