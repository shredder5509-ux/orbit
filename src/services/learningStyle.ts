import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic'

interface StyleSignal {
  style: LearningStyle
  weight: number
  date: string
}

interface LearningStyleState {
  signals: StyleSignal[]
  preferredStyle: LearningStyle | null
  addSignal: (style: LearningStyle, weight?: number) => void
  getStyleBreakdown: () => Record<LearningStyle, number>
  getRecommendation: () => string
}

export const useLearningStyleStore = create<LearningStyleState>()(
  persist(
    (set, get) => ({
      signals: [],
      preferredStyle: null,
      addSignal: (style, weight = 1) => {
        const signal: StyleSignal = { style, weight, date: new Date().toISOString() }
        const updated = [...get().signals.slice(-100), signal]

        // Calculate dominant style
        const counts: Record<LearningStyle, number> = { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 }
        updated.forEach((s) => { counts[s.style] += s.weight })
        const dominant = (Object.entries(counts) as [LearningStyle, number][])
          .sort((a, b) => b[1] - a[1])[0][0]

        set({ signals: updated, preferredStyle: dominant })
      },
      getStyleBreakdown: () => {
        const counts: Record<LearningStyle, number> = { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 }
        const total = get().signals.reduce((sum, s) => { counts[s.style] += s.weight; return sum + s.weight }, 0)
        if (total === 0) return counts
        return {
          visual: Math.round((counts.visual / total) * 100),
          auditory: Math.round((counts.auditory / total) * 100),
          reading: Math.round((counts.reading / total) * 100),
          kinesthetic: Math.round((counts.kinesthetic / total) * 100),
        }
      },
      getRecommendation: () => {
        const style = get().preferredStyle
        if (!style) return 'Keep using different features so we can learn how you study best!'
        const tips: Record<LearningStyle, string> = {
          visual: 'You learn best with diagrams and images. Try using flashcards with pictures and the mind map view.',
          auditory: 'You learn best by listening. Use the voice features and try explaining topics out loud.',
          reading: 'You learn best by reading and writing. Take detailed notes and use the essay marker for practice.',
          kinesthetic: 'You learn best by doing. Focus on practice worksheets and hands-on problem solving.',
        }
        return tips[style]
      },
    }),
    { name: 'orbit-learning-style' }
  )
)

// Auto-detect signals based on feature usage
export function trackFeatureUsage(feature: string) {
  const store = useLearningStyleStore.getState()
  const featureMap: Record<string, { style: LearningStyle; weight: number }> = {
    'flashcards': { style: 'visual', weight: 1 },
    'voice_input': { style: 'auditory', weight: 2 },
    'voice_listen': { style: 'auditory', weight: 2 },
    'notes': { style: 'reading', weight: 1 },
    'essay': { style: 'reading', weight: 2 },
    'worksheet': { style: 'kinesthetic', weight: 1 },
    'math_solver': { style: 'kinesthetic', weight: 1 },
    'practice_exam': { style: 'kinesthetic', weight: 2 },
    'scan_notes': { style: 'visual', weight: 1 },
    'reading_comp': { style: 'reading', weight: 2 },
    'debate': { style: 'auditory', weight: 1 },
    'focus_mode': { style: 'kinesthetic', weight: 1 },
  }

  const mapping = featureMap[feature]
  if (mapping) {
    store.addSignal(mapping.style, mapping.weight)
  }
}
