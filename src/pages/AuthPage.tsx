import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { RetroPlanet } from '../components/RetroPlanet'
import { PixelScene } from '../components/RetroIllustrations'
import { useAuthStore } from '../stores/authStore'

type Mode = 'signin' | 'signup' | 'forgot'

export function AuthPage() {
  const { signIn, signUp, resetPassword, isLoading, error, clearError } = useAuthStore()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const switchMode = (m: Mode) => {
    setMode(m)
    clearError()
    setResetSent(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (mode === 'forgot') {
      const ok = await resetPassword(email)
      if (ok) setResetSent(true)
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        useAuthStore.setState({ error: 'Passwords don\'t match!' })
        return
      }
      if (password.length < 6) {
        useAuthStore.setState({ error: 'Password needs to be at least 6 characters.' })
        return
      }
      await signUp(email, password, name)
    } else {
      await signIn(email, password)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 bg-bg dark:bg-dark-bg">
      <PixelScene />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Planet + branding */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <RetroPlanet size="md" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary tracking-tight">
            Orbit
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            {mode === 'signin' ? 'Welcome back! Sign in to continue.' :
             mode === 'signup' ? 'Create your account to get started.' :
             'We\'ll send you a reset link.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name (signup only) */}
          {mode === 'signup' && (
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors"
            />
          </div>

          {/* Password */}
          {mode !== 'forgot' && (
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-2.5 rounded-[var(--radius-md)] border border-border bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          )}

          {/* Confirm password (signup only) */}
          {mode === 'signup' && (
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[12px] text-error text-center py-1"
            >
              {error}
            </motion.p>
          )}

          {/* Reset sent confirmation */}
          {resetSent && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[12px] text-success text-center py-1"
            >
              Check your email — we sent you a reset link!
            </motion.p>
          )}

          {/* Submit */}
          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Hold on...</>
            ) : mode === 'signin' ? (
              <>Sign In <ArrowRight size={14} /></>
            ) : mode === 'signup' ? (
              <>Create Account <ArrowRight size={14} /></>
            ) : (
              <>Send Reset Link <ArrowRight size={14} /></>
            )}
          </Button>
        </form>

        {/* Mode switcher */}
        <div className="text-center mt-5 space-y-2">
          {mode === 'signin' && (
            <>
              <button onClick={() => switchMode('forgot')} className="text-[11px] text-text-muted hover:text-text-secondary transition-colors block mx-auto">
                Forgot password?
              </button>
              <p className="text-[12px] text-text-muted">
                Don't have an account?{' '}
                <button onClick={() => switchMode('signup')} className="text-text-primary dark:text-dark-text-primary font-medium hover:underline">
                  Sign up
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-[12px] text-text-muted">
              Already have an account?{' '}
              <button onClick={() => switchMode('signin')} className="text-text-primary dark:text-dark-text-primary font-medium hover:underline">
                Sign in
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <button onClick={() => switchMode('signin')} className="text-[12px] text-text-muted hover:text-text-secondary transition-colors">
              ← Back to sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
