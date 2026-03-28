import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { Button } from './ui/Button'
import { useUserStore } from '../stores/userStore'

const TOUR_STEPS = [
  {
    title: 'Welcome to your Orbit!',
    text: 'This is your knowledge universe. As you study, topics appear here and grow brighter as you master them.',
    position: 'center' as const,
  },
  {
    title: 'Upload homework',
    text: 'Tap Upload to add homework — photos, PDFs, or just paste text. Your tutor will help you learn it.',
    position: 'bottom' as const,
  },
  {
    title: 'Track your progress',
    text: 'Check your streaks, XP, level, and badges here. Study consistently to watch your planet grow!',
    position: 'bottom' as const,
  },
  {
    title: 'Get unstuck',
    text: 'Stuck on homework? Use the Stuck tab — upload your worksheet and get step-by-step help for every question.',
    position: 'bottom' as const,
  },
]

const TOUR_SEEN_KEY = 'orbit-tour-complete'

export function GuidedTour() {
  const { tutorName } = useUserStore()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEY)
    if (!seen) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(TOUR_SEEN_KEY, 'true')
  }

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const current = TOUR_STEPS[step]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 px-6"
        onClick={dismiss}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-[var(--radius-xl)] p-5 w-full max-w-xs shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? 'w-5 bg-text-primary' : i < step ? 'w-2 bg-text-muted' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>

          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-1">
            {current.title}
          </h3>
          <p className="text-[12px] text-text-muted leading-relaxed mb-4">
            {current.text.replace('{tutor_name}', tutorName)}
          </p>

          <div className="flex items-center justify-between">
            <button onClick={dismiss} className="text-[10px] text-text-muted hover:text-text-secondary transition-colors">
              Skip tour
            </button>
            <Button size="sm" onClick={next}>
              {step < TOUR_STEPS.length - 1 ? (
                <>Next <ArrowRight size={10} /></>
              ) : (
                'Get started!'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
