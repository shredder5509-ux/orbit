import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Check, X, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

interface ConjugationDrill {
  language: string
  verb: string
  meaning: string
  tense: string
  conjugations: { pronoun: string; correct: string; hint: string }[]
}

type State = 'setup' | 'loading' | 'drilling' | 'results'

const LANGUAGES = ['French', 'Spanish', 'German', 'Italian']
const TENSES = ['Present', 'Past (perfect)', 'Imperfect', 'Future', 'Conditional']

export function ConjugationPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { addXp } = useUserStore()

  const [state, setState] = useState<State>('setup')
  const [language, setLanguage] = useState('French')
  const [tense, setTense] = useState('Present')
  const [verb, setVerb] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [drill, setDrill] = useState<ConjugationDrill | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)
  const [showHints, setShowHints] = useState<Set<number>>(new Set())

  const handleGenerate = async () => {
    if (!apiKey) return
    setState('loading')
    setError(null)
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: `Generate a verb conjugation drill for a 13-year-old learning ${language}.
${verb ? `Use the verb "${verb}"` : 'Pick a common, useful verb'}.
Tense: ${tense}.
Return ONLY JSON:
{
  "language": "${language}",
  "verb": "infinitive form",
  "meaning": "English meaning",
  "tense": "${tense}",
  "conjugations": [
    {"pronoun": "je/I", "correct": "correct conjugation", "hint": "pattern hint"}
  ]
}
Include all pronouns for this language (6 forms typically).`,
          messages: [{ role: 'user', content: `Conjugation drill: ${language} ${tense}${verb ? ` verb: ${verb}` : ''}` }],
        }),
      })
      if (!response.ok) throw new Error(`API error ${response.status}`)
      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        setDrill(JSON.parse(jsonMatch[0]))
        setAnswers({})
        setChecked(false)
        setShowHints(new Set())
        setState('drilling')
      } else throw new Error('Could not parse drill')
    } catch (err: any) {
      setError(err.message)
      setState('setup')
    }
  }

  const handleCheck = () => {
    setChecked(true)
    setState('results')
    const correct = drill?.conjugations.filter((c, i) =>
      (answers[i] || '').trim().toLowerCase() === c.correct.toLowerCase()
    ).length || 0
    addXp(5 + correct * 3)
  }

  const toggleHint = (i: number) => {
    setShowHints((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Creating conjugation drill...</p>
      </div>
    )
  }

  if ((state === 'drilling' || state === 'results') && drill) {
    const score = drill.conjugations.filter((c, i) =>
      (answers[i] || '').trim().toLowerCase() === c.correct.toLowerCase()
    ).length

    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => setState('setup')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-0.5">
          {drill.verb} — {drill.meaning}
        </h1>
        <p className="text-[11px] text-text-muted mb-4">{drill.language} · {drill.tense}</p>

        {checked && (
          <Card className="mb-3 text-center" pastel={score >= drill.conjugations.length * 0.7 ? '#E6F7ED40' : '#FFF0E040'}>
            <p className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{score}/{drill.conjugations.length}</p>
            <p className="text-[11px] text-text-muted">
              {score === drill.conjugations.length ? 'Perfect!' : score >= drill.conjugations.length * 0.7 ? 'Bien fait!' : 'Keep practising!'}
            </p>
          </Card>
        )}

        <div className="space-y-2">
          {drill.conjugations.map((c, i) => {
            const userAnswer = (answers[i] || '').trim().toLowerCase()
            const isCorrect = userAnswer === c.correct.toLowerCase()

            return (
              <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={checked ? (isCorrect ? 'border-success/30' : 'border-error/30') : ''}>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-text-primary dark:text-dark-text-primary font-medium w-16 shrink-0">{c.pronoun}</span>
                    <input
                      value={answers[i] || ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                      disabled={checked}
                      placeholder="..."
                      className="flex-1 px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-[13px] focus:outline-none focus:border-text-primary transition-colors"
                    />
                    {!checked && (
                      <button onClick={() => toggleHint(i)} className="text-[9px] text-text-muted hover:text-text-primary transition-colors">
                        {showHints.has(i) ? 'hide' : 'hint'}
                      </button>
                    )}
                    {checked && (isCorrect ? <Check size={14} className="text-success" /> : <X size={14} className="text-error" />)}
                  </div>
                  {showHints.has(i) && !checked && (
                    <p className="text-[10px] text-text-muted mt-1 ml-[4.75rem]">{c.hint}</p>
                  )}
                  {checked && !isCorrect && (
                    <p className="text-[11px] text-text-primary dark:text-dark-text-primary mt-1 ml-[4.75rem] font-medium">{c.correct}</p>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>

        {!checked ? (
          <Button onClick={handleCheck} size="lg" className="w-full mt-4" disabled={Object.keys(answers).length === 0}>
            <Check size={14} /> Check
          </Button>
        ) : (
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={handleGenerate}>
              <RotateCcw size={10} /> Same verb, new drill
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setState('setup'); setVerb('') }}>
              New verb
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

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Conjugation Drills</h1>
      <p className="text-[12px] text-text-muted mb-5">Practice verb conjugations with instant feedback.</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Language</label>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button key={l} onClick={() => setLanguage(l)}
                className={`flex-1 px-3 py-1.5 text-[12px] rounded-[var(--radius-md)] border transition-all ${language === l ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-secondary dark:text-dark-text-secondary'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Tense</label>
          <div className="flex flex-wrap gap-1.5">
            {TENSES.map((t) => (
              <button key={t} onClick={() => setTense(t)}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${tense === t ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-muted'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Verb (optional — leave blank for random)</label>
          <input value={verb} onChange={(e) => setVerb(e.target.value)} placeholder="e.g. avoir, être, hacer"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
      </div>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleGenerate} disabled={!apiKey} size="lg" className="w-full">
        Start Drill
      </Button>
      {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
    </div>
  )
}
