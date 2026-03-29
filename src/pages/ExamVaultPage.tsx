import { useState } from 'react'
import { ArrowLeft, FileText, Clock, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'

const EXAM_BOARDS = ['AQA', 'Edexcel', 'OCR', 'WJEC'] as const
const SUBJECTS_BY_BOARD: Record<string, string[]> = {
  AQA: ['Mathematics', 'English Literature', 'English Language', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Computer Science'],
  Edexcel: ['Mathematics', 'English Literature', 'English Language', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Business'],
  OCR: ['Mathematics', 'English Literature', 'Biology', 'Chemistry', 'Physics', 'Computer Science', 'History', 'Geography'],
  WJEC: ['Mathematics', 'English Literature', 'English Language', 'Biology', 'Chemistry', 'Physics', 'History', 'Welsh'],
}
const LEVELS = ['GCSE', 'A-Level'] as const

interface GeneratedPaper {
  title: string
  questions: { text: string; marks: number; modelAnswer: string }[]
  totalMarks: number
  duration: number
}

export function ExamVaultPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { curriculum } = useUserStore()
  const { plan } = useSubscriptionStore()

  const [board, setBoard] = useState<string>(EXAM_BOARDS[0])
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState<string>(LEVELS[0])
  const [paper, setPaper] = useState<GeneratedPaper | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [error, setError] = useState('')

  const subjects = SUBJECTS_BY_BOARD[board] || []

  const generatePaper = async () => {
    if (!apiKey) { setError('API key required'); return }
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
            content: `Generate a realistic ${board} ${level} ${subject} exam paper. Include 8-12 questions with mark allocations totalling around 80 marks. Duration: 90 minutes.

Respond with ONLY JSON (no markdown):
{"title":"${board} ${level} ${subject} Paper","questions":[{"text":"...","marks":4,"modelAnswer":"..."}],"totalMarks":80,"duration":90}

Make questions realistic for a UK ${level} exam. Include a mix of short answer, extended response, and calculation questions where appropriate.`,
          }],
        }),
      })

      const data = await res.json()
      const parsed = JSON.parse(data.content?.[0]?.text || '{}')
      setPaper(parsed)
      setAnswers({})
      setShowAnswers(false)
    } catch {
      setError('Failed to generate paper.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (paper) {
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setPaper(null)} className="text-text-muted">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">{paper.title}</h1>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock size={12} strokeWidth={1.5} />
              <span>{paper.duration} min</span>
              <span>·</span>
              <span>{paper.totalMarks} marks</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {paper.questions.map((q, i) => (
            <div key={i} className="border border-border dark:border-dark-border rounded-[var(--radius-md)] p-3">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-muted">Question {i + 1}</span>
                <span className="text-xs text-text-muted">[{q.marks} marks]</span>
              </div>
              <p className="text-sm text-text-primary dark:text-dark-text-primary mb-2">{q.text}</p>
              <textarea
                value={answers[i] || ''}
                onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                placeholder="Your answer..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-sm)] bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary resize-none focus:outline-none focus:border-text-muted"
              />
              {showAnswers && (
                <div className="mt-2 pt-2 border-t border-border dark:border-dark-border">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Model answer</p>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{q.modelAnswer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex-1 py-2.5 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] text-text-secondary dark:text-dark-text-secondary"
          >
            {showAnswers ? 'Hide answers' : 'Show answers'}
          </button>
          <button
            onClick={() => setPaper(null)}
            className="flex-1 py-2.5 text-sm border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary"
          >
            New paper
          </button>
        </div>

        {plan === 'free' && (
          <p className="text-xs text-text-muted text-center mt-3">
            AI marking available with Pro. Self-mark against model answers above.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-muted">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Exam Paper Vault</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Exam board</label>
          <div className="flex flex-wrap gap-1.5">
            {EXAM_BOARDS.map((b) => (
              <button
                key={b}
                onClick={() => { setBoard(b); setSubject('') }}
                className={`px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors ${
                  board === b
                    ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                    : 'border-border dark:border-dark-border text-text-secondary dark:text-dark-text-secondary'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Level</label>
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors ${
                  level === l
                    ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                    : 'border-border dark:border-dark-border text-text-secondary dark:text-dark-text-secondary'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Subject</label>
          <div className="space-y-1">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`w-full text-left px-3 py-2 text-sm rounded-[var(--radius-md)] border transition-colors ${
                  subject === s
                    ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                    : 'border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <button
          onClick={generatePaper}
          disabled={!subject || isGenerating}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary disabled:opacity-40"
        >
          <FileText size={14} strokeWidth={1.5} />
          {isGenerating ? 'Generating paper...' : 'Generate Paper'}
        </button>
      </div>
    </div>
  )
}
