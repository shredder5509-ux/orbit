import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

interface Comparison {
  question: string
  yourAnswer: { text: string; strengths: string[]; weaknesses: string[] }
  modelAnswer: { text: string; keyPoints: string[] }
  score: number
  missedPoints: string[]
  extraPoints: string[]
  tip: string
}

type State = 'input' | 'loading' | 'result'

export function CompareAnswersPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { addXp } = useUserStore()

  const [state, setState] = useState<State>('input')
  const [question, setQuestion] = useState('')
  const [yourAnswer, setYourAnswer] = useState('')
  const [modelAnswer, setModelAnswer] = useState('')
  const [subject, setSubject] = useState('')
  const [result, setResult] = useState<Comparison | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    if (!question.trim() || !yourAnswer.trim() || !apiKey) return
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
          system: `Compare a 13-year-old student's answer against a model answer (or generate one if not provided). Be encouraging but specific.
Return ONLY JSON:
{
  "question": "the question",
  "yourAnswer": {"text": "student's answer", "strengths": ["what they did well"], "weaknesses": ["areas to improve"]},
  "modelAnswer": {"text": "the model/ideal answer", "keyPoints": ["key points that should be included"]},
  "score": 0-100,
  "missedPoints": ["important points the student missed"],
  "extraPoints": ["good points the student made that go beyond the model"],
  "tip": "one specific tip to improve"
}`,
          messages: [{
            role: 'user',
            content: `Subject: ${subject || 'General'}\nQuestion: ${question}\nMy answer: ${yourAnswer}${modelAnswer ? `\nModel answer: ${modelAnswer}` : '\n(No model answer provided — please generate one)'}`,
          }],
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
      } else {
        throw new Error('Could not parse comparison')
      }
    } catch (err: any) {
      setError(err.message)
      setState('input')
    }
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Comparing answers...</p>
      </div>
    )
  }

  if (state === 'result' && result) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => { setState('input'); setResult(null) }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Comparison Result</h1>
        <p className="text-[11px] text-text-muted mb-4">{result.question}</p>

        {/* Score */}
        <Card className="mb-3 text-center" pastel={result.score >= 70 ? '#E6F7ED40' : '#FFF0E040'}>
          <p className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary">{result.score}%</p>
          <p className="text-[11px] text-text-muted">
            {result.score >= 90 ? 'Outstanding!' : result.score >= 70 ? 'Strong answer!' : result.score >= 50 ? 'Good effort!' : 'Room to grow!'}
          </p>
        </Card>

        {/* Side by side */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Card>
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Your Answer</p>
            <p className="text-[12px] text-text-primary dark:text-dark-text-primary mb-2">{result.yourAnswer.text}</p>
            {result.yourAnswer.strengths.length > 0 && (
              <div className="space-y-0.5">
                {result.yourAnswer.strengths.map((s, i) => (
                  <p key={i} className="text-[10px] text-success flex items-start gap-1">+ {s}</p>
                ))}
              </div>
            )}
            {result.yourAnswer.weaknesses.length > 0 && (
              <div className="space-y-0.5 mt-1">
                {result.yourAnswer.weaknesses.map((w, i) => (
                  <p key={i} className="text-[10px] text-warning flex items-start gap-1">- {w}</p>
                ))}
              </div>
            )}
          </Card>
          <Card pastel="#E8F0FE30">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Model Answer</p>
            <p className="text-[12px] text-text-primary dark:text-dark-text-primary mb-2">{result.modelAnswer.text}</p>
            <div className="space-y-0.5">
              {result.modelAnswer.keyPoints.map((p, i) => (
                <p key={i} className="text-[10px] text-text-muted">• {p}</p>
              ))}
            </div>
          </Card>
        </div>

        {/* Missed & Extra */}
        {result.missedPoints.length > 0 && (
          <Card className="mb-2">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">You missed</p>
            {result.missedPoints.map((p, i) => (
              <p key={i} className="text-[11px] text-text-primary dark:text-dark-text-primary">• {p}</p>
            ))}
          </Card>
        )}
        {result.extraPoints.length > 0 && (
          <Card className="mb-2" pastel="#E6F7ED30">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Extra credit</p>
            {result.extraPoints.map((p, i) => (
              <p key={i} className="text-[11px] text-success">+ {p}</p>
            ))}
          </Card>
        )}

        <p className="text-[11px] text-text-muted italic mt-3 mb-4">{result.tip}</p>

        <Button variant="secondary" size="sm" onClick={() => { setState('input'); setResult(null) }}>
          Compare Another
        </Button>
      </div>
    )
  }

  // Input
  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Compare Answers</h1>
      <p className="text-[12px] text-text-muted mb-5">Paste your answer and the model answer to see how they compare.</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Subject (optional)</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. History"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Question</label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Explain the causes of WW1"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Your answer</label>
          <textarea value={yourAnswer} onChange={(e) => setYourAnswer(e.target.value)} placeholder="Paste your answer here..." rows={4}
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors resize-none" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Model answer (optional)</label>
          <textarea value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} placeholder="Paste the textbook/teacher answer here, or leave blank for AI to generate one" rows={4}
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors resize-none" />
        </div>
      </div>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleCompare} disabled={!question.trim() || !yourAnswer.trim() || !apiKey} size="lg" className="w-full">
        <ArrowRight size={14} /> Compare
      </Button>
      {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
    </div>
  )
}
