import { useState, useMemo } from 'react'
import { ArrowLeft, Filter, RotateCcw, Check, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMistakeStore } from '../stores/mistakeStore'
import { useUserStore } from '../stores/userStore'

export function MistakeJournalPage() {
  const navigate = useNavigate()
  const { mistakes, markReviewed, removeMistake } = useMistakeStore()
  const { addXp } = useUserStore()
  const [filter, setFilter] = useState<'all' | 'unreviewed'>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const subjects = useMemo(() => [...new Set(mistakes.map((m) => m.subject))], [mistakes])

  const filtered = useMemo(() => {
    let list = mistakes
    if (filter === 'unreviewed') list = list.filter((m) => !m.reviewed)
    if (subjectFilter) list = list.filter((m) => m.subject === subjectFilter)
    return list
  }, [mistakes, filter, subjectFilter])

  const handleReview = (id: string) => {
    markReviewed(id)
    addXp(5)
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-muted">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">
          Mistake Journal
        </h1>
      </div>

      {mistakes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-text-muted">No mistakes recorded yet.</p>
          <p className="text-xs text-text-muted mt-1">They'll appear here automatically as you study.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setFilter(filter === 'all' ? 'unreviewed' : 'all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors ${
                filter === 'unreviewed'
                  ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                  : 'border-border dark:border-dark-border text-text-secondary dark:text-dark-text-secondary'
              }`}
            >
              <Filter size={12} strokeWidth={1.5} />
              {filter === 'unreviewed' ? 'Unreviewed' : 'All'}
            </button>

            {subjects.length > 1 && (
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-[var(--radius-md)] border border-border dark:border-dark-border bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary"
              >
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            <span className="text-xs text-text-muted ml-auto">
              {filtered.length} mistake{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-1">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="border border-border dark:border-dark-border rounded-[var(--radius-md)] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-2"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.reviewed ? 'bg-success' : 'bg-warning'}`} />
                  <span className="text-sm text-text-primary dark:text-dark-text-primary flex-1 truncate">
                    {m.question}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase">{m.source}</span>
                </button>

                {expandedId === m.id && (
                  <div className="px-3 pb-3 border-t border-border dark:border-dark-border pt-2 space-y-2">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wide">Your answer</p>
                      <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{m.studentAnswer}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wide">Correct answer</p>
                      <p className="text-sm text-text-primary dark:text-dark-text-primary">{m.correctAnswer}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                      <span>{m.subject}</span>
                      <span>·</span>
                      <span>{m.topic}</span>
                      <span>·</span>
                      <span>{new Date(m.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      {!m.reviewed && (
                        <button
                          onClick={() => handleReview(m.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border dark:border-dark-border rounded-[var(--radius-sm)] text-text-secondary dark:text-dark-text-secondary hover:border-text-muted transition-colors"
                        >
                          <Check size={12} strokeWidth={1.5} />
                          Mark reviewed (+5 XP)
                        </button>
                      )}
                      {m.reviewed && (
                        <button
                          onClick={() => handleReview(m.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-success rounded-[var(--radius-sm)]"
                          disabled
                        >
                          <RotateCcw size={12} strokeWidth={1.5} />
                          Reviewed
                        </button>
                      )}
                      <button
                        onClick={() => removeMistake(m.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-muted hover:text-error transition-colors"
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
