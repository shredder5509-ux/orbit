import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Briefcase, GraduationCap, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

interface CareerConnection {
  subject: string
  careers: { title: string; description: string; salary: string; subjects_needed: string[]; why_this_subject: string }[]
  skills: string[]
  inspiration: string
}

type State = 'setup' | 'loading' | 'result'

export function CareerPage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { subjects, addXp } = useUserStore()

  const [state, setState] = useState<State>('setup')
  const [subject, setSubject] = useState(subjects[0] || '')
  const [interest, setInterest] = useState('')
  const [result, setResult] = useState<CareerConnection | null>(null)
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
          system: `You're helping a 13-year-old see how their school subject connects to real careers.
Subject: ${subject}. ${interest ? `They're interested in: ${interest}` : ''}
Be inspiring and age-appropriate. Include modern/exciting careers, not just traditional ones.
Return ONLY JSON:
{
  "subject": "${subject}",
  "careers": [
    {"title": "career name", "description": "what they do daily (2 sentences)", "salary": "UK salary range", "subjects_needed": ["subjects"], "why_this_subject": "how this school subject helps"}
  ],
  "skills": ["transferable skills this subject teaches"],
  "inspiration": "one inspiring sentence to motivate studying this subject"
}
Include 5-6 diverse careers.`,
          messages: [{ role: 'user', content: `Career connections for ${subject}${interest ? `, interested in ${interest}` : ''}` }],
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
        <p className="text-sm text-text-muted">Finding career connections...</p>
      </div>
    )
  }

  if (state === 'result' && result) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => { setState('setup'); setResult(null) }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-4">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">
          Where {result.subject} takes you
        </h1>
        <p className="text-[12px] text-text-muted italic mb-4">{result.inspiration}</p>

        {/* Careers */}
        <div className="space-y-2 mb-4">
          {result.careers.map((career, i) => (
            <motion.div key={career.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card>
                <div className="flex items-start gap-2">
                  <Briefcase size={14} className="text-text-primary dark:text-dark-text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[13px] font-medium text-text-primary dark:text-dark-text-primary">{career.title}</p>
                      <span className="text-[9px] text-text-muted">{career.salary}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary dark:text-dark-text-secondary mb-1.5">{career.description}</p>
                    <p className="text-[10px] text-text-muted mb-1">
                      <GraduationCap size={9} className="inline mr-0.5" /> {career.subjects_needed.join(', ')}
                    </p>
                    <p className="text-[10px] text-text-primary dark:text-dark-text-primary italic">
                      <TrendingUp size={9} className="inline mr-0.5" /> {career.why_this_subject}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Skills */}
        <Card className="mb-4" pastel="#E6F7ED30">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Skills you're building</p>
          <div className="flex flex-wrap gap-1.5">
            {result.skills.map((skill) => (
              <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-light/40 dark:bg-white/10 text-text-primary dark:text-dark-text-primary border border-border/50 dark:border-white/10">
                {skill}
              </span>
            ))}
          </div>
        </Card>

        <Button variant="secondary" size="sm" onClick={() => { setState('setup'); setResult(null) }}>
          Try Another Subject
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

      <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">Career Connections</h1>
      <p className="text-[12px] text-text-muted mb-5">See where your subjects can take you in the real world.</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Subject</label>
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {subjects.map((s) => (
                <button key={s} onClick={() => setSubject(s)}
                  className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${subject === s ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-muted'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Maths"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Your interests (optional)</label>
          <input value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="e.g. gaming, sports, animals, art"
            className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
        </div>
      </div>

      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Button onClick={handleGenerate} disabled={!subject.trim() || !apiKey} size="lg" className="w-full">
        <Briefcase size={14} /> Explore Careers
      </Button>
      {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
    </div>
  )
}
