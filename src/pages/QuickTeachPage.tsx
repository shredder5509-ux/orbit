import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, BookOpen, Save, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useUserStore } from '../stores/userStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDataStore } from '../stores/dataStore'
import { teachInFiveMinutes } from '../services/claudeApi'
import type { CrashCourse } from '../services/claudeApi'

type State = 'input' | 'loading' | 'result'

export function QuickTeachPage() {
  const navigate = useNavigate()
  const { age, curriculum, addXp } = useUserStore()
  const { apiKey } = useSettingsStore()
  const { addStudyMinutes } = useDataStore()

  const [state, setState] = useState<State>('input')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState<CrashCourse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGo = async () => {
    if (!topic.trim() || !apiKey) return
    setState('loading')
    setError(null)
    try {
      const data = await teachInFiveMinutes(apiKey, topic.trim(), age, curriculum)
      setResult(data)
      setState('result')
      addXp(15)
      addStudyMinutes(5)
    } catch (err: any) {
      setError(err.message)
      setState('input')
    }
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Preparing your crash course...</p>
      </div>
    )
  }

  if (state === 'result' && result) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => { setState('input'); setResult(null) }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary mb-0.5">{topic}</h1>
        <p className="text-[11px] text-text-muted mb-6">5 min crash course</p>

        <div className="space-y-5 text-[13px] leading-relaxed text-text-primary">
          <Section title="WHAT IT IS" content={result.what_it_is} />
          <Section title="WHY IT MATTERS" content={result.why_it_matters} />

          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">KEY POINTS</p>
            <ul className="space-y-1.5">
              {result.key_points.map((p, i) => (
                <li key={i} className="flex gap-2 text-[13px]">
                  <span className="text-text-muted mt-0.5 shrink-0">·</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <Section title="EXAMPLE" content={result.example} />
          <Section title="COMMON MISTAKE" content={result.common_mistake} />
          <Section title="MEMORY TRICK" content={result.memory_trick} />
          <Section title="EXAM TIP" content={result.exam_tip} />
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
          <Button variant="secondary" size="sm" onClick={() => {
            const note = `# ${topic}\n\n${result.what_it_is}\n\n## Key Points\n${result.key_points.map(p => `- ${p}`).join('\n')}\n\n## Example\n${result.example}\n\n## Common Mistake\n${result.common_mistake}\n\n## Memory Trick\n${result.memory_trick}`
            useDataStore.getState().addNote({ topicId: '', topicName: topic, subjectName: 'General', content: note })
            alert('Saved to notes!')
          }}>
            <Save size={12} /> Save as notes
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/upload')}>
            <BookOpen size={12} /> Full session
          </Button>
        </div>
      </div>
    )
  }

  // Input
  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-6">
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-base font-semibold text-text-primary mb-1">Teach me in 5 minutes</h1>
      <p className="text-[12px] text-text-muted mb-6">Fast, direct explanation. No back-and-forth.</p>

      <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">What do you need to learn?</label>
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleGo()}
        placeholder="e.g. Photosynthesis, Quadratic formula, French past tense..."
        autoFocus
        className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors mb-4"
      />

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleGo} disabled={!topic.trim() || !apiKey} size="lg">
        Go <ArrowRight size={14} />
      </Button>

      {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">{title}</p>
      <p className="text-[13px] text-text-primary leading-relaxed">{content}</p>
    </div>
  )
}
