import { AudioSetup } from "../components/audio/AudioSetup";
import { PitchDisplay } from "../components/audio/PitchDisplay";
import { SensitivitySlider } from "../components/audio/SensitivitySlider";
import { useAudioInput } from "../hooks/useAudioInput";
import { usePitchDetection } from "../hooks/usePitchDetection";

export function TunerPage() {
  const audio = useAudioInput();
  const { pitch } = usePitchDetection(audio.engine, audio.isListening);

  return (
    <div className="space-y-6">
      <AudioSetup
        isListening={audio.isListening}
        isPermissionGranted={audio.isPermissionGranted}
        inputLevel={audio.inputLevel}
        availableDevices={audio.availableDevices}
        selectedDeviceId={audio.selectedDeviceId}
        error={audio.error}
        onStart={audio.start}
        onStop={audio.stop}
        onSwitchDevice={audio.switchDevice}
      />

      <SensitivitySlider
        clarityThreshold={audio.clarityThreshold}
        onThresholdChange={audio.setClarityThreshold}
      />

      {audio.isListening && <PitchDisplay pitch={pitch} />}
    </div>
  );
}
