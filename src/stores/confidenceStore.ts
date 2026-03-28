import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ConfidenceEntry {
  id: string
  sessionId: string
  topicName: string
  subjectName: string
  before: number // 1-5
  after: number | null // 1-5, null if session incomplete
  actualScore: number | null // grade result score
  date: string
}

interface ConfidenceState {
  entries: ConfidenceEntry[]
  addEntry: (entry: Omit<ConfidenceEntry, 'id'>) => void
  updateAfter: (sessionId: string, after: number, actualScore?: number) => void
  getRecent: (count?: number) => ConfidenceEntry[]
  getAverageAccuracy: () => number // how close confidence matches reality
}

export const useConfidenceStore = create<ConfidenceState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) =>
        set((s) => ({
          entries: [...s.entries, { ...entry, id: crypto.randomUUID() }],
        })),
      updateAfter: (sessionId, after, actualScore) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.sessionId === sessionId ? { ...e, after, actualScore: actualScore ?? e.actualScore } : e
          ),
        })),
      getRecent: (count = 10) => {
        return get().entries.slice(-count)
      },
      getAverageAccuracy: () => {
        const completed = get().entries.filter((e) => e.after !== null && e.actualScore !== null)
        if (completed.length === 0) return 0
        // Compare confidence (1-5 → 0-100) vs actual score
        const diffs = completed.map((e) => {
          const confPct = ((e.before + (e.after || 0)) / 2 / 5) * 100
          return Math.abs(confPct - (e.actualScore || 0))
        })
        return Math.round(100 - diffs.reduce((a, b) => a + b, 0) / diffs.length)
      },
    }),
    { name: 'orbit-confidence' }
  )
)
