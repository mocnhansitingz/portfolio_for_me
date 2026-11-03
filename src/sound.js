let audioContext;
let masterGain;
let soundEnabled = true;
let musicTimer = null;

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
  if (masterGain) {
    masterGain.gain.value = soundEnabled ? 0.12 : 0;
  }
  if (!soundEnabled) {
    stopBackgroundMusic();
  }
}

function ensureAudio() {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;

  if (!audioContext) {
    audioContext = new AudioCtor();
    masterGain = audioContext.createGain();
    masterGain.gain.value = soundEnabled ? 0.12 : 0;
    masterGain.connect(audioContext.destination);
  }

  return audioContext;
}

export function unlockAudio() {
  const ctx = ensureAudio();
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

export function playTone({
  frequency = 440,
  duration = 0.12,
  type = "triangle",
  volume = 0.16,
  slideTo,
}) {
  if (!soundEnabled) return;

  const ctx = unlockAudio();
  if (!ctx || !masterGain) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = ctx.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  if (typeof slideTo === "number") {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, slideTo),
      startTime + duration,
    );
  }

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(masterGain);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

export function playUiSound(kind = "tap") {
  const soundMap = {
    tap: [440, 0.08, "triangle", 0.08, 520],
    select: [280, 0.1, "square", 0.07, 340],
    open: [520, 0.12, "triangle", 0.1, 680],
    back: [380, 0.12, "sawtooth", 0.08, 250],
    close: [220, 0.14, "square", 0.08, 160],
    success: [620, 0.14, "triangle", 0.12, 760],
    game: [180, 0.06, "square", 0.05, 220],
    cassette: [210, 0.14, "square", 0.09, 140],
    adventure: [392, 0.18, "triangle", 0.04, 520],
  };

  const preset = soundMap[kind] ?? soundMap.tap;
  const [frequency, duration, type, volume, slideTo] = preset;

  playTone({ frequency, duration, type, volume, slideTo });
}

export function stopBackgroundMusic() {
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}

export function startBackgroundMusic() {
  if (!soundEnabled) return;
  if (musicTimer) return;

  const motif = [
    [392, 0.22, "triangle", 0.04],
    [523.25, 0.2, "triangle", 0.04],
    [659.25, 0.24, "triangle", 0.05],
    [523.25, 0.26, "triangle", 0.04],
    [587.33, 0.22, "square", 0.03],
    [659.25, 0.24, "square", 0.03],
    [783.99, 0.3, "triangle", 0.05],
  ];

  const playLoop = () => {
    if (!soundEnabled) return;
    motif.forEach(([frequency, duration, type, volume], index) => {
      setTimeout(() => {
        if (!soundEnabled) return;
        playTone({
          frequency,
          duration,
          type,
          volume,
          slideTo: frequency * 1.06,
        });
      }, index * 180);
    });

    musicTimer = setTimeout(playLoop, 2200);
  };

  playLoop();
}
