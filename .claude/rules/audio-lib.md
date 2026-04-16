---
paths:
  - "src/lib/audio/**/*.ts"
---

# Audio Library Rules

- No React imports - these are pure TypeScript classes
- AudioEngine manages Web Audio API lifecycle (AudioContext, AnalyserNode, MediaStream)
- Audio constraints must disable echoCancellation, noiseSuppression, autoGainControl for accurate pitch detection
- PitchAnalyzer clarity threshold default: 0.9 (bass needs high confidence to avoid harmonics)
- Bass frequency range: 30-500 Hz (low B0 to ~B4)
- FFT size: 4096 for sufficient low-frequency resolution
- Detector instances should be reused (recreate only when buffer length changes)
