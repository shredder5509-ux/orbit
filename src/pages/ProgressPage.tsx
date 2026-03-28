import { Flame, Sparkles, Trophy, TrendingUp, ArrowRight, Brain } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PixelScene } from '../components/RetroIllustrations'
import { ActivityHeatmap } from '../components/ActivityHeatmap'
import { ShareProgressButton } from '../components/ShareCard'
import { useUserStore, getLevelName, getXpForNextLevel, getXpForCurrentLevel } from '../stores/userStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useDataStore, BADGE_DEFS } from '../stores/dataStore'
import { useConfidenceStore } from '../stores/confidenceStore'
import { useErrorPatternStore } from '../services/errorPatterns'
import { useLearningStyleStore, type LearningStyle } from '../services/learningStyle'

export function ProgressPage() {
  const navigate = useNavigate()
  const { xp, level, currentStreak, longestStreak, dailyGoalMinutes } = useUserStore()
  const { plan } = useSubscriptionStore()
  const { badges, studyMinutesToday, completedSessions } = useDataStore()
  const { entries: confidenceEntries, getAverageAccuracy } = useConfidenceStore()
  const { getPatterns, getWeakAreas } = useErrorPatternStore()
  const { preferredStyle, getStyleBreakdown, getRecommendation } = useLearningStyleStore()
  const errorPatterns = getPatterns()
  const weakAreas = getWeakAreas()
  const styleBreakdown = getStyleBreakdown()
  const STYLE_LABELS: Record<LearningStyle, string> = { visual: 'Visual', auditory: 'Auditory', reading: 'Reading', kinesthetic: 'Hands-on' }
  const STYLE_COLORS: Record<LearningStyle, string> = { visual: 'bg-pastel-purple', auditory: 'bg-pastel-blue', reading: 'bg-pastel-green', kinesthetic: 'bg-pastel-yellow' }
  const isPro = plan !== 'free'
  const nextLevelXp = getXpForNextLevel(level)
  const currentLevelXp = getXpForCurrentLevel(level)
  const progress = nextLevelXp === Infinity ? 100 : ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100

  return (
    <div className="relative max-w-[680px] mx-auto px-6 py-6">
      <PixelScene variant="minimal" />

      <div className="relative z-10">
        <h1 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-5 tracking-tight">
          Progress
        </h1>

        {/* Level card */}
        <Card className="mb-4" pastel="#E8F0FE40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-pastel-purple/60 dark:bg-dark-border flex items-center justify-center">
              <Sparkles className="text-text-primary dark:text-dark-text-primary" size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                  Level {level}
                </span>
                <span className="text-[11px] text-text-muted">{getLevelName(level)}</span>
              </div>
              <p className="text-[11px] text-text-muted">{xp} / {nextLevelXp === Infinity ? '∞' : nextLevelXp} XP</p>
            </div>
          </div>
          <div className="h-2 bg-pastel-blue/50 dark:bg-dark-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-pastel-blue to-pastel-purple rounded-full"
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { icon: Flame, value: currentStreak, label: 'Streak', pastel: '#FFF0E0' },
            { icon: Trophy, value: longestStreak, label: 'Best', pastel: '#FFF8E1' },
            { icon: TrendingUp, value: 0, label: 'Mastered', pastel: '#E6F7ED' },
          ].map(({ icon: Icon, value, label, pastel }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card padding="sm" className="text-center" pastel={pastel + '60'}>
                <Icon className="mx-auto mb-1.5 text-text-primary dark:text-dark-text-primary" size={16} strokeWidth={1.5} />
                <p className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{value}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Activity Heatmap — 12 weeks */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary">Activity</h2>
            <span className="text-[9px] text-text-muted">Last 12 weeks</span>
          </div>
          <ActivityHeatmap />
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-2 mb-4">
          <Button variant="secondary" size="sm" onClick={() => navigate('/weekly-report')}>
            <TrendingUp size={12} />
            Weekly Report
          </Button>
          <ShareProgressButton />
        </div>

        {/* Daily goal */}
        <Card className="mb-4" pastel="#FFF8E140">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary">Daily Goal</h2>
            <span className="text-[10px] text-text-muted">{dailyGoalMinutes} min target</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-border dark:text-dark-border" />
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeDasharray={`${Math.min(1, studyMinutesToday / dailyGoalMinutes) * 126} 126`}
                  strokeLinecap="round" className="text-text-primary dark:text-dark-text-primary" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-text-primary">
                {studyMinutesToday}m
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-text-primary dark:text-dark-text-primary font-medium">
                {studyMinutesToday >= dailyGoalMinutes ? 'Goal reached!' : `${dailyGoalMinutes - studyMinutesToday} min to go`}
              </p>
              <p className="text-[10px] text-text-muted">
                {completedSessions.length} session{completedSessions.length !== 1 ? 's' : ''} completed total
              </p>
            </div>
          </div>
        </Card>

        {/* Confidence Tracker */}
        {confidenceEntries.length > 0 && (
          <Card className="mb-4" pastel="#F0E6FF40">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-text-primary dark:text-dark-text-primary" />
              <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary">Confidence vs Reality</h2>
            </div>
            <div className="space-y-1.5">
              {confidenceEntries.slice(-5).reverse().map((entry) => {
                const beforePct = (entry.before / 5) * 100
                const afterPct = entry.after ? (entry.after / 5) * 100 : null
                const improved = entry.after !== null && entry.after > entry.before
                return (
                  <div key={entry.id} className="flex items-center gap-2 text-[11px]">
                    <span className="text-text-muted w-24 truncate">{entry.topicName}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="w-16 h-[4px] bg-border dark:bg-dark-border rounded-full overflow-hidden">
                        <div className="h-full bg-pastel-purple rounded-full" style={{ width: `${beforePct}%` }} />
                      </div>
                      <span className="text-text-muted">→</span>
                      <div className="w-16 h-[4px] bg-border dark:bg-dark-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${improved ? 'bg-success' : 'bg-pastel-blue'}`} style={{ width: `${afterPct || 0}%` }} />
                      </div>
                    </div>
                    {entry.actualScore !== null && (
                      <span className="text-text-muted shrink-0">{entry.actualScore}%</span>
                    )}
                  </div>
                )
              })}
            </div>
            {confidenceEntries.filter((e) => e.after !== null).length >= 3 && (
              <p className="text-[10px] text-text-muted mt-2">
                Self-awareness accuracy: {getAverageAccuracy()}%
              </p>
            )}
          </Card>
        )}

        {/* Learning Style */}
        {preferredStyle && (
          <Card className="mb-4" pastel="#E8F0FE30">
            <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary mb-2">Your Learning Style</h2>
            <div className="flex gap-1 mb-2">
              {(Object.entries(styleBreakdown) as [LearningStyle, number][]).map(([style, pct]) => (
                <div key={style} className="flex-1">
                  <div className="h-[6px] bg-border dark:bg-dark-border rounded-full overflow-hidden mb-0.5">
                    <div className={`h-full ${STYLE_COLORS[style]} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[9px] text-text-muted text-center">{STYLE_LABELS[style]} {pct}%</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-muted">{getRecommendation()}</p>
          </Card>
        )}

        {/* Error Patterns */}
        {errorPatterns.length > 0 && (
          <Card className="mb-4" pastel="#FFF0E030">
            <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary mb-2">Common Mistakes</h2>
            <div className="space-y-1">
              {errorPatterns.slice(0, 4).map((p) => (
                <div key={p.type} className="flex items-center gap-2">
                  <div className="flex-1 h-[4px] bg-border dark:bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: `${Math.min(100, p.count * 10)}%` }} />
                  </div>
                  <span className="text-[11px] text-text-primary dark:text-dark-text-primary capitalize w-20">{p.type}</span>
                  <span className="text-[10px] text-text-muted">{p.count}x</span>
                </div>
              ))}
            </div>
            {weakAreas.length > 0 && (
              <p className="text-[10px] text-text-muted mt-2">
                Focus on: {weakAreas.slice(0, 3).map((a) => a.topic).join(', ')}
              </p>
            )}
          </Card>
        )}

        {/* Pro nudge */}
        {!isPro && (
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors mb-4"
          >
            <Sparkles size={9} />
            Unlock advanced analytics with Pro
            <ArrowRight size={8} />
          </button>
        )}

        {/* Badges */}
        <Card>
          <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary mb-3">Badges</h2>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => {
                const def = BADGE_DEFS[b.id]
                return (
                  <div key={b.id} className="flex items-center gap-1.5 px-2 py-1 bg-pastel-yellow/40 rounded-full">
                    <span className="text-sm">{def.icon}</span>
                    <span className="text-[10px] font-medium text-text-primary">{def.name}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="flex justify-center gap-3 mb-3">
                {Object.values(BADGE_DEFS).slice(0, 4).map((def, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-pastel-blue/30 flex items-center justify-center opacity-40">
                    <span className="text-base">{def.icon}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-text-muted">Complete sessions to earn badges</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
