import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Play, Pause, SkipForward, Volume2, X } from 'lucide-react'
import { useUserStore } from '../stores/userStore'
import { useDataStore } from '../stores/dataStore'
import { playAmbient, stopAmbient, setAmbientVolume } from '../services/ambientAudio'

const PRESETS = [
  { label: '25 min', studyMins: 25, breakMins: 5 },
  { label: '45 min', studyMins: 45, breakMins: 10 },
  { label: '60 min', studyMins: 60, breakMins: 15 },
]

const SOUNDS = [
  { id: 'none', label: 'None', emoji: '🔇' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'forest', label: 'Forest', emoji: '🌲' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'space', label: 'Space', emoji: '🚀' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
]

type FocusState = 'setup' | 'studying' | 'break' | 'complete'

// Atmospheric neon lights background
// Setup screen — purple gradient (no image)
function SetupScene() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1040] via-[#2d1a5e] to-[#1a0e3a]" />
      {/* Subtle glow spots */}
      <div className="absolute top-[20%] left-[30%] w-64 h-64 rounded-full bg-purple-500/8 blur-3xl" />
      <div className="absolute bottom-[20%] right-[20%] w-48 h-48 rounded-full bg-pink-500/6 blur-3xl" />
      <div className="absolute top-[60%] left-[60%] w-32 h-32 rounded-full bg-violet-400/5 blur-2xl" />
    </div>
  )
}

// Active timer — dreamy balcony photo
function NeonScene({ isBreak = false }: { isBreak?: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/focus-bg.jpg)' }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Break mode — lighten slightly */}
      {isBreak && (
        <div className="absolute inset-0 bg-green-900/10 transition-colors duration-1000" />
      )}

      {/* Bottom fog */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0a0e2a]/80 to-transparent" />
    </div>
  )
}

export function FocusModePage() {
  const navigate = useNavigate()
  const { tutorName } = useUserStore()
  const { addStudyMinutes } = useDataStore()

  const [focusState, setFocusState] = useState<FocusState>('setup')
  const [preset, setPreset] = useState(0)
  const [sound, setSound] = useState('none')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionsCompleted, setSessions] = useState(0)
  const [totalStudied, setTotalStudied] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const { studyMins, breakMins } = PRESETS[preset]

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      stopAmbient()
    }
  }, [])

  useEffect(() => {
    if (focusState === 'studying' && !isPaused) {
      playAmbient(sound, volume)
    } else if (focusState === 'break') {
      setAmbientVolume(volume * 0.3)
    } else if (focusState === 'complete' || focusState === 'setup') {
      stopAmbient()
    }
  }, [sound, focusState, isPaused])

  useEffect(() => {
    if (focusState === 'studying') {
      if (isPaused) setAmbientVolume(0)
      else setAmbientVolume(volume)
    }
  }, [isPaused, volume, focusState])

  useEffect(() => {
    if (focusState === 'studying' && !isPaused) setAmbientVolume(volume)
  }, [volume, focusState, isPaused])

  useEffect(() => {
    if ((focusState === 'studying' || focusState === 'break') && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current)
            if (focusState === 'studying') {
              setTotalStudied((s) => s + studyMins)
              addStudyMinutes(studyMins)
              setSessions((s) => s + 1)
              setFocusState('break')
              setTimeLeft(breakMins * 60)
            } else {
              setFocusState(sessionsCompleted >= 3 ? 'complete' : 'studying')
              setTimeLeft(studyMins * 60)
            }
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [focusState, isPaused, timeLeft, studyMins, breakMins, sessionsCompleted, addStudyMinutes])

  const startFocus = () => {
    // Start audio from user click handler (required by browsers)
    if (sound !== 'none') {
      playAmbient(sound, volume)
    }
    setTimeLeft(studyMins * 60)
    setFocusState('studying')
    setIsPaused(false)
    setSessions(0)
    setTotalStudied(0)
  }

  const skipBreak = () => {
    setFocusState('studying')
    setTimeLeft(studyMins * 60)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = focusState === 'studying'
    ? 1 - timeLeft / (studyMins * 60)
    : focusState === 'break'
    ? 1 - timeLeft / (breakMins * 60)
    : 0

  // Setup screen
  if (focusState === 'setup') {
    return (
      <div className="min-h-screen relative flex flex-col">
        <SetupScene />

        {/* Header */}
        <div className="relative z-10 px-4 py-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-sm mx-auto">
          <h1 className="text-xl font-semibold text-white mb-1 tracking-tight">Focus Mode</h1>
          <p className="text-[12px] text-white/40 text-center mb-8">Distraction-free. Just you and the work.</p>

          {/* Duration */}
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Session Length</p>
          <div className="flex gap-2 mb-8 w-full">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setPreset(i)}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-medium transition-all ${
                  preset === i
                    ? 'bg-white/15 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'text-white/40 border border-white/8 hover:border-white/15 hover:text-white/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Ambient sound */}
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Ambient Sound</p>
          <div className="grid grid-cols-3 gap-2 mb-8 w-full">
            {SOUNDS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSound(s.id)
                  // Play preview (also unlocks AudioContext via user gesture)
                  if (s.id !== 'none') {
                    playAmbient(s.id, volume)
                  } else {
                    stopAmbient()
                  }
                }}
                className={`py-2.5 rounded-lg text-center transition-all text-[11px] ${
                  sound === s.id
                    ? 'bg-purple-400/15 text-purple-200 border border-purple-400/30'
                    : 'text-white/35 border border-white/8 hover:border-white/15 hover:text-white/50'
                }`}
              >
                <span className="text-base block mb-0.5">{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={startFocus}
            className="w-full py-3 rounded-xl bg-white/10 border border-white/15 text-white font-medium text-sm hover:bg-white/15 transition-all shadow-[0_0_20px_rgba(255,255,255,0.03)] flex items-center justify-center gap-2"
          >
            <Play size={14} /> Start Focus
          </button>
        </div>
      </div>
    )
  }

  // Complete screen
  if (focusState === 'complete') {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center px-6">
        <SetupScene />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 text-center max-w-sm">
          <h1 className="text-xl font-semibold text-white mb-1">Session complete</h1>
          <p className="text-[12px] text-white/40 mb-8">{tutorName}: "Amazing focus! {totalStudied} minutes of deep work."</p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{sessionsCompleted}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Sessions</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{totalStudied}m</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Studied</p>
            </div>
          </div>

          <button
            onClick={() => { stopAmbient(); navigate('/') }}
            className="w-full py-3 rounded-xl bg-white/10 border border-white/15 text-white font-medium text-sm hover:bg-white/15 transition-all"
          >
            Back to Orbit
          </button>
        </motion.div>
      </div>
    )
  }

  // Active timer
  const isBreak = focusState === 'break'
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-6">
      <NeonScene isBreak={isBreak} />

      {/* Close button */}
      <button
        onClick={() => { stopAmbient(); setFocusState('complete') }}
        className="absolute top-4 right-4 z-20 text-white/20 hover:text-white/50 transition-colors"
      >
        <X size={18} />
      </button>

      <div className="relative z-10 text-center max-w-sm">
        {/* Status */}
        <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-4">
          {isBreak ? 'Break time' : `Session ${sessionsCompleted + 1}`}
          {sound !== 'none' && ` · ${SOUNDS.find((s) => s.id === sound)?.emoji}`}
        </p>

        {/* Timer ring */}
        <div className="relative w-52 h-52 mx-auto mb-8">
          <svg className="w-52 h-52 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
            <circle
              cx="100" cy="100" r="88" fill="none"
              stroke={isBreak ? 'rgba(34,197,94,0.5)' : 'rgba(200,180,255,0.6)'}
              strokeWidth="2"
              strokeDasharray={`${progress * 553} 553`}
              strokeLinecap="round"
              style={{
                filter: isBreak
                  ? 'drop-shadow(0 0 8px rgba(34,197,94,0.3))'
                  : 'drop-shadow(0 0 10px rgba(200,180,255,0.3))',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-light text-white/90 font-mono tracking-wider">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] text-white/25 mt-2 tracking-wide">
              {isBreak ? 'Breathe...' : isPaused ? 'Paused' : 'Stay focused'}
            </span>
          </div>
        </div>

        {/* Volume control */}
        {sound !== 'none' && (
          <div className="flex items-center gap-2 justify-center mb-6 max-w-[200px] mx-auto">
            <Volume2 size={12} className="text-white/20 shrink-0" />
            <input
              type="range" min="0" max="100" value={volume * 100}
              onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
              className="flex-1 h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-300/70"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {isBreak ? (
            <button
              onClick={skipBreak}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/60 text-sm hover:bg-white/12 hover:text-white/80 transition-all"
            >
              <SkipForward size={14} /> Skip Break
            </button>
          ) : (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/60 text-sm hover:bg-white/12 hover:text-white/80 transition-all"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
