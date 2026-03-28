import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ErrorRecord {
  id: string
  subject: string
  topic: string
  errorType: string // e.g. "calculation", "concept", "reading", "method"
  description: string
  date: string
}

interface ErrorPatternState {
  errors: ErrorRecord[]
  addError: (error: Omit<ErrorRecord, 'id'>) => void
  getPatterns: () => { type: string; count: number; subjects: string[] }[]
  getWeakAreas: () => { subject: string; topic: string; errorCount: number }[]
}

export const useErrorPatternStore = create<ErrorPatternState>()(
  persist(
    (set, get) => ({
      errors: [],
      addError: (error) =>
        set((s) => ({
          errors: [...s.errors.slice(-200), { ...error, id: crypto.randomUUID() }], // keep last 200
        })),
      getPatterns: () => {
        const errors = get().errors
        const typeMap = new Map<string, { count: number; subjects: Set<string> }>()
        errors.forEach((e) => {
          const existing = typeMap.get(e.errorType) || { count: 0, subjects: new Set<string>() }
          existing.count++
          existing.subjects.add(e.subject)
          typeMap.set(e.errorType, existing)
        })
        return Array.from(typeMap.entries())
          .map(([type, data]) => ({ type, count: data.count, subjects: Array.from(data.subjects) }))
          .sort((a, b) => b.count - a.count)
      },
      getWeakAreas: () => {
        const errors = get().errors
        const areaMap = new Map<string, number>()
        errors.forEach((e) => {
          const key = `${e.subject}|||${e.topic}`
          areaMap.set(key, (areaMap.get(key) || 0) + 1)
        })
        return Array.from(areaMap.entries())
          .map(([key, count]) => {
            const [subject, topic] = key.split('|||')
            return { subject, topic, errorCount: count }
          })
          .sort((a, b) => b.errorCount - a.errorCount)
          .slice(0, 10)
      },
    }),
    { name: 'orbit-error-patterns' }
  )
)
