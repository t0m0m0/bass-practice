import { AudioSetup } from "../components/audio/AudioSetup";
import { PitchDisplay } from "../components/audio/PitchDisplay";
import { SensitivitySlider } from "../components/audio/SensitivitySlider";
import { useAudioInput } from "../hooks/useAudioInput";
import { usePitchDetection } from "../hooks/usePitchDetection";
import { useMediaQuery } from "../hooks/useMediaQuery";

export function TunerPage() {
  const audio = useAudioInput();
  const { pitch } = usePitchDetection(audio.engine, audio.isListening);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div
      style={{
        padding: isDesktop ? "32px 32px" : "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {isDesktop ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          <PitchDisplay
            pitch={audio.isListening ? pitch : null}
            gaugeSize={320}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <AudioSetup
              isListening={audio.isListening}
              isStarting={audio.isStarting}
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
          </div>
        </div>
      ) : (
        <>
          <PitchDisplay pitch={audio.isListening ? pitch : null} />
          <AudioSetup
            isListening={audio.isListening}
            isStarting={audio.isStarting}
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
        </>
      )}
    </div>
  );
}
