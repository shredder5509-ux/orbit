import { useState } from 'react'
import { ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserStore } from '../stores/userStore'

const LOCATIONS = ['My house', 'My school', 'High street', 'Park'] as const

interface PalaceRoom {
  room: string
  fact: string
  image: string
  senses: string
}

interface Palace {
  id: string
  topic: string
  location: string
  rooms: PalaceRoom[]
  createdAt: string
}

export function MemoryPalacePage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { addXp } = useUserStore()

  const [facts, setFacts] = useState('')
  const [location, setLocation] = useState<string>(LOCATIONS[0])
  const [palace, setPalace] = useState<Palace | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)
  const [revealedRooms, setRevealedRooms] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  const generatePalace = async () => {
    if (!apiKey || !facts.trim()) return
    setIsGenerating(true)
    setError('')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1536,
          messages: [{
            role: 'user',
            content: `Create a memory palace to help a 13-year-old remember these facts. Location: ${location}.

Facts to remember:
${facts}

For each fact, create a room in the ${location} with a BIZARRE, VIVID mental image that links the room to the fact. Make the images funny, exaggerated, and memorable.

Respond with ONLY JSON (no markdown):
{"rooms":[{"room":"Front door","fact":"The mitochondria is the powerhouse of the cell","image":"A tiny power station is plugged into the door handle, sparking with electricity and humming loudly","senses":"You feel static electricity on your hand, hear buzzing, smell ozone"}]}`,
          }],
        }),
      })

      const data = await res.json()
      const parsed = JSON.parse(data.content?.[0]?.text || '{}')

      if (parsed.rooms) {
        setPalace({
          id: crypto.randomUUID(),
          topic: facts.split('\n')[0]?.slice(0, 50) || 'Memory Palace',
          location,
          rooms: parsed.rooms,
          createdAt: new Date().toISOString(),
        })
        addXp(10)
      }
    } catch {
      setError('Failed to generate palace.')
    } finally {
      setIsGenerating(false)
    }
  }

  const startPractice = () => {
    setPracticeMode(true)
    setRevealedRooms(new Set())
  }

  const revealRoom = (index: number) => {
    setRevealedRooms((prev) => new Set(prev).add(index))
  }

  if (palace && practiceMode) {
    const allRevealed = revealedRooms.size === palace.rooms.length
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setPracticeMode(false)} className="text-text-muted">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Practice Recall</h1>
        </div>

        <p className="text-sm text-text-muted mb-4">
          Walk through your {location}. For each room, try to recall the fact before revealing it.
        </p>

        <div className="space-y-2">
          {palace.rooms.map((room, i) => (
            <div key={i} className="border border-border dark:border-dark-border rounded-[var(--radius-md)] p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{room.room}</span>
                <button
                  onClick={() => revealRoom(i)}
                  className="text-text-muted"
                >
                  {revealedRooms.has(i) ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
                </button>
              </div>
              {revealedRooms.has(i) ? (
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{room.fact}</p>
              ) : (
                <p className="text-xs text-text-muted italic">Tap the eye to reveal</p>
              )}
            </div>
          ))}
        </div>

        {allRevealed && (
          <div className="text-center mt-4">
            <p className="text-sm text-text-primary dark:text-dark-text-primary mb-2">
              {palace.rooms.length}/{palace.rooms.length} recalled
            </p>
            <button
              onClick={() => { setRevealedRooms(new Set()); }}
              className="text-xs text-text-muted underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    )
  }

  if (palace) {
    return (
      <div className="p-4 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setPalace(null)} className="text-text-muted">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Your Palace</h1>
        </div>

        <p className="text-xs text-text-muted mb-4">Location: {palace.location}</p>

        <div className="space-y-3 mb-6">
          {palace.rooms.map((room, i) => (
            <div key={i} className="border border-border dark:border-dark-border rounded-[var(--radius-md)] p-3">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{room.room}</p>
              <p className="text-sm text-text-primary dark:text-dark-text-primary mb-1.5">{room.fact}</p>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary italic mb-1">{room.image}</p>
              <p className="text-[10px] text-text-muted">{room.senses}</p>
            </div>
          ))}
        </div>

        <button
          onClick={startPractice}
          className="w-full py-2.5 text-sm font-medium border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary"
        >
          Practice recall
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-muted">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Memory Palace</h1>
      </div>

      <p className="text-sm text-text-muted mb-4">
        Enter facts you need to remember. We'll place them in vivid scenes throughout a familiar location.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Facts (one per line)</label>
          <textarea
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            placeholder={"The mitochondria is the powerhouse of the cell\nPhotosynthesis converts light energy to chemical energy\nDNA stands for deoxyribonucleic acid"}
            rows={5}
            className="w-full px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-md)] bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary resize-none focus:outline-none focus:border-text-muted"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1.5">Location</label>
          <div className="flex flex-wrap gap-1.5">
            {LOCATIONS.map((l) => (
              <button
                key={l}
                onClick={() => setLocation(l)}
                className={`px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors ${
                  location === l
                    ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary'
                    : 'border-border dark:border-dark-border text-text-secondary dark:text-dark-text-secondary'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <button
          onClick={generatePalace}
          disabled={!facts.trim() || isGenerating || !apiKey}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] text-text-primary dark:text-dark-text-primary disabled:opacity-40"
        >
          <Sparkles size={14} strokeWidth={1.5} />
          {isGenerating ? 'Building palace...' : 'Build Memory Palace'}
        </button>
      </div>
    </div>
  )
}
