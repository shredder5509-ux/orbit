import { useState } from 'react'
import { Volume2, VolumeX, ChevronDown } from 'lucide-react'
import { playAmbient, stopAmbient, setAmbientVolume } from '../services/ambientAudio'

const SOUNDS = [
  { id: 'rain', label: 'Rain' },
  { id: 'forest', label: 'Forest' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'space', label: 'Space' },
  { id: 'cafe', label: 'Cafe' },
] as const

export function SoundPlayer() {
  const [playing, setPlaying] = useState<string | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [expanded, setExpanded] = useState(false)

  const toggle = (id: string) => {
    if (playing === id) {
      stopAmbient()
      setPlaying(null)
    } else {
      playAmbient(id, volume)
      setPlaying(id)
    }
  }

  const handleVolume = (v: number) => {
    setVolume(v)
    setAmbientVolume(v)
  }

  return (
    <div className="fixed bottom-20 right-3 z-40">
      {expanded && (
        <div className="mb-2 bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-[var(--radius-md)] p-2 shadow-sm w-36">
          <div className="space-y-0.5 mb-2">
            {SOUNDS.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`w-full text-left px-2 py-1.5 text-xs rounded-[var(--radius-sm)] transition-colors ${
                  playing === s.id
                    ? 'bg-text-primary/5 text-text-primary dark:text-dark-text-primary font-medium'
                    : 'text-text-secondary dark:text-dark-text-secondary'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => handleVolume(Number(e.target.value))}
            className="w-full h-1 accent-text-primary dark:accent-dark-text-primary"
          />
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${
          playing
            ? 'border-text-primary dark:border-dark-text-primary bg-text-primary/5'
            : 'border-border dark:border-dark-border bg-white dark:bg-dark-surface'
        }`}
      >
        {playing ? (
          <Volume2 size={16} strokeWidth={1.5} className="text-text-primary dark:text-dark-text-primary" />
        ) : (
          <VolumeX size={16} strokeWidth={1.5} className="text-text-muted" />
        )}
      </button>
    </div>
  )
}
