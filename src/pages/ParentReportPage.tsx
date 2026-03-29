import { useState, useRef } from 'react'
import { ArrowLeft, Download, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { useDataStore } from '../stores/dataStore'
import { useSubjectStore } from '../stores/subjectStore'

const SECTIONS = [
  { id: 'studyTime', label: 'Study time this week' },
  { id: 'topicsMastered', label: 'Topics mastered' },
  { id: 'streak', label: 'Current streak' },
  { id: 'subjects', label: 'Subject breakdown' },
  { id: 'badges', label: 'Badges earned' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function ParentReportPage() {
  const navigate = useNavigate()
  const { displayName, xp, level, currentStreak, longestStreak } = useUserStore()
  const { completedSessions, badges } = useDataStore()
  const { subjects } = useSubjectStore()
  const [selected, setSelected] = useState<Set<SectionId>>(new Set(['studyTime', 'topicsMastered', 'streak']))
  const reportRef = useRef<HTMLDivElement>(null)

  const LEVEL_NAMES = ['Stardust', 'Moonwalker', 'Stargazer', 'Orbiter', 'Astronaut', 'Pilot', 'Navigator', 'Explorer', 'Voyager', 'Cosmic Scholar']

  const toggleSection = (id: SectionId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const weekAgo = Date.now() - 7 * 86400000
  const weekSessions = completedSessions.filter((s) => new Date(s.endedAt).getTime() > weekAgo)
  const totalMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const mastered = subjects.flatMap((s) => s.topics.filter((t) => t.status === 'mastered'))

  const subjectBreakdown = subjects.map((s) => ({
    name: s.name,
    total: s.topics.length,
    mastered: s.topics.filter((t) => t.status === 'mastered').length,
    inProgress: s.topics.filter((t) => t.status === 'in_progress').length,
  }))

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${displayName}'s Study Report`,
        text: `${displayName} has studied ${totalMinutes} minutes this week, mastered ${mastered.length} topics, and is on a ${currentStreak}-day streak!`,
      })
    }
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-muted">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Parent Report Card</h1>
      </div>

      <p className="text-xs text-text-muted mb-4">Choose what to include. You control what gets shared.</p>

      {/* Section toggles */}
      <div className="space-y-1 mb-6">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => toggleSection(s.id)}
            className={`w-full text-left px-3 py-2 text-sm rounded-[var(--radius-md)] border transition-colors ${
              selected.has(s.id)
                ? 'border-text-primary dark:border-dark-text-primary bg-text-primary/5'
                : 'border-border dark:border-dark-border text-text-secondary dark:text-dark-text-secondary'
            }`}
          >
            <span className="mr-2">{selected.has(s.id) ? '\u2713' : '\u00A0\u00A0'}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div ref={reportRef} className="border border-border dark:border-dark-border rounded-[var(--radius-lg)] p-4 mb-4">
        <h2 className="text-base font-medium text-text-primary dark:text-dark-text-primary mb-1">
          {displayName}'s Report
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Level {level + 1} · {LEVEL_NAMES[level]} · {xp} XP
        </p>

        {selected.has('studyTime') && (
          <div className="mb-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Study time this week</p>
            <p className="text-sm text-text-primary dark:text-dark-text-primary">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m across {weekSessions.length} sessions
            </p>
          </div>
        )}

        {selected.has('topicsMastered') && (
          <div className="mb-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Topics mastered</p>
            <p className="text-sm text-text-primary dark:text-dark-text-primary">
              {mastered.length} topic{mastered.length !== 1 ? 's' : ''} mastered
            </p>
          </div>
        )}

        {selected.has('streak') && (
          <div className="mb-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Streak</p>
            <p className="text-sm text-text-primary dark:text-dark-text-primary">
              {currentStreak} day{currentStreak !== 1 ? 's' : ''} (best: {longestStreak})
            </p>
          </div>
        )}

        {selected.has('subjects') && subjectBreakdown.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Subjects</p>
            {subjectBreakdown.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm py-0.5">
                <span className="text-text-primary dark:text-dark-text-primary">{s.name}</span>
                <span className="text-xs text-text-muted">
                  {s.mastered}/{s.total} mastered
                </span>
              </div>
            ))}
          </div>
        )}

        {selected.has('badges') && badges.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Badges</p>
            <p className="text-sm text-text-primary dark:text-dark-text-primary">
              {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {typeof navigator.share === 'function' && (
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] text-text-secondary dark:text-dark-text-secondary"
          >
            <Share2 size={14} strokeWidth={1.5} />
            Share
          </button>
        )}
        <button
          onClick={() => {
            const text = reportRef.current?.innerText || ''
            navigator.clipboard.writeText(text)
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary"
        >
          <Download size={14} strokeWidth={1.5} />
          Copy
        </button>
      </div>
    </div>
  )
}
