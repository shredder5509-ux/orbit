import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, X } from 'lucide-react'

interface BreakReminderProps {
  sessionStartTime: number
  intervalMinutes?: number
}

export function BreakReminder({ sessionStartTime, intervalMinutes = 25 }: BreakReminderProps) {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(0) // count of times dismissed

  // Check if break reminders are enabled
  const enabled = (() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('orbit-break-prefs') || '{}')
      return prefs.enabled !== false // default on
    } catch {
      return true
    }
  })()

  useEffect(() => {
    if (!enabled) return

    const check = () => {
      const elapsed = (Date.now() - sessionStartTime) / 60000
      const threshold = intervalMinutes * (dismissed + 1)
      if (elapsed >= threshold) {
        setShow(true)
      }
    }

    const timer = setInterval(check, 30000) // check every 30s
    return () => clearInterval(timer)
  }, [sessionStartTime, intervalMinutes, dismissed, enabled])

  const handleDismiss = () => {
    setShow(false)
    setDismissed((d) => d + 1)
  }

  if (!enabled) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center gap-2 py-1.5 px-4 bg-pastel-blue/80 dark:bg-white/10 backdrop-blur-sm"
        >
          <Coffee size={12} className="text-text-primary dark:text-dark-text-primary shrink-0" />
          <span className="text-[11px] text-text-primary dark:text-dark-text-primary font-medium">
            You've been studying for {intervalMinutes * (dismissed + 1)} min — quick stretch?
          </span>
          <button
            onClick={handleDismiss}
            className="text-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors ml-1"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
