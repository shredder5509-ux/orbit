import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Check, X, BookOpen, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'
import { generateComprehension } from '../services/claudeApi'
import type { ComprehensionPassage } from '../services/claudeApi'

type State = 'setup' | 'generating' | 'reading' | 'answering' | 'results'

const GENRES = ['Fiction', 'Non-fiction', 'Science', 'History', 'News article', 'Speech', 'Poetry', 'Biography']

export function ReadingPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { subjects, addXp } = useUserStore()

  const [state, setState] = useState<State>('setup')
  const [subject, setSubject] = useState('English')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [genre, setGenre] = useState('Fiction')
  const [error, setError] = useState<string | null>(null)

  const [passage, setPassage] = useState<ComprehensionPassage | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [showVocab, setShowVocab] = useState(false)

  const handleGenerate = async () => {
    if (!apiKey) return
    setState('generating')
    setError(null)
    try {
      const p = await generateComprehension(apiKey, subject, difficulty, genre)
      setPassage(p)
      setAnswers({})
      setChecked(false)
      setState('reading')
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

  if (state === 'generating') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Creating a passage for you...</p>
      </div>
    )
  }

  if ((state === 'reading' || state === 'answering' || state === 'results') && passage) {
    const totalMarks = passage.questions.reduce((s, q) => s + q.marks, 0)

    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setState('setup')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex gap-1.5">
            {passage.vocabulary.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowVocab(!showVocab)}>
                <HelpCircle size={10} /> Vocab
              </Button>
            )}
            {state === 'reading' && (
              <Button size="sm" onClick={() => setState('answering')}>
                Answer Questions
              </Button>
            )}
          </div>
        </div>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-0.5">{passage.title}</h1>
        <p className="text-[10px] text-text-muted mb-3">{passage.source} · {passage.wordCount} words</p>

        {/* Vocabulary panel */}
        {showVocab && (
          <Card className="mb-3" pastel="#FFF8E140">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Key vocabulary</p>
            <div className="space-y-1">
              {passage.vocabulary.map((v) => (
                <div key={v.word} className="flex gap-2 text-[11px]">
                  <span className="font-medium text-text-primary dark:text-dark-text-primary">{v.word}</span>
                  <span className="text-text-muted">— {v.definition}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Passage */}
        <Card className="mb-4">
          <p className="text-[13px] text-text-primary dark:text-dark-text-primary leading-relaxed whitespace-pre-wrap">
            {passage.text}
          </p>
        </Card>

        {/* Questions */}
        {(state === 'answering' || state === 'results') && (
          <>
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Questions · {totalMarks} marks</p>
            <div className="space-y-3">
              {passage.questions.map((q, i) => {
                const userAnswer = answers[q.id] || ''
                return (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className={checked ? (userAnswer.trim() ? 'border-success/20' : 'border-error/20') : ''}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-[10px] text-text-muted font-mono shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-[12px] text-text-primary dark:text-dark-text-primary">{q.question}</p>
                          <span className="text-[9px] text-text-muted capitalize">{q.type} · {q.marks}m</span>
                        </div>
                      </div>
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        disabled={checked}
                        placeholder="Write your answer..."
                        rows={2}
                        className="ml-4 w-[calc(100%-1rem)] px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-[12px] focus:outline-none focus:border-text-primary transition-colors resize-none"
                      />
                      {checked && (
                        <div className="ml-4 mt-2 px-2 py-1.5 rounded-[var(--radius-sm)] bg-accent-light/20 dark:bg-white/5">
                          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Model answer</p>
                          <p className="text-[11px] text-text-primary dark:text-dark-text-primary">{q.modelAnswer}</p>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {!checked ? (
              <Button onClick={handleCheck} size="lg" className="w-full mt-4" disabled={Object.keys(answers).length === 0}>
                <Check size={14} /> Check Answers
              </Button>
            ) : (
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => { setState('setup'); setPassage(null) }}>
                  <BookOpen size={12} /> New Passage
                </Button>
              </div>
            )}
          </>
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

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Reading Comprehension</h1>
      <p className="text-[12px] text-text-muted mb-5">Practice reading skills with AI-generated passages.</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Genre</label>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => (
              <button key={g} onClick={() => setGenre(g)}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${genre === g ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-muted'}`}>
                {g}
              </button>
            ))}
          </div>
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
      </div>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleGenerate} disabled={!apiKey} size="lg" className="w-full">
        <BookOpen size={14} /> Generate Passage
      </Button>
      {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
    </div>
  )
}
