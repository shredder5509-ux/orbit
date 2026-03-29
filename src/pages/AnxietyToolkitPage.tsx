import { useState } from 'react'
import { ArrowLeft, Wind, Eye, Clock, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const COMMON_WORRIES = [
  {
    worry: "I'm going to fail",
    reframe: "One exam doesn't define me. I've prepared, and I'll show what I know. Even if it doesn't go perfectly, I can learn from it.",
  },
  {
    worry: "I don't know enough",
    reframe: "I know more than I think. Anxiety makes it feel like I've forgotten everything, but once I start writing, it'll come back.",
  },
  {
    worry: "Everyone else is smarter",
    reframe: "I can only compare me to past-me. Other people are nervous too — they're just not showing it.",
  },
  {
    worry: "I'll run out of time",
    reframe: "I'll read through first, start with what I know best, and keep moving. I don't need to answer everything perfectly.",
  },
  {
    worry: "My mind will go blank",
    reframe: "If it does, I'll take three deep breaths, read the question again slowly, and start writing anything related. It always comes back.",
  },
]

const GROUNDING_STEPS = [
  { count: 5, sense: 'things you can SEE', icon: Eye },
  { count: 4, sense: 'things you can TOUCH', icon: Wind },
  { count: 3, sense: 'things you can HEAR', icon: Wind },
  { count: 2, sense: 'things you can SMELL', icon: Wind },
  { count: 1, sense: 'thing you can TASTE', icon: Wind },
]

export function AnxietyToolkitPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'before' | 'during' | 'after'>('before')
  const [worryDump, setWorryDump] = useState('')
  const [worrySaved, setWorrySaved] = useState(false)
  const [expandedWorry, setExpandedWorry] = useState<number | null>(null)
  const [groundingStep, setGroundingStep] = useState(0)
  const [postExamLog, setPostExamLog] = useState({ howItWent: '', surprises: '', nextTime: '' })

  const saveWorryDump = () => {
    setWorrySaved(true)
    setWorryDump('')
    setTimeout(() => setWorrySaved(false), 3000)
  }

  const tabs = [
    { id: 'before' as const, label: 'Before' },
    { id: 'during' as const, label: 'During' },
    { id: 'after' as const, label: 'After' },
  ]

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-muted">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Exam Anxiety Toolkit</h1>
      </div>

      <p className="text-sm text-text-muted mb-4">Always free. You've got this.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium rounded-[var(--radius-md)] border transition-colors ${
              tab === t.id
                ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                : 'border-border dark:border-dark-border text-text-secondary dark:text-dark-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'before' && (
        <div className="space-y-6">
          {/* Worry Dump */}
          <div>
            <h2 className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">Worry dump</h2>
            <p className="text-xs text-text-muted mb-2">Write down everything you're worried about. Get it out of your head.</p>
            <textarea
              value={worryDump}
              onChange={(e) => setWorryDump(e.target.value)}
              placeholder="Write anything..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary resize-none focus:outline-none focus:border-text-muted"
            />
            <button
              onClick={saveWorryDump}
              disabled={!worryDump.trim()}
              className="mt-2 px-3 py-1.5 text-xs border border-border dark:border-dark-border rounded-[var(--radius-sm)] text-text-secondary dark:text-dark-text-secondary disabled:opacity-40"
            >
              Save and clear my head
            </button>
            {worrySaved && (
              <p className="text-xs text-success mt-1">Saved. Your mind is clearer now.</p>
            )}
          </div>

          {/* Reframe Thoughts */}
          <div>
            <h2 className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">Reframe thoughts</h2>
            <p className="text-xs text-text-muted mb-2">Tap a common worry to see a more realistic way of thinking about it.</p>
            <div className="space-y-1">
              {COMMON_WORRIES.map((w, i) => (
                <div key={i} className="border border-border dark:border-dark-border rounded-[var(--radius-md)] overflow-hidden">
                  <button
                    onClick={() => setExpandedWorry(expandedWorry === i ? null : i)}
                    className="w-full text-left px-3 py-2.5 text-sm text-text-primary dark:text-dark-text-primary"
                  >
                    "{w.worry}"
                  </button>
                  {expandedWorry === i && (
                    <div className="px-3 pb-2.5 border-t border-border dark:border-dark-border pt-2">
                      <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{w.reframe}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'during' && (
        <div className="space-y-6">
          {/* 5-4-3-2-1 Grounding */}
          <div>
            <h2 className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">5-4-3-2-1 Grounding</h2>
            <p className="text-xs text-text-muted mb-3">Bring yourself back to the present moment.</p>

            {groundingStep < GROUNDING_STEPS.length ? (
              <div className="text-center py-6 border border-border dark:border-dark-border rounded-[var(--radius-md)]">
                <p className="text-3xl font-light text-text-primary dark:text-dark-text-primary mb-2">
                  {GROUNDING_STEPS[groundingStep].count}
                </p>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                  {GROUNDING_STEPS[groundingStep].sense}
                </p>
                <button
                  onClick={() => setGroundingStep(groundingStep + 1)}
                  className="px-4 py-1.5 text-xs border border-border dark:border-dark-border rounded-[var(--radius-sm)] text-text-secondary dark:text-dark-text-secondary"
                >
                  Done — next
                </button>
              </div>
            ) : (
              <div className="text-center py-6 border border-border dark:border-dark-border rounded-[var(--radius-md)]">
                <p className="text-sm text-text-primary dark:text-dark-text-primary mb-2">You're grounded. You're here. You're ready.</p>
                <button
                  onClick={() => setGroundingStep(0)}
                  className="text-xs text-text-muted underline"
                >
                  Do it again
                </button>
              </div>
            )}
          </div>

          {/* Time Management */}
          <div>
            <h2 className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">
              <Clock size={14} strokeWidth={1.5} className="inline mr-1" />
              Quick time plan
            </h2>
            <p className="text-xs text-text-muted mb-2">
              Total time ÷ number of questions = time per question. Start with the ones you know best.
              Leave 5 minutes at the end to check.
            </p>
          </div>

          {/* Breathing */}
          <div>
            <h2 className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">Box breathing</h2>
            <p className="text-xs text-text-muted">
              Breathe in for 4 seconds. Hold for 4. Out for 4. Hold for 4. Repeat 3 times.
            </p>
          </div>
        </div>
      )}

      {tab === 'after' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">
              <BookOpen size={14} strokeWidth={1.5} className="inline mr-1" />
              Post-exam log
            </h2>
            <p className="text-xs text-text-muted mb-3">Reflect while it's fresh. This is just for you.</p>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">How did it go?</label>
            <textarea
              value={postExamLog.howItWent}
              onChange={(e) => setPostExamLog({ ...postExamLog, howItWent: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary resize-none focus:outline-none focus:border-text-muted"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Any surprises?</label>
            <textarea
              value={postExamLog.surprises}
              onChange={(e) => setPostExamLog({ ...postExamLog, surprises: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary resize-none focus:outline-none focus:border-text-muted"
            />
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">What would you do differently next time?</label>
            <textarea
              value={postExamLog.nextTime}
              onChange={(e) => setPostExamLog({ ...postExamLog, nextTime: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary resize-none focus:outline-none focus:border-text-muted"
            />
          </div>

          <p className="text-xs text-text-muted italic">
            Don't compare answers with friends. What's done is done — be kind to yourself.
          </p>
        </div>
      )}
    </div>
  )
}
