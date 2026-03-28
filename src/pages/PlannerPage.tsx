import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, Plus, ArrowRight, RotateCcw, AlertCircle, FileText, X } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PixelScene } from '../components/RetroIllustrations'
import { useUserStore } from '../stores/userStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useDataStore } from '../stores/dataStore'

export function PlannerPage() {
  const navigate = useNavigate()
  const { tutorName, dailyGoalMinutes } = useUserStore()
  const { plan } = useSubscriptionStore()
  const { getDueReviews, deadlines, removeDeadline, addDeadline } = useDataStore()
  const dueReviews = getDueReviews()
  const isPro = plan !== 'free'
  const [showAddDeadline, setShowAddDeadline] = useState(false)
  const [dlTitle, setDlTitle] = useState('')
  const [dlSubject, setDlSubject] = useState('')
  const [dlDate, setDlDate] = useState('')

  return (
    <div className="relative max-w-[680px] mx-auto px-6 py-6">
      <PixelScene variant="minimal" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary tracking-tight">
            Study Planner
          </h1>
          <Button variant="pastel" size="sm" onClick={() => setShowAddDeadline(true)}>
            <Plus size={12} />
            Add Deadline
          </Button>
        </div>

        <Card className="mb-3" pastel="#E8F0FE40">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-pastel-blue/60 flex items-center justify-center">
              <CalendarDays size={13} className="text-text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary flex-1">Today's Plan</h2>
            <span className="text-[10px] text-text-muted flex items-center gap-1 bg-pastel-yellow/40 px-2 py-0.5 rounded-full">
              <Clock size={9} />
              {dailyGoalMinutes}m goal
            </span>
          </div>
          <div className="text-center py-5">
            <p className="text-[12px] text-text-muted">{tutorName} will suggest topics once you start learning.</p>
          </div>
        </Card>

        {/* Review queue */}
        <Card className="mb-3" pastel="#E6F7ED30">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw size={12} className="text-text-primary" />
            <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary">Review Queue</h2>
            {dueReviews.length > 0 && (
              <span className="ml-auto text-[10px] bg-pastel-green/60 text-text-primary px-1.5 py-0.5 rounded-full">
                {dueReviews.length} due
              </span>
            )}
          </div>
          {dueReviews.length > 0 ? (
            <div className="space-y-1.5">
              {dueReviews.map((r) => (
                <div key={r.topicId} className="flex items-center gap-2 px-2 py-2 rounded-[var(--radius-md)] bg-white/50 dark:bg-dark-bg/30">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-[12px] text-text-primary flex-1">{r.topicId}</span>
                  <span className="text-[10px] text-text-muted">~3 min</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 text-[12px] text-text-muted">
              Topics due for review will appear here.
            </div>
          )}
        </Card>

        {/* Deadlines */}
        <Card className="mb-3">
          <h2 className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary mb-3">
            Upcoming Deadlines
          </h2>
          {deadlines.length > 0 ? (
            <div className="space-y-1.5">
              {deadlines.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((d) => {
                const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000)
                return (
                  <div key={d.id} className="flex items-center gap-2 px-2 py-2 rounded-[var(--radius-md)] border border-border/40 dark:border-dark-border/40 group">
                    <div className="flex-1">
                      <p className="text-[12px] text-text-primary font-medium">{d.title}</p>
                      <p className="text-[10px] text-text-muted">{d.subject}</p>
                    </div>
                    <span className={`text-[10px] font-medium ${daysLeft <= 3 ? 'text-error' : daysLeft <= 7 ? 'text-warning' : 'text-text-muted'}`}>
                      {daysLeft <= 0 ? 'Today!' : `${daysLeft}d`}
                    </span>
                    <button onClick={() => removeDeadline(d.id)} className="text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-all text-[10px]">
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-5 text-[12px] text-text-muted">
              No deadlines set.
            </div>
          )}
        </Card>

        {/* Exam countdowns */}
        {deadlines.filter((d) => {
          const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000)
          return daysLeft > 0 && daysLeft <= 30
        }).length > 0 && (
          <Card className="mb-3" pastel="#FDE8EC30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={12} className="text-text-primary" />
              <h2 className="text-[13px] font-semibold text-text-primary">Exam Countdown</h2>
            </div>
            <div className="space-y-1.5">
              {deadlines
                .filter((d) => {
                  const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000)
                  return daysLeft > 0 && daysLeft <= 30
                })
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((d) => {
                  const daysLeft = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000)
                  return (
                    <div key={d.id} className="flex items-center gap-2 px-2 py-2 rounded-[var(--radius-md)] bg-white/60 dark:bg-dark-bg/30">
                      <div className={`text-[18px] font-bold ${daysLeft <= 7 ? 'text-error' : daysLeft <= 14 ? 'text-warning' : 'text-text-primary'}`}>
                        {daysLeft}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] text-text-primary font-medium">{d.title}</p>
                        <p className="text-[10px] text-text-muted">
                          {daysLeft <= 1 ? 'Tomorrow!' : daysLeft <= 7 ? 'This week — time to revise!' : `${daysLeft} days to go`}
                        </p>
                      </div>
                      {isPro && daysLeft <= 7 && (
                        <Button size="sm" variant="pastel" onClick={() => navigate('/exam')}>
                          <FileText size={10} /> Practice
                        </Button>
                      )}
                    </div>
                  )
                })}
            </div>
          </Card>
        )}

        {/* Pro nudge */}
        {!isPro && (
          <p className="text-[10px] text-text-muted flex items-center gap-1">
            Pro members get smart spaced repetition scheduling
            <ArrowRight size={8} />
          </p>
        )}

        {/* Add deadline modal */}
        {showAddDeadline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 px-6" onClick={() => setShowAddDeadline(false)}>
            <div className="bg-white dark:bg-dark-surface border border-border rounded-[var(--radius-xl)] p-5 w-full max-w-sm shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-text-primary">Add Deadline</h3>
                <button onClick={() => setShowAddDeadline(false)} className="text-text-muted hover:text-text-primary p-1"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <Input label="Title" value={dlTitle} onChange={(e) => setDlTitle(e.target.value)} placeholder="e.g. GCSE Maths Paper 1" />
                <Input label="Subject" value={dlSubject} onChange={(e) => setDlSubject(e.target.value)} placeholder="e.g. Maths" />
                <Input label="Date" type="date" value={dlDate} onChange={(e) => setDlDate(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => setShowAddDeadline(false)}>Cancel</Button>
                <Button size="sm" disabled={!dlTitle.trim() || !dlDate} onClick={() => {
                  addDeadline({ title: dlTitle.trim(), subject: dlSubject.trim(), dueDate: dlDate })
                  setDlTitle(''); setDlSubject(''); setDlDate('')
                  setShowAddDeadline(false)
                }}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
