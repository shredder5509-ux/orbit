import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, FileText, Type, Upload, ChevronLeft, ChevronRight, Send, Loader2,
  Check, Circle, Bookmark, AlertCircle, Clock, List, ArrowRight, Sparkles, X,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { PixelScene } from '../components/RetroIllustrations'
import { useStuckStore, type StuckQuestion } from '../stores/stuckStore'
import { useUserStore } from '../stores/userStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useDataStore } from '../stores/dataStore'
import { useAnalyticsStore } from '../stores/analyticsStore'
import { Paywall } from '../components/Paywall'
import { streamMessage } from '../services/claudeApi'

type PageView = 'upload' | 'processing' | 'questionList' | 'walkthrough' | 'summary'

// ─── PIXEL LIGHTHOUSE ───
function PixelLighthouse() {
  return (
    <div className="relative inline-block" style={{ width: 80, height: 100 }}>
      <svg width="80" height="100" viewBox="0 0 20 25" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
        {/* Rock base */}
        <rect x="3" y="22" width="14" height="1" fill="#888" />
        <rect x="4" y="21" width="12" height="1" fill="#999" />
        <rect x="5" y="20" width="10" height="1" fill="#AAA" />
        {/* Tower body — white with coral stripes */}
        <rect x="7" y="6" width="6" height="1" fill="#FF9B8E" />
        <rect x="7" y="7" width="6" height="2" fill="#FFF5F0" />
        <rect x="7" y="9" width="6" height="1" fill="#FF9B8E" />
        <rect x="7" y="10" width="6" height="2" fill="#FFF5F0" />
        <rect x="7" y="12" width="6" height="1" fill="#FF9B8E" />
        <rect x="7" y="13" width="6" height="2" fill="#FFF5F0" />
        <rect x="7" y="15" width="6" height="1" fill="#FF9B8E" />
        <rect x="6" y="16" width="8" height="1" fill="#FFF5F0" />
        <rect x="6" y="17" width="8" height="1" fill="#F0E8E0" />
        <rect x="5" y="18" width="10" height="2" fill="#E8E0D8" />
        {/* Lamp room */}
        <rect x="6" y="4" width="8" height="1" fill="#555" />
        <rect x="7" y="5" width="6" height="1" fill="#555" />
        {/* Light */}
        <rect x="8" y="3" width="4" height="1" fill="#FFE566" />
        <rect x="7" y="2" width="6" height="1" fill="#FFD700" />
        <rect x="8" y="1" width="4" height="1" fill="#555" />
        <rect x="9" y="0" width="2" height="1" fill="#555" />
      </svg>
      {/* Light beam — animated */}
      <div className="absolute" style={{ top: 4, left: '50%', transform: 'translateX(-50%)' }}>
        <div className="lighthouse-beam" />
      </div>
      {/* Pixel stars */}
      {[
        { x: 2, y: 0, color: '#FFE566' },
        { x: 72, y: 6, color: '#FF9B8E' },
        { x: 10, y: 14, color: '#C8B8F0' },
      ].map((s, i) => (
        <div key={i} className="absolute" style={{ left: s.x, top: s.y, width: 3, height: 3, background: s.color, imageRendering: 'pixelated', animation: `pixelTwinkle 2.5s ease-in-out ${i * 0.7}s infinite` }} />
      ))}
      <style>{`
        .lighthouse-beam {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,229,102,0.6) 0%, rgba(255,229,102,0) 70%);
          animation: beamPulse 2.5s ease-in-out infinite;
        }
        @keyframes beamPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(4); opacity: 0.8; }
        }
        @keyframes pixelTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

// ─── PIXEL ILLUSTRATIONS FOR STEPS ───
function PixelCamera() {
  return (
    <svg width="36" height="36" viewBox="0 0 12 12" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
      <rect x="1" y="3" width="10" height="7" fill="#E8F0FE" />
      <rect x="2" y="2" width="3" height="1" fill="#E8F0FE" />
      <rect x="4" y="5" width="4" height="3" rx="0" fill="#C0D0F0" />
      <rect x="5" y="6" width="2" height="1" fill="#8090C0" />
      <rect x="8" y="4" width="2" height="1" fill="#FDE8EC" />
    </svg>
  )
}

function PixelMagnifier() {
  return (
    <svg width="36" height="36" viewBox="0 0 12 12" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
      <rect x="2" y="1" width="6" height="7" fill="#FFF8E1" />
      <rect x="3" y="3" width="4" height="1" fill="#E0D8C0" opacity="0.5" />
      <rect x="3" y="5" width="3" height="1" fill="#E0D8C0" opacity="0.5" />
      <rect x="6" y="5" width="2" height="2" fill="#C0D0F0" />
      <rect x="7" y="6" width="2" height="2" fill="#A0B0D0" />
      <rect x="8" y="7" width="2" height="2" fill="#8090B0" />
      <rect x="7" y="3" width="1" height="1" fill="#34C770" />
      <rect x="7" y="5" width="1" height="1" fill="#34C770" />
    </svg>
  )
}

function PixelChat() {
  return (
    <svg width="36" height="36" viewBox="0 0 12 12" style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}>
      <rect x="1" y="1" width="7" height="4" fill="#E8F0FE" />
      <rect x="1" y="5" width="1" height="1" fill="#E8F0FE" />
      <rect x="3" y="2" width="1" height="1" fill="#999" />
      <rect x="5" y="2" width="1" height="1" fill="#999" />
      <rect x="4" y="6" width="7" height="4" fill="#E6F7ED" />
      <rect x="10" y="10" width="1" height="1" fill="#E6F7ED" />
      <rect x="6" y="7" width="1" height="1" fill="#34C770" />
      <rect x="7" y="8" width="1" height="1" fill="#34C770" />
    </svg>
  )
}

// ─── PIXEL PADLOCK ───
function PixelPadlock({ unlocked }: { unlocked: boolean }) {
  return (
    <motion.svg
      width="48" height="56"
      viewBox="0 0 12 14"
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      animate={unlocked ? {} : { rotate: [0, -2, 2, -1, 0] }}
      transition={unlocked ? {} : { duration: 0.3, repeat: Infinity, repeatDelay: 5 }}
    >
      {/* Shackle */}
      <motion.g
        animate={unlocked ? { y: -3, rotate: -15, originX: '50%', originY: '100%' } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <rect x="3" y="0" width="1" height="5" fill="#C0B090" />
        <rect x="8" y="0" width="1" height="5" fill="#C0B090" />
        <rect x="3" y="0" width="6" height="1" fill="#D0C0A0" />
      </motion.g>
      {/* Body */}
      <rect x="1" y="5" width="10" height="8" fill="#D8C8A0" />
      <rect x="2" y="6" width="8" height="6" fill="#E8D8B8" />
      {/* Keyhole */}
      <rect x="5" y="8" width="2" height="1" fill="#8A7A50" />
      <rect x="5" y="9" width="2" height="2" fill="#8A7A50" />
      <rect x="6" y="11" width="1" height="1" fill="#8A7A50" />
    </motion.svg>
  )
}

// ─── STEP SHOWCASE ───
function StepShowcase({ tutorName, activeStep }: { tutorName: string; activeStep: number }) {
  const steps = [
    { icon: PixelCamera, title: 'Upload your homework', desc: 'Photo, PDF, or just type it out' },
    { icon: PixelMagnifier, title: `${tutorName} reads every question`, desc: 'Identifies topics, difficulty, and the best approach' },
    { icon: PixelChat, title: 'Walk through step by step', desc: 'Every question explained — no just giving answers' },
  ]

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const Icon = step.icon
        const isActive = activeStep === i || activeStep === 3
        return (
          <div key={i}>
            <motion.div
              animate={{
                opacity: isActive ? 1 : 0.4,
                scale: isActive ? 1.02 : 1,
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] border transition-shadow"
              style={{
                borderColor: isActive ? 'rgba(200, 184, 240, 0.5)' : 'rgba(229, 229, 229, 0.5)',
                boxShadow: isActive ? '0 0 12px rgba(200, 184, 240, 0.15)' : 'none',
              }}
            >
              <div className="shrink-0"><Icon /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-text-primary">{step.title}</p>
                <p className="text-[10px] text-text-muted leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
            {/* Connecting dots */}
            {i < 2 && (
              <div className="flex justify-center py-1">
                <motion.div
                  animate={{ opacity: activeStep === i ? [0.2, 0.6, 0.2] : 0.15 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className="w-1 h-1 rounded-full bg-text-muted" />
                  <div className="w-1 h-1 rounded-full bg-text-muted" />
                </motion.div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── PARTICLE EFFECT ───
function PixelParticles({ active }: { active: boolean }) {
  if (!active) return null
  const colors = ['#E8F0FE', '#FDE8EC', '#FFF8E1', '#E6F7ED', '#F0E6FF', '#FFE566', '#FF9B8E', '#C8B8F0']
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => {
        const color = colors[i % colors.length]
        const angle = (i / 12) * 360
        const distance = 60 + Math.random() * 40
        const tx = Math.cos((angle * Math.PI) / 180) * distance
        const ty = Math.sin((angle * Math.PI) / 180) * distance
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: tx, y: ty, opacity: 0, scale: 0.5, rotate: Math.random() * 360 }}
            transition={{ duration: 0.8, delay: i * 0.03, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2"
            style={{ width: 4, height: 4, background: color, imageRendering: 'pixelated' }}
          />
        )
      })}
    </div>
  )
}

// ─── STUCK PAYWALL (full component) ───
function StuckPaywall({ tutorName, onUnlock, onDismiss }: { tutorName: string; onUnlock: () => void; onDismiss: () => void }) {
  const [activeStep, setActiveStep] = useState(0)
  const [unlocking, setUnlocking] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // Auto-cycle steps
  useEffect(() => {
    if (unlocked) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev >= 3 ? 0 : prev + 1))
    }, 2500)
    return () => clearInterval(interval)
  }, [unlocked])

  const handleUnlock = async () => {
    setUnlocking(true)

    // Simulate trial start
    setTimeout(() => {
      useSubscriptionStore.getState().upgradePlan('pro')
      setUnlocking(false)
      setUnlocked(true)
      setShowParticles(true)

      // After padlock animation, show content
      setTimeout(() => {
        setShowContent(true)
        setTimeout(() => onUnlock(), 600)
      }, 1000)
    }, 500)
  }

  return (
    <div className="relative max-w-[680px] mx-auto px-6 py-6">
      <PixelScene variant="minimal" />
      <div className="relative z-10">
        {/* Lighthouse + heading */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <PixelLighthouse />
          </div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight mb-1">
            Your guide when you're stuck
          </h1>
        </div>

        {/* 3-step showcase */}
        <div className="mb-6">
          <StepShowcase tutorName={tutorName} activeStep={activeStep} />
        </div>

        {/* Padlock paywall area */}
        <AnimatePresence mode="wait">
          {!showContent ? (
            <motion.div
              key="locked"
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="text-center border border-border/50 rounded-[var(--radius-xl)] py-6 px-4 relative overflow-hidden"
            >
              <div className="relative inline-block mb-2">
                <motion.div
                  animate={unlocked ? { scale: 0, opacity: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <PixelPadlock unlocked={unlocked} />
                </motion.div>
                {showParticles && <PixelParticles active={true} />}
              </div>

              {/* Glow burst */}
              <AnimatePresence>
                {unlocked && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.3 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(200,184,240,0.3), transparent)' }}
                  />
                )}
              </AnimatePresence>

              {!unlocked && (
                <>
                  <p className="text-[12px] text-text-muted mb-4">Unlock homework help with Pro</p>
                  <Button onClick={handleUnlock} disabled={unlocking} className="mb-2">
                    {unlocking ? (
                      <><Loader2 size={14} className="animate-spin" /> Unlocking...</>
                    ) : (
                      <><Sparkles size={14} /> Start 7-day free trial</>
                    )}
                  </Button>
                  <br />
                  <button
                    onClick={onDismiss}
                    className="text-[11px] text-text-muted hover:text-text-secondary transition-colors mt-2"
                  >
                    Maybe later
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="unlocked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-4"
            >
              <Check className="mx-auto mb-2 text-success" size={24} />
              <p className="text-[13px] font-medium text-text-primary mb-1">Unlocked!</p>
              <p className="text-[11px] text-text-muted">Loading homework help...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const STATUS_ICONS: Record<StuckQuestion['status'], { icon: typeof Check; color: string; label: string }> = {
  completed: { icon: Check, color: 'text-success', label: '✅' },
  in_progress: { icon: Circle, color: 'text-text-primary', label: '🔵' },
  not_started: { icon: Circle, color: 'text-border', label: '⬜' },
  bookmarked: { icon: Bookmark, color: 'text-warning', label: '⚠️' },
}

function buildStuckSystemPrompt(tutorName: string, studentName: string, question: StuckQuestion, allQuestions: StuckQuestion[]): string {
  const prevCompleted = allQuestions
    .filter((q) => q.status === 'completed')
    .map((q) => `Q${q.number}: ${q.topic}`)
    .join(', ')

  return `You are ${tutorName}, an AI study tutor helping a 13-year-old student named ${studentName} who is STUCK on their homework.

CURRENT QUESTION: ${question.number}
"${question.text}"
Subject: ${question.subject} — ${question.topic}
Difficulty: ${question.difficulty}/5

${prevCompleted ? `Previously completed in this homework: ${prevCompleted}` : ''}

YOUR APPROACH for this question:
1. IDENTIFY: Show the question, ask if they recognise the type of problem
2. METHOD: Explain the approach (not the answer), ask what the first step would be
3. GUIDED SOLVE: Walk through step by step, asking them to try each step first
4. ANSWER CHECK: Confirm the answer, explain why it makes sense
5. BRIDGE: Encourage them and transition to the next question

CRITICAL RULES:
- NEVER give the answer directly. Guide them to find it themselves.
- If they ask "just tell me the answer" → refuse kindly: "I know it's tempting, but working through it means you'll actually remember it in the exam. Let's keep going!"
- Keep messages SHORT: 2-3 sentences max per message
- Use encouraging language: "You're getting the hang of this", "Good instinct", "That's exactly right"
- For maths: show clear working with backticks for equations
- Ask ONE question at a time
- If they're stuck after 2 hints, be more direct but still don't give the full answer
- Reference previous questions if relevant: "Remember how we did Q${question.number}?"
- When the student has successfully reached the answer, end your message with [QUESTION_COMPLETE]

Start by showing them the question and asking if they recognise what type of problem it is.`
}

export function StuckPage() {
  const navigate = useNavigate()
  const { tutorName, tutorAvatarId, displayName, addXp } = useUserStore()
  const { apiKey } = useSettingsStore()
  const { plan } = useSubscriptionStore()
  const { addStudyMinutes, addCompletedSession } = useDataStore()
  const { track } = useAnalyticsStore()
  const isPro = plan !== 'free'

  const {
    currentSession, currentQuestionIndex, sessions, isProcessing, isStreaming, streamingContent,
    startSession, setQuestions, setSessionMeta, selectQuestion, addMessage,
    completeQuestion, bookmarkQuestion, completeSession: finishSession,
    setProcessing, setStreaming, setStreamingContent, appendStreamingContent, resetCurrent,
    getCompletedCount, getTotalQuestions, getEstimatedTimeRemaining,
  } = useStuckStore()

  const [view, setView] = useState<PageView>(currentSession?.questions.length ? 'questionList' : 'upload')
  const [input, setInput] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [showQuestionList, setShowQuestionList] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.questions[currentQuestionIndex]?.messages, streamingContent])

  // Check Pro access
  useEffect(() => {
    if (!isPro && !currentSession) {
      setShowPaywall(true)
    }
  }, [isPro, currentSession])

  // Restore view if session exists
  useEffect(() => {
    if (currentSession && currentSession.questions.length > 0) {
      const hasInProgress = currentSession.questions.some((q) => q.status === 'in_progress')
      setView(hasInProgress ? 'walkthrough' : 'questionList')
    }
  }, [])

  const handleFileUpload = (files: FileList | null, type: 'photo' | 'pdf') => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result as string
      processUpload(content, type)
    }
    if (type === 'photo') {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }
  }

  const handleTextUpload = () => {
    const text = prompt('Paste or type your homework questions:')
    if (text && text.trim()) {
      processUpload(text.trim(), 'text')
    }
  }

  const processUpload = useCallback(async (content: string, type: 'photo' | 'pdf' | 'text') => {
    if (!apiKey) {
      navigate('/settings')
      return
    }

    startSession(content, type)
    setView('processing')
    track('stuck_session_started', { type })

    try {
      const isImage = type === 'photo' && content.startsWith('data:image')

      const systemPrompt = `You are analyzing a student's homework. Extract every individual question/task.
For each question, provide a JSON object with:
- number: the question number/label (e.g., "1", "2a", "Q3")
- text: the full question text exactly as written
- subject: what subject (Maths, Science, English, History, French, etc.)
- topic: specific topic being tested (e.g., "quadratic equations", "photosynthesis")
- difficulty: 1-5 scale
- estimatedMinutes: minutes to explain properly (2-5 typically)

Return ONLY a valid JSON object with this structure:
{"title": "Subject — Topic Area", "subject": "Subject", "questions": [...]}

If the content isn't homework, return: {"error": "not_homework"}
If you can't read parts, include what you can and note unreadable parts in the question text.`

      const messages = isImage
        ? [{ role: 'user' as const, content: [{ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: content.split(',')[1] } }, { type: 'text' as const, text: 'Analyze this homework. Extract all questions.' }] }]
        : [{ role: 'user' as const, content: `Analyze this homework and extract all questions:\n\n${content}` }]

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        }),
      })

      if (!response.ok) throw new Error('Failed to analyze homework')

      const data = await response.json()
      const text = data.content?.[0]?.text || ''

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not parse homework analysis')

      const parsed = JSON.parse(jsonMatch[0])

      if (parsed.error === 'not_homework') {
        resetCurrent()
        setView('upload')
        alert(`${tutorName}: Hmm, this doesn't look like homework to me! Try uploading a worksheet, textbook page, or typing out your questions.`)
        return
      }

      setSessionMeta(parsed.title || 'Homework', parsed.subject || 'General')
      setQuestions(parsed.questions.map((q: any) => ({
        number: String(q.number || '?'),
        text: q.text || '',
        subject: q.subject || parsed.subject || 'General',
        topic: q.topic || 'General',
        difficulty: q.difficulty || 3,
        estimatedMinutes: q.estimatedMinutes || 3,
      })))

      setView('questionList')
    } catch (err: any) {
      console.error('Stuck analysis error:', err)
      setProcessing(false)
      resetCurrent()
      setView('upload')
      alert(`${tutorName}: Hmm, I had trouble reading that. Try again or type out the questions manually.`)
    }
  }, [apiKey, tutorName, startSession, setQuestions, setSessionMeta, setProcessing, resetCurrent, navigate, track])

  // Send message in walkthrough
  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming || !currentSession || !apiKey) return
    const question = currentSession.questions[currentQuestionIndex]
    if (!question) return

    const userText = input.trim()
    setInput('')
    addMessage(question.id, 'user', userText)

    // Build conversation history
    const updatedQ = useStuckStore.getState().currentSession?.questions[currentQuestionIndex]
    if (!updatedQ) return

    const systemPrompt = buildStuckSystemPrompt(tutorName, displayName, updatedQ, currentSession.questions)
    const apiMessages = updatedQ.messages.map((m) => ({ role: m.role, content: m.content }))

    setStreaming(true)
    setStreamingContent('')

    streamMessage(
      apiKey,
      systemPrompt,
      apiMessages,
      (chunk) => useStuckStore.getState().appendStreamingContent(chunk),
      (fullText) => {
        const hasComplete = fullText.includes('[QUESTION_COMPLETE]')
        const clean = fullText.replace(/\[QUESTION_COMPLETE\]/g, '').trim()

        const store = useStuckStore.getState()
        const qId = store.currentSession?.questions[store.currentQuestionIndex]?.id
        if (qId) {
          store.addMessage(qId, 'assistant', clean)
          if (hasComplete) store.completeQuestion(qId)
        }
        store.setStreaming(false)
        store.setStreamingContent('')
      },
      (error) => {
        console.error('Stuck streaming error:', error)
        useStuckStore.getState().setStreaming(false)
        useStuckStore.getState().setStreamingContent('')
      }
    )
  }, [input, isStreaming, currentSession, currentQuestionIndex, apiKey, tutorName, displayName, addMessage, setStreaming, setStreamingContent])

  const startQuestion = useCallback((index: number) => {
    selectQuestion(index)
    setView('walkthrough')
    setShowQuestionList(false)

    // Send initial tutor message if no messages yet
    const session = useStuckStore.getState().currentSession
    const q = session?.questions[index]
    if (!q || q.messages.length > 0 || !apiKey || !session) return

    const systemPrompt = buildStuckSystemPrompt(tutorName, displayName, q, session.questions)

    setStreaming(true)
    setStreamingContent('')

    streamMessage(
      apiKey,
      systemPrompt,
      [],
      (chunk) => useStuckStore.getState().appendStreamingContent(chunk),
      (fullText) => {
        const clean = fullText.replace(/\[QUESTION_COMPLETE\]/g, '').trim()
        const store = useStuckStore.getState()
        const qId = store.currentSession?.questions[store.currentQuestionIndex]?.id
        if (qId) store.addMessage(qId, 'assistant', clean)
        store.setStreaming(false)
        store.setStreamingContent('')
      },
      () => {
        useStuckStore.getState().setStreaming(false)
        useStuckStore.getState().setStreamingContent('')
      }
    )
  }, [apiKey, tutorName, displayName, selectQuestion, setStreaming, setStreamingContent])

  const handleFinish = () => {
    if (!currentSession) return
    const completed = currentSession.questions.filter((q) => q.status === 'completed').length
    const bookmarked = currentSession.questions.filter((q) => q.status === 'bookmarked').length
    const xp = completed * 15 + (completed === currentSession.questions.length ? 50 : 0) + bookmarked * 0

    addXp(xp)
    const duration = Math.round((Date.now() - new Date(currentSession.startedAt).getTime()) / 60000)
    addStudyMinutes(duration)
    addCompletedSession({
      id: crypto.randomUUID(),
      topicId: currentSession.id,
      subjectName: currentSession.subject,
      topicName: currentSession.title,
      mode: 'homework',
      startedAt: currentSession.startedAt,
      endedAt: new Date().toISOString(),
      durationMinutes: duration,
      xpEarned: xp,
    })
    track('stuck_session_completed', { questions: currentSession.questions.length, completed, xp })
    finishSession(xp)
    setView('summary')
  }

  const goToNextQuestion = () => {
    if (!currentSession) return
    const nextIndex = currentSession.questions.findIndex((q, i) => i > currentQuestionIndex && q.status !== 'completed')
    if (nextIndex >= 0) {
      startQuestion(nextIndex)
    } else {
      setView('questionList')
    }
  }

  // ─── PAYWALL (redesigned with lighthouse + steps + padlock) ───
  if (showPaywall && !isPro) {
    return <StuckPaywall tutorName={tutorName} onUnlock={() => setShowPaywall(false)} onDismiss={() => navigate('/')} />
  }

  // ─── UPLOAD VIEW ───
  if (view === 'upload') {
    return (
      <div className="relative max-w-[680px] mx-auto px-6 py-6">
        <PixelScene variant="minimal" />
        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'photo')} />
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => handleFileUpload(e.target.files, 'pdf')} />

        <div className="relative z-10">
          <h1 className="text-lg font-semibold text-text-primary tracking-tight mb-1">What are you stuck on?</h1>
          <p className="text-[13px] text-text-muted mb-6">
            Upload your homework and {tutorName} will walk you through every question.
          </p>

          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { icon: Camera, label: 'Take Photo', desc: 'Snap a worksheet', pastel: '#FDE8EC', onClick: () => photoInputRef.current?.click() },
              { icon: FileText, label: 'Upload PDF', desc: 'Drop a document', pastel: '#E8F0FE', onClick: () => fileInputRef.current?.click() },
              { icon: Type, label: 'Type It', desc: 'Paste questions', pastel: '#FFF8E1', onClick: handleTextUpload },
            ].map(({ icon: Icon, label, desc, pastel, onClick }) => (
              <Card
                key={label}
                className="cursor-pointer hover:shadow-sm transition-all text-center"
                padding="sm"
                pastel={pastel + '50'}
                onClick={onClick}
              >
                <div className="w-8 h-8 rounded-[var(--radius-sm)] mx-auto mb-1.5 flex items-center justify-center" style={{ backgroundColor: pastel }}>
                  <Icon size={14} className="text-text-primary" strokeWidth={1.5} />
                </div>
                <p className="text-[12px] font-medium text-text-primary">{label}</p>
                <p className="text-[9px] text-text-muted">{desc}</p>
              </Card>
            ))}
          </div>

          {/* Recent sessions */}
          {sessions.length > 0 && (
            <>
              <h2 className="text-[13px] font-semibold text-text-primary mb-2">Recent Homework</h2>
              <div className="space-y-1.5">
                {sessions.slice(0, 5).map((s) => (
                  <Card key={s.id} padding="sm" className="flex items-center gap-3">
                    <FileText size={14} className="text-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-text-primary font-medium truncate">{s.title}</p>
                      <p className="text-[10px] text-text-muted">
                        {s.questions.filter((q) => q.status === 'completed').length}/{s.questions.length} complete
                        · {Math.round((Date.now() - new Date(s.startedAt).getTime()) / 86400000)}d ago
                      </p>
                    </div>
                    {s.xpEarned > 0 && (
                      <span className="text-[10px] text-text-muted">+{s.xpEarned} XP</span>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── PROCESSING VIEW ───
  if (view === 'processing' || isProcessing) {
    return (
      <div className="relative max-w-[680px] mx-auto px-6 py-16 text-center">
        <PixelScene variant="minimal" />
        <div className="relative z-10">
          <Avatar avatarId={tutorAvatarId} size="lg" />
          <div className="mt-4">
            <Loader2 className="mx-auto mb-2 animate-spin text-text-muted" size={20} />
            <p className="text-sm text-text-primary font-medium">{tutorName} is reading your homework...</p>
            <p className="text-[11px] text-text-muted mt-1">Extracting questions and figuring out how to help</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── SUMMARY VIEW ───
  if (view === 'summary') {
    const lastSession = sessions[0]
    if (!lastSession) { setView('upload'); return null }
    const completed = lastSession.questions.filter((q) => q.status === 'completed')
    const bookmarked = lastSession.questions.filter((q) => q.status === 'bookmarked')
    const strong = [...new Set(completed.map((q) => q.topic))]
    const weak = [...new Set(bookmarked.map((q) => q.topic))]

    return (
      <div className="relative max-w-[680px] mx-auto px-6 py-6">
        <PixelScene variant="minimal" />
        <div className="relative z-10 text-center">
          <h1 className="text-lg font-semibold text-text-primary mb-1">Homework Complete! 🎉</h1>
          <p className="text-[12px] text-text-muted mb-6">
            {completed.length}/{lastSession.questions.length} questions worked through · {lastSession.totalTimeMinutes} min
          </p>

          {strong.length > 0 && (
            <Card className="mb-3 text-left" pastel="#E6F7ED30">
              <p className="text-[11px] font-semibold text-text-primary mb-1.5">Strong areas</p>
              {strong.map((t) => (
                <p key={t} className="text-[12px] text-text-secondary flex items-center gap-1.5 mb-1">
                  <Check size={10} className="text-success" /> {t}
                </p>
              ))}
            </Card>
          )}

          {weak.length > 0 && (
            <Card className="mb-3 text-left" pastel="#FFF8E130">
              <p className="text-[11px] font-semibold text-text-primary mb-1.5">Areas to revisit</p>
              {weak.map((t) => (
                <p key={t} className="text-[12px] text-text-secondary flex items-center gap-1.5 mb-1">
                  <AlertCircle size={10} className="text-warning" /> {t}
                </p>
              ))}
            </Card>
          )}

          {lastSession.xpEarned > 0 && (
            <p className="text-[11px] text-text-muted mb-4">+{lastSession.xpEarned} XP earned</p>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setView('upload') }}>
              New Homework
            </Button>
            <Button className="flex-1" onClick={() => navigate('/')}>
              Done
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── QUESTION LIST VIEW ───
  if (view === 'questionList' || showQuestionList) {
    if (!currentSession) { setView('upload'); return null }
    const completed = getCompletedCount()
    const total = getTotalQuestions()
    const timeLeft = getEstimatedTimeRemaining()

    return (
      <div className="relative max-w-[680px] mx-auto px-6 py-6">
        <PixelScene variant="minimal" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-semibold text-text-primary tracking-tight">{currentSession.title}</h1>
            <button onClick={handleFinish} className="text-[11px] text-text-muted hover:text-text-primary transition-colors">Finish</button>
          </div>
          <p className="text-[11px] text-text-muted mb-4">
            {completed}/{total} complete · ~{timeLeft} min remaining
          </p>

          {/* Progress bar */}
          <div className="h-1.5 bg-border/30 rounded-full mb-5 overflow-hidden">
            <div className="h-full bg-success/60 rounded-full transition-all" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
          </div>

          {/* Quick actions */}
          {completed === 0 && (
            <Button className="w-full mb-4" onClick={() => startQuestion(0)}>
              Start from Q{currentSession.questions[0]?.number}
            </Button>
          )}

          {/* Question list */}
          <div className="space-y-1.5">
            {currentSession.questions.map((q, i) => {
              const status = STATUS_ICONS[q.status]
              return (
                <motion.button
                  key={q.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => startQuestion(i)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] border border-border/40 hover:bg-accent-light/30 transition-all text-left group"
                >
                  <span className="text-sm shrink-0">{status.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-text-primary truncate">
                      <span className="font-medium">Q{q.number}.</span> {q.text}
                    </p>
                    <p className="text-[10px] text-text-muted">{q.topic} · ~{q.estimatedMinutes} min</p>
                  </div>
                  <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {q.status === 'completed' ? 'Review' : q.status === 'in_progress' ? 'Continue' : 'Start'}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─── WALKTHROUGH VIEW ───
  if (!currentSession) { setView('upload'); return null }
  const question = currentSession.questions[currentQuestionIndex]
  if (!question) { setView('questionList'); return null }
  const completed = getCompletedCount()
  const total = getTotalQuestions()

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-dark-bg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border dark:border-dark-border shrink-0">
        <button onClick={() => { setShowQuestionList(false); setView('questionList') }} className="text-text-muted hover:text-text-primary transition-colors p-1">
          <List size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-text-primary truncate">Q{question.number}: {question.topic}</p>
          <p className="text-[9px] text-text-muted">{completed}/{total} complete</p>
        </div>
        {/* Nav arrows */}
        <div className="flex gap-1">
          <button
            onClick={() => currentQuestionIndex > 0 && startQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => currentQuestionIndex < total - 1 && startQuestion(currentQuestionIndex + 1)}
            disabled={currentQuestionIndex >= total - 1}
            className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {/* Bookmark */}
        <button
          onClick={() => { bookmarkQuestion(question.id); goToNextQuestion() }}
          className="p-1 text-text-muted hover:text-warning transition-colors"
          title="Bookmark and skip"
        >
          <Bookmark size={14} />
        </button>
      </div>

      {/* Phase dots */}
      <div className="flex justify-center gap-1.5 py-2 border-b border-border/30">
        {Array.from({ length: total }).map((_, i) => {
          const q = currentSession.questions[i]
          return (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentQuestionIndex ? 'w-5' : 'w-1.5'
              } ${
                q.status === 'completed' ? 'bg-success'
                  : q.status === 'in_progress' ? 'bg-text-primary'
                  : q.status === 'bookmarked' ? 'bg-warning'
                  : 'bg-border'
              }`}
              onClick={() => startQuestion(i)}
            />
          )
        })}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[600px] mx-auto space-y-3">
          {/* Question card */}
          <Card pastel="#E8F0FE30" className="mb-2">
            <p className="text-[9px] text-text-muted uppercase tracking-wide mb-1">Question {question.number}</p>
            <p className="text-[13px] text-text-primary font-medium leading-relaxed">{question.text}</p>
          </Card>

          {/* Messages */}
          {question.messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <Avatar avatarId={tutorAvatarId} size="sm" />}
              <div className={`max-w-[80%] px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'border border-border rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] text-text-primary'
                  : 'bg-text-primary text-white rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)]'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Streaming */}
          {isStreaming && streamingContent && (
            <div className="flex gap-2.5">
              <Avatar avatarId={tutorAvatarId} size="sm" />
              <div className="max-w-[80%] px-3 py-2 text-sm border border-border rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] text-text-primary whitespace-pre-wrap">
                {streamingContent.replace(/\[QUESTION_COMPLETE\]/g, '')}
                <span className="inline-block w-0.5 h-4 bg-text-primary ml-0.5 animate-pulse" />
              </div>
            </div>
          )}

          {isStreaming && !streamingContent && (
            <div className="flex gap-2.5">
              <Avatar avatarId={tutorAvatarId} size="sm" />
              <div className="px-3 py-2 border border-border rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)]">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Completed banner */}
          <AnimatePresence>
            {question.status === 'completed' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card pastel="#E6F7ED40" className="text-center">
                  <Check className="mx-auto mb-1 text-success" size={18} />
                  <p className="text-[12px] font-medium text-text-primary mb-2">Question complete!</p>
                  <Button size="sm" onClick={goToNextQuestion}>
                    {currentQuestionIndex < total - 1 ? (
                      <>Next Question <ArrowRight size={12} /></>
                    ) : (
                      'View All Questions'
                    )}
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      {question.status !== 'completed' && (
        <div className="px-4 py-3 border-t border-border shrink-0 bg-white dark:bg-dark-surface">
          <div className="max-w-[600px] mx-auto flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isStreaming ? `${tutorName} is thinking...` : 'Type your answer...'}
              disabled={isStreaming}
              className="flex-1 px-3 py-2 rounded-[var(--radius-md)] border border-border bg-white text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="px-3 py-2 bg-text-primary text-white rounded-[var(--radius-md)] hover:opacity-80 transition-opacity disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
