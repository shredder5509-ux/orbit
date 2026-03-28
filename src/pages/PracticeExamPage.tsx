import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Clock, Loader2, CheckCircle, AlertCircle, Timer } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useUserStore } from '../stores/userStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSubjectStore } from '../stores/subjectStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useDataStore } from '../stores/dataStore'
import { useAnalyticsStore } from '../stores/analyticsStore'
import { generatePracticeExam, gradePracticeExam } from '../services/claudeApi'
import type { PracticeExam, ExamResult } from '../services/claudeApi'
import { Paywall } from '../components/Paywall'
import { PixelScene } from '../components/RetroIllustrations'

type ExamState = 'setup' | 'generating' | 'taking' | 'grading' | 'results'

export function PracticeExamPage() {
  const navigate = useNavigate()
  const { tutorName, curriculum } = useUserStore()
  const { apiKey } = useSettingsStore()
  const { subjects } = useSubjectStore()
  const { plan } = useSubscriptionStore()
  const { addXp } = useUserStore()
  const { addCompletedSession } = useDataStore()
  const { track } = useAnalyticsStore()

  const [state, setState] = useState<ExamState>('setup')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<'foundation' | 'higher' | 'mixed'>('mixed')
  const [duration, setDuration] = useState(30)
  const [exam, setExam] = useState<PracticeExam | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [results, setResults] = useState<{ results: ExamResult[]; totalScore: number; totalMarks: number; summary: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [startTime] = useState(Date.now())

  const isPro = plan !== 'free'

  const handleGenerate = async () => {
    if (!isPro) { setShowPaywall(true); return }
    if (!apiKey) { navigate('/settings'); return }
    if (!selectedSubject || selectedTopics.length === 0) return

    setState('generating')
    setError(null)
    try {
      const result = await generatePracticeExam(apiKey, selectedSubject, selectedTopics, difficulty, duration, curriculum)
      setExam(result)
      setState('taking')
      track('exam_taken', { subject: selectedSubject, topics: selectedTopics.length, difficulty, duration })
    } catch (err: any) {
      setError(err.message || 'Failed to generate exam')
      setState('setup')
    }
  }

  const handleSubmit = async () => {
    if (!exam || !apiKey) return
    setState('grading')
    try {
      const result = await gradePracticeExam(apiKey, exam, answers, tutorName)
      setResults(result)
      setState('results')

      const xp = Math.round((result.totalScore / result.totalMarks) * 50) + 25
      addXp(xp)
      const durationMins = Math.round((Date.now() - startTime) / 60000)
      addCompletedSession({
        id: crypto.randomUUID(),
        topicId: 'exam-' + selectedSubject,
        subjectName: selectedSubject,
        topicName: `Practice Exam: ${selectedSubject}`,
        mode: 'test',
        startedAt: new Date(startTime).toISOString(),
        endedAt: new Date().toISOString(),
        durationMinutes: durationMins,
        xpEarned: xp,
        gradeScore: Math.round((result.totalScore / result.totalMarks) * 100),
      })
    } catch (err: any) {
      setError(err.message || 'Failed to grade exam')
      setState('taking')
    }
  }

  const subjectWithTopics = subjects.find((s) => s.name === selectedSubject)

  // Setup
  if (state === 'setup') {
    return (
      <div className="relative max-w-[680px] mx-auto px-6 py-6">
        <PixelScene variant="minimal" />
        <div className="relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
            <ArrowLeft size={14} /> Back
          </button>

          <h1 className="text-lg font-semibold text-text-primary mb-1">Practice Exam</h1>
          <p className="text-[12px] text-text-muted mb-6">Generate a realistic exam to test yourself.</p>

          {!isPro && (
            <Card className="mb-4 text-center" pastel="#FFF8E150">
              <p className="text-[12px] text-text-primary font-medium mb-2">Practice exams are a Pro feature</p>
              <Button size="sm" onClick={() => setShowPaywall(true)}>Start free trial</Button>
            </Card>
          )}

          {/* Subject picker */}
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Subject</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedSubject(s.name); setSelectedTopics(s.topics.map((t) => t.name)) }}
                className={`px-3 py-1.5 rounded-[var(--radius-md)] text-[12px] border transition-all ${
                  selectedSubject === s.name
                    ? 'bg-text-primary text-white border-text-primary'
                    : 'border-border text-text-secondary hover:border-text-muted'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Topic selection */}
          {subjectWithTopics && (
            <>
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Topics to include</p>
              <div className="space-y-1 mb-5">
                {subjectWithTopics.topics.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-accent-light/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(t.name)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTopics([...selectedTopics, t.name])
                        else setSelectedTopics(selectedTopics.filter((n) => n !== t.name))
                      }}
                      className="rounded"
                    />
                    <span className="text-[12px] text-text-primary">{t.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Difficulty */}
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Difficulty</p>
          <div className="flex gap-2 mb-5">
            {(['foundation', 'higher', 'mixed'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-[var(--radius-md)] text-[12px] border capitalize transition-all ${
                  difficulty === d
                    ? 'bg-text-primary text-white border-text-primary'
                    : 'border-border text-text-secondary hover:border-text-muted'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Duration */}
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Duration</p>
          <div className="flex gap-2 mb-6">
            {[30, 45, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-2 rounded-[var(--radius-md)] text-[12px] border transition-all ${
                  duration === d
                    ? 'bg-text-primary text-white border-text-primary'
                    : 'border-border text-text-secondary hover:border-text-muted'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>

          {error && <p className="text-[12px] text-error mb-4">{error}</p>}

          <Button onClick={handleGenerate} disabled={!selectedSubject || selectedTopics.length === 0} size="lg" className="w-full">
            Generate Exam <ArrowRight size={14} />
          </Button>
        </div>
        <Paywall open={showPaywall} onClose={() => setShowPaywall(false)} />
      </div>
    )
  }

  // Generating
  if (state === 'generating') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <Loader2 className="animate-spin text-text-muted mb-3" size={24} />
        <p className="text-sm text-text-muted">{tutorName} is writing your exam...</p>
      </div>
    )
  }

  // Taking the exam
  if (state === 'taking' && exam) {
    const q = exam.questions[currentQ]
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{exam.title}</h2>
            <p className="text-[10px] text-text-muted">Question {currentQ + 1} of {exam.questions.length} · {q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-text-muted bg-pastel-yellow/40 px-2 py-1 rounded-full">
            <Timer size={10} /> {exam.totalMarks} marks total
          </div>
        </div>

        {/* Question */}
        <Card className="mb-4">
          <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{q.text}</p>
        </Card>

        {/* Answer */}
        <textarea
          value={answers[q.id] || ''}
          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
          placeholder="Write your answer here..."
          rows={q.type === 'extended' ? 8 : 4}
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-white text-text-primary placeholder:text-text-muted text-[13px] focus:outline-none focus:border-text-primary transition-colors resize-none mb-4"
        />

        {/* Navigation */}
        <div className="flex gap-2">
          {currentQ > 0 && (
            <Button variant="secondary" onClick={() => setCurrentQ(currentQ - 1)}>
              <ArrowLeft size={14} /> Prev
            </Button>
          )}
          <div className="flex-1" />
          {currentQ < exam.questions.length - 1 ? (
            <Button onClick={() => setCurrentQ(currentQ + 1)}>
              Next <ArrowRight size={14} />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Submit Exam <CheckCircle size={14} />
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex justify-center gap-1.5 mt-6">
          {exam.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentQ ? 'bg-text-primary scale-125'
                : answers[exam.questions[i].id] ? 'bg-success'
                : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  // Grading
  if (state === 'grading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <Loader2 className="animate-spin text-text-muted mb-3" size={24} />
        <p className="text-sm text-text-muted">{tutorName} is marking your exam...</p>
      </div>
    )
  }

  // Results
  if (state === 'results' && results && exam) {
    const percentage = Math.round((results.totalScore / results.totalMarks) * 100)
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <h1 className="text-lg font-semibold text-text-primary mb-4">Exam Results</h1>

        {/* Score */}
        <Card className="mb-4 text-center" pastel={percentage >= 70 ? '#E6F7ED40' : percentage >= 50 ? '#FFF8E140' : '#FDE8EC40'}>
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
              <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${(percentage / 100) * 220} 220`} strokeLinecap="round"
                className={percentage >= 70 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-error'} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-text-primary">{percentage}%</span>
          </div>
          <p className="text-[13px] font-medium text-text-primary">{results.totalScore} / {results.totalMarks} marks</p>
          <p className="text-[12px] text-text-muted mt-1">{results.summary}</p>
        </Card>

        {/* Per-question results */}
        <div className="space-y-2 mb-6">
          {results.results.map((r, i) => {
            const q = exam.questions.find((q) => q.id === r.questionId) || exam.questions[i]
            const pct = r.maxMarks > 0 ? r.score / r.maxMarks : 0
            return (
              <Card key={r.questionId} padding="sm">
                <div className="flex items-start gap-2">
                  {pct >= 0.7 ? (
                    <CheckCircle size={14} className="text-success mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={14} className={`${pct >= 0.4 ? 'text-warning' : 'text-error'} mt-0.5 shrink-0`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-text-primary font-medium truncate">{q?.text?.slice(0, 60)}...</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{r.feedback}</p>
                  </div>
                  <span className="text-[11px] font-medium text-text-primary shrink-0">{r.score}/{r.maxMarks}</span>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setState('setup'); setExam(null); setAnswers({}); setResults(null) }} className="flex-1">
            New Exam
          </Button>
          <Button onClick={() => navigate('/')} className="flex-1">
            Back to Orbit
          </Button>
        </div>
      </div>
    )
  }

  return null
}
