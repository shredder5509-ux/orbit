import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, BookOpen, Clock, Target, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

interface ExamTechnique {
  subject: string
  questionType: string
  timing: string
  structure: { step: string; detail: string }[]
  commonMistakes: string[]
  examinerTips: string[]
  commandWords: { word: string; meaning: string }[]
  exampleQuestion: string
  modelPlan: string
}

type State = 'setup' | 'loading' | 'result'

const QUESTION_TYPES = [
  '2-mark short answer', '4-mark explain', '6-mark describe',
  '8-mark evaluate', '12-mark essay', 'Data analysis',
  'Source-based', 'Calculation with method', 'Compare and contrast',
]

export function ExamTechniquePage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { subjects, addXp } = useUserStore()

  const [state, setState] = useState<State>('setup')
  const [subject, setSubject] = useState(subjects[0] || '')
  const [questionType, setQuestionType] = useState('6-mark describe')
  const [result, setResult] = useState<ExamTechnique | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!subject.trim() || !apiKey) return
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
          max_tokens: 1536,
          system: `You are an exam technique coach for UK GCSE/A-Level students (age 13-18).
Generate exam technique advice for a "${questionType}" question in ${subject}.
Return ONLY JSON:
{
  "subject": "${subject}",
  "questionType": "${questionType}",
  "timing": "how long to spend",
  "structure": [{"step": "step name", "detail": "what to do"}],
  "commonMistakes": ["3-5 mistakes to avoid"],
  "examinerTips": ["3-5 tips from examiner's perspective"],
  "commandWords": [{"word": "command word", "meaning": "what it means in this context"}],
  "exampleQuestion": "a realistic example question",
  "modelPlan": "a brief answer plan for the example"
}`,
          messages: [{ role: 'user', content: `Exam technique for ${questionType} in ${subject}` }],
        }),
      })
      if (!response.ok) throw new Error(`API error ${response.status}`)
      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        setResult(JSON.parse(jsonMatch[0]))
        setState('result')
        addXp(10)
      } else throw new Error('Could not parse response')
    } catch (err: any) {
      setError(err.message)
      setState('setup')
    }
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Preparing exam tips...</p>
      </div>
    )
  }

  if (state === 'result' && result) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => { setState('setup'); setResult(null) }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-0.5">
          {result.subject}: {result.questionType}
        </h1>
        <p className="text-[11px] text-text-muted mb-4 flex items-center gap-1"><Clock size={10} /> {result.timing}</p>

        {/* Structure */}
        <Card className="mb-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1"><Target size={10} /> Answer Structure</p>
          <div className="space-y-2">
            {result.structure.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex gap-2">
                <span className="text-[10px] text-text-muted font-mono shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-[12px] font-medium text-text-primary dark:text-dark-text-primary">{s.step}</p>
                  <p className="text-[11px] text-text-muted">{s.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Command words */}
        {result.commandWords.length > 0 && (
          <Card className="mb-3" pastel="#E8F0FE30">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2"><BookOpen size={10} className="inline mr-1" />Command Words</p>
            <div className="space-y-1">
              {result.commandWords.map((cw) => (
                <div key={cw.word} className="flex gap-2 text-[11px]">
                  <span className="font-semibold text-text-primary dark:text-dark-text-primary">{cw.word}</span>
                  <span className="text-text-muted">— {cw.meaning}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Common mistakes */}
        <Card className="mb-3" pastel="#FFF0E030">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1"><AlertTriangle size={10} /> Avoid These</p>
          {result.commonMistakes.map((m, i) => (
            <p key={i} className="text-[11px] text-text-primary dark:text-dark-text-primary mb-0.5">• {m}</p>
          ))}
        </Card>

        {/* Examiner tips */}
        <Card className="mb-3" pastel="#E6F7ED30">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Examiner Tips</p>
          {result.examinerTips.map((t, i) => (
            <p key={i} className="text-[11px] text-text-primary dark:text-dark-text-primary mb-0.5">• {t}</p>
          ))}
        </Card>

        {/* Example */}
        <Card className="mb-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Example Question</p>
          <p className="text-[12px] text-text-primary dark:text-dark-text-primary font-medium mb-2">{result.exampleQuestion}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Model Plan</p>
          <p className="text-[11px] text-text-muted whitespace-pre-wrap">{result.modelPlan}</p>
        </Card>

        <Button variant="secondary" size="sm" onClick={() => { setState('setup'); setResult(null) }}>
          Try Another Type
        </Button>
      </div>
    )
  }

  // Setup
  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Exam Technique Coach</h1>
      <p className="text-[12px] text-text-muted mb-5">Learn how to structure answers for different question types.</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. History"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Question type</label>
          <div className="flex flex-wrap gap-1.5">
            {QUESTION_TYPES.map((qt) => (
              <button key={qt} onClick={() => setQuestionType(qt)}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${questionType === qt ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-muted'}`}>
                {qt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleGenerate} disabled={!subject.trim() || !apiKey} size="lg" className="w-full">
        Get Technique Tips
      </Button>
      {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
    </div>
  )
}
