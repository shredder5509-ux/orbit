import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Target, TrendingUp, Flame, Trophy, Sparkles, Lock } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PixelScene } from '../components/RetroIllustrations'
import { useUserStore, getLevelName } from '../stores/userStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useDataStore, BADGE_DEFS } from '../stores/dataStore'

export function WeeklyReportPage() {
  const navigate = useNavigate()
  const { xp, level, currentStreak, displayName, dailyGoalMinutes } = useUserStore()
  const { plan } = useSubscriptionStore()
  const { completedSessions, badges, studyMinutesToday } = useDataStore()
  const isPro = plan !== 'free'

  const report = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekStr = weekAgo.toISOString()

    const thisWeekSessions = completedSessions.filter((s) => s.endedAt >= weekStr)
    const totalMinutes = thisWeekSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    const totalXpEarned = thisWeekSessions.reduce((sum, s) => sum + s.xpEarned, 0)
    const avgDuration = thisWeekSessions.length > 0 ? Math.round(totalMinutes / thisWeekSessions.length) : 0

    // Daily breakdown
    const dailyMinutes: Record<string, number> = {}
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    days.forEach((d) => (dailyMinutes[d] = 0))
    thisWeekSessions.forEach((s) => {
      const date = new Date(s.endedAt)
      const dayIdx = (date.getDay() + 6) % 7 // Mon=0
      dailyMinutes[days[dayIdx]] += s.durationMinutes
    })

    // Mode breakdown
    const byMode = { homework: 0, test: 0, project: 0 }
    thisWeekSessions.forEach((s) => {
      const m = s.mode as keyof typeof byMode
      if (m in byMode) byMode[m]++
    })

    // Subjects studied
    const subjects = new Set(thisWeekSessions.map((s) => s.subjectName))

    // Average score
    const scored = thisWeekSessions.filter((s) => s.gradeScore != null)
    const avgScore = scored.length > 0 ? Math.round(scored.reduce((sum, s) => sum + (s.gradeScore || 0), 0) / scored.length) : null

    // Badges earned this week
    const weekBadges = badges.filter((b) => b.earnedAt >= weekStr)

    // Days goal was met (rough estimate)
    const daysWithStudy = Object.values(dailyMinutes).filter((m) => m >= dailyGoalMinutes).length

    return {
      totalMinutes,
      totalSessions: thisWeekSessions.length,
      totalXpEarned,
      avgDuration,
      dailyMinutes,
      byMode,
      subjects: Array.from(subjects),
      avgScore,
      weekBadges,
      daysWithStudy,
    }
  }, [completedSessions, badges, dailyGoalMinutes])

  const maxDailyMins = Math.max(1, ...Object.values(report.dailyMinutes))
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const pastels = ['#E8F0FE', '#E6F7ED', '#FFF8E1', '#FDE8EC', '#F0E6FF', '#E0F5F2', '#FFF0E0']

  return (
    <div className="relative max-w-[680px] mx-auto px-6 py-6">
      <PixelScene variant="minimal" />
      <div className="relative z-10">
        <button onClick={() => navigate('/progress')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Progress
        </button>

        <h1 className="text-lg font-semibold text-text-primary mb-1">Weekly Report</h1>
        <p className="text-[12px] text-text-muted mb-6">
          {displayName}'s study summary for the past 7 days
        </p>

        {/* Summary cards — always visible */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            { icon: Clock, label: 'Study Time', value: report.totalMinutes > 60 ? `${Math.round(report.totalMinutes / 60)}h ${report.totalMinutes % 60}m` : `${report.totalMinutes}m`, pastel: '#E8F0FE' },
            { icon: Target, label: 'Sessions', value: report.totalSessions.toString(), pastel: '#E6F7ED' },
          ].map(({ icon: Icon, label, value, pastel }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card padding="sm" pastel={pastel + '50'}>
                <Icon size={14} className="text-text-primary mb-1" strokeWidth={1.5} />
                <p className="text-lg font-semibold text-text-primary">{value}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pro-only content */}
        <div className={isPro ? '' : 'relative'}>
          {!isPro && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm rounded-[var(--radius-lg)]">
              <Lock size={20} className="text-text-muted mb-2" />
              <p className="text-[12px] text-text-primary font-medium mb-1">Full report is a Pro feature</p>
              <p className="text-[10px] text-text-muted mb-3">Upgrade to see detailed analytics</p>
              <Button size="sm" onClick={() => navigate('/settings')}>Upgrade</Button>
            </div>
          )}

          <div className={!isPro ? 'filter blur-[3px] pointer-events-none select-none' : ''}>
            {/* Daily chart */}
            <Card className="mb-4">
              <h2 className="text-[13px] font-semibold text-text-primary mb-3">Daily Breakdown</h2>
              <div className="flex items-end gap-2 h-24">
                {days.map((day, i) => {
                  const mins = report.dailyMinutes[day]
                  const height = maxDailyMins > 0 ? (mins / maxDailyMins) * 100 : 0
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div className="w-full relative" style={{ height: '80px' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: i * 0.05, duration: 0.4 }}
                          className="absolute bottom-0 w-full rounded-t-[3px]"
                          style={{ backgroundColor: pastels[i] }}
                        />
                      </div>
                      <span className="text-[8px] text-text-muted mt-1">{day}</span>
                      {mins > 0 && <span className="text-[7px] text-text-muted">{mins}m</span>}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Card padding="sm" pastel="#FFF8E150" className="text-center">
                <Sparkles size={12} className="mx-auto mb-1 text-text-primary" />
                <p className="text-sm font-semibold text-text-primary">+{report.totalXpEarned}</p>
                <p className="text-[8px] text-text-muted uppercase">XP Earned</p>
              </Card>
              <Card padding="sm" pastel="#FDE8EC50" className="text-center">
                <Flame size={12} className="mx-auto mb-1 text-text-primary" />
                <p className="text-sm font-semibold text-text-primary">{currentStreak}</p>
                <p className="text-[8px] text-text-muted uppercase">Streak</p>
              </Card>
              <Card padding="sm" pastel="#E6F7ED50" className="text-center">
                <Trophy size={12} className="mx-auto mb-1 text-text-primary" />
                <p className="text-sm font-semibold text-text-primary">{report.daysWithStudy}/7</p>
                <p className="text-[8px] text-text-muted uppercase">Goal Days</p>
              </Card>
            </div>

            {/* Session mode breakdown */}
            <Card className="mb-4">
              <h2 className="text-[13px] font-semibold text-text-primary mb-2">Sessions by Mode</h2>
              <div className="flex gap-3">
                {[
                  { label: 'Homework', count: report.byMode.homework, color: '#E8F0FE' },
                  { label: 'Test Revision', count: report.byMode.test, color: '#FFF8E1' },
                  { label: 'Project', count: report.byMode.project, color: '#E6F7ED' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex-1 text-center">
                    <div className="h-2 rounded-full mb-1" style={{ backgroundColor: color }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: report.totalSessions > 0 ? `${(count / report.totalSessions) * 100}%` : '0%',
                          backgroundColor: color.replace(/F/g, 'C'),
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-text-muted">{label}</p>
                    <p className="text-[12px] font-medium text-text-primary">{count}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Subjects + score */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <Card padding="sm">
                <h3 className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Subjects</h3>
                {report.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {report.subjects.map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-pastel-blue/40 text-text-primary rounded-full">{s}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-text-muted">No sessions yet</p>
                )}
              </Card>
              <Card padding="sm">
                <h3 className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Avg Score</h3>
                <p className="text-lg font-semibold text-text-primary">
                  {report.avgScore != null ? `${report.avgScore}%` : '—'}
                </p>
              </Card>
            </div>

            {/* Badges this week */}
            {report.weekBadges.length > 0 && (
              <Card className="mb-4" pastel="#FFF8E130">
                <h2 className="text-[13px] font-semibold text-text-primary mb-2">Badges Earned</h2>
                <div className="flex gap-2">
                  {report.weekBadges.map((b) => {
                    const def = BADGE_DEFS[b.id]
                    return (
                      <div key={b.id} className="flex items-center gap-1 px-2 py-1 bg-pastel-yellow/40 rounded-full">
                        <span className="text-sm">{def.icon}</span>
                        <span className="text-[10px] font-medium text-text-primary">{def.name}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Recommendation */}
            <Card pastel="#F0E6FF30">
              <TrendingUp size={12} className="text-text-primary mb-1" />
              <p className="text-[12px] text-text-primary">
                {report.totalSessions >= 5
                  ? `Great momentum this week, ${displayName}! ${report.subjects.length > 1 ? `You covered ${report.subjects.length} subjects — nice variety.` : 'Try mixing in another subject next week for variety.'}`
                  : report.totalSessions > 0
                  ? `You made a start this week! Try to build on it — even 15 minutes a day adds up fast.`
                  : `This week's a fresh start. Upload some homework or pick a subject to get going!`
                }
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
