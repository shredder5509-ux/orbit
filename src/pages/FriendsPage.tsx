import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Plus, X, Users, Trophy } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useUserStore } from '../stores/userStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Friend {
  id: string
  name: string
  code: string
  currentStreak: number
}

interface FriendState {
  myCode: string
  friends: Friend[]
  addFriend: (code: string) => void
  removeFriend: (id: string) => void
}

// Random space-themed names for simulated friends
const NAMES = ['Cosmic Fox', 'Star Walker', 'Moon Rover', 'Orbit Owl', 'Nova Cat', 'Space Gem', 'Astro Wave', 'Nebula Kid']

const useFreindStore = create<FriendState>()(
  persist(
    (set, get) => ({
      myCode: 'ORBIT-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      friends: [],
      addFriend: (code) => {
        if (get().friends.some((f) => f.code === code)) return
        // TODO: Replace with real sync when backend is built
        const name = NAMES[Math.floor(Math.random() * NAMES.length)]
        const streak = Math.floor(Math.random() * 20) + 1
        set((s) => ({
          friends: [...s.friends, { id: crypto.randomUUID(), name, code, currentStreak: streak }],
        }))
      },
      removeFriend: (id) => set((s) => ({ friends: s.friends.filter((f) => f.id !== id) })),
    }),
    { name: 'orbit-friends' }
  )
)

export function FriendsPage() {
  const navigate = useNavigate()
  const { currentStreak, displayName } = useUserStore()
  const { myCode, friends, addFriend, removeFriend } = useFreindStore()
  const [friendCode, setFriendCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAdd = () => {
    if (!friendCode.trim()) return
    addFriend(friendCode.trim().toUpperCase())
    setFriendCode('')
  }

  const allStreaks = [
    ...friends.map((f) => ({ name: f.name, streak: f.currentStreak, isYou: false, id: f.id })),
    { name: 'You', streak: currentStreak, isYou: true, id: 'me' },
  ].sort((a, b) => b.streak - a.streak)

  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary"><ArrowLeft size={16} /></button>
        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">Friends</h1>
      </div>

      {/* Your code */}
      <div className="flex items-center gap-3 mb-5 py-3 border-b border-border/50 dark:border-white/10">
        <div className="flex-1">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-0.5">Your code</p>
          <p className="text-[14px] font-mono font-semibold text-text-primary dark:text-dark-text-primary tracking-wider">{myCode}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
        </Button>
      </div>

      {/* Add friend */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1">
          <Input value={friendCode} onChange={(e) => setFriendCode(e.target.value)} placeholder="Enter friend's code"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        </div>
        <Button variant="secondary" size="sm" onClick={handleAdd} disabled={!friendCode.trim()} className="self-end">
          <Plus size={12} /> Add
        </Button>
      </div>

      {/* Streaks */}
      {allStreaks.length > 1 ? (
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">STREAKS</p>
          <div className="space-y-1">
            {allStreaks.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] transition-all group ${
                  entry.isYou ? 'bg-accent-light/40 dark:bg-white/8 border border-border/50 dark:border-white/10' : ''
                }`}
              >
                <span className="text-[13px] text-text-primary dark:text-dark-text-primary flex-1 font-medium">
                  {entry.name}{entry.isYou ? '' : ''}
                </span>
                <span className="text-[13px] text-text-primary dark:text-dark-text-primary font-semibold">{entry.streak}</span>
                <span className="text-[10px] text-text-muted">day streak</span>
                {!entry.isYou && (
                  <button onClick={() => removeFriend(entry.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error p-0.5">
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <Users size={20} className="mx-auto mb-2 text-text-muted" />
          <p className="text-[13px] text-text-muted">Share your code with friends to see each other's streaks.</p>
        </div>
      )}
    </div>
  )
}
