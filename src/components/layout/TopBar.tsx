import { Flame, Sparkles } from 'lucide-react'
import { useUserStore } from '../../stores/userStore'
import { useSubscriptionStore } from '../../stores/subscriptionStore'
import { PixelGem, PixelStar } from '../RetroIllustrations'

export function TopBar() {
  const { displayName, xp, level, currentStreak } = useUserStore()
  const { plan, getSessionsRemaining } = useSubscriptionStore()
  const sessionsLeft = getSessionsRemaining()
  const isPro = plan !== 'free'

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#111111] border-b border-border dark:border-dark-border">
      <div className="max-w-[680px] mx-auto flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-2">
          <PixelGem size={12} color="#C8B8F0" />
          <h1 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary tracking-tight">
            {displayName || 'Orbit'}
          </h1>
          {isPro && (
            <PixelStar size={10} color="#F8D888" className="ml-0.5" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Session counter for free users */}
          {!isPro && (
            <span className="text-[9px] text-text-muted px-1.5 py-0.5 rounded-full border border-border/60 dark:border-dark-border">
              {sessionsLeft}/3 left
            </span>
          )}
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-pastel-orange/50">
              <Flame size={11} className="text-streak" />
              <span className="text-[10px] font-semibold text-text-primary">{currentStreak}</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-pastel-yellow/50">
            <Sparkles size={11} className="text-text-primary" />
            <span className="text-[10px] font-semibold text-text-primary">{xp} XP</span>
          </div>
          <span className="text-[8px] font-pixel text-text-secondary px-2 py-1 rounded-[var(--radius-sm)] bg-pastel-purple/40">
            Lv{level}
          </span>
        </div>
      </div>
    </header>
  )
}
