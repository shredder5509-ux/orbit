import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Check, Circle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'
import { generateCurriculumSpec } from '../services/claudeApi'
import type { CurriculumSpec, SpecUnit } from '../services/claudeApi'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CurriculumState {
  specs: CurriculumSpec[]
  addSpec: (spec: CurriculumSpec) => void
  togglePoint: (specIdx: number, unitIdx: number, pointIdx: number, field: 'covered' | 'mastered') => void
}

const useCurriculumStore = create<CurriculumState>()(
  persist(
    (set) => ({
      specs: [],
      addSpec: (spec) => set((s) => ({ specs: [...s.specs, spec] })),
      togglePoint: (specIdx, unitIdx, pointIdx, field) => set((s) => {
        const specs = [...s.specs]
        const point = specs[specIdx]?.units[unitIdx]?.points[pointIdx]
        if (point) {
          point[field] = !point[field]
          if (field === 'mastered' && point.mastered) point.covered = true
        }
        return { specs }
      }),
    }),
    { name: 'orbit-curriculum' }
  )
)

type State = 'list' | 'setup' | 'generating' | 'view'

export function CurriculumPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { curriculum } = useUserStore()
  const { specs, addSpec, togglePoint } = useCurriculumStore()

  const [state, setState] = useState<State>(specs.length > 0 ? 'list' : 'setup')
  const [board, setBoard] = useState('AQA')
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState(curriculum === 'a-level' ? 'A-Level' : 'GCSE Higher')
  const [viewIdx, setViewIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!subject.trim() || !apiKey) return
    setState('generating')
    setError(null)
    try {
      const spec = await generateCurriculumSpec(apiKey, board, subject.trim(), level)
      addSpec(spec)
      setViewIdx(specs.length)
      setState('view')
    } catch (err: any) {
      setError(err.message)
      setState('setup')
    }
  }

  if (state === 'generating') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Generating spec for {board} {level} {subject}...</p>
      </div>
    )
  }

  if (state === 'view' && specs[viewIdx]) {
    const spec = specs[viewIdx]
    const totalPoints = spec.units.reduce((s, u) => s + u.points.length, 0)
    const coveredPoints = spec.units.reduce((s, u) => s + u.points.filter((p) => p.covered).length, 0)
    const masteredPoints = spec.units.reduce((s, u) => s + u.points.filter((p) => p.mastered).length, 0)
    const coveredPct = totalPoints > 0 ? Math.round((coveredPoints / totalPoints) * 100) : 0
    const masteredPct = totalPoints > 0 ? Math.round((masteredPoints / totalPoints) * 100) : 0

    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => setState('list')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-0.5">
          {spec.examBoard} {spec.level} {spec.subject}
        </h1>
        <p className="text-[12px] text-text-muted mb-1">
          {coveredPct}% covered · {masteredPct}% mastered
        </p>
        <div className="flex gap-1 mb-5">
          <div className="flex-1 h-[3px] bg-border dark:bg-dark-border rounded-full overflow-hidden">
            <div className="h-full bg-text-primary dark:bg-dark-text-primary rounded-full transition-all" style={{ width: `${coveredPct}%` }} />
          </div>
        </div>

        <div className="space-y-4">
          {spec.units.map((unit, uIdx) => {
            const unitCovered = unit.points.filter((p) => p.covered).length
            const unitPct = unit.points.length > 0 ? Math.round((unitCovered / unit.points.length) * 100) : 0
            return (
              <div key={unit.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] text-text-muted font-mono">{unit.code}</span>
                  <span className="text-[13px] font-medium text-text-primary dark:text-dark-text-primary flex-1">{unit.title}</span>
                  <div className="w-16 h-[3px] bg-border dark:bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-text-primary dark:bg-dark-text-primary rounded-full" style={{ width: `${unitPct}%` }} />
                  </div>
                  <span className="text-[10px] text-text-muted w-8 text-right">{unitPct}%</span>
                </div>
                <div className="ml-4 space-y-0.5">
                  {unit.points.map((point, pIdx) => (
                    <button
                      key={point.id}
                      onClick={() => togglePoint(viewIdx, uIdx, pIdx, point.mastered ? 'mastered' : point.covered ? 'mastered' : 'covered')}
                      className="w-full flex items-center gap-2 py-1.5 px-2 rounded-[var(--radius-sm)] hover:bg-accent-light/30 dark:hover:bg-white/5 transition-colors text-left group"
                    >
                      {point.mastered ? (
                        <Check size={12} className="text-success shrink-0" />
                      ) : point.covered ? (
                        <Circle size={12} className="text-text-primary dark:text-dark-text-primary shrink-0" fill="currentColor" />
                      ) : (
                        <Circle size={12} className="text-border dark:text-dark-border shrink-0" />
                      )}
                      <span className="text-[11px] text-text-muted font-mono shrink-0">{point.code}</span>
                      <span className={`text-[12px] flex-1 ${point.mastered ? 'text-text-muted' : 'text-text-primary dark:text-dark-text-primary'}`}>
                        {point.title}
                      </span>
                      <span className="text-[9px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        {point.mastered ? 'mastered' : point.covered ? 'tap to master' : 'tap to mark'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (state === 'list') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary"><ArrowLeft size={16} /></button>
            <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">Curriculum Tracker</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setState('setup')}>+ Add subject</Button>
        </div>
        {specs.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-text-muted">No specs yet. Add a subject to track.</div>
        ) : (
          <div className="space-y-2">
            {specs.map((spec, i) => {
              const total = spec.units.reduce((s, u) => s + u.points.length, 0)
              const covered = spec.units.reduce((s, u) => s + u.points.filter((p) => p.covered).length, 0)
              const pct = total > 0 ? Math.round((covered / total) * 100) : 0
              return (
                <button key={i} onClick={() => { setViewIdx(i); setState('view') }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-md)] border border-border dark:border-white/10 hover:bg-accent-light/30 dark:hover:bg-white/5 transition-all text-left">
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-text-primary dark:text-dark-text-primary">{spec.examBoard} {spec.subject}</p>
                    <p className="text-[10px] text-text-muted">{spec.level} · {covered}/{total} points</p>
                  </div>
                  <div className="w-12 h-[3px] bg-border dark:bg-dark-border rounded-full overflow-hidden">
                    <div className="h-full bg-text-primary dark:bg-dark-text-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-text-muted">{pct}%</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Setup
  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => specs.length > 0 ? setState('list') : navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Curriculum Tracker</h1>
      <p className="text-[12px] text-text-muted mb-5">Track your progress against the exam spec.</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Exam board</label>
          <div className="flex gap-2">
            {['AQA', 'Edexcel', 'OCR'].map((b) => (
              <button key={b} onClick={() => setBoard(b)}
                className={`px-3 py-1.5 text-[12px] rounded-[var(--radius-md)] border transition-all ${board === b ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-secondary dark:text-dark-text-secondary'}`}
              >{b}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Level</label>
          <div className="flex gap-2">
            {['GCSE Foundation', 'GCSE Higher', 'A-Level'].map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={`px-3 py-1.5 text-[12px] rounded-[var(--radius-md)] border transition-all ${level === l ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-secondary dark:text-dark-text-secondary'}`}
              >{l}</button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleGenerate} disabled={!subject.trim() || !apiKey} size="lg">
        Set up <ArrowRight size={14} />
      </Button>
    </div>
  )
}
