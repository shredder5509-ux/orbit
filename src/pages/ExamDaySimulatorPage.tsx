import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Clock, AlertTriangle, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'

interface SimExamQuestion {
  text: string
  marks: number
  modelAnswer: string
}

type Phase = 'setup' | 'reading' | 'exam' | 'submitted' | 'results'

export function ExamDaySimulatorPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { addXp } = useUserStore()

  const [phase, setPhase] = useState<Phase>('setup')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState(60)
  const [questions, setQuestions] = useState<SimExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [readingTime, setReadingTime] = useState(300) // 5 min
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [scores, setScores] = useState<Record<number, number>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleAutoSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('submitted')
    addXp(50)

    // Simple self-mark: just show model answers
    const autoScores: Record<number, number> = {}
    questions.forEach((_, i) => {
      autoScores[i] = answers[i]?.trim() ? -1 : 0 // -1 = needs marking, 0 = blank
    })
    setScores(autoScores)
    setPhase('results')
  }, [questions, answers, addXp])

  const startExam = async () => {
    if (!apiKey || !subject.trim()) return
    setIsGenerating(true)
    setError('')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Generate a realistic GCSE-style ${subject} exam paper for a full exam simulation. ${duration} minutes, ~${Math.round(duration * 1.2)} marks total.

Respond with ONLY JSON (no markdown):
[{"text":"...","marks":4,"modelAnswer":"..."}]

Make 8-10 questions, increasing difficulty. Mix short answer, extended response, and calculations where relevant.`,
          }],
        }),
      })

      const data = await res.json()
      const parsed = JSON.parse(data.content?.[0]?.text || '[]')
      setQuestions(parsed)
      setAnswers({})
      setReadingTime(300)
      setPhase('reading')
    } catch {
      setError('Failed to generate exam.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Reading time countdown
  useEffect(() => {
    if (phase !== 'reading') return
    timerRef.current = setInterval(() => {
      setReadingTime((t) => {
        if (t <= 1) {
          setPhase('exam')
          setTimeLeft(duration * 60)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, duration])

  // Exam time countdown
  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleAutoSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, handleAutoSubmit])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)

  if (phase === 'setup') {
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-text-muted">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Exam Day Simulator</h1>
        </div>

        <div className="border border-warning/30 rounded-[var(--radius-md)] p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={14} strokeWidth={1.5} className="text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
            This simulates real exam conditions. 5 minutes reading time (no writing), then a timed exam with no pause and no AI help. Auto-submits when time runs out.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Biology"
              className="w-full px-3 py-2 text-sm border-b border-border dark:border-dark-border bg-transparent text-text-primary dark:text-dark-text-primary focus:outline-none focus:border-text-muted"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Duration</label>
            <div className="flex gap-1.5">
              {[45, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors ${
                    duration === d
                      ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                      : 'border-border dark:border-dark-border text-text-secondary dark:text-dark-text-secondary'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <button
            onClick={startExam}
            disabled={!subject.trim() || isGenerating || !apiKey}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary disabled:opacity-40"
          >
            <Play size={14} strokeWidth={1.5} />
            {isGenerating ? 'Preparing exam...' : 'Begin Simulation'}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'reading') {
    return (
      <div className="fixed inset-0 bg-bg dark:bg-dark-bg z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 pb-24">
          <div className="text-center py-4 mb-6">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Reading time</p>
            <p className="text-3xl font-light text-text-primary dark:text-dark-text-primary">{formatTime(readingTime)}</p>
            <p className="text-xs text-text-muted mt-1">Read the questions. You cannot write yet.</p>
          </div>

          <div className="space-y-3 opacity-90">
            {questions.map((q, i) => (
              <div key={i} className="border border-border dark:border-dark-border rounded-[var(--radius-md)] p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-text-muted">Q{i + 1}</span>
                  <span className="text-xs text-text-muted">[{q.marks}]</span>
                </div>
                <p className="text-sm text-text-primary dark:text-dark-text-primary">{q.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'exam') {
    return (
      <div className="fixed inset-0 bg-bg dark:bg-dark-bg z-50 overflow-y-auto">
        <div className="sticky top-0 bg-bg dark:bg-dark-bg border-b border-border dark:border-dark-border px-4 py-2 z-10">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <span className="text-xs text-text-muted">{subject} · {totalMarks} marks</span>
            <div className="flex items-center gap-1">
              <Clock size={12} strokeWidth={1.5} className={timeLeft < 300 ? 'text-error' : 'text-text-muted'} />
              <span className={`text-sm ${timeLeft < 300 ? 'text-error font-medium' : 'text-text-primary dark:text-dark-text-primary'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto p-4 pb-24">
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="border border-border dark:border-dark-border rounded-[var(--radius-md)] p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-text-muted">Q{i + 1}</span>
                  <span className="text-xs text-text-muted">[{q.marks}]</span>
                </div>
                <p className="text-sm text-text-primary dark:text-dark-text-primary mb-2">{q.text}</p>
                <textarea
                  value={answers[i] || ''}
                  onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                  placeholder="Your answer..."
                  rows={Math.max(3, Math.ceil(q.marks / 2))}
                  className="w-full px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-sm)] bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary resize-none focus:outline-none focus:border-text-muted"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleAutoSubmit}
            className="w-full mt-6 py-2.5 text-sm font-medium border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary"
          >
            Submit exam
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const answered = Object.values(answers).filter((a) => a?.trim()).length
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setPhase('setup'); setQuestions([]) }} className="text-text-muted">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Exam Complete</h1>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-text-muted mb-1">+50 XP for completing a full simulation</p>
          <p className="text-xs text-text-muted">
            {answered}/{questions.length} questions answered
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="border border-border dark:border-dark-border rounded-[var(--radius-md)] p-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-text-muted">Q{i + 1} [{q.marks} marks]</span>
              </div>
              <p className="text-sm text-text-primary dark:text-dark-text-primary mb-2">{q.text}</p>
              {answers[i]?.trim() && (
                <div className="mb-2">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">Your answer</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{answers[i]}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide">Model answer</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{q.modelAnswer}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setPhase('setup'); setQuestions([]) }}
          className="w-full mt-6 py-2.5 text-sm border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary"
        >
          Done
        </button>
      </div>
    )
  }

  return null
}
