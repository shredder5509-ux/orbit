// Ambient sound generator using Web Audio API
// Generates soothing procedural audio — no external files needed

let audioCtx: AudioContext | null = null
let activeNodes: AudioNode[] = []
let masterGain: GainNode | null = null

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * seconds
  const buffer = ctx.createBuffer(2, length, sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3
    }
  }
  return buffer
}

function createBrownNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * seconds
  const buffer = ctx.createBuffer(2, length, sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (last + 0.02 * white) / 1.02
      last = data[i]
      data[i] *= 3.5
    }
  }
  return buffer
}

// Rain: brown noise filtered low + occasional "drip" clicks
function startRain(ctx: AudioContext, gain: GainNode) {
  // Base rain (filtered brown noise)
  const buffer = createBrownNoiseBuffer(ctx, 4)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const lpf = ctx.createBiquadFilter()
  lpf.type = 'lowpass'
  lpf.frequency.value = 800

  const hpf = ctx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 200

  const rainGain = ctx.createGain()
  rainGain.gain.value = 0.6

  source.connect(lpf).connect(hpf).connect(rainGain).connect(gain)
  source.start()
  activeNodes.push(source)

  // Light patter (higher noise)
  const patter = ctx.createBufferSource()
  patter.buffer = createNoiseBuffer(ctx, 4)
  patter.loop = true
  const patterFilter = ctx.createBiquadFilter()
  patterFilter.type = 'bandpass'
  patterFilter.frequency.value = 4000
  patterFilter.Q.value = 0.5
  const patterGain = ctx.createGain()
  patterGain.gain.value = 0.08
  patter.connect(patterFilter).connect(patterGain).connect(gain)
  patter.start()
  activeNodes.push(patter)
}

// Forest: layered oscillators for wind + birds-like chirps
function startForest(ctx: AudioContext, gain: GainNode) {
  // Wind base
  const windBuffer = createBrownNoiseBuffer(ctx, 6)
  const wind = ctx.createBufferSource()
  wind.buffer = windBuffer
  wind.loop = true
  const windFilter = ctx.createBiquadFilter()
  windFilter.type = 'lowpass'
  windFilter.frequency.value = 400
  const windGain = ctx.createGain()
  windGain.gain.value = 0.3
  wind.connect(windFilter).connect(windGain).connect(gain)
  wind.start()
  activeNodes.push(wind)

  // Gentle rustling
  const rustle = ctx.createBufferSource()
  rustle.buffer = createNoiseBuffer(ctx, 3)
  rustle.loop = true
  const rustleFilter = ctx.createBiquadFilter()
  rustleFilter.type = 'bandpass'
  rustleFilter.frequency.value = 2000
  rustleFilter.Q.value = 2
  const rustleGain = ctx.createGain()
  rustleGain.gain.value = 0.04

  // LFO for rustle volume (gentle swaying)
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.15
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.03
  lfo.connect(lfoGain).connect(rustleGain.gain)
  lfo.start()

  rustle.connect(rustleFilter).connect(rustleGain).connect(gain)
  rustle.start()
  activeNodes.push(wind, rustle, lfo)
}

// Ocean: low rumble with rhythmic "wave" volume modulation
function startOcean(ctx: AudioContext, gain: GainNode) {
  const buffer = createBrownNoiseBuffer(ctx, 8)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const lpf = ctx.createBiquadFilter()
  lpf.type = 'lowpass'
  lpf.frequency.value = 500

  const waveGain = ctx.createGain()
  waveGain.gain.value = 0.5

  // Wave rhythm LFO
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.08 // ~12 second wave cycle
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.3
  lfo.connect(lfoGain).connect(waveGain.gain)
  lfo.start()

  source.connect(lpf).connect(waveGain).connect(gain)
  source.start()
  activeNodes.push(source, lfo)

  // Foam/hiss layer
  const foam = ctx.createBufferSource()
  foam.buffer = createNoiseBuffer(ctx, 4)
  foam.loop = true
  const foamFilter = ctx.createBiquadFilter()
  foamFilter.type = 'highpass'
  foamFilter.frequency.value = 3000
  const foamGain = ctx.createGain()
  foamGain.gain.value = 0.05
  foam.connect(foamFilter).connect(foamGain).connect(gain)
  foam.start()
  activeNodes.push(foam)
}

// Space: deep drone with ethereal pad
function startSpace(ctx: AudioContext, gain: GainNode) {
  // Deep drone
  const drone1 = ctx.createOscillator()
  drone1.type = 'sine'
  drone1.frequency.value = 55 // low A
  const drone1Gain = ctx.createGain()
  drone1Gain.gain.value = 0.12
  drone1.connect(drone1Gain).connect(gain)
  drone1.start()

  const drone2 = ctx.createOscillator()
  drone2.type = 'sine'
  drone2.frequency.value = 82.5 // E
  const drone2Gain = ctx.createGain()
  drone2Gain.gain.value = 0.08
  drone2.connect(drone2Gain).connect(gain)
  drone2.start()

  // Slow detuned pad
  const pad = ctx.createOscillator()
  pad.type = 'triangle'
  pad.frequency.value = 110
  const padLfo = ctx.createOscillator()
  padLfo.frequency.value = 0.05
  const padLfoGain = ctx.createGain()
  padLfoGain.gain.value = 2
  padLfo.connect(padLfoGain).connect(pad.frequency)
  padLfo.start()
  const padGain = ctx.createGain()
  padGain.gain.value = 0.06
  pad.connect(padGain).connect(gain)
  pad.start()

  // Subtle shimmer noise
  const shimmer = ctx.createBufferSource()
  shimmer.buffer = createNoiseBuffer(ctx, 5)
  shimmer.loop = true
  const shimmerFilter = ctx.createBiquadFilter()
  shimmerFilter.type = 'bandpass'
  shimmerFilter.frequency.value = 6000
  shimmerFilter.Q.value = 5
  const shimmerGain = ctx.createGain()
  shimmerGain.gain.value = 0.015
  shimmer.connect(shimmerFilter).connect(shimmerGain).connect(gain)
  shimmer.start()

  activeNodes.push(drone1, drone2, pad, padLfo, shimmer)
}

// Café: brown noise mid-range hum + occasional murmur texture
function startCafe(ctx: AudioContext, gain: GainNode) {
  // Background chatter (filtered noise)
  const buffer = createNoiseBuffer(ctx, 6)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const bpf = ctx.createBiquadFilter()
  bpf.type = 'bandpass'
  bpf.frequency.value = 1500
  bpf.Q.value = 0.8

  const murmurGain = ctx.createGain()
  murmurGain.gain.value = 0.12

  // Gentle volume variation
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.2
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.04
  lfo.connect(lfoGain).connect(murmurGain.gain)
  lfo.start()

  source.connect(bpf).connect(murmurGain).connect(gain)
  source.start()

  // Low hum (air conditioning / ambience)
  const hum = ctx.createOscillator()
  hum.type = 'sine'
  hum.frequency.value = 120
  const humGain = ctx.createGain()
  humGain.gain.value = 0.03
  hum.connect(humGain).connect(gain)
  hum.start()

  activeNodes.push(source, lfo, hum)
}

const SOUND_STARTERS: Record<string, (ctx: AudioContext, gain: GainNode) => void> = {
  rain: startRain,
  forest: startForest,
  ocean: startOcean,
  space: startSpace,
  cafe: startCafe,
}

export function playAmbient(soundId: string, volume: number = 0.5) {
  stopAmbient()
  if (soundId === 'none') return

  const starter = SOUND_STARTERS[soundId]
  if (!starter) return

  const ctx = getContext()
  masterGain = ctx.createGain()
  masterGain.gain.value = volume
  masterGain.connect(ctx.destination)

  starter(ctx, masterGain)
}

export function setAmbientVolume(volume: number) {
  if (masterGain) {
    masterGain.gain.setTargetAtTime(volume, masterGain.context.currentTime, 0.1)
  }
}

export function stopAmbient() {
  activeNodes.forEach((node) => {
    try {
      if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
        node.stop()
      }
      node.disconnect()
    } catch {
      // Already stopped
    }
  })
  activeNodes = []
  if (masterGain) {
    masterGain.disconnect()
    masterGain = null
  }
}
