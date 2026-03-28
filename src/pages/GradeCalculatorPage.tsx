import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

interface Assessment {
  id: string
  name: string
  score: number
  weight: number
}

const GRADE_BOUNDARIES = [
  { grade: '9', min: 90 },
  { grade: '8', min: 80 },
  { grade: '7', min: 70 },
  { grade: '6', min: 60 },
  { grade: '5', min: 50 },
  { grade: '4', min: 40 },
]

export function GradeCalculatorPage() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [name, setName] = useState('')
  const [score, setScore] = useState('')
  const [weight, setWeight] = useState('')

  const totalWeight = assessments.reduce((s, a) => s + a.weight, 0)
  const remainingWeight = Math.max(0, 100 - totalWeight)
  const weightedSum = assessments.reduce((s, a) => s + (a.score * a.weight / 100), 0)
  const currentAvg = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0
  const currentGrade = GRADE_BOUNDARIES.find((g) => currentAvg >= g.min)?.grade || 'Below 4'

  const addAssessment = () => {
    if (!name.trim() || !score || !weight) return
    setAssessments([...assessments, { id: crypto.randomUUID(), name: name.trim(), score: Number(score), weight: Number(weight) }])
    setName(''); setScore(''); setWeight('')
  }

  const neededForGrade = (targetMin: number) => {
    if (remainingWeight <= 0) return null
    const needed = ((targetMin - weightedSum) / remainingWeight) * 100
    return Math.round(needed)
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary mb-1">Grade calculator</h1>
      <p className="text-[12px] text-text-muted mb-5">See what you need on your remaining exams.</p>

      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Maths" className="mb-5" />

      {/* Assessments */}
      <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">ASSESSMENTS</p>
      {assessments.length > 0 && (
        <div className="space-y-1 mb-3">
          {assessments.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-1.5 text-[13px] border-b border-border/30 group">
              <span className="flex-1 text-text-primary">{a.name}</span>
              <span className="text-text-secondary">{a.score}%</span>
              <span className="text-text-muted text-[11px]">w: {a.weight}%</span>
              <button onClick={() => setAssessments(assessments.filter((x) => x.id !== a.id))} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add assessment */}
      <div className="flex gap-2 items-end mb-5">
        <div className="flex-1"><Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Autumn test" /></div>
        <div className="w-20"><Input label="Score %" value={score} onChange={(e) => setScore(e.target.value)} placeholder="72" /></div>
        <div className="w-24"><Input label="Weight %" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="20" /></div>
        <Button variant="secondary" size="sm" onClick={addAssessment} className="mb-0.5"><Plus size={12} /></Button>
      </div>

      {/* Results */}
      {assessments.length > 0 && (
        <div className="border-t border-border/50 pt-4">
          {remainingWeight > 0 && (
            <p className="text-[11px] text-text-muted mb-2">Remaining weight: {remainingWeight}% (final exam)</p>
          )}

          <p className="text-[13px] text-text-primary mb-0.5">
            Current average: <span className="font-semibold">{Math.round(currentAvg)}%</span>
          </p>
          <p className="text-[13px] text-text-primary mb-4">
            Estimated grade: <span className="font-semibold">Grade {currentGrade}</span>
          </p>

          {remainingWeight > 0 && (
            <div className="space-y-1.5">
              {GRADE_BOUNDARIES.map(({ grade, min }) => {
                const needed = neededForGrade(min)
                if (needed === null) return null
                const possible = needed <= 100
                return (
                  <div key={grade} className="flex items-center gap-3 text-[12px]">
                    <span className="w-14 text-text-secondary">Grade {grade}</span>
                    <span className={`flex-1 ${possible ? 'text-text-primary' : 'text-text-muted'}`}>
                      {possible
                        ? `Need ${needed}% on final exam`
                        : `Would need ${needed}% — not possible`
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
