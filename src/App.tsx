import { AudioSetup } from "./components/audio/AudioSetup";
import { PitchDisplay } from "./components/audio/PitchDisplay";
import { SensitivitySlider } from "./components/audio/SensitivitySlider";
import { useAudioInput } from "./hooks/useAudioInput";
import { usePitchDetection } from "./hooks/usePitchDetection";

function App() {
  const audio = useAudioInput();
  const { pitch } = usePitchDetection(audio.engine, audio.isListening);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <header className="border-b border-slate-700 px-6 py-4">
        <h1 className="text-2xl font-bold">Bass Practice</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
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
      </main>
    </div>
  );
}

export default App;
