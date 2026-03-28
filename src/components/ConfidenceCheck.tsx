import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from './ui/Button'

interface ConfidenceCheckProps {
  label: string
  subtitle: string
  onSelect: (rating: number) => void
}

const LABELS = ['Not sure at all', 'A little shaky', 'Okay-ish', 'Pretty confident', 'I know this!']
const EMOJIS = ['😰', '😕', '🤔', '😊', '🌟']

export function ConfidenceCheck({ label, subtitle, onSelect }: ConfidenceCheckProps) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6 px-4"
    >
      <p className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary mb-1">{label}</p>
      <p className="text-[11px] text-text-muted mb-5">{subtitle}</p>

      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setSelected(n)}
            className={`w-12 h-12 rounded-[var(--radius-md)] border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
              selected === n
                ? 'border-text-primary dark:border-dark-text-primary bg-accent-light/40 dark:bg-white/10 scale-110'
                : 'border-border dark:border-white/15 hover:border-text-muted'
            }`}
          >
            <span className="text-base">{EMOJIS[n - 1]}</span>
            <span className="text-[8px] text-text-muted">{n}</span>
          </button>
        ))}
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[11px] text-text-muted mb-3">{LABELS[selected - 1]}</p>
          <Button size="sm" onClick={() => onSelect(selected)}>Continue</Button>
        </motion.div>
      )}
    </motion.div>
  )
}
