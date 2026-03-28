import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Check } from 'lucide-react'
import { Button } from './ui/Button'
import { RetroPlanet } from './RetroPlanet'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { createCheckoutSession } from '../services/stripe'
import { useState } from 'react'

interface PaywallProps {
  open: boolean
  onClose: () => void
}

export function Paywall({ open, onClose }: PaywallProps) {
  const [loading, setLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      await createCheckoutSession(billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly')
      onClose()
    } catch {
      // Handled by stub
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = async () => {
    setLoading(true)
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 7)
    useSubscriptionStore.getState().upgradePlan('pro')
    // In production, the trial would be managed server-side
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-[var(--radius-xl)] p-5 w-full max-w-md shadow-lg shadow-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <RetroPlanet size="sm" />
                <div>
                  <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                    You've had a great study day!
                  </h2>
                  <p className="text-[11px] text-text-muted">
                    Free accounts get 3 AI sessions per day.
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1">
                <X size={14} />
              </button>
            </div>

            {/* Plan comparison */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {/* Free plan */}
              <div className="border border-border dark:border-dark-border rounded-[var(--radius-lg)] p-3">
                <p className="text-xs font-semibold text-text-primary dark:text-dark-text-primary mb-2">Free</p>
                <ul className="space-y-1.5">
                  {['3 sessions/day', '4 starter planets', 'Basic progress', 'Core subjects'].map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-[10px] text-text-muted">
                      <Check size={8} className="text-text-muted shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro plan */}
              <div className="border-2 border-pastel-yellow rounded-[var(--radius-lg)] p-3 relative">
                <div className="absolute -top-2 right-3 bg-pastel-yellow text-text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                  Pro
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles size={10} className="text-text-primary" />
                  <p className="text-xs font-semibold text-text-primary dark:text-dark-text-primary">Orbit Pro</p>
                </div>
                <ul className="space-y-1.5">
                  {[
                    'Unlimited sessions',
                    'All 12 planets',
                    'Study analytics',
                    'Spaced repetition',
                    'Exam countdowns',
                    'Custom plans',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-[10px] text-text-primary dark:text-dark-text-primary">
                      <Check size={8} className="text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-text-primary text-white'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                £4.99/mo
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-text-primary text-white'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                £39.99/yr
                <span className="ml-1 text-[8px] text-success font-medium">save 33%</span>
              </button>
            </div>

            {/* CTA */}
            <Button onClick={handleStartTrial} disabled={loading} className="w-full mb-2" size="lg">
              {loading ? 'Setting up...' : 'Start 7-day free trial'}
            </Button>
            <button
              onClick={onClose}
              className="w-full text-[11px] text-text-muted hover:text-text-secondary transition-colors py-1"
            >
              Maybe later — see you tomorrow!
            </button>
            <p className="text-[9px] text-text-muted text-center mt-2">
              Cancel anytime. No commitment.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
