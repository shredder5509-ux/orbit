import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Zap, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubjectStore } from '../stores/subjectStore'
import { useUserStore } from '../stores/userStore'
import { useMistakeStore } from '../stores/mistakeStore'
import { useSettingsStore } from '../stores/settingsStore'

interface SpeedQuestion {
  question: string
  options: string[]
  correctIndex: number
  topic: string
}

export function SpeedRoundPage() {
  const navigate = useNavigate()
  const { subjects } = useSubjectStore()
  const { addXp } = useUserStore()
  const { addMistake } = useMistakeStore()
  const { apiKey } = useSettingsStore()

  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [questions, setQuestions] = useState<SpeedQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [totalTime, setTotalTime] = useState(60)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const finishRound = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('results')

    const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || ''
    let correct = 0

    answers.forEach((a, i) => {
      if (i < questions.length) {
        if (a === questions[i].correctIndex) {
          correct++
        } else {
          addMistake({
            subject: subjectName,
            topic: questions[i].topic,
            question: questions[i].question,
            studentAnswer: a !== null ? questions[i].options[a] : '(no answer)',
            correctAnswer: questions[i].options[questions[i].correctIndex],
            source: 'speed',
          })
        }
      }
    })

    let xp = correct * 2 + 15
    if (correct === 10) xp += 25
    addXp(xp)
  }, [answers, questions, subjects, selectedSubject, addMistake, addXp])

  const generateQuestions = async () => {
    if (!apiKey) { setError('API key required'); return }
    setIsGenerating(true)
    setError('')

    const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || selectedSubject
    const topics = subjects.find((s) => s.id === selectedSubject)?.topics.map((t) => t.name) || []

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
          max_tokens: 1536,
          messages: [{
            role: 'user',
            content: `Generate 10 quick-fire multiple-choice questions for a speed round. Subject: ${subjectName}. Topics: ${topics.join(', ')}. Target: 13-year-old students. Questions should be answerable in under 6 seconds each — short and snappy.

Respond with ONLY a JSON array (no markdown):
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"topic":"..."},...]`,
          }],
        }),
      })

      const data = await res.json()
      const parsed = JSON.parse(data.content?.[0]?.text || '[]')
      setQuestions(parsed)
      setAnswers([])
      setCurrentQ(0)
      setTotalTime(60)
      setPhase('playing')
    } catch {
      setError('Failed to generate questions.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswer = useCallback((index: number) => {
    if (feedback) return
    const correct = index === questions[currentQ].correctIndex
    setFeedback(correct ? 'correct' : 'wrong')
    setAnswers((prev) => [...prev, index])

    setTimeout(() => {
      setFeedback(null)
      if (currentQ < questions.length - 1) {
        setCurrentQ((q) => q + 1)
      } else {
        finishRound()
      }
    }, 300)
  }, [feedback, currentQ, questions, finishRound])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTotalTime((t) => {
        if (t <= 1) {
          // Fill remaining with null
          const remaining = questions.length - answers.length
          for (let i = 0; i < remaining; i++) {
            setAnswers((prev) => [...prev, null])
          }
          finishRound()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, answers.length, questions.length, finishRound])

  if (phase === 'setup') {
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-text-muted">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Speed Round</h1>
        </div>

        <p className="text-sm text-text-muted mb-4">10 questions. 60 seconds. How fast can you go?</p>

        <div className="space-y-1 mb-4">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`w-full text-left px-3 py-2 text-sm rounded-[var(--radius-md)] border transition-colors ${
                selectedSubject === s.id
                  ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                  : 'border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-error mb-2">{error}</p>}

        <button
          onClick={generateQuestions}
          disabled={!selectedSubject || isGenerating}
          className="w-full py-2.5 text-sm font-medium border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary disabled:opacity-40"
        >
          {isGenerating ? 'Generating...' : 'Start'}
        </button>
      </div>
    )
  }

  if (phase === 'playing' && questions[currentQ]) {
    const q = questions[currentQ]
    return (
      <div className="fixed inset-0 bg-bg dark:bg-dark-bg flex flex-col items-center justify-center p-6 z-50">
        <div className="flex items-center gap-2 mb-8">
          <Clock size={16} strokeWidth={1.5} className={totalTime <= 10 ? 'text-error' : 'text-text-muted'} />
          <span className={`text-3xl font-light ${totalTime <= 10 ? 'text-error' : 'text-text-primary dark:text-dark-text-primary'}`}>
            {totalTime}
          </span>
        </div>

        <p className="text-lg font-medium text-text-primary dark:text-dark-text-primary text-center mb-8 max-w-sm">
          {q.question}
        </p>

        <div className="w-full max-w-sm space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={!!feedback}
              className={`w-full text-left px-4 py-3 text-sm rounded-[var(--radius-md)] border transition-all ${
                feedback && i === q.correctIndex ? 'border-success bg-success/10' :
                feedback === 'wrong' && answers[answers.length - 1] === i ? 'border-error bg-error/10' :
                'border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary active:scale-[0.98]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 mt-6">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < currentQ ? (answers[i] === questions[i]?.correctIndex ? 'bg-success' : 'bg-error')
                : i === currentQ ? 'bg-text-primary dark:bg-dark-text-primary'
                : 'bg-border dark:bg-dark-border'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const correct = answers.filter((a, i) => i < questions.length && a === questions[i].correctIndex).length
    const perfect = correct === 10
    const xpEarned = correct * 2 + 15 + (perfect ? 25 : 0)
    const timeUsed = 60 - totalTime

    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Zap size={32} strokeWidth={1.5} className={`mx-auto mb-3 ${perfect ? 'text-warning' : 'text-text-muted'}`} />
          <h1 className="text-xl font-medium text-text-primary dark:text-dark-text-primary mb-1">
            {perfect ? 'Perfect!' : correct >= 7 ? 'Nice work!' : 'Keep practising'}
          </h1>
          <p className="text-sm text-text-muted">+{xpEarned} XP</p>
        </div>

        <div className="flex justify-around mb-6">
          <div className="text-center">
            <p className="text-2xl font-medium text-text-primary dark:text-dark-text-primary">{correct}/10</p>
            <p className="text-xs text-text-muted">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-medium text-text-primary dark:text-dark-text-primary">{timeUsed}s</p>
            <p className="text-xs text-text-muted">Time used</p>
          </div>
        </div>

        <div className="space-y-1 mb-6">
          {questions.map((q, i) => {
            const wasCorrect = answers[i] === q.correctIndex
            return (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${wasCorrect ? 'bg-success' : 'bg-error'}`} />
                <span className="text-text-primary dark:text-dark-text-primary flex-1 truncate">{q.question}</span>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setPhase('setup'); setQuestions([]); setAnswers([]) }}
            className="flex-1 py-2.5 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] text-text-secondary dark:text-dark-text-secondary"
          >
            Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-2.5 text-sm border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return null
}
