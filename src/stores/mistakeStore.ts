import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MistakeEntry {
  id: string
  subject: string
  topic: string
  question: string
  studentAnswer: string
  correctAnswer: string
  source: 'session' | 'checkpoint' | 'stuck' | 'flashcard' | 'exam' | 'speed' | 'battle' | 'review'
  date: string
  reviewed: boolean
  reviewedAt?: string
}

interface MistakeState {
  mistakes: MistakeEntry[]
  addMistake: (m: Omit<MistakeEntry, 'id' | 'date' | 'reviewed'>) => void
  markReviewed: (id: string) => void
  removeMistake: (id: string) => void
  getBySubject: (subject: string) => MistakeEntry[]
  getByTopic: (topic: string) => MistakeEntry[]
  getUnreviewed: () => MistakeEntry[]
  getRecentMistakes: (count: number) => MistakeEntry[]
}

export const useMistakeStore = create<MistakeState>()(
  persist(
    (set, get) => ({
      mistakes: [],

      addMistake: (m) => {
        set((s) => ({
          mistakes: [
            { ...m, id: crypto.randomUUID(), date: new Date().toISOString(), reviewed: false },
            ...s.mistakes,
          ].slice(0, 500),
        }))
      },

      markReviewed: (id) => {
        set((s) => ({
          mistakes: s.mistakes.map((m) =>
            m.id === id ? { ...m, reviewed: true, reviewedAt: new Date().toISOString() } : m
          ),
        }))
      },

      removeMistake: (id) => {
        set((s) => ({ mistakes: s.mistakes.filter((m) => m.id !== id) }))
      },

      getBySubject: (subject) => get().mistakes.filter((m) => m.subject === subject),
      getByTopic: (topic) => get().mistakes.filter((m) => m.topic === topic),
      getUnreviewed: () => get().mistakes.filter((m) => !m.reviewed),
      getRecentMistakes: (count) => get().mistakes.slice(0, count),
    }),
    { name: 'orbit-mistakes' }
  )
)
