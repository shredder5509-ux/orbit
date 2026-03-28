import { create } from 'zustand'

export type SessionMode = 'homework' | 'test' | 'project'

export type SessionPhase =
  // Homework phases
  | 'hook' | 'discover' | 'consolidate' | 'check' | 'bridge'
  // Test phases
  | 'overview' | 'flashcards' | 'practice'
  // Project phases
  | 'brief' | 'planning' | 'guidance'
  // Shared end phases
  | 'submission' | 'grading' | 'complete'

export const MODE_PHASES: Record<SessionMode, SessionPhase[]> = {
  homework: ['hook', 'discover', 'consolidate', 'check', 'bridge'],
  test: ['overview', 'flashcards', 'practice'],
  project: ['brief', 'planning', 'guidance'],
}

export const MODE_LABELS: Record<SessionMode, string[]> = {
  homework: ['Hook', 'Discover', 'Consolidate', 'Check', 'Bridge'],
  test: ['Overview', 'Flashcards', 'Practice'],
  project: ['Brief', 'Planning', 'Guidance'],
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface GradeResult {
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

interface SessionState {
  uploadId: string | null
  sessionMode: SessionMode
  phase: SessionPhase
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
  gradeResult: GradeResult | null
  submission: string
  error: string | null

  startSession: (uploadId: string, mode?: SessionMode) => void
  setPhase: (phase: SessionPhase) => void
  addMessage: (role: 'user' | 'assistant', content: string) => void
  setStreaming: (streaming: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  setSubmission: (text: string) => void
  setGradeResult: (result: GradeResult) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  uploadId: null as string | null,
  sessionMode: 'homework' as SessionMode,
  phase: 'hook' as SessionPhase,
  messages: [] as ChatMessage[],
  isStreaming: false,
  streamingContent: '',
  gradeResult: null as GradeResult | null,
  submission: '',
  error: null as string | null,
}

export const useSessionStore = create<SessionState>()((set) => ({
  ...initialState,

  startSession: (uploadId, mode = 'homework') =>
    set({
      ...initialState,
      uploadId,
      sessionMode: mode,
      phase: MODE_PHASES[mode][0],
    }),

  setPhase: (phase) => set({ phase }),

  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role,
          content,
          timestamp: Date.now(),
        },
      ],
    })),

  setStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingContent: (streamingContent) => set({ streamingContent }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),

  setSubmission: (submission) => set({ submission }),
  setGradeResult: (gradeResult) => set({ gradeResult }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))

export function getNextPhase(current: SessionPhase, mode: SessionMode): SessionPhase {
  const phases = MODE_PHASES[mode]
  const idx = phases.indexOf(current)
  if (idx >= 0 && idx < phases.length - 1) {
    return phases[idx + 1]
  }
  // Last teaching phase → submission
  if (idx === phases.length - 1) return 'submission'
  return current
}

export function getPhaseIndex(phase: SessionPhase, mode: SessionMode): number {
  const idx = MODE_PHASES[mode].indexOf(phase)
  return idx >= 0 ? idx : MODE_PHASES[mode].length
}
