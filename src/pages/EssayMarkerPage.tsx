import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { markEssay } from '../services/claudeApi'
import type { EssayFeedback } from '../services/claudeApi'
import { Paywall } from '../components/Paywall'

type State = 'input' | 'loading' | 'result'

export function EssayMarkerPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { addXp } = useUserStore()
  const { plan } = useSubscriptionStore()

  const [state, setState] = useState<State>('input')
  const [subject, setSubject] = useState('English')
  const [title, setTitle] = useState('')
  const [essay, setEssay] = useState('')
  const [wordLimit, setWordLimit] = useState('')
  const [result, setResult] = useState<EssayFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  // Free users: check weekly limit
  const canMark = plan !== 'free' || (() => {
    const last = localStorage.getItem('orbit-last-essay-mark')
    if (!last) return true
    return Date.now() - Number(last) > 7 * 86400000
  })()

  const handleMark = async () => {
    if (!canMark) { setShowPaywall(true); return }
    if (!essay.trim() || !apiKey) return
    setState('loading')
    setError(null)
    try {
      const data = await markEssay(apiKey, essay, subject, title, wordLimit ? parseInt(wordLimit) : undefined)
      setResult(data)
      setState('result')
      addXp(25)
      localStorage.setItem('orbit-last-essay-mark', String(Date.now()))
    } catch (err: any) {
      setError(err.message)
      setState('input')
    }
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Reading your essay...</p>
      </div>
    )
  }

  if (state === 'result' && result) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => { setState('input'); setResult(null) }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary mb-1">Essay Feedback</h1>
        <div className="border-b border-border/50 pb-4 mb-5">
          <p className="text-lg font-semibold text-text-primary">{result.overall_score}% · {result.overall_grade}</p>
          <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">{result.summary}</p>
        </div>

        {/* Marking criteria */}
        <div className="mb-5">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">MARKING CRITERIA</p>
          <div className="space-y-2">
            {result.marking_criteria.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-[12px] text-text-secondary w-36 shrink-0">{c.name}</span>
                <div className="flex-1 h-[2px] bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-text-primary rounded-full" style={{ width: `${(c.score / c.max) * 100}%` }} />
                </div>
                <span className="text-[11px] text-text-muted w-8 text-right">{c.score}/{c.max}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="mb-5">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">STRENGTHS</p>
          {result.strengths.map((s, i) => (
            <p key={i} className="text-[13px] text-text-primary leading-relaxed mb-1.5 flex gap-2">
              <span className="text-text-muted shrink-0">·</span> {s}
            </p>
          ))}
        </div>

        {/* Improvements */}
        <div className="mb-5">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">TO IMPROVE</p>
          {result.improvements.map((s, i) => (
            <p key={i} className="text-[13px] text-text-primary leading-relaxed mb-1.5 flex gap-2">
              <span className="text-text-muted shrink-0">·</span> {s}
            </p>
          ))}
        </div>

        {/* Paragraph feedback */}
        <div className="mb-5">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">PARAGRAPH FEEDBACK</p>
          <div className="space-y-2">
            {result.paragraph_feedback.map((p) => (
              <div key={p.paragraph_number} className="flex gap-3 py-1.5 border-b border-border/30 last:border-0">
                <span className="text-[12px] text-text-muted w-4 shrink-0">{p.paragraph_number}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] text-text-muted">"{p.first_words}..."</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      p.score === 'strong' ? 'bg-green-50 text-green-700' :
                      p.score === 'adequate' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>{p.score}</span>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">{p.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SPaG */}
        {result.spelling_grammar.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">SPELLING & GRAMMAR</p>
            {result.spelling_grammar.map((s, i) => (
              <p key={i} className="text-[12px] text-text-secondary mb-1 flex gap-2">
                <span className="text-text-muted shrink-0">·</span> {s}
              </p>
            ))}
          </div>
        )}

        <Button variant="secondary" size="sm" onClick={() => navigate('/')}>Done</Button>
        <Paywall open={showPaywall} onClose={() => setShowPaywall(false)} />
      </div>
    )
  }

  // Input
  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary mb-1">Mark my essay</h1>
      <p className="text-[12px] text-text-muted mb-5">Paste your essay and get paragraph-by-paragraph feedback.</p>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-border text-text-primary text-sm focus:outline-none focus:border-text-primary"
          >
            {['English', 'History', 'Geography', 'Religious Studies', 'Sociology', 'Psychology', 'Politics'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <Input label="Essay title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How does Orwell present power in Animal Farm?" />
        <Input label="Word limit (optional)" value={wordLimit} onChange={(e) => setWordLimit(e.target.value)} placeholder="e.g. 500" />
      </div>

      <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Your essay</label>
      <textarea
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        placeholder="Paste your essay here..."
        rows={10}
        className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border text-text-primary placeholder:text-text-muted text-[13px] focus:outline-none focus:border-text-primary transition-colors resize-none mb-1"
      />
      <p className="text-[10px] text-text-muted mb-4">{essay.split(/\s+/).filter(Boolean).length} words</p>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}
      {!canMark && <p className="text-[11px] text-text-muted mb-3">Free: 1 essay per week. Upgrade for unlimited.</p>}

      <Button onClick={handleMark} disabled={!essay.trim() || !apiKey} size="lg">
        Mark essay <ArrowRight size={14} />
      </Button>
      <Paywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
