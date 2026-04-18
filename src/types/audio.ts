interface PitchDetected {
  detected: true;
  frequency: number;
  clarity: number;
  note: string;
  pitchClass: string;
  cents: number;
  timestamp: number;
}

interface PitchNotDetected {
  detected: false;
  frequency: number;
  clarity: number;
  cents: number;
  timestamp: number;
}

export type PitchResult = PitchDetected | PitchNotDetected;

export interface AudioInputState {
  isPermissionGranted: boolean;
  isListening: boolean;
  selectedDeviceId: string | null;
  availableDevices: MediaDeviceInfo[];
  error: string | null;
  inputLevel: number;
}
