import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Plan = 'free' | 'pro' | 'family'
type TrialStatus = 'active' | 'expired' | 'none'

const FREE_PLANETS = ['lavender', 'coral', 'mint', 'ocean']
const SESSION_LIMITS: Record<Plan, number> = { free: 3, pro: 999, family: 999 }

interface SubscriptionState {
  plan: Plan
  sessionsUsedToday: number
  sessionLimit: number
  planetsUnlocked: string[]
  lastSessionDate: string
  trialEndsAt: string | null

  canStartSession: () => boolean
  recordSessionUsage: () => void
  resetDailyUsage: () => void
  upgradePlan: (plan: 'pro' | 'family') => void
  checkTrialStatus: () => TrialStatus
  isPlanetLocked: (planetId: string) => boolean
  getSessionsRemaining: () => number
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      sessionsUsedToday: 0,
      sessionLimit: SESSION_LIMITS.free,
      planetsUnlocked: [...FREE_PLANETS],
      lastSessionDate: '',
      trialEndsAt: null,

      canStartSession: () => {
        const state = get()
        // Auto-reset if new day
        const today = new Date().toISOString().split('T')[0]
        if (state.lastSessionDate !== today) {
          get().resetDailyUsage()
          return true
        }
        if (state.plan !== 'free') return true
        // Check trial
        if (state.trialEndsAt && new Date(state.trialEndsAt) > new Date()) return true
        return state.sessionsUsedToday < state.sessionLimit
      },

      recordSessionUsage: () => {
        const today = new Date().toISOString().split('T')[0]
        set((s) => ({
          sessionsUsedToday: s.lastSessionDate === today ? s.sessionsUsedToday + 1 : 1,
          lastSessionDate: today,
        }))
      },

      resetDailyUsage: () => {
        set({
          sessionsUsedToday: 0,
          lastSessionDate: new Date().toISOString().split('T')[0],
        })
      },

      upgradePlan: (plan) => {
        const allPlanets = [
          'lavender', 'coral', 'mint', 'ocean', 'sunset', 'rose',
          'ice', 'ember', 'forest', 'amethyst', 'sand', 'arctic',
        ]
        set({
          plan,
          sessionLimit: SESSION_LIMITS[plan],
          planetsUnlocked: allPlanets,
        })
      },

      checkTrialStatus: () => {
        const { trialEndsAt } = get()
        if (!trialEndsAt) return 'none'
        return new Date(trialEndsAt) > new Date() ? 'active' : 'expired'
      },

      isPlanetLocked: (planetId: string) => {
        const { planetsUnlocked } = get()
        return !planetsUnlocked.includes(planetId)
      },

      getSessionsRemaining: () => {
        const s = get()
        if (s.plan !== 'free') return 999
        if (s.trialEndsAt && new Date(s.trialEndsAt) > new Date()) return 999
        const today = new Date().toISOString().split('T')[0]
        const used = s.lastSessionDate === today ? s.sessionsUsedToday : 0
        return Math.max(0, s.sessionLimit - used)
      },
    }),
    { name: 'orbit-subscription' }
  )
)
