import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AnalyticsEvent {
  event: string
  timestamp: string
  metadata?: Record<string, any>
}

interface AnalyticsState {
  events: AnalyticsEvent[]
  track: (event: string, metadata?: Record<string, any>) => void
  getEventsToday: () => AnalyticsEvent[]
  getEventsThisWeek: () => AnalyticsEvent[]
  getEventsByType: (event: string) => AnalyticsEvent[]
  exportEvents: () => string
  clearEvents: () => void
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      events: [],

      track: (event, metadata) => {
        const entry: AnalyticsEvent = {
          event,
          timestamp: new Date().toISOString(),
          metadata,
        }
        set((s) => ({ events: [...s.events.slice(-999), entry] })) // Keep last 1000
      },

      getEventsToday: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().events.filter((e) => e.timestamp.startsWith(today))
      },

      getEventsThisWeek: () => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return get().events.filter((e) => new Date(e.timestamp) >= weekAgo)
      },

      getEventsByType: (event) => {
        return get().events.filter((e) => e.event === event)
      },

      exportEvents: () => {
        return JSON.stringify(get().events, null, 2)
      },

      clearEvents: () => set({ events: [] }),
    }),
    { name: 'orbit-analytics' }
  )
)
