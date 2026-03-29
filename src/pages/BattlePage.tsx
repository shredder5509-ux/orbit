import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Swords, Clock, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubjectStore } from '../stores/subjectStore'
import { useUserStore } from '../stores/userStore'
import { useMistakeStore } from '../stores/mistakeStore'
import { useSettingsStore } from '../stores/settingsStore'

type Difficulty = 'easy' | 'medium' | 'hard' | 'impossible'

interface BattleQuestion {
  question: string
  options: string[]
  correctIndex: number
  topic: string
}

interface BattleResult {
  playerScore: number
  botScore: number
  playerAnswers: (number | null)[]
  botAnswers: number[]
  timeTaken: number[]
}

const BOT_ACCURACY: Record<Difficulty, number> = {
  easy: 0.4,
  medium: 0.65,
  hard: 0.85,
  impossible: 0.95,
}

const BOT_NAMES: Record<Difficulty, string> = {
  easy: 'Dusty the Beginner',
  medium: 'Nova the Student',
  hard: 'Cosmo the Scholar',
  impossible: 'Zenith the Master',
}

export function BattlePage() {
  const navigate = useNavigate()
  const { subjects } = useSubjectStore()
  const { addXp } = useUserStore()
  const { addMistake } = useMistakeStore()
  const { apiKey } = useSettingsStore()

  const [phase, setPhase] = useState<'setup' | 'playing' | 'results'>('setup')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [questions, setQuestions] = useState<BattleQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [result, setResult] = useState<BattleResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const playerAnswers = useRef<(number | null)[]>([])
  const timeTaken = useRef<number[]>([])

  const generateQuestions = async () => {
    if (!apiKey) {
      setError('API key required')
      return
    }
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
            content: `Generate 5 multiple-choice quiz questions for a study battle game. Subject: ${subjectName}. Topics: ${topics.join(', ')}. Difficulty: ${difficulty}. Target audience: 13-year-old students.

Respond with ONLY a JSON array (no markdown, no code fences):
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"topic":"..."},...]

Each question must have exactly 4 options. correctIndex is 0-3.`,
          }],
        }),
      })

      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const parsed = JSON.parse(text)
      setQuestions(parsed)
      setPhase('playing')
      setCurrentQ(0)
      setTimeLeft(15)
      startTimeRef.current = Date.now()
      playerAnswers.current = []
      timeTaken.current = []
    } catch {
      setError('Failed to generate questions. Check your API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  const finishBattle = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    const botAccuracy = BOT_ACCURACY[difficulty]
    const botAnswers = questions.map((q) =>
      Math.random() < botAccuracy ? q.correctIndex : (q.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4
    )

    const playerScore = playerAnswers.current.reduce((sum, a, i) =>
      sum + (a === questions[i].correctIndex ? 100 + Math.max(0, Math.round((15 - timeTaken.current[i]) * 5)) : 0), 0)

    const botScore = botAnswers.reduce((sum, a, i) =>
      sum + (a === questions[i].correctIndex ? 100 + Math.floor(Math.random() * 50) : 0), 0)

    const battleResult: BattleResult = {
      playerScore,
      botScore,
      playerAnswers: playerAnswers.current,
      botAnswers,
      timeTaken: timeTaken.current,
    }

    setResult(battleResult)
    setPhase('results')

    // Record mistakes
    const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || ''
    playerAnswers.current.forEach((a, i) => {
      if (a !== questions[i].correctIndex) {
        addMistake({
          subject: subjectName,
          topic: questions[i].topic,
          question: questions[i].question,
          studentAnswer: a !== null ? questions[i].options[a] : '(no answer)',
          correctAnswer: questions[i].options[questions[i].correctIndex],
          source: 'battle',
        })
      }
    })

    // XP
    const won = playerScore > botScore
    addXp(won ? 50 : 20)
  }, [questions, difficulty, subjects, selectedSubject, addMistake, addXp])

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    playerAnswers.current[currentQ] = index
    timeTaken.current[currentQ] = (Date.now() - startTimeRef.current) / 1000

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1)
        setSelectedAnswer(null)
        setTimeLeft(15)
        startTimeRef.current = Date.now()
      } else {
        finishBattle()
      }
    }, 800)
  }, [selectedAnswer, currentQ, questions.length, finishBattle])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          playerAnswers.current[currentQ] = null
          timeTaken.current[currentQ] = 15
          if (currentQ < questions.length - 1) {
            setCurrentQ((q) => q + 1)
            setSelectedAnswer(null)
            startTimeRef.current = Date.now()
            return 15
          } else {
            finishBattle()
            return 0
          }
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, currentQ, questions.length, finishBattle])

  if (phase === 'setup') {
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-text-muted">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Study Battle</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Subject</label>
            <div className="space-y-1">
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
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Opponent</label>
            <div className="space-y-1">
              {(['easy', 'medium', 'hard', 'impossible'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-[var(--radius-md)] border transition-colors ${
                    difficulty === d
                      ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                      : 'border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary'
                  }`}
                >
                  {BOT_NAMES[d]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <button
            onClick={generateQuestions}
            disabled={!selectedSubject || isGenerating}
            className="w-full py-2.5 text-sm font-medium border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary disabled:opacity-40 transition-colors"
          >
            {isGenerating ? 'Setting up battle...' : 'Start Battle'}
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'playing' && questions[currentQ]) {
    const q = questions[currentQ]
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-text-muted">Q{currentQ + 1} of {questions.length}</span>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Clock size={12} strokeWidth={1.5} />
            <span className={timeLeft <= 5 ? 'text-error font-medium' : ''}>{timeLeft}s</span>
          </div>
        </div>

        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-6">
          {q.question}
        </p>

        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isSelected = selectedAnswer === i
            const isCorrect = i === q.correctIndex
            const showResult = selectedAnswer !== null

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selectedAnswer !== null}
                className={`w-full text-left px-4 py-3 text-sm rounded-[var(--radius-md)] border transition-all ${
                  showResult && isCorrect
                    ? 'border-success bg-success/5 text-text-primary dark:text-dark-text-primary'
                    : showResult && isSelected && !isCorrect
                    ? 'border-error bg-error/5 text-text-primary dark:text-dark-text-primary'
                    : isSelected
                    ? 'border-text-primary dark:border-dark-text-primary'
                    : 'border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>

        <p className="text-[10px] text-text-muted mt-3 text-center">{q.topic}</p>
      </div>
    )
  }

  if (phase === 'results' && result) {
    const won = result.playerScore > result.botScore
    const tied = result.playerScore === result.botScore
    const correctCount = result.playerAnswers.filter((a, i) => a === questions[i].correctIndex).length

    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Trophy size={32} strokeWidth={1.5} className={`mx-auto mb-3 ${won ? 'text-warning' : 'text-text-muted'}`} />
          <h1 className="text-xl font-medium text-text-primary dark:text-dark-text-primary mb-1">
            {won ? 'You won!' : tied ? "It's a tie!" : 'Better luck next time'}
          </h1>
          <p className="text-sm text-text-muted">+{won ? 50 : 20} XP</p>
        </div>

        <div className="flex justify-between items-center mb-6 px-4">
          <div className="text-center">
            <p className="text-2xl font-medium text-text-primary dark:text-dark-text-primary">{result.playerScore}</p>
            <p className="text-xs text-text-muted">You</p>
          </div>
          <Swords size={20} strokeWidth={1.5} className="text-text-muted" />
          <div className="text-center">
            <p className="text-2xl font-medium text-text-primary dark:text-dark-text-primary">{result.botScore}</p>
            <p className="text-xs text-text-muted">{BOT_NAMES[difficulty]}</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {questions.map((q, i) => {
            const playerCorrect = result.playerAnswers[i] === q.correctIndex
            return (
              <div key={i} className="px-3 py-2 border border-border dark:border-dark-border rounded-[var(--radius-md)]">
                <p className="text-xs text-text-primary dark:text-dark-text-primary mb-1">{q.question}</p>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <span className={playerCorrect ? 'text-success' : 'text-error'}>
                    {playerCorrect ? 'Correct' : 'Wrong'}
                  </span>
                  <span>·</span>
                  <span>{result.timeTaken[i]?.toFixed(1)}s</span>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-text-muted text-center mb-4">
          {correctCount}/{questions.length} correct
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => { setPhase('setup'); setQuestions([]); setResult(null) }}
            className="flex-1 py-2.5 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] text-text-secondary dark:text-dark-text-secondary"
          >
            Play again
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
