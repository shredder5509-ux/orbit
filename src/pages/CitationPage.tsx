import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Copy, Check, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useSettingsStore } from '../stores/settingsStore'
import { generateCitation } from '../services/claudeApi'
import type { Citation } from '../services/claudeApi'

type State = 'input' | 'loading' | 'result'

export function CitationPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()

  const [state, setState] = useState<State>('input')
  const [sourceType, setSourceType] = useState('website')
  const [input, setInput] = useState('')
  const [author, setAuthor] = useState('')
  const [date, setDate] = useState('')
  const [format, setFormat] = useState('harvard')
  const [result, setResult] = useState<Citation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [saved, setSaved] = useState<Citation[]>(() => {
    try { return JSON.parse(localStorage.getItem('orbit-citations') || '[]') } catch { return [] }
  })

  const handleGenerate = async () => {
    if (!input.trim() || !apiKey) return
    setState('loading')
    setError(null)
    try {
      const data = await generateCitation(apiKey, sourceType, input, author, date, format)
      setResult(data)
      setState('result')
    } catch (err: any) {
      setError(err.message)
      setState('input')
    }
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const saveCitation = () => {
    if (!result) return
    const updated = [result, ...saved]
    setSaved(updated)
    localStorage.setItem('orbit-citations', JSON.stringify(updated))
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Generating citation...</p>
      </div>
    )
  }

  if (state === 'result' && result) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => setState('input')} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
          <ArrowLeft size={14} /> Back
        </button>

        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">{format.toUpperCase()} CITATION</p>
        <p className="text-[13px] text-text-primary leading-relaxed mb-4 border-l-2 border-border pl-3">{result.formatted}</p>

        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">IN-TEXT</p>
        <p className="text-[13px] text-text-primary mb-4">{result.inText}</p>

        {result.notes && <p className="text-[11px] text-text-muted mb-4">{result.notes}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => copy(result.formatted, 'citation')}>
            {copied === 'citation' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy citation</>}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => copy(result.inText, 'intext')}>
            {copied === 'intext' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy in-text</>}
          </Button>
          <Button variant="secondary" size="sm" onClick={saveCitation}>Save</Button>
        </div>
      </div>
    )
  }

  // Input
  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary mb-1">Citation generator</h1>
      <p className="text-[12px] text-text-muted mb-5">Generate properly formatted references.</p>

      <div className="space-y-3 mb-5">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Source type</label>
          <div className="flex gap-2">
            {['website', 'book', 'journal', 'article'].map((t) => (
              <button key={t} onClick={() => setSourceType(t)}
                className={`px-3 py-1.5 text-[12px] rounded-[var(--radius-md)] border capitalize transition-all ${
                  sourceType === t ? 'bg-text-primary text-white border-text-primary' : 'border-border text-text-secondary'
                }`}
              >{t}</button>
            ))}
          </div>
        </div>
        <Input label="URL or title" value={input} onChange={(e) => setInput(e.target.value)} placeholder={sourceType === 'website' ? 'https://...' : 'Title of the source'} />
        <Input label="Author (optional)" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Smith, J." />
        <Input label="Date (optional)" value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. 2024" />
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Format</label>
          <div className="flex gap-2">
            {['harvard', 'apa', 'mla'].map((f) => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-3 py-1.5 text-[12px] rounded-[var(--radius-md)] border uppercase transition-all ${
                  format === f ? 'bg-text-primary text-white border-text-primary' : 'border-border text-text-secondary'
                }`}
              >{f}</button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleGenerate} disabled={!input.trim() || !apiKey} size="lg">
        Generate <ArrowRight size={14} />
      </Button>

      {/* Saved citations */}
      {saved.length > 0 && (
        <div className="mt-8 border-t border-border/50 pt-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">SAVED CITATIONS</p>
          <div className="space-y-2">
            {saved.map((c, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/30 group">
                <p className="flex-1 text-[12px] text-text-secondary leading-relaxed">{c.formatted}</p>
                <button onClick={() => copy(c.formatted, `saved-${i}`)} className="shrink-0 text-text-muted hover:text-text-primary p-0.5">
                  {copied === `saved-${i}` ? <Check size={10} /> : <Copy size={10} />}
                </button>
                <button onClick={() => {
                  const updated = saved.filter((_, j) => j !== i)
                  setSaved(updated)
                  localStorage.setItem('orbit-citations', JSON.stringify(updated))
                }} className="shrink-0 opacity-0 group-hover:opacity-100 text-text-muted hover:text-error p-0.5">
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
