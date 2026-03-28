import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap } from 'lucide-react'
import { Button } from './ui/Button'
import { useUserStore } from '../stores/userStore'

interface BrainBreakProps {
  open: boolean
  onClose: () => void
}

type Game = 'memory' | 'reaction' | 'math'

const EMOJIS = ['🌍', '🌙', '⭐', '🚀', '🪐', '☀️', '🌈', '💫']

export function BrainBreak({ open, onClose }: BrainBreakProps) {
  const [game, setGame] = useState<Game | null>(null)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-dark-surface rounded-[var(--radius-lg)] border border-border dark:border-dark-border p-5 max-w-sm w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
            <Zap size={14} /> Brain Break
          </h2>
          <button onClick={() => { setGame(null); onClose() }} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        {!game ? (
          <div className="space-y-2">
            <p className="text-[11px] text-text-muted mb-3">Take a quick break to refresh your brain!</p>
            <Button variant="secondary" className="w-full" onClick={() => setGame('memory')}>
              🧠 Memory Match
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setGame('reaction')}>
              ⚡ Reaction Time
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setGame('math')}>
              🔢 Speed Maths
            </Button>
          </div>
        ) : game === 'memory' ? (
          <MemoryGame onDone={() => setGame(null)} />
        ) : game === 'reaction' ? (
          <ReactionGame onDone={() => setGame(null)} />
        ) : (
          <SpeedMathGame onDone={() => setGame(null)} />
        )}
      </motion.div>
    </div>
  )
}

function MemoryGame({ onDone }: { onDone: () => void }) {
  const { addXp } = useUserStore()
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  useEffect(() => {
    const emojis = EMOJIS.slice(0, 6)
    const deck = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    setCards(deck)
  }, [])

  const handleFlip = (id: number) => {
    if (flipped.length >= 2) return
    const card = cards[id]
    if (card.matched || card.flipped) return

    const newCards = [...cards]
    newCards[id].flipped = true
    setCards(newCards)

    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = newFlipped
      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          const updated = [...cards]
          updated[a].matched = true
          updated[b].matched = true
          setCards(updated)
          setFlipped([])
          if (updated.every((c) => c.matched)) addXp(5)
        }, 300)
      } else {
        setTimeout(() => {
          const updated = [...cards]
          updated[a].flipped = false
          updated[b].flipped = false
          setCards(updated)
          setFlipped([])
        }, 600)
      }
    }
  }

  const allMatched = cards.every((c) => c.matched)

  return (
    <div>
      <p className="text-[11px] text-text-muted mb-3">Find matching pairs! Moves: {moves}</p>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-[var(--radius-sm)] border text-lg flex items-center justify-center transition-all ${
              card.flipped || card.matched
                ? 'bg-accent-light/40 dark:bg-white/10 border-border dark:border-white/15'
                : 'bg-pastel-blue/30 dark:bg-white/5 border-pastel-blue/50 dark:border-white/10 hover:scale-105'
            } ${card.matched ? 'opacity-40' : ''}`}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>
      {allMatched && (
        <div className="text-center">
          <p className="text-[12px] text-text-primary dark:text-dark-text-primary font-medium mb-2">Done in {moves} moves! +5 XP</p>
          <Button variant="secondary" size="sm" onClick={onDone}>Back</Button>
        </div>
      )}
    </div>
  )
}

function ReactionGame({ onDone }: { onDone: () => void }) {
  const { addXp } = useUserStore()
  const [phase, setPhase] = useState<'wait' | 'ready' | 'go' | 'done'>('wait')
  const [startTime, setStartTime] = useState(0)
  const [reactionTime, setReactionTime] = useState(0)

  const start = useCallback(() => {
    setPhase('ready')
    const delay = 2000 + Math.random() * 3000
    setTimeout(() => {
      setStartTime(Date.now())
      setPhase('go')
    }, delay)
  }, [])

  const handleClick = () => {
    if (phase === 'go') {
      const time = Date.now() - startTime
      setReactionTime(time)
      setPhase('done')
      if (time < 300) addXp(5)
    } else if (phase === 'ready') {
      setPhase('wait') // too early
    }
  }

  return (
    <div className="text-center">
      {phase === 'wait' && (
        <>
          <p className="text-[12px] text-text-muted mb-3">Click when the screen turns green. Ready?</p>
          <Button onClick={start}>Start</Button>
        </>
      )}
      {phase === 'ready' && (
        <button onClick={handleClick} className="w-full py-16 rounded-[var(--radius-md)] bg-red-100 dark:bg-red-900/20 text-red-600 text-sm font-medium">
          Wait for green...
        </button>
      )}
      {phase === 'go' && (
        <button onClick={handleClick} className="w-full py-16 rounded-[var(--radius-md)] bg-green-100 dark:bg-green-900/20 text-green-600 text-sm font-medium">
          CLICK NOW!
        </button>
      )}
      {phase === 'done' && (
        <>
          <p className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary mb-1">{reactionTime}ms</p>
          <p className="text-[11px] text-text-muted mb-3">
            {reactionTime < 200 ? 'Lightning fast!' : reactionTime < 300 ? 'Great reflexes!' : reactionTime < 400 ? 'Not bad!' : 'Keep practising!'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" size="sm" onClick={() => setPhase('wait')}>Again</Button>
            <Button variant="ghost" size="sm" onClick={onDone}>Back</Button>
          </div>
        </>
      )}
    </div>
  )
}

function SpeedMathGame({ onDone }: { onDone: () => void }) {
  const { addXp } = useUserStore()
  const [question, setQuestion] = useState({ a: 0, b: 0, op: '+', answer: 0 })
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [started, setStarted] = useState(false)

  const generateQuestion = useCallback(() => {
    const ops = ['+', '-', '×'] as const
    const op = ops[Math.floor(Math.random() * ops.length)]
    let a: number, b: number, answer: number
    if (op === '+') {
      a = Math.floor(Math.random() * 50) + 5
      b = Math.floor(Math.random() * 50) + 5
      answer = a + b
    } else if (op === '-') {
      a = Math.floor(Math.random() * 50) + 20
      b = Math.floor(Math.random() * 20) + 1
      answer = a - b
    } else {
      a = Math.floor(Math.random() * 12) + 2
      b = Math.floor(Math.random() * 12) + 2
      answer = a * b
    }
    setQuestion({ a, b, op, answer })
    setInput('')
  }, [])

  const handleStart = () => {
    setStarted(true)
    setScore(0)
    setTotal(0)
    setTimeLeft(30)
    generateQuestion()
  }

  useEffect(() => {
    if (!started || timeLeft <= 0) return
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [started, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && started) {
      addXp(Math.min(score * 2, 15))
    }
  }, [timeLeft, started])

  const handleSubmit = () => {
    if (parseInt(input) === question.answer) {
      setScore((s) => s + 1)
    }
    setTotal((t) => t + 1)
    generateQuestion()
  }

  if (!started || timeLeft <= 0) {
    return (
      <div className="text-center">
        {timeLeft <= 0 ? (
          <>
            <p className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary mb-1">{score}/{total}</p>
            <p className="text-[11px] text-text-muted mb-3">+{Math.min(score * 2, 15)} XP</p>
            <div className="flex gap-2 justify-center">
              <Button variant="secondary" size="sm" onClick={handleStart}>Again</Button>
              <Button variant="ghost" size="sm" onClick={onDone}>Back</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[12px] text-text-muted mb-3">Answer as many as you can in 30 seconds!</p>
            <Button onClick={handleStart}>Start</Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="flex justify-between text-[10px] text-text-muted mb-3">
        <span>{score} correct</span>
        <span>{timeLeft}s left</span>
      </div>
      <p className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-3">
        {question.a} {question.op} {question.b} = ?
      </p>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        type="number"
        autoFocus
        className="w-24 mx-auto px-3 py-2 text-center rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary text-lg font-mono focus:outline-none focus:border-text-primary"
      />
    </div>
  )
}
