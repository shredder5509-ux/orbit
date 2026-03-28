import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, RotateCcw } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { useUserStore } from '../stores/userStore'
import { useSettingsStore } from '../stores/settingsStore'
import { streamMessage } from '../services/claudeApi'

type State = 'setup' | 'debating' | 'summary'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const TOPICS = [
  'Should school uniforms be mandatory?',
  'Is social media more harmful than helpful for teens?',
  'Should homework be abolished?',
  'Is climate change the biggest threat to humanity?',
  'Should space exploration be prioritised over ocean exploration?',
  'Are exams the best way to measure intelligence?',
  'Should the voting age be lowered to 16?',
  'Is AI a threat to human creativity?',
]

export function DebatePage() {
  const navigate = useNavigate()
  const { apiKey } = useSettingsStore()
  const { tutorName, tutorAvatarId, displayName, addXp } = useUserStore()

  const [state, setState] = useState<State>('setup')
  const [topic, setTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [side, setSide] = useState<'for' | 'against'>('for')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [turnCount, setTurnCount] = useState(0)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  const debateTopic = customTopic.trim() || topic

  const systemPrompt = `You are ${tutorName}, a debate partner for ${displayName}, a 13-year-old student.
Topic: "${debateTopic}"
The student is arguing ${side === 'for' ? 'FOR' : 'AGAINST'} this topic. You argue the OPPOSITE side (${side === 'for' ? 'AGAINST' : 'FOR'}).

Rules:
- Make clear, logical arguments appropriate for a 13-year-old
- Acknowledge good points the student makes
- Challenge weak arguments politely
- Use evidence and examples
- Keep responses to 2-3 short paragraphs max
- After 4-5 exchanges, start wrapping up. On the 6th exchange or after, include [DEBATE_END] at the very end of your message and provide a brief summary of both sides and who made the stronger arguments.
- Be encouraging about their debating skills throughout
- This is exchange number ${turnCount + 1}`

  const sendMessage = useCallback((text: string, allMessages: Message[]) => {
    if (!apiKey) return
    setStreaming(true)
    setStreamContent('')

    const apiMsgs = allMessages.map((m) => ({ role: m.role, content: m.content }))

    streamMessage(
      apiKey,
      systemPrompt,
      apiMsgs,
      (chunk) => setStreamContent((prev) => prev + chunk),
      (fullText) => {
        const hasEnd = fullText.includes('[DEBATE_END]')
        const clean = fullText.replace(/\[DEBATE_END\]/g, '').trim()
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: clean }])
        setStreaming(false)
        setStreamContent('')
        setTurnCount((t) => t + 1)
        if (hasEnd) {
          setState('summary')
          addXp(25)
        }
      },
      () => {
        setStreaming(false)
        setStreamContent('')
      }
    )
  }, [apiKey, systemPrompt, addXp])

  const handleStart = () => {
    if (!debateTopic || !apiKey) return
    setState('debating')
    setMessages([])
    setTurnCount(0)
    // AI opens
    sendMessage('', [])
  }

  const handleSend = () => {
    if (!input.trim() || streaming) return
    const text = input.trim()
    setInput('')
    const newMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const updated = [...messages, newMsg]
    setMessages(updated)
    sendMessage(text, updated)
  }

  if (state === 'setup') {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-5">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-base font-semibold text-text-primary dark:text-dark-text-primary mb-1">AI Debate Partner</h1>
        <p className="text-[12px] text-text-muted mb-5">Practice arguing your point — {tutorName} takes the other side.</p>

        <div className="space-y-4 mb-5">
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Pick a topic</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TOPICS.map((t) => (
                <button key={t} onClick={() => { setTopic(t); setCustomTopic('') }}
                  className={`px-2.5 py-1.5 text-[11px] rounded-[var(--radius-md)] border transition-all text-left ${topic === t && !customTopic ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-secondary dark:text-dark-text-secondary'}`}>
                  {t}
                </button>
              ))}
            </div>
            <input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="Or type your own topic..."
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors" />
          </div>

          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wide block mb-1.5">Your side</label>
            <div className="flex gap-2">
              {(['for', 'against'] as const).map((s) => (
                <button key={s} onClick={() => setSide(s)}
                  className={`flex-1 px-3 py-2 text-[12px] rounded-[var(--radius-md)] border transition-all capitalize ${side === s ? 'bg-text-primary text-white border-text-primary' : 'border-border dark:border-white/15 text-text-secondary dark:text-dark-text-secondary'}`}>
                  {s === 'for' ? 'For (agree)' : 'Against (disagree)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleStart} disabled={!debateTopic || !apiKey} size="lg" className="w-full">
          Start Debate
        </Button>
        {!apiKey && <p className="text-[11px] text-text-muted mt-3">Add your API key in Settings first.</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-dark-bg">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-dark-border bg-white dark:bg-dark-surface shrink-0">
        <button onClick={() => setState('setup')} className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary truncate">{debateTopic}</h2>
          <p className="text-[10px] text-text-muted">You: {side} · {tutorName}: {side === 'for' ? 'against' : 'for'}</p>
        </div>
        {state === 'summary' && (
          <Button variant="secondary" size="sm" onClick={() => setState('setup')}>
            <RotateCcw size={10} /> New
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[600px] mx-auto space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <Avatar avatarId={tutorAvatarId} size="sm" />}
              <div className={`max-w-[80%] px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'border border-border dark:border-dark-border rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] text-text-primary dark:text-dark-text-primary'
                  : 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)]'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {streaming && streamContent && (
            <div className="flex gap-2.5">
              <Avatar avatarId={tutorAvatarId} size="sm" />
              <div className="max-w-[80%] px-3 py-2 text-sm border border-border dark:border-dark-border rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] text-text-primary dark:text-dark-text-primary whitespace-pre-wrap">
                {streamContent.replace(/\[DEBATE_END\]/g, '')}
                <span className="inline-block w-0.5 h-4 bg-text-primary dark:bg-dark-text-primary ml-0.5 animate-pulse" />
              </div>
            </div>
          )}

          {streaming && !streamContent && (
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

          <div ref={chatEndRef} />
        </div>
      </div>

      {state === 'debating' && (
        <div className="px-4 py-3 border-t border-border dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
          <div className="max-w-[600px] mx-auto flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={streaming ? `${tutorName} is thinking...` : 'Make your argument...'}
              disabled={streaming}
              className="flex-1 px-3 py-2 rounded-[var(--radius-md)] border border-border dark:border-dark-border bg-white dark:bg-dark-surface text-text-primary dark:text-dark-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-text-primary transition-colors disabled:opacity-50"
            />
            <button onClick={handleSend} disabled={streaming || !input.trim()}
              className="px-3 py-2 bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg rounded-[var(--radius-md)] hover:opacity-80 transition-opacity disabled:opacity-30">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
