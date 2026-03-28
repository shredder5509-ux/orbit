import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { Button } from './ui/Button'
import { useDataStore } from '../stores/dataStore'

const INSTALL_DISMISSED_KEY = 'orbit-install-dismissed'
const INSTALL_DISMISSED_AT_KEY = 'orbit-install-dismissed-at'
const MIN_SESSIONS = 2
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function InstallPrompt() {
  const { completedSessions } = useDataStore()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!deferredPrompt) return
    if (completedSessions.length < MIN_SESSIONS) return

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(INSTALL_DISMISSED_AT_KEY)
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_COOLDOWN_MS) return

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    setShow(true)
  }, [deferredPrompt, completedSessions.length])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
    localStorage.setItem(INSTALL_DISMISSED_AT_KEY, Date.now().toString())
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto"
        >
          <div className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-[var(--radius-xl)] p-4 shadow-lg shadow-black/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-pastel-purple/50 flex items-center justify-center shrink-0">
              <Download size={14} className="text-text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-text-primary mb-0.5">Add Orbit to home screen</p>
              <p className="text-[10px] text-text-muted">For the best experience, install the app.</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleInstall}>Install</Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>Later</Button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-text-muted hover:text-text-primary p-0.5">
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
