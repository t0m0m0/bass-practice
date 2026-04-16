export interface PitchResult {
  frequency: number;
  clarity: number;
  note: string | null;
  pitchClass: string | null;
  cents: number;
  timestamp: number;
}

export interface AudioInputState {
  isPermissionGranted: boolean;
  isListening: boolean;
  selectedDeviceId: string | null;
  availableDevices: MediaDeviceInfo[];
  error: string | null;
  inputLevel: number;
}
