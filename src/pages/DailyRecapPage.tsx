import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Flame, Trophy, Brain, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useUserStore } from '../stores/userStore'
import { useDataStore } from '../stores/dataStore'
import { useConfidenceStore } from '../stores/confidenceStore'

export function DailyRecapPage() {
  const navigate = useNavigate()
  const { xp, level, currentStreak, displayName } = useUserStore()
  const { studyMinutesToday, completedSessions } = useDataStore()
  const { entries: confidenceEntries } = useConfidenceStore()

  const today = new Date().toISOString().split('T')[0]
  const todaySessions = completedSessions.filter((s) => s.startedAt.startsWith(today))
  const todayXp = todaySessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0)
  const todayConfidence = confidenceEntries.filter((e) => e.date.startsWith(today))
  const avgConfidenceBefore = todayConfidence.length > 0
    ? Math.round(todayConfidence.reduce((s, e) => s + e.before, 0) / todayConfidence.length * 20)
    : null
  const avgConfidenceAfter = todayConfidence.filter((e) => e.after).length > 0
    ? Math.round(todayConfidence.filter((e) => e.after).reduce((s, e) => s + (e.after || 0), 0) / todayConfidence.filter((e) => e.after).length * 20)
    : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const subjects = [...new Set(todaySessions.map((s) => s.subjectName))]

  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-0.5">
        {greeting}, {displayName || 'Explorer'}
      </h1>
      <p className="text-[12px] text-text-muted mb-5">Here's your study recap for today.</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: Clock, value: `${studyMinutesToday}m`, label: 'Study time', pastel: '#E8F0FE' },
          { icon: Trophy, value: `+${todayXp}`, label: 'XP earned', pastel: '#FFF8E1' },
          { icon: Flame, value: currentStreak, label: 'Day streak', pastel: '#FFF0E0' },
        ].map(({ icon: Icon, value, label, pastel }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card padding="sm" className="text-center" pastel={pastel + '60'}>
              <Icon className="mx-auto mb-1 text-text-primary dark:text-dark-text-primary" size={14} />
              <p className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{value}</p>
              <p className="text-[9px] text-text-muted uppercase tracking-wider">{label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Sessions */}
      {todaySessions.length > 0 ? (
        <Card className="mb-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Today's Sessions</p>
          <div className="space-y-1.5">
            {todaySessions.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 py-1">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-text-primary dark:text-dark-text-primary font-medium truncate">{s.topicName}</p>
                  <p className="text-[10px] text-text-muted">{s.subjectName} · {s.durationMinutes}m · {s.mode}</p>
                </div>
                {s.gradeScore !== undefined && (
                  <span className={`text-[12px] font-semibold ${s.gradeScore >= 70 ? 'text-success' : s.gradeScore >= 50 ? 'text-warning' : 'text-error'}`}>
                    {s.gradeScore}%
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="mb-4 text-center py-8">
          <p className="text-[13px] text-text-muted">No sessions yet today. Start studying to see your recap!</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/')}>
            Go to Orbit
          </Button>
        </Card>
      )}

      {/* Confidence change */}
      {avgConfidenceBefore !== null && (
        <Card className="mb-4" pastel="#F0E6FF30">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-text-primary dark:text-dark-text-primary" />
            <p className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary">Confidence Today</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{avgConfidenceBefore}%</p>
              <p className="text-[9px] text-text-muted">Before</p>
            </div>
            <TrendingUp size={14} className="text-text-muted" />
            <div className="text-center">
              <p className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{avgConfidenceAfter || '—'}%</p>
              <p className="text-[9px] text-text-muted">After</p>
            </div>
            {avgConfidenceAfter && avgConfidenceAfter > avgConfidenceBefore && (
              <p className="text-[11px] text-success ml-auto">+{avgConfidenceAfter - avgConfidenceBefore}% growth</p>
            )}
          </div>
        </Card>
      )}

      {/* Subjects covered */}
      {subjects.length > 0 && (
        <Card className="mb-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Subjects Covered</p>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <span key={s} className="text-[11px] px-2 py-1 rounded-full border border-border dark:border-white/10 text-text-primary dark:text-dark-text-primary">
                {s}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Encouragement */}
      <div className="text-center py-4">
        <p className="text-[12px] text-text-muted">
          {todaySessions.length >= 3
            ? 'Amazing effort today! Keep this up and you\'ll smash your exams.'
            : todaySessions.length >= 1
            ? 'Great start! Try one more session before bed.'
            : 'Every expert was once a beginner. Start with just 5 minutes!'}
        </p>
      </div>
    </div>
  )
}
