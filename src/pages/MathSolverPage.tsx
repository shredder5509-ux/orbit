import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'
import { solveMathProblem } from '../services/claudeApi'
import type { MathSolution } from '../services/claudeApi'

type State = 'input' | 'loading' | 'result'

export function MathSolverPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { addXp } = useUserStore()
  const photoRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<State>('input')
  const [problem, setProblem] = useState('')
  const [result, setResult] = useState<MathSolution | null>(null)
  const [visibleStep, setVisibleStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleSolve = async (imageBase64?: string) => {
    if (!apiKey || (!problem.trim() && !imageBase64)) return
    setState('loading')
    setError(null)
    try {
      const data = await solveMathProblem(apiKey, problem.trim(), imageBase64)
      setResult(data)
      setVisibleStep(0)
      setState('result')
      addXp(10)
    } catch (err: any) {
      setError(err.message)
      setState('input')
    }
  }

  const handlePhoto = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const reader = new FileReader()
    reader.onload = () => handleSolve(reader.result as string)
    reader.readAsDataURL(files[0])
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-3 animate-spin text-text-muted" size={20} />
        <p className="text-sm text-text-muted">Working through it...</p>
      </div>
    )
  }

  if (state === 'result' && result) {
    const allRevealed = visibleStep >= result.steps.length

    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => { setState('input'); setResult(null) }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
          <ArrowLeft size={14} /> Back
        </button>

        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">{result.problem_type}</p>
        <h1 className="text-base font-semibold text-text-primary mb-5">Solve: {result.problem_text}</h1>

        {/* Steps — revealed one at a time */}
        <div className="space-y-4 mb-5">
          {result.steps.slice(0, visibleStep + 1).map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-[10px] text-text-muted mb-1">Step {i + 1} of {result.steps.length}</p>
              <p className="text-[13px] text-text-primary mb-1.5">{step.explanation}</p>
              <pre className="text-[13px] text-text-primary font-mono bg-accent-light/30 px-3 py-2 rounded-[var(--radius-md)] mb-1">{step.working}</pre>
              <p className="text-[11px] text-text-muted italic">{step.why}</p>
            </motion.div>
          ))}
        </div>

        {!allRevealed ? (
          <Button onClick={() => setVisibleStep((v) => v + 1)}>
            Next step <ArrowRight size={14} />
          </Button>
        ) : (
          <div className="border-t border-border/50 pt-4 space-y-3">
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">ANSWER</p>
              <p className="text-base font-semibold text-text-primary">{result.final_answer}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">CHECK</p>
              <p className="text-[13px] text-text-secondary">{result.check}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">TIP</p>
              <p className="text-[13px] text-text-secondary">{result.tip}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => { setState('input'); setResult(null); setProblem('') }}>
              Solve another
            </Button>
          </div>
        )}
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

      <h1 className="text-base font-semibold text-text-primary mb-1">Maths solver</h1>
      <p className="text-[12px] text-text-muted mb-5">Take a photo or type a problem. Get step-by-step working.</p>

      <Button variant="secondary" className="w-full mb-4" onClick={() => photoRef.current?.click()}>
        <Camera size={14} /> Take photo of problem
      </Button>

      <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Or type the equation</label>
      <input
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
        placeholder="e.g. 2x + 4 = 10"
        className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:border-text-primary transition-colors mb-4"
      />

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={() => handleSolve()} disabled={!problem.trim() || !apiKey} size="lg">
        Solve it <ArrowRight size={14} />
      </Button>
    </div>
  )
}
