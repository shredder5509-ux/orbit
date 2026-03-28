import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Check, X, FileText, Printer } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'
import { generateWorksheet } from '../services/claudeApi'
import type { Worksheet, WorksheetQuestion } from '../services/claudeApi'

type State = 'setup' | 'generating' | 'working' | 'results'

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'fill_blank', label: 'Fill in the Blank' },
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'true_false', label: 'True / False' },
  { id: 'matching', label: 'Matching' },
]

export function WorksheetPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { subjects, addXp } = useUserStore()

  const [state, setState] = useState<State>('setup')
  const [subject, setSubject] = useState(subjects[0] || '')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [count, setCount] = useState(8)
  const [types, setTypes] = useState<string[]>(['multiple_choice', 'short_answer', 'fill_blank'])
  const [error, setError] = useState<string | null>(null)

  const [worksheet, setWorksheet] = useState<Worksheet | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  const toggleType = (id: string) => {
    setTypes((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))
  }

  const handleGenerate = async () => {
    if (!topic.trim() || !apiKey || types.length === 0) return
    setState('generating')
    setError(null)
    try {
      const ws = await generateWorksheet(apiKey, subject, topic.trim(), difficulty, count, types)
      setWorksheet(ws)
      setAnswers({})
      setChecked(false)
      setState('working')
      addXp(10)
    } catch (err: any) {
      setError(err.message)
      setState('setup')
    }
  }

  const handleCheck = () => {
    setChecked(true)
    setState('results')
    addXp(15)
  }

  const getScore = () => {
    if (!worksheet) return { correct: 0, total: 0 }
    let correct = 0
    worksheet.questions.forEach((q) => {
      const userAnswer = (answers[q.id] || '').trim().toLowerCase()
      const correctAnswer = q.answer.trim().toLowerCase()
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (userAnswer === correctAnswer || userAnswer === correctAnswer.charAt(0).toLowerCase()) correct++
      } else if (correctAnswer.includes(userAnswer) && userAnswer.length > 0) {
        correct++
      }
    })
    return { correct, total: worksheet.questions.length }
  }

  if (state === 'generating') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Creating your worksheet...</p>
      </div>
    )
  }

  if ((state === 'working' || state === 'results') && worksheet) {
    const score = getScore()

    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setState('setup')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
            <ArrowLeft size={14} /> Back
          </button>
          {!checked && (
            <Button size="sm" onClick={handleCheck} disabled={Object.keys(answers).length === 0}>
              <Check size={12} /> Check Answers
            </Button>
          )}
        </div>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-0.5">{worksheet.title}</h1>
        <p className="text-[11px] text-text-muted mb-4">{worksheet.subject} · {worksheet.topic} · {worksheet.difficulty} · {worksheet.totalMarks} marks</p>

        {checked && (
          <Card className="mb-4 text-center" pastel={score.correct >= score.total * 0.7 ? '#E6F7ED60' : '#FFF0E060'}>
            <p className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{score.correct}/{score.total}</p>
            <p className="text-[11px] text-text-muted">
              {score.correct >= score.total * 0.9 ? 'Excellent!' : score.correct >= score.total * 0.7 ? 'Great work!' : 'Keep practising!'}
            </p>
          </Card>
        )}

        <div className="space-y-3">
          {worksheet.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              index={i + 1}
              question={q}
              answer={answers[q.id] || ''}
              onAnswer={(val) => setAnswers((a) => ({ ...a, [q.id]: val }))}
              checked={checked}
            />
          ))}
        </div>

        {checked && (
          <div className="flex gap-2 mt-5">
            <Button variant="secondary" size="sm" onClick={() => { setState('setup'); setWorksheet(null) }}>
              <FileText size={12} /> New Worksheet
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer size={12} /> Print
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Setup
  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Worksheet Generator</h1>
      <p className="text-[12px] text-text-muted mb-5">AI creates practice questions on any topic.</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Topic</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Difficulty</label>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 text-[12px] rounded-[var(--radius-md)] border transition-all capitalize ${difficulty === d ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-secondary dark:text-dark-text-secondary'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Questions ({count})</label>
          <input type="range" min={4} max={15} value={count} onChange={(e) => setCount(+e.target.value)}
            className="w-full accent-text-primary" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Question types</label>
          <div className="flex flex-wrap gap-1.5">
            {QUESTION_TYPES.map((qt) => (
              <button key={qt.id} onClick={() => toggleType(qt.id)}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${types.includes(qt.id) ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-muted'}`}>
                {qt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleGenerate} disabled={!topic.trim() || !apiKey || types.length === 0} size="lg" className="w-full">
        <FileText size={14} /> Generate Worksheet
      </Button>
      {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
    </div>
  )
}

function QuestionCard({ index, question, answer, onAnswer, checked }: {
  index: number
  question: WorksheetQuestion
  answer: string
  onAnswer: (val: string) => void
  checked: boolean
}) {
  const isCorrect = (() => {
    const userAnswer = answer.trim().toLowerCase()
    const correctAnswer = question.answer.trim().toLowerCase()
    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      return userAnswer === correctAnswer || userAnswer === correctAnswer.charAt(0).toLowerCase()
    }
    return correctAnswer.includes(userAnswer) && userAnswer.length > 0
  })()

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <Card className={checked ? (isCorrect ? 'border-success/30' : 'border-error/30') : ''}>
        <div className="flex items-start gap-2 mb-2">
          <span className="text-[10px] text-text-muted font-mono shrink-0 mt-0.5">Q{index}</span>
          <p className="text-[13px] text-text-primary dark:text-dark-text-primary flex-1">{question.question}</p>
          <span className="text-[9px] text-text-muted shrink-0">{question.marks}m</span>
        </div>

        {question.type === 'multiple_choice' && question.options ? (
          <div className="ml-5 space-y-1">
            {question.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const selected = answer.toLowerCase() === letter.toLowerCase() || answer === opt
              return (
                <button key={i} onClick={() => !checked && onAnswer(letter)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[12px] border transition-all ${
                    selected ? 'border-text-primary dark:border-white/30 bg-accent-light/40 dark:bg-white/10' : 'border-transparent hover:bg-accent-light/20 dark:hover:bg-white/5'
                  } ${checked && question.answer.toLowerCase().startsWith(letter.toLowerCase()) ? 'border-success bg-success/10' : ''}`}>
                  <span className="font-mono text-text-muted mr-2">{letter}.</span>
                  <span className="text-text-primary dark:text-dark-text-primary">{opt}</span>
                </button>
              )
            })}
          </div>
        ) : question.type === 'true_false' ? (
          <div className="ml-5 flex gap-2">
            {['True', 'False'].map((opt) => (
              <button key={opt} onClick={() => !checked && onAnswer(opt.toLowerCase())}
                className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] border transition-all ${
                  answer.toLowerCase() === opt.toLowerCase() ? 'border-text-primary bg-accent-light/40 dark:bg-white/10' : 'border-border dark:border-white/15'
                }`}>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <input value={answer} onChange={(e) => onAnswer(e.target.value)} disabled={checked}
            placeholder="Your answer..."
            className="ml-5 w-[calc(100%-1.25rem)] px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-[12px] focus:outline-none focus:border-text-primary transition-colors" />
        )}

        {checked && (
          <div className="ml-5 mt-2 flex items-start gap-1.5">
            {isCorrect ? (
              <Check size={12} className="text-success mt-0.5 shrink-0" />
            ) : (
              <X size={12} className="text-error mt-0.5 shrink-0" />
            )}
            <div>
              {!isCorrect && <p className="text-[11px] text-text-primary dark:text-dark-text-primary font-medium">Answer: {question.answer}</p>}
              <p className="text-[10px] text-text-muted">{question.explanation}</p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
