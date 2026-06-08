// Web Audio API engine for cozy procedural ambient focus sounds
// Enables immersive rain, sea waves, and vinyl lo-fi chord pads without external track dependencies.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Track active audio resources for graceful cleanups
let noiseNode: AudioBufferSourceNode | null = null;
let vinylNode: AudioBufferSourceNode | null = null;
let waveLfo: OscillatorNode | null = null;
let chordsTimer: number | null = null;
let activePadGains: GainNode[] = [];

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  if (!masterGain) {
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
}

// Generate an AudioBuffer containing vinyl scratch static and random click impulses
function createVinylNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Continuous soft thermal hiss
    let val = (Math.random() * 2 - 1) * 0.015;
    
    // Crackle dust pops (random low rate impulses)
    if (Math.random() < 0.0001) {
      const impulseAmp = (Math.random() > 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.25);
      val += impulseAmp;
    }
    
    data[i] = val;
  }
  return buffer;
}

// Generate continuous pink-noise-like raw texture
function createNatureNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Pink-like noise generation algorithm (Voss-McCartney approximation)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = pink * 0.11; // normalizes amplitude level
  }
  return buffer;
}

// Play cozy ambient rain noise filtering pink noise, adding constant damp sound
function playRain(ctx: AudioContext, dest: AudioNode) {
  const buffer = createNatureNoiseBuffer(ctx, 4);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Filter out ultra high harsh pitch for a smooth rooftop rain effect
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(850, ctx.currentTime);

  const filterHigh = ctx.createBiquadFilter();
  filterHigh.type = "highpass";
  filterHigh.frequency.setValueAtTime(70, ctx.currentTime);

  source.connect(filterHigh);
  filterHigh.connect(filter);
  filter.connect(dest);
  
  source.start(0);
  noiseNode = source;
}

// Ocean tidal swells, slow modulation of volume and filter height using a 0.1Hz LFO
function playOcean(ctx: AudioContext, dest: AudioNode) {
  const buffer = createNatureNoiseBuffer(ctx, 6);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(450, ctx.currentTime);

  // Highpass rumble control
  const filterHigh = ctx.createBiquadFilter();
  filterHigh.type = "highpass";
  filterHigh.frequency.setValueAtTime(50, ctx.currentTime);

  // Master swell controller
  const swellGain = ctx.createGain();
  swellGain.gain.setValueAtTime(0.25, ctx.currentTime);

  // LFO at 0.08Hz to drive deep wave timing
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
  lfo.type = "sine";

  // Map LFO to swell volume & filter sweep
  const lfoGainVol = ctx.createGain();
  lfoGainVol.gain.setValueAtTime(0.20, ctx.currentTime);

  const lfoGainFreq = ctx.createGain();
  lfoGainFreq.gain.setValueAtTime(300, ctx.currentTime); // sweep filter range

  lfo.connect(lfoGainVol);
  lfoGainVol.connect(swellGain.gain);

  lfo.connect(lfoGainFreq);
  lfoGainFreq.connect(filter.frequency);

  source.connect(filterHigh);
  filterHigh.connect(filter);
  filter.connect(swellGain);
  swellGain.connect(dest);

  lfo.start(0);
  source.start(0);

  noiseNode = source;
  waveLfo = lfo;
}

// Lo-Fi mellow chords sequencer
// A warm chord progression using low pass filtered triangle/sine wave oscillators
const LOFI_CHORDS = [
  [146.83, 185.00, 220.00, 277.18], // Dmaj7: D3, F#3, A3, C#4
  [164.81, 220.00, 246.94, 293.66], // E7sus4: E3, A3, B3, D4
  [220.00, 277.18, 329.63, 415.30], // Amaj7: A3, C#4, E4, G#4
  [185.00, 220.00, 277.18, 329.63]  // F#m7: F#3, A3, C#4, E4
];

function playLofiProgressions(ctx: AudioContext, dest: AudioNode) {
  // Layer 1: continuous vintage stylus crackle
  const vinylBuffer = createVinylNoiseBuffer(ctx, 3);
  const vinylSource = ctx.createBufferSource();
  vinylSource.buffer = vinylBuffer;
  vinylSource.loop = true;

  const vinylFilter = ctx.createBiquadFilter();
  vinylFilter.type = "bandpass";
  vinylFilter.frequency.setValueAtTime(1200, ctx.currentTime);
  vinylFilter.Q.setValueAtTime(1.2, ctx.currentTime);

  const vinylGain = ctx.createGain();
  vinylGain.gain.setValueAtTime(0.04, ctx.currentTime); // gentle crackle background

  vinylSource.connect(vinylFilter);
  vinylFilter.connect(vinylGain);
  vinylGain.connect(dest);
  vinylSource.start(0);
  vinylNode = vinylSource;

  // Layer 2: Slow chord strummed progression loop
  let chordIndex = 0;

  function triggerNextChord() {
    if (!audioCtx || audioCtx.state === "suspended") return;
    const now = ctx.currentTime;
    const notes = LOFI_CHORDS[chordIndex];

    // Build soft electric piano sound for each note
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      osc.type = "sine"; // Pure tone base
      
      // Warm overdrive harmonic
      const waveHarmonic = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      waveHarmonic.type = "triangle";
      waveHarmonic.frequency.setValueAtTime(freq * 1, now);
      harmonicGain.gain.setValueAtTime(0.08, now);

      osc.frequency.setValueAtTime(freq, now);

      // Warm lowpass filter to remove harsh edge
      const fontFilter = ctx.createBiquadFilter();
      fontFilter.type = "lowpass";
      fontFilter.frequency.setValueAtTime(380, now);

      // Linear envelope to emulate lazy strings/keys decay
      // Stagger start slightly to strum notes in
      const noteOffset = idx * 0.08;
      const startTime = now + noteOffset;

      noteGain.gain.setValueAtTime(0.0, now);
      noteGain.gain.linearRampToValueAtTime(0.18, startTime + 0.4); // soft attack
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 4.8); // elegant long release

      osc.connect(fontFilter);
      waveHarmonic.connect(harmonicGain);
      harmonicGain.connect(fontFilter);

      fontFilter.connect(noteGain);
      noteGain.connect(dest);

      osc.start(startTime);
      waveHarmonic.start(startTime);

      osc.stop(startTime + 5.2);
      waveHarmonic.stop(startTime + 5.2);

      // Keep record of gains to clear if target changed
      activePadGains.push(noteGain);
    });

    chordIndex = (chordIndex + 1) % LOFI_CHORDS.length;
  }

  // Initial chord drop
  triggerNextChord();

  // Pulse chord every 5.5 seconds
  const interval = window.setInterval(triggerNextChord, 5500);
  chordsTimer = interval as any;
}

export function startAmbientSound(mode: 'none' | 'rain' | 'ocean' | 'lofi', val: number) {
  try {
    stopAmbientSound();
    if (mode === 'none') return;

    initAudio();
    if (!audioCtx || !masterGain) return;

    // Set master volume
    masterGain.gain.setValueAtTime(val, audioCtx.currentTime);

    if (mode === 'rain') {
      playRain(audioCtx, masterGain);
    } else if (mode === 'ocean') {
      playOcean(audioCtx, masterGain);
    } else if (mode === 'lofi') {
      playLofiProgressions(audioCtx, masterGain);
    }
  } catch (err) {
    console.warn("Failed starting ambient sound module:", err);
  }
}

export function updateAmbientVolume(val: number) {
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(val, audioCtx.currentTime);
  }
}

export function stopAmbientSound() {
  try {
    if (noiseNode) {
      noiseNode.stop();
      noiseNode.disconnect();
      noiseNode = null;
    }
    if (vinylNode) {
      vinylNode.stop();
      vinylNode.disconnect();
      vinylNode = null;
    }
    if (waveLfo) {
      waveLfo.stop();
      waveLfo.disconnect();
      waveLfo = null;
    }
    if (chordsTimer) {
      clearInterval(chordsTimer);
      chordsTimer = null;
    }
    // Damp active pad nodes
    activePadGains.forEach(gain => {
      try {
        gain.gain.cancelScheduledValues(0);
        gain.disconnect();
      } catch (e) {}
    });
    activePadGains = [];
  } catch (err) {
    console.warn("Ambient sounds cleanup warning:", err);
  }
}
