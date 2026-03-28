import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Settings, Loader2, CheckCircle, ArrowRight, Trophy } from 'lucide-react'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useUserStore } from '../stores/userStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUploadStore } from '../stores/uploadStore'
import {
  useSessionStore,
  getNextPhase,
  getPhaseIndex,
  MODE_PHASES,
  MODE_LABELS,
  type SessionPhase,
  type SessionMode,
} from '../stores/sessionStore'
import { streamMessage, buildSystemPrompt, gradeSubmission } from '../services/claudeApi'
import { PixelScene } from '../components/RetroIllustrations'
import { VoiceInputButton, SpeakButton } from '../components/VoiceInput'
import { Calculator } from '../components/Calculator'
import { FormulaSheet } from '../components/FormulaSheet'
import { DictionaryLookup } from '../components/DictionaryLookup'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useSubjectStore } from '../stores/subjectStore'
import { useDataStore, BADGE_DEFS, type BadgeId } from '../stores/dataStore'
import { useAnalyticsStore } from '../stores/analyticsStore'
import { Paywall } from '../components/Paywall'
import { ConfidenceCheck } from '../components/ConfidenceCheck'
import { BreakReminder } from '../components/BreakReminder'
import { useConfidenceStore } from '../stores/confidenceStore'

export function StudySessionPage() {
  const { uploadId } = useParams<{ uploadId: string }>()
  const [searchParams] = useSearchParams()
  const mode = (searchParams.get('mode') || 'homework') as SessionMode
  const navigate = useNavigate()
  const { tutorName, tutorAvatarId, displayName, addXp } = useUserStore()
  const { apiKey } = useSettingsStore()
  const upload = useUploadStore((s) => s.uploads.find((u) => u.id === uploadId))

  const {
    phase, sessionMode, messages, isStreaming, streamingContent,
    gradeResult, submission, error,
    startSession, setPhase, addMessage,
    setStreaming, setStreamingContent, appendStreamingContent,
    setSubmission, setGradeResult, setError, reset,
  } = useSessionStore()

  // Get mastered topics for concept connections
  const masteredTopics = useSubjectStore((s) =>
    s.subjects.flatMap((sub) => sub.topics.filter((t) => t.status === 'mastered').map((t) => t.name))
  )

  const { canStartSession, recordSessionUsage } = useSubscriptionStore()
  const { addCompletedSession, addStudyMinutes, checkAndAwardBadges, addReviewSchedule } = useDataStore()
  const { track } = useAnalyticsStore()

  const [input, setInput] = useState('')
  const [xpAwarded, setXpAwarded] = useState(false)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [showFormulas, setShowFormulas] = useState(false)
  const [showDict, setShowDict] = useState(false)
  const [sessionStartTime] = useState(Date.now())
  const [newBadges, setNewBadges] = useState<string[]>([])
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null)
  const [showAfterConfidence, setShowAfterConfidence] = useState(false)
  const { addEntry: addConfidenceEntry, updateAfter: updateConfidenceAfter } = useConfidenceStore()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasStartedRef = useRef(false)

  // Auto-scroll chat
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Send a tutor message
  const sendTutorMessage = useCallback(
    (currentPhase: SessionPhase, conversationMessages?: typeof messages) => {
      if (!apiKey || !upload) return

      const msgs = conversationMessages || messages
      const systemPrompt = buildSystemPrompt(tutorName, displayName, upload.content, currentPhase, sessionMode, masteredTopics)
      const apiMessages = msgs.map((m) => ({ role: m.role, content: m.content }))

      setStreaming(true)
      setStreamingContent('')
      setError(null)

      streamMessage(
        apiKey,
        systemPrompt,
        apiMessages,
        (chunk) => {
          appendStreamingContent(chunk)
        },
        (fullText) => {
          // Check for phase completion marker
          const hasMarker = fullText.includes('[PHASE_COMPLETE]')
          const cleanText = fullText.replace(/\[PHASE_COMPLETE\]/g, '').trim()

          addMessage('assistant', cleanText)
          setStreaming(false)
          setStreamingContent('')

          if (hasMarker) {
            const next = getNextPhase(currentPhase, sessionMode)
            setPhase(next)
          }
        },
        (errorMsg) => {
          setError(errorMsg)
          setStreaming(false)
          setStreamingContent('')
        }
      )
    },
    [apiKey, upload, tutorName, displayName, messages, setStreaming, setStreamingContent, appendStreamingContent, addMessage, setPhase, setError]
  )

  // Initialize session on mount
  useEffect(() => {
    if (!uploadId || !upload || hasStartedRef.current) return
    if (!apiKey) return

    // Check paywall
    if (!canStartSession()) {
      setShowPaywall(true)
      return
    }

    hasStartedRef.current = true
    recordSessionUsage()
    track('session_started', { mode, topicId: uploadId })
    startSession(uploadId, mode)

    // Small delay to let state settle, then send first message
    setTimeout(() => {
      const firstPhase = MODE_PHASES[mode][0]
      const systemPrompt = buildSystemPrompt(tutorName, displayName, upload.content, firstPhase, mode, masteredTopics)
      setStreaming(true)
      setStreamingContent('')

      streamMessage(
        apiKey,
        systemPrompt,
        [],
        (chunk) => {
          useSessionStore.getState().appendStreamingContent(chunk)
        },
        (fullText) => {
          const hasMarker = fullText.includes('[PHASE_COMPLETE]')
          const cleanText = fullText.replace(/\[PHASE_COMPLETE\]/g, '').trim()

          const store = useSessionStore.getState()
          store.addMessage('assistant', cleanText)
          store.setStreaming(false)
          store.setStreamingContent('')

          if (hasMarker) {
            store.setPhase(getNextPhase(firstPhase, mode))
          }
        },
        (errorMsg) => {
          const store = useSessionStore.getState()
          store.setError(errorMsg)
          store.setStreaming(false)
          store.setStreamingContent('')
        }
      )
    }, 100)
  }, [uploadId, upload, apiKey, tutorName, displayName, startSession, setStreaming, setStreamingContent])

  // Handle sending user message
  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    const userText = input.trim()
    setInput('')
    addMessage('user', userText)

    // Need to include the new message in the conversation
    setTimeout(() => {
      const currentMessages = useSessionStore.getState().messages
      const currentPhase = useSessionStore.getState().phase
      sendTutorMessage(currentPhase, currentMessages)
    }, 50)
  }

  // Handle submission for grading
  const handleSubmitForGrading = async () => {
    if (!submission.trim() || !apiKey || !upload) return
    setPhase('grading')

    try {
      const result = await gradeSubmission(apiKey, upload.content, submission, tutorName)
      setGradeResult(result)
      setPhase('complete')

      // Award XP
      const xpAmount = Math.round(result.score * 0.5) + 25
      addXp(xpAmount)
      setXpAwarded(true)
      setShowXpAnimation(true)
      setTimeout(() => setShowXpAnimation(false), 3000)

      // Track completed session
      const durationMins = Math.round((Date.now() - sessionStartTime) / 60000)
      addStudyMinutes(durationMins)
      addCompletedSession({
        id: crypto.randomUUID(),
        topicId: uploadId || '',
        subjectName: upload.name.split(' — ')[0] || 'General',
        topicName: upload.name,
        mode,
        startedAt: new Date(sessionStartTime).toISOString(),
        endedAt: new Date().toISOString(),
        durationMinutes: durationMins,
        xpEarned: xpAmount,
        gradeScore: result.score,
      })

      // Schedule spaced repetition
      addReviewSchedule(uploadId || '')

      // Check for new badges
      const earned = checkAndAwardBadges()
      if (earned.length > 0) setNewBadges(earned)

      track('session_completed', { mode, topicId: uploadId, duration: durationMins, xpEarned: xpAmount, score: result.score })

      // Show after-confidence check
      setShowAfterConfidence(true)
    } catch (err: any) {
      setError(err.message || 'Failed to grade submission')
      setPhase('submission')
    }
  }

  // No upload found
  if (!uploadId || !upload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-6">
        <div className="text-center">
          <p className="text-sm text-text-muted dark:text-dark-text-secondary mb-4">
            No content found. Upload something first.
          </p>
          <Button onClick={() => navigate('/upload')}>Go to Upload</Button>
        </div>
      </div>
    )
  }

  // No API key
  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-6">
        <div className="text-center max-w-sm">
          <Settings className="mx-auto mb-3 text-text-muted" size={24} />
          <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-1">
            API Key Required
          </h2>
          <p className="text-xs text-text-muted dark:text-dark-text-secondary mb-4">
            Add your Anthropic API key in Settings to start learning with {tutorName}.
          </p>
          <Button onClick={() => navigate('/settings')}>
            <Settings size={14} />
            Open Settings
          </Button>
        </div>
      </div>
    )
  }

  // Confidence check before session
  if (upload && apiKey && confidenceBefore === null && !showPaywall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-6">
        <div className="max-w-sm w-full">
          <ConfidenceCheck
            label="How confident are you with this topic?"
            subtitle={upload.name}
            onSelect={(rating) => {
              setConfidenceBefore(rating)
              addConfidenceEntry({
                sessionId: uploadId || '',
                topicName: upload.name,
                subjectName: upload.name.split(' — ')[0] || 'General',
                before: rating,
                after: null,
                actualScore: null,
                date: new Date().toISOString(),
              })
            }}
          />
        </div>
      </div>
    )
  }

  // Detect if subject is maths/science (show calc + formulas)
  const subjectLower = (upload?.name || '').toLowerCase()
  const showMathTools = ['math', 'maths', 'physics', 'chemistry', 'science'].some((s) => subjectLower.includes(s))

  const phaseLabels = MODE_LABELS[sessionMode]
  const teachingPhases = MODE_PHASES[sessionMode]
  const currentPhaseIndex = getPhaseIndex(phase, sessionMode)
  const isTeachingPhase = teachingPhases.includes(phase)

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-dark-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-dark-border bg-white dark:bg-dark-surface shrink-0">
        <button
          onClick={() => { reset(); navigate('/') }}
          className="text-text-muted hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate">
            {upload.name}
          </h2>
          <p className="text-[10px] text-text-muted capitalize">{phase} phase</p>
        </div>
        {/* Study tools */}
        <button onClick={() => setShowDict(true)} className="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-[var(--radius-sm)] hover:bg-accent-light/40" title="Dictionary">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="1" width="8" height="10" rx="1"/><path d="M4 3h4M4 5.5h3M4 8h2"/></svg>
        </button>
        {showMathTools && (
          <div className="flex gap-1 mr-1">
            <button onClick={() => setShowCalc(true)} className="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-[var(--radius-sm)] hover:bg-accent-light/40" title="Calculator">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="0" width="10" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="2" width="6" height="2.5" rx="0.5" fill="currentColor" opacity="0.3"/><circle cx="4" cy="7" r="0.7"/><circle cx="6" cy="7" r="0.7"/><circle cx="8" cy="7" r="0.7"/><circle cx="4" cy="9.5" r="0.7"/><circle cx="6" cy="9.5" r="0.7"/><circle cx="8" cy="9.5" r="0.7"/></svg>
            </button>
            <button onClick={() => setShowFormulas(true)} className="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-[var(--radius-sm)] hover:bg-accent-light/40" title="Formulas">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 2h8M2 6h5M2 10h7"/><path d="M8 4l2 4" strokeLinecap="round"/><path d="M10 4l-2 4" strokeLinecap="round"/></svg>
            </button>
          </div>
        )}

        {/* Phase progress */}
        <div className="flex gap-1">
          {phaseLabels.map((label, i) => (
            <div
              key={label}
              title={label}
              className={`w-8 h-1 rounded-full transition-colors ${
                i < currentPhaseIndex
                  ? 'bg-text-primary dark:bg-dark-text-primary'
                  : i === currentPhaseIndex && isTeachingPhase
                  ? 'bg-text-muted dark:bg-dark-text-secondary'
                  : 'border border-border dark:border-dark-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[600px] mx-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <Avatar avatarId={tutorAvatarId} size="sm" />
              )}
              <div className="max-w-[80%]">
                <div
                  className={`px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === 'assistant'
                      ? 'border border-border dark:border-dark-border rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] text-text-primary dark:text-dark-text-primary'
                      : 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)]'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 mt-0.5 ml-1">
                    <SpeakButton text={msg.content} />
                    <button
                      onClick={() => {
                        addMessage('user', 'Can you explain that differently?')
                        setTimeout(() => {
                          const s = useSessionStore.getState()
                          sendTutorMessage(s.phase, s.messages)
                        }, 50)
                      }}
                      className="text-[8px] text-text-muted/40 hover:text-text-muted transition-colors px-1"
                    >
                      explain differently
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <div className="flex gap-2.5">
              <Avatar avatarId={tutorAvatarId} size="sm" />
              <div className="max-w-[80%] px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] text-text-primary dark:text-dark-text-primary whitespace-pre-wrap">
                {streamingContent.replace(/\[PHASE_COMPLETE\]/g, '')}
                <span className="inline-block w-0.5 h-4 bg-text-primary dark:bg-dark-text-primary ml-0.5 animate-pulse" />
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isStreaming && !streamingContent && (
            <div className="flex gap-2.5">
              <Avatar avatarId={tutorAvatarId} size="sm" />
              <div className="px-3 py-2 border border-border dark:border-dark-border rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)]">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-2">
              <p className="text-xs text-error mb-2">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setError(null)
                  sendTutorMessage(phase)
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Submission phase */}
          <AnimatePresence>
            {phase === 'submission' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4"
              >
                <Card>
                  <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                    {sessionMode === 'project' ? 'Submit your project' : sessionMode === 'test' ? 'Write your answers' : 'Your turn to write'}
                  </h3>
                  <p className="text-xs text-text-muted mb-3">
                    {sessionMode === 'project'
                      ? `Paste your completed project work below. ${tutorName} will score it and suggest improvements.`
                      : sessionMode === 'test'
                      ? `Write out the key concepts you've revised. ${tutorName} will check your understanding.`
                      : `Explain what you've learned in your own words. ${tutorName} will review and grade your response.`
                    }
                  </p>
                  <textarea
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder={sessionMode === 'project' ? 'Paste your project work here...' : sessionMode === 'test' ? 'Write your answers here...' : 'Write your understanding of the topic...'}
                    rows={sessionMode === 'project' ? 10 : 6}
                    className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-border dark:border-dark-border bg-white dark:bg-dark-bg text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary dark:focus:border-dark-text-primary transition-colors resize-none mb-3"
                  />
                  <Button
                    onClick={handleSubmitForGrading}
                    disabled={!submission.trim()}
                    size="lg"
                    className="w-full"
                  >
                    Submit for Review
                    <ArrowRight size={14} />
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grading in progress */}
          {phase === 'grading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Loader2 className="mx-auto mb-2 animate-spin text-text-muted" size={24} />
              <p className="text-sm text-text-muted">{tutorName} is reviewing your work...</p>
            </motion.div>
          )}

          {/* Grade result */}
          <AnimatePresence>
            {phase === 'complete' && gradeResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 space-y-3"
              >
                {/* Score */}
                <Card className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40" cy="40" r="35"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-border dark:text-dark-border"
                      />
                      <circle
                        cx="40" cy="40" r="35"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${(gradeResult.score / 100) * 220} 220`}
                        strokeLinecap="round"
                        className="text-text-primary dark:text-dark-text-primary"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                      {gradeResult.score}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary dark:text-dark-text-primary mb-1 font-medium">
                    {gradeResult.score >= 90 ? 'Excellent!' : gradeResult.score >= 70 ? 'Great work!' : gradeResult.score >= 50 ? 'Good effort!' : 'Keep going!'}
                  </p>
                  <p className="text-xs text-text-muted">{gradeResult.feedback}</p>
                </Card>

                {/* Strengths */}
                {gradeResult.strengths.length > 0 && (
                  <Card>
                    <h3 className="text-xs font-semibold text-text-primary dark:text-dark-text-primary mb-2 uppercase tracking-wide">
                      Strengths
                    </h3>
                    <ul className="space-y-1.5">
                      {gradeResult.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs text-text-secondary dark:text-dark-text-secondary">
                          <CheckCircle size={12} className="text-success mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Improvements */}
                {gradeResult.improvements.length > 0 && (
                  <Card>
                    <h3 className="text-xs font-semibold text-text-primary dark:text-dark-text-primary mb-2 uppercase tracking-wide">
                      Areas to Improve
                    </h3>
                    <ul className="space-y-1.5">
                      {gradeResult.improvements.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs text-text-secondary dark:text-dark-text-secondary">
                          <ArrowRight size={12} className="text-text-muted mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Sessions remaining (free users) */}
                {useSubscriptionStore.getState().plan === 'free' && (
                  <p className="text-[10px] text-text-muted text-center">
                    You have {useSubscriptionStore.getState().getSessionsRemaining()} session{useSubscriptionStore.getState().getSessionsRemaining() !== 1 ? 's' : ''} left today.{' '}
                    <button onClick={() => setShowPaywall(true)} className="underline hover:text-text-secondary transition-colors">
                      Get unlimited
                    </button>
                  </p>
                )}

                {/* Badge toast */}
                {newBadges.length > 0 && (
                  <Card pastel="#FFF8E160" className="text-center">
                    <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Badge earned!</p>
                    {newBadges.map((b) => {
                      const def = BADGE_DEFS[b as BadgeId]
                      return def ? (
                        <div key={b} className="flex items-center justify-center gap-2">
                          <span className="text-lg">{def.icon}</span>
                          <span className="text-[12px] font-medium text-text-primary">{def.name}</span>
                        </div>
                      ) : null
                    })}
                  </Card>
                )}

                {/* After-session confidence check */}
                {showAfterConfidence && (
                  <Card>
                    <ConfidenceCheck
                      label="How confident do you feel now?"
                      subtitle="After this session"
                      onSelect={(rating) => {
                        updateConfidenceAfter(uploadId || '', rating, gradeResult?.score)
                        setShowAfterConfidence(false)
                      }}
                    />
                  </Card>
                )}

                {/* Back button */}
                <Button
                  onClick={() => { reset(); navigate('/') }}
                  variant="secondary"
                  className="w-full"
                >
                  <Trophy size={14} />
                  Back to Orbit
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* XP Animation */}
      <AnimatePresence>
        {showXpAnimation && gradeResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-4 z-50 bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg px-3 py-1.5 rounded-full text-sm font-semibold"
          >
            +{Math.round(gradeResult.score * 0.5) + 25} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area (only during teaching phases) */}
      {isTeachingPhase && (
        <div className="px-4 py-3 border-t border-border dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
          <div className="max-w-[600px] mx-auto flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isStreaming ? `${tutorName} is thinking...` : 'Type your answer...'}
              disabled={isStreaming}
              className="flex-1 px-3 py-2 rounded-[var(--radius-md)] border border-border dark:border-dark-border bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary dark:focus:border-dark-text-primary transition-colors disabled:opacity-50"
            />
            <VoiceInputButton
              onTranscript={(text) => setInput((prev) => prev ? prev + ' ' + text : text)}
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="px-3 py-2 bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg rounded-[var(--radius-md)] hover:opacity-80 transition-opacity disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      <BreakReminder sessionStartTime={sessionStartTime} />
      <Paywall open={showPaywall} onClose={() => { setShowPaywall(false); navigate('/') }} />
      <Calculator open={showCalc} onClose={() => setShowCalc(false)} />
      <FormulaSheet open={showFormulas} onClose={() => setShowFormulas(false)} />
      <DictionaryLookup open={showDict} onClose={() => setShowDict(false)} />
    </div>
  )
}
