import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Loader2, Save, BookOpen } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'
import { useDataStore } from '../stores/dataStore'
import { scanAndOrganizeNotes } from '../services/claudeApi'
import type { OrganizedNotes } from '../services/claudeApi'

type State = 'input' | 'loading' | 'result'

export function NotesScannerPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { addXp } = useUserStore()
  const { addNote } = useDataStore()
  const photoRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<State>('input')
  const [result, setResult] = useState<OrganizedNotes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')

  const handlePhoto = (files: FileList | null) => {
    if (!files || files.length === 0 || !apiKey) return
    const reader = new FileReader()
    reader.onload = async () => {
      setState('loading')
      setError(null)
      try {
        const data = await scanAndOrganizeNotes(apiKey, reader.result as string, subject || undefined)
        setResult(data)
        setState('result')
        addXp(15)
      } catch (err: any) {
        setError(err.message)
        setState('input')
      }
    }
    reader.readAsDataURL(files[0])
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Reading your notes...</p>
      </div>
    )
  }

  if (state === 'result' && result) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => { setState('input'); setResult(null) }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-0.5">Scanned Notes</h1>
        <p className="text-[12px] text-text-muted mb-1">{result.subject} — {result.topic}</p>
        <p className="text-[12px] text-text-secondary dark:text-dark-text-secondary mb-4">{result.summary}</p>

        {/* Markdown content */}
        <div className="prose prose-sm max-w-none text-[13px] text-text-primary dark:text-dark-text-primary leading-relaxed mb-4 whitespace-pre-wrap border-t border-border/50 dark:border-white/10 pt-4">
          {result.content}
        </div>

        {result.flaggedParts.length > 0 && (
          <p className="text-[11px] text-warning mb-3">{result.flaggedParts.length} part{result.flaggedParts.length !== 1 ? 's' : ''} couldn't be read</p>
        )}
        {result.keyTerms.length > 0 && (
          <p className="text-[11px] text-text-muted mb-4">{result.keyTerms.length} key terms found</p>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => {
            addNote({ topicId: '', topicName: result.topic, subjectName: result.subject, content: result.content })
            navigate('/notes')
          }}>
            <Save size={12} /> Save to notes
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/flashcards')}>
            <BookOpen size={12} /> Generate flashcards
          </Button>
        </div>
      </div>
    )
  }

  // Input
  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhoto(e.target.files)} />

      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Scan class notes</h1>
      <p className="text-[12px] text-text-muted mb-5">Take a photo of handwritten notes. AI cleans and organizes them.</p>

      <div className="mb-4">
        <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Subject (optional)</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology"
          className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
      </div>

      <Button className="w-full" size="lg" onClick={() => photoRef.current?.click()}>
        <Camera size={14} /> Take photo of notes
      </Button>

      {error && <p className="text-[12px] text-error mt-3">{error}</p>}
      {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
    </div>
  )
}
