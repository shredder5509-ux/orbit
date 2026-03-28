import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StuckMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface StuckQuestion {
  id: string
  number: string
  text: string
  subject: string
  topic: string
  difficulty: number
  estimatedMinutes: number
  status: 'not_started' | 'in_progress' | 'completed' | 'bookmarked'
  messages: StuckMessage[]
  completedAt: string | null
}

export interface StuckSession {
  id: string
  uploadContent: string
  uploadType: 'photo' | 'pdf' | 'text'
  title: string
  subject: string
  questions: StuckQuestion[]
  startedAt: string
  completedAt: string | null
  totalTimeMinutes: number
  xpEarned: number
}

interface StuckState {
  currentSession: StuckSession | null
  currentQuestionIndex: number
  sessions: StuckSession[]
  isProcessing: boolean
  isStreaming: boolean
  streamingContent: string

  startSession: (content: string, uploadType: 'photo' | 'pdf' | 'text') => void
  setQuestions: (questions: Omit<StuckQuestion, 'id' | 'status' | 'messages' | 'completedAt'>[]) => void
  setSessionMeta: (title: string, subject: string) => void
  selectQuestion: (index: number) => void
  addMessage: (questionId: string, role: 'user' | 'assistant', content: string) => void
  updateQuestionStatus: (questionId: string, status: StuckQuestion['status']) => void
  completeQuestion: (questionId: string) => void
  bookmarkQuestion: (questionId: string) => void
  completeSession: (xpEarned: number) => void
  setProcessing: (v: boolean) => void
  setStreaming: (v: boolean) => void
  setStreamingContent: (v: string) => void
  appendStreamingContent: (chunk: string) => void
  resetCurrent: () => void
  getCompletedCount: () => number
  getTotalQuestions: () => number
  getEstimatedTimeRemaining: () => number
}

export const useStuckStore = create<StuckState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      currentQuestionIndex: 0,
      sessions: [],
      isProcessing: false,
      isStreaming: false,
      streamingContent: '',

      startSession: (content, uploadType) => {
        set({
          currentSession: {
            id: crypto.randomUUID(),
            uploadContent: content,
            uploadType,
            title: '',
            subject: '',
            questions: [],
            startedAt: new Date().toISOString(),
            completedAt: null,
            totalTimeMinutes: 0,
            xpEarned: 0,
          },
          currentQuestionIndex: 0,
          isProcessing: true,
        })
      },

      setQuestions: (questions) => {
        set((s) => {
          if (!s.currentSession) return s
          return {
            currentSession: {
              ...s.currentSession,
              questions: questions.map((q) => ({
                ...q,
                id: crypto.randomUUID(),
                status: 'not_started' as const,
                messages: [],
                completedAt: null,
              })),
            },
            isProcessing: false,
          }
        })
      },

      setSessionMeta: (title, subject) => {
        set((s) => {
          if (!s.currentSession) return s
          return { currentSession: { ...s.currentSession, title, subject } }
        })
      },

      selectQuestion: (index) => {
        set((s) => {
          if (!s.currentSession) return s
          const q = s.currentSession.questions[index]
          if (!q) return s
          const questions = [...s.currentSession.questions]
          if (q.status === 'not_started') {
            questions[index] = { ...q, status: 'in_progress' }
          }
          return {
            currentQuestionIndex: index,
            currentSession: { ...s.currentSession, questions },
          }
        })
      },

      addMessage: (questionId, role, content) => {
        set((s) => {
          if (!s.currentSession) return s
          return {
            currentSession: {
              ...s.currentSession,
              questions: s.currentSession.questions.map((q) =>
                q.id === questionId
                  ? { ...q, messages: [...q.messages, { id: crypto.randomUUID(), role, content, timestamp: new Date().toISOString() }] }
                  : q
              ),
            },
          }
        })
      },

      updateQuestionStatus: (questionId, status) => {
        set((s) => {
          if (!s.currentSession) return s
          return {
            currentSession: {
              ...s.currentSession,
              questions: s.currentSession.questions.map((q) =>
                q.id === questionId ? { ...q, status } : q
              ),
            },
          }
        })
      },

      completeQuestion: (questionId) => {
        set((s) => {
          if (!s.currentSession) return s
          return {
            currentSession: {
              ...s.currentSession,
              questions: s.currentSession.questions.map((q) =>
                q.id === questionId ? { ...q, status: 'completed', completedAt: new Date().toISOString() } : q
              ),
            },
          }
        })
      },

      bookmarkQuestion: (questionId) => {
        set((s) => {
          if (!s.currentSession) return s
          return {
            currentSession: {
              ...s.currentSession,
              questions: s.currentSession.questions.map((q) =>
                q.id === questionId ? { ...q, status: 'bookmarked' } : q
              ),
            },
          }
        })
      },

      completeSession: (xpEarned) => {
        set((s) => {
          if (!s.currentSession) return s
          const completed = {
            ...s.currentSession,
            completedAt: new Date().toISOString(),
            totalTimeMinutes: Math.round((Date.now() - new Date(s.currentSession.startedAt).getTime()) / 60000),
            xpEarned,
          }
          return {
            currentSession: null,
            sessions: [completed, ...s.sessions].slice(0, 50),
          }
        })
      },

      setProcessing: (v) => set({ isProcessing: v }),
      setStreaming: (v) => set({ isStreaming: v }),
      setStreamingContent: (v) => set({ streamingContent: v }),
      appendStreamingContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),

      resetCurrent: () => set({ currentSession: null, currentQuestionIndex: 0, isProcessing: false, isStreaming: false, streamingContent: '' }),

      getCompletedCount: () => {
        const s = get().currentSession
        return s ? s.questions.filter((q) => q.status === 'completed').length : 0
      },

      getTotalQuestions: () => {
        const s = get().currentSession
        return s ? s.questions.length : 0
      },

      getEstimatedTimeRemaining: () => {
        const s = get().currentSession
        if (!s) return 0
        return s.questions
          .filter((q) => q.status !== 'completed')
          .reduce((sum, q) => sum + q.estimatedMinutes, 0)
      },
    }),
    {
      name: 'orbit-stuck',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSession: state.currentSession,
        currentQuestionIndex: state.currentQuestionIndex,
      }),
    }
  )
)
